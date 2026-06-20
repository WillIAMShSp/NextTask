import React from "react";
import KanbanBoard from "./KanbanBoard";

function App() {
  return (
    <div className="KanbanBoard">
      <h1 style={{ textAlign: "center", marginTop: "20px" }}>Next Task</h1>
      <KanbanBoard />
    </div>
  );
}

export default App;
