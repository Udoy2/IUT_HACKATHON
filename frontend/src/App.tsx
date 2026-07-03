import { useDeviceStream } from "./hooks/useDeviceStream";
import { DeviceStatusPanel } from "./components/DeviceStatusPanel";
import { PowerMeter } from "./components/PowerMeter";
import { AlertsPanel } from "./components/AlertsPanel";
import { OfficeLayout } from "./components/OfficeLayout";

function ConnectionDot({ connected }: { connected: boolean }) {
  return (
    <span
      className={`conn-dot ${connected ? "conn-live" : "conn-dead"}`}
      title={connected ? "Live — SSE connected" : "Disconnected"}
    />
  );
}

export default function App() {
  const { devices, alerts, connected } = useDeviceStream();
  const deviceCount = Object.keys(devices).length;

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <span className="header-logo">🏢</span>
          <div>
            <h1 className="header-title">Office Watch</h1>
            <p className="header-subtitle">Real-time electrical monitoring dashboard</p>
          </div>
        </div>
        <div className="header-meta">
          <ConnectionDot connected={connected} />
          <span className="header-status">
            {connected ? "Live" : "Reconnecting…"}
          </span>
          <span className="header-device-count">
            {deviceCount}/18 devices loaded
          </span>
        </div>
      </header>

      {/* Main grid */}
      <main className="app-main">
        {/* Left column: devices */}
        <div className="col-left">
          <DeviceStatusPanel devices={devices} />
          <OfficeLayout devices={devices} />
        </div>

        {/* Right column: power + alerts */}
        <div className="col-right">
          <PowerMeter devices={devices} />
          <AlertsPanel alerts={alerts} />
        </div>
      </main>

      <footer className="app-footer">
        Office Watch · Built for IUT Hackathon 2026 · All 18 devices simulated in real-time
      </footer>
    </div>
  );
}
