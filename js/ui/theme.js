import { getStoredValue, setStoredValue } from "../utils/storage.js";

const THEME_KEY = "electrocalc-theme";

export function initTheme(button) {
  const stored = getStoredValue(THEME_KEY);
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const initial = stored || (prefersDark ? "dark" : "light");

  setTheme(initial, button);

  button.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "light";
    setTheme(current === "dark" ? "light" : "dark", button);
  });
}

function setTheme(theme, button) {
  document.documentElement.dataset.theme = theme;
  setStoredValue(THEME_KEY, theme);

  const icon = button.querySelector(".theme-icon");
  if (icon) icon.textContent = theme === "dark" ? "☀️" : "🌙";

  button.setAttribute(
    "aria-label",
    theme === "dark" ? "Включи светла тема" : "Включи тъмна тема"
  );
}
