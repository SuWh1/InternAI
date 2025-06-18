from pydantic import BaseModel

# Generic response
class GenericResponse(BaseModel):
    success: bool
    message: str 