import React, { useState, useEffect } from "react";

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  columns,
}) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("todo");

  // Whenever the modal opens or the taskToEdit changes, update the input fields
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setStatus(taskToEdit.status);
    } else {
      setTitle("");
      setStatus("todo");
    }
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ id: taskToEdit?.id, title, status });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "8px",
          width: "400px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          {taskToEdit ? "Edit Task" : "Create a new task"}
        </h3>

        <input
          type="text"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            margin: "15px 0",
            boxSizing: "border-box",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "20px",
            boxSizing: "border-box",
            borderRadius: "4px",
            border: "1px solid #ccc",
            textTransform: "capitalize",
          }}
        >
          {columns.map((col) => (
            <option key={col} value={col}>
              {col.replace("_", " ")}
            </option>
          ))}
        </select>

        <div
          style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              cursor: "pointer",
              border: "none",
              backgroundColor: "transparent",
              color: "#555",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "8px 16px",
              cursor: "pointer",
              backgroundColor: "#0052cc",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            {taskToEdit ? "Update Task" : "Save Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
