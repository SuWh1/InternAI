from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.api.api_router import api_router
from app.core.config import settings
from app.core.rate_limit import limiter

# Note: Database tables are created via Alembic migrations
# Run: alembic upgrade head

app = FastAPI(title=settings.PROJECT_NAME)

# Set up rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Add SlowAPI middleware
app.add_middleware(SlowAPIMiddleware)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)