export function calculateCurrent({
  powerWatts,
  voltage,
  cosPhi = 1,
  phases = 1
}) {
  const phaseCount = Number(phases);

  if (phaseCount === 3) {
    return powerWatts / (Math.sqrt(3) * voltage * cosPhi);
  }

  return powerWatts / (voltage * cosPhi);
}
