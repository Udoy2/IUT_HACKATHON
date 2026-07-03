import asyncio
import json
from typing import Any, Dict, List
from asyncio import Queue

# Set of active SSE queues — one per connected client
_clients: List[Queue] = []


def get_client_count() -> int:
    return len(_clients)


async def broadcast(event: Dict[str, Any]):
    """Push an event dict to every connected SSE client."""
    dead = []
    for q in _clients:
        try:
            await q.put(event)
        except Exception:
            dead.append(q)
    for q in dead:
        _clients.remove(q)


def register_client() -> Queue:
    q: Queue = asyncio.Queue()
    _clients.append(q)
    return q


def unregister_client(q: Queue):
    if q in _clients:
        _clients.remove(q)
