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
          style={{
            userSelect: "none",
            padding: "16px",
            margin: "0 0 8px 0",
            backgroundColor: snapshot.isDragging ? "#e6f7ff" : "#ffffff",
            color: "#333",
            borderRadius: "4px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            cursor: "grab",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            ...provided.draggableProps.style,
          }}
        >
          <span style={{ wordBreak: "break-word", flex: 1 }}>{task.title}</span>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => onEdit(task)}
              style={{
                background: "transparent",
                border: "none",
                color: "#666",
                fontSize: "14px",
                cursor: "pointer",
                padding: "0",
              }}
              title="Edit Task"
            >
              ✎
            </button>
            <button
              onClick={() => onDelete(task.id)}
              style={{
                background: "transparent",
                border: "none",
                color: "#999",
                fontSize: "18px",
                cursor: "pointer",
                padding: "0",
              }}
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
