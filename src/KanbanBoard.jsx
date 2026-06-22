import React, { useState, useEffect, useCallback } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { supabase } from "./utils/supabase-js";

import TaskColumn from "./components/TaskColumn";
import TaskModal from "./components/TaskModal";
import TeamManagerModal from "./components/TeamManagerModal";
import BoardHistoryModal from "./components/BoardHistoryModal";

import { getDueDateStatus } from "./controller_functions/DueDate";

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

  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterDueDate, setFilterDueDate] = useState("");
  const [filterLabel, setFilterLabel] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null); // 'assignee', 'date', 'label', or null

  // Helper to toggle a dropdown and close others
  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const allUniqueLabels = Array.from(
    new Set(tasks.flatMap((t) => (t.labels || []).map((l) => l.text))),
  );

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
      .order("col_position", { ascending: true });

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
    const handleOutsideClick = () => setActiveDropdown(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
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
    due_date,
  }) => {
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
                due_date,
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
          due_date,
        })
        .eq("id", id);

      if (!error) {
        logAction(`Updated task "${trimmedTitle}"`);
        fetchData();
      }
    } else {
      // ADD NEW
      const targetColumn = status || "todo";
      const existingColumnLength = tasks.filter(
        (t) => t.status === targetColumn,
      ).length;

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
            due_date,
            col_position: existingColumnLength,
          },
        ])
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
    logAction(`Deleted Task ${taskToDelete.title}`);
  };

  const handleDragEnd = async (result) => {
    const { source, destination } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const sourceColumn = source.droppableId;
    const targetColumn = destination.droppableId;

    if (sourceColumn === targetColumn) {
      const columnTasks = tasks
        .filter((t) => t.status === sourceColumn)
        .sort((a, b) => (a.col_position || 0) - (b.col_position || 0));

      const reordered = Array.from(columnTasks);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);

      const positionMapped = reordered.map((t, idx) => ({
        ...t,
        col_position: idx,
      }));

      setTasks((prev) =>
        prev.map((t) => positionMapped.find((pm) => pm.id === t.id) || t),
      );

      const dbUpdates = positionMapped.map((t) =>
        supabase
          .from("tasks")
          .update({ col_position: t.col_position })
          .eq("id", t.id),
      );
      await Promise.all(dbUpdates);
    } else {
      const sourceTasks = tasks
        .filter((t) => t.status === sourceColumn)
        .sort((a, b) => (a.col_position || 0) - (b.col_position || 0));
      const targetTasks = tasks
        .filter((t) => t.status === targetColumn)
        .sort((a, b) => (a.col_position || 0) - (b.col_position || 0));

      const reorderedSource = Array.from(sourceTasks);
      const [moved] = reorderedSource.splice(source.index, 1);

      const updatedMovedTask = { ...moved, status: targetColumn };
      const reorderedTarget = Array.from(targetTasks);
      reorderedTarget.splice(destination.index, 0, updatedMovedTask);

      const mappedSource = reorderedSource.map((t, idx) => ({
        ...t,
        col_position: idx,
      }));
      const mappedTarget = reorderedTarget.map((t, idx) => ({
        ...t,
        col_position: idx,
      }));

      // Update local state instantly
      setTasks((prev) =>
        prev.map((t) => {
          const matchSource = mappedSource.find((ms) => ms.id === t.id);
          if (matchSource) return matchSource;
          const matchTarget = mappedTarget.find((mt) => mt.id === t.id);
          if (matchTarget) return matchTarget;
          return t;
        }),
      );

      // Save column changes and positions concurrently to Supabase
      const sourceDb = mappedSource.map((t) =>
        supabase
          .from("tasks")
          .update({ col_position: t.col_position })
          .eq("id", t.id),
      );
      const targetDb = mappedTarget.map((t) =>
        supabase
          .from("tasks")
          .update({ status: targetColumn, col_position: t.col_position })
          .eq("id", t.id),
      );
      await Promise.all([...sourceDb, ...targetDb]);
    }

    logAction(`Reordered tasks`);
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
  const filteredTasks = tasks.filter((task) => {
    // 1. Search Query (checks title and description)
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Assignee Filter
    const matchesAssignee =
      filterAssignee === "unassigned"
        ? !task.assignee_id
        : filterAssignee
          ? task.assignee_id === filterAssignee
          : true;

    // 3. Label Filter
    const matchesLabel = filterLabel
      ? (task.labels || []).some((l) => l.text === filterLabel)
      : true;

    // 4. Due Date Filter
    let matchesDate = true;
    if (filterDueDate) {
      const dueInfo = getDueDateStatus(task.due_date, task.status);

      if (filterDueDate === "completed") {
        matchesDate = task.status === "done";
      } else if (filterDueDate === "overdue") {
        matchesDate = dueInfo?.label.startsWith("Overdue");
      } else if (filterDueDate === "soon") {
        matchesDate = dueInfo?.label.startsWith("Due Soon");
      } else if (filterDueDate === "later") {
        matchesDate = dueInfo?.label.startsWith("Due:"); // The standard 'Due' label
      } else if (filterDueDate === "none") {
        matchesDate = !task.due_date;
      }
    }

    return matchesSearch && matchesAssignee && matchesLabel && matchesDate;
  });

  return (
    <div className="p-6 font-sans select-none">
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
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-wrap gap-4 items-center select-none">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
          </div>

          {/* 1. Custom Assignee Dropdown */}
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
              className={`absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto transition-all duration-200 origin-top transform ${
                activeDropdown === "assignee"
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              }`}
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

          {/* 2. Custom Due Date Dropdown */}
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
              className={`absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 transition-all duration-200 origin-top transform ${
                activeDropdown === "date"
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              }`}
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

          {/* 3. Custom Label Dropdown */}
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
              className={`absolute left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto transition-all duration-200 origin-top transform ${
                activeDropdown === "label"
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              }`}
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
