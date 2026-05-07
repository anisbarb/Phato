import { useState } from "react";

const PREFIXES = ["AS-11", "AS-10", "AS-01", "AS-24"];
const STORAGE_KEY = "phato.driverId";

function generateId(): string {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const num = String(1000 + Math.floor(Math.random() * 8999));
  return `Auto ${prefix} ${num}`;
}

export function useDriverIdentity(): string {
  const [id] = useState<string>(() => {
    try {
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEY)
          : null;
      if (stored) return stored;
      const fresh = generateId();
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, fresh);
      }
      return fresh;
    } catch {
      return generateId();
    }
  });
  return id;
}
