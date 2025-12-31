from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
from config import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String(50), unique=True, nullable=False, index=True)
    product_name = Column(String(100), nullable=False)
    customer_name = Column(String(100), nullable=False)
    customer_contact = Column(String(50), nullable=False)
    customer_address = Column(String(200), nullable=False)
    merchant_name = Column(String(100), nullable=False)
    current_status = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(
        String(50),
        ForeignKey("orders.order_id"),
        nullable=False,
        index=True
    )
    status = Column(String(20), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    updated_by = Column(String(50), nullable=False)
    source = Column(String(50), nullable=True)
    
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password = Column(String(200), nullable=False)
    role = Column(String(20), nullable=False)