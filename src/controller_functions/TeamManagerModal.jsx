import { useState } from "react";

export const useTeamManagerModal = (onAddMember) => {
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await onAddMember(newName.trim());

    setNewName("");
    setTimeout(() => {
      setIsSubmitting(false);
    }, 500);
  };

  return { newName, setNewName, isSubmitting, setIsSubmitting, handleAdd };
};
