import asyncio
from datetime import datetime, timezone, timedelta
from store import store
from sse_manager import broadcast

ALERT_TICK_SECONDS = 30
STUCK_ON_THRESHOLD_HOURS = 2
OFFICE_START = 9   # 9 AM
OFFICE_END = 17    # 5 PM

ROOM_LABELS = {
    "drawing": "Drawing Room",
    "work1": "Work Room 1",
    "work2": "Work Room 2",
}


def _is_after_hours(now: datetime) -> bool:
    hour = now.hour
    return hour < OFFICE_START or hour >= OFFICE_END


async def run_alert_engine():
    """Background task: checks alert rules every ALERT_TICK_SECONDS seconds."""
    while True:
        await asyncio.sleep(ALERT_TICK_SECONDS)
        now = datetime.now(timezone.utc)
        # Convert UTC to a reasonable local offset (assume UTC+6 for demo)
        local_now = now + timedelta(hours=6)
        after_hours = _is_after_hours(local_now)

        for room, label in ROOM_LABELS.items():
            devices = store.devices_by_room(room)
            on_devices = [d for d in devices if d.status == "on"]

            # ── After-hours rule ──────────────────────────────────────────
            if after_hours:
                for d in on_devices:
                    if not store.after_hours_alerted.get(d.id, False):
                        store.after_hours_alerted[d.id] = True
                        msg = (
                            f"{label}: {d.name} is ON at "
                            f"{local_now.strftime('%I:%M %p')} (after hours)"
                        )
                        alert = store.add_alert("after_hours", room, msg)
                        await broadcast({"type": "alert", "data": alert.model_dump(mode="json")})
            else:
                # During office hours: reset flags
                for d in devices:
                    store.after_hours_alerted[d.id] = False

            # ── Room-stuck-on rule ────────────────────────────────────────
            all_on = len(on_devices) == len(devices)  # all 5 on

            if all_on:
                if store.room_all_on_since[room] is None:
                    store.room_all_on_since[room] = now
                else:
                    elapsed = (now - store.room_all_on_since[room]).total_seconds()
                    if elapsed >= STUCK_ON_THRESHOLD_HOURS * 3600:
                        # Check whether we already have an active alert for this
                        existing = [
                            a for a in store.alerts
                            if a.room == room and a.type == "room_stuck_on" and a.active
                        ]
                        if not existing:
                            elapsed_h = round(elapsed / 3600, 1)
                            fans = sum(1 for d in devices if d.type == "fan" and d.status == "on")
                            lights = sum(1 for d in devices if d.type == "light" and d.status == "on")
                            msg = (
                                f"{label} has had all devices ON for {elapsed_h}h "
                                f"({fans} fan(s), {lights} light(s))"
                            )
                            alert = store.add_alert("room_stuck_on", room, msg)
                            await broadcast({"type": "alert", "data": alert.model_dump(mode="json")})
            else:
                # Any device off → reset the clock and resolve stuck-on alerts
                if store.room_all_on_since[room] is not None:
                    store.room_all_on_since[room] = None
                    store.resolve_alerts_for_room(room, "room_stuck_on")
