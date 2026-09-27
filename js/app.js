import { calculateCurrent } from "./calculators/power-current.js";
import {
  calculateVoltageDrop,
  voltageDropStatus
} from "./calculators/voltage-drop.js";
import { formatNumber } from "./utils/format.js";
import { phaseLabel } from "./utils/electrical.js";
import { positiveNumber, rangeNumber } from "./utils/validation.js";
import { initTheme } from "./ui/theme.js";
import { initNavigation } from "./ui/navigation.js";
import { setStatus } from "./ui/results.js";

initTheme(document.querySelector("#theme-toggle"));
initNavigation();
initStandaloneMode();
initMobileNavigationVisibility();
initScrollTop();

initPowerCalculator();
initVoltageDropCalculator();

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

function initPowerCalculator() {
  const power = document.querySelector("#power-value");
  const unit = document.querySelector("#power-unit");
  const voltage = document.querySelector("#power-voltage");
  const cosPhi = document.querySelector("#power-cosphi");
  const result = document.querySelector("#power-result");
  const summary = document.querySelector("#power-summary");
  const formula = document.querySelector("#power-formula");
  const validation = document.querySelector("#power-validation");
  const phaseButtons = [...document.querySelectorAll("[data-power-phase]")];

  let phases = 1;

  function update() {
    const p = positiveNumber(Number(power.value) * Number(unit.value), "Мощността");
    const v = positiveNumber(voltage.value, "Напрежението");
    const c = rangeNumber(cosPhi.value, "cos φ", 0.01, 1);

    const firstError = [p, v, c].find((item) => !item.ok);

    if (firstError) {
      validation.textContent = firstError.message;
      result.textContent = "—";
      return;
    }

    validation.textContent = "";

    const current = calculateCurrent({
      powerWatts: p.value,
      voltage: v.value,
      cosPhi: c.value,
      phases
    });

    result.textContent = formatNumber(current, 2);

    const displayPower = unit.value === "1000"
      ? `${formatNumber(Number(power.value), 2)} kW`
      : `${formatNumber(Number(power.value), 0)} W`;

    summary.textContent = `${displayPower} · ${formatNumber(v.value, 0)} V · ${phaseLabel(phases)}`;

    formula.innerHTML = phases === 3
      ? `<p>Трифазна система:</p><code>I = P / (√3 × U × cosφ)</code><code>I = ${formatNumber(p.value, 0)} / (√3 × ${formatNumber(v.value, 0)} × ${formatNumber(c.value, 2)}) = ${formatNumber(current, 2)} A</code>`
      : `<p>Еднофазна система:</p><code>I = P / (U × cosφ)</code><code>I = ${formatNumber(p.value, 0)} / (${formatNumber(v.value, 0)} × ${formatNumber(c.value, 2)}) = ${formatNumber(current, 2)} A</code>`;
  }

  [power, unit, voltage, cosPhi].forEach((element) => {
    element.addEventListener("input", update);
    element.addEventListener("change", update);
  });

  phaseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      phases = Number(button.dataset.powerPhase);
      phaseButtons.forEach((b) => b.classList.toggle("is-active", b === button));

      if (phases === 1 && Number(voltage.value) === 400) voltage.value = 230;
      if (phases === 3 && Number(voltage.value) === 230) voltage.value = 400;

      update();
    });
  });

  update();
}

function initVoltageDropCalculator() {
  const current = document.querySelector("#drop-current");
  const length = document.querySelector("#drop-length");
  const voltage = document.querySelector("#drop-voltage");
  const material = document.querySelector("#drop-material");
  const section = document.querySelector("#drop-section");
  const voltsOut = document.querySelector("#drop-result-volts");
  const percentOut = document.querySelector("#drop-result-percent");
  const statusOut = document.querySelector("#drop-status");
  const summary = document.querySelector("#drop-summary");
  const formula = document.querySelector("#drop-formula");
  const validation = document.querySelector("#drop-validation");
  const tbody = document.querySelector("#drop-comparison-body");
  const phaseButtons = [...document.querySelectorAll("[data-drop-phase]")];

  let phases = 1;
  const sections = [1.5, 2.5, 4, 6, 10, 16];

  function getMaterialLabel() {
    return material.value === "aluminum" ? "Al" : "Cu";
  }

  function update() {
    const i = positiveNumber(current.value, "Токът");
    const l = positiveNumber(length.value, "Дължината");
    const u = positiveNumber(voltage.value, "Напрежението");
    const s = positiveNumber(section.value, "Сечението");

    const firstError = [i, l, u, s].find((item) => !item.ok);

    if (firstError) {
      validation.textContent = firstError.message;
      voltsOut.textContent = "—";
      percentOut.textContent = "—";
      tbody.innerHTML = "";
      return;
    }

    validation.textContent = "";

    const calc = calculateVoltageDrop({
      current: i.value,
      lengthMeters: l.value,
      sectionMm2: s.value,
      voltage: u.value,
      material: material.value,
      phases
    });

    voltsOut.textContent = formatNumber(calc.voltageDrop, 2);
    percentOut.textContent = `${formatNumber(calc.percent, 2)}%`;

    const status = voltageDropStatus(calc.percent);
    setStatus(statusOut, status);

    summary.textContent = `${getMaterialLabel()} · ${formatNumber(s.value, 1)} mm² · ${formatNumber(l.value, 1)} m`;

    const factor = phases === 3 ? "√3" : "2";
    formula.innerHTML = `
      <p>Опростен резистивен модел:</p>
      <code>ΔU = ${factor} × I × ρ × L / S</code>
      <code>ΔU = ${formatNumber(calc.voltageDrop, 2)} V · ${formatNumber(calc.percent, 2)}%</code>
    `;

    tbody.innerHTML = sections.map((candidate) => {
      const row = calculateVoltageDrop({
        current: i.value,
        lengthMeters: l.value,
        sectionMm2: candidate,
        voltage: u.value,
        material: material.value,
        phases
      });

      const rowStatus = voltageDropStatus(row.percent);
      const selected = Number(candidate) === Number(s.value) ? "is-selected" : "";

      return `
        <tr
          class="${selected}"
          data-section="${candidate}"
          role="button"
          tabindex="0"
          aria-label="Избери сечение ${formatNumber(candidate, 1)} mm²"
        >
          <td data-label="Сечение"><strong>${formatNumber(candidate, 1)} mm²</strong></td>
          <td data-label="ΔU">${formatNumber(row.voltageDrop, 2)} V</td>
          <td data-label="ΔU %">${formatNumber(row.percent, 2)}%</td>
          <td data-label="Статус"><span class="status-pill ${rowStatus.className}">${rowStatus.label}</span></td>
        </tr>
      `;
    }).join("");
  }

  [current, length, voltage, material, section].forEach((element) => {
    element.addEventListener("input", update);
    element.addEventListener("change", update);
  });

  function chooseSectionFromRow(row) {
    const value = row?.dataset?.section;
    if (!value) return;

    section.value = value;
    update();
  }

  tbody.addEventListener("click", (event) => {
    const row = event.target.closest("tr[data-section]");
    chooseSectionFromRow(row);
  });

  tbody.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const row = event.target.closest("tr[data-section]");
    if (!row) return;

    event.preventDefault();
    chooseSectionFromRow(row);
  });

  phaseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      phases = Number(button.dataset.dropPhase);
      phaseButtons.forEach((b) => b.classList.toggle("is-active", b === button));

      if (phases === 1 && Number(voltage.value) === 400) voltage.value = 230;
      if (phases === 3 && Number(voltage.value) === 230) voltage.value = 400;

      update();
    });
  });

  update();
}
