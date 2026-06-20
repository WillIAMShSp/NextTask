import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import Task from "./Task";

export default function TaskColumn({
  columnId,
  tasks,
  onEdit,
  onDelete,
  teamMembers,
}) {
  return (
    <div className="flex-1 bg-gray-100/80 p-4 rounded-xl min-w-[280px] border border-gray-200 flex flex-col">
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="capitalize font-semibold text-gray-700 text-sm tracking-wide">
          {columnId.replace("_", " ")}
        </h3>
        <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`flex-1 min-h-[400px] rounded-lg transition-colors duration-200 ${snapshot.isDraggingOver ? "bg-blue-50/50" : ""}`}
          >
            {tasks.map((task, index) => (
              <Task
                key={task.id}
                task={task}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
                teamMembers={teamMembers}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
