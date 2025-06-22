"""
Schemas for the multi-agent system pipeline.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Request schemas
class AgentPipelineRequest(BaseModel):
    """Request schema for running the agent pipeline."""
    resume_text: Optional[str] = Field(None, description="Raw resume text content")
    resume_file_path: Optional[str] = Field(None, description="Path to resume file")
    
    class Config:
        schema_extra = {
            "example": {
                "resume_text": "John Doe\nSoftware Engineer\n...",
                "resume_file_path": None
            }
        }

# Response schemas for individual agents
class ResumeAnalysisResponse(BaseModel):
    """Response schema for resume analysis."""
    has_resume: bool
    resume_summary: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

class WeeklyTask(BaseModel):
    """Schema for a weekly task in the roadmap."""
    week_number: int
    theme: str
    focus_area: str
    tasks: List[str]
    estimated_hours: int
    deliverables: List[str]
    resources: List[str]

class RoadmapResponse(BaseModel):
    """Response schema for roadmap generation."""
    roadmap: Dict[str, Any]
    total_weeks: int
    personalization_factors: Dict[str, Any]

class InternshipRecommendation(BaseModel):
    """Schema for a single internship recommendation."""
    id: str
    company: str
    role: str
    location: str
    company_type: str
    required_skills: List[str]
    experience_level: str
    duration: str
    application_deadline: str
    description: str
    requirements_min: List[str]
    remote_friendly: bool
    stipend_range: str
    website: str
    match_score: float
    match_reasons: List[str]

class RecommendationsResponse(BaseModel):
    """Response schema for internship recommendations."""
    recommendations: List[InternshipRecommendation]
    total_recommendations: int
    recommendation_criteria: Dict[str, Any]

# Pipeline summary schemas
class PipelineSummary(BaseModel):
    """Schema for pipeline execution summary."""
    success: bool
    total_agents_executed: int
    successful_agents: int
    failed_agents: List[str]
    execution_time: str
    error: Optional[str] = None

class PipelineDataSummary(BaseModel):
    """Schema for pipeline data summary statistics."""
    has_resume: bool
    roadmap_weeks: int
    recommended_internships: int
    top_focus_areas: List[str]
    estimated_weekly_hours: float

# Main pipeline response schema
class AgentPipelineResponse(BaseModel):
    """Response schema for the complete agent pipeline."""
    success: bool
    pipeline_summary: PipelineSummary
    data: Dict[str, Any] = Field(..., description="Contains resume_summary, roadmap, internship_recommendations, etc.")
    
    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "pipeline_summary": {
                    "success": True,
                    "total_agents_executed": 3,
                    "successful_agents": 3,
                    "failed_agents": [],
                    "execution_time": "2.45s"
                },
                "data": {
                    "has_resume": True,
                    "resume_summary": {
                        "technical_skills": ["Python", "JavaScript", "React"],
                        "work_experience": [],
                        "education": [],
                        "projects": []
                    },
                    "roadmap": {
                        "weeks": [],
                        "personalization_factors": {},
                        "generated_at": "2024-01-01T00:00:00",
                        "roadmap_type": "3_month_internship_prep"
                    },
                    "internship_recommendations": [],
                    "summary": {
                        "has_resume": True,
                        "roadmap_weeks": 12,
                        "recommended_internships": 5,
                        "top_focus_areas": ["algorithms", "coding_practice", "system_design"],
                        "estimated_weekly_hours": 15.5
                    }
                }
            }
        }

# Error response schemas
class AgentErrorResponse(BaseModel):
    """Error response schema for agent operations."""
    success: bool = False
    error: str
    agent_name: Optional[str] = None
    details: Optional[Dict[str, Any]] = None 