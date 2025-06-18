import re

def is_valid_email(email: str) -> bool:
    """
    Validate an email address using a simple regex pattern.
    
    Args:
        email: The email address to validate
        
    Returns:
        bool: True if the email is valid, False otherwise
    """
    # Simple email regex pattern
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if re.match(pattern, email):
        return True
    return False 