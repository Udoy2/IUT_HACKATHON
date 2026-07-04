export type DeviceType = "fan" | "light";
export type RoomKey = "drawing" | "work1" | "work2";
export type DeviceStatus = "on" | "off";
export type AlertType = "after_hours" | "room_stuck_on";

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  room: RoomKey;
  status: DeviceStatus;
  power_w: number;
  last_changed: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  room: RoomKey | null;
  message: string;
  triggered_at: string;
  active: boolean;
}

export interface UsageData {
  total_w: number;
  per_room: Record<RoomKey, number>;
  kwh_today: number;
}

export type SSEEventType = "device_update" | "alert";

export interface SSEPayload {
  type: SSEEventType;
  data: Device | Alert;
}

export const ROOM_LABELS: Record<RoomKey, string> = {
  drawing: "Drawing Room",
  work1: "Work Room 1",
  work2: "Work Room 2",
};
