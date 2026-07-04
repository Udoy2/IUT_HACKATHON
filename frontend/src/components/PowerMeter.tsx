import type { Device, RoomKey } from "../types";
import { ROOM_LABELS } from "../types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";

interface Props {
  devices: Record<string, Device>;
}

const ROOMS: RoomKey[] = ["drawing", "work1", "work2"];
const MAX_W = 18 * 65;

export function PowerMeter({ devices }: Props) {
  const deviceList = Object.values(devices);
  let totalW = 0;
  const perRoom: Record<RoomKey, number> = { drawing: 0, work1: 0, work2: 0 };
  for (const d of deviceList) {
    if (d.status === "on") {
      perRoom[d.room] += d.power_w;
      totalW += d.power_w;
    }
  }
  const kwh = (totalW * 12 * 0.5 / 1000).toFixed(2);
  // Render 412.0 as 412 + .0 in italic so the integer is the loud part
  const [intPart, decPart] = totalW.toFixed(1).split(".");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-end justify-between w-full">
          <div>
            <CardDescription>Right now</CardDescription>
            <CardTitle>Total <span className="text-amber italic">load</span></CardTitle>
          </div>
          <span className="brand-tag font-mono">live</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="card-content-fixed">
          <div className="power-card">
            <div className="power-headline">
              <span className="power-num">
                {intPart}
                <span className="decimal">.{decPart}</span>
              </span>
              <span className="power-unit">watts</span>
            </div>
            <div className="power-rule" />
            <div className="section-label pb-3">
              <span>By room</span>
              <span>W</span>
            </div>
            <div className="bars">
              {ROOMS.map((r) => {
                const w = perRoom[r];
                const pct = (w / MAX_W) * 100;
                return (
                  <div className="bar-row" key={r}>
                    <div className="bar-label">
                      <span className="name">{ROOM_LABELS[r]}</span>
                      <span className={`v ${w > 0 ? "text-amber" : ""}`}>{w.toFixed(0)}</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className={`bar-fill ${w === 0 ? "zero" : ""}`}
                        style={{ width: `${Math.max(2, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="bar-row mt-0.5 pt-3" style={{ borderTop: "1px dashed var(--ink-4)" }}>
                <div className="bar-label">
                  <span className="name">Today, estimated</span>
                  <span className="v">{kwh} kWh</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.min(100, (Number(kwh) / 6) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
