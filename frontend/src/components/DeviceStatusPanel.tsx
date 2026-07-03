import type { Device, RoomKey } from "../types";
import { ROOM_LABELS } from "../types";

interface Props {
  devices: Record<string, Device>;
}

const ROOMS: RoomKey[] = ["drawing", "work1", "work2"];

function FanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <g className="fan-blades">
        <path d="M12 12 C 12 5, 8 3, 6 6 C 8 9, 11 10, 12 12 Z" fill="currentColor" fillOpacity="0.2" />
        <path d="M12 12 C 19 12, 21 8, 18 6 C 15 8, 13 11, 12 12 Z" fill="currentColor" fillOpacity="0.2" />
        <path d="M12 12 C 12 19, 16 21, 18 18 C 16 15, 13 14, 12 12 Z" fill="currentColor" fillOpacity="0.2" />
        <path d="M12 12 C 5 12, 3 16, 6 18 C 9 16, 10 13, 12 12 Z" fill="currentColor" fillOpacity="0.2" />
      </g>
      <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 9.5 a3.5 3.5 0 1 1 7 0 c0 1.2 -0.8 2.2 -1.3 2.9 c-0.4 0.5 -0.7 1 -0.7 1.6 v0.5 h-3 v-0.5 c0 -0.6 -0.3 -1.1 -0.7 -1.6 c-0.5 -0.7 -1.3 -1.7 -1.3 -2.9 z" />
      <line x1="9.5" y1="16.5" x2="14.5" y2="16.5" />
      <line x1="10" y1="18" x2="14" y2="18" />
      <circle cx="12" cy="9.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function shortLabel(name: string): string {
  const m = name.match(/(Fan|Light)\s*(\d+)/i);
  return m ? `${m[1]} ${m[2]}` : name;
}

function RoomCircuits({ room, devices }: { room: RoomKey; devices: Device[] }) {
  const onDevices = devices.filter((d) => d.status === "on");
  const watts = onDevices.reduce((a, d) => a + d.power_w, 0);
  const fans = devices.filter((d) => d.type === "fan");
  const lights = devices.filter((d) => d.type === "light");
  // Sort: fans first, then lights, each sorted by id
  const sorted = [
    ...fans.sort((a, b) => a.id.localeCompare(b.id)),
    ...lights.sort((a, b) => a.id.localeCompare(b.id)),
  ];

  return (
    <div className="circuits-room">
      {/* Room sub-header */}
      <div className="circuits-room-label">
        <span className="circuits-room-name">{ROOM_LABELS[room]}</span>
        <span className="circuits-room-watts">
          <span className="v">{watts.toFixed(0)}</span> W
        </span>
      </div>

      {/* Device rows */}
      {sorted.map((d) => {
        const on = d.status === "on";
        return (
          <div className="circuit-row" key={d.id}>
            {/* Status dot */}
            <div className={`circuit-indicator ${on ? "on" : ""}`} />
            {/* Icon with fan animation */}
            <div className={`circuit-icon ${on ? "on" : ""}`}>
              {d.type === "fan" ? <FanIcon /> : <LightIcon />}
            </div>
            {/* Name + type label */}
            <div className="circuit-info">
              <div className="circuit-name">{shortLabel(d.name)}</div>
              <div className="circuit-type">{d.type}</div>
            </div>
            {/* Wattage */}
            <span className={`circuit-watts ${on ? "on" : ""}`}>
              {on ? `${d.power_w.toFixed(0)} W` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function DeviceStatusPanel({ devices }: Props) {
  const deviceList = Object.values(devices);
  const onTotal = deviceList.filter((d) => d.status === "on").length;

  return (
    <div className="circuits-panel">
      {/* Panel header */}
      <div className="circuits-panel-header">
        <span className="circuits-panel-title">All Circuits</span>
        <span className="circuits-panel-count">
          <span className="v">{onTotal}</span> / {deviceList.length} active
        </span>
      </div>

      {/* Three room columns */}
      <div className="circuits-rooms">
        {ROOMS.map((room) => (
          <RoomCircuits
            key={room}
            room={room}
            devices={deviceList.filter((d) => d.room === room)}
          />
        ))}
      </div>
    </div>
  );
}
