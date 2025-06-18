from fastapi import APIRouter
from app.api.endpoints import auth

api_router = APIRouter()

# Include auth route module only
api_router.include_router(auth.router, prefix="/auth", tags=["auth"]) 