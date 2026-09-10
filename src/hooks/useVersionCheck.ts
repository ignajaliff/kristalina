import { useCallback, useEffect, useRef, useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// Detección de versión nueva desplegada
// ═══════════════════════════════════════════════════════════════════════════
// El problema: nginx sirve index.html sin caché, así que una pestaña NUEVA
// siempre carga el último deploy. Pero una pestaña que ya estaba abierta sigue
// corriendo el JS viejo en memoria hasta que el usuario recarga a mano.
//
// La solución: preguntar cada tanto por /version.json (que nginx sirve sin
// caché) y compararlo con la versión embebida en el bundle que está corriendo.
// Si no coinciden, hay un deploy nuevo esperando.

const VERSION_URL = "/version.json";

// Cada cuánto se consulta mientras la pestaña está en uso.
const POLL_INTERVAL_MS = 2 * 60 * 1000;

// Piso entre consultas, para que volver a la pestaña repetidas veces no
// dispare una ráfaga de requests.
const MIN_GAP_MS = 15 * 1000;

/** Lee la versión desplegada. Devuelve null ante cualquier problema. */
const fetchDeployedVersion = async (): Promise<string | null> => {
  try {
    // El query param evita cachés intermedias (proxies, CDN) además del no-store.
    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;

    // Si el archivo no existe, nginx puede devolver el index.html del SPA.
    // En ese caso no es JSON y no hay nada que comparar.
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("json")) return null;

    const data = await res.json();
    return typeof data?.version === "string" ? data.version : null;
  } catch {
    // Sin conexión o servidor caído: no es un error que le importe al usuario.
    return null;
  }
};

/**
 * Recarga la app trayendo el index.html nuevo (y con él, los bundles nuevos).
 * Limpia de paso service workers y Cache Storage por si alguna vez se agregan,
 * así el "recargar" del aviso equivale a un recargado duro.
 */
export const applyUpdate = async (): Promise<void> => {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // Si algo de esto falla igual conviene recargar.
  }
  window.location.reload();
};

export const useVersionCheck = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // En refs para que los listeners no se vuelvan a registrar en cada chequeo.
  const foundRef = useRef(false);
  const lastCheckRef = useRef(0);

  const check = useCallback(async () => {
    // Una vez detectado el deploy nuevo no tiene sentido seguir consultando.
    if (foundRef.current) return;

    const now = Date.now();
    if (now - lastCheckRef.current < MIN_GAP_MS) return;
    lastCheckRef.current = now;

    const deployed = await fetchDeployedVersion();
    if (deployed && deployed !== __APP_VERSION__) {
      foundRef.current = true;
      setUpdateAvailable(true);
    }
  }, []);

  useEffect(() => {
    // En desarrollo el archivo no existe y el bundle se recarga solo con HMR.
    if (import.meta.env.DEV) return;

    // Al volver a la pestaña: es el momento más probable de encontrar un deploy
    // nuevo, y el mejor momento para avisar.
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };

    void check();
    const interval = window.setInterval(() => void check(), POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, [check]);

  return { updateAvailable, applyUpdate };
};
