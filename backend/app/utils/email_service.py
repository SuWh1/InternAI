import os
import random
from datetime import datetime, timedelta
from typing import Optional

import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

from app.core.config import settings


class EmailService:
    def __init__(self):
        """Initialize Brevo email service."""
        # Check if API key is provided
        if not settings.BREVO_API_KEY:
            raise ValueError("BREVO_API_KEY is not set in environment variables")
            
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = settings.BREVO_API_KEY
        self.api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
        
        # Print configuration for debugging (remove in production)
        print(f"Brevo API key configured: {settings.BREVO_API_KEY[:10]}...")
        print(f"Brevo from email: {settings.BREVO_FROM_EMAIL}")
        print(f"Brevo template ID: {settings.BREVO_TEMPLATE_ID}")

    def generate_pin_code(self) -> str:
        """Generate a 6-digit PIN code."""
        return str(random.randint(100000, 999999))

    def get_pin_expiration(self) -> datetime:
        """Get PIN expiration time (10 minutes from now)."""
        return datetime.utcnow() + timedelta(minutes=10)

    def _extract_first_name(self, full_name: str) -> str:
        """
        Extract first name from a full name string.
        
        Args:
            full_name: Full name string (e.g., "John Doe" or "Jane Smith")
            
        Returns:
            First name or 'there' as fallback
        """
        if not full_name or not full_name.strip():
            return 'there'
        
        # Split by whitespace and take first part
        parts = full_name.strip().split()
        if parts:
            return parts[0].capitalize()
        
        return 'there'

    async def send_verification_email(self, email: str, pin: str, user_name: str = None) -> bool:
        """
        Send verification email using Brevo template.
        
        Args:
            email: Recipient's email address
            pin: 6-digit PIN code
            user_name: User's full name for personalization (optional)
            
        Returns:
            True if email was sent successfully, False otherwise
        """
        try:
            print(f"Attempting to send verification email to: {email}")
            print(f"Using template ID: {settings.BREVO_TEMPLATE_ID}")
            print(f"Using from email: {settings.BREVO_FROM_EMAIL}")
            
            # Extract first name for personalization
            first_name = self._extract_first_name(user_name) if user_name else 'there'
            print(f"Using first name: {first_name}")
            
            send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
                to=[sib_api_v3_sdk.SendSmtpEmailTo(email=email)],
                template_id=settings.BREVO_TEMPLATE_ID,
                params={
                    "code": pin,
                    "FIRSTNAME": first_name
                },
                sender=sib_api_v3_sdk.SendSmtpEmailSender(
                    name=settings.BREVO_FROM_NAME,
                    email=settings.BREVO_FROM_EMAIL
                ),
                reply_to=sib_api_v3_sdk.SendSmtpEmailReplyTo(
                    email=settings.BREVO_FROM_EMAIL,
                    name=settings.BREVO_FROM_NAME
                )
            )
            
            result = self.api_instance.send_transac_email(send_smtp_email)
            print(f"Verification email sent successfully: {result}")
            return True
            
        except ApiException as e:
            print(f"Error sending verification email: ({e.status})")
            print(f"Reason: {e.reason}")
            print(f"HTTP response headers: {e.headers}")
            print(f"HTTP response body: {e.body}")
            print()
            return False
        except Exception as e:
            print(f"Unexpected error sending verification email: {e}")
            return False

    def is_pin_valid(self, pin_code: Optional[str], pin_expires: Optional[datetime], provided_pin: str) -> bool:
        """
        Check if provided PIN is valid.
        
        Args:
            pin_code: Stored PIN code
            pin_expires: PIN expiration time
            provided_pin: PIN code provided by user
            
        Returns:
            True if PIN is valid, False otherwise
        """
        if not pin_code or not pin_expires:
            return False
            
        if datetime.utcnow() > pin_expires:
            return False
            
        return pin_code == provided_pin


# Create singleton instance
email_service = EmailService()
