export function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("bg-BG", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}
