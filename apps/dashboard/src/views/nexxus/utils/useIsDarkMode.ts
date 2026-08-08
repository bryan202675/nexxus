import { useEffect, useState } from "react";

// FixedPlugin toggles the "dark" class on document.body; ApexCharts needs JS-level
// color values (it can't read Tailwind's `dark:` classes), so components read this hook.
const useIsDarkMode = () => {
  const [isDark, setIsDark] = useState(() =>
    document.body.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains("dark"));
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
};

export default useIsDarkMode;
