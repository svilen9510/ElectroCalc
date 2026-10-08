import { useEffect, useRef, useState } from "react";

const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

export default function ResponsiveSelect({
  id,
  value,
  options,
  onChange,
  ariaLabel,
  pickerTitle,
  minWidth = 220,
  className = "",
  children
}) {
  const controlRef = useRef(null);
  const triggerRef = useRef(null);
  const pickerRef = useRef(null);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = options.find((option) => option.value === value)?.label ?? "";
  const pickerId = `${id}-picker`;
  const pickerTitleId = `${pickerId}-title`;

  useEffect(() => {
    setIsEnhanced(typeof HTMLElement.prototype.showPopover === "function");
  }, []);

  useEffect(() => {
    const control = controlRef.current;
    const trigger = triggerRef.current;
    const picker = pickerRef.current;
    if (!isEnhanced || !control || !trigger || !picker) return undefined;

    const finePointerQuery = window.matchMedia(FINE_POINTER_QUERY);

    function pickerIsOpen() {
      return picker.matches(":popover-open");
    }

    function positionPicker() {
      const triggerRect = trigger.getBoundingClientRect();
      const edgeGap = 12;
      const pickerGap = 6;
      const availableBelow = Math.max(
        0,
        window.innerHeight - edgeGap - triggerRect.bottom - pickerGap
      );
      const availableAbove = Math.max(0, triggerRect.top - edgeGap - pickerGap);
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
      } else if (availableBelow >= availableAbove) {
        picker.style.maxHeight = `${availableBelow}px`;
      } else {
        picker.style.maxHeight = `${availableAbove}px`;
        picker.style.top = `${edgeGap}px`;
      }
    }

    function handleBeforeToggle(event) {
      if (event.newState === "open") positionPicker();
    }

    function handleToggle(event) {
      const nextIsOpen = event.newState === "open";
      setIsOpen(nextIsOpen);

      if (nextIsOpen) {
        positionPicker();
        requestAnimationFrame(() => {
          picker.querySelector('input[type="radio"]:checked')?.focus();
        });
      } else if (finePointerQuery.matches) {
        trigger.focus({ preventScroll: true });
      }
    }

    function handleKeyDown(event) {
      if (event.key !== "Escape") return;

      event.preventDefault();
      picker.hidePopover();
    }

    function handleLayoutChange() {
      if (!pickerIsOpen()) return;

      if (finePointerQuery.matches) {
        positionPicker();
      } else {
        picker.hidePopover();
      }
    }

    picker.addEventListener("beforetoggle", handleBeforeToggle);
    picker.addEventListener("toggle", handleToggle);
    picker.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleLayoutChange);
    window.addEventListener("scroll", handleLayoutChange, { passive: true });
    finePointerQuery.addEventListener?.("change", handleLayoutChange);

    return () => {
      picker.removeEventListener("beforetoggle", handleBeforeToggle);
      picker.removeEventListener("toggle", handleToggle);
      picker.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleLayoutChange);
      window.removeEventListener("scroll", handleLayoutChange);
      finePointerQuery.removeEventListener?.("change", handleLayoutChange);
    };
  }, [isEnhanced, minWidth]);

  function chooseOption(nextValue) {
    onChange(nextValue);

    const picker = pickerRef.current;
    if (picker && typeof picker.hidePopover === "function" && picker.matches(":popover-open")) {
      picker.hidePopover();
    }
  }

  return (
    <>
      <span
        ref={controlRef}
        id={`${id}-control`}
        className={`input-wrap enhanced-select-control${className ? ` ${className}` : ""}${isEnhanced ? " is-enhanced" : ""}${isOpen ? " is-open" : ""}`}
      >
        {children}
        <select
          id={id}
          value={value}
          aria-label={ariaLabel}
          onChange={(event) => chooseOption(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <button
          ref={triggerRef}
          id={`${id}-trigger`}
          className="enhanced-select-trigger"
          type="button"
          aria-label={`${ariaLabel}: ${selectedLabel}`}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={pickerId}
          popoverTarget={pickerId}
        >
          <span id={`${id}-trigger-value`}>{selectedLabel}</span>
          <span className="enhanced-select-chevron" aria-hidden="true">⌄</span>
        </button>
      </span>

      <div
        ref={pickerRef}
        id={pickerId}
        className="enhanced-select-picker"
        popover="auto"
        role="dialog"
        aria-labelledby={pickerTitleId}
      >
        <fieldset>
          <legend id={pickerTitleId}>{pickerTitle}</legend>
          <div id={`${id}-choices`} className="enhanced-select-choices">
            {options.map((option, index) => {
              const optionId = `${id}-choice-${index}`;
              const isSelected = option.value === value;

              return (
                <label
                  key={option.value}
                  className={`enhanced-select-choice${isSelected ? " is-selected" : ""}`}
                  htmlFor={optionId}
                >
                  <input
                    id={optionId}
                    type="radio"
                    name={`${id}-choice`}
                    value={option.value}
                    checked={isSelected}
                    onChange={() => chooseOption(option.value)}
                  />
                  <span className="enhanced-select-choice-text">{option.label}</span>
                  <span className="enhanced-select-check" aria-hidden="true">✓</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    </>
  );
}
