from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime


class Device(BaseModel):
    id: str
    name: str
    type: Literal["fan", "light"]
    room: Literal["drawing", "work1", "work2"]
    status: Literal["on", "off"]
    power_w: float
    last_changed: datetime


class Alert(BaseModel):
    id: str
    type: Literal["after_hours", "room_stuck_on"]
    room: Optional[str] = None
    message: str
    triggered_at: datetime
    active: bool
