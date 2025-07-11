from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy import Column, DateTime, func, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Base:
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower()
    
    # Common columns for all models
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_admin = Column(Boolean, default=False, server_default='false', nullable=False)