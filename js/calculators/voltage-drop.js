import { MATERIAL_RESISTIVITY } from "../utils/electrical.js";

export function calculateVoltageDrop({
  current,
  lengthMeters,
  sectionMm2,
  voltage,
  material = "copper",
  phases = 1
}) {
  const rho = MATERIAL_RESISTIVITY[material] ?? MATERIAL_RESISTIVITY.copper;

  const voltageDrop = Number(phases) === 3
    ? Math.sqrt(3) * current * rho * lengthMeters / sectionMm2
    : 2 * current * rho * lengthMeters / sectionMm2;

  const percent = (voltageDrop / voltage) * 100;

  return { voltageDrop, percent };
}

export function voltageDropStatus(percent) {
  if (percent <= 3) {
    return { label: "● До 3%", className: "status-ok" };
  }

  if (percent <= 5) {
    return { label: "● Над 3%", className: "status-warning" };
  }

  return { label: "● Над 5%", className: "status-danger" };
}
