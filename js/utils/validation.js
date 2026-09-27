export function positiveNumber(value, label) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return { ok: false, message: `${label} трябва да е положително число.` };
  }

  return { ok: true, value: number };
}

export function rangeNumber(value, label, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < min || number > max) {
    return {
      ok: false,
      message: `${label} трябва да е между ${min} и ${max}.`
    };
  }

  return { ok: true, value: number };
}
