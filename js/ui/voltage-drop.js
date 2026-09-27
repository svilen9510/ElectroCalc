import {
  DEFAULT_CABLE_SECTION_MM2,
  STANDARD_CABLE_SECTIONS_MM2
} from "../../data/cable-sizes.js";
import { calculateVoltageDrop } from "../calculators/voltage-drop.js";
import { formatNumber } from "../utils/format.js";
import { positiveNumber } from "../utils/validation.js";
import { setStatus } from "./results.js";

export function initVoltageDropCalculator() {
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
  const sections = STANDARD_CABLE_SECTIONS_MM2;

  section.innerHTML = sections.map((candidate) =>
    `<option value="${candidate}">${candidate} mm²</option>`
  ).join("");
  section.value = String(DEFAULT_CABLE_SECTION_MM2);

  const syncMaterialPicker = initDesktopSelectPicker(material);
  const syncSectionPicker = initDesktopSelectPicker(section);

  let phases = 1;

  function getMaterialLabel() {
    return material.value === "aluminum" ? "Al" : "Cu";
  }

  function update() {
    syncMaterialPicker();
    syncSectionPicker();

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
    setStatus(statusOut, getVoltageDropStatus(calc.percent));

    summary.textContent = `${getMaterialLabel()} · ${formatNumber(s.value, 1)} mm² · ${formatNumber(l.value, 1)} m`;

    const factor = phases === 3 ? "√3" : "2";
    formula.innerHTML = `
      <p>Опростен резистивен модел:</p>
      <code>ΔU = ${factor} × I × ρ × L / S</code>
      <code>ΔU = ${formatNumber(calc.voltageDrop, 2)} V · ${formatNumber(calc.percent, 2)}%</code>
    `;

    const comparisonSections = getComparisonSections(sections, s.value);

    tbody.innerHTML = comparisonSections.map((candidate) => {
      const row = calculateVoltageDrop({
        current: i.value,
        lengthMeters: l.value,
        sectionMm2: candidate,
        voltage: u.value,
        material: material.value,
        phases
      });

      const rowStatus = getVoltageDropStatus(row.percent);
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

function initDesktopSelectPicker(select) {
  const baseId = select.id;
  const control = document.querySelector(`#${baseId}-control`);
  const trigger = document.querySelector(`#${baseId}-trigger`);
  const triggerValue = document.querySelector(`#${baseId}-trigger-value`);
  const picker = document.querySelector(`#${baseId}-picker`);
  const choices = document.querySelector(`#${baseId}-choices`);
  const desktopQuery = window.matchMedia(
    "(min-width: 641px) and (hover: hover) and (pointer: fine)"
  );

  const choiceElements = [...select.options].map((option, index) => {
    const id = `${baseId}-choice-${index}`;
    const label = document.createElement("label");
    const radio = document.createElement("input");
    const text = document.createElement("span");

    label.className = "enhanced-select-choice";
    label.htmlFor = id;
    radio.id = id;
    radio.type = "radio";
    radio.name = `${baseId}-choice`;
    radio.value = option.value;
    text.textContent = option.textContent.trim();

    label.append(radio, text);
    return label;
  });

  choices.replaceChildren(...choiceElements);

  const radios = [...choices.querySelectorAll('input[type="radio"]')];
  const supportsPopover = typeof picker.showPopover === "function";

  if (supportsPopover) {
    control.classList.add("is-enhanced");

    picker.addEventListener("beforetoggle", (event) => {
      if (event.newState === "open") positionPicker();
    });

    picker.addEventListener("toggle", (event) => {
      const isOpen = event.newState === "open";
      trigger.setAttribute("aria-expanded", String(isOpen));

      if (isOpen) {
        positionPicker();
        requestAnimationFrame(() => {
          choices.querySelector('input[type="radio"]:checked')?.focus();
        });
      } else if (desktopQuery.matches) {
        trigger.focus({ preventScroll: true });
      }
    });

    picker.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;

      event.preventDefault();
      picker.hidePopover();
    });

    const handleLayoutChange = () => {
      if (!picker.matches(":popover-open")) return;

      if (desktopQuery.matches) {
        positionPicker();
      } else {
        picker.hidePopover();
      }
    };

    window.addEventListener("resize", handleLayoutChange);
    window.addEventListener("scroll", handleLayoutChange, { passive: true });

    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", handleLayoutChange);
    } else if (typeof desktopQuery.addListener === "function") {
      desktopQuery.addListener(handleLayoutChange);
    }
  }

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;

      select.value = radio.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));

      if (supportsPopover && picker.matches(":popover-open")) {
        picker.hidePopover();
      }
    });
  });

  function positionPicker() {
    const triggerRect = trigger.getBoundingClientRect();
    const edgeGap = 12;
    const pickerGap = 6;
    const width = Math.min(
      Math.max(triggerRect.width, 220),
      window.innerWidth - edgeGap * 2
    );
    const left = Math.min(
      Math.max(edgeGap, triggerRect.left),
      window.innerWidth - width - edgeGap
    );

    picker.style.width = `${width}px`;
    picker.style.left = `${left}px`;
    picker.style.top = `${triggerRect.bottom + pickerGap}px`;

    const pickerRect = picker.getBoundingClientRect();
    if (pickerRect.bottom > window.innerHeight - edgeGap) {
      picker.style.top = `${Math.max(edgeGap, triggerRect.top - pickerRect.height - pickerGap)}px`;
    }
  }

  function sync() {
    const selectedValue = select.value;
    triggerValue.textContent = select.selectedOptions[0]?.textContent.trim() ?? "";

    radios.forEach((radio) => {
      radio.checked = radio.value === selectedValue;
      radio.closest(".enhanced-select-choice")?.classList.toggle(
        "is-selected",
        radio.checked
      );
    });
  }

  sync();
  return sync;
}

function getComparisonSections(sections, selectedSection) {
  const selectedIndex = sections.indexOf(Number(selectedSection));
  const windowSize = Math.min(5, sections.length);

  if (selectedIndex < 0) return sections.slice(0, windowSize);

  const start = Math.min(
    Math.max(selectedIndex - 2, 0),
    sections.length - windowSize
  );

  return sections.slice(start, start + windowSize);
}

function getVoltageDropStatus(percent) {
  if (percent <= 3) {
    return { label: "● До 3%", className: "status-ok" };
  }

  if (percent <= 5) {
    return { label: "● Над 3%", className: "status-warning" };
  }

  return { label: "● Над 5%", className: "status-danger" };
}
