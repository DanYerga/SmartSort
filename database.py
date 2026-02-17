from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./smartbin.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Container(Base):
    __tablename__ = "containers"
    id             = Column(Integer, primary_key=True, index=True)
    name           = Column(String)
    district       = Column(String)
    lat            = Column(Float)
    lng            = Column(Float)
    fill_level     = Column(Float, default=0.0)
    status         = Column(String, default="ok")
    has_violation  = Column(Boolean, default=False)
    waste_type     = Column(String, default="смешанный")
    violation_type = Column(String, nullable=True)

class Alert(Base):
    __tablename__ = "alerts"
    id             = Column(Integer, primary_key=True, index=True)
    container_id   = Column(Integer)
    container_name = Column(String)
    type           = Column(String)
    message        = Column(String)
    created_at     = Column(DateTime, default=datetime.now)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()