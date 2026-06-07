import { Check, ChevronDown } from 'lucide-react';
import { useId, useRef, useState } from 'react';

export default function CustomSelect({ value, options, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const wrapperRef = useRef(null);

  const choose = (option) => {
    onChange({ target: { value: option } });
    setOpen(false);
  };

  const handleBlur = (event) => {
    if (!wrapperRef.current?.contains(event.relatedTarget)) {
      setOpen(false);
    }
  };

  return (
    <div className={`customSelect ${open ? 'isOpen' : ''}`} ref={wrapperRef} onBlur={handleBlur}>
      <button
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-controls={listId}
        className="selectTrigger"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span>{value}</span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="selectMenu" id={listId} role="listbox">
          {options.map((option) => (
            <button
              aria-selected={option === value}
              className={`selectOption ${option === value ? 'selected' : ''}`}
              key={option}
              role="option"
              type="button"
              onClick={() => choose(option)}
            >
              <span>{option}</span>
              {option === value && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
