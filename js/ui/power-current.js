import { calculateCurrent } from "../calculators/power-current.js";
import { phaseLabel } from "../utils/electrical.js";
import { formatNumber } from "../utils/format.js";
import { positiveNumber, rangeNumber } from "../utils/validation.js";
import { initDesktopSelectPicker } from "./select-picker.js";

export function initPowerCurrentCalculator() {
  const power = document.querySelector("#power-value");
  const unit = document.querySelector("#power-unit");
  const voltage = document.querySelector("#power-voltage");
  const cosPhi = document.querySelector("#power-cosphi");
  const result = document.querySelector("#power-result");
  const summary = document.querySelector("#power-summary");
  const formula = document.querySelector("#power-formula");
  const validation = document.querySelector("#power-validation");
  const phaseButtons = [...document.querySelectorAll("[data-power-phase]")];
  const syncUnitPicker = initDesktopSelectPicker(unit, { minWidth: 160 });

  let phases = 1;

  function update() {
    syncUnitPicker();

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
