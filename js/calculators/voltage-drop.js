import { CONDUCTOR_MATERIALS } from "../../data/conductor-materials.js";
import { calculateCurrent } from "./power-current.js";

export function calculateVoltageDrop({
  inputMode = "current",
  current,
  powerWatts,
  cosPhi = 1,
  lengthMeters,
  sectionMm2,
  voltage,
  material = "copper",
  phases = 1
}) {
  const materialData = CONDUCTOR_MATERIALS[material] ?? CONDUCTOR_MATERIALS.copper;
  const calculatedCurrent = inputMode === "power"
    ? calculateCurrent({ powerWatts, voltage, cosPhi, phases })
    : current;
  const resistancePerMeter = materialData.resistivityOhmMm2PerM / sectionMm2;

  const voltageDrop = Number(phases) === 3
    ? Math.sqrt(3) * calculatedCurrent * lengthMeters * resistancePerMeter * cosPhi
    : 2 * calculatedCurrent * lengthMeters * resistancePerMeter * cosPhi;

  const percent = (voltageDrop / voltage) * 100;

  return { current: calculatedCurrent, voltageDrop, percent };
}
