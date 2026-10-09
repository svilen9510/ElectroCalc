import { useState } from "react";

import {
  calculateAcLoad,
  calculateMotorLoad
} from "../../js/calculators/power-current.js";
import { phaseLabel } from "../../js/utils/electrical.js";
import { formatNumber } from "../../js/utils/format.js";
import { convertUnit } from "../../js/utils/units.js";
import { positiveNumber } from "../../js/utils/validation.js";
import ResponsiveSelect from "../components/ResponsiveSelect.jsx";

const POWER_UNITS = [
  { value: "kW", label: "kW" },
  { value: "W", label: "W" }
];

const LOAD_MODES = [
  { value: "general", label: "Общ товар" },
  { value: "motor", label: "Електродвигател" }
];

const PHASE_OPTIONS = [
  { value: "1", label: "1-фазно" },
  { value: "3", label: "3-фазно" }
];

export default function PowerCurrentCalculator({ navigateHome }) {
  const [loadMode, setLoadMode] = useState("general");
  const [phases, setPhases] = useState(1);
  const [voltage, setVoltage] = useState("230");
  const [cosPhi, setCosPhi] = useState("1");
  const [generalPower, setGeneralPower] = useState("5.5");
  const [generalPowerUnit, setGeneralPowerUnit] = useState("kW");
  const [motorShaftPower, setMotorShaftPower] = useState("5.5");
  const [motorPowerUnit, setMotorPowerUnit] = useState("kW");
  const [efficiencyPercent, setEfficiencyPercent] = useState("");

  const isMotor = loadMode === "motor";
  const selectedPower = isMotor ? motorShaftPower : generalPower;
  const selectedPowerUnit = isMotor ? motorPowerUnit : generalPowerUnit;
  const normalizedPowerWatts = convertUnit(
    Number(selectedPower),
    selectedPowerUnit,
    "W",
    "power"
  );
  const powerResult = positiveNumber(
    normalizedPowerWatts,
    isMotor ? "Мощността на вала" : "Активната мощност"
  );
  const voltageResult = positiveNumber(voltage, "Напрежението");
  const cosPhiResult = positiveNumberAtMost(cosPhi, "cos φ", 1);
  const efficiencyResult = isMotor
    ? positiveNumberAtMost(efficiencyPercent, "Ефективността η", 100, "%")
    : { ok: true, value: null };
  const firstError = [
    powerResult,
    voltageResult,
    cosPhiResult,
    efficiencyResult
  ].find((candidate) => !candidate.ok);

  const result = firstError
    ? null
    : isMotor
      ? calculateMotorLoad({
        shaftPowerWatts: powerResult.value,
        efficiency: efficiencyResult.value / 100,
        voltage: voltageResult.value,
        cosPhi: cosPhiResult.value,
        phases
      })
      : calculateAcLoad({
        activePowerWatts: powerResult.value,
        voltage: voltageResult.value,
        cosPhi: cosPhiResult.value,
        phases
      });
  const validationMessage = firstError?.message ?? (
    result ? "" : "Въведените стойности не могат да бъдат изчислени."
  );

  function changePhases(nextPhases) {
    setPhases(nextPhases);

    if (nextPhases === 1 && Number(voltage) === 400) setVoltage("230");
    if (nextPhases === 3 && Number(voltage) === 230) setVoltage("400");
  }

  function changePowerUnit(mode, nextUnit) {
    const currentValue = mode === "motor" ? motorShaftPower : generalPower;
    const currentUnit = mode === "motor" ? motorPowerUnit : generalPowerUnit;
    if (nextUnit === currentUnit) return;

    if (currentValue !== "") {
      const convertedPower = convertUnit(
        Number(currentValue),
        currentUnit,
        nextUnit,
        "power"
      );

      if (convertedPower !== null) {
        if (mode === "motor") {
          setMotorShaftPower(String(convertedPower));
        } else {
          setGeneralPower(String(convertedPower));
        }
      }
    }

    if (mode === "motor") {
      setMotorPowerUnit(nextUnit);
    } else {
      setGeneralPowerUnit(nextUnit);
    }
  }

  return (
    <section id="view-power" className="view is-active" data-view="power">
      <div className="section-heading">
        <div>
          <button className="back-link" type="button" onClick={navigateHome}>
            ← Начало
          </button>
          <h2>Мощност и ток</h2>
          <p>AC изчисления за общ електрически товар и електродвигател.</p>
        </div>
      </div>

      <div className="calculator-layout">
        <form className="calc-panel" noValidate onSubmit={(event) => event.preventDefault()}>
          <SegmentedButtons
            label="Тип товар"
            ariaLabel="Тип товар"
            value={loadMode}
            options={LOAD_MODES}
            onChange={setLoadMode}
          />

          <SegmentedButtons
            label="Система"
            ariaLabel="Тип система"
            value={String(phases)}
            options={PHASE_OPTIONS}
            onChange={(value) => changePhases(Number(value))}
          />

          <div className="fields-grid">
            {isMotor ? (
              <PowerInput
                id="motor-shaft-power"
                unitId="motor-power-unit"
                label="Номинална механична мощност на вала"
                value={motorShaftPower}
                unit={motorPowerUnit}
                unitAriaLabel="Единица за мощност на вала"
                onValueChange={setMotorShaftPower}
                onUnitChange={(nextUnit) => changePowerUnit("motor", nextUnit)}
              />
            ) : (
              <PowerInput
                id="general-active-power"
                unitId="general-power-unit"
                label="Активна мощност P"
                value={generalPower}
                unit={generalPowerUnit}
                unitAriaLabel="Единица за активна мощност"
                onValueChange={setGeneralPower}
                onUnitChange={(nextUnit) => changePowerUnit("general", nextUnit)}
              />
            )}

            <NumericField
              id="power-voltage"
              label="Напрежение"
              value={voltage}
              onChange={setVoltage}
              unit="V"
            />

            <NumericField
              id="power-cosphi"
              label="cos φ"
              value={cosPhi}
              onChange={setCosPhi}
            />

            {isMotor && (
              <NumericField
                id="motor-efficiency"
                label="Ефективност η"
                value={efficiencyPercent}
                onChange={setEfficiencyPercent}
                unit="%"
              />
            )}
          </div>

          {isMotor && (
            <p className="field-help">
              Мощността е механична мощност на вала. Използвайте η и cos φ от табелката или производителя, когато са налични.
            </p>
          )}

          <PowerFactorHelp />

          <div className="validation-message" aria-live="polite">
            {validationMessage}
          </div>
        </form>

        <PowerResults
          result={result}
          phases={phases}
          voltage={voltageResult.ok ? voltageResult.value : null}
        />
      </div>

      <PowerAssumptions isMotor={isMotor} />
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

function PowerInput({
  id,
  unitId,
  label,
  value,
  unit,
  unitAriaLabel,
  onValueChange,
  onUnitChange
}) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>{label}</label>
      <ResponsiveSelect
        id={unitId}
        value={unit}
        options={POWER_UNITS}
        onChange={onUnitChange}
        ariaLabel={unitAriaLabel}
        pickerTitle={unitAriaLabel}
        minWidth={160}
        className="compact-select-control"
      >
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
        />
      </ResponsiveSelect>
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

function PowerFactorHelp() {
  return (
    <details className="reference-help">
      <summary>Референтни стойности за cos φ</summary>
      <div className="reference-help-content">
        <ul>
          <li>Резистивен нагревател, бойлер или класически нагревателен товар: приблизително 1,00.</li>
          <li>Електрическа фурна или котлони с резистивни нагреватели: приблизително 1,00.</li>
          <li>Електродвигател: използвайте стойността от табелката или производителя.</li>
          <li>LED или електронен товар: използвайте техническата документация.</li>
          <li>Смесен товар или контактна група: няма универсална стойност.</li>
        </ul>
        <p>Стойностите са само ориентировъчни, а не нормативни константи.</p>
      </div>
    </details>
  );
}

function PowerAssumptions({ isMotor }) {
  return (
    <div className="note-panel">
      <strong>Допускания</strong>
      <p>
        Моделът е за синусоидален установен AC режим. При еднофазна система U е RMS захранващото
        напрежение. При трифазна система се приема балансиран товар, а U е RMS линейното напрежение.
        cos φ е факторът на мощността, използван в модела.
      </p>
      <p>
        {isMotor
          ? "Въведената номинална мощност е механичната изходна мощност на вала. За η и cos φ използвайте данните от табелката или производителя, когато са налични. Изчисленият ток може да се различава от тока на табелката според реалния работен режим. Не се моделира пусков ток."
          : "Въведеното P е активната електрическа входна мощност."}
        {" "}Моделът не включва хармоници, VFD поведение, оразмеряване на кабели, избор на защити или проверка за нормативно съответствие.
      </p>
    </div>
  );
}

function PowerResults({ result, phases, voltage }) {
  return (
    <aside className="result-panel" aria-live="polite">
      <span className="result-kicker">Изчислен ток I</span>
      <div className="result-main">
        <span className="result-number">
          {result ? formatNumber(result.currentAmps, 2) : "—"}
        </span>
        <span className="result-unit">A</span>
      </div>

      <div className="result-context">
        {result && Number.isFinite(voltage)
          ? `${formatNumber(voltage, 0)} V · ${phaseLabel(phases)}`
          : "—"}
      </div>

      {result && <ResultValues result={result} />}

      <details className="formula-box">
        <summary>Как е изчислено?</summary>
        <div className="formula-content">
          {result && <PowerFormula result={result} />}
        </div>
      </details>
    </aside>
  );
}

function ResultValues({ result }) {
  const values = result.mode === "motor"
    ? [
      ["Механична мощност на вала", formatPower(result.shaftPowerWatts, "W", "kW")],
      ["Активна електрическа входна мощност Pвх", formatPower(result.electricalInputPowerWatts, "W", "kW")],
      ["Привидна мощност S", formatPower(result.apparentPowerVoltAmps, "VA", "kVA")],
      ["Реактивна мощност Q", formatPower(result.reactivePowerVars, "var", "kvar")],
      ["cos φ", formatNumber(result.cosPhi, 2)],
      ["Ефективност η", `${formatNumber(result.efficiency * 100, 2)}%`]
    ]
    : [
      ["Активна мощност P", formatPower(result.activePowerWatts, "W", "kW")],
      ["Привидна мощност S", formatPower(result.apparentPowerVoltAmps, "VA", "kVA")],
      ["Реактивна мощност Q", formatPower(result.reactivePowerVars, "var", "kvar")],
      ["cos φ", formatNumber(result.cosPhi, 2)]
    ];

  return (
    <dl className="result-values">
      {values.map(([label, value]) => (
        <div className="result-value" key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PowerFormula({ result }) {
  const isMotor = result.mode === "motor";
  const activePowerSymbol = isMotor ? "Pвх" : "P";
  const currentFormula = result.phases === 3
    ? "I = S / (√3 × U)"
    : "I = S / U";
  const currentSubstitution = result.phases === 3
    ? `I = ${formatNumber(result.apparentPowerVoltAmps, 2)} / (√3 × ${formatNumber(result.voltage, 2)}) = ${formatNumber(result.currentAmps, 2)} A`
    : `I = ${formatNumber(result.apparentPowerVoltAmps, 2)} / ${formatNumber(result.voltage, 2)} = ${formatNumber(result.currentAmps, 2)} A`;
  const activePowerWatts = isMotor
    ? result.electricalInputPowerWatts
    : result.activePowerWatts;

  return (
    <ol className="formula-steps">
      {isMotor && (
        <FormulaStep
          title="Електрическа входна мощност"
          formula="Pвх = Pвал / η"
          substitution={`Pвх = ${formatNumber(result.shaftPowerWatts, 2)} / ${formatNumber(result.efficiency, 2)} = ${formatNumber(result.electricalInputPowerWatts, 2)} W`}
        />
      )}
      <FormulaStep
        title="Привидна мощност"
        formula={`S = ${activePowerSymbol} / cos φ`}
        substitution={`S = ${formatNumber(activePowerWatts, 2)} / ${formatNumber(result.cosPhi, 2)} = ${formatNumber(result.apparentPowerVoltAmps, 2)} VA`}
      />
      <FormulaStep
        title="Реактивна мощност"
        formula={`Q = ${activePowerSymbol} × tan(arccos(cos φ))`}
        substitution={`Q = ${formatNumber(activePowerWatts, 2)} × tan(arccos(${formatNumber(result.cosPhi, 2)})) = ${formatNumber(result.reactivePowerVars, 2)} var`}
      />
      <FormulaStep
        title={result.phases === 3 ? "Ток — балансирана трифазна система" : "Ток — еднофазна система"}
        formula={currentFormula}
        substitution={currentSubstitution}
      />
    </ol>
  );
}

function FormulaStep({ title, formula, substitution }) {
  return (
    <li>
      <strong>{title}</strong>
      <code>
        <span>{formula}</span>
        <span>{substitution}</span>
      </code>
    </li>
  );
}

function positiveNumberAtMost(value, label, maximum, unit = "") {
  const positiveResult = positiveNumber(value, label);
  if (!positiveResult.ok) return positiveResult;

  if (positiveResult.value > maximum) {
    return {
      ok: false,
      message: `${label} трябва да е най-много ${maximum}${unit}.`
    };
  }

  return positiveResult;
}

function formatPower(value, baseUnit, kiloUnit) {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return `0 ${baseUnit}`;
  if (Math.abs(value) >= 1000) return `${formatNumber(value / 1000, 2)} ${kiloUnit}`;
  return `${formatNumber(value, 2)} ${baseUnit}`;
}
