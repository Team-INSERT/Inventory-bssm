"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const isDark = theme === "light";
    const newTheme = isDark ? "dark" : "light";
    
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
    
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer active:scale-95"
      aria-label="Toggle Dark Mode"
    >
      {mounted ? (
        theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 animate-in spin-in-12 duration-500" />
      ) : null}
    </button>
  );
}
