import { useState } from "react";

import {
  DEFAULT_CABLE_SECTION_MM2,
  STANDARD_CABLE_SECTIONS_MM2
} from "../../data/cable-sizes.js";
import { CONDUCTOR_MATERIALS } from "../../data/conductor-materials.js";
import { calculateVoltageDrop } from "../../js/calculators/voltage-drop.js";
import { formatNumber } from "../../js/utils/format.js";
import { convertUnit } from "../../js/utils/units.js";
import { positiveNumber, rangeNumber } from "../../js/utils/validation.js";
import ResponsiveSelect from "../components/ResponsiveSelect.jsx";

const POWER_UNITS = [
  { value: "kW", label: "kW" },
  { value: "W", label: "W" }
];

const MATERIAL_OPTIONS = [
  { value: "copper", label: "Мед (Cu)" },
  { value: "aluminum", label: "Алуминий (Al)" }
];

const SECTION_OPTIONS = STANDARD_CABLE_SECTIONS_MM2.map((section) => ({
  value: String(section),
  label: `${section} mm²`
}));

export default function VoltageDropCalculator({ navigateHome }) {
  const [inputMode, setInputMode] = useState("current");
  const [phases, setPhases] = useState(1);
  const [current, setCurrent] = useState("23.9");
  const [power, setPower] = useState("5.5");
  const [powerUnit, setPowerUnit] = useState("kW");
  const [voltage, setVoltage] = useState("230");
  const [cosPhi, setCosPhi] = useState("1");
  const [length, setLength] = useState("35");
  const [material, setMaterial] = useState("copper");
  const [section, setSection] = useState(String(DEFAULT_CABLE_SECTION_MM2));

  const normalizedPowerWatts = inputMode === "power"
    ? convertUnit(Number(power), powerUnit, "W", "power")
    : null;
  const loadResult = inputMode === "power"
    ? positiveNumber(normalizedPowerWatts, "Мощността")
    : positiveNumber(current, "Токът");
  const voltageResult = positiveNumber(voltage, "Напрежението");
  const cosPhiResult = rangeNumber(cosPhi, "cos φ", 0.01, 1);
  const lengthResult = positiveNumber(length, "Дължината");
  const sectionResult = positiveNumber(section, "Сечението");
  const firstError = [
    loadResult,
    voltageResult,
    cosPhiResult,
    lengthResult,
    sectionResult
  ].find((result) => !result.ok);

  const calculationInput = firstError
    ? null
    : {
      inputMode,
      current: inputMode === "current" ? loadResult.value : undefined,
      powerWatts: inputMode === "power" ? loadResult.value : undefined,
      voltage: voltageResult.value,
      cosPhi: cosPhiResult.value,
      lengthMeters: lengthResult.value,
      sectionMm2: sectionResult.value,
      material,
      phases
    };
  const result = calculationInput ? calculateVoltageDrop(calculationInput) : null;
  const hasValidResult = result && [
    result.current,
    result.voltageDrop,
    result.percent
  ].every(Number.isFinite);
  const status = hasValidResult
    ? getVoltageDropStatus(result.percent)
    : { label: "—", className: "" };
  const comparisonSections = hasValidResult
    ? getComparisonSections(sectionResult.value)
    : [];

  function changePhases(nextPhases) {
    setPhases(nextPhases);

    if (nextPhases === 1 && Number(voltage) === 400) setVoltage("230");
    if (nextPhases === 3 && Number(voltage) === 230) setVoltage("400");
  }

  function changePowerUnit(nextUnit) {
    if (nextUnit === powerUnit) return;

    if (power !== "") {
      const convertedPower = convertUnit(
        Number(power),
        powerUnit,
        nextUnit,
        "power"
      );

      if (convertedPower !== null) setPower(String(convertedPower));
    }

    setPowerUnit(nextUnit);
  }

  return (
    <section id="view-voltage-drop" className="view is-active" data-view="voltage-drop">
      <div className="section-heading">
        <div>
          <button className="back-link" type="button" onClick={navigateHome}>
            ← Начало
          </button>
          <h2>Пад на напрежение</h2>
          <p>Бърза проверка по ток, дължина, материал и сечение.</p>
        </div>
      </div>

      <div className="calculator-layout">
        <form className="calc-panel" noValidate onSubmit={(event) => event.preventDefault()}>
          <SegmentedButtons
            label="Система"
            ariaLabel="Тип система"
            value={String(phases)}
            options={[
              { value: "1", label: "1-фазно" },
              { value: "3", label: "3-фазно" }
            ]}
            onChange={(value) => changePhases(Number(value))}
          />

          <SegmentedButtons
            label="Входни данни"
            ariaLabel="Вход за товара"
            value={inputMode}
            options={[
              { value: "current", label: "Ток" },
              { value: "power", label: "Мощност" }
            ]}
            onChange={setInputMode}
          />

          <div className="fields-grid">
            {inputMode === "current" ? (
              <NumericField
                id="drop-current"
                label="Ток"
                value={current}
                onChange={setCurrent}
                unit="A"
              />
            ) : (
              <div className="field">
                <label className="field-label" htmlFor="drop-power">
                  Активна електрическа мощност
                </label>
                <ResponsiveSelect
                  id="drop-power-unit"
                  value={powerUnit}
                  options={POWER_UNITS}
                  onChange={changePowerUnit}
                  ariaLabel="Единица за мощност"
                  pickerTitle="Единица за мощност"
                  minWidth={160}
                  className="compact-select-control"
                >
                  <input
                    id="drop-power"
                    type="text"
                    inputMode="decimal"
                    value={power}
                    onChange={(event) => setPower(event.target.value)}
                  />
                </ResponsiveSelect>
              </div>
            )}

            <NumericField
              id="drop-voltage"
              label="Напрежение"
              value={voltage}
              onChange={setVoltage}
              unit="V"
            />
            <NumericField
              id="drop-cosphi"
              label="cos φ"
              value={cosPhi}
              onChange={setCosPhi}
            />
            <NumericField
              id="drop-length"
              label="Еднопосочна физическа дължина на трасето"
              value={length}
              onChange={setLength}
              unit="m"
            />

            <SelectField
              id="drop-material"
              label="Материал"
              value={material}
              options={MATERIAL_OPTIONS}
              onChange={setMaterial}
              pickerTitle="Избери материал"
            />
            <SelectField
              id="drop-section"
              label="Сечение"
              value={section}
              options={SECTION_OPTIONS}
              onChange={setSection}
              pickerTitle="Избери сечение"
            />
          </div>

          <div id="drop-validation" className="validation-message" aria-live="polite">
            {firstError?.message ?? ""}
          </div>
        </form>

        <aside className="result-panel" aria-live="polite">
          <span className="result-kicker">Пад на напрежение</span>
          <div className="result-main">
            <span id="drop-result-volts" className="result-number">
              {hasValidResult ? formatNumber(result.voltageDrop, 2) : "—"}
            </span>
            <span className="result-unit">V</span>
          </div>

          <div className="result-secondary">
            <span id="drop-result-percent">
              {hasValidResult ? `${formatNumber(result.percent, 2)}%` : "—"}
            </span>
            <span id="drop-status" className={`status-pill ${status.className}`}>
              {status.label}
            </span>
          </div>

          <div className="result-meta">
            <div id="drop-result-current">
              Изчислен ток: {hasValidResult ? `${formatNumber(result.current, 2)} A` : "—"}
            </div>
            <div id="drop-summary">
              {hasValidResult
                ? `${getMaterialLabel(material)} · ${formatNumber(sectionResult.value, 1)} mm² · ${formatNumber(lengthResult.value, 1)} m еднопосочно`
                : "—"}
            </div>
          </div>

          <details className="formula-box">
            <summary>Как е изчислено?</summary>
            <div id="drop-formula" className="formula-content">
              {hasValidResult && (
                <VoltageDropFormula
                  calculationInput={calculationInput}
                  result={result}
                />
              )}
            </div>
          </details>
        </aside>
      </div>

      <section className="comparison-panel">
        <div className="comparison-heading">
          <div>
            <h3>Сравнение на сечения</h3>
            <p>Същият товар и дължина, различно сечение.</p>
          </div>
          <span className="limit-chip">ориентир: 3%</span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Сечение</th>
                <th>ΔU</th>
                <th>ΔU %</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody id="drop-comparison-body">
              {comparisonSections.map((candidateSection) => {
                const candidateResult = calculateVoltageDrop({
                  ...calculationInput,
                  sectionMm2: candidateSection
                });
                const rowStatus = getVoltageDropStatus(candidateResult.percent);
                const isSelected = candidateSection === sectionResult.value;

                return (
                  <tr
                    key={candidateSection}
                    data-section={candidateSection}
                    className={isSelected ? "is-selected" : ""}
                    role="button"
                    tabIndex={0}
                    aria-label={`Избери сечение ${formatNumber(candidateSection, 1)} mm²`}
                    onClick={() => setSection(String(candidateSection))}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      setSection(String(candidateSection));
                    }}
                  >
                    <td data-label="Сечение"><strong>{formatNumber(candidateSection, 1)} mm²</strong></td>
                    <td data-label="ΔU">{formatNumber(candidateResult.voltageDrop, 2)} V</td>
                    <td data-label="ΔU %">{formatNumber(candidateResult.percent, 2)}%</td>
                    <td data-label="Статус">
                      <span className={`status-pill ${rowStatus.className}`}>{rowStatus.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="note-panel">
        <strong>Важно</strong>
        <p>
          Ориентировъчен модел за установен синусоидален AC режим и балансиран трифазен товар.
          При трифазна система въведеното напрежение е линейното (междуфазното) напрежение.
          Дължината е еднопосочният физически маршрут; факторът 2 при еднофазна система отчита
          отиващия и връщащия проводник. Използва се само съпротивлението при 20°C — без
          реактивно съпротивление и без температурна компенсация. Не се проверяват допустим ток,
          начин на полагане, групиране, защити или други проектни условия.
        </p>
      </div>
    </section>
  );
}

function SegmentedButtons({ label, ariaLabel, value, options, onChange }) {
  return (
    <div className="field-group">
      <span className="field-label">{label}</span>
      <div className="segmented-control" role="group" aria-label={ariaLabel}>
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              className={`segment${isActive ? " is-active" : ""}`}
              aria-pressed={isActive}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NumericField({ id, label, value, onChange, unit }) {
  return (
    <label className="field" htmlFor={id}>
      <span className="field-label">{label}</span>
      <span className="input-wrap">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {unit && <span className="unit">{unit}</span>}
      </span>
    </label>
  );
}

function SelectField({ id, label, value, options, onChange, pickerTitle }) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>{label}</label>
      <ResponsiveSelect
        id={id}
        value={value}
        options={options}
        onChange={onChange}
        ariaLabel={label}
        pickerTitle={pickerTitle}
      />
    </div>
  );
}

function VoltageDropFormula({ calculationInput, result }) {
  const {
    inputMode,
    powerWatts,
    voltage,
    cosPhi,
    lengthMeters,
    sectionMm2,
    material,
    phases
  } = calculationInput;
  const isThreePhase = Number(phases) === 3;
  const phaseFactor = isThreePhase ? "√3" : "2";
  const materialData = CONDUCTOR_MATERIALS[material];

  return (
    <>
      {inputMode === "power" ? (
        <>
          <p>Ток от активна мощност:</p>
          <code>I = {isThreePhase ? "P / (√3 × U × cos φ)" : "P / (U × cos φ)"}</code>
          <code>
            I = {formatNumber(powerWatts, 2)} / ({isThreePhase ? "√3 × " : ""}{formatNumber(voltage, 2)} × {formatNumber(cosPhi, 2)}) = {formatNumber(result.current, 2)} A
          </code>
        </>
      ) : (
        <>
          <p>Въведен ток:</p>
          <code>I = {formatNumber(result.current, 2)} A</code>
        </>
      )}

      <p>Пад на напрежение — резистивен модел:</p>
      <code>ΔU = {phaseFactor} × I × L × (ρ / S) × cos φ</code>
      <code>
        ΔU = {phaseFactor} × {formatNumber(result.current, 2)} × {formatNumber(lengthMeters, 2)} × ({formatNumber(materialData.resistivityOhmMm2PerM, 4)} / {formatNumber(sectionMm2, 2)}) × {formatNumber(cosPhi, 2)} = {formatNumber(result.voltageDrop, 2)} V
      </code>
      <code>
        ΔU% = (ΔU / U) × 100 = ({formatNumber(result.voltageDrop, 2)} / {formatNumber(voltage, 2)}) × 100 = {formatNumber(result.percent, 2)}%
      </code>
      <p>
        <strong>Допускания:</strong> установен синусоидален AC режим; {isThreePhase && "балансиран трифазен товар; линейно (междуфазно) напрежение; "}
        еднопосочна физическа дължина; специфично съпротивление при {materialData.referenceTemperatureC}°C; без реактивно съпротивление и температурна компенсация.
      </p>
    </>
  );
}

function getMaterialLabel(material) {
  return material === "aluminum" ? "Al" : "Cu";
}

function getVoltageDropStatus(percent) {
  if (percent <= 3) return { label: "● До 3%", className: "status-ok" };
  if (percent <= 5) return { label: "● Над 3%", className: "status-warning" };
  return { label: "● Над 5%", className: "status-danger" };
}

function getComparisonSections(selectedSection) {
  const selectedIndex = STANDARD_CABLE_SECTIONS_MM2.indexOf(selectedSection);
  if (selectedIndex === -1) return [];

  const visibleCount = Math.min(5, STANDARD_CABLE_SECTIONS_MM2.length);
  const maximumStart = STANDARD_CABLE_SECTIONS_MM2.length - visibleCount;
  const start = Math.min(Math.max(selectedIndex - 2, 0), maximumStart);
  return STANDARD_CABLE_SECTIONS_MM2.slice(start, start + visibleCount);
}
