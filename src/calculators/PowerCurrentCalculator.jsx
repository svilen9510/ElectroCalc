import { useState } from "react";

import { calculateCurrent } from "../../js/calculators/power-current.js";
import { phaseLabel } from "../../js/utils/electrical.js";
import { formatNumber } from "../../js/utils/format.js";
import { convertUnit } from "../../js/utils/units.js";
import { positiveNumber, rangeNumber } from "../../js/utils/validation.js";
import ResponsiveSelect from "../components/ResponsiveSelect.jsx";

const POWER_UNITS = [
  { value: "kW", label: "kW" },
  { value: "W", label: "W" }
];

export default function PowerCurrentCalculator({ navigateHome }) {
  const [power, setPower] = useState("5.5");
  const [powerUnit, setPowerUnit] = useState("kW");
  const [voltage, setVoltage] = useState("230");
  const [cosPhi, setCosPhi] = useState("1");
  const [phases, setPhases] = useState(1);

  const normalizedPowerWatts = convertUnit(
    Number(power),
    powerUnit,
    "W",
    "power"
  );
  const powerResult = positiveNumber(normalizedPowerWatts, "Мощността");
  const voltageResult = positiveNumber(voltage, "Напрежението");
  const cosPhiResult = rangeNumber(cosPhi, "cos φ", 0.01, 1);
  const firstError = [powerResult, voltageResult, cosPhiResult]
    .find((result) => !result.ok);
  const current = firstError
    ? null
    : calculateCurrent({
      powerWatts: powerResult.value,
      voltage: voltageResult.value,
      cosPhi: cosPhiResult.value,
      phases
    });
  const hasValidResult = Number.isFinite(current);

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

  function changePhases(nextPhases) {
    setPhases(nextPhases);

    if (nextPhases === 1 && Number(voltage) === 400) setVoltage("230");
    if (nextPhases === 3 && Number(voltage) === 230) setVoltage("400");
  }

  const displayPower = hasValidResult
    ? powerUnit === "kW"
      ? `${formatNumber(Number(power), 2)} kW`
      : `${formatNumber(Number(power), 0)} W`
    : null;

  return (
    <section id="view-power" className="view is-active" data-view="power">
      <div className="section-heading">
        <div>
          <button className="back-link" type="button" onClick={navigateHome}>
            ← Начало
          </button>
          <h2>Мощност и ток</h2>
          <p>Изчисли тока по зададена активна мощност.</p>
        </div>
      </div>

      <div className="calculator-layout">
        <form className="calc-panel" noValidate onSubmit={(event) => event.preventDefault()}>
          <div className="field-group">
            <span className="field-label">Система</span>
            <div className="segmented-control" role="group" aria-label="Тип система">
              {[1, 3].map((phaseCount) => (
                <button
                  key={phaseCount}
                  type="button"
                  className={`segment${phases === phaseCount ? " is-active" : ""}`}
                  aria-pressed={phases === phaseCount}
                  onClick={() => changePhases(phaseCount)}
                >
                  {phaseCount}-фазно
                </button>
              ))}
            </div>
          </div>

          <div className="fields-grid">
            <div className="field">
              <label className="field-label" htmlFor="power-value">Мощност</label>
              <ResponsiveSelect
                id="power-unit"
                value={powerUnit}
                options={POWER_UNITS}
                onChange={changePowerUnit}
                ariaLabel="Единица за мощност"
                pickerTitle="Единица за мощност"
                minWidth={160}
                className="compact-select-control"
              >
                <input
                  id="power-value"
                  type="text"
                  inputMode="decimal"
                  value={power}
                  onChange={(event) => setPower(event.target.value)}
                />
              </ResponsiveSelect>
            </div>

            <label className="field">
              <span className="field-label">Напрежение</span>
              <span className="input-wrap">
                <input
                  type="text"
                  inputMode="decimal"
                  value={voltage}
                  onChange={(event) => setVoltage(event.target.value)}
                />
                <span className="unit">V</span>
              </span>
            </label>

            <label className="field">
              <span className="field-label">cos φ</span>
              <span className="input-wrap">
                <input
                  type="text"
                  inputMode="decimal"
                  value={cosPhi}
                  onChange={(event) => setCosPhi(event.target.value)}
                />
              </span>
            </label>
          </div>

          <div className="validation-message" aria-live="polite">
            {firstError?.message ?? ""}
          </div>
        </form>

        <aside className="result-panel" aria-live="polite">
          <span className="result-kicker">Изчислен ток</span>
          <div className="result-main">
            <span className="result-number">{hasValidResult ? formatNumber(current, 2) : "—"}</span>
            <span className="result-unit">A</span>
          </div>
          <div className="result-meta">
            <span>
              {hasValidResult
                ? `${displayPower} · ${formatNumber(voltageResult.value, 0)} V · ${phaseLabel(phases)}`
                : "—"}
            </span>
          </div>

          <details className="formula-box">
            <summary>Как е изчислено?</summary>
            <div className="formula-content">
              {hasValidResult && (
                phases === 3
                  ? (
                    <>
                      <p>Трифазна система:</p>
                      <code>I = P / (√3 × U × cosφ)</code>
                      <code>
                        I = {formatNumber(powerResult.value, 0)} / (√3 × {formatNumber(voltageResult.value, 0)} × {formatNumber(cosPhiResult.value, 2)}) = {formatNumber(current, 2)} A
                      </code>
                    </>
                  )
                  : (
                    <>
                      <p>Еднофазна система:</p>
                      <code>I = P / (U × cosφ)</code>
                      <code>
                        I = {formatNumber(powerResult.value, 0)} / ({formatNumber(voltageResult.value, 0)} × {formatNumber(cosPhiResult.value, 2)}) = {formatNumber(current, 2)} A
                      </code>
                    </>
                  )
              )}
            </div>
          </details>
        </aside>
      </div>
    </section>
  );
}
