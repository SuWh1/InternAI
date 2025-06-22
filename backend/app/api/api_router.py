from fastapi import APIRouter
from app.api.endpoints import auth, onboarding, agents

api_router = APIRouter()

# Include route modules
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"]) 