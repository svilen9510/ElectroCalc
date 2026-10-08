import { useLayoutEffect, useState } from "react";

import { getStoredValue, setStoredValue } from "../../js/utils/storage.js";

const THEME_KEY = "electrocalc-theme";

function getInitialTheme() {
  const storedTheme = getStoredValue(THEME_KEY);
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    setStoredValue(THEME_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark");
  }

  return { theme, toggleTheme };
}
