// frontend/src/hooks/useDarkMode.js
// NEW FILE — single source of truth for dark mode across the app.
//
// Usage in any component:
//   import useDarkMode from "../hooks/useDarkMode";
//   const { isDark, toggle } = useDarkMode();
//
// How it works:
//   - Reads saved preference from localStorage on first load
//   - Falls back to the OS preference (prefers-color-scheme) if nothing saved
//   - Adds/removes the "dark" class on <html> — CSS variables pick this up
//   - Saves the preference to localStorage on every toggle

import { useEffect, useState } from "react";

export default function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    // 1. Check localStorage first
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    // 2. Fall back to OS preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggle = () => setIsDark(prev => !prev);

  return { isDark, toggle };
}