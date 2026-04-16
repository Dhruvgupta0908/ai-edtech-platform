// frontend/src/main.jsx
// UPDATED — applies saved dark mode class BEFORE React renders
// This prevents the white flash you'd see if the class was applied in useEffect

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

/* ── Apply theme instantly before first paint ──
   Without this, there's a brief white flash on page load
   even if the user had dark mode saved                   */
const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
  document.documentElement.classList.add("dark");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);