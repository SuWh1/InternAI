# Docker Setup for InternAI

This project includes Docker configurations for both development and production environments.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

### Production Build
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build
```

### Development Build (with hot reloading)
```bash
# Build and start development environment
docker-compose -f docker-compose.dev.yml up --build

# Run in background
docker-compose -f docker-compose.dev.yml up -d --build
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 80 (prod) / 5173 (dev) | React application |
| Backend | 8000 | FastAPI application |
| Database | 5432 | PostgreSQL database |
| Adminer | 8080 | Database admin interface |

## URLs

- **Frontend**: http://localhost (prod) / http://localhost:5173 (dev)
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database Admin**: http://localhost:8080

## Database Credentials

- **Database**: internai
- **Username**: internai_user
- **Password**: internai_password

## Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v

# View logs
docker-compose logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Execute commands in running containers
docker-compose exec backend bash
docker-compose exec frontend sh

# Run database migrations
docker-compose exec backend alembic upgrade head
```

## Development vs Production

### Development Features:
- Hot reloading for both frontend and backend
- Source code mounted as volumes
- Vite dev server for frontend
- Separate dev database volume

### Production Features:
- Optimized builds
- Nginx serving static files
- No source code mounting
- Production-ready configurations

## Environment Variables

Create `.env` files in backend and frontend directories for custom configurations:

### Backend `.env`:
```
DATABASE_URL=postgresql://internai_user:internai_password@db:5432/internai
SECRET_KEY=your_secret_key_here
```

### Frontend `.env`:
```
VITE_API_URL=http://localhost:8000
```

## Troubleshooting

1. **Port conflicts**: Change ports in docker-compose files
2. **Database connection issues**: Ensure database service is healthy before backend starts
3. **Permission issues**: Run with `sudo` if needed
4. **Build cache issues**: Use `docker-compose build --no-cache` 