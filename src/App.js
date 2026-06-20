import React, { useState, useEffect } from "react";
import KanbanBoard from "./KanbanBoard";
import { supabase } from "./utils/supabase-js";
import Auth from "./components/Auth";

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for login/logout events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div>
      {!session ? (
        <Auth />
      ) : (
        <div>
          {/* A simple logout bar at the very top */}
          <div
            style={{
              backgroundColor: "#f4f5f7",
              padding: "10px 20px",
              display: "flex",
              justifyContent: "flex-end",
              fontFamily: "sans-serif",
            }}
          >
            <button
              onClick={handleLogout}
              style={{
                padding: "8px 16px",
                cursor: "pointer",
                backgroundColor: "transparent",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            >
              Sign Out
            </button>
          </div>

          {/* Pass the authenticated user's ID to the board */}
          <KanbanBoard userId={session.user.id} />
        </div>
      )}
    </div>
  );
}

export default App;
