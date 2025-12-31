from pydantic import BaseModel, field_validator
from enums import OrderStatus, UserRole
import re

class OrderCreate(BaseModel):
    order_id: str
    product_name: str
    customer_name: str
    customer_contact: str
    customer_address: str
    

    @field_validator("customer_name")
    @classmethod
    def validate_customer_name(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        if not re.fullmatch(r"[A-Za-z\s]+", v):
            raise ValueError("Customer name must contain only letters and spaces")
        return v.strip()

    @field_validator("customer_contact")
    @classmethod
    def validate_contact(cls, v):
        if not re.fullmatch(r"^\+?[0-9]{10,15}$", v):
            raise ValueError("Invalid contact number")
        return v

class OrderStatusUpdate(BaseModel):
    new_status: OrderStatus


class LoginRequest(BaseModel):
    username: str
    password: str
 
class CreateUserRequest(BaseModel):
    username: str
    password: str
    role: UserRole

class DeliveryStatusUpdate(BaseModel):
    new_status: OrderStatus
    delivery_id: str