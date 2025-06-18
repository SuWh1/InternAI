from google.oauth2 import id_token
from google.auth.transport import requests
from typing import Dict, Any, Optional

from app.core.config import settings

async def verify_google_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )
        
        # Check if the token is issued by Google
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            return None
        
        return {
            'google_id': idinfo['sub'],
            'email': idinfo['email'],
            'name': idinfo.get('name', ''),
            'profile_picture': idinfo.get('picture', None)
        }
    except Exception:
        return None

 