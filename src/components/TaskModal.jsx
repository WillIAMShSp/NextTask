import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase-js";
import {
  getDueDateStatus,
  formatToDateTimeLocal,
} from "../controller_functions/DueDate";

const LABEL_COLORS = [
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

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  columns,
  teamMembers,
  userId,
}) {
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

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || "");
      setStatus(taskToEdit.status);
      setAssigneeId(taskToEdit.assignee_id || "");
      setLabels(taskToEdit.labels || []);
      fetchComments(taskToEdit.id);
      setDueDate(formatToDateTimeLocal(taskToEdit.due_date));
    } else {
      setTitle("");
      setDescription("");
      setStatus("todo");
      setAssigneeId("");
      setLabels([]);
      setComments([]);
      setDueDate("");
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

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      id: taskToEdit?.id,
      title,
      description,
      status,
      assignee_id: assigneeId === "" ? null : assigneeId,
      labels,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    });
  };
  const dueStatus = getDueDateStatus(dueDate, status);

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col relative">
        <div className="flex-shrink-0">
          <div className="flex justify-between items-start mb-2">
            {
              dueStatus ? (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${dueStatus.styles}`}
                >
                  {dueStatus.label}
                </span>
              ) : (
                <div />
              ) /* Empty div to push title down if no date */
            }
          </div>
          <h3 className="mt-0 text-xl font-bold mb-4 text-gray-800">
            {taskToEdit ? "Edit Task" : "Create a new task"}
          </h3>

          <input
            type="text"
            placeholder="Task Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none font-medium"
          />

          <textarea
            placeholder="Add a more detailed description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] resize-y text-sm text-gray-700"
          />

          {/*Labels Section */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-2 uppercase font-semibold tracking-wide">
              Labels
            </label>

            {/* Active Labels List */}
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {labels.map((label, index) => (
                  // UPDATED: Changed label.text to label.textColor in the className string
                  <span
                    key={index}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border ${label.bg} ${label.textColor} ${label.border}`}
                  >
                    {label.text}
                    <button
                      onClick={() => handleRemoveLabel(index)}
                      className="ml-1 opacity-60 hover:opacity-100 font-bold"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add Label Controls */}
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                placeholder="New label..."
                value={newLabelText}
                onChange={(e) => setNewLabelText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLabel()}
                className="p-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none w-32"
              />
              <div className="flex gap-1">
                {LABEL_COLORS.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded-full border-2 ${color.bg} ${selectedColor.bg === color.bg ? "border-gray-800 scale-110" : "border-transparent hover:scale-110"} transition-transform`}
                    title="Select color"
                  />
                ))}
              </div>
              <button
                onClick={handleAddLabel}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1 uppercase font-semibold tracking-wide">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md capitalize bg-white text-sm"
              >
                {columns.map((col) => (
                  <option key={col} value={col}>
                    {col.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1 uppercase font-semibold tracking-wide">
                Assign To
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            {/* date*/}
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs text-gray-500 mb-1 uppercase font-semibold tracking-wide">
                Due Date
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Comments Section */}
        {taskToEdit && (
          <div className="flex-1 flex flex-col min-h-0 border-t border-gray-200 pt-4 mt-2">
            <h4 className="text-sm font-bold text-gray-700 mb-3">
              Activity & Comments
            </h4>
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  No comments yet. Be the first!
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-100"
                  >
                    <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">
                      {new Date(comment.created_at).toLocaleString([], {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                className="flex-1 p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                onClick={handlePostComment}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors text-sm border border-gray-200"
              >
                Post
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {taskToEdit ? "Save Changes" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
