"""
Agent pipeline API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import asyncio
import os
from datetime import datetime

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.agents import AgentPipelineRequest, AgentPipelineResponse, AgentErrorResponse
from app.schemas.onboarding import OnboardingData
from app.crud.onboarding import get_onboarding_data_by_user_id
from app.crud.roadmap import upsert_roadmap, get_roadmap_by_user_id, update_roadmap_progress
from app.agents.pipeline import AgentPipeline

import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/run-pipeline",
    response_model=AgentPipelineResponse,
    summary="Run the complete agent pipeline",
    description="Execute the multi-agent pipeline to generate personalized roadmap and internship recommendations"
)
async def run_agent_pipeline(
    request: AgentPipelineRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Run the complete multi-agent pipeline for internship preparation.
    
    This endpoint executes a sequence of three agents:
    1. ResumeAgent - Analyzes resume if provided
    2. RoadmapAgent - Generates personalized 12-week roadmap
    3. RecommendationAgent - Suggests relevant internships
    
    The pipeline uses the user's onboarding data as the foundation and
    optionally incorporates resume information if provided.
    """
    
    try:
        logger.info(f"Starting agent pipeline for user {current_user.id}")
        
        # Get user's onboarding data
        onboarding_data = get_onboarding_data_by_user_id(db, user_id=current_user.id)
        
        if not onboarding_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must complete onboarding before running the agent pipeline"
            )
        
        # Convert onboarding data to dictionary
        onboarding_dict = {
            "current_year": onboarding_data.current_year,
            "major": onboarding_data.major,
            "programming_languages": onboarding_data.programming_languages,
            "frameworks_tools": onboarding_data.frameworks_tools,
            "preferred_tech_stack": onboarding_data.preferred_tech_stack,
            "experience_level": onboarding_data.experience_level,
            "skill_confidence": onboarding_data.skill_confidence,
            "has_internship_experience": onboarding_data.has_internship_experience,
            "previous_internships": onboarding_data.previous_internships,
            "projects": onboarding_data.projects,
            "target_roles": onboarding_data.target_roles,
            "preferred_company_types": onboarding_data.preferred_company_types,
            "preferred_locations": onboarding_data.preferred_locations,
            "target_internships": onboarding_data.target_internships,
            "application_timeline": onboarding_data.application_timeline,
            "additional_info": onboarding_data.additional_info
        }
        
        # Prepare pipeline input
        pipeline_input = {
            "onboarding_data": onboarding_dict,
            "resume_text": request.resume_text,
            "resume_file_path": request.resume_file_path
        }
        
        # Initialize and run pipeline
        pipeline = AgentPipeline()
        pipeline_results = await pipeline.run_pipeline(pipeline_input)
        
        # Create unified response
        unified_response = pipeline.create_unified_response(pipeline_results)
        
        # Save roadmap to database if generation was successful
        if unified_response['success'] and unified_response['data'].get('roadmap'):
            try:
                # Initialize progress tracking for all weeks
                roadmap_data = unified_response['data']['roadmap']
                initial_progress = []
                if roadmap_data.get('weeks'):
                    initial_progress = [
                        {
                            "week_number": week.get('week_number'),
                            "completed_tasks": [],
                            "total_tasks": len(week.get('tasks', [])),
                            "completion_percentage": 0,
                            "last_updated": datetime.now().isoformat()
                        }
                        for week in roadmap_data['weeks']
                    ]
                
                # Save roadmap to database
                upsert_roadmap(
                    db=db,
                    user_id=current_user.id,
                    roadmap_data=roadmap_data,
                    progress_data=initial_progress,
                    generation_metadata={
                        "pipeline_summary": unified_response['pipeline_summary'],
                        "has_resume": unified_response['data'].get('has_resume', False),
                        "resume_summary": unified_response['data'].get('resume_summary'),
                        "internship_recommendations": unified_response['data'].get('internship_recommendations', []),
                        "recommendation_criteria": unified_response['data'].get('recommendation_criteria'),
                        "summary": unified_response['data'].get('summary')
                    },
                    ai_generated=roadmap_data.get('ai_generated', True)
                )
                logger.info(f"Roadmap saved to database for user {current_user.id}")
            except Exception as e:
                logger.error(f"Error saving roadmap to database: {str(e)}")
                # Don't fail the request if database save fails - just log it
        
        logger.info(f"Agent pipeline completed for user {current_user.id} - Success: {unified_response['success']}")
        
        return AgentPipelineResponse(**unified_response)
        
    except HTTPException:
        # Re-raise HTTP exceptions as they are
        raise
    except Exception as e:
        logger.error(f"Error running agent pipeline for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to run agent pipeline: {str(e)}"
        )

@router.get(
    "/pipeline-status",
    summary="Get agent pipeline status",
    description="Check if user can run the agent pipeline based on their onboarding status"
)
async def get_pipeline_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if the user can run the agent pipeline.
    
    Returns information about the user's readiness to run the pipeline,
    including onboarding completion status and any missing requirements.
    """
    try:
        # Get user's onboarding data
        onboarding_data = get_onboarding_data_by_user_id(db, user_id=current_user.id)
        
        if not onboarding_data:
            return {
                "can_run_pipeline": False,
                "reason": "Onboarding not completed",
                "missing_requirements": ["Complete onboarding process"],
                "onboarding_completed": False
            }
        
        # Check if all required fields are present
        missing_requirements = []
        
        if not onboarding_data.current_year:
            missing_requirements.append("Academic year")
        if not onboarding_data.major:
            missing_requirements.append("Major/field of study")
        if not onboarding_data.experience_level:
            missing_requirements.append("Experience level")
        if not onboarding_data.target_roles:
            missing_requirements.append("Target roles")
        if not onboarding_data.application_timeline:
            missing_requirements.append("Application timeline")
        
        can_run_pipeline = len(missing_requirements) == 0
        
        return {
            "can_run_pipeline": can_run_pipeline,
            "reason": "Ready to run pipeline" if can_run_pipeline else "Missing required onboarding information",
            "missing_requirements": missing_requirements,
            "onboarding_completed": True,
            "user_profile_summary": {
                "experience_level": onboarding_data.experience_level,
                "target_roles": onboarding_data.target_roles[:3],  # First 3 roles
                "preferred_tech_stack": onboarding_data.preferred_tech_stack[:3],  # First 3 tech preferences
                "has_internship_experience": onboarding_data.has_internship_experience,
                "timeline": onboarding_data.application_timeline
            }
        }
        
    except Exception as e:
        logger.error(f"Error checking pipeline status for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check pipeline status: {str(e)}"
        )

@router.get(
    "/sample-pipeline-output",
    response_model=AgentPipelineResponse,
    summary="Get sample pipeline output",
    description="Get a sample of what the agent pipeline output looks like (for development/testing)"
)
async def get_sample_pipeline_output():
    """
    Get a sample pipeline output for development and testing purposes.
    
    This endpoint returns mock data showing what the complete pipeline
    response structure looks like without executing the actual agents.
    """
    
    sample_response = {
        "success": True,
        "pipeline_summary": {
            "success": True,
            "total_agents_executed": 3,
            "successful_agents": 3,
            "failed_agents": [],
            "execution_time": "1.23s"
        },
        "data": {
            "has_resume": True,
            "resume_summary": {
                "technical_skills": ["Python", "JavaScript", "React", "Node.js", "PostgreSQL"],
                "work_experience": [
                    {
                        "position": "Software Development Intern",
                        "context": "Built web applications using React and Node.js during summer 2023"
                    }
                ],
                "education": [
                    {
                        "keyword": "computer science",
                        "context": "Bachelor of Science in Computer Science, Expected May 2025"
                    }
                ],
                "projects": [
                    {
                        "description": "Built a full-stack todo application with React frontend and Express backend",
                        "indicator": "built"
                    }
                ],
                "resume_length": 156,
                "extraction_confidence": "medium"
            },
            "roadmap": {
                "weeks": [
                    {
                        "week_number": 1,
                        "theme": "Algorithm Review",
                        "focus_area": "algorithm_review",
                        "tasks": [
                            "Complete 5 algorithm problems on LeetCode/HackerRank",
                            "Set up development environment",
                            "Create/update LinkedIn profile"
                        ],
                        "estimated_hours": 12,
                        "deliverables": ["Weekly progress summary"],
                        "resources": ["LeetCode", "Algorithm Design Manual", "GeeksforGeeks"]
                    }
                ],
                "personalization_factors": {
                    "experience_level": "Intermediate",
                    "focus_areas": ["algorithms", "coding_practice", "system_design"],
                    "skill_assessment": {
                        "overall_score": 6,
                        "level_category": "intermediate"
                    },
                    "timeline_urgency": "medium",
                    "target_internships": ["Google STEP", "Microsoft Explore"],
                    "has_resume": True
                },
                "generated_at": "2024-01-01T00:00:00",
                "roadmap_type": "3_month_internship_prep"
            },
            "internship_recommendations": [
                {
                    "id": "google_step_2024",
                    "company": "Google",
                    "role": "Software Engineer Intern (STEP)",
                    "location": "Mountain View, CA",
                    "company_type": "Big Tech",
                    "required_skills": ["Python", "Java", "C++", "JavaScript"],
                    "experience_level": "Beginner",
                    "duration": "12 weeks",
                    "application_deadline": "2024-12-01",
                    "description": "STEP (Student Training in Engineering Program) is a 12-week internship for first and second-year undergraduate students.",
                    "requirements_min": ["Currently enrolled in a BA/BS program"],
                    "remote_friendly": False,
                    "stipend_range": "$8000-10000/month",
                    "website": "https://careers.google.com/jobs/results/?q=STEP",
                    "match_score": 87.5,
                    "match_reasons": [
                        "Matches your target role: Software Engineer Intern",
                        "Uses technologies you know: Python, JavaScript",
                        "Matches your preferred company type: Big Tech"
                    ]
                }
            ],
            "recommendation_criteria": {
                "target_roles": ["Software Engineer Intern"],
                "preferred_locations": ["California", "Remote"],
                "preferred_company_types": ["Big Tech"],
                "experience_level": "Intermediate",
                "tech_preferences": ["Full-Stack Web Development"]
            },
            "summary": {
                "has_resume": True,
                "roadmap_weeks": 12,
                "recommended_internships": 5,
                "top_focus_areas": ["algorithms", "coding_practice", "system_design"],
                "estimated_weekly_hours": 15.5
            }
        }
    }
    
    return AgentPipelineResponse(**sample_response)

@router.get(
    "/roadmap",
    summary="Get user's roadmap",
    description="Retrieve the current roadmap and progress for the authenticated user"
)
async def get_user_roadmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the user's roadmap and progress from the database.
    
    Returns the complete roadmap data and progress tracking for the authenticated user.
    """
    try:
        roadmap_record = get_roadmap_by_user_id(db, user_id=current_user.id)
        
        if not roadmap_record:
            return {
                "success": False,
                "message": "No roadmap found. Please generate a roadmap first.",
                "data": {
                    "roadmap": None,
                    "progress": [],
                    "has_roadmap": False
                }
            }
        
        return {
            "success": True,
            "data": {
                "roadmap": roadmap_record.roadmap_data,
                "progress": roadmap_record.progress_data or [],
                "has_roadmap": True,
                "generation_metadata": roadmap_record.generation_metadata,
                "ai_generated": roadmap_record.ai_generated,
                "created_at": roadmap_record.created_at.isoformat(),
                "updated_at": roadmap_record.updated_at.isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error retrieving roadmap for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve roadmap: {str(e)}"
        )

@router.put(
    "/roadmap/progress",
    summary="Update roadmap progress",
    description="Update progress tracking for the user's roadmap"
)
async def update_roadmap_progress_endpoint(
    progress_data: List[Dict[str, Any]],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the progress tracking for the user's roadmap.
    
    This endpoint allows updating which tasks are completed, progress percentages, etc.
    """
    try:
        updated_roadmap = update_roadmap_progress(
            db=db,
            user_id=current_user.id,
            progress_data=progress_data
        )
        
        if not updated_roadmap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No roadmap found for user"
            )
        
        return {
            "success": True,
            "message": "Progress updated successfully",
            "data": {
                "progress": updated_roadmap.progress_data,
                "updated_at": updated_roadmap.updated_at.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating roadmap progress for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update progress: {str(e)}"
        )

@router.post(
    "/topic-details",
    summary="Get detailed explanation for a topic using GPT",
    description="Generate detailed explanations for roadmap topics using OpenAI GPT"
)
async def get_topic_details(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed explanation for a topic using GPT.
    
    Request should contain:
    - topic: The topic to explain
    - context: Optional context about the topic
    - user_level: User's experience level (beginner, intermediate, advanced)
    """
    
    try:
        topic = request.get("topic", "")
        context = request.get("context", "")
        user_level = request.get("user_level", "intermediate")
        
        if not topic:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Topic is required"
            )
        
        # Generate GPT explanation
        explanation = await generate_topic_explanation(topic, context, user_level)
        
        return {
            "success": True,
            "explanation": explanation["explanation"],
            "resources": explanation.get("resources", []),
            "subtasks": explanation.get("subtasks", []),
            "cached": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating topic details: {str(e)}")
        return {
            "success": False,
            "explanation": "Unable to generate detailed explanation at this time. Please try again later.",
            "resources": [],
            "subtasks": [],
            "cached": False
        }

async def generate_topic_explanation(topic: str, context: str, user_level: str) -> Dict[str, Any]:
    """Generate detailed explanation using OpenAI GPT."""
    
    try:
        # Check if OpenAI API key is configured
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            logger.warning("OpenAI API key not configured")
            return {
                "explanation": f"**{topic}**\n\nThis is a mock explanation since OpenAI is not configured. In a real implementation, this would provide detailed explanations, examples, and learning resources for {topic}.\n\n**Context:** {context}\n\n**Learning Level:** {user_level}\n\nTo enable AI-powered explanations, configure your OpenAI API key in the environment variables.",
                "resources": [
                    "Official documentation",
                    "Online tutorials and courses",
                    "Practice problems and exercises"
                ],
                "subtasks": [
                    "Review fundamental concepts",
                    "Practice with simple examples",
                    "Build a small project to apply knowledge"
                ]
            }
        
        # Import OpenAI here to avoid import errors if not installed
        from openai import AsyncOpenAI
        
        client = AsyncOpenAI(api_key=openai_api_key)
        
        # Create a focused prompt
        prompt = f"""
        Explain "{topic}" to a {user_level} level student in a clear, concise way (max 200 tokens).
        
        Context: {context}
        
        Provide:
        1. A clear explanation
        2. 2-3 key learning resources
        3. 2-3 practical subtasks
        
        Format as JSON with keys: explanation, resources, subtasks
        """
        
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful coding mentor who explains technical topics clearly and concisely."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=250,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        
        # Try to parse JSON response
        try:
            import json
            result = json.loads(content)
            return result
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "explanation": content,
                "resources": [],
                "subtasks": []
            }
            
    except Exception as e:
        logger.error(f"Error calling OpenAI API: {str(e)}")
        # Return a fallback explanation
        return {
            "explanation": f"**{topic}**\n\nThis topic is an important part of your learning journey. Due to a temporary issue with our explanation service, we recommend researching this topic using the suggested resources below.\n\n**Context:** {context}",
            "resources": [
                "Official documentation and guides",
                f"Online courses about {topic}",
                "Community forums and tutorials"
            ],
            "subtasks": [
                "Research the fundamentals",
                "Find practical examples",
                "Practice implementation"
            ]
        } 