import uuid
import mimetypes
from typing import IO

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import settings

# Initialize a boto3 S3 client once at import time
_s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION,
)

BUCKET_NAME = settings.AWS_S3_AVATAR_BUCKET


def _generate_key(content_type: str) -> str:
    """Generate a unique object key under the avatars/ prefix."""
    extension = mimetypes.guess_extension(content_type) or ""
    return f"avatars/{uuid.uuid4().hex}{extension}"


def upload_avatar(file_obj: IO[bytes], content_type: str) -> str:
    """Upload avatar file object to S3 and return the public URL."""
    if not BUCKET_NAME:
        raise RuntimeError("AWS_S3_AVATAR_BUCKET not configured")

    key = _generate_key(content_type)

    try:
        _s3_client.upload_fileobj(
            file_obj,
            BUCKET_NAME,
            key,
            ExtraArgs={
                "ContentType": content_type,
            },
        )
    except (BotoCoreError, ClientError) as e:
        raise RuntimeError(f"Failed to upload avatar to S3: {e}") from e

    return f"https://{BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"


def delete_avatar(url: str) -> None:
    """Delete avatar from S3 given its full URL. Silently ignore errors."""
    if not BUCKET_NAME or not url:
        return

    prefix = f"https://{BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/"
    if not url.startswith(prefix):
        return  # Don't delete if URL doesn't belong to our bucket

    key = url.replace(prefix, "", 1)
    try:
        _s3_client.delete_object(Bucket=BUCKET_NAME, Key=key)
    except (BotoCoreError, ClientError):
        # Ignore deletion errors – not critical
        pass 