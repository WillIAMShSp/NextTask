import React, { useState, useEffect, useCallback } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { supabase } from "./utils/supabase-js";

import TaskColumn from "./components/TaskColumn";
import TaskModal from "./components/TaskModal";

// Initialize Supabase

const COLUMNS = ["todo", "in_progress", "in_review", "done"];

export default function KanbanBoard({ userId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simplified Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) console.error("Error fetching tasks:", error);
    else setTasks(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const openAddModal = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async ({ id, title, status }) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    if (id) {
      // EDIT EXISTING
      setTasks(
        tasks.map((t) =>
          t.id === id ? { ...t, title: trimmedTitle, status } : t,
        ),
      );
      const { error } = await supabase
        .from("tasks")
        .update({ title: trimmedTitle, status })
        .eq("id", id);
      if (error) fetchTasks();
    } else {
      // ADD NEW
      const { data, error } = await supabase
        .from("tasks")
        .insert([{ title: trimmedTitle, status, user_id: userId }])
        .select();
      if (data && data.length > 0) setTasks((prev) => [...prev, data[0]]);
      if (error) console.error(error);
    }
    setIsModalOpen(false);
  };

  const handleDeleteTask = async (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) fetchTasks();
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    )
      return;

    const newStatus = destination.droppableId;
    setTasks(
      tasks.map((task) =>
        task.id === draggableId ? { ...task, status: newStatus } : task,
      ),
    );

    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", draggableId);
    if (error) fetchTasks();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          {/* The Spinning Circle */}
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>

          {/* The Pulsing Text */}
          <p className="text-gray-500 font-medium animate-pulse">
            Loading your board...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>My Board</h2>
        <button
          onClick={openAddModal}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0052cc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          + Add Task
        </button>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <DragDropContext onDragEnd={handleDragEnd}>
          {COLUMNS.map((columnId) => (
            <TaskColumn
              key={columnId}
              columnId={columnId}
              tasks={tasks.filter((task) => task.status === columnId)}
              onEdit={openEditModal}
              onDelete={handleDeleteTask}
            />
          ))}
        </DragDropContext>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        columns={COLUMNS}
      />
    </div>
  );
}
