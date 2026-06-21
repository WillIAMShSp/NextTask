/**This function is used by TaskModal and Task classes and it determines wether or the date of the task passed is overdue
 * @param dateString the passed date;
 * @param status the status of the task (i.e is it todo or is it done already)
 * @returns an object with both the due date status (ie. wether or not it is overdue, and the color of the visual indicator)
 */
const getDueDateStatus = (dateString, status) => {
  if (!dateString) return null;

  const dueDate = new Date(dateString);
  const now = new Date();

  if (status === "done") {
    return {
      label: `Completed`,
      styles: "bg-green-100 text-green-800 border-green-300",
    };
  }

  const diffHours = (dueDate - now) / (1000 * 60 * 60);

  const formattedDate = dueDate.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  if (diffHours < 0) {
    return {
      label: `Overdue: ${formattedDate}`,
      styles: "bg-red-100 text-red-700 border-red-200",
    };
  } else if (diffHours <= 48) {
    // 48 hours = 2 days
    return {
      label: `Due Soon: ${formattedDate}`,
      styles: "bg-orange-100 text-orange-700 border-orange-200",
    };
  } else {
    return {
      label: `Due: ${formattedDate}`,
      styles: "bg-gray-100 text-gray-600 border-gray-200",
    };
  }
};

/**Helper just for TaskModal to format the Supabase timestamp into the format the HTML input needs
 *
 * @returns the local date in Year-Month-Day-Hours-Minutes
 */
const formatToDateTimeLocal = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export { getDueDateStatus, formatToDateTimeLocal };
