import React, { useState, useMemo } from "react";
import Select from "react-select";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FiSearch, FiCopy, FiTrash2, FiMove, FiFileText } from "react-icons/fi";

/* Example steps (replace with your dynamic source later) */
const STEPS_MAP = [
    { id: "s1", text: "Open application homepage, Open application homepage, Open application homepage, Open application homepage" },
    { id: "s2", text: "Login with valid credentials, Login with valid credentials, Login with valid credentials, Login with valid credentials, Login with valid credentials" },
    { id: "s3", text: "Navigate to user settings" },
    { id: "s4", text: "Click save button" },
    { id: "s5", text: "Verify success message" },
    { id: "s6", text: "Logout user" },
    { id: "s11", text: "Open application homepage, Open application homepage, Open application homepage, Open application homepage" },
    { id: "s12", text: "Login with valid credentials, Login with valid credentials, Login with valid credentials, Login with valid credentials, Login with valid credentials" },
    { id: "s13", text: "Navigate to user settings" },
    { id: "s14", text: "Click save button" },
    { id: "s15", text: "Verify success message" },
    { id: "s16", text: "Logout user" },
    { id: "s21", text: "Open application homepage, Open application homepage, Open application homepage, Open application homepage" },
    { id: "s22", text: "Login with valid credentials, Login with valid credentials, Login with valid credentials, Login with valid credentials, Login with valid credentials" },
    { id: "s23", text: "Navigate to user settings" },
    { id: "s24", text: "Click save button" },
    { id: "s25", text: "Verify success message" },
    { id: "s26", text: "Logout user" }
];

function reorder(list, startIndex, endIndex) {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
}

export default function JiraDescriptionBuilderUI() {
    const [available] = useState(STEPS_MAP);
    const [selected, setSelected] = useState([]);

    // react-select options
    const stepOptions = available.map((s) => ({ value: s.id, label: s.text }));

    // Add a step by id (prevent duplicates)
    const addStep = (id) => {
        const step = available.find((s) => s.id === id);
        if (!step) return;
        if (selected.some((x) => x.id === id)) return;
        setSelected((prev) => [...prev, step]);
    };

    const removeStep = (index) => {
        setSelected((prev) => prev.filter((_, i) => i !== index));
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const items = reorder(selected, result.source.index, result.destination.index);
        setSelected(items);
    };

    const description = useMemo(
        () => selected.map((s, i) => `${i + 1}. ${s.text}`).join("\n"),
        [selected]
    );

    // react-select styling (light, Tailwind-like)
    const customStyles = {
        control: (base, state) => ({
            ...base,
            borderRadius: 8,
            borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
            boxShadow: state.isFocused ? "0 0 0 3px rgba(59,130,246,0.08)" : "none",
            padding: "2px",
            minHeight: 44
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? "#eff6ff" : "white",
            color: "#111827",
            padding: 10
        }),
        menu: (base) => ({
            ...base,
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(15,23,42,0.08)"
        }),
        placeholder: (base) => ({ ...base, color: "#9ca3af" })
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Jira Description Builder</h1>
                <p className="text-sm text-gray-500 mt-1">Search steps, reorder them and paste into Jira.</p>
            </header>

            {/* GRID: Selector | Selected */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Selector Card */}
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

                    <div>
                        <Select
                            options={stepOptions}
                            styles={customStyles}
                            placeholder="Type to search..."
                            isSearchable
                            onChange={(opt) => opt && addStep(opt.value)}
                            className="text-sm"
                            components={{
                                DropdownIndicator: (props) => (
                                    <div style={{ padding: "0 8px" }}><FiSearch className="text-gray-400" /></div>
                                )
                            }}
                        />

                        <div className="mt-3 text-xs text-gray-500">
                            <strong>{selected.length}</strong> selected
                        </div>
                    </div>
                </div>

                {/* Selected Steps Card (large) */}
                <div className="lg:col-span-2 bg-white border rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-100 text-gray-700">
                                <FiFileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-800">Selected Steps</h3>
                                <p className="text-xs text-gray-500">Drag to reorder or remove a step.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { navigator.clipboard.writeText(description); }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md shadow hover:bg-blue-700 transition"
                                title="Copy description"
                            >
                                <FiCopy className="w-4 h-4" /> Copy
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
                                            <div className="text-sm text-gray-500 p-3">No steps added — use the search to add steps.</div>
                                        )}

                                        {selected.map((step, index) => (
                                            <Draggable key={step.id} draggableId={step.id} index={index}>
                                                {(prov, snapshot) => (
                                                    <div
                                                        ref={prov.innerRef}
                                                        {...prov.draggableProps}
                                                        className={`flex items-center justify-between gap-3 p-3 rounded-lg transition ${
                                                            snapshot.isDragging ? "bg-white shadow-lg border-blue-200" : "bg-white border"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                {...prov.dragHandleProps}
                                                                className="p-2 rounded-md bg-gray-100 text-gray-600 cursor-grab"
                                                                title="Drag to reorder"
                                                            >
                                                                <FiMove className="w-4 h-4" />
                                                            </div>

                                                            <div>
                                                                <div className="text-sm font-medium text-gray-800">{step.text}</div>
                                                                <div className="text-xs text-gray-500">Step {index + 1}</div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => removeStep(index)}
                                                                className="text-sm px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition"
                                                                title="Remove step"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Generated Description</label>
                        <textarea
                            value={description}
                            readOnly
                            className="w-full p-3 rounded-md border resize-none h-40 bg-white text-sm text-gray-800 focus:ring-2 focus:ring-blue-200"
                        />
                        <div className="mt-2 text-xs text-gray-500">Copy the description into Jira’s description field.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
