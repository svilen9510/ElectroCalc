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

  initStandaloneMode();
  initMobileNavigationVisibility();
  initScrollTop();
}

function initStandaloneMode() {
  const displayModeStandalone = window.matchMedia?.("(display-mode: standalone)").matches;
  const iosStandalone = window.navigator.standalone === true;

  document.body.classList.toggle(
    "is-standalone",
    Boolean(displayModeStandalone || iosStandalone)
  );
}

function initMobileNavigationVisibility() {
  const nav = document.querySelector(".mobile-nav");
  if (!nav) return;

  const mobileQuery = window.matchMedia("(max-width: 640px)");

  function update() {
    const isMobile = mobileQuery.matches;
    const isStandalone = document.body.classList.contains("is-standalone");
    const currentView = document.body.dataset.currentView || "home";

    // В инсталирано PWA долната навигация е постоянна.
    if (isMobile && isStandalone) {
      nav.classList.add("is-visible");
      return;
    }

    // В браузър: навигацията се показва само в самия край на калкулатора,
    // за да не закрива съдържанието по време на четене.
    const pageHeight = document.documentElement.scrollHeight;
    const viewportBottom = window.scrollY + window.innerHeight;
    const remainingToBottom = pageHeight - viewportBottom;

    const shouldShow =
      isMobile &&
      currentView !== "home" &&
      remainingToBottom <= 60;

    nav.classList.toggle("is-visible", shouldShow);
  }

  window.addEventListener("scroll", update, { passive: true });
  document.addEventListener("electrocalc:viewchange", update);

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", update);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(update);
  }

  update();
}

function initScrollTop() {
  const button = document.querySelector("#scroll-top");
  const sentinel = document.querySelector("#page-end-sentinel");
  if (!button || !sentinel) return;

  const mobileQuery = window.matchMedia("(max-width: 640px)");
  let endIsVisible = false;

  function updateVisibility() {
    const currentView = document.body.dataset.currentView || "home";

    const shouldShow =
      mobileQuery.matches &&
      currentView !== "home" &&
      endIsVisible;

    button.classList.toggle("is-visible", shouldShow);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      endIsVisible = entries.some((entry) => entry.isIntersecting);
      updateVisibility();
    },
    {
      root: null,
      threshold: 0.01
    }
  );

  observer.observe(sentinel);

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.addEventListener("electrocalc:viewchange", updateVisibility);

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", updateVisibility);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(updateVisibility);
  }

  updateVisibility();
}
