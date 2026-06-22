import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase-js";
import { getDueDateStatus, formatToDateTimeLocal } from "./DueDate";

export const LABEL_COLORS = [
  { bg: "bg-red-100", textColor: "text-red-700", border: "border-red-200" },
  {
    bg: "bg-orange-100",
    textColor: "text-orange-700",
    border: "border-orange-200",
  },
  {
    bg: "bg-yellow-100",
    textColor: "text-yellow-800",
    border: "border-yellow-200",
  },
  {
    bg: "bg-green-100",
    textColor: "text-green-700",
    border: "border-green-200",
  },
  { bg: "bg-blue-100", textColor: "text-blue-700", border: "border-blue-200" },
  {
    bg: "bg-purple-100",
    textColor: "text-purple-700",
    border: "border-purple-200",
  },
  { bg: "bg-pink-100", textColor: "text-pink-700", border: "border-pink-200" },
  { bg: "bg-gray-100", textColor: "text-gray-700", border: "border-gray-200" },
];

export const useTaskModalController = ({
  taskToEdit,
  isOpen,
  onSave,
  userId,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [labels, setLabels] = useState([]);
  const [newLabelText, setNewLabelText] = useState("");
  const [selectedColor, setSelectedColor] = useState(LABEL_COLORS[4]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsSubmitting(false);

    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || "");
      setStatus(taskToEdit.status);
      setAssigneeId(taskToEdit.assignee_id || "");
      setLabels(taskToEdit.labels || []);
      setDueDate(formatToDateTimeLocal(taskToEdit.due_date));
      fetchComments(taskToEdit.id);
    } else {
      setTitle("");
      setDescription("");
      setStatus("todo");
      setAssigneeId("");
      setLabels([]);
      setDueDate("");
      setComments([]);
    }
    setNewLabelText("");
  }, [taskToEdit, isOpen]);

  const fetchComments = async (taskId) => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    if (!error && data) setComments(data);
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !taskToEdit) return;
    const { data, error } = await supabase
      .from("comments")
      .insert([
        { task_id: taskToEdit.id, user_id: userId, content: newComment.trim() },
      ])
      .select();
    if (!error && data) {
      setComments((prev) => [...prev, data[0]]);
      setNewComment("");
    }
  };

  const handleAddLabel = () => {
    if (!newLabelText.trim()) return;
    const newLabel = { text: newLabelText.trim(), ...selectedColor };
    setLabels([...labels, newLabel]);
    setNewLabelText("");
  };

  const handleRemoveLabel = (indexToRemove) => {
    setLabels(labels.filter((_, index) => index !== indexToRemove));
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSubmitting) return;

    setIsSubmitting(true);

    await onSave({
      id: taskToEdit?.id,
      title: trimmedTitle,
      description,
      status,
      assignee_id: assigneeId === "" ? null : assigneeId,
      labels,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    });

    setIsSubmitting(false);
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    assigneeId,
    setAssigneeId,
    dueDate,
    setDueDate,
    labels,
    newLabelText,
    setNewLabelText,
    selectedColor,
    setSelectedColor,
    comments,
    newComment,
    setNewComment,
    isSubmitting,
    handlePostComment,
    handleAddLabel,
    handleRemoveLabel,
    handleSave,
    dueStatus: getDueDateStatus(dueDate, status),
  };
};
