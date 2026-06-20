import React, { useState } from "react";
import { supabase } from "../utils/supabase-js";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage("Success! Check your email for a confirmation link.");
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setMessage(error.message);
    setLoading(false);
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) setMessage(error.message);
    setLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "200px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "15px" }}>
        Welcome to Next Task
      </h2>

      <form style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px",
              cursor: "pointer",
              backgroundColor: "#0052cc",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Log In
          </button>
          <button
            onClick={handleSignUp}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px",
              cursor: "pointer",
              backgroundColor: "transparent",
              color: "#0052cc",
              border: "1px solid #0052cc",
              borderRadius: "4px",
            }}
          >
            Sign Up
          </button>
        </div>
      </form>

      <hr
        style={{
          margin: "20px 0",
          border: "none",
          borderTop: "1px solid #eee",
        }}
      />

      <button
        onClick={handleGuestLogin}
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          cursor: "pointer",
          backgroundColor: "#333",
          color: "white",
          border: "none",
          borderRadius: "4px",
        }}
      >
        Continue as Guest
      </button>

      {message && (
        <p style={{ color: "red", textAlign: "center", marginTop: "15px" }}>
          {message}
        </p>
      )}
    </div>
  );
}
