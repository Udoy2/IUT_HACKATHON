import type { Device, RoomKey } from "../types";
import { ROOM_LABELS } from "../types";

interface Props {
  devices: Record<string, Device>;
}

const ROOMS: RoomKey[] = ["drawing", "work1", "work2"];

function DeviceCard({ device }: { device: Device }) {
  const isFan = device.type === "fan";
  const isOn = device.status === "on";

  return (
    <div className={`device-card ${isOn ? "on" : "off"}`}>
      <div className={`device-icon ${isFan ? "fan-icon" : "light-icon"} ${isOn ? "active" : ""}`}>
        {isFan ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            {/* Fan blade shape */}
            <path d="M12 2a2 2 0 012 2c0 1.5-1 2.5-2 3.5C11 6.5 10 5.5 10 4a2 2 0 012-2z" />
            <path d="M22 12a2 2 0 01-2 2c-1.5 0-2.5-1-3.5-2 1-1 2-2 3.5-2a2 2 0 012 2z" />
            <path d="M12 22a2 2 0 01-2-2c0-1.5 1-2.5 2-3.5 1 1 2 2 2 3.5a2 2 0 01-2 2z" />
            <path d="M2 12a2 2 0 012-2c1.5 0 2.5 1 3.5 2-1 1-2 2-3.5 2a2 2 0 01-2-2z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
          </svg>
        )}
      </div>
      <div className="device-info">
        <span className="device-name">{device.name}</span>
        <span className={`device-status-badge ${isOn ? "badge-on" : "badge-off"}`}>
          {isOn ? "ON" : "OFF"}
        </span>
        {isOn && (
          <span className="device-power">{device.power_w.toFixed(0)}W</span>
        )}
      </div>
    </div>
  );
}

export function DeviceStatusPanel({ devices }: Props) {
  const deviceList = Object.values(devices);

  return (
    <section className="panel" id="device-status-panel">
      <h2 className="panel-title">
        <span className="panel-icon">🏢</span> Live Device Status
      </h2>
      <div className="rooms-grid">
        {ROOMS.map((room) => {
          const roomDevices = deviceList.filter((d) => d.room === room);
          const onCount = roomDevices.filter((d) => d.status === "on").length;
          return (
            <div key={room} className="room-card">
              <div className="room-header">
                <span className="room-name">{ROOM_LABELS[room]}</span>
                <span className="room-badge">
                  {onCount}/{roomDevices.length} ON
                </span>
              </div>
              <div className="devices-list">
                {roomDevices.map((d) => (
                  <DeviceCard key={d.id} device={d} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
