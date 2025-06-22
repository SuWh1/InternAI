"""
Base agent class for the multi-agent system.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

class AgentResponse(BaseModel):
    """Standard response format for all agents."""
    success: bool
    data: Dict[str, Any]
    error: Optional[str] = None
    agent_name: str
    
class BaseAgent(ABC):
    """Base class for all agents in the pipeline."""
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"agents.{name}")
    
    @abstractmethod
    async def run(self, input_data: Dict[str, Any]) -> AgentResponse:
        """
        Execute the agent's main logic.
        
        Args:
            input_data: Data from previous agent or initial input
            
        Returns:
            AgentResponse with success status, data, and optional error
        """
        pass
    
    def _create_response(self, success: bool, data: Dict[str, Any] = None, error: str = None) -> AgentResponse:
        """Helper method to create standardized responses."""
        return AgentResponse(
            success=success,
            data=data or {},
            error=error,
            agent_name=self.name
        )
    
    def log_info(self, message: str):
        """Log info message."""
        self.logger.info(f"[{self.name}] {message}")
    
    def log_error(self, message: str):
        """Log error message.""" 
        self.logger.error(f"[{self.name}] {message}") 