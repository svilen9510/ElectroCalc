const DESKTOP_PICKER_QUERY =
  "(hover: hover) and (pointer: fine)";

export function initDesktopSelectPicker(select, { minWidth = 220 } = {}) {
  const baseId = select.id;
  const control = document.querySelector(`#${baseId}-control`);
  const trigger = document.querySelector(`#${baseId}-trigger`);
  const triggerValue = document.querySelector(`#${baseId}-trigger-value`);
  const picker = document.querySelector(`#${baseId}-picker`);
  const choices = document.querySelector(`#${baseId}-choices`);
  const desktopQuery = window.matchMedia(DESKTOP_PICKER_QUERY);

  const choiceElements = [...select.options].map((option, index) => {
    const id = `${baseId}-choice-${index}`;
    const label = document.createElement("label");
    const radio = document.createElement("input");
    const text = document.createElement("span");
    const check = document.createElement("span");

    label.className = "enhanced-select-choice";
    label.htmlFor = id;
    radio.id = id;
    radio.type = "radio";
    radio.name = `${baseId}-choice`;
    radio.value = option.value;
    text.className = "enhanced-select-choice-text";
    text.textContent = option.textContent.trim();
    check.className = "enhanced-select-check";
    check.textContent = "✓";
    check.setAttribute("aria-hidden", "true");

    label.append(radio, text, check);
    return label;
  });

  choices.replaceChildren(...choiceElements);

  const radios = [...choices.querySelectorAll('input[type="radio"]')];
  const supportsPopover = typeof picker.showPopover === "function";

  if (supportsPopover) {
    control.classList.add("is-enhanced");

    picker.addEventListener("beforetoggle", (event) => {
      if (event.newState === "open") positionPicker();
    });

    picker.addEventListener("toggle", (event) => {
      const isOpen = event.newState === "open";
      trigger.setAttribute("aria-expanded", String(isOpen));
      control.classList.toggle("is-open", isOpen);

      if (isOpen) {
        positionPicker();
        requestAnimationFrame(() => {
          choices.querySelector('input[type="radio"]:checked')?.focus();
        });
      } else if (desktopQuery.matches) {
        trigger.focus({ preventScroll: true });
      }
    });

    picker.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;

      event.preventDefault();
      picker.hidePopover();
    });

    const handleLayoutChange = () => {
      if (!picker.matches(":popover-open")) return;

      if (desktopQuery.matches) {
        positionPicker();
      } else {
        picker.hidePopover();
      }
    };

    window.addEventListener("resize", handleLayoutChange);
    window.addEventListener("scroll", handleLayoutChange, { passive: true });

    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", handleLayoutChange);
    } else if (typeof desktopQuery.addListener === "function") {
      desktopQuery.addListener(handleLayoutChange);
    }
  }

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;

      select.value = radio.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));

      if (supportsPopover && picker.matches(":popover-open")) {
        picker.hidePopover();
      }
    });
  });

  function positionPicker() {
    const triggerRect = trigger.getBoundingClientRect();
    const edgeGap = 12;
    const pickerGap = 6;
    const availableBelow = Math.max(
      0,
      window.innerHeight - edgeGap - triggerRect.bottom - pickerGap
    );
    const availableAbove = Math.max(
      0,
      triggerRect.top - edgeGap - pickerGap
    );
    const width = Math.min(
      Math.max(triggerRect.width, minWidth),
      window.innerWidth - edgeGap * 2
    );
    const left = Math.min(
      Math.max(edgeGap, triggerRect.left),
      window.innerWidth - width - edgeGap
    );

    picker.style.width = `${width}px`;
    picker.style.left = `${left}px`;
    picker.style.maxHeight = "";
    picker.style.top = `${triggerRect.bottom + pickerGap}px`;

    const requiredHeight = picker.offsetHeight;

    if (requiredHeight <= availableBelow) return;

    if (requiredHeight <= availableAbove) {
      picker.style.top = `${triggerRect.top - pickerGap - requiredHeight}px`;
      return;
    }

    if (availableBelow >= availableAbove) {
      picker.style.maxHeight = `${availableBelow}px`;
    } else {
      picker.style.maxHeight = `${availableAbove}px`;
      picker.style.top = `${edgeGap}px`;
    }
  }

  function sync() {
    const selectedValue = select.value;
    const selectedLabel = select.selectedOptions[0]?.textContent.trim() ?? "";
    const accessibleLabel = trigger.dataset.accessibleLabel;

    triggerValue.textContent = selectedLabel;
    if (accessibleLabel) {
      trigger.setAttribute("aria-label", `${accessibleLabel}: ${selectedLabel}`);
    }

    radios.forEach((radio) => {
      radio.checked = radio.value === selectedValue;
      radio.closest(".enhanced-select-choice")?.classList.toggle(
        "is-selected",
        radio.checked
      );
    });
  }

  sync();
  return sync;
}
