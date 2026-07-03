import type { Alert } from "../types";
import { ROOM_LABELS } from "../types";

interface Props {
  alerts: Alert[];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  // offset by +6 for display (matching backend assumption)
  const local = new Date(d.getTime() + 6 * 60 * 60 * 1000);
  return local.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function AlertsPanel({ alerts }: Props) {
  const active = alerts.filter((a) => a.active);

  return (
    <section className="panel" id="alerts-panel">
      <h2 className="panel-title">
        <span className="panel-icon">🚨</span> Active Alerts
        {active.length > 0 && (
          <span className="alert-count-badge">{active.length}</span>
        )}
      </h2>

      {active.length === 0 ? (
        <div className="no-alerts">
          <span className="no-alerts-icon">✅</span>
          <p>All clear — no active alerts</p>
        </div>
      ) : (
        <ul className="alerts-list">
          {active.map((alert) => (
            <li
              key={alert.id}
              className={`alert-item alert-${alert.type}`}
            >
              <div className="alert-header">
                <span className="alert-type-icon">
                  {alert.type === "after_hours" ? "🌙" : "🔴"}
                </span>
                <span className="alert-type-label">
                  {alert.type === "after_hours"
                    ? "After Hours"
                    : "Room Stuck On"}
                </span>
                {alert.room && (
                  <span className="alert-room-tag">
                    {ROOM_LABELS[alert.room as keyof typeof ROOM_LABELS] ?? alert.room}
                  </span>
                )}
                <span className="alert-time">{formatTime(alert.triggered_at)}</span>
              </div>
              <p className="alert-message">{alert.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
