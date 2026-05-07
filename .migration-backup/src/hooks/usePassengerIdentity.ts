import { useState } from "react";

const STORAGE_KEY = "phato.passengerId";

function generateId(): string {
  return "pax-" + Math.random().toString(36).slice(2, 10);
}

export function usePassengerIdentity(): string {
  const [id] = useState<string>(() => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (stored) return stored;
      const fresh = generateId();
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, fresh);
      return fresh;
    } catch {
      return generateId();
    }
  });
  return id;
}
