export function initNavigation() {
  const views = [...document.querySelectorAll("[data-view]")];
  const triggers = [...document.querySelectorAll("[data-view-target]")];

  function showView(name) {
    views.forEach((view) => {
      view.classList.toggle("is-active", view.dataset.view === name);
    });

    triggers.forEach((trigger) => {
      trigger.classList.toggle("is-active", trigger.dataset.viewTarget === name);
    });

    document.body.dataset.currentView = name;
    document.dispatchEvent(new CustomEvent("electrocalc:viewchange", {
      detail: { view: name }
    }));

    if (history.replaceState) {
      history.replaceState(null, "", `#${name}`);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => showView(trigger.dataset.viewTarget));
  });

  const hash = location.hash.replace("#", "");
  if (views.some((view) => view.dataset.view === hash)) {
    showView(hash);
  }
}
