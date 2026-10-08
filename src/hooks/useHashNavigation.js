import { useCallback, useEffect, useState } from "react";

const VIEWS = new Set(["home", "power", "voltage-drop"]);

function getViewFromHash() {
  const view = window.location.hash.slice(1);
  return VIEWS.has(view) ? view : "home";
}

export function useHashNavigation() {
  const [activeView, setActiveView] = useState(getViewFromHash);

  useEffect(() => {
    function handleHashChange() {
      const nextView = getViewFromHash();
      setActiveView(nextView);

      if (!VIEWS.has(window.location.hash.slice(1))) {
        window.history.replaceState(null, "", "#home");
      }
    }

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = useCallback((view) => {
    if (!VIEWS.has(view)) return;

    if (window.location.hash === `#${view}`) {
      setActiveView(view);
      return;
    }

    window.location.hash = view;
  }, []);

  return { activeView, navigate };
}
