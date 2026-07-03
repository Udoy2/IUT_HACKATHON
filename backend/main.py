import asyncio
import json
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from alerts import run_alert_engine
from simulator import run_simulator
from sse_manager import broadcast, register_client, unregister_client
from store import store


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background tasks on startup
    sim_task = asyncio.create_task(run_simulator())
    alert_task = asyncio.create_task(run_alert_engine())
    yield
    sim_task.cancel()
    alert_task.cancel()


app = FastAPI(title="Office Watch API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── REST endpoints ────────────────────────────────────────────────────────────

@app.get("/api/devices")
def get_devices():
    return [d.model_dump(mode="json") for d in store.all_devices()]


@app.get("/api/rooms/{room}")
def get_room(room: str):
    valid_rooms = {"drawing", "work1", "work2"}
    if room not in valid_rooms:
        raise HTTPException(status_code=404, detail=f"Unknown room: {room}. Valid: {valid_rooms}")
    return [d.model_dump(mode="json") for d in store.devices_by_room(room)]


@app.get("/api/usage")
def get_usage():
    return store.get_usage()


@app.get("/api/alerts")
def get_alerts():
    return [a.model_dump(mode="json") for a in store.active_alerts()]


# ── SSE stream ────────────────────────────────────────────────────────────────

async def _event_generator() -> AsyncGenerator[str, None]:
    q = register_client()
    try:
        # Send a heartbeat comment every 15 s to keep the connection alive
        while True:
            try:
                event = await asyncio.wait_for(q.get(), timeout=15.0)
                payload = json.dumps(event, default=str)
                yield f"data: {payload}\n\n"
            except asyncio.TimeoutError:
                yield ": heartbeat\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        unregister_client(q)


@app.get("/stream")
async def stream():
    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/")
def root():
    return {"status": "ok", "message": "Office Watch API — hit /api/devices to start"}
