import React, { useState, useEffect, useCallback } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { supabase } from "./utils/supabase-js";

import TaskColumn from "./components/TaskColumn";
import TaskModal from "./components/TaskModal";
import TeamManagerModal from "./components/TeamManagerModal";
import BoardHistoryModal from "./components/BoardHistoryModal";

const COLUMNS = ["todo", "in_progress", "in_review", "done"];

export default function KanbanBoard({ userId }) {
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // this is the task modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  //and this one is the team manager one
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  // and this is the history one
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [taskToEdit, setTaskToEdit] = useState(null);

  const logAction = async (actionText) => {
    await supabase
      .from("board_history")
      .insert([{ user_id: userId, action: actionText }]);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) console.error("Error fetching tasks:", error);
    else setTasks(data || []);
    const { data: teamData, error: teamError } = await supabase
      .from("team_members")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (teamError) console.error("Error fetching team:", teamError);
    else setTeamMembers(teamData || []);

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAddModal = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleAddTeamMember = async (name) => {
    const { data, error } = await supabase
      .from("team_members")
      .insert([{ name, user_id: userId }])
      .select();

    if (error) {
      console.error("Error adding member:", error);
    } else if (data && data.length > 0) {
      logAction(`Added ${name} to the team!`);
      setTeamMembers((prev) => [...prev, data[0]]);
    }
  };

  const handleRemoveTeamMember = async (id) => {
    // Optimistically update the UI to feel fast
    setTeamMembers((prev) => prev.filter((member) => member.id !== id));

    const { name, err } = await supabase
      .from("team_members")
      .select("name")
      .eq("id", id);
    if (err) {
      console.error("Error removing member:", err);
    }
    const { error } = await supabase.from("team_members").delete().eq("id", id);

    if (error) {
      console.error("Error removing member:", error);
      fetchData(); // Revert if database fails
    } else {
      // Re-fetch data because deleting a user sets their tasks to "Unassigned"
      logAction(`Removed ${name} from the team`);
      fetchData();
    }
  };

  const handleSaveTask = async ({
    id,
    title,
    description,
    status,
    assignee_id,
    labels,
  }) => {
    // Add labels here
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    if (id) {
      // EDIT EXISTING
      setTasks(
        tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                title: trimmedTitle,
                description,
                status,
                assignee_id,
                labels,
              }
            : t,
        ),
      );
      const { error } = await supabase
        .from("tasks")
        .update({
          title: trimmedTitle,
          description,
          status,
          assignee_id,
          labels,
        }) // Update labels
        .eq("id", id);

      if (!error) {
        logAction(`Updated task "${trimmedTitle}"`);
        fetchData();
      }
    } else {
      // ADD NEW
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            title: trimmedTitle,
            description,
            status,
            user_id: userId,
            assignee_id,
            labels,
          },
        ]) // Insert labels
        .select();

      if (data && data.length > 0) {
        setTasks((prev) => [...prev, data[0]]);
        logAction(`Created new task "${trimmedTitle}"`);
      }
      if (error) console.error(error);
    }
    setIsModalOpen(false);
  };

  const handleDeleteTask = async (taskId) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    const taskToDelete = tasks.find((t) => t.id === taskId);
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) fetchData();
    logAction(`Deleted Task ${taskToDelete}`);
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
    const taskMoved = tasks.find((t) => t.id === draggableId);
    setTasks(
      tasks.map((task) =>
        task.id === draggableId ? { ...task, status: newStatus } : task,
      ),
    );
    logAction(
      `Task "${taskMoved.title}" has been moved to ${newStatus.replace("_", " ")}`,
    );

    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", draggableId);
    if (error) fetchData();
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
    <div className="p-6 font-sans">
      {/* Top Bar */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">My Board</h2>
        {/*The History button*/}
        <button
          onClick={() => setIsHistoryModalOpen(true)}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          Board History
        </button>
        {/*The manage team button*/}
        <div className="flex gap-3">
          <button
            onClick={() => setIsTeamModalOpen(true)}
            className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors"
          >
            Manage Team
          </button>

          {/*The Add Task button*/}
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            + Add Task
          </button>
        </div>
      </div>

      {/* The Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          {COLUMNS.map((columnId) => (
            <TaskColumn
              key={columnId}
              columnId={columnId}
              tasks={tasks.filter((task) => task.status === columnId)}
              onEdit={openEditModal}
              onDelete={handleDeleteTask}
              teamMembers={teamMembers}
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
        teamMembers={teamMembers}
        userId={userId}
      />
      <TeamManagerModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        teamMembers={teamMembers}
        onAddMember={handleAddTeamMember}
        onRemoveMember={handleRemoveTeamMember}
      />
      <BoardHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        userId={userId}
      />
    </div>
  );
}
