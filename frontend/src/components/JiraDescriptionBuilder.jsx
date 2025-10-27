// import React, { useState, useMemo } from 'react';
// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
// import Select from 'react-select';
// // import "tailwindcss";
//
// // Example readable->method map
// const STEPS_MAP = [
//     { id: 's1', text: 'Open application homepage' },
//     { id: 's2', text: 'Login with valid credentials' },
//     { id: 's3', text: 'Navigate to user settings' },
//     { id: 's4', text: 'Click save button' },
//     { id: 's5', text: 'Verify success message' }
// ];
//
// function reorder(list, startIndex, endIndex) {
//     const result = Array.from(list);
//     const [removed] = result.splice(startIndex, 1);
//     result.splice(endIndex, 0, removed);
//     return result;
// }
//
// export default function JiraDescriptionBuilder() {
//     const [available] = useState(STEPS_MAP);
//     const [selected, setSelected] = useState([]);
//
//     // Transform data for react-select
//     const stepOptions = available.map(step => ({
//         value: step.id,
//         label: step.text,
//     }));
//
//     const customStyles = {
//         control: (base) => ({
//             ...base,
//             borderRadius: '0.5rem',
//             padding: '2px',
//             borderColor: '#d1d5db',
//             boxShadow: 'none',
//             '&:hover': { borderColor: '#3b82f6' }
//         }),
//         option: (base, state) => ({
//             ...base,
//             backgroundColor: state.isFocused ? '#e0f2fe' : 'white',
//             color: '#111827',
//             cursor: 'pointer',
//             padding: '8px 12px',
//         }),
//         menu: (base) => ({
//             ...base,
//             borderRadius: '0.5rem',
//             marginTop: '4px',
//             boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
//         })
//     };
//
//     const addStep = (id) => {
//         const step = available.find((s) => s.id === id);
//         if (!step || selected.find((s) => s.id === id)) return;
//         setSelected((prev) => [...prev, step]);
//     };
//
//     const removeStep = (index) => {
//         setSelected((prev) => prev.filter((_, i) => i !== index));
//     };
//
//     const onDragEnd = (result) => {
//         if (!result.destination) return;
//         const items = reorder(selected, result.source.index, result.destination.index);
//         setSelected(items);
//     };
//
//     const description = useMemo(
//         () => selected.map((s, i) => `${i + 1}. ${s.text}`).join('\n'),
//         [selected]
//     );
//
//     return (
//         <div className="p-6 max-w-3xl mx-auto font-sans">
//             <h1 className="text-2xl font-bold mb-4">Jira Description Builder</h1>
//
//             {/* React Select Searchable Dropdown */}
//             <div className="mb-4">
//                 <label className="block mb-2 font-medium">Search & Add Steps</label>
//                 <Select
//                     options={stepOptions}
//                     placeholder="Type to search..."
//                     styles={customStyles}
//                     onChange={(option) => addStep(option.value)}
//                     isClearable
//                 />
//                 <p className="text-sm text-gray-600 mt-1">Search to add; duplicates are prevented.</p>
//             </div>
//
//             {/* Selected List with Drag Support */}
//             <div className="mb-4">
//                 <label className="block mb-2 font-medium">Selected Steps (drag to reorder)</label>
//                 <div className="border rounded p-2 bg-white min-h-[120px]">
//                     <DragDropContext onDragEnd={onDragEnd}>
//                         <Droppable droppableId="selectedSteps">
//                             {(provided) => (
//                                 <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
//                                     {selected.length === 0 && (
//                                         <div className="text-sm text-gray-500 p-2">No steps added</div>
//                                     )}
//                                     {selected.map((step, index) => (
//                                         <Draggable key={step.id} draggableId={step.id} index={index}>
//                                             {(provided, snapshot) => (
//                                                 <div
//                                                     ref={provided.innerRef}
//                                                     {...provided.draggableProps}
//                                                     {...provided.dragHandleProps}
//                                                     className={`flex items-center justify-between p-2 border rounded bg-white ${
//                                                         snapshot.isDragging ? 'shadow-md' : ''
//                                                     }`} >
//                                                     <div className="flex-1">
//                                                         <div className="text-sm font-medium">{step.text}</div>
//                                                         <div className="text-xs text-gray-500">Step {index + 1}</div>
//                                                     </div>
//                                                     <button
//                                                         className="text-sm text-red-600 hover:underline"
//                                                         onClick={() => removeStep(index)} >
//                                                         Remove
//                                                     </button>
//                                                 </div>
//                                             )}
//                                         </Draggable>
//                                     ))}
//                                     {provided.placeholder}
//                                 </div>
//                             )}
//                         </Droppable>
//                     </DragDropContext>
//                 </div>
//             </div>
//
//             {/* Description Output */}
//             <div className="mb-4">
//                 <h2 className="font-semibold mb-2">Generated Description</h2>
//                 <textarea
//                     className="border p-2 w-full h-40"
//                     readOnly
//                     value={description}
//                 />
//             </div>
//
//             {/* Actions */}
//             <div className="flex gap-2">
//                 <button
//                     className="bg-blue-600 text-white px-4 py-2 rounded"
//                     onClick={() => navigator.clipboard.writeText(description)} >
//                     Copy to Clipboard
//                 </button>
//                 <button
//                     className="bg-gray-100 px-4 py-2 rounded border"
//                     onClick={() => setSelected([])} >
//                     Clear
//                 </button>
//                 {/*<button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow">*/}
//                 {/*    Copy to Clipboard*/}
//                 {/*</button>*/}
//
//                 {/*<button className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">*/}
//                 {/*    Clear*/}
//                 {/*</button>*/}
//             </div>
//         </div>
//     );
// }




import React, { useState, useMemo, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Select from 'react-select';

// Example readable->method map. In real usage you may fetch this from a backend
const STEPS_MAP = [
    { id: 's1', text: 'Open application homepage , Open application homepage, Open application homepage' },
    { id: 's2', text: 'Login with valid credentials, Login with valid credentials, Login with valid credentials, Login with valid credentials' },
    { id: 's3', text: 'Navigate to user settings' },
    { id: 's4', text: 'Click save button' },
    { id: 's5', text: 'Verify success message' }
];

function reorder(list, startIndex, endIndex) {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
}

export default function JiraDescriptionBuilder() {
    const [available] = useState(STEPS_MAP);
    const [selected, setSelected] = useState([]);

    const addStep = (id) => {
        const step = available.find((s) => s.id === id);
        if (!step) return;
        // allow duplicates? Here we prevent duplicates
        if (selected.find((s) => s.id === id)) return;
        setSelected((prev) => [...prev, step]);
    };

    const removeStep = (index) => {
        setSelected((prev) => prev.filter((_, i) => i !== index));
    };

    const onDragEnd = (result) => {
        // dropped outside the list
        if (!result.destination) return;
        const items = reorder(
            selected,
            result.source.index,
            result.destination.index
        );
        setSelected(items);
    };

    const description = useMemo(
        () => selected.map((s, i) => `${i + 1}. ${s.text}`).join('\n'),
        [selected]
    );

    const stepOptions = available.map(step => ({
        value: step.id,
        label: step.text
    }));

    const customStyles = {
        control: (base, state) => ({
            ...base,
            backgroundColor: 'white',
            borderColor: state.isFocused ? '#3b82f6' : '#d1d5db', // Tailwind colors (blue-500 / gray-300)
            boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
            padding: '2px',
            '&:hover': {
                borderColor: '#3b82f6'
            }
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? '#e0f2fe' : 'white', // blue-100
            color: '#111827', // gray-900
            cursor: 'pointer',
            padding: '8px 12px'
        }),
        menu: (base) => ({
            ...base,
            borderRadius: '0.5rem',
            marginTop: '4px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }),
        placeholder: (base) => ({
            ...base,
            color: '#9ca3af' // gray-400
        }),
        singleValue: (base) => ({
            ...base,
            color: '#111827' // gray-900
        })
    };

    return (
        <div className="p-6 max-w-3xl mx-auto font-sans">
            <h1 className="text-2xl font-bold mb-4">Jira Description Builder</h1>

            <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                    <label className="block mb-2 font-medium">Available Steps</label>
                    {/*<select*/}
                    {/*    className="border p-2 w-full"*/}
                    {/*    onChange={(e) => {*/}
                    {/*        addStep(e.target.value);*/}
                    {/*        e.target.value = '';*/}
                    {/*    }}*/}
                    {/*    defaultValue="" >*/}
                    {/*    <option value="" disabled>*/}
                    {/*        -- Select a step to add --*/}
                    {/*    </option>*/}
                    {/*    {available.map((opt) => (*/}
                    {/*        <option key={opt.id} value={opt.id}>*/}
                    {/*            {opt.text}*/}
                    {/*        </option>*/}
                    {/*    ))}*/}
                    {/*</select>*/}

                    {/*<Select*/}
                    {/*    options={stepOptions}*/}
                    {/*    onChange={(selectedOption) => {*/}
                    {/*        if (selectedOption) {*/}
                    {/*            addStep(selectedOption.value);*/}
                    {/*        }*/}
                    {/*    }}*/}
                    {/*    placeholder="Search or select a step..."*/}
                    {/*    isSearchable={true}*/}
                    {/*/>*/}

                    <Select
                        options={ stepOptions }
                        onChange={(selectedOption) => {
                            if (selectedOption) {
                                addStep(selectedOption.value);
                            }
                        }}
                        placeholder="Search or select a step..."
                        isSearchable={ true }
                        styles={ customStyles }
                        className="w-full text-sm" />

                    <p className="text-sm text-gray-600 mt-2">Select to add; duplicates are prevented.</p>
                </div>

                <div>
                    <label className="block mb-2 font-medium">Selected Steps (drag to reorder)</label>

                    <div className="border rounded p-2 bg-white min-h-[120px]">
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="selectedSteps">
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="space-y-2"
                                    >
                                        {selected.length === 0 && (
                                            <div className="text-sm text-gray-500 p-2">No steps added</div>
                                        )}

                                        {selected.map((step, index) => (
                                            <Draggable key={step.id} draggableId={step.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`flex items-center justify-between p-2 border rounded bg-white ${
                                                            snapshot.isDragging ? 'shadow-md' : ''
                                                        }`}
                                                    >
                                                        <div className="flex-1 pr-2">
                                                            <div className="text-sm font-medium">{step.text}</div>
                                                            <div className="text-xs text-gray-500">Step {index + 1}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                className="text-sm text-red-600 hover:underline"
                                                                onClick={() => removeStep(index)}
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
                </div>
            </div>

            <div className="mb-4">
                <h2 className="font-semibold mb-2">Generated Description</h2>
                <textarea
                    className="border p-2 w-full h-40"
                    readOnly
                    value={description}
                />
            </div>

            <div className="flex gap-2">
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                    onClick={() => navigator.clipboard.writeText(description)}
                >
                    Copy to Clipboard
                </button>

                <button
                    className="bg-gray-100 px-4 py-2 rounded border"
                    onClick={() => setSelected([])}
                >
                    Clear
                </button>
            </div>

            <p className="mt-4 text-sm text-gray-600">Tip: drag steps to change order, then copy into Jira description.</p>
        </div>
    );
}
