from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import asyncio
import json

from database import get_db, init_db, Container, Alert, SessionLocal
from simulator import init_containers, simulate

app = FastAPI(title="SmartSort API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

active_connections: List[WebSocket] = []

@app.on_event("startup")
async def startup():
    init_db()
    init_containers()
    asyncio.create_task(simulate())
    asyncio.create_task(broadcast_updates())

def container_to_dict(c):
    return {
        "id": c.id,
        "name": c.name,
        "district": c.district,
        "lat": c.lat,
        "lng": c.lng,
        "fill_level": round(c.fill_level, 1),
        "status": c.status,
        "has_violation": c.has_violation,
        "waste_type": c.waste_type,
        "violation_type": c.violation_type,
    }

async def broadcast_updates():
    while True:
        if active_connections:
            db = SessionLocal()
            containers = db.query(Container).all()
            data = [container_to_dict(c) for c in containers]
            db.close()
            for connection in active_connections.copy():
                try:
                    await connection.send_text(json.dumps(data))
                except:
                    active_connections.remove(connection)
        await asyncio.sleep(5)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)

@app.get("/containers")
def get_containers(waste_type: str = None, db: Session = Depends(get_db)):
    query = db.query(Container)
    if waste_type:
        query = query.filter(Container.waste_type == waste_type)
    return [container_to_dict(c) for c in query.all()]

@app.get("/containers/{container_id}")
def get_container(container_id: int, db: Session = Depends(get_db)):
    c = db.query(Container).filter(Container.id == container_id).first()
    if not c:
        return {"error": "Не найден"}
    return container_to_dict(c)

@app.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).limit(50).all()
    return [
        {
            "id": a.id,
            "container_id": a.container_id,
            "container_name": a.container_name,
            "type": a.type,
            "message": a.message,
            "created_at": a.created_at.isoformat()
        }
        for a in alerts
    ]

@app.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    containers = db.query(Container).all()
    districts = {}
    waste_stats = {}

    for c in containers:
        if c.district not in districts:
            districts[c.district] = {"name": c.district, "total": 0, "violations": 0, "fill_sum": 0}
        districts[c.district]["total"] += 1
        districts[c.district]["fill_sum"] += c.fill_level
        if c.has_violation:
            districts[c.district]["violations"] += 1

        if c.waste_type not in waste_stats:
            waste_stats[c.waste_type] = {"type": c.waste_type, "total": 0, "violations": 0, "avg_fill": 0, "fill_sum": 0}
        waste_stats[c.waste_type]["total"] += 1
        waste_stats[c.waste_type]["fill_sum"] += c.fill_level
        if c.has_violation:
            waste_stats[c.waste_type]["violations"] += 1

    district_result = []
    for d in districts.values():
        d["avg_fill"] = round(d["fill_sum"] / d["total"], 1)
        d["score"] = max(0, 100 - d["violations"] * 20 - int(d["avg_fill"] * 0.3))
        district_result.append(d)
    district_result.sort(key=lambda x: x["score"], reverse=True)

    waste_result = []
    for w in waste_stats.values():
        w["avg_fill"] = round(w["fill_sum"] / w["total"], 1)
        waste_result.append(w)

    return {"districts": district_result, "waste_types": waste_result}

@app.get("/route")
def get_route(db: Session = Depends(get_db)):
    containers = db.query(Container).filter(
        (Container.status == "critical") | (Container.status == "violation")
    ).all()
    return [container_to_dict(c) for c in containers]

@app.post("/containers/{container_id}/collect")
def collect_container(container_id: int, db: Session = Depends(get_db)):
    c = db.query(Container).filter(Container.id == container_id).first()
    if c:
        c.fill_level = 5.0
        c.status = "ok"
        c.has_violation = False
        c.violation_type = None
        db.commit()
    return {"success": True}


# ── /sensor — приём данных с ESP32 датчика ──────────────────────────
class SensorData(BaseModel):
    container_id: int
    fill_level: float
    distance_cm: float
    status: str

@app.post("/sensor")
async def receive_sensor(data: SensorData, db: Session = Depends(get_db)):
    c = db.query(Container).filter(Container.id == data.container_id).first()
    if not c:
        return {"error": f"Контейнер {data.container_id} не найден"}

    # Обновляем данные от датчика
    c.fill_level = round(data.fill_level, 1)
    c.status     = data.status
    db.commit()

    # Создаём алерт если критично или внимание
    if data.status in ("critical", "warning"):
        alert_type = "critical" if data.status == "critical" else "warning"
        msg = (
            f"[ESP32] {c.name} заполнен на {data.fill_level:.0f}%"
            f" — уровень '{data.status}' (расстояние {data.distance_cm:.1f} см)"
        )
        alert = Alert(
            container_id=c.id,
            container_name=c.name,
            type=alert_type,
            message=msg,
        )
        db.add(alert)
        db.commit()

    return {
        "ok": True,
        "container": c.name,
        "fill_level": c.fill_level,
        "status": c.status,
    }