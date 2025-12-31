Order Tracking System
Overview

The Order Tracking System is a full-stack web application designed to manage and track orders in real time. It supports multiple user roles and provides secure authentication, live order updates, and a clean separation between backend and frontend.

The backend is built using FastAPI and PostgreSQL, handling business logic, authentication, and database operations. The frontend is built using React (Vite) and provides a responsive interface for users to interact with the system.

This project is suitable for real-world use cases such as e-commerce platforms, food delivery systems, or internal order management tools.

Key Features

User authentication using JWT (JSON Web Tokens)

Secure password hashing with bcrypt

Role-based access control (admin / merchant / delivery)

Order creation and status updates

API key–based authentication for delivery services

PostgreSQL database integration using SQLAlchemy ORM

Environment-based configuration using .env

Modular and scalable project structure

Separate frontend and backend architecture

Tech Stack
Backend

Python

FastAPI

SQLAlchemy

PostgreSQL

JWT Authentication

Passlib (bcrypt)

python-dotenv

Frontend

React

Vite

JavaScript

HTML & CSS

Project Structure
order_tracking_system/
│
├── frontend/               # React frontend
│
├── venv/                   # Python virtual environment
│
├── config.py               # Database, JWT, and security configuration
├── main.py                 # FastAPI application entry point
├── models.py               # Database models
├── schemas.py              # Pydantic schemas
├── enums.py                # Order status enums and transitions
├── init_db.py              # Database initialization script
├── requirements.txt        # Backend dependencies
├── .env                    # Environment variables
└── README.md               # Project documentation

Prerequisites

Before running the project, make sure you have:

Python 3.10 or higher

Node.js 20.19+ or 22+

PostgreSQL installed and running

Git installed

Step-by-Step Setup Guide
1. Clone the Repository
git clone https://github.com/your-username/order_tracking_system.git
cd order_tracking_system

2. Backend Setup (FastAPI)
Create and Activate Virtual Environment
python -m venv venv
venv\Scripts\activate   # Windows

Install Dependencies
pip install -r requirements.txt

3. Configure Environment Variables

Create a .env file in the root directory:

SECRET_KEY=your_jwt_secret_key
DELIVERY_API_KEY=your_delivery_api_key
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/order_tracking

4. Initialize the Database

Make sure PostgreSQL is running and the database exists.

python init_db.py

5. Run the Backend Server
uvicorn main:app --reload


Backend will run at:

http://127.0.0.1:8000


API documentation:

http://127.0.0.1:8000/docs

Frontend Setup (React + Vite)
6. Navigate to Frontend Folder
cd frontend

7. Install Frontend Dependencies
npm install

8. Start Frontend Server
npm run dev


Frontend will run at:

http://localhost:5173

Authentication Flow

Users log in with credentials

Backend issues a JWT access token

Token is required for protected routes

Delivery services use an API key for authentication

Passwords are never stored in plain text

Security Measures

JWT expiration handling

Password hashing using bcrypt

Environment-based secrets

API key validation for delivery endpoints

Role-based authorization logic

Future Improvements

Refresh token support

WebSocket-based live order updates

Admin dashboard analytics

Dockerized deployment

CI/CD pipeline integration

Improved frontend UI/UX

Author

Jino Mathew
MCA Student | Full-Stack Developer
Focused on building secure, scalable, and real-world applications.

License

This project is open-source and available for learning and educational purposes.