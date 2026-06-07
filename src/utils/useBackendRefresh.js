import { useEffect, useState } from "react";

const REFRESH_KEY = "property_dna_predictions_updated_at";
const EVENT_NAME = "property-dna-predictions-updated";

export function useBackendRefresh() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((value) => value + 1);

    const onStorage = (event) => {
      if (!event.key || event.key === REFRESH_KEY) {
        bump();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(EVENT_NAME, bump);
    window.addEventListener("focus", bump);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVENT_NAME, bump);
      window.removeEventListener("focus", bump);
    };
  }, []);

  return tick;
}

export function notifyBackendRefresh() {
  const stamp = String(Date.now());
  try {
    localStorage.setItem(REFRESH_KEY, stamp);
  } catch {
    // ignore storage failures and still notify the active tab
  }
  window.dispatchEvent(new Event(EVENT_NAME));
}
