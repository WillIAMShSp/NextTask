import React from "react";
import { Draggable } from "@hello-pangea/dnd";

export default function Task({ task, index, onEdit, onDelete, teamMembers }) {
  const assignedMember = teamMembers?.find((m) => m.id === task.assignee_id);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            select-none p-4 mb-3 rounded-lg shadow-sm border border-gray-200 
            flex flex-col gap-3 transition-shadow duration-200 cursor-grab active:cursor-grabbing
            ${snapshot.isDragging ? "bg-blue-50 shadow-xl border-blue-200 z-50" : "bg-white hover:shadow-md"}
          `}
          style={{ ...provided.draggableProps.style }}
        >
          <div className="flex justify-between items-start gap-3">
            <span className="break-words flex-1 text-gray-800 text-sm font-medium">
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

          {/* NEW: Assignee Badge */}
          {assignedMember && (
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold"
                title={assignedMember.name}
              >
                {assignedMember.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-gray-500">
                {assignedMember.name}
              </span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
