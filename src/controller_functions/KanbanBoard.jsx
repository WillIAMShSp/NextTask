import { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabase-js";

export function useKanbanData(userId) {
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, [fetchData]);

  const addTeamMember = async (name) => {
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

  const removeTeamMember = async (id) => {
    setTeamMembers((prev) => prev.filter((member) => member.id !== id));

    const { data, error: err } = await supabase
      .from("team_members")
      .select("name")
      .eq("id", id)
      .single();

    if (err) console.error("Error finding member:", err);

    const { error } = await supabase.from("team_members").delete().eq("id", id);

    if (error) {
      console.error("Error removing member:", error);
      fetchData();
    } else {
      logAction(`Removed ${data?.name || "a member"} from the team`);
      fetchData();
    }
  };

  const saveTask = async ({
    id,
    title,
    description,
    status,
    assignee_id,
    labels,
    due_date,
  }) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return false;

    if (id) {
      // Edit Existing
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
      // Add New
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
    return true;
  };

  const deleteTask = async (taskId) => {
    const taskToDelete = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((task) => task.id !== taskId));

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) fetchData();
    if (taskToDelete) logAction(`Deleted Task ${taskToDelete.title}`);
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

      setTasks((prev) =>
        prev.map((t) => {
          const matchSource = mappedSource.find((ms) => ms.id === t.id);
          if (matchSource) return matchSource;
          const matchTarget = mappedTarget.find((mt) => mt.id === t.id);
          if (matchTarget) return matchTarget;
          return t;
        }),
      );

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

  return {
    tasks,
    teamMembers,
    loading,
    addTeamMember,
    removeTeamMember,
    saveTask,
    deleteTask,
    handleDragEnd,
  };
}
