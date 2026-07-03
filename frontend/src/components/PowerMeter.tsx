import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Device, RoomKey } from "../types";
import { ROOM_LABELS } from "../types";

interface Props {
  devices: Record<string, Device>;
}

const ROOM_COLORS: Record<RoomKey, string> = {
  drawing: "#6366f1",
  work1: "#22d3ee",
  work2: "#a78bfa",
};

const ROOMS: RoomKey[] = ["drawing", "work1", "work2"];

export function PowerMeter({ devices }: Props) {
  const deviceList = Object.values(devices);

  const perRoom: Record<RoomKey, number> = { drawing: 0, work1: 0, work2: 0 };
  for (const d of deviceList) {
    if (d.status === "on") perRoom[d.room] += d.power_w;
  }
  const totalW = Object.values(perRoom).reduce((a, b) => a + b, 0);
  const kwhToday = +(totalW * 12 * 0.5 / 1000).toFixed(3);

  const chartData = ROOMS.map((r) => ({
    name: ROOM_LABELS[r].replace(" Room", ""),
    watts: +perRoom[r].toFixed(1),
    room: r,
  }));

  // Animate total counter
  const [displayed, setDisplayed] = useState(totalW);
  useEffect(() => {
    const step = (totalW - displayed) / 10;
    if (Math.abs(step) < 0.5) {
      setDisplayed(totalW);
      return;
    }
    const t = setTimeout(() => setDisplayed((p) => p + step), 30);
    return () => clearTimeout(t);
  });

  const maxW = 18 * 65; // theoretical max (all fans+lights on)
  const fillPct = Math.min(100, (totalW / maxW) * 100);

  return (
    <section className="panel" id="power-meter-panel">
      <h2 className="panel-title">
        <span className="panel-icon">⚡</span> Live Power Consumption
      </h2>

      <div className="power-hero">
        <div className="power-arc-wrap">
          <svg viewBox="0 0 200 120" className="power-arc-svg">
            {/* background track */}
            <path
              d="M 10 110 A 90 90 0 0 1 190 110"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="16"
              strokeLinecap="round"
            />
            {/* fill arc */}
            <path
              d="M 10 110 A 90 90 0 0 1 190 110"
              fill="none"
              stroke="url(#powerGrad)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={`${(fillPct / 100) * 283} 283`}
            />
            <defs>
              <linearGradient id="powerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
          <div className="power-center-text">
            <span className="power-total">{displayed.toFixed(0)}</span>
            <span className="power-unit">W</span>
          </div>
        </div>
        <div className="power-stats">
          <div className="power-stat">
            <span className="stat-label">Est. Today</span>
            <span className="stat-value">{kwhToday} kWh</span>
          </div>
          <div className="power-stat">
            <span className="stat-label">Devices On</span>
            <span className="stat-value">
              {deviceList.filter((d) => d.status === "on").length}/18
            </span>
          </div>
        </div>
      </div>

      <div className="bar-chart-wrap">
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData} barCategoryGap="30%">
            <XAxis
              dataKey="name"
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                background: "#1e1b4b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: "#e0e7ff",
              }}
              formatter={(v) => [`${(v as number).toFixed(1)} W`, "Power"]}
            />
            <Bar dataKey="watts" radius={[6, 6, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.room} fill={ROOM_COLORS[entry.room as RoomKey]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
