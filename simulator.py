import asyncio
import random
from datetime import datetime
from database import SessionLocal, Container, Alert, init_db

WASTE_TYPES = ["пластик", "стекло", "бумага", "металл", "органика", "смешанный"]
WASTE_COLORS = {
    "пластик": "yellow",
    "стекло":  "green",
    "бумага":  "blue",
    "металл":  "gray",
    "органика":"brown",
    "смешанный":"red"
}

CONTAINERS = [
    {"name": "ул. Абая 10",           "district": "Бостандыкский", "lat": 43.2220, "lng": 76.8512, "waste_type": "пластик"},
    {"name": "ул. Абая 45",           "district": "Бостандыкский", "lat": 43.2234, "lng": 76.8634, "waste_type": "стекло"},
    {"name": "ул. Тимирязева 5",      "district": "Бостандыкский", "lat": 43.2198, "lng": 76.8478, "waste_type": "бумага"},
    {"name": "ул. Байзакова 12",      "district": "Бостандыкский", "lat": 43.2267, "lng": 76.8589, "waste_type": "металл"},
    {"name": "пр. Достык 20",         "district": "Медеуский",     "lat": 43.2310, "lng": 76.9012, "waste_type": "пластик"},
    {"name": "пр. Достык 88",         "district": "Медеуский",     "lat": 43.2356, "lng": 76.9134, "waste_type": "стекло"},
    {"name": "ул. Оспанова 3",        "district": "Медеуский",     "lat": 43.2289, "lng": 76.8967, "waste_type": "бумага"},
    {"name": "ул. Горная 7",          "district": "Медеуский",     "lat": 43.2401, "lng": 76.9078, "waste_type": "органика"},
    {"name": "пр. Аль-Фараби 15",    "district": "Алатауский",    "lat": 43.2145, "lng": 76.8234, "waste_type": "пластик"},
    {"name": "пр. Аль-Фараби 77",    "district": "Алатауский",    "lat": 43.2167, "lng": 76.8356, "waste_type": "металл"},
    {"name": "ул. Жандосова 4",       "district": "Алатауский",    "lat": 43.2112, "lng": 76.8178, "waste_type": "стекло"},
    {"name": "ул. Саина 22",          "district": "Алатауский",    "lat": 43.2089, "lng": 76.8289, "waste_type": "бумага"},
    {"name": "ул. Майлина 8",         "district": "Турксибский",   "lat": 43.2567, "lng": 76.9234, "waste_type": "органика"},
    {"name": "ул. Майлина 34",        "district": "Турксибский",   "lat": 43.2589, "lng": 76.9312, "waste_type": "пластик"},
    {"name": "ул. Северное кольцо 1", "district": "Турксибский",   "lat": 43.2612, "lng": 76.9178, "waste_type": "металл"},
    {"name": "ул. Рыскулова 5",       "district": "Турксибский",   "lat": 43.2634, "lng": 76.9089, "waste_type": "стекло"},
    {"name": "пр. Райымбека 10",      "district": "Жетысуский",    "lat": 43.2456, "lng": 76.9456, "waste_type": "бумага"},
    {"name": "пр. Райымбека 56",      "district": "Жетысуский",    "lat": 43.2478, "lng": 76.9534, "waste_type": "пластик"},
    {"name": "ул. Шаляпина 3",        "district": "Жетысуский",    "lat": 43.2512, "lng": 76.9389, "waste_type": "органика"},
    {"name": "ул. Бекова 11",         "district": "Жетысуский",    "lat": 43.2534, "lng": 76.9467, "waste_type": "металл"},
]

# Что НЕ должно попасть в каждый тип контейнера
WRONG_WASTE = {
    "пластик":  ["стекло", "металл", "органика"],
    "стекло":   ["пластик", "бумага", "органика"],
    "бумага":   ["стекло", "металл", "органика"],
    "металл":   ["пластик", "бумага", "органика"],
    "органика": ["пластик", "стекло", "металл"],
    "смешанный":[]
}

def get_status(fill_level, has_violation):
    if has_violation:
        return "violation"
    elif fill_level >= 80:
        return "critical"
    elif fill_level >= 60:
        return "warning"
    return "ok"

def init_containers():
    db = SessionLocal()
    if db.query(Container).count() > 0:
        db.close()
        return
    for c in CONTAINERS:
        container = Container(
            name=c["name"],
            district=c["district"],
            lat=c["lat"],
            lng=c["lng"],
            fill_level=random.uniform(10, 70),
            status="ok",
            has_violation=False,
            waste_type=c["waste_type"],
            violation_type=None
        )
        db.add(container)
    db.commit()
    db.close()
    print("✅ Контейнеры созданы")

async def simulate():
    print("🚀 Симулятор запущен")
    while True:
        db = SessionLocal()
        containers = db.query(Container).all()

        for container in containers:
            container.fill_level += random.uniform(1, 8)

            if container.fill_level >= 100:
                container.fill_level = random.uniform(5, 15)
                container.has_violation = False
                container.violation_type = None
                print(f"🗑️ Контейнер '{container.name}' опустошён")

            # Нарушение — бросили не тот тип мусора
            if random.random() < 0.05 and not container.has_violation:
                wrong = random.choice(WRONG_WASTE.get(container.waste_type, ["смешанный"]))
                container.has_violation = True
                container.violation_type = wrong
                alert = Alert(
                    container_id=container.id,
                    container_name=container.name,
                    type="violation",
                    message=f"⚠️ В контейнер [{container.waste_type}] выброшен [{wrong}]: {container.name}",
                    created_at=datetime.now()
                )
                db.add(alert)
                print(f"⚠️ Нарушение в '{container.name}': бросили {wrong} вместо {container.waste_type}")

            if container.fill_level >= 80 and container.status != "critical":
                alert = Alert(
                    container_id=container.id,
                    container_name=container.name,
                    type="filled",
                    message=f"🔴 [{container.waste_type.upper()}] заполнен на {container.fill_level:.0f}%: {container.name}",
                    created_at=datetime.now()
                )
                db.add(alert)

            container.status = get_status(container.fill_level, container.has_violation)

        db.commit()
        db.close()
        await asyncio.sleep(5)

if __name__ == "__main__":
    init_db()
    init_containers()
    asyncio.run(simulate())