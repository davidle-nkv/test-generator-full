import React, { useEffect, useState, useMemo } from "react";
import Select from "react-select";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FiSearch, FiCopy, FiTrash2, FiMove, FiFileText, FiPlus, FiSend } from "react-icons/fi";

let PARAM_ID_COUNTER = 1000;
function nextParamId() {
    PARAM_ID_COUNTER += 1;
    return `p_auto_${PARAM_ID_COUNTER}`;
}

function reorder(list, startIndex, endIndex) {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
}

export default function JiraDescriptionAndParameterBuilderExternalData() {
    const [availableSteps, setAvailableSteps] = useState([]); // [{ id, text }]
    const [availableParams, setAvailableParams] = useState([]); // [{ name, defaultValue }]
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [jiraTicket, setJiraTicket] = useState("");
    const [updating, setUpdating] = useState(false);
    const [updateMsg, setUpdateMsg] = useState(null);

    /* Get list of steps and list of parameters */
    useEffect(() => {
        // load both CSVs in parallel
        async function loadCSVs() {
            try {
                setLoading(true);
                const [stepsResp, paramsResp] = await Promise.all([
                    fetch("/api/files/step-mappings.csv"),
                    fetch("/api/files/test-data-fields.csv")
                ]);

                if (!stepsResp.ok) throw new Error("Failed to fetch step-mappings.csv");
                if (!paramsResp.ok) throw new Error("Failed to fetch test-data-fields.csv");

                const stepsText = await stepsResp.text();
                const paramsText = await paramsResp.text();

                // parse steps: one per line, ignore empty lines and trim
                const steps = stepsText
                    .split(/\r?\n/)
                    .map((t) => t.trim())
                    .filter((t) => t.length > 0)
                    .map((t, idx) => ({ id: `s_csv_${idx + 1}`, text: t }));

                // parse test-data-fields.csv using PapaParse for safety
                const params = paramsText
                    .split(/\r?\n/)
                    .map((t) => t.trim())
                    .filter((t) => t.length > 0)
                    .map((t, idx) => ({ id: t, text: t, value: 'default' }));

                setAvailableSteps(steps);
                setAvailableParams(params);
                setError(null);
            } catch (err) {
                console.error(err);
                setError(err.message || String(err));
            } finally {
                setLoading(false);
            }
        }

        loadCSVs();
    }, []);

    const stepOptions = availableSteps.map((s) => ({ value: s.id, label: s.text }));

    const addStep = (id) => {
        const tmpl = availableSteps.find((s) => s.id === id);
        if (!tmpl) return;
        if (selected.some((x) => x.id === id)) {
            // optionally allow duplicates: if you want duplicate steps, you could clone with new id
            return;
        }

        setSelected((prev) => [
            ...prev,
            {
                id: tmpl.id,
                text: tmpl.text,
                parameters: [],
                expanded: true
            }
        ]);
    };

    const removeStep = (index) => setSelected((prev) => prev.filter((_, i) => i !== index));

    const onDragEnd = (result) => {
        if (!result.destination) return;
        setSelected((prev) => reorder(prev, result.source.index, result.destination.index));
    };

    const toggleExpand = (index) => {
        setSelected((prev) => prev.map((s, i) => (i === index ? { ...s, expanded: !s.expanded } : s)));
    };

    // ===================== Add parameter from template =====================
    const addParameterFromTemplate = (stepIndex, tmpl) => {
        // No duplicate
        if (selected[stepIndex].parameters.some((p) => p.id === tmpl.id)) {
            // optionally allow duplicates: if you want duplicate steps, you could clone with new id
            return;
        }
        const newParam = {
            id: tmpl.text,
            text: tmpl.text,
            defaultValue: tmpl.value
        };

        setSelected(prev =>
            prev.map((s, i) =>
                (i === stepIndex) ? { ...s, parameters: [...s.parameters, newParam], expanded: true } : s
            )
        );
    };

    const updateParameter = (stepIndex, paramId, changes) => {
        setSelected((prev) =>
            prev.map((s, i) =>
                i === stepIndex
                    ? { ...s, parameters: s.parameters.map((p) => (p.id === paramId ? { ...p, ...changes } : p)) }
                    : s
            )
        );
    };

    const deleteParameter = (stepIndex, paramId) => {
        setSelected((prev) => prev.map((s, i) => (i === stepIndex ? { ...s, parameters: s.parameters.filter((p) => p.id !== paramId) } : s)));
    };

    const description = useMemo(() => selected.map((s, i) => `${i + 1}. ${s.text}`).join("\n"), [selected]);

    const jsonOutput = useMemo(() => {
        const arr = selected.map((s) => {
            const paramObj = {};
            (s.parameters || []).forEach((p) => {
                let val = p.defaultValue;
                if (p.type === "number") {
                    const n = Number(p.defaultValue);
                    val = Number.isNaN(n) ? p.defaultValue : n;
                } else if (p.type === "boolean") {
                    if (typeof p.defaultValue === "string") val = p.defaultValue === "true";
                    else val = !!p.defaultValue;
                }
                paramObj[p.text || p.id] = val;
            });

            return { stepText: s.text, parameters: paramObj };
        });
        return JSON.stringify(arr, null, 2);
    }, [selected]);

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error("Copy failed", err);
        }
    };

    const handleJiraUpdate = async () => {
        if (!jiraTicket.trim()) {
            setUpdateMsg("Please enter a Jira ticket number.");
            return;
        }
        try {
            setUpdating(true);
            setUpdateMsg("Updating Jira...");
            const resp = await fetch("/api/jira/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ticket: jiraTicket.trim(),
                    description,
                    json: jsonOutput
                })
            });
            if (!resp.ok) throw new Error(`Jira update failed: ${resp.status}`);
            const data = await resp.json();
            setUpdateMsg(`Jira updated successfully: ${data.status || "OK"}`);
        } catch (err) {
            console.error(err);
            setUpdateMsg(`Jira update failed: ${err.message}`);
        } finally {
            setUpdating(false);
        }
    };

    const customStyles = {
        control: (base, state) => ({
            ...base,
            borderRadius: 8,
            borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
            boxShadow: state.isFocused ? "0 0 0 3px rgba(59,130,246,0.08)" : "none",
            padding: "2px",
            minHeight: 44
        }),
        option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? "#eff6ff" : "white", color: "#111827", padding: 10 }),
        menu: (base) => ({ ...base, borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,0.08)" }),
        placeholder: (base) => ({ ...base, color: "#9ca3af" })
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Jira Description Builder (CSV-backed)</h1>
                <p className="text-sm text-gray-500 mt-1">Steps are loaded from <code>/step-mapping.csv</code>. Parameter templates are loaded from <code>/parameters.csv</code>. Add parameters from templates or create custom ones.</p>
            </header>

            {/* Jira ticket input */}
            <div className="mb-6 flex items-center gap-3">
                <input
                    type="text"
                    value={jiraTicket}
                    onChange={(e) => setJiraTicket(e.target.value)}
                    placeholder="Enter Jira Ticket Number (e.g. QA-123)"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-100"
                />
                <button
                    onClick={handleJiraUpdate}
                    disabled={updating}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition disabled:opacity-50"
                >
                    <FiSend className="w-4 h-4" />{" "}
                    {updating ? "Updating..." : "Update Jira"}
                </button>
            </div>
            {updateMsg && <div className="text-sm text-gray-600 mb-4">{updateMsg}</div>}

            {loading && <div className="text-sm text-gray-500">Loading steps and parameters...</div>}
            {error && <div className="text-sm text-red-600">Error: {error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                {/* LEFT Pane */}
                <div className="col-span-1 bg-white border rounded-lg shadow-sm p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600"><FiSearch className="w-5 h-5" /></div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-800">Search & add steps</h2>
                            <p className="text-xs text-gray-500">Type to filter the available steps.</p>
                        </div>
                    </div>

                    <div>
                        <Select options={ stepOptions }
                                styles={ customStyles }
                                placeholder="Type to search..."
                                isSearchable
                                onChange={ (opt) => opt && addStep(opt.value) }
                                className="text-sm"
                                components={{
                                    DropdownIndicator: (props) => (
                                        <div style={{ padding: "0 8px" }}>
                                        <FiSearch className="text-gray-400" /></div>
                                    )
                                }}
                        />
                        <div className="mt-3 text-xs text-gray-500"><strong>{selected.length}</strong> selected</div>
                    </div>
                </div>
                {/* RIGHT Pane */}
                <div className="lg:col-span-2 bg-white border rounded-lg shadow-sm p-4">
                    {/* Header - Select Steps */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-100 text-gray-700"><FiFileText className="w-5 h-5" /></div>
                            <div>
                                <h3>Selected Steps</h3>
                                <p className="text-xs text-gray-500">Drag to reorder or remove a step.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => setSelected([])}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border text-sm rounded-md hover:bg-gray-50 transition"
                                    title="Clear all"><FiTrash2 className="w-4 h-4 text-red-600"
                            />
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Selected Steps */}
                    <div className="border rounded-md p-3 bg-gray-50 min-h-[160px] max-h-[800px] overflow-y-auto">
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="selectedSteps">
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                                        {selected.length === 0 && <div className="text-sm text-gray-500 p-3">No steps added — use the list on the left to add steps.</div>}

                                        {selected.map((step, index) => (
                                            <Draggable key={`${step.id}-${index}`} draggableId={`${step.id}-${index}`} index={index}>
                                                {(prov, snapshot) => (
                                                    <div ref={prov.innerRef} {...prov.draggableProps}
                                                         className={`p-4 rounded-xl border transition-all duration-150 ${
                                                             snapshot.isDragging ? "bg-white shadow-xl border-blue-300" : "bg-white border-gray-300"
                                                         }`}
                                                    >
                                                        {/* Steps Header */}
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-start gap-3">
                                                                <div {...prov.dragHandleProps} className="p-2 rounded-md bg-gray-100 text-gray-600 cursor-grab"><FiMove className="w-4 h-4" /></div>

                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="text-sm font-semibold text-gray-800">{step.text}</div>
                                                                        <div className="text-xs text-gray-400">Step {index + 1}</div>
                                                                    </div>

                                                                    <div className="flex items-center gap-2 mt-2">
                                                                        <button onClick={() => toggleExpand(index)}
                                                                                className="text-xs px-3 py-1 rounded-md border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 transition"
                                                                        >
                                                                            {step.expanded ? "Hide Parameters" : "Configure Parameters"}
                                                                        </button>

                                                                        <button onClick={() => removeStep(index)} className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition">Remove</button>

                                                                        {!step.expanded && <div className="text-xs text-gray-500 hidden md:block">{step.parameters.length} parameter(s)</div>}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="text-xs text-gray-400"></div>
                                                        </div>

                                                        {/* Expanded parameters (table layout) */}
                                                        {step.expanded && (
                                                            <div className="mt-3 border-t pt-3">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="text-sm font-medium text-gray-700">Parameters</div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="text-xs text-gray-500 hidden md:block">{step.parameters.length} parameter(s)</div>
                                                                        <div className="w-80">
                                                                            <Select
                                                                                options={availableParams.map((p, idx) => ({ value: idx, label: p.text }))}
                                                                                isSearchable
                                                                                placeholder="Search parameter to add..."
                                                                                onChange={(opt) => {
                                                                                    if (!opt) return;
                                                                                    const tmpl = availableParams[opt.value];
                                                                                    addParameterFromTemplate(index, tmpl);
                                                                                }}
                                                                                menuPortalTarget={document.body}
                                                                                menuPosition="fixed"
                                                                                styles={customStyles}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Parameters table */}
                                                                <div className="mt-2 ">
                                                                    <div className="w-full overflow-x-auto">
                                                                        <div className="w-full bg-gray-100">
                                                                            {/* table header */}
                                                                            {step.parameters.length === 0
                                                                                ? (
                                                                                    <div className="grid grid-cols-12 gap-2 items-center px-3 py-2 text-xs text-gray-700 font-medium">
                                                                                        <div className="text-sm col-span-12 text-gray-500">No parameters yet.</div>
                                                                                    </div>
                                                                                )
                                                                                :  (
                                                                                    <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 border-b">
                                                                                        <div className="col-span-4">Parameter</div>
                                                                                        <div className="col-span-5">Value</div>
                                                                                        <div className="col-span-3 text-right">Actions</div>
                                                                                    </div>
                                                                                )
                                                                            }
                                                                            {/* Parameters table body */}
                                                                            {step.parameters.map((p, pi) => (
                                                                                <div key={p.id} className="grid grid-cols-12 gap-2 items-center px-3 py-2 border-t border-white">
                                                                                    <div className="col-span-4">
                                                                                        <div className="text-xs text-gray-500 truncate">{p.text}</div>
                                                                                    </div>

                                                                                    <div className="col-span-5">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={p.defaultValue}
                                                                                            placeholder="Enter value"
                                                                                            onChange={(e) => updateParameter(index, p.id, { defaultValue: e.target.value })}
                                                                                            className="w-full border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-100 rounded-md px-2 py-1 text-sm text-gray-800 placeholder-gray-400 transition-colors"
                                                                                        />
                                                                                    </div>

                                                                                    <div className="col-span-3 flex justify-end">
                                                                                        <button onClick={() => deleteParameter(index, p.id)} className="p-2 rounded-md hover:bg-red-50" title="Delete parameter">
                                                                                            <FiTrash2 className="w-4 h-4 text-red-600" />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}

                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>

                    {/* Generated Description */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <label>Generated Description</label>
                            <button onClick={() => copyToClipboard(description)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md shadow hover:bg-blue-700 transition" title="Copy description"><FiCopy className="w-4 h-4" /> Copy Description</button>
                        </div>
                        <textarea value={description} readOnly className="w-full p-3 rounded-md border resize-none h-40 bg-white text-sm text-gray-800 focus:ring-2 focus:ring-blue-200" />
                        <div className="mt-2 text-xs text-gray-500">Copy the description into Jira’s description field.</div>
                    </div>

                    {/* Parameters JSON */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <label>Parameters JSON (Automation)</label>
                            <div className="flex items-center gap-2">
                                <button onClick={() => copyToClipboard(jsonOutput)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"><FiCopy className="w-4 h-4" /> Copy JSON</button>
                            </div>
                        </div>
                        <textarea value={jsonOutput} readOnly className="w-full p-3 rounded-md border resize-none h-50 bg-white text-sm text-gray-800 focus:ring-2 focus:ring-blue-200 font-mono" />
                    </div>

                </div>
            </div>
        </div>
    );
}
