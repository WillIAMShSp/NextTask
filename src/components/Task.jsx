import React from "react";
import { Draggable } from "@hello-pangea/dnd";

export default function Task({ task, index, onEdit, onDelete }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            select-none p-4 mb-2 rounded-md shadow-sm border border-gray-200 
            flex justify-between items-start gap-3 transition-shadow duration-200 cursor-grab active:cursor-grabbing
            ${snapshot.isDragging ? "bg-blue-50 shadow-lg" : "bg-white hover:shadow-md"}
          `}
          style={{
            ...provided.draggableProps.style, // Keep this! DND needs it to physically move the element
          }}
        >
          <span className="break-words flex-1 text-gray-800 text-sm">
            {task.title}
          </span>

          <div className="flex gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(task)}
              className="text-gray-500 hover:text-blue-600 transition-colors"
              title="Edit Task"
            >
              ✎
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
              title="Delete Task"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
}
