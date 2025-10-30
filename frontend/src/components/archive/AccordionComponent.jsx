import React, { useState } from "react";
import { FiPlus, FiMinus, FiTrash2 } from "react-icons/fi";

function AccordionComponent({ step, index, addParameterToStep, deleteParameter, updateParameter, availableParameters }) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="mt-3 border rounded-lg overflow-hidden">
            {/* Accordion Header */}
            <div
                className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200 cursor-pointer select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="font-medium text-gray-700">
                  Parameters ({step.parameters.length})
                </span>
                {isOpen ? <FiMinus className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
            </div>

            {/* Accordion Content */}
            {isOpen && (
                <div className="p-4 space-y-4 bg-white">
                    {/* Empty State */}
                    {step.parameters.length === 0 && (
                        <div className="text-sm text-gray-500 p-2 border rounded">
                            No parameters added. Click the button to add one.
                        </div>
                    )}

                    {/* Parameter Rows */}
                    {step.parameters.map((p) => (
                        <div key={p.id} className="grid grid-cols-12 gap-3 items-center border-b pb-3">
                            {/* Parameter Dropdown */}
                            <div className="col-span-4">
                                <select
                                    value={p.name}
                                    onChange={(e) => {
                                        const selected = availableParameters.find(ap => ap.name === e.target.value);
                                        updateParameter(index, p.id, { name: e.target.value, type: selected?.type || "text" });
                                    }}
                                    className="w-full border rounded-md px-2 py-2 text-sm focus:ring focus:ring-blue-300"
                                >
                                    <option value="">Select parameter...</option>
                                    {availableParameters.map(param => (
                                        <option key={param.name} value={param.name}>{param.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Default Value Field */}
                            <div className="col-span-6">
                                {p.type === "boolean" ? (
                                    <select
                                        value={p.defaultValue ? "true" : "false"}
                                        onChange={(e) => updateParameter(index, p.id, { defaultValue: e.target.value === "true" })}
                                        className="w-full border rounded-md px-2 py-2 text-sm focus:ring focus:ring-blue-300"
                                    >
                                        <option value="true">true</option>
                                        <option value="false">false</option>
                                    </select>
                                ) : p.type === "date" ? (
                                    <input
                                        type="date"
                                        value={p.defaultValue ?? ""}
                                        onChange={(e) => updateParameter(index, p.id, { defaultValue: e.target.value })}
                                        className="w-full border rounded-md px-2 py-2 text-sm focus:ring focus:ring-blue-300"
                                    />
                                ) : (
                                    <input
                                        type={p.type === "number" ? "number" : p.type === "password" ? "password" : "text"}
                                        value={p.defaultValue ?? ""}
                                        placeholder="Enter value"
                                        onChange={(e) => updateParameter(index, p.id, { defaultValue: e.target.value })}
                                        className="w-full border rounded-md px-2 py-2 text-sm focus:ring focus:ring-blue-300"
                                    />
                                )}
                            </div>

                            {/* Delete Button */}
                            <div className="col-span-2 flex justify-end">
                                <button
                                    onClick={() => deleteParameter(index, p.id)}
                                    className="p-2 rounded-md hover:bg-red-50 text-red-600"
                                    title="Delete parameter"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add Parameter Button */}
                    <div className="pt-2">
                        <button
                            onClick={() => addParameterToStep(index)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-md text-sm hover:bg-gray-50 transition active:scale-95"
                        >
                            <FiPlus className="w-4 h-4 text-gray-600" /> Add Parameter
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StepAccordion;
