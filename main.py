from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends,HTTPException
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from datetime import datetime
from fastapi import Path
from config import ALGORITHM, SECRET_KEY, SessionLocal, create_access_token, hash_password, verify_delivery_key, verify_password
import enums
from models import Order, StatusHistory, User
from schemas import CreateUserRequest, DeliveryStatusUpdate, LoginRequest, OrderCreate
from typing import List, Optional
from fastapi import Query
from enums import OrderStatus, ALLOWED_TRANSITIONS
from schemas import OrderStatusUpdate
from sqlalchemy.exc import SQLAlchemyError
import logging
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from config import engine
from models import Base


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

security = HTTPBearer()

def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app = FastAPI()
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request, exc):
    logger.error(f"DB Error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "A database error occurred"}
    )


@app.post("/orders", status_code=201)
async def create_order(order: OrderCreate,user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user["role"] != "merchant":
        raise HTTPException(status_code=403, detail="Only merchants can create orders")
    existing_order = db.query(Order).filter(Order.order_id == order.order_id).first()
    if existing_order:
        raise HTTPException(status_code=400, detail="Order ID already exist!")

    new_order = Order(
        order_id=order.order_id,
        product_name=order.product_name,
        customer_name=order.customer_name,
        customer_contact=order.customer_contact,
        customer_address=order.customer_address,
        merchant_name=user["sub"],
        current_status=OrderStatus.CREATED.value,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    history = StatusHistory(
        order_id=order.order_id,
        status=OrderStatus.CREATED.value,
        updated_by="system"
    )

    try:
        db.add(new_order)
        db.add(history)
        db.commit()
        await manager.broadcast(new_order, {
            "order_id": new_order.order_id,
            "status": new_order.current_status,
            "timestamp": new_order.created_at.isoformat(),
            "metadata": {"updated_by": user["sub"], "source": "merchant"}
        })
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create order!")

    return {
        "order_id": order.order_id,
        "status": OrderStatus.CREATED.value,
        "message": "Order created successfully!"
    }



@app.get("/orders")
def get_orders(
    status: Optional[str] = Query(None, description="ACTIVE or DELIVERED"),
    merchant: Optional[str] = Query(None),
    customer_contact: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    query = db.query(Order)
    if user["role"] == "merchant":
        query = query.filter(Order.merchant_name == user["sub"])
   
    if status:
        status = status.upper()
        if status == "ACTIVE":
            query = query.filter(
                Order.current_status.notin_(["DELIVERED", "CANCELLED"])
            )
        else:
            query = query.filter(Order.current_status == status)
 
    if merchant:
        query = query.filter(Order.merchant_name == merchant)

    if customer_contact:
        query = query.filter(Order.customer_contact == customer_contact)
  
    if from_date:
        query = query.filter(Order.created_at >= datetime.fromisoformat(from_date))
    if to_date:
        query = query.filter(Order.created_at <= datetime.fromisoformat(to_date))

    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

    if not orders:
        return {
            "count": 0,
            "message": "No orders found for given filters",
            "orders": []
        }

    return {
        "count": len(orders),
        "orders": [
            {
                "order_id": order.order_id,
                "merchant_name": order.merchant_name,
                "customer_contact": order.customer_contact,
                "current_status": order.current_status,
                "created_at": order.created_at,
                "updated_at": order.updated_at
            }
            for order in orders
        ]
    }


@app.get("/orders/{order_id}", response_model=dict)
def get_order(order_id: str = Path(..., description="The ID of the order to retrieve"),user=Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")


    if user["role"] == "merchant" and order.merchant_name != user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return {
        "order_id": order.order_id,
        "customer_name": order.customer_name,
        "product_name": order.product_name,
        "customer_contact": order.customer_contact,
        "customer_address": order.customer_address,
        "merchant_name": order.merchant_name,
        "current_status": order.current_status,
        "created_at": order.created_at,
        "updated_at": order.updated_at
    }


@app.get("/orders/{order_id}/history")
def get_order_history(order_id: str,user=Depends(get_current_user), db: Session = Depends(get_db)):
 
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if user["role"] == "merchant" and order.merchant_name != user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied")

    history = (
        db.query(StatusHistory)
        .filter(StatusHistory.order_id == order_id)
        .order_by(StatusHistory.timestamp.asc())
        .all()
    )

    if not history:
        return {"order_id": order_id, "history": []}

    return {
        "order_id": order_id,
        "history": [
            {
                "status": h.status,
                "timestamp": h.timestamp,
                "updated_by": h.updated_by
            }
            for h in history
        ]
    }

@app.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user["role"] != "operations_team":
        raise HTTPException(status_code=403, detail="Not authorized")
    updated_by = user["sub"]

    order = db.query(Order).filter(Order.order_id == order_id).with_for_update().first()  #lock the row for update
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    current_status = OrderStatus(order.current_status)
    new_status = payload.new_status

    allowed = ALLOWED_TRANSITIONS[current_status]
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition from {current_status.value} to {new_status.value}"
        )

    try:
   
        order.current_status = new_status.value
        order.updated_at = datetime.utcnow()

        last_history = db.query(StatusHistory).filter(StatusHistory.order_id == order_id).order_by(StatusHistory.timestamp.desc()).first()
        if not last_history or last_history.status != new_status.value:
            history = StatusHistory(
                order_id=order.order_id,
                status=new_status.value,
                updated_by=updated_by,
                source="operations"
            )

            db.add(history)
        db.commit()
        await manager.broadcast(
            order,
            {
                "order_id": order.order_id,
                "current_status": order.current_status,
                "timestamp": order.updated_at.isoformat(),
                "metadata": {"updated_by": updated_by, "source": "operations"}
            }
        )




        db.refresh(order)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update order status!")

    return {
        "order_id": order.order_id,
        "old_status": current_status.value,
        "new_status": new_status.value,
        "updated_at": order.updated_at
    }





@app.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "sub": user.username,
        "role": user.role
    })

    return {
        "access_token": token,
        "role": user.role,
        "username": user.username
    }

@app.post("/users", status_code=201)
def create_user(
    payload: CreateUserRequest,
    db: Session = Depends(get_db)
):
    if payload.role not in enums.UserRole:
        raise HTTPException(status_code=400, detail="Invalid role")

    existing_user = db.query(User).filter(
        User.username == payload.username
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(
        username=payload.username,
        password=hash_password(payload.password),
        role=payload.role
    )

    db.add(user)
    db.commit()

    return {
        "message": "User created successfully",
        "username": payload.username,
        "role": payload.role
    }

@app.put("/delivery/orders/{order_id}/status")
async def delivery_update_status(
    order_id: str,
    payload: DeliveryStatusUpdate,
    authorized=Depends(verify_delivery_key),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(
        Order.order_id == order_id
    ).with_for_update().first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    new_status = payload.new_status

    order.current_status = new_status.value
    order.updated_at = datetime.utcnow()

    history = StatusHistory(
        order_id=order_id,
        status=new_status.value,
        updated_by=payload.delivery_id, 
        source="delivery"
    )

    db.add(history)
    db.commit()
    db.refresh(order)
    await manager.broadcast(order, { 
            "order_id": order.order_id,
            "status": order.current_status,
            "timestamp": order.updated_at.isoformat(),
            "metadata": {"updated_by": payload.delivery_id, "source": "delivery"}})
    return {"message": "Status updated by delivery"}


@app.get("/order-statuses")
def get_order_statuses(user=Depends(get_current_user)):
    return {
        "statuses": [status.value for status in OrderStatus]
    }










class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket, user: dict):
        await websocket.accept()
        self.active_connections[websocket] = user

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            del self.active_connections[websocket]

    async def broadcast(self, order: Order, message: dict):
        for ws, user in list(self.active_connections.items()):
            if user["role"] == "operations_team" or user["sub"] == order.merchant_name:
                try:
                    await ws.send_json(message)
                except Exception:
                    self.disconnect(ws)

manager = ConnectionManager()


@app.websocket("/ws/orders")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = {"sub": payload["sub"], "role": payload["role"]}
    except JWTError:
        await websocket.close(code=1008) 
        return

    await manager.connect(websocket, user)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)