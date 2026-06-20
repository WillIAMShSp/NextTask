import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import Task from "./Task";

export default function TaskColumn({ columnId, tasks, onEdit, onDelete }) {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#f4f5f7",
        padding: "15px",
        borderRadius: "8px",
        minWidth: "250px",
      }}
    >
      <h3
        style={{
          textTransform: "capitalize",
          marginBottom: "15px",
          marginTop: "0",
          color: "#333",
        }}
      >
        {columnId.replace("_", " ")}
      </h3>

      <Droppable droppableId={columnId}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{ minHeight: "400px" }}
          >
            {tasks.map((task, index) => (
              <Task
                key={task.id}
                task={task}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
