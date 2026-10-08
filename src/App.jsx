import { useEffect, useRef, useState } from "react";

import PowerCurrentCalculator from "./calculators/PowerCurrentCalculator.jsx";
import VoltageDropCalculator from "./calculators/VoltageDropCalculator.jsx";
import { useHashNavigation } from "./hooks/useHashNavigation.js";
import { useTheme } from "./hooks/useTheme.js";

const MOBILE_QUERY = "(max-width: 640px)";

function isStandaloneDisplay() {
  return Boolean(
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export default function App() {
  const { activeView, navigate } = useHashNavigation();
  const { theme, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(MOBILE_QUERY).matches
  );
  const [isNearBottom, setIsNearBottom] = useState(false);
  const [endIsVisible, setEndIsVisible] = useState(false);
  const [isStandalone] = useState(isStandaloneDisplay);
  const pageEndRef = useRef(null);

  useEffect(() => {
    document.body.dataset.currentView = activeView;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeView]);

  useEffect(() => {
    document.body.classList.toggle("is-standalone", isStandalone);
    return () => document.body.classList.remove("is-standalone");
  }, [isStandalone]);

  useEffect(() => {
    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    const updateMobileState = () => setIsMobile(mobileQuery.matches);

    updateMobileState();
    mobileQuery.addEventListener?.("change", updateMobileState);
    return () => mobileQuery.removeEventListener?.("change", updateMobileState);
  }, []);

  useEffect(() => {
    function updateNearBottom() {
      const viewportBottom = window.scrollY + window.innerHeight;
      const remainingToBottom = document.documentElement.scrollHeight - viewportBottom;
      setIsNearBottom(remainingToBottom <= 60);
    }

    updateNearBottom();
    window.addEventListener("scroll", updateNearBottom, { passive: true });
    window.addEventListener("resize", updateNearBottom);
    return () => {
      window.removeEventListener("scroll", updateNearBottom);
      window.removeEventListener("resize", updateNearBottom);
    };
  }, [activeView]);

  useEffect(() => {
    if (!pageEndRef.current) return undefined;

    const observer = new IntersectionObserver((entries) => {
      setEndIsVisible(entries.some((entry) => entry.isIntersecting));
    }, { threshold: 0.01 });

    observer.observe(pageEndRef.current);
    return () => observer.disconnect();
  }, []);

  const mobileNavigationIsVisible = isMobile && (
    isStandalone || (activeView !== "home" && isNearBottom)
  );
  const scrollTopIsVisible = isMobile && activeView !== "home" && endIsVisible;

  return (
    <>
      <Header
        activeView={activeView}
        navigate={navigate}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="container app-main">
        {activeView === "home" && <HomeView navigate={navigate} />}
        {activeView === "power" && (
          <PowerCurrentCalculator navigateHome={() => navigate("home")} />
        )}
        {activeView === "voltage-drop" && (
          <VoltageDropCalculator navigateHome={() => navigate("home")} />
        )}
      </main>

      <div ref={pageEndRef} className="page-end-sentinel" aria-hidden="true" />

      <button
        className={`scroll-top${scrollTopIsVisible ? " is-visible" : ""}`}
        type="button"
        aria-label="Нагоре"
        title="Нагоре"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <span aria-hidden="true">↑</span>
      </button>

      <MobileNavigation
        activeView={activeView}
        isVisible={mobileNavigationIsVisible}
        navigate={navigate}
      />
    </>
  );
}

function Header({ activeView, navigate, theme, toggleTheme }) {
  return (
    <header className="app-header">
      <div className="container header-inner">
        <a className="brand" href="#home" aria-label="ElectroCalc начало">
          <span className="brand-mark" aria-hidden="true">⚡</span>
          <span className="brand-text">ElectroCalc</span>
        </a>

        <nav className="desktop-nav" aria-label="Основна навигация">
          <NavigationButton view="home" label="Начало" {...{ activeView, navigate }} />
          <NavigationButton view="power" label="Мощност и ток" {...{ activeView, navigate }} />
          <NavigationButton view="voltage-drop" label="Пад на напрежение" {...{ activeView, navigate }} />
        </nav>

        <button
          className="icon-button"
          type="button"
          aria-label={theme === "dark" ? "Включи светла тема" : "Включи тъмна тема"}
          title="Смени темата"
          onClick={toggleTheme}
        >
          <span className="theme-icon" aria-hidden="true">
            {theme === "dark" ? "☀️" : "🌙"}
          </span>
        </button>
      </div>
    </header>
  );
}

function NavigationButton({ view, label, activeView, navigate }) {
  const isActive = activeView === view;

  return (
    <button
      className={`nav-link${isActive ? " is-active" : ""}`}
      type="button"
      aria-current={isActive ? "page" : undefined}
      onClick={() => navigate(view)}
    >
      {label}
    </button>
  );
}

function HomeView({ navigate }) {
  return (
    <section id="view-home" className="view is-active" data-view="home">
      <div className="hero">
        <div>
          <span className="eyebrow">Електротехнически помощник</span>
          <h1>Бързи сметки. Ясни резултати.</h1>
          <p className="hero-copy">
            ElectroCalc е лек уеб инструмент за ежедневни електротехнически изчисления —
            удобен на компютър, таблет и телефон.
          </p>
        </div>

        <div className="hero-status">
          <span className="status-dot" />
          <span>Версия 0.2.0</span>
        </div>
      </div>

      <div className="tool-grid">
        <ToolCard
          icon="⚡"
          title="Мощност → ток"
          description="1-фазни и 3-фазни товари"
          onClick={() => navigate("power")}
        />
        <ToolCard
          icon="📉"
          title="Пад на напрежение"
          description="Дължина, сечение и материал"
          onClick={() => navigate("voltage-drop")}
        />
        <DisabledToolCard icon="🔌" title="Избор на кабел" />
        <DisabledToolCard icon="🛡️" title="Избор на защита" />
      </div>

      <div className="info-panel">
        <div>
          <strong>Архитектура без излишно усложняване</strong>
          <p>
            Логиката за смятане, UI и помощните функции са разделени, но проектът остава
            лесен за поддръжка.
          </p>
        </div>
      </div>
    </section>
  );
}

function ToolCard({ icon, title, description, onClick }) {
  return (
    <button className="tool-card" type="button" onClick={onClick}>
      <span className="tool-icon">{icon}</span>
      <span className="tool-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="tool-arrow">→</span>
    </button>
  );
}

function DisabledToolCard({ icon, title }) {
  return (
    <div className="tool-card is-disabled" aria-disabled="true">
      <span className="tool-icon">{icon}</span>
      <span className="tool-copy">
        <strong>{title}</strong>
        <small>Предстои в бъдеща версия</small>
      </span>
      <span className="badge">скоро</span>
    </div>
  );
}

function MobileNavigation({ activeView, isVisible, navigate }) {
  const items = [
    { view: "home", icon: "⌂", label: "Начало" },
    { view: "power", icon: "⚡", label: "Ток" },
    { view: "voltage-drop", icon: "📉", label: "Пад" }
  ];

  return (
    <nav
      className={`mobile-nav${isVisible ? " is-visible" : ""}`}
      aria-label="Мобилна навигация"
    >
      {items.map((item) => {
        const isActive = activeView === item.view;
        return (
          <button
            key={item.view}
            className={`mobile-nav-item${isActive ? " is-active" : ""}`}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => navigate(item.view)}
          >
            <span aria-hidden="true">{item.icon}</span>
            <small>{item.label}</small>
          </button>
        );
      })}
    </nav>
  );
}
