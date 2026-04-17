import { useState } from "react";

// Generate a stable anonymous device ID (persists in memory per session,
// and we store in a module-level variable so it survives re-renders)
let storedId = null;

function generateId() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function useDeviceId() {
  const [deviceId] = useState(() => {
    if (storedId) return storedId;
    // Try to read from a simple cookie-style approach
    try {
      const match = document.cookie.match(/echohistory_did=([^;]+)/);
      if (match) {
        storedId = match[1];
        return storedId;
      }
    } catch {
      // ignore
    }
    storedId = generateId();
    try {
      document.cookie = `echohistory_did=${storedId};max-age=${60 * 60 * 24 * 365};path=/;SameSite=Lax`;
    } catch {
      // ignore
    }
    return storedId;
  });

  return deviceId;
}
