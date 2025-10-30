// JiraDescriptionAndParameterBuilderUI.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Select from "react-select";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FiSearch, FiCopy, FiTrash2, FiMove, FiFileText, FiPlus } from "react-icons/fi";
import Papa from "papaparse";

/* utility for generating unique param ids */
let PARAM_ID_COUNTER = 1000;
function nextParamId() {
    PARAM_ID_COUNTER += 1;
    return `p_auto_${PARAM_ID_COUNTER}`;
}

/* reorder helper */
function reorder(list, startIndex, endIndex) {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
}

export default function JiraDescriptionAndParameterBuilderWithExternalData_V2() {
    const [availableSteps, setAvailableSteps] = useState([]); // { id, text }
    const [paramTemplates, setParamTemplates] = useState([]); // { name, type, defaultValue }
    const [selected, setSelected] = useState([]); // steps with parameters
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* Load CSVs */
    useEffect(() => {
        async function loadCSVs() {
            try {
                setLoading(true);
                const [stepsResp, paramsResp] = await Promise.all([
                    fetch("/public/step-mappings.csv"),
                    fetch("/public/test-data-fields.csv"),
                ]);

                if (!stepsResp.ok) throw new Error("Failed to fetch step-mapping.csv");
                if (!paramsResp.ok) throw new Error("Failed to fetch parameters.csv");

                const stepsText = await stepsResp.text();
                const paramsText = await paramsResp.text();

                // parse steps: one per line
                const steps = stepsText
                    .split(/\r?\n/)
                    .map((t) => t.trim())
                    .filter((t) => t.length > 0)
                    .map((t, idx) => ({ id: `s_csv_${idx + 1}`, text: t }));

                // parse parameters CSV using PapaParse (expects header: name,type,defaultValue)
                const templates = paramsText
                    .split(/\r?\n/)
                    .map((t) => t.trim())
                    .filter((t) => t.length > 0)
                    .map((t, idx) => ({ id: t, text: t, value: '' }));
                // const parsed = Papa.parse(paramsText, { header: true, skipEmptyLines: true });
                // const templates = parsed.data
                //     .map((row) => ({
                //         name: (row.name ?? row.Name ?? "").trim(),
                //         type: (row.type ?? row.Type ?? "text").trim(),
                //         defaultValue: (row.defaultValue ?? row.default ?? "").toString(),
                //     }))
                //     .filter((r) => r.name);

                setAvailableSteps(steps);
                setParamTemplates(templates);
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

    /* react-select styles with menuPortal zIndex */
    const customStyles = {
        control: (base, state) => ({
            ...base,
            borderRadius: 8,
            borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
            boxShadow: state.isFocused ? "0 0 0 3px rgba(59,130,246,0.08)" : "none",
            padding: "2px",
            minHeight: 44,
        }),
        option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? "#eff6ff" : "white", color: "#111827", padding: 10 }),
        menu: (base) => ({ ...base, borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,0.08)" }),
        placeholder: (base) => ({ ...base, color: "#9ca3af" }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    };

    /* Add a step (allow duplicates by creating unique instanceId) */
    const addStep = (id) => {
        const tmpl = availableSteps.find((s) => s.id === id);
        if (!tmpl) return;
        const instanceId = `${tmpl.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        setSelected((prev) => [
            ...prev,
            {
                instanceId,
                stepId: tmpl.id,
                text: tmpl.text,
                parameters: [],
                expanded: false,
            },
        ]);
    };

    const removeStep = (index) => setSelected((prev) => prev.filter((_, i) => i !== index));

    /* Add parameter to step (from template or custom) */
    const addParameterToStep = (stepIndex, template) => {
        const newParam = template
            ? { id: nextParamId(), text: template.text, defaultValue: template.defaultValue }
            : { id: nextParamId(), text: "", defaultValue: "" };

        setSelected((prev) => prev.map((s, i) => (i === stepIndex ? { ...s, parameters: [...s.parameters, newParam], expanded: true } : s)));
    };

    /* convenience wrapper used by select component */
    const addParameterFromTemplate = (stepIndex, tmpl) => addParameterToStep(stepIndex, tmpl);

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

    const toggleExpand = (index) => {
        setSelected((prev) => prev.map((s, i) => (i === index ? { ...s, expanded: !s.expanded } : s)));
    };

    /* Handle drag end: supports step reordering and parameter reordering (within same step) */
    const onDragEnd = useCallback(
        (result) => {
            const { source, destination, type, draggableId } = result;
            if (!destination) return;

            // Step reorder (top-level)
            if (type === "STEP") {
                setSelected((prev) => reorder(prev, source.index, destination.index));
                return;
            }

            // Parameter reorder inside a step: droppableId format "params-${instanceId}"
            if (type === "PARAM") {
                const sourceStepInstance = source.droppableId.replace(/^params-/, "");
                const destStepInstance = destination.droppableId.replace(/^params-/, "");

                // Only allow reorder within the same step for simplicity (but you could support move between steps)
                if (sourceStepInstance === destStepInstance) {
                    setSelected((prev) =>
                        prev.map((step) => {
                            if (step.instanceId !== sourceStepInstance) return step;
                            const newParams = reorder(step.parameters, source.index, destination.index);
                            return { ...step, parameters: newParams };
                        })
                    );
                } else {
                    // Move param from one step to another (supported)
                    setSelected((prev) => {
                        const src = prev.find((p) => p.instanceId === sourceStepInstance);
                        const dst = prev.find((p) => p.instanceId === destStepInstance);
                        if (!src || !dst) return prev;

                        const srcParams = Array.from(src.parameters);
                        const [moved] = srcParams.splice(source.index, 1);

                        const dstParams = Array.from(dst.parameters);
                        dstParams.splice(destination.index, 0, moved);

                        return prev.map((step) => {
                            if (step.instanceId === sourceStepInstance) return { ...step, parameters: srcParams };
                            if (step.instanceId === destStepInstance) return { ...step, parameters: dstParams };
                            return step;
                        });
                    });
                }
                return;
            }
        },
        [setSelected]
    );

    /* Description + JSON outputs */
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

    /* step options for react-select */
    const stepOptions = availableSteps.map((s) => ({ value: s.id, label: s.text }));

    return (
        <div className="max-w-6xl mx-auto p-6">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Jira Description Builder (CSV-backed)</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Steps are loaded from <code>/step-mapping.csv</code>. Parameter templates are loaded from <code>/parameters.csv</code>. Add and reorder parameters inline.
                </p>
            </header>

            {loading && <div className="text-sm text-gray-500">Loading steps and parameters...</div>}
            {error && <div className="text-sm text-red-600">Error: {error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                {/* Selector column */}
                <div className="col-span-1 bg-white border rounded-lg shadow-sm p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
                            <FiSearch className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-800">Search & add steps</h2>
                            <p className="text-xs text-gray-500">Type to filter the available steps.</p>
                        </div>
                    </div>

                    <Select
                        options={stepOptions}
                        styles={customStyles}
                        placeholder="Type to search..."
                        isSearchable
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        onChange={(opt) => opt && addStep(opt.value)}
                        className="text-sm"
                        components={{
                            DropdownIndicator: (props) => (
                                <div style={{ padding: "0 8px" }}>
                                    <FiSearch className="text-gray-400" />
                                </div>
                            ),
                        }}
                    />

                    <div className="mt-3 text-xs text-gray-500">
                        <strong>{selected.length}</strong> selected
                    </div>

                    <div className="mt-4">
                        <div className="text-sm font-medium">Parameter templates</div>
                        <div className="text-xs text-gray-500">Click the Add control inside a step to add these.</div>

                        <div className="mt-2 max-h-[200px] overflow-y-auto border rounded-md p-2 bg-gray-50">
                            {paramTemplates.length === 0 && <div className="text-xs text-gray-500">No templates loaded.</div>}
                            {paramTemplates.map((t, i) => (
                                <div key={`${t.text}-${i}`} className="flex items-center justify-between py-1 text-sm">
                                    <div>
                                        <div className="font-medium">{t.text}</div>
                                        <div className="text-xs text-gray-500">{t.type} {t.defaultValue ? `• default: ${t.defaultValue}` : ''}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Selected Steps + Parameters (big area) */}
                <div className="lg:col-span-2 bg-white border rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-100 text-gray-700">
                                <FiFileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h3>Selected Steps</h3>
                                <p className="text-xs text-gray-500">Drag to reorder steps. Expand a step to configure parameters.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button onClick={() => setSelected([])} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border text-sm rounded-md hover:bg-gray-50 transition" title="Clear all">
                                <FiTrash2 className="w-4 h-4 text-red-600" /> Clear
                            </button>
                        </div>
                    </div>

                    <div className="border rounded-md p-3 bg-gray-50 min-h-[160px] max-h-[800px] overflow-y-auto">
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="selectedSteps" type="STEP">
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                                        {selected.length === 0 && <div className="text-sm text-gray-500 p-3">No steps added — use the list on the left to add steps.</div>}

                                        {selected.map((step, index) => (
                                            <Draggable key={step.instanceId} draggableId={step.instanceId} index={index}>
                                                {(prov, snapshot) => (
                                                    <div
                                                        ref={prov.innerRef}
                                                        {...prov.draggableProps}
                                                        className={`p-3 rounded-lg transition ${snapshot.isDragging ? "bg-white shadow-lg border-blue-200" : "bg-white border"}`}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-start gap-3 min-w-0">
                                                                <div {...prov.dragHandleProps} className="p-2 rounded-md bg-gray-100 text-gray-600 cursor-grab">
                                                                    <FiMove className="w-4 h-4" />
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="text-sm font-medium text-gray-800 truncate">{step.text}</div>
                                                                        <div className="text-xs text-gray-400">• Step {index + 1}</div>
                                                                    </div>

                                                                    <div className="mt-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <button onClick={() => toggleExpand(index)} className="text-xs px-2 py-1 rounded-md bg-gray-100 border text-gray-700 hover:bg-gray-200 transition">
                                                                                {step.expanded ? "Hide Parameters" : "Configure Parameters"}
                                                                            </button>

                                                                            <button onClick={() => removeStep(index)} className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition">
                                                                                Remove
                                                                            </button>
                                                                        </div>
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

                                                                    {/* Add parameter select (inline, portal'd) */}
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="text-xs text-gray-500 hidden md:block">{step.parameters.length} parameter(s)</div>
                                                                        <div className="w-80">
                                                                            <Select
                                                                                options={paramTemplates.map((p, idx) => ({ value: idx, label: p.text }))}
                                                                                isSearchable
                                                                                placeholder="Search parameter to add..."
                                                                                onChange={(opt) => {
                                                                                    if (!opt) return;
                                                                                    const tmpl = paramTemplates[opt.value];
                                                                                    addParameterFromTemplate(index, tmpl);
                                                                                }}
                                                                                menuPortalTarget={document.body}
                                                                                menuPosition="fixed"
                                                                                styles={customStyles}
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            onClick={() => addParameterToStep(index, null)}
                                                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border text-sm rounded-md hover:bg-gray-50 transition"
                                                                            title="Add custom parameter"
                                                                        >
                                                                            <FiPlus className="w-4 h-4 text-gray-600" /> Add Custom
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Parameters table */}
                                                                <div className="mt-2 ml-4">
                                                                    {step.parameters.length === 0 && (
                                                                        <div className="text-sm bg-gray-50 text-gray-500">No parameters yet.</div>
                                                                    )}
                                                                    {step.parameters.length > 0 && (
                                                                        <div className="w-full overflow-x-auto">
                                                                            <div className="w-full  rounded-md bg-white">
                                                                                {/* table header */}
                                                                                <div className="grid grid-cols-12 gap-2 items-center px-3 py-2 bg-gray-50 text-xs text-gray-600 font-medium ">
                                                                                    <div className="col-span-1"> </div>
                                                                                    <div className="col-span-4">Parameter</div>
                                                                                    <div className="col-span-5">Value</div>
                                                                                    <div className="col-span-2 text-right">Actions</div>
                                                                                </div>

                                                                                {/* parameter rows - make this a droppable for parameters */}
                                                                                <Droppable droppableId={`params-${step.instanceId}`} type="PARAM">
                                                                                    {(paramProv) => (
                                                                                        <div ref={paramProv.innerRef} {...paramProv.droppableProps} className="">
                                                                                            {step.parameters.map((p, pi) => (
                                                                                                <Draggable key={p.id} draggableId={p.id} index={pi}>
                                                                                                    {(rowProv, rowSnapshot) => (
                                                                                                        <div
                                                                                                            ref={rowProv.innerRef}
                                                                                                            {...rowProv.draggableProps}
                                                                                                            className={`grid grid-cols-12 gap-2 items-center px-3 py-2 border-t border-gray-400 ${rowSnapshot.isDragging ? "bg-white" : ""}`}
                                                                                                        >
                                                                                                            <div className="col-span-1">
                                                                                                                <div {...rowProv.dragHandleProps} className="p-1 rounded-md bg-gray-100 inline-flex items-center justify-center">
                                                                                                                    <FiMove className="w-4 h-4 text-gray-600" />
                                                                                                                </div>
                                                                                                            </div>

                                                                                                            <div className="col-span-4">
                                                                                                                <div className="text-sm text-gray-700 truncate">{p.text}</div>
                                                                                                            </div>

                                                                                                            <div className="col-span-5">
                                                                                                                {p.type === "boolean" ? (
                                                                                                                    <label className="inline-flex items-center gap-2">
                                                                                                                        <input
                                                                                                                            type="checkbox"
                                                                                                                            checked={!!(p.defaultValue === true || p.defaultValue === "true")}
                                                                                                                            onChange={(e) => updateParameter(index, p.id, { defaultValue: e.target.checked })}
                                                                                                                        />
                                                                                                                    </label>
                                                                                                                ) : p.type === "date" ? (
                                                                                                                    <input
                                                                                                                        type="date"
                                                                                                                        value={p.defaultValue}
                                                                                                                        onChange={(e) => updateParameter(index, p.id, { defaultValue: e.target.value })}
                                                                                                                        className="w-full rounded-md border px-2 py-1 text-sm"
                                                                                                                    />
                                                                                                                ) : (
                                                                                                                    <input
                                                                                                                        type={p.type === "password" ? "password" : p.type === "number" ? "number" : "text"}
                                                                                                                        value={p.defaultValue}
                                                                                                                        placeholder="Enter value"
                                                                                                                        onChange={(e) => updateParameter(index, p.id, { defaultValue: e.target.value })}
                                                                                                                        className="w-full rounded-md border px-2 py-1 text-sm"
                                                                                                                    />
                                                                                                                )}
                                                                                                            </div>

                                                                                                            <div className="col-span-2 flex justify-end">
                                                                                                                <button onClick={() => deleteParameter(index, p.id)} className="p-2 rounded-md hover:bg-red-50" title="Delete parameter">
                                                                                                                    <FiTrash2 className="w-4 h-4 text-red-600" />
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </Draggable>
                                                                                            ))}

                                                                                            {paramProv.placeholder}
                                                                                        </div>
                                                                                    )}
                                                                                </Droppable>
                                                                            </div>
                                                                        </div>
                                                                    )}

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

                    {/* Outputs */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <label>Generated Description</label>
                            <button onClick={() => copyToClipboard(description)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md shadow hover:bg-blue-700 transition" title="Copy description">
                                <FiCopy className="w-4 h-4" /> Copy Description
                            </button>
                        </div>
                        <textarea value={description} readOnly className="w-full p-3 rounded-md border resize-none h-40 bg-white text-sm text-gray-800 focus:ring-2 focus:ring-blue-200" />
                        <div className="mt-2 text-xs text-gray-500">Copy the description into Jira’s description field.</div>
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <label>Parameters JSON (Automation)</label>
                            <div className="flex items-center gap-2">
                                <button onClick={() => copyToClipboard(jsonOutput)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition">
                                    <FiCopy className="w-4 h-4" /> Copy JSON
                                </button>
                            </div>
                        </div>
                        <textarea value={jsonOutput} readOnly className="w-full p-3 rounded-md border resize-none h-36 bg-white text-sm text-gray-800 focus:ring-2 focus:ring-blue-200 font-mono" />
                    </div>
                </div>
            </div>
        </div>
    );
}
