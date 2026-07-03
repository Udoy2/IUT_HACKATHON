import type { Alert } from "../types";
import { ROOM_LABELS } from "../types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Alert as AlertBox, AlertDescription, AlertTitle } from "./ui/alert";

interface Props {
  alerts: Alert[];
}

function formatTime(iso: string): string {
  // Server stamps UTC; respect the +6 convention from the backend.
  const d = new Date(new Date(iso).getTime() + 6 * 60 * 60 * 1000);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function AlertsPanel({ alerts }: Props) {
  const active = alerts.filter((a) => a.active);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-end justify-between w-full">
          <div>
            <CardDescription>Alerts</CardDescription>
            <CardTitle>Things that need <span style={{ color: "var(--rose)", fontStyle: "italic" }}>attention</span></CardTitle>
          </div>
          <span className="brand-tag" style={{ fontFamily: "var(--font-mono)", color: active.length > 0 ? "var(--rose)" : "var(--ink-3)", fontWeight: 600 }}>
            {active.length} active
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="card-content-fixed">
          {active.length === 0 ? (
            <AlertBox variant="success">
              <span style={{ fontSize: 14 }}>●</span>
              <div>
                <AlertTitle>All circuits nominal</AlertTitle>
                <AlertDescription>No active alerts — every room is within expected load.</AlertDescription>
              </div>
            </AlertBox>
          ) : (
            <div className="scrollable-list">
              {active.slice(0, 12).map((a) => (
                <AlertBox variant="alert" key={a.id}>
                  <span style={{ color: "var(--rose)", fontWeight: 600, fontSize: 11, letterSpacing: "0.12em", minWidth: 26 }}>
                    {a.type === "after_hours" ? "AH" : "RS"}
                  </span>
                  <div style={{ flex: 1 }}>
                    <AlertTitle>
                      {a.type === "after_hours" ? "After hours" : "Room stuck on"}
                      {a.room && (
                        <span style={{ color: "var(--ink-3)", fontWeight: 400, fontStyle: "normal", marginLeft: 8, fontFamily: "var(--font-sans)", fontSize: 12 }}>
                          · {ROOM_LABELS[a.room as keyof typeof ROOM_LABELS]}
                        </span>
                      )}
                    </AlertTitle>
                    <AlertDescription>{a.message}</AlertDescription>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                    {formatTime(a.triggered_at)}
                  </span>
                </AlertBox>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
