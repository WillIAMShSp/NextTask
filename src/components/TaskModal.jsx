import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase-js";

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

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || "");
      setStatus(taskToEdit.status);
      setAssigneeId(taskToEdit.assignee_id || "");
      fetchComments(taskToEdit.id);
    } else {
      setTitle("");
      setDescription("");
      setStatus("todo");
      setAssigneeId("");
      setComments([]);
    }
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

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      id: taskToEdit?.id,
      title,
      description,
      status,
      assignee_id: assigneeId === "" ? null : assigneeId,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col relative">
        {/* Header & Task Details */}
        <div className="flex-shrink-0">
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
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] resize-y text-sm text-gray-700"
          />

          <div className="flex gap-4 mb-6">
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
          </div>
        </div>

        {/* Comments Section (Only show if editing an existing task) */}
        {taskToEdit && (
          <div className="flex-1 flex flex-col min-h-0 border-t border-gray-200 pt-4 mt-2">
            <h4 className="text-sm font-bold text-gray-700 mb-3">
              Activity & Comments
            </h4>

            {/* Scrollable Comments List */}
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

            {/* Post Comment Input */}
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

        {/* Footer Actions */}
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
