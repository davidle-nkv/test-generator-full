import React, { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FiSearch, FiCopy, FiTrash2, FiMove, FiFileText, FiPlus, FiEdit } from "react-icons/fi";


const STEPS_MAP = [
    {
        id: "s1",
        text: "Open application homepage",
        parameters: [
            { id: "p1", name: "url", type: "text", defaultValue: "https://app.example.com" },
            { id: "p2", name: "timeout", type: "number", defaultValue: 30 }
        ]
    },
    {
        id: "s2",
        text: "Login with valid credentials",
        parameters: [
            { id: "p1", name: "username", type: "text", defaultValue: "test_user" },
            { id: "p2", name: "password", type: "password", defaultValue: "valid_pass" },
            { id: "p3", name: "expectedResult", type: "text", defaultValue: "Success" }
        ]
    },
    {
        id: "s3",
        text: "Navigate to user settings",
        parameters: [
            { id: "p1", name: "section", type: "text", defaultValue: "Profile" }
        ]
    },
    {
        id: "s4",
        text: "Click save button",
        parameters: [
            { id: "p1", name: "locatorType", type: "text", defaultValue: "xpath" },
            { id: "p2", name: "locatorValue", type: "text", defaultValue: "//button[@id='save']" }
        ]
    },
    {
        id: "s5",
        text: "Verify success message",
        parameters: [
            { id: "p1", name: "messageText", type: "text", defaultValue: "Saved successfully" },
            { id: "p2", name: "timeout", type: "number", defaultValue: 10 }
        ]
    },
    {
        id: "s6",
        text: "Logout user",
        parameters: []
    },
    {
        id: "s11",
        text: "Open application homepage",
        parameters: [
            { id: "p1", name: "url", type: "text", defaultValue: "https://app.example.com" },
            { id: "p2", name: "timeout", type: "number", defaultValue: 30 }
        ]
    },
    {
        id: "s12",
        text: "Login with valid credentials",
        parameters: [
            { id: "p1", name: "username", type: "text", defaultValue: "test_user" },
            { id: "p2", name: "password", type: "password", defaultValue: "valid_pass" },
            { id: "p3", name: "expectedResult", type: "text", defaultValue: "Success" }
        ]
    },
    {
        id: "s13",
        text: "Navigate to user settings",
        parameters: [
            { id: "p1", name: "section", type: "text", defaultValue: "Profile" }
        ]
    },
    {
        id: "s14",
        text: "Click save button",
        parameters: [
            { id: "p1", name: "locatorType", type: "text", defaultValue: "xpath" },
            { id: "p2", name: "locatorValue", type: "text", defaultValue: "//button[@id='save']" }
        ]
    },
    {
        id: "s15",
        text: "Verify success message",
        parameters: [
            { id: "p1", name: "messageText", type: "text", defaultValue: "Saved successfully" },
            { id: "p2", name: "timeout", type: "number", defaultValue: 10 }
        ]
    },
    {
        id: "s16",
        text: "Logout user",
        parameters: []
    },
    {
        id: "s21",
        text: "Open application homepage",
        parameters: [
            { id: "p1", name: "url", type: "text", defaultValue: "https://app.example.com" },
            { id: "p2", name: "timeout", type: "number", defaultValue: 30 }
        ]
    },
    {
        id: "s22",
        text: "Login with valid credentials",
        parameters: [
            { id: "p1", name: "username", type: "text", defaultValue: "test_user" },
            { id: "p2", name: "password", type: "password", defaultValue: "valid_pass" },
            { id: "p3", name: "expectedResult", type: "text", defaultValue: "Success" }
        ]
    },
    {
        id: "s23",
        text: "Navigate to user settings",
        parameters: [
            { id: "p1", name: "section", type: "text", defaultValue: "Profile" }
        ]
    },
    {
        id: "s24",
        text: "Click save button",
        parameters: [
            { id: "p1", name: "locatorType", type: "text", defaultValue: "xpath" },
            { id: "p2", name: "locatorValue", type: "text", defaultValue: "//button[@id='save']" }
        ]
    },
    {
        id: "s25",
        text: "Verify success message",
        parameters: [
            { id: "p1", name: "messageText", type: "text", defaultValue: "Saved successfully" },
            { id: "p2", name: "timeout", type: "number", defaultValue: 10 }
        ]
    },
    {
        id: "s26",
        text: "Logout user",
        parameters: []
    }
];

/* Utility to reorder array for DnD */
function reorder(list, startIndex, endIndex) {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
}

/* Small helper to generate unique ids for new parameters */
let PARAM_ID_COUNTER = 1000;
function nextParamId() {
    PARAM_ID_COUNTER += 1;
    return `p_auto_${PARAM_ID_COUNTER}`;
}

/* Main component */
export default function JiraDescriptionAndParameterBuilder() {
    const [available] = useState(STEPS_MAP);

    /* Selected steps will copy step template and keep its own parameters + expanded UI state */
    const [selected, setSelected] = useState([]);

    /* UI: add step by id (clones default parameters) */
    const addStep = (id) => {
        const tmpl = available.find((s) => s.id === id);
        if (!tmpl) return;
        if (selected.some((x) => x.id === id)) {
            // optionally allow duplicates: if you want duplicate steps, you could clone with new id
            return;
        }
        // deep clone parameters and attach param ids
        const parameters = (tmpl.parameters || []).map((p) => ({
            id: p.id ?? nextParamId(),
            name: p.name ?? "",
            type: p.type ?? "text",
            defaultValue: p.defaultValue ?? ""
        }));

        setSelected((prev) => [
            ...prev,
            {
                id: tmpl.id,
                text: tmpl.text,
                parameters,
                expanded: true // open when added
            }
        ]);
    };

    /* Remove step at index */
    const removeStep = (index) => {
        setSelected((prev) => prev.filter((_, i) => i !== index));
    };

    /* DnD handler */
    const onDragEnd = (result) => {
        if (!result.destination) return;
        const items = reorder(selected, result.source.index, result.destination.index);
        setSelected(items);
    };

    /* Toggle expanded state for a step */
    const toggleExpand = (index) => {
        setSelected((prev) =>
            prev.map((s, i) => (i === index ? { ...s, expanded: !s.expanded } : s))
        );
    };

    /* Add a new empty parameter to a step */
    const addParameterToStep = (stepIndex) => {
        const newParam = {
            id: nextParamId(),
            name: "",
            type: "text",
            defaultValue: ""
        };
        setSelected((prev) =>
            prev.map((s, i) => (i === stepIndex ? { ...s, parameters: [...s.parameters, newParam], expanded: true } : s))
        );
    };

    /* Update a parameter in a step */
    const updateParameter = (stepIndex, paramId, changes) => {
        setSelected((prev) =>
            prev.map((s, i) =>
                i === stepIndex
                    ? {
                        ...s,
                        parameters: s.parameters.map((p) => (p.id === paramId ? { ...p, ...changes } : p))
                    }
                    : s
            )
        );
    };

    /* Delete a parameter in a step */
    const deleteParameter = (stepIndex, paramId) => {
        setSelected((prev) =>
            prev.map((s, i) =>
                i === stepIndex
                    ? {
                        ...s,
                        parameters: s.parameters.filter((p) => p.id !== paramId)
                    }
                    : s
            )
        );
    };

    /* Description (plain lines) for Jira */
    const description = useMemo(
        () => selected.map((s, i) => `${i + 1}. ${s.text}`).join("\n"),
        [selected]
    );

    /* JSON Parameters output */
    const jsonOutput = useMemo(() => {
        const arr = selected.map((s) => {
            // map parameters into { name: value } using defaultValue
            const paramObj = {};
            (s.parameters || []).forEach((p) => {
                // for boolean type, ensure we store boolean typed value
                let val = p.defaultValue;
                if (p.type === "number") {
                    const n = Number(p.defaultValue);
                    val = Number.isNaN(n) ? p.defaultValue : n;
                } else if (p.type === "boolean") {
                    // if p.defaultValue is "true"/"false" or boolean
                    if (typeof p.defaultValue === "string") {
                        val = p.defaultValue === "true";
                    } else {
                        val = !!p.defaultValue;
                    }
                }
                paramObj[p.name || p.id] = val;
            });

            return {
                stepId: s.id,
                stepText: s.text,
                parameters: paramObj
            };
        });
        return JSON.stringify(arr, null, 2);
    }, [selected]);

    /* Copy helpers */
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            // Optionally add toast / feedback - simple alert for now
            // alert("Copied to clipboard");
        } catch (err) {
            console.error("Copy failed", err);
        }
    };

    /* Find available options for select (simple local filter) */
    const stepOptions = available.map((s) => ({ id: s.id, label: s.text }));

    return (
        <div className="max-w-6xl mx-auto p-6">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Jira Description & Parameters Builder</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Search steps, add them, configure parameters inline, then copy the Jira description and a separate JSON payload for automation.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Selector */}
                <div className="col-span-1 bg-white border rounded-lg shadow-sm p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600">
                            <FiSearch className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-medium text-gray-800">Search & Add Steps</h2>
                            <p className="text-xs text-gray-500">Click to add a step (duplicates prevented).</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {stepOptions.map((opt) => (
                            <div key={opt.id} className="flex items-center justify-between gap-2">
                                <div className="text-sm text-gray-700 truncate">{opt.label}</div>
                                <button
                                    onClick={() => addStep(opt.id)}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md shadow hover:bg-blue-700 transition"
                                >
                                    Add
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 text-xs text-gray-500">
                        <strong>{selected.length}</strong> selected
                    </div>
                </div>

                {/* Selected Steps */}
                <div className="lg:col-span-2 bg-white border rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-100 text-gray-700">
                                <FiFileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-800">Selected Steps</h3>
                                <p className="text-xs text-gray-500">Drag to reorder. Expand to configure parameters inline.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => copyToClipboard(description)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border text-sm rounded-md hover:bg-gray-50 transition"
                                title="Copy description"
                            >
                                <FiCopy className="w-4 h-4 text-gray-600" /> Copy Description
                            </button>

                            <button
                                onClick={() => setSelected([])}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border text-sm rounded-md hover:bg-gray-50 transition"
                                title="Clear all"
                            >
                                <FiTrash2 className="w-4 h-4 text-red-600" /> Clear
                            </button>
                        </div>
                    </div>

                    <div className="border rounded-md p-3 bg-gray-50 min-h-[160px]">
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="selectedSteps">
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                                        {selected.length === 0 && (
                                            <div className="text-sm text-gray-500 p-3">No steps added — use the list on the left to add steps.</div>
                                        )}

                                        {selected.map((step, index) => (
                                            <Draggable key={`${step.id}-${index}`} draggableId={`${step.id}-${index}`} index={index}>
                                                {(prov, snapshot) => (
                                                    <div
                                                        ref={prov.innerRef}
                                                        {...prov.draggableProps}
                                                        className={`p-3 rounded-lg transition ${snapshot.isDragging ? "bg-white shadow-lg border-blue-200" : "bg-white border"}`}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-start gap-3">
                                                                <div {...prov.dragHandleProps} className="p-2 rounded-md bg-gray-100 text-gray-600 cursor-grab">
                                                                    <FiMove className="w-4 h-4" />
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="text-sm font-medium text-gray-800">{step.text}</div>
                                                                        <div className="text-xs text-gray-400">• Step {index + 1}</div>
                                                                    </div>

                                                                    <div className="mt-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                onClick={() => toggleExpand(index)}
                                                                                className="text-xs px-2 py-1 rounded-md bg-gray-100 border text-gray-700 hover:bg-gray-200 transition"
                                                                            >
                                                                                {step.expanded ? "Hide Parameters" : "Configure Parameters"}
                                                                            </button>

                                                                            <button
                                                                                onClick={() => removeStep(index)}
                                                                                className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition"
                                                                            >
                                                                                Remove
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="text-xs text-gray-400">{/* placeholder for actions */}</div>
                                                        </div>

                                                        {/* Collapsible parameters */}
                                                        {step.expanded && (
                                                            <div className="mt-3 border-t pt-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="text-sm font-medium text-gray-700">Parameters</div>
                                                                    <div className="text-xs text-gray-500">{step.parameters.length} parameter(s)</div>
                                                                </div>

                                                                <div className="mt-2 space-y-2">
                                                                    {step.parameters.length === 0 && (
                                                                        <div className="text-sm text-gray-500 p-2">No parameters. Add one to make the step data-driven.</div>
                                                                    )}

                                                                    {step.parameters.map((p) => (
                                                                        <div key={p.id} className="grid grid-cols-12 gap-2 items-center">
                                                                            <div className="col-span-4">
                                                                                <input
                                                                                    value={p.name}
                                                                                    placeholder="Parameter name"
                                                                                    onChange={(e) => updateParameter(index, p.id, { name: e.target.value })}
                                                                                />
                                                                            </div>

                                                                            <div className="col-span-2">
                                                                                <select
                                                                                    value={p.type}
                                                                                    onChange={(e) => updateParameter(index, p.id, { type: e.target.value })}
                                                                                    className="w-full rounded-md border px-2 py-2 text-sm"
                                                                                >
                                                                                    <option value="text">text</option>
                                                                                    <option value="number">number</option>
                                                                                    <option value="password">password</option>
                                                                                    <option value="boolean">boolean</option>
                                                                                    <option value="date">date</option>
                                                                                </select>
                                                                            </div>

                                                                            <div className="col-span-4">
                                                                                {/* default value input type depends on selected type */}
                                                                                {p.type === "boolean" ? (
                                                                                    <div className="flex items-center gap-2">
                                                                                        <switch
                                                                                            checked={!!(p.defaultValue === true || p.defaultValue === "true")}
                                                                                            onCheckedChange={(val) => updateParameter(index, p.id, { defaultValue: val })}
                                                                                        />
                                                                                        <div className="text-sm text-gray-600">{p.defaultValue ? "true" : "false"}</div>
                                                                                    </div>
                                                                                ) : p.type === "date" ? (
                                                                                    <input
                                                                                        type="date"
                                                                                        value={p.defaultValue}
                                                                                        onChange={(e) => updateParameter(index, p.id, { defaultValue: e.target.value })}
                                                                                    />
                                                                                ) : (
                                                                                    <input
                                                                                        type={p.type === "password" ? "password" : p.type === "number" ? "number" : "text"}
                                                                                        value={p.defaultValue}
                                                                                        placeholder="Default value"
                                                                                        onChange={(e) => updateParameter(index, p.id, { defaultValue: e.target.value })}
                                                                                    />
                                                                                )}
                                                                            </div>

                                                                            <div className="col-span-2 flex items-center gap-2 justify-end">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        /* quick inline edit could be implemented; we have inline inputs already */
                                                                                    }}
                                                                                    className="p-2 rounded-md hover:bg-gray-100"
                                                                                    title="Edit"
                                                                                >
                                                                                    <FiEdit className="w-4 h-4 text-gray-600" />
                                                                                </button>

                                                                                <button
                                                                                    onClick={() => deleteParameter(index, p.id)}
                                                                                    className="p-2 rounded-md hover:bg-red-50"
                                                                                    title="Delete parameter"
                                                                                >
                                                                                    <FiTrash2 className="w-4 h-4 text-red-600" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}

                                                                    <div>
                                                                        <button
                                                                            onClick={() => addParameterToStep(index)}
                                                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border text-sm rounded-md hover:bg-gray-50 transition"
                                                                        >
                                                                            <FiPlus className="w-4 h-4 text-gray-600" /> Add Parameter
                                                                        </button>
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

                    {/* FINAL: outputs - description + JSON */}
                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label>Generated Description (Jira)</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => copyToClipboard(description)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
                                    >
                                        <FiCopy className="w-4 h-4" /> Copy
                                    </button>
                                </div>
                            </div>
                            <textarea value={description} readOnly className="h-36" />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label>Parameters JSON (Automation)</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => copyToClipboard(jsonOutput)}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition"
                                    >
                                        <FiCopy className="w-4 h-4" /> Copy JSON
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={jsonOutput}
                                readOnly
                                className="w-full p-3 rounded-md border resize-none h-36 bg-white text-sm text-gray-800 focus:ring-2 focus:ring-blue-200 font-mono"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 text-xs text-gray-500">
                Tip: use the left panel to add steps. Configure parameter names & default values inline — the JSON will update automatically.
            </div>
        </div>
    );
}
