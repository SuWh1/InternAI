from google.oauth2 import id_token
from google.auth.transport import requests
from typing import Dict, Any, Optional
import time

from app.core.config import settings

def check_system_time():
    """Check if system time seems reasonable (basic sanity check)"""
    current_time = time.time()
    # Check if time is reasonable (after 2020 and before 2050)
    if current_time < 1577836800 or current_time > 2524608000:  
        print(f"WARNING: System time may be incorrect. Current timestamp: {current_time}")
        return False
    return True

async def verify_google_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        # Check if Google Client ID is configured
        if not settings.GOOGLE_CLIENT_ID or settings.GOOGLE_CLIENT_ID == "your-google-client-id-here":
            print("ERROR: GOOGLE_CLIENT_ID not configured in environment variables")
            return None
        
        # Basic system time check
        check_system_time()
            
        print(f"DEBUG: Verifying token with Client ID: {settings.GOOGLE_CLIENT_ID[:20]}...")
        
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10  # Allow 10 seconds of clock skew tolerance
        )
        
        print(f"DEBUG: Token verification successful for user: {idinfo.get('email', 'unknown')}")
        print(f"DEBUG: Token info: {idinfo}")
        
        # Check if the token is issued by Google
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            print(f"ERROR: Token not issued by Google. Issuer: {idinfo.get('iss')}")
            return None
        
        # Ensure we have required fields
        if not idinfo.get('sub'):
            print("ERROR: Missing 'sub' field in Google token")
            return None
            
        if not idinfo.get('email'):
            print("ERROR: Missing 'email' field in Google token")
            return None
        
        user_data = {
            'google_id': idinfo['sub'],
            'email': idinfo['email'],
            'name': idinfo.get('name', idinfo.get('email', 'Google User')),  # Fallback to email if name missing
            'profile_picture': idinfo.get('picture', None)
        }
        
        print(f"DEBUG: Returning user data: {user_data}")
        return user_data
        
    except ValueError as e:
        print(f"ERROR: Invalid Google token (ValueError): {e}")
        return None
    except Exception as e:
        print(f"ERROR: Google token verification failed (Exception): {type(e).__name__}: {e}")
        return None

 