import { useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabase-js";

export const getTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
};

export const useBoardHistoryModal = ({ isOpen, onClose, userId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("board_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setHistory(data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchHistory();
    }
  }, [isOpen, userId, fetchHistory]);

  return { history, setHistory, loading, setLoading };
};
