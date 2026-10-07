const UNIT_GROUPS = Object.freeze({
  power: Object.freeze({
    W: 1,
    kW: 1000
  })
});

export function convertUnit(value, fromUnit, toUnit, quantity) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;

  const units = UNIT_GROUPS[quantity];
  const fromFactor = units?.[fromUnit];
  const toFactor = units?.[toUnit];

  if (!Number.isFinite(fromFactor) || !Number.isFinite(toFactor)) return null;

  const convertedValue = value * fromFactor / toFactor;
  return Number.isFinite(convertedValue) ? convertedValue : null;
}
