from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Схема контейнера для API
class ContainerSchema(BaseModel):
    id: int
    name: str
    district: str
    lat: float
    lng: float
    fill_level: float
    status: str
    has_violation: bool

    class Config:
        from_attributes = True

# Схема алерта для API
class AlertSchema(BaseModel):
    id: int
    container_id: int
    container_name: str
    type: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True