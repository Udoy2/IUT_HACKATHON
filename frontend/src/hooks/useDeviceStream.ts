import { useEffect, useRef, useState, useCallback } from "react";
import type { Device, Alert, SSEPayload } from "../types";

// Empty string → relative URL → Vite proxy → FastAPI
const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "";

interface StreamState {
  devices: Record<string, Device>;
  alerts: Alert[];
  connected: boolean;
}

export function useDeviceStream() {
  const [state, setState] = useState<StreamState>({
    devices: {},
    alerts: [],
    connected: false,
  });

  const esRef = useRef<EventSource | null>(null);

  const applyEvent = useCallback((payload: SSEPayload) => {
    if (payload.type === "device_update") {
      const device = payload.data as Device;
      setState((prev) => ({
        ...prev,
        devices: { ...prev.devices, [device.id]: device },
      }));
    } else if (payload.type === "alert") {
      const alert = payload.data as Alert;
      setState((prev) => ({
        ...prev,
        alerts: [alert, ...prev.alerts].slice(0, 50), // keep last 50
      }));
    }
  }, []);

  useEffect(() => {
    // 1. Fetch initial state via REST
    fetch(`${BACKEND}/api/devices`)
      .then((r) => r.json())
      .then((devices: Device[]) => {
        const map: Record<string, Device> = {};
        devices.forEach((d) => (map[d.id] = d));
        setState((prev) => ({ ...prev, devices: map }));
      })
      .catch(console.error);

    fetch(`${BACKEND}/api/alerts`)
      .then((r) => r.json())
      .then((alerts: Alert[]) =>
        setState((prev) => ({ ...prev, alerts }))
      )
      .catch(console.error);

    // 2. Open SSE stream
    const es = new EventSource(`${BACKEND}/stream`);
    esRef.current = es;

    es.onopen = () => setState((prev) => ({ ...prev, connected: true }));
    es.onerror = () => setState((prev) => ({ ...prev, connected: false }));
    es.onmessage = (e) => {
      try {
        const payload: SSEPayload = JSON.parse(e.data);
        applyEvent(payload);
      } catch {
        /* ignore malformed */
      }
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [applyEvent]);

  return state;
}
