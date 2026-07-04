import type { Alert } from "../types";
import { ROOM_LABELS } from "../types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Alert as AlertBox, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";

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
            <CardTitle>Things that need <span className="text-rose italic">attention</span></CardTitle>
          </div>
          <Badge variant={active.length > 0 ? "live" : "neutral"}>
            {active.length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="card-content-fixed">
          {active.length === 0 ? (
            <AlertBox variant="success">
              <span className="text-rose">●</span>
              <div>
                <AlertTitle>All circuits nominal</AlertTitle>
                <AlertDescription>No active alerts — every room is within expected load.</AlertDescription>
              </div>
            </AlertBox>
          ) : (
            <div className="scrollable-list">
              {active.slice(0, 12).map((a) => (
                <AlertBox variant="alert" key={a.id}>
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 text-rose font-medium text-[11px] tracking-[0.12em] min-w-[26px]">
                      {a.type === "after_hours" ? "" : ""}
                    </span>
                    <div className="flex-1">
                      <AlertTitle className="flex items-baseline gap-2">
                        {a.type === "after_hours" ? "After hours" : "Room stuck on"}
                        {a.room && (
                          <span className="text-ink-3 font-normal whitespace-nowrap">
                            · {ROOM_LABELS[a.room as keyof typeof ROOM_LABELS]}
                          </span>
                        )}
                      </AlertTitle>
                      <AlertDescription className="mt-1">{a.message}</AlertDescription>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-ink-3 font-mono text-[10px] whitespace-nowrap">
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
