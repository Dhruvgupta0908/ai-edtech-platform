// frontend/src/components/DarkModeToggle.jsx
// NEW FILE — a floating toggle button that appears on EVERY page.
// Import this once in App.jsx and it works everywhere automatically.

import useDarkMode from "../hooks/useDarkMode";

export default function DarkModeToggle() {
  const { isDark, toggle } = useDarkMode();

  return (
    <button
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position:     "fixed",
        bottom:       "100px",      // above the floating AI bot
        right:        "35px",
        zIndex:       1000,
        width:        "48px",
        height:       "48px",
        borderRadius: "50%",
        border:       "1.5px solid var(--border-color)",
        background:   "var(--bg-card)",
        fontSize:     "20px",
        cursor:       "pointer",
        boxShadow:    "0 4px 16px rgba(0,0,0,0.15)",
        display:      "flex",
        alignItems:   "center",
        justifyContent: "center",
        transition:   "all 0.2s ease",
      }}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  );
}