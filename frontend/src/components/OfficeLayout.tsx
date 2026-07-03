import type { Device, RoomKey } from "../types";
import { ROOM_LABELS } from "../types";

interface Props {
  devices: Record<string, Device>;
}

const ROOMS: RoomKey[] = ["drawing", "work1", "work2"];

// Each room is 2 fans (top row) + 3 lights (bottom row)
function RoomLayout({ room, devices }: { room: RoomKey; devices: Device[] }) {
  const fans = devices.filter((d) => d.type === "fan");
  const lights = devices.filter((d) => d.type === "light");
  const label = ROOM_LABELS[room];

  return (
    <div className="office-room">
      <div className="office-room-label">{label}</div>
      <div className="office-devices">
        <div className="office-row office-fans">
          {fans.map((fan) => (
            <div
              key={fan.id}
              className={`office-fan ${fan.status === "on" ? "spinning" : ""}`}
              title={`${fan.name} — ${fan.status.toUpperCase()}`}
            >
              <svg viewBox="0 0 40 40" width="36" height="36">
                <circle cx="20" cy="20" r="4" fill="currentColor" />
                {/* Blade 1 */}
                <ellipse cx="20" cy="11" rx="4" ry="8" fill="currentColor" opacity="0.85" transform="rotate(0 20 20)" />
                {/* Blade 2 */}
                <ellipse cx="20" cy="11" rx="4" ry="8" fill="currentColor" opacity="0.85" transform="rotate(90 20 20)" />
                {/* Blade 3 */}
                <ellipse cx="20" cy="11" rx="4" ry="8" fill="currentColor" opacity="0.85" transform="rotate(180 20 20)" />
                {/* Blade 4 */}
                <ellipse cx="20" cy="11" rx="4" ry="8" fill="currentColor" opacity="0.85" transform="rotate(270 20 20)" />
              </svg>
              <span className="office-device-dot" data-on={fan.status === "on"} />
            </div>
          ))}
        </div>
        <div className="office-row office-lights">
          {lights.map((light) => (
            <div
              key={light.id}
              className={`office-light ${light.status === "on" ? "glowing" : ""}`}
              title={`${light.name} — ${light.status.toUpperCase()}`}
            >
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OfficeLayout({ devices }: Props) {
  const deviceList = Object.values(devices);

  return (
    <section className="panel" id="office-layout-panel">
      <h2 className="panel-title">
        <span className="panel-icon">🗺️</span> Office Top-View
      </h2>
      <div className="office-floor">
        {ROOMS.map((room) => (
          <RoomLayout
            key={room}
            room={room}
            devices={deviceList.filter((d) => d.room === room)}
          />
        ))}
      </div>
    </section>
  );
}
