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

// Sinusoidal steady-state AC; cosPhi is the power factor used by this model.
// Three-phase loads are balanced with RMS line-to-line voltage; single-phase uses RMS supply voltage.
// Reactive power is an unsigned magnitude; leading/lagging behavior is out of scope.
export function calculateAcLoad({
  activePowerWatts,
  voltage,
  cosPhi,
  phases
}) {
  if (
    !isPositiveFiniteNumber(activePowerWatts) ||
    !isPositiveFiniteNumber(voltage) ||
    !isValidRatio(cosPhi) ||
    !isValidPhaseCount(phases)
  ) {
    return null;
  }

  const apparentPowerVoltAmps = activePowerWatts / cosPhi;
  const reactivePowerVars = cosPhi === 1
    ? 0
    : activePowerWatts * Math.tan(Math.acos(cosPhi));
  const currentAmps = calculateCurrent({
    powerWatts: activePowerWatts,
    voltage,
    cosPhi,
    phases
  });

  if (![apparentPowerVoltAmps, reactivePowerVars, currentAmps].every(Number.isFinite)) {
    return null;
  }

  return {
    mode: "general",
    phases,
    voltage,
    cosPhi,
    activePowerWatts,
    apparentPowerVoltAmps,
    reactivePowerVars,
    currentAmps
  };
}

export function calculateMotorLoad({
  shaftPowerWatts,
  efficiency,
  voltage,
  cosPhi,
  phases
}) {
  if (!isPositiveFiniteNumber(shaftPowerWatts) || !isValidRatio(efficiency)) {
    return null;
  }

  const electricalInputPowerWatts = shaftPowerWatts / efficiency;
  const acLoad = calculateAcLoad({
    activePowerWatts: electricalInputPowerWatts,
    voltage,
    cosPhi,
    phases
  });

  if (!acLoad) return null;

  return {
    mode: "motor",
    phases: acLoad.phases,
    voltage: acLoad.voltage,
    cosPhi: acLoad.cosPhi,
    efficiency,
    shaftPowerWatts,
    electricalInputPowerWatts,
    apparentPowerVoltAmps: acLoad.apparentPowerVoltAmps,
    reactivePowerVars: acLoad.reactivePowerVars,
    currentAmps: acLoad.currentAmps
  };
}

function isPositiveFiniteNumber(value) {
  return Number.isFinite(value) && value > 0;
}

function isValidRatio(value) {
  return Number.isFinite(value) && value > 0 && value <= 1;
}

function isValidPhaseCount(value) {
  return value === 1 || value === 3;
}
