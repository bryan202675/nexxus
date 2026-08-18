import { useEffect, useState } from "react";

const isDarkNow = () =>
  typeof document !== "undefined" &&
  (document.documentElement.classList.contains("dark") || document.body.classList.contains("dark"));

const useIsDarkMode = () => {
  const [isDark, setIsDark] = useState(isDarkNow);

  useEffect(() => {
    const check = () => setIsDark(isDarkNow());
    const observer = new MutationObserver(check);

    if (document.documentElement) {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    return () => observer.disconnect();
  }, []);

  return isDark;
};

export default useIsDarkMode;
