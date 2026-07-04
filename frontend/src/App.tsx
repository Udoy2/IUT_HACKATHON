import { useDeviceStream } from "./hooks/useDeviceStream";
import { OfficeLayout } from "./components/OfficeLayout";
import { PowerMeter } from "./components/PowerMeter";
import { AlertsPanel } from "./components/AlertsPanel";
import { DeviceStatusPanel } from "./components/DeviceStatusPanel";
import type { RoomKey } from "./types";
import { ROOM_LABELS } from "./types";

const ROOMS: RoomKey[] = ["drawing", "work1", "work2"];
const MAX_W = 18 * 65;

export default function App() {
  const { devices, alerts, connected } = useDeviceStream();
  const deviceList = Object.values(devices);
  const deviceCount = deviceList.length;
  const stamp = new Date().toISOString().slice(0, 10);

  // Aggregate stats
  const totalW = deviceList.reduce(
    (acc, d) => acc + (d.status === "on" ? d.power_w : 0),
    0
  );
  const onCount = deviceList.filter((d) => d.status === "on").length;
  const kwh = ((totalW * 12 * 0.5) / 1000).toFixed(2);
  const activeAlerts = alerts.filter((a) => a.active).length;

  // Per-room watts
  const perRoom: Record<RoomKey, number> = { drawing: 0, work1: 0, work2: 0 };
  deviceList.forEach((d) => {
    if (d.status === "on") perRoom[d.room] += d.power_w;
  });

  return (
    <div className="app">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">
            Office <span className="ampersand">&amp;</span> Watch
          </span>
          <span className="brand-tag">3 rooms · 18 circuits · live</span>
        </div>
        <div className="meta">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span className={`dot ${connected ? "" : "dead"}`} />
            {connected ? "Live" : "Reconnecting"}
          </span>
          <span className="vrule" />
          <span>
            <span className="v">{deviceCount}</span> / 18 loaded
          </span>
          <span className="vrule" />
          <span>{stamp}</span>
        </div>
      </header>

      <main className="app-main">
        {/* ── 1. Blueprint — the rooms ───────────────────────────── */}
        <OfficeLayout devices={devices} />

        {/* ── 2. Stats bar — 4 quick tiles below blueprint ──────── */}
        <div className="stats-bar">
          {/* Total load */}
          <div className="stat-tile">
            <div className="stat-tile-label">Total load</div>
            <div className="stat-tile-value amber">{totalW.toFixed(0)}</div>
            <div className="stat-tile-unit">Watts live</div>
            <div className="stat-tile-bar">
              <div
                className="stat-tile-bar-fill"
                style={{ width: `${Math.min(100, (totalW / MAX_W) * 100)}%` }}
              />
            </div>
          </div>

          {/* Active circuits */}
          <div className="stat-tile">
            <div className="stat-tile-label">Circuits on</div>
            <div className="stat-tile-value">{onCount}</div>
            <div className="stat-tile-unit">of 18 devices</div>
            <div className="stat-tile-bar">
              <div
                className="stat-tile-bar-fill"
                style={{ width: `${(onCount / 18) * 100}%` }}
              />
            </div>
          </div>

          {/* Est. kWh */}
          <div className="stat-tile">
            <div className="stat-tile-label">Est. today</div>
            <div className="stat-tile-value">{kwh}</div>
            <div className="stat-tile-unit">kWh consumed</div>
            <div className="stat-tile-bar">
              <div
                className="stat-tile-bar-fill"
                style={{ width: `${Math.min(100, (parseFloat(kwh) / 6) * 100)}%` }}
              />
            </div>
          </div>

          {/* Active alerts */}
          <div className="stat-tile">
            <div className="stat-tile-label">Alerts</div>
            <div
              className="stat-tile-value"
              style={{ color: activeAlerts > 0 ? "var(--rose)" : "var(--ink)" }}
            >
              {activeAlerts}
            </div>
            <div className="stat-tile-unit">
              {activeAlerts === 0 ? "All clear" : "Need attention"}
            </div>
            <div className="stat-tile-bar">
              <div
                className="stat-tile-bar-fill"
                style={{
                  width: `${Math.min(100, (activeAlerts / 5) * 100)}%`,
                  background: activeAlerts > 0 ? "var(--rose)" : "var(--amber)",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── 3. Power + Alerts side by side ──────────────────────── */}
        <div className="bottom-row">
          <PowerMeter devices={devices} />
          <AlertsPanel alerts={alerts} />
        </div>

        {/* ── 4. All circuits — full width, room-grouped ───────────── */}
        <DeviceStatusPanel devices={devices} />
      </main>

      <footer className="app-footer">
        <span>Office Watch · IUT Hackathon 2026</span>
        <span>Simulated data · No live hardware</span>
      </footer>
    </div>
  );
}
