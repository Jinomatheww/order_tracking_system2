# from datetime import datetime, timedelta
# from fastapi import HTTPException, Header
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker, declarative_base
# import os
# from jose import jwt, JWTError
# from passlib.context import CryptContext
# from dotenv import load_dotenv
# import os

# load_dotenv()  

# DATABASE_URL = "postgresql+psycopg2://postgres:password@localhost:5432/order_tracking"

# engine = create_engine(DATABASE_URL, echo=True)

# SessionLocal = sessionmaker(bind=engine)

# Base = declarative_base()


# DELIVERY_API_KEY = os.getenv("DELIVERY_API_KEY")
# SECRET_KEY = os.getenv("SECRET_KEY")
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 60
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# def hash_password(password: str) -> str:
#     return pwd_context.hash(password)

# def verify_password(password: str, hash: str) -> bool:
#     return pwd_context.verify(password, hash)

# def create_access_token(data: dict):
#     to_encode = data.copy()
#     expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# def verify_delivery_key(x_api_key: str = Header(...)):
#     if x_api_key != DELIVERY_API_KEY:
#         raise HTTPException(status_code=401, detail="Invalid delivery key")
#     return True




































from datetime import datetime, timedelta
from fastapi import HTTPException, Header
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from jose import jwt, JWTError
from passlib.context import CryptContext
from dotenv import load_dotenv
import os

load_dotenv()

# DATABASE_URL = os.getenv(
#     "DATABASE_URL",
#     "postgresql+psycopg2://postgres:password@localhost:5432/order_tracking"
# )
DATABASE_URL = os.getenv("DATABASE_URL")


engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ---------------- SECURITY ----------------
DELIVERY_API_KEY = os.getenv("DELIVERY_API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is missing in .env")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---------------- PASSWORD UTILS ----------------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)

# ---------------- JWT UTILS ----------------
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# ---------------- DELIVERY AUTH ----------------
def verify_delivery_key(x_api_key: str = Header(...)):
    if not DELIVERY_API_KEY:
        raise HTTPException(status_code=500, detail="Delivery API key not configured")

    if x_api_key != DELIVERY_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid delivery key")

    return True
