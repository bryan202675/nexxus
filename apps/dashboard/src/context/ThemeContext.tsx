import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext<{ dark: boolean; toggleDark: () => void } | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("nexxus_theme");
    if (stored) return stored === "dark";
    return (
      document.documentElement.classList.contains("dark") ||
      document.body.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });

  // Revalidar el tema al regresar de otra pestaña, ventana o Landing Page (pageshow / storage / focus)
  useEffect(() => {
    const syncTheme = () => {
      const stored = localStorage.getItem("nexxus_theme");
      if (stored) {
        setDark(stored === "dark");
      } else {
        setDark(
          document.documentElement.classList.contains("dark") ||
          document.body.classList.contains("dark") ||
          window.matchMedia("(prefers-color-scheme: dark)").matches
        );
      }
    };

    window.addEventListener("storage", syncTheme);
    window.addEventListener("pageshow", syncTheme);
    window.addEventListener("focus", syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("pageshow", syncTheme);
      window.removeEventListener("focus", syncTheme);
    };
  }, []);

  useEffect(() => {
    // Sincronizar tanto document.documentElement como document.body para que
    // Tailwind CSS, variables CSS y MutationObservers reconozcan el tema al 100%
    if (dark) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      localStorage.setItem("nexxus_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      localStorage.setItem("nexxus_theme", "light");
    }
  }, [dark]);

  const value = { dark, toggleDark: () => setDark((prev) => !prev) };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return ctx;
}
