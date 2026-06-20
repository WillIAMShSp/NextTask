import React, { useState } from "react";

export default function TeamManagerModal({
  isOpen,
  onClose,
  teamMembers,
  onAddMember,
  onRemoveMember,
}) {
  const [newName, setNewName] = useState("");

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await onAddMember(newName.trim());
    setNewName(""); // Clear input after saving
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 m-0">Manage Team</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {/* Add Input */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Enter team member name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
            >
              Add
            </button>
          </div>

          {/* Team List */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
              Current Roster ({teamMembers.length})
            </h4>

            {teamMembers.length === 0 ? (
              <p className="text-gray-500 italic text-sm text-center py-4 bg-gray-50 rounded">
                No team members yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {teamMembers.map((member) => (
                  <li
                    key={member.id}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-100"
                  >
                    <span className="text-gray-800 font-medium">
                      {member.name}
                    </span>
                    <button
                      onClick={() => onRemoveMember(member.id)}
                      className="text-gray-400 hover:text-red-500 text-xl leading-none transition-colors"
                      title="Remove Member"
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
