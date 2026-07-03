import random
from datetime import datetime, timezone
from typing import Dict, List
from models import Device, Alert

# Base power values with slight randomization
FAN_BASE_W = 60.0
LIGHT_BASE_W = 15.0


def _rand_power(base: float) -> float:
    return round(base + random.uniform(-5, 5), 1)


def _make_device(device_id: str, name: str, dtype: str, room: str) -> Device:
    status = random.choice(["on", "off"])
    base = FAN_BASE_W if dtype == "fan" else LIGHT_BASE_W
    return Device(
        id=device_id,
        name=name,
        type=dtype,
        room=room,
        status=status,
        power_w=_rand_power(base) if status == "on" else 0.0,
        last_changed=datetime.now(timezone.utc),
    )


class DeviceStore:
    def __init__(self):
        self.devices: Dict[str, Device] = {}
        self.alerts: List[Alert] = []
        self._alert_counter = 0
        # Track when all devices in a room went "all on"
        self.room_all_on_since: Dict[str, datetime | None] = {
            "drawing": None,
            "work1": None,
            "work2": None,
        }
        # Track which devices have already triggered an after-hours alert
        # Maps device_id -> the "on" period start (reset when device goes off)
        self.after_hours_alerted: Dict[str, bool] = {}
        self._init_devices()

    def _init_devices(self):
        layout = [
            ("drawing", 2, 3),
            ("work1", 2, 3),
            ("work2", 2, 3),
        ]
        room_labels = {
            "drawing": "dr",
            "work1": "wr1",
            "work2": "wr2",
        }
        for room, fans, lights in layout:
            prefix = room_labels[room]
            for i in range(1, fans + 1):
                d_id = f"{prefix}-fan{i}"
                self.devices[d_id] = _make_device(d_id, f"Fan {i}", "fan", room)
                self.after_hours_alerted[d_id] = False
            for i in range(1, lights + 1):
                d_id = f"{prefix}-light{i}"
                self.devices[d_id] = _make_device(d_id, f"Light {i}", "light", room)
                self.after_hours_alerted[d_id] = False

    # ── reads ────────────────────────────────────────────────────────────────

    def all_devices(self) -> List[Device]:
        return list(self.devices.values())

    def devices_by_room(self, room: str) -> List[Device]:
        return [d for d in self.devices.values() if d.room == room]

    def get_usage(self) -> dict:
        per_room: Dict[str, float] = {"drawing": 0.0, "work1": 0.0, "work2": 0.0}
        for d in self.devices.values():
            if d.status == "on":
                per_room[d.room] = round(per_room[d.room] + d.power_w, 1)
        total_w = round(sum(per_room.values()), 1)
        # Rough kWh today estimate: assume average 50% load for 12 h
        kwh_today = round(total_w * 12 / 1000 * 0.5, 3)
        return {
            "total_w": total_w,
            "per_room": per_room,
            "kwh_today": kwh_today,
        }

    def active_alerts(self) -> List[Alert]:
        return [a for a in self.alerts if a.active]

    # ── writes ───────────────────────────────────────────────────────────────

    def update_device(self, device_id: str, status: str, power_w: float | None = None):
        d = self.devices[device_id]
        base = FAN_BASE_W if d.type == "fan" else LIGHT_BASE_W
        d.status = status
        d.power_w = _rand_power(base) if status == "on" else 0.0
        if power_w is not None:
            d.power_w = power_w
        d.last_changed = datetime.now(timezone.utc)

        # Reset after-hours alert flag when device goes off
        if status == "off":
            self.after_hours_alerted[device_id] = False

    def add_alert(self, alert_type: str, room: str | None, message: str) -> Alert:
        self._alert_counter += 1
        a = Alert(
            id=f"alert-{self._alert_counter:04d}",
            type=alert_type,
            room=room,
            message=message,
            triggered_at=datetime.now(timezone.utc),
            active=True,
        )
        self.alerts.append(a)
        return a

    def resolve_alerts_for_room(self, room: str, alert_type: str):
        for a in self.alerts:
            if a.room == room and a.type == alert_type and a.active:
                a.active = False


# Singleton used by the entire app
store = DeviceStore()
