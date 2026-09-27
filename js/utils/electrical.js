export const MATERIAL_RESISTIVITY = {
  copper: 0.0175,
  aluminum: 0.0285
};

export function phaseLabel(phases) {
  return Number(phases) === 3 ? "3-фазно" : "1-фазно";
}
