import { CONDUCTOR_MATERIALS } from "../../data/conductor-materials.js";
import {
  DEFAULT_CABLE_SECTION_MM2,
  STANDARD_CABLE_SECTIONS_MM2
} from "../../data/cable-sizes.js";
import { calculateVoltageDrop } from "../calculators/voltage-drop.js";
import { formatNumber } from "../utils/format.js";
import { convertUnit } from "../utils/units.js";
import { positiveNumber, rangeNumber } from "../utils/validation.js";
import { setStatus } from "./results.js";
import { initDesktopSelectPicker } from "./select-picker.js";
import { initUnitSelectConversion } from "./unit-select.js";

export function initVoltageDropCalculator() {
  const currentInput = document.getElementById("drop-current");
  const currentField = document.getElementById("drop-current-field");
  const powerInput = document.getElementById("drop-power");
  const powerField = document.getElementById("drop-power-field");
  const powerUnitSelect = document.getElementById("drop-power-unit");
  const voltageInput = document.getElementById("drop-voltage");
  const cosPhiInput = document.getElementById("drop-cosphi");
  const lengthInput = document.getElementById("drop-length");
  const materialSelect = document.getElementById("drop-material");
  const sectionSelect = document.getElementById("drop-section");
  const voltsOutput = document.getElementById("drop-result-volts");
  const percentOutput = document.getElementById("drop-result-percent");
  const currentOutput = document.getElementById("drop-result-current");
  const statusOutput = document.getElementById("drop-status");
  const summaryOutput = document.getElementById("drop-summary");
  const formulaOutput = document.getElementById("drop-formula");
  const validationOutput = document.getElementById("drop-validation");
  const comparisonBody = document.getElementById("drop-comparison-body");
  const phaseButtons = document.querySelectorAll("[data-drop-phase]");
  const inputModeButtons = document.querySelectorAll("[data-drop-input-mode]");

  if (
    !currentInput || !currentField || !powerInput || !powerField ||
    !powerUnitSelect || !voltageInput || !cosPhiInput || !lengthInput ||
    !materialSelect || !sectionSelect || !voltsOutput || !percentOutput ||
    !currentOutput || !statusOutput || !summaryOutput || !formulaOutput ||
    !validationOutput || !comparisonBody
  ) {
    return;
  }

  sectionSelect.replaceChildren(
    ...STANDARD_CABLE_SECTIONS_MM2.map((section) => {
      const option = document.createElement("option");
      option.value = String(section);
      option.textContent = `${section} mm²`;
      option.selected = section === DEFAULT_CABLE_SECTION_MM2;
      return option;
    })
  );

  const syncMaterialPicker = initDesktopSelectPicker(materialSelect);
  const syncSectionPicker = initDesktopSelectPicker(sectionSelect);
  const syncPowerUnitPicker = initDesktopSelectPicker(powerUnitSelect, { minWidth: 160 });
  initUnitSelectConversion(powerInput, powerUnitSelect, "power");

  let phases = 1;
  let inputMode = "current";

  function setInputMode(nextMode) {
    inputMode = nextMode;
    currentField.hidden = inputMode !== "current";
    powerField.hidden = inputMode !== "power";

    inputModeButtons.forEach((button) => {
      const isActive = button.dataset.dropInputMode === inputMode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function update() {
    syncMaterialPicker();
    syncSectionPicker();
    syncPowerUnitPicker();

    const loadResult = inputMode === "power"
      ? positiveNumber(
        convertUnit(
          Number(powerInput.value),
          powerUnitSelect.value,
          "W",
          "power"
        ),
        "Мощността"
      )
      : positiveNumber(currentInput.value, "Токът");
    const voltageResult = positiveNumber(voltageInput.value, "Напрежението");
    const cosPhiResult = rangeNumber(
      cosPhiInput.value,
      "cos φ",
      0.01,
      1
    );
    const lengthResult = positiveNumber(lengthInput.value, "Дължината");
    const sectionResult = positiveNumber(sectionSelect.value, "Сечението");
    const firstError = [loadResult, voltageResult, cosPhiResult, lengthResult, sectionResult]
      .find((result) => !result.ok);

    if (firstError) {
      validationOutput.textContent = firstError.message;
      voltsOutput.textContent = "—";
      percentOutput.textContent = "—";
      currentOutput.textContent = "Изчислен ток: —";
      summaryOutput.textContent = "—";
      formulaOutput.replaceChildren();
      comparisonBody.replaceChildren();
      setStatus(statusOutput, { label: "—", className: "" });
      return;
    }

    validationOutput.textContent = "";

    const powerWatts = inputMode === "power"
      ? loadResult.value
      : undefined;
    const calculationInput = {
      inputMode,
      current: inputMode === "current" ? loadResult.value : undefined,
      powerWatts,
      voltage: voltageResult.value,
      cosPhi: cosPhiResult.value,
      lengthMeters: lengthResult.value,
      sectionMm2: sectionResult.value,
      material: materialSelect.value,
      phases
    };
    const result = calculateVoltageDrop(calculationInput);

    voltsOutput.textContent = formatNumber(result.voltageDrop, 2);
    percentOutput.textContent = `${formatNumber(result.percent, 2)}%`;
    currentOutput.textContent = `Изчислен ток: ${formatNumber(result.current, 2)} A`;
    summaryOutput.textContent = `${getMaterialLabel(materialSelect.value)} · ${formatNumber(sectionResult.value, 1)} mm² · ${formatNumber(lengthResult.value, 1)} m еднопосочно`;
    setStatus(statusOutput, getVoltageDropStatus(result.percent));
    renderFormula({
      inputMode,
      powerWatts,
      voltage: voltageResult.value,
      cosPhi: cosPhiResult.value,
      lengthMeters: lengthResult.value,
      sectionMm2: sectionResult.value,
      material: materialSelect.value,
      phases,
      result
    });
    renderComparison(calculationInput, sectionResult.value);
  }

  function renderFormula({
    inputMode: mode,
    powerWatts,
    voltage,
    cosPhi,
    lengthMeters,
    sectionMm2,
    material,
    phases: phaseCount,
    result
  }) {
    const isThreePhase = Number(phaseCount) === 3;
    const phaseFactor = isThreePhase ? "√3" : "2";
    const resistivity = CONDUCTOR_MATERIALS[material].resistivityOhmMm2PerM;
    const currentExplanation = mode === "power"
      ? `
        <p>Ток от активна мощност:</p>
        <code>I = ${isThreePhase ? "P / (√3 × U × cos φ)" : "P / (U × cos φ)"}</code>
        <code>I = ${formatNumber(powerWatts, 2)} / (${isThreePhase ? "√3 × " : ""}${formatNumber(voltage, 2)} × ${formatNumber(cosPhi, 2)}) = ${formatNumber(result.current, 2)} A</code>
      `
      : `
        <p>Въведен ток:</p>
        <code>I = ${formatNumber(result.current, 2)} A</code>
      `;

    formulaOutput.innerHTML = `
      ${currentExplanation}
      <p>Пад на напрежение — резистивен модел:</p>
      <code>ΔU = ${phaseFactor} × I × L × (ρ / S) × cos φ</code>
      <code>ΔU = ${phaseFactor} × ${formatNumber(result.current, 2)} × ${formatNumber(lengthMeters, 2)} × (${formatNumber(resistivity, 4)} / ${formatNumber(sectionMm2, 2)}) × ${formatNumber(cosPhi, 2)} = ${formatNumber(result.voltageDrop, 2)} V</code>
      <code>ΔU% = (ΔU / U) × 100 = (${formatNumber(result.voltageDrop, 2)} / ${formatNumber(voltage, 2)}) × 100 = ${formatNumber(result.percent, 2)}%</code>
      <p><strong>Допускания:</strong> установен синусоидален AC режим; ${isThreePhase ? "балансиран трифазен товар; линейно (междуфазно) напрежение; " : ""}еднопосочна физическа дължина; специфично съпротивление при ${CONDUCTOR_MATERIALS[material].referenceTemperatureC}°C; без реактивно съпротивление и температурна компенсация.</p>
    `;
  }

  function renderComparison(calculationInput, selectedSection) {
    comparisonBody.replaceChildren(
      ...getComparisonSections(selectedSection).map((candidateSection) => {
        const candidateResult = calculateVoltageDrop({
          ...calculationInput,
          sectionMm2: candidateSection
        });
        const rowStatus = getVoltageDropStatus(candidateResult.percent);
        const row = document.createElement("tr");
        row.dataset.section = String(candidateSection);
        row.setAttribute("role", "button");
        row.tabIndex = 0;
        row.setAttribute(
          "aria-label",
          `Избери сечение ${formatNumber(candidateSection, 1)} mm²`
        );
        row.innerHTML = `
          <td data-label="Сечение"><strong>${formatNumber(candidateSection, 1)} mm²</strong></td>
          <td data-label="ΔU">${formatNumber(candidateResult.voltageDrop, 2)} V</td>
          <td data-label="ΔU %">${formatNumber(candidateResult.percent, 2)}%</td>
          <td data-label="Статус"><span class="status-pill ${rowStatus.className}">${rowStatus.label}</span></td>
        `;
        if (candidateSection === selectedSection) {
          row.classList.add("is-selected");
        }
        return row;
      })
    );
  }

  inputModeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setInputMode(button.dataset.dropInputMode);
      update();
    });
  });

  phaseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      phases = Number(button.dataset.dropPhase);
      phaseButtons.forEach((phaseButton) => {
        phaseButton.classList.toggle("is-active", phaseButton === button);
      });

      if (phases === 1 && Number(voltageInput.value) === 400) voltageInput.value = "230";
      if (phases === 3 && Number(voltageInput.value) === 230) voltageInput.value = "400";

      update();
    });
  });

  [
    currentInput,
    powerInput,
    powerUnitSelect,
    voltageInput,
    cosPhiInput,
    lengthInput,
    materialSelect,
    sectionSelect
  ].forEach((control) => {
    control.addEventListener("input", update);
    control.addEventListener("change", update);
  });

  function chooseSectionFromRow(row) {
    const section = Number(row?.dataset?.section);
    if (!STANDARD_CABLE_SECTIONS_MM2.includes(section)) return;

    sectionSelect.value = String(section);
    update();
  }

  comparisonBody.addEventListener("click", (event) => {
    chooseSectionFromRow(event.target.closest("tr[data-section]"));
  });

  comparisonBody.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const row = event.target.closest("tr[data-section]");
    if (!row) return;

    event.preventDefault();
    chooseSectionFromRow(row);
  });

  setInputMode("current");
  update();
}

function getMaterialLabel(material) {
  return material === "aluminum" ? "Al" : "Cu";
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

function getComparisonSections(selectedSection) {
  const selectedIndex = STANDARD_CABLE_SECTIONS_MM2.indexOf(selectedSection);
  if (selectedIndex === -1) {
    return [];
  }

  const visibleCount = Math.min(5, STANDARD_CABLE_SECTIONS_MM2.length);
  const maximumStart = STANDARD_CABLE_SECTIONS_MM2.length - visibleCount;
  const start = Math.min(Math.max(selectedIndex - 2, 0), maximumStart);
  return STANDARD_CABLE_SECTIONS_MM2.slice(start, start + visibleCount);
}
