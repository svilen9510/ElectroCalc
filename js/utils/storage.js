export function getStoredValue(key, fallback = null) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function setStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Приложението остава функционално и без storage.
  }
}
