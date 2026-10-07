import { convertUnit } from "../utils/units.js";

export function initUnitSelectConversion(input, select, quantity) {
  let previousUnit = select.value;

  select.addEventListener("change", () => {
    const nextUnit = select.value;

    if (input.value !== "" && nextUnit !== previousUnit) {
      const convertedValue = convertUnit(
        Number(input.value),
        previousUnit,
        nextUnit,
        quantity
      );

      if (convertedValue !== null) input.value = String(convertedValue);
    }

    previousUnit = nextUnit;
  });
}
