import type { Device, RoomKey } from "../types";
import { ROOM_LABELS } from "../types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface Props {
  devices: Record<string, Device>;
}

const ROOMS: RoomKey[] = ["drawing", "work1", "work2"];

const ROOM_AREA: Record<RoomKey, string> = {
  drawing: "22 m²",
  work1:   "22 m²",
  work2:   "22 m²",
};

// ── Absolute % positions for each device in its room floor ────────────────
// [x%, y%] — rooms are shown as rectangles, devices placed spatially.
const DEVICE_POSITIONS: Record<string, [number, number]> = {
  // Drawing Room — wider, fans near ceiling, lights spread lower
  "dr-fan1":   [28, 30],
  "dr-fan2":   [72, 30],
  "dr-light1": [20, 68],
  "dr-light2": [50, 72],
  "dr-light3": [80, 68],

  // Work Room 1
  "wr1-fan1":   [30, 32],
  "wr1-fan2":   [70, 32],
  "wr1-light1": [22, 65],
  "wr1-light2": [78, 65],
  "wr1-light3": [50, 75],

  // Work Room 2
  "wr2-fan1":   [30, 32],
  "wr2-fan2":   [70, 32],
  "wr2-light1": [22, 68],
  "wr2-light2": [50, 68],
  "wr2-light3": [78, 68],
};

/* ── Fan node SVG ─────────────────────────────────────────────────────── */
function FanIcon({ on }: { on: boolean }) {
  return (
    <svg
      className="fan-node-svg"
      viewBox="0 0 30 30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g className="fan-blades-anim">
        {/* 4 curved blades around center hub */}
        <path d="M15 15 C 15 6, 10 4, 7 8 C 10 11, 13 13, 15 15 Z" fill="currentColor" fillOpacity="0.2" />
        <path d="M15 15 C 24 15, 26 10, 22 7 C 19 10, 17 13, 15 15 Z" fill="currentColor" fillOpacity="0.2" />
        <path d="M15 15 C 15 24, 20 26, 23 22 C 20 19, 17 17, 15 15 Z" fill="currentColor" fillOpacity="0.2" />
        <path d="M15 15 C 6 15, 4 20, 8 23 C 11 20, 13 17, 15 15 Z" fill="currentColor" fillOpacity="0.2" />
      </g>
      {/* Center hub */}
      <circle cx="15" cy="15" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ── Light bulb SVG ────────────────────────────────────────────────────── */
function LightIcon() {
  return (
    <svg
      className="light-node-svg"
      viewBox="0 0 26 26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* glow halo */}
      <circle className="bulb-halo" cx="13" cy="11" r="9" fill="var(--amber-glow)" stroke="none" />
      {/* glass envelope */}
      <path d="M9 11 a4 4 0 1 1 8 0 c0 1.6 -1 2.8 -1.6 3.6 c-0.5 0.6 -0.8 1.2 -0.8 2 v0.8 h-3.2 v-0.8 c0 -0.8 -0.3 -1.4 -0.8 -2 c-0.6 -0.8 -1.6 -2 -1.6 -3.6 z" />
      {/* filament */}
      <path d="M10.8 11 c0.4 -0.8 1.1 -0.8 1.2 0 c0.1 0.8 0.7 0.8 0.8 0 c0.1 -0.8 0.8 -0.8 1.2 0" />
      {/* base */}
      <line x1="9.6" y1="18" x2="16.4" y2="18" />
      <line x1="10.4" y1="19.6" x2="15.6" y2="19.6" />
      {/* core glow dot */}
      <circle className="bulb-core" cx="13" cy="11" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ── Single device node ────────────────────────────────────────────────── */
function DeviceNode({ device }: { device: Device }) {
  const on = device.status === "on";
  const pos = DEVICE_POSITIONS[device.id];
  if (!pos) return null;

  const [x, y] = pos;
  const shortLabel = device.type === "fan" ? "F" : "L";
  const num = device.name.match(/\d+/)?.[0] ?? "";
  const label = `${shortLabel}${num}${on ? ` · ${device.power_w.toFixed(0)}W` : ""}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`room-device-node ${on ? "on" : "off"}`}
          style={{ left: `${x}%`, top: `${y}%` }}
          role="button"
          tabIndex={0}
          aria-label={`${device.name} — ${on ? `${device.power_w.toFixed(0)} W` : "off"}`}
        >
          {device.type === "fan" ? (
            <div className={`fan-node ${on ? "on" : "off"}`}>
              <div className="fan-sweep-ring" />
              <div className="fan-node-mount" />
              <FanIcon on={on} />
            </div>
          ) : (
            <div className={`light-node ${on ? "on" : "off"}`}>
              <div className="light-glow" />
              <div className="light-node-mount" />
              <LightIcon />
            </div>
          )}
          <span className="device-node-label">{label}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {device.name} · {on ? `${device.power_w.toFixed(0)} W` : "off"}
      </TooltipContent>
    </Tooltip>
  );
}

/* ── Single room column ────────────────────────────────────────────────── */
function RoomColumn({ room, devices }: { room: RoomKey; devices: Device[] }) {
  const onCount = devices.filter((d) => d.status === "on").length;
  const watts = devices.reduce((a, d) => a + (d.status === "on" ? d.power_w : 0), 0);

  return (
    <div className="room-col">
      {/* Room header */}
      <div className="room-col-header">
        <span className="room-col-name">{ROOM_LABELS[room]}</span>
        <span className="room-col-meta">
          <span className={`v ${onCount > 0 ? "on" : ""}`}>{onCount}</span>
          /{devices.length} on
        </span>
      </div>

      {/* Room floor — devices placed by % coordinates */}
      <div className="room-floor">
        <TooltipProvider delayDuration={80}>
          {devices.map((d) => (
            <DeviceNode key={d.id} device={d} />
          ))}
        </TooltipProvider>
      </div>

      {/* Room footer — wattage + status pips */}
      <div className="room-col-footer">
        <span className="room-col-footer-watts">
          <span className="v">{watts.toFixed(0)}</span> W · {ROOM_AREA[room]}
        </span>
        <div className="room-on-bar" aria-label={`${onCount} of ${devices.length} on`}>
          {devices.map((d) => (
            <div
              key={d.id}
              className={`room-on-pip ${d.status === "on" ? "on" : ""}`}
              title={d.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main export ───────────────────────────────────────────────────────── */
export function OfficeLayout({ devices }: Props) {
  const deviceList = Object.values(devices);
  const totalOn = deviceList.filter((d) => d.status === "on").length;

  return (
    <div className="blueprint-panel">
      {/* Panel header */}
      <div className="blueprint-header">
        <span className="blueprint-header-title">
          The <span className="mark">office</span> blueprint
        </span>
        <span className="blueprint-header-sub">
          {totalOn} / {deviceList.length} circuits live
        </span>
      </div>

      {/* Three rooms side by side */}
      <div className="blueprint-rooms">
        {ROOMS.map((room) => (
          <RoomColumn
            key={room}
            room={room}
            devices={deviceList.filter((d) => d.room === room)}
          />
        ))}
      </div>

      {/* Legend footer */}
      <div className="blueprint-footer">
        <span className="legend-dot">Active</span>
        <span className="legend-dot off">Off</span>
        <span className="hint">F = fan · L = light · spinning = running · glow = lit</span>
      </div>
    </div>
  );
}
