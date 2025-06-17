# InternAI Backend

This is the backend API for InternAI, a platform helping students prepare for internships.

## Technologies Used

- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic (migrations)
- JWT Authentication

## Setup Instructions

### Prerequisites

- Python 3.8+
- PostgreSQL

### Environment Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE internai;
```

2. Set environment variables (or use defaults in config.py):
```bash
# Windows
set POSTGRES_USER=your_user
set POSTGRES_PASSWORD=your_password
set POSTGRES_SERVER=localhost
set POSTGRES_PORT=5432
set POSTGRES_DB=internai
set SECRET_KEY=your_secret_key

# Linux/Mac
export POSTGRES_USER=your_user
export POSTGRES_PASSWORD=your_password
export POSTGRES_SERVER=localhost
export POSTGRES_PORT=5432
export POSTGRES_DB=internai
export SECRET_KEY=your_secret_key
```

3. Run migrations:
```bash
cd backend
alembic upgrade head
```

### Running the API

```bash
cd backend
uvicorn app.main:app --reload --port 3001
```

The API will be available at http://localhost:3001

## API Documentation

Once the API is running, you can access the auto-generated documentation:

- Swagger UI: http://localhost:3001/docs
- ReDoc: http://localhost:3001/redoc

## Authentication Endpoints

### Register a new user
```
POST /api/auth/register
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

### Login
```
POST /api/auth/login
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Get current user
```
GET /api/auth/me
```

Headers:
```
Authorization: Bearer your_token
```

### Logout
```
POST /api/auth/logout
```

Headers:
```
Authorization: Bearer your_token
``` 