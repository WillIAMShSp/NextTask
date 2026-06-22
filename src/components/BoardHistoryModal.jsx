import {
  getTimeAgo,
  useBoardHistoryModal,
} from "../controller_functions/BoardHistoryModal";

export default function BoardHistoryModal({ isOpen, onClose, userId }) {
  const { history, loading } = useBoardHistoryModal({
    isOpen,
    onClose,
    userId,
  });

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 transition-all duration-300 ease-in-out ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-white p-6 md:p-8 rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col relative transition-all duration-300 ease-out transform ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-xl flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-800 m-0">
                Board History
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Content / Timeline */}
            <div className="p-5 flex-1 overflow-y-auto bg-gray-50">
              {loading ? (
                <p className="text-center text-gray-500 text-sm animate-pulse">
                  Loading history...
                </p>
              ) : history.length === 0 ? (
                <p className="text-center text-gray-500 italic text-sm">
                  No actions recorded yet.
                </p>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
                  {history.map((log) => {
                    // Pre-calculate exact date for the hover tooltip
                    const exactDate = new Date(log.created_at).toLocaleString(
                      [],
                      {
                        dateStyle: "medium",
                        timeStyle: "short",
                      },
                    );

                    return (
                      <div
                        key={log.id}
                        className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                      >
                        {/* The Timeline Dot */}
                        <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-blue-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10"></div>

                        {/* The Log Card */}
                        <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white p-3 rounded shadow-sm border border-gray-100 transition-all hover:shadow-md">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800">
                              {log.action}
                            </span>

                            {/* UPDATED: Uses the getTimeAgo function and adds a hover title */}
                            <span
                              className="text-[10px] text-gray-400 uppercase tracking-wider mt-1 cursor-help w-fit"
                              title={exactDate}
                            >
                              {getTimeAgo(log.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
