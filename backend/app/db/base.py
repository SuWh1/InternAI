from sqlalchemy.ext.declarative import declarative_base
from app.db.base_class import Base as BaseClass

# Create Base class for models
Base = declarative_base(cls=BaseClass) 