import { useState } from "react";

import {
  DEFAULT_CABLE_SECTION_MM2,
  STANDARD_CABLE_SECTIONS_MM2
} from "../../data/cable-sizes.js";
import { calculateVoltageDropRx } from "../../js/calculators/voltage-drop.js";
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

const DEFAULT_RESISTANCE_MODEL = Object.freeze({ type: "iecNormalService" });
const DEFAULT_REACTANCE_MODEL = Object.freeze({ type: "iecApproximation" });
const CALCULATION_FREQUENCY_HZ = 50;

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
      currentA: inputMode === "current" ? loadResult.value : undefined,
      activePowerW: inputMode === "power" ? loadResult.value : undefined,
      voltageV: voltageResult.value,
      cosPhi: cosPhiResult.value,
      lengthM: lengthResult.value,
      sectionMm2: sectionResult.value,
      material,
      phases,
      frequencyHz: CALCULATION_FREQUENCY_HZ,
      powerFactorDirection: "lagging",
      resistanceModel: DEFAULT_RESISTANCE_MODEL,
      reactanceModel: DEFAULT_REACTANCE_MODEL
    };
  const result = calculationInput ? calculateVoltageDropRx(calculationInput) : null;
  const hasValidResult = result && [
    result.current,
    result.voltageDrop,
    result.percent
  ].every(Number.isFinite);
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
          </div>

          <div className="result-meta voltage-drop-meta">
            <div id="drop-result-current">
              Изчислен ток: {hasValidResult ? `${formatNumber(result.current, 2)} A` : "—"}
            </div>
            <div id="drop-summary">
              {hasValidResult
                ? `${getMaterialLabel(material)} · ${formatNumber(sectionResult.value, 1)} mm² · ${formatNumber(lengthResult.value, 1)} m еднопосочно`
                : "—"}
            </div>
          </div>

          <dl className="result-values voltage-drop-details">
            <div className="result-value">
              <dt>Съпротивление R</dt>
              <dd id="drop-result-resistance">
                {hasValidResult ? `${formatNumber(result.resistanceOhmPerKm, 4)} Ω/km` : "—"}
              </dd>
            </div>
            <div className="result-value">
              <dt>Реактивност X</dt>
              <dd id="drop-result-reactance">
                {hasValidResult ? `${formatNumber(result.reactanceOhmPerKm, 2)} Ω/km` : "—"}
              </dd>
            </div>
            <div className="result-value">
              <dt>Фактор на мощността</dt>
              <dd id="drop-result-power-factor">
                {hasValidResult
                  ? `cos φ ${formatNumber(result.cosPhi, 2)} · sin φ ${formatNumber(result.sinPhi, 2)}`
                  : "—"}
              </dd>
            </div>
          </dl>

          <CalculationBasis />

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
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Сечение</th>
                <th>ΔU</th>
                <th>ΔU %</th>
              </tr>
            </thead>
            <tbody id="drop-comparison-body">
              {comparisonSections.map((candidateSection) => {
                const candidateResult = calculateVoltageDropRx({
                  ...calculationInput,
                  sectionMm2: candidateSection
                });
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="note-panel">
        <strong>Важно</strong>
        <p>Моделът приема установен синусоидален AC режим, товар в края на въведеното еднопосочно трасе и изоставащ или единичен фактор на мощността. При 3-фазна система товарът е балансиран, а напрежението е линейно RMS.</p>
        <p>Съпротивлението е инженерната апроксимация на IEC Annex G за нормален режим, а реактивността е приблизителна стойност X = 0,08 Ω/km при 50 Hz.</p>
        <p>Не се проверяват допустим ток на кабела, начин на полагане, групиране, защита, късо съединение, пускане на двигател, хармоници или съответствие с български/BDS изисквания.</p>
      </div>
    </section>
  );
}

function CalculationBasis() {
  return (
    <section className="calculation-basis" aria-labelledby="drop-basis-title">
      <h3 id="drop-basis-title">Основа на изчислението</h3>
      <dl>
        <div>
          <dt>Съпротивление</dt>
          <dd>IEC 60364-5-52 Annex G — инженерна апроксимация за нормален режим</dd>
        </div>
        <div>
          <dt>Реактивност</dt>
          <dd>X = 0,08 Ω/km — приблизителна стойност по IEC/Schneider</dd>
        </div>
        <div>
          <dt>Честота</dt>
          <dd>50 Hz</dd>
        </div>
        <div>
          <dt>Фактор на мощността</dt>
          <dd>Въведеният cos φ; изоставащ/индуктивен или единичен товар</dd>
        </div>
      </dl>
      <small>Инженерни източници: IEC 60364-5-52:2009, Annex G; Schneider Electrical Installation Guide, Chapter G.</small>
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
    activePowerW,
    voltageV,
    phases
  } = calculationInput;
  const isThreePhase = Number(phases) === 3;
  const phaseFactor = isThreePhase ? "√3" : "2";

  return (
    <ol className="formula-steps">
      {inputMode === "power" ? (
        <li>
          <strong>Ток от активна електрическа мощност</strong>
          <code>I = {isThreePhase ? "P / (√3 × U × cos φ)" : "P / (U × cos φ)"}</code>
          <code>
            I = {formatNumber(activePowerW, 2)} / ({isThreePhase ? "√3 × " : ""}{formatNumber(voltageV, 2)} × {formatNumber(result.cosPhi, 2)}) = {formatNumber(result.current, 2)} A
          </code>
        </li>
      ) : null}

      <li>
        <strong>Фактор на мощността</strong>
        <code>cos φ = {formatNumber(result.cosPhi, 4)}{` · `}sin φ = {formatNumber(result.sinPhi, 4)}</code>
      </li>

      <li>
        <strong>Използвано съпротивление</strong>
        <code>R = {formatNumber(result.resistanceOhmPerKm, 4)} Ω/km</code>
        <p>IEC Annex G — инженерна апроксимация за нормален режим.</p>
      </li>

      <li>
        <strong>Използвана реактивност</strong>
        <code>X = {formatNumber(result.reactanceOhmPerKm, 2)} Ω/km</code>
        <p>Приблизителна IEC/Schneider стойност при липса на точни кабелни данни.</p>
      </li>

      <li>
        <strong>Резистивна съставка</strong>
        <code>ΔU<sub>R</sub> = {phaseFactor} × I × L × R × cos φ</code>
        <code>ΔU<sub>R</sub> = {phaseFactor} × {formatNumber(result.current, 4)} × {formatNumber(result.lengthKm, 4)} × {formatNumber(result.resistanceOhmPerKm, 4)} × {formatNumber(result.cosPhi, 4)} = {formatNumber(result.resistiveVoltageDrop, 4)} V</code>
      </li>

      <li>
        <strong>Реактивна съставка</strong>
        <code>ΔU<sub>X</sub> = {phaseFactor} × I × L × X × sin φ</code>
        <code>ΔU<sub>X</sub> = {phaseFactor} × {formatNumber(result.current, 4)} × {formatNumber(result.lengthKm, 4)} × {formatNumber(result.reactanceOhmPerKm, 4)} × {formatNumber(result.sinPhi, 4)} = {formatNumber(result.reactiveVoltageDrop, 4)} V</code>
      </li>

      <li>
        <strong>Общ пад на напрежение</strong>
        <code>ΔU = ΔU<sub>R</sub> + ΔU<sub>X</sub> = {formatNumber(result.resistiveVoltageDrop, 4)} + {formatNumber(result.reactiveVoltageDrop, 4)} = {formatNumber(result.voltageDrop, 4)} V</code>
      </li>

      <li>
        <strong>Процентен пад</strong>
        <code>ΔU% = 100 × ΔU / U = 100 × {formatNumber(result.voltageDrop, 4)} / {formatNumber(voltageV, 2)} = {formatNumber(result.percent, 4)}%</code>
      </li>
    </ol>
  );
}

function getMaterialLabel(material) {
  return material === "aluminum" ? "Al" : "Cu";
}

function getComparisonSections(selectedSection) {
  const selectedIndex = STANDARD_CABLE_SECTIONS_MM2.indexOf(selectedSection);
  if (selectedIndex === -1) return [];

  const visibleCount = Math.min(5, STANDARD_CABLE_SECTIONS_MM2.length);
  const maximumStart = STANDARD_CABLE_SECTIONS_MM2.length - visibleCount;
  const start = Math.min(Math.max(selectedIndex - 2, 0), maximumStart);
  return STANDARD_CABLE_SECTIONS_MM2.slice(start, start + visibleCount);
}
