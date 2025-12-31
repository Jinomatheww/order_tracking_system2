from config import engine
from models import Base

def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()

    

# from sqlalchemy import create_engine
# from models import Base
# from config import DATABASE_URL

# print("🔹 DATABASE_URL =", DATABASE_URL)

# engine = create_engine(DATABASE_URL, echo=True)

# print("🔹 Creating tables...")
# Base.metadata.create_all(bind=engine)
# print("✅ Tables created successfully")
