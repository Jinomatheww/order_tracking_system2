# Order Tracking System (FastAPI Backend)

This project is a backend Order Tracking System built using FastAPI.  
It supports role-based authentication, order lifecycle management, and real-time order status updates using WebSockets.

This is an internal system where users are created by an administrator and not through public signup.



## Features

- JWT-based authentication
- Role-based access control
  - Operations Team
  - Merchant
- Order creation and tracking
- Order status transition validation
- Order status history
- Real-time order updates using WebSockets
- PostgreSQL database persistence



## Tech Stack

- Python
- FastAPI
- PostgreSQL
- SQLAlchemy
- JWT Authentication
- WebSockets



## Live API Documentation

After deployment, Swagger UI is available at:

https://your-app-url.onrender.com/docs

This allows testing all APIs directly from the browser.



## User Management Design

This system does not include a public signup page.

Users are created by an authorized admin using a secure API endpoint.
This is intentional and reflects real-world internal system design.

Initial users are created once after deployment and stored permanently in the database.



## Demo Credentials (After Initial Setup)

Operations Team:
- Username: ops1
- Password: op@123

Merchant:
- Username: merchant1
- Password: merchant123



## Initial Setup After Deployment

1. Open Swagger UI:
   /docs

2. Create first admin user:
   POST /users

   Request body:
   {
     "username": "ops1",
     "password": "ops123",
     "role": "operations_team"
   }

3. Login:
   POST /login

4. Use the received JWT token to authorize further requests.

5. Create merchant users using the same /users endpoint.



## Local Development Setup

Clone the repository:

git clone https://github.com/your-username/order-tracking-system
cd order-tracking-system

Create virtual environment and install dependencies:

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

Create a .env file:

DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/order_tracking
SECRET_KEY=your-secret-key
DELIVERY_API_KEY=delivery-secret-key

Run the application:

uvicorn main:app --reload

Access Swagger UI locally:

http://localhost:8000/docs

---

## Roles and Permissions

Operations Team:
- View all orders
- Update order status
- Create merchant users

Merchant:
- Create orders
- View own orders
- Receive real-time status updates

Delivery:
- Update order status using API key authentication

---

## Real-Time Updates

WebSocket endpoint:
/ws/orders

Authenticated users receive live order status updates based on role and ownership.

---



Backend Developer
Order Tracking System Project