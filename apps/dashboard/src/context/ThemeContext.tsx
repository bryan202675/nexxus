import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => document.body.classList.contains("dark"));

  useEffect(() => {
    document.body.classList.toggle("dark", dark);
  }, [dark]);

  const value = { dark, toggleDark: () => setDark((value) => !value) };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return ctx;
}
