import React, { useState, useEffect } from "react";
import { DragDropContext } from "@hello-pangea/dnd";

import TaskColumn from "./components/TaskColumn";
import TaskModal from "./components/TaskModal";
import TeamManagerModal from "./components/TeamManagerModal";
import BoardHistoryModal from "./components/BoardHistoryModal";

import { getDueDateStatus } from "./controller_functions/DueDate";
import { useKanbanData } from "./controller_functions/KanbanBoard"; // <-- Import the new hook

const COLUMNS = ["todo", "in_progress", "in_review", "done"];

export default function KanbanBoard({ userId }) {
  // 1. Pull everything we need from our custom data hook
  const {
    tasks,
    teamMembers,
    loading,
    addTeamMember,
    removeTeamMember,
    saveTask,
    deleteTask,
    handleDragEnd,
  } = useKanbanData(userId);

  // 2. UI & Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // 3. Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterDueDate, setFilterDueDate] = useState("");
  const [filterLabel, setFilterLabel] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);

  const allUniqueLabels = Array.from(
    new Set(tasks.flatMap((t) => (t.labels || []).map((l) => l.text))),
  );

  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdown(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const openAddModal = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  // Wrapper for saving to handle closing the modal locally
  const onSaveTaskSubmit = async (taskData) => {
    const success = await saveTask(taskData);
    if (success) setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">
            Loading your board...
          </p>
        </div>
      </div>
    );
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAssignee =
      filterAssignee === "unassigned"
        ? !task.assignee_id
        : filterAssignee
          ? task.assignee_id === filterAssignee
          : true;

    const matchesLabel = filterLabel
      ? (task.labels || []).some((l) => l.text === filterLabel)
      : true;

    let matchesDate = true;
    if (filterDueDate) {
      const dueInfo = getDueDateStatus(task.due_date, task.status);
      if (filterDueDate === "completed") matchesDate = task.status === "done";
      else if (filterDueDate === "overdue")
        matchesDate = dueInfo?.label.startsWith("Overdue");
      else if (filterDueDate === "soon")
        matchesDate = dueInfo?.label.startsWith("Due Soon");
      else if (filterDueDate === "later")
        matchesDate = dueInfo?.label.startsWith("Due:");
      else if (filterDueDate === "none") matchesDate = !task.due_date;
    }

    return matchesSearch && matchesAssignee && matchesLabel && matchesDate;
  });

  return (
    <div className="p-6 font-sans select-none">
      {/* Top Bar */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">My Board</h2>
        <button
          onClick={() => setIsHistoryModalOpen(true)}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          Board History
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => setIsTeamModalOpen(true)}
            className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors"
          >
            Manage Team
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            + Add Task
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-wrap gap-4 items-center select-none">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>

        {/* Custom Assignee Dropdown */}
        <div
          className="relative min-w-[150px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => toggleDropdown("assignee")}
            className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-left flex justify-between items-center hover:border-gray-400 transition-colors"
          >
            <span className="truncate">
              {filterAssignee === "unassigned"
                ? "Unassigned"
                : teamMembers.find((m) => m.id === filterAssignee)?.name ||
                  "All Assignees"}
            </span>
            <span
              className={`text-xs transition-transform duration-200 ${activeDropdown === "assignee" ? "rotate-180" : ""}`}
            >
              ▼
            </span>
          </button>
          <div
            className={`absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto transition-all duration-200 origin-top transform ${activeDropdown === "assignee" ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}
          >
            <div className="p-1">
              <button
                onClick={() => {
                  setFilterAssignee("");
                  setActiveDropdown(null);
                }}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
              >
                All Assignees
              </button>
              <button
                onClick={() => {
                  setFilterAssignee("unassigned");
                  setActiveDropdown(null);
                }}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
              >
                Unassigned
              </button>
              {teamMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setFilterAssignee(m.id);
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Due Date Dropdown */}
        <div
          className="relative min-w-[150px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => toggleDropdown("date")}
            className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-left flex justify-between items-center hover:border-gray-400 transition-colors"
          >
            <span className="transparent capitalize">
              {filterDueDate
                ? filterDueDate
                    .replace("none", "No Due Date")
                    .replace("soon", "Due Soon")
                    .replace("later", "Due Later")
                : "Any Due Date"}
            </span>
            <span
              className={`text-xs transition-transform duration-200 ${activeDropdown === "date" ? "rotate-180" : ""}`}
            >
              ▼
            </span>
          </button>
          <div
            className={`absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 transition-all duration-200 origin-top transform ${activeDropdown === "date" ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}
          >
            <div className="p-1">
              {[
                { val: "", label: "Any Due Date" },
                { val: "overdue", label: "Overdue" },
                { val: "soon", label: "Due Soon" },
                { val: "later", label: "Due Later" },
                { val: "none", label: "No Due Date" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => {
                    setFilterDueDate(opt.val);
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Label Dropdown */}
        <div
          className="relative min-w-[150px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => toggleDropdown("label")}
            className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white text-left flex justify-between items-center hover:border-gray-400 transition-colors"
          >
            <span className="truncate">{filterLabel || "All Labels"}</span>
            <span
              className={`text-xs transition-transform duration-200 ${activeDropdown === "label" ? "rotate-180" : ""}`}
            >
              ▼
            </span>
          </button>
          <div
            className={`absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto transition-all duration-200 origin-top transform ${activeDropdown === "label" ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}
          >
            <div className="p-1">
              <button
                onClick={() => {
                  setFilterLabel("");
                  setActiveDropdown(null);
                }}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
              >
                All Labels
              </button>
              {allUniqueLabels.map((label) => (
                <button
                  key={label}
                  onClick={() => {
                    setFilterLabel(label);
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(searchQuery || filterAssignee || filterDueDate || filterLabel) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterAssignee("");
              setFilterDueDate("");
              setFilterLabel("");
            }}
            className="text-sm text-gray-500 hover:text-red-600 font-medium px-2 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* The Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          {COLUMNS.map((columnId) => (
            <TaskColumn
              key={columnId}
              columnId={columnId}
              tasks={filteredTasks
                .filter((task) => task.status === columnId)
                .sort((a, b) => (a.col_position || 0) - (b.col_position || 0))}
              onEdit={openEditModal}
              onDelete={deleteTask}
              teamMembers={teamMembers}
            />
          ))}
        </DragDropContext>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveTaskSubmit}
        taskToEdit={taskToEdit}
        columns={COLUMNS}
        teamMembers={teamMembers}
        userId={userId}
      />
      <TeamManagerModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        teamMembers={teamMembers}
        onAddMember={addTeamMember}
        onRemoveMember={removeTeamMember}
      />
      <BoardHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        userId={userId}
      />
    </div>
  );
}
