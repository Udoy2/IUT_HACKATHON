import asyncio
import random
from store import store
from sse_manager import broadcast

# How often the simulator ticks (seconds between flips)
FLIP_INTERVAL_MIN = 3
FLIP_INTERVAL_MAX = 15


async def run_simulator():
    """Background task: randomly flips one device's status every 3-15 seconds."""
    while True:
        await asyncio.sleep(random.uniform(FLIP_INTERVAL_MIN, FLIP_INTERVAL_MAX))
        device_ids = list(store.devices.keys())
        device_id = random.choice(device_ids)
        device = store.devices[device_id]
        new_status = "off" if device.status == "on" else "on"
        store.update_device(device_id, new_status)
        updated_device = store.devices[device_id]

        # Broadcast the update to all SSE clients
        await broadcast({
            "type": "device_update",
            "data": updated_device.model_dump(mode="json"),
        })
