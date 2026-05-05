"use client";

/**
 * Hook para leer y mutar el estado de Consent Mode v2.
 * Usa useSyncExternalStore para suscribirse a localStorage de forma SSR-safe
 * y sin disparar setState dentro de useEffect (evita cascading renders).
 */

import { useCallback, useSyncExternalStore } from "react";
import {
  CONSENT_STATUS,
  CONSENT_STORAGE_KEY,
  persistConsent,
  readStoredConsent,
  clearStoredConsent,
} from "@/lib/analytics/consent";

function deriveStatus(stored) {
  if (!stored) return CONSENT_STATUS.UNKNOWN;
  if (stored.analytics && stored.ads) return CONSENT_STATUS.GRANTED;
  if (!stored.analytics && !stored.ads) return CONSENT_STATUS.DENIED;
  return CONSENT_STATUS.PARTIAL;
}

// Subscriptores en memoria — además de listener `storage` para tabs cross-window.
const listeners = new Set();

function notify() {
  for (const l of listeners) l();
}

function subscribe(callback) {
  listeners.add(callback);
  const handler = (e) => {
    if (e.key === CONSENT_STORAGE_KEY) callback();
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handler);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handler);
    }
  };
}

// Memoización del snapshot: useSyncExternalStore exige referencia estable
// si el contenido no cambió, sino bucle de renders.
let cachedSnapshot = null;
let cachedKey = "";

function getSnapshot() {
  if (typeof window === "undefined") return null;
  const stored = readStoredConsent();
  const key = stored
    ? `${stored.analytics ? 1 : 0}|${stored.ads ? 1 : 0}|${stored.ts}`
    : "null";
  if (key !== cachedKey) {
    cachedKey = key;
    cachedSnapshot = stored;
  }
  return cachedSnapshot;
}

function getServerSnapshot() {
  return null;
}

export function useConsent() {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const status = deriveStatus(stored);
  const hydrated = typeof window !== "undefined";

  const acceptAll = useCallback(() => {
    persistConsent({ analytics: true, ads: true });
    cachedKey = "";
    notify();
  }, []);

  const rejectAll = useCallback(() => {
    persistConsent({ analytics: false, ads: false });
    cachedKey = "";
    notify();
  }, []);

  const updatePreferences = useCallback(({ analytics, ads }) => {
    persistConsent({ analytics: !!analytics, ads: !!ads });
    cachedKey = "";
    notify();
  }, []);

  const reset = useCallback(() => {
    clearStoredConsent();
    cachedKey = "";
    notify();
  }, []);

  return {
    status,
    hydrated,
    isUnknown: status === CONSENT_STATUS.UNKNOWN,
    acceptAll,
    rejectAll,
    updatePreferences,
    reset,
  };
}
