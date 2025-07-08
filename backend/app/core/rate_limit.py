"""
Rate limiting configuration for the InternAI backend.
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request
from typing import Optional
import os


def get_client_ip(request: Request) -> str:
    """
    Get client IP address from request.
    Handles both direct connections and those behind proxies.
    """
    # Check for forwarded headers (when behind proxy/load balancer)
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # X-Forwarded-For can contain multiple IPs, take the first one
        return forwarded_for.split(",")[0].strip()
    
    # Check for real IP header
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip
    
    # Fall back to direct connection IP
    return get_remote_address(request)


def get_redis_url() -> Optional[str]:
    """
    Get Redis URL from environment variables.
    Returns None if Redis is not configured.
    """
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        return redis_url
    
    # Build Redis URL from individual components
    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = os.getenv("REDIS_PORT", "6379")
    redis_db = os.getenv("REDIS_DB", "0")
    redis_password = os.getenv("REDIS_PASSWORD")
    
    # Only return Redis URL if we have a configured Redis host
    if redis_host and redis_host != "localhost":
        if redis_password:
            return f"redis://:{redis_password}@{redis_host}:{redis_port}/{redis_db}"
        else:
            return f"redis://{redis_host}:{redis_port}/{redis_db}"
    
    return None


def create_limiter() -> Limiter:
    """
    Create and configure the rate limiter instance.
    """
    redis_url = get_redis_url()
    
    if redis_url:
        # Use Redis for production/distributed rate limiting
        limiter = Limiter(
            key_func=get_client_ip,
            storage_uri=redis_url,
            default_limits=["1000 per hour"]  # Default fallback limit
        )
    else:
        # Use in-memory storage for development
        limiter = Limiter(
            key_func=get_client_ip,
            default_limits=["1000 per hour"]  # Default fallback limit
        )
    
    return limiter


# Create global limiter instance
limiter = create_limiter()


# Rate limit configurations for different endpoint types
class RateLimits:
    """
    Rate limit definitions for different endpoint categories.
    """
    
    # Authentication endpoints - stricter limits to prevent brute force
    AUTH_LOGIN = "5 per minute"
    AUTH_REGISTER = "10 per hour"
    AUTH_GOOGLE = "10 per minute"
    AUTH_REFRESH = "20 per minute"
    AUTH_GENERAL = "30 per minute"
    
    # AI/Pipeline endpoints - moderate limits due to computational cost
    AI_PIPELINE_RUN = "5 per hour"
    AI_TOPIC_DETAILS = "20 per hour"
    AI_SUBTOPICS = "15 per hour"  # lowered for testing
    AI_CHAT = "30 per minute"  # More generous for interactive chat
    
    # General API endpoints - generous limits for normal usage
    API_GENERAL = "100 per minute"
    API_READ = "200 per minute"
    API_WRITE = "50 per minute"
    
    # Admin/Debug endpoints - very restrictive
    DEBUG_ENDPOINTS = "10 per minute"


 