export function setStatus(element, status) {
  element.className = `status-pill ${status.className}`;
  element.textContent = status.label;
}
