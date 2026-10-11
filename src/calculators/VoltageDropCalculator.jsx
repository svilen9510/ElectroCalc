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

const RESISTANCE_BASIS_OPTIONS = [
  { value: "iecNormalService", label: "IEC апроксимация за нормален режим" },
  { value: "temperatureCalculated", label: "Изчисление по температура" },
  { value: "manufacturer", label: "Данни от производител" }
];

const RESISTANCE_KIND_OPTIONS = [
  { value: "ac", label: "AC" },
  { value: "dc", label: "DC" }
];

const REACTANCE_BASIS_OPTIONS = [
  { value: "iecApproximation", label: "IEC/Schneider апроксимация" },
  { value: "manufacturer", label: "Данни от производител" },
  { value: "ignored", label: "Без реактивна съставка (X = 0)" }
];

const DEFAULT_RESISTANCE_MODEL = Object.freeze({ type: "iecNormalService" });
const DEFAULT_REACTANCE_MODEL = Object.freeze({ type: "iecApproximation" });
const CALCULATION_FREQUENCY_HZ = 50;
const USER_SUPPLIED_MANUFACTURER_SOURCE_ID = "user-supplied-manufacturer-data";

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
  const [resistanceBasis, setResistanceBasis] = useState(DEFAULT_RESISTANCE_MODEL.type);
  const [conductorTemperature, setConductorTemperature] = useState("20");
  const [manufacturerResistance, setManufacturerResistance] = useState("");
  const [manufacturerResistanceKind, setManufacturerResistanceKind] = useState("ac");
  const [manufacturerResistanceTemperature, setManufacturerResistanceTemperature] = useState("");
  const [manufacturerResistanceFrequency, setManufacturerResistanceFrequency] = useState("");
  const [reactanceBasis, setReactanceBasis] = useState(DEFAULT_REACTANCE_MODEL.type);
  const [manufacturerReactance, setManufacturerReactance] = useState("");

  const normalizedPowerWatts = inputMode === "power"
    ? convertUnit(Number(power), powerUnit, "W", "power")
    : null;
  const loadResult = inputMode === "power"
    ? positiveNumber(normalizedPowerWatts, "Мощността")
    : positiveNumber(current, "Токът");
  const voltageResult = positiveNumber(voltage, "Напрежението");
  const cosPhiResult = rangeNumber(cosPhi, "cos φ", 0.01, 1);
  const lengthResult = positiveNumber(length, "Дължината на трасето");
  const sectionResult = positiveNumber(section, "Сечението");
  const temperatureResult = resistanceBasis === "temperatureCalculated"
    ? finiteNumber(conductorTemperature, "Температурата на проводника")
    : validUnusedValue();
  const manufacturerResistanceResult = resistanceBasis === "manufacturer"
    ? positiveNumber(manufacturerResistance, "Съпротивлението R")
    : validUnusedValue();
  const resistanceTemperatureResult = resistanceBasis === "manufacturer"
    ? optionalFiniteNumber(
      manufacturerResistanceTemperature,
      "Референтната температура"
    )
    : validUnusedValue();
  const resistanceFrequencyResult = resistanceBasis === "manufacturer"
    ? optionalPositiveNumber(
      manufacturerResistanceFrequency,
      "Референтната честота"
    )
    : validUnusedValue();
  const manufacturerReactanceResult = reactanceBasis === "manufacturer"
    ? nonNegativeNumber(manufacturerReactance, "Реактивността X")
    : validUnusedValue();
  const firstError = [
    loadResult,
    voltageResult,
    cosPhiResult,
    lengthResult,
    sectionResult,
    temperatureResult,
    manufacturerResistanceResult,
    resistanceTemperatureResult,
    resistanceFrequencyResult,
    manufacturerReactanceResult
  ].find((result) => !result.ok);

  const resistanceModel = buildResistanceModel({
    resistanceBasis,
    conductorTemperatureC: temperatureResult.value,
    manufacturerResistanceOhmPerKm: manufacturerResistanceResult.value,
    manufacturerResistanceKind,
    referenceTemperatureC: resistanceTemperatureResult.value,
    referenceFrequencyHz: resistanceFrequencyResult.value
  });
  const reactanceModel = buildReactanceModel({
    reactanceBasis,
    manufacturerReactanceOhmPerKm: manufacturerReactanceResult.value
  });

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
      resistanceModel,
      reactanceModel
    };
  const result = calculationInput ? calculateVoltageDropRx(calculationInput) : null;
  const hasValidResult = result && [
    result.current,
    result.voltageDrop,
    result.percent
  ].every(Number.isFinite);
  const comparisonUnavailable = resistanceBasis === "manufacturer" || reactanceBasis === "manufacturer";
  const comparisonSections = hasValidResult && !comparisonUnavailable
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
              { value: "1", label: "Еднофазна" },
              { value: "3", label: "Балансирана трифазна" }
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
              label="Дължина на трасето (еднопосочна)"
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

          <AdvancedSettings
            resistanceBasis={resistanceBasis}
            onResistanceBasisChange={setResistanceBasis}
            conductorTemperature={conductorTemperature}
            onConductorTemperatureChange={setConductorTemperature}
            manufacturerResistance={manufacturerResistance}
            onManufacturerResistanceChange={setManufacturerResistance}
            manufacturerResistanceKind={manufacturerResistanceKind}
            onManufacturerResistanceKindChange={setManufacturerResistanceKind}
            manufacturerResistanceTemperature={manufacturerResistanceTemperature}
            onManufacturerResistanceTemperatureChange={setManufacturerResistanceTemperature}
            manufacturerResistanceFrequency={manufacturerResistanceFrequency}
            onManufacturerResistanceFrequencyChange={setManufacturerResistanceFrequency}
            reactanceBasis={reactanceBasis}
            onReactanceBasisChange={setReactanceBasis}
            manufacturerReactance={manufacturerReactance}
            onManufacturerReactanceChange={setManufacturerReactance}
          />

          <div id="drop-validation" className="validation-message" aria-live="polite">
            {firstError?.message ?? (calculationInput && !result
              ? "Разширените данни не могат да бъдат използвани с избрания модел."
              : "")}
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
              {inputMode === "power" ? "Изчислен ток" : "Използван ток"}: {hasValidResult ? `${formatNumber(result.current, 2)} A` : "—"}
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

          <CalculationBasis
            resistanceModel={resistanceModel}
            reactanceModel={reactanceModel}
            result={hasValidResult ? result : null}
          />

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

        {comparisonUnavailable ? (
          <p id="drop-comparison-unavailable" className="comparison-unavailable">
            Сравнението на сечения не е налично при въведени данни от производител,
            защото R/X се отнасят за конкретен кабел или конструкция.
          </p>
        ) : (
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
        )}
      </section>

      <div className="note-panel">
        <strong>Допускания и ограничения</strong>
        <p>Калкулаторът моделира установен синусоидален AC пад на напрежение със съпротивление, реактивност, въведения cos φ и избраните инженерни основи. Дължината на трасето е еднопосочна, а товарът е съсредоточен в края му.</p>
        <p>При балансирана трифазна система напрежението е линейно RMS. Факторът на мощността е изоставащ или единичен, а честотата на модела е 50 Hz.</p>
        <p>Не се проверяват допустим ток на кабела, начин на полагане, групиране, защита, късо съединение, пускане на двигател, хармоници или съответствие с български/BDS изисквания.</p>
      </div>
    </section>
  );
}

function AdvancedSettings({
  resistanceBasis,
  onResistanceBasisChange,
  conductorTemperature,
  onConductorTemperatureChange,
  manufacturerResistance,
  onManufacturerResistanceChange,
  manufacturerResistanceKind,
  onManufacturerResistanceKindChange,
  manufacturerResistanceTemperature,
  onManufacturerResistanceTemperatureChange,
  manufacturerResistanceFrequency,
  onManufacturerResistanceFrequencyChange,
  reactanceBasis,
  onReactanceBasisChange,
  manufacturerReactance,
  onManufacturerReactanceChange
}) {
  return (
    <details className="advanced-settings">
      <summary>Разширени настройки</summary>
      <div className="advanced-settings-content">
        <fieldset className="advanced-group">
          <legend>Съпротивление R</legend>
          <SelectField
            id="drop-resistance-basis"
            label="Основа за съпротивлението"
            value={resistanceBasis}
            options={RESISTANCE_BASIS_OPTIONS}
            onChange={onResistanceBasisChange}
            pickerTitle="Избери основа за съпротивлението"
          />

          {resistanceBasis === "iecNormalService" && (
            <p className="advanced-help">
              R се определя от изчислителния модел чрез инженерната апроксимация на IEC Annex G за нормален режим.
            </p>
          )}

          {resistanceBasis === "temperatureCalculated" && (
            <div className="advanced-fields-grid">
              <NumericField
                id="drop-conductor-temperature"
                label="Температура на проводника"
                value={conductorTemperature}
                onChange={onConductorTemperatureChange}
                unit="°C"
                help="Температурата трябва да бъде зададена според реалното работно условие или инженерното допускане. 20 °C е начална референтна стойност."
              />
            </div>
          )}

          {resistanceBasis === "manufacturer" && (
            <>
              <div className="advanced-fields-grid">
                <NumericField
                  id="drop-manufacturer-resistance"
                  label="R"
                  value={manufacturerResistance}
                  onChange={onManufacturerResistanceChange}
                  unit="Ω/km"
                  help="Стойността се използва точно както е въведена, без допълнителна температурна или AC корекция."
                />
                <SelectField
                  id="drop-resistance-kind"
                  label="Вид на съпротивлението"
                  value={manufacturerResistanceKind}
                  options={RESISTANCE_KIND_OPTIONS}
                  onChange={onManufacturerResistanceKindChange}
                  pickerTitle="Избери вид на съпротивлението"
                />
                <NumericField
                  id="drop-resistance-reference-temperature"
                  label="Референтна температура (по избор)"
                  value={manufacturerResistanceTemperature}
                  onChange={onManufacturerResistanceTemperatureChange}
                  unit="°C"
                />
                <NumericField
                  id="drop-resistance-reference-frequency"
                  label="Референтна честота (по избор)"
                  value={manufacturerResistanceFrequency}
                  onChange={onManufacturerResistanceFrequencyChange}
                  unit="Hz"
                />
              </div>
              {manufacturerResistanceKind === "dc" && (
                <p id="drop-dc-resistance-disclosure" className="advanced-help">
                  Въведената DC стойност се използва без преобразуване към AC; AC корекционни ефекти не се моделират.
                </p>
              )}
              <p className="advanced-help">
                Изборът означава въведени от потребителя данни, а не потвърждение от производител.
              </p>
            </>
          )}
        </fieldset>

        <fieldset className="advanced-group">
          <legend>Реактивност X</legend>
          <SelectField
            id="drop-reactance-basis"
            label="Основа за реактивността"
            value={reactanceBasis}
            options={REACTANCE_BASIS_OPTIONS}
            onChange={onReactanceBasisChange}
            pickerTitle="Избери основа за реактивността"
          />

          {reactanceBasis === "iecApproximation" && (
            <p className="advanced-help">
              X = 0,08 Ω/km при 50 Hz — приблизителна инженерна стойност по IEC/Schneider.
            </p>
          )}

          {reactanceBasis === "manufacturer" && (
            <>
              <div className="advanced-fields-grid">
                <NumericField
                  id="drop-manufacturer-reactance"
                  label="X"
                  value={manufacturerReactance}
                  onChange={onManufacturerReactanceChange}
                  unit="Ω/km"
                  help="За Stage 3 се приемат само данни за реактивност при 50 Hz; X не се мащабира автоматично."
                />
              </div>
              <p id="drop-reactance-reference-frequency" className="advanced-help">
                Референтна честота: <strong>50 Hz</strong>
              </p>
            </>
          )}

          {reactanceBasis === "ignored" && (
            <p className="advanced-help">
              Опростено резистивно изчисление без реактивна съставка (X = 0).
            </p>
          )}
        </fieldset>

        <div className="advanced-context">
          <strong>Контекст на модела</strong>
          <span id="drop-model-frequency">Фиксирана честота: 50 Hz</span>
        </div>
      </div>
    </details>
  );
}

function CalculationBasis({ resistanceModel, reactanceModel, result }) {
  return (
    <section className="calculation-basis" aria-labelledby="drop-basis-title">
      <h3 id="drop-basis-title">Основа на изчислението</h3>
      <dl>
        <div>
          <dt>Съпротивление</dt>
          <dd>{getResistanceBasisDescription(resistanceModel, result)}</dd>
        </div>
        <div>
          <dt>Реактивност</dt>
          <dd>{getReactanceBasisDescription(reactanceModel, result)}</dd>
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
      <small>{getSourceDisclosure(resistanceModel, reactanceModel)}</small>
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

function NumericField({ id, label, value, onChange, unit, help }) {
  const helpId = help ? `${id}-help` : undefined;

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>{label}</label>
      <span className="input-wrap">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          aria-describedby={helpId}
          onChange={(event) => onChange(event.target.value)}
        />
        {unit && <span className="unit">{unit}</span>}
      </span>
      {help && <small id={helpId} className="field-help">{help}</small>}
    </div>
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
        <p>{getResistanceBasisDescription(calculationInput.resistanceModel, result)}</p>
      </li>

      <li>
        <strong>Използвана реактивност</strong>
        <code>X = {formatNumber(result.reactanceOhmPerKm, 2)} Ω/km</code>
        <p>{getReactanceBasisDescription(calculationInput.reactanceModel, result)}</p>
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

function buildResistanceModel({
  resistanceBasis,
  conductorTemperatureC,
  manufacturerResistanceOhmPerKm,
  manufacturerResistanceKind,
  referenceTemperatureC,
  referenceFrequencyHz
}) {
  if (resistanceBasis === "temperatureCalculated") {
    return {
      type: "temperatureCalculated",
      conductorTemperatureC
    };
  }

  if (resistanceBasis === "manufacturer") {
    return {
      type: "manufacturer",
      resistanceOhmPerKm: manufacturerResistanceOhmPerKm,
      resistanceKind: manufacturerResistanceKind,
      ...(referenceTemperatureC === undefined ? {} : { referenceTemperatureC }),
      ...(referenceFrequencyHz === undefined ? {} : { referenceFrequencyHz }),
      sourceId: USER_SUPPLIED_MANUFACTURER_SOURCE_ID
    };
  }

  return DEFAULT_RESISTANCE_MODEL;
}

function buildReactanceModel({ reactanceBasis, manufacturerReactanceOhmPerKm }) {
  if (reactanceBasis === "manufacturer") {
    return {
      type: "manufacturer",
      reactanceOhmPerKm: manufacturerReactanceOhmPerKm,
      referenceFrequencyHz: CALCULATION_FREQUENCY_HZ,
      sourceId: USER_SUPPLIED_MANUFACTURER_SOURCE_ID
    };
  }

  if (reactanceBasis === "ignored") return { type: "ignored" };

  return DEFAULT_REACTANCE_MODEL;
}

function getResistanceBasisDescription(resistanceModel, result) {
  if (resistanceModel.type === "temperatureCalculated") {
    const temperature = result?.conductorTemperatureC ?? resistanceModel.conductorTemperatureC;
    return Number.isFinite(temperature)
      ? `Изчислено за температура на проводника ${formatNumber(temperature, 1)} °C чрез изходните материални данни.`
      : "Изчисление според въведената температура на проводника.";
  }

  if (resistanceModel.type === "manufacturer") {
    const resistance = result?.resistanceOhmPerKm ?? resistanceModel.resistanceOhmPerKm;
    const resistanceText = Number.isFinite(resistance)
      ? `R = ${formatNumber(resistance, 4)} Ω/km`
      : "въведена стойност R";
    const metadata = [
      resistanceModel.resistanceKind?.toUpperCase(),
      Number.isFinite(resistanceModel.referenceTemperatureC)
        ? `${formatNumber(resistanceModel.referenceTemperatureC, 1)} °C`
        : null,
      Number.isFinite(resistanceModel.referenceFrequencyHz)
        ? `${formatNumber(resistanceModel.referenceFrequencyHz, 1)} Hz`
        : null
    ].filter(Boolean).join(", ");

    return `Данни, въведени от потребителя: ${resistanceText}${metadata ? ` (${metadata})` : ""}; стойността се използва без корекция.`;
  }

  return "IEC 60364-5-52 Annex G — инженерна апроксимация за нормален режим";
}

function getReactanceBasisDescription(reactanceModel, result) {
  if (reactanceModel.type === "manufacturer") {
    const reactance = result?.reactanceOhmPerKm ?? reactanceModel.reactanceOhmPerKm;
    return Number.isFinite(reactance)
      ? `Данни, въведени от потребителя: X = ${formatNumber(reactance, 4)} Ω/km при 50 Hz; без честотно мащабиране.`
      : "Данни за X, въведени от потребителя при референтна честота 50 Hz.";
  }

  if (reactanceModel.type === "ignored") {
    return "Реактивността е умишлено пренебрегната — опростено резистивно изчисление с X = 0.";
  }

  return "X = 0,08 Ω/km — приблизителна стойност по IEC/Schneider";
}

function getSourceDisclosure(resistanceModel, reactanceModel) {
  const resistanceSource = resistanceModel.type === "temperatureCalculated"
    ? "ABB Electrical Installation Handbook, Annex E"
    : resistanceModel.type === "manufacturer"
      ? "въведени от потребителя данни за R"
      : "IEC 60364-5-52:2009, Annex G";
  const reactanceSource = reactanceModel.type === "manufacturer"
    ? "въведени от потребителя данни за X"
    : reactanceModel.type === "ignored"
      ? "X е умишлено пренебрегнато"
      : "IEC 60364-5-52:2009, Annex G и Schneider Electrical Installation Guide, Chapter G";

  return `Инженерни източници: ${resistanceSource}; ${reactanceSource}.`;
}

function validUnusedValue() {
  return { ok: true, value: undefined };
}

function finiteNumber(value, label) {
  if (typeof value === "string" && value.trim() === "") {
    return { ok: false, message: `${label} трябва да е крайно число.` };
  }

  const number = Number(value);
  return Number.isFinite(number)
    ? { ok: true, value: number }
    : { ok: false, message: `${label} трябва да е крайно число.` };
}

function nonNegativeNumber(value, label) {
  const result = finiteNumber(value, label);
  if (!result.ok) return result;

  return result.value >= 0
    ? result
    : { ok: false, message: `${label} трябва да е неотрицателно число.` };
}

function optionalFiniteNumber(value, label) {
  if (typeof value === "string" && value.trim() === "") return validUnusedValue();
  return finiteNumber(value, label);
}

function optionalPositiveNumber(value, label) {
  if (typeof value === "string" && value.trim() === "") return validUnusedValue();
  return positiveNumber(value, label);
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
