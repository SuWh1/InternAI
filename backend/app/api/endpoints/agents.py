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
from app.crud.learning_content import (
    get_learning_content, 
    upsert_learning_content, 
    update_access_tracking,
    get_learning_content_by_user
)
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
    description="Generate detailed explanations for roadmap topics using OpenAI GPT and store them in database"
)
async def get_topic_details(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed explanation for a topic using GPT.
    
    Request should contain:
    - topic: The topic to explain
    - context: Optional context about the topic
    - user_level: User's experience level (beginner, intermediate, advanced)
    - force_regenerate: Whether to force regeneration even if content exists
    """
    
    try:
        topic = request.get("topic", "")
        context = request.get("context", "")
        user_level = request.get("user_level", "intermediate")
        force_regenerate = request.get("force_regenerate", False)
        
        if not topic:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Topic is required"
            )
        
        # Check if explanation already exists for this topic (unless force regenerate)
        if not force_regenerate:
            existing_content = get_learning_content(
                db=db, 
                user_id=current_user.id, 
                topic=topic, 
                content_type="explanation",
                context=context
            )
            
            if existing_content:
                # Update access tracking
                update_access_tracking(db, existing_content.id)
                
                return {
                    "success": True,
                    "explanation": existing_content.content_data.get("explanation", ""),
                    "resources": existing_content.content_data.get("resources", []),
                    "subtasks": existing_content.content_data.get("subtasks", []),
                    "cached": True
                }
        
        # Generate GPT explanation
        explanation = await generate_topic_explanation(topic, context, user_level)
        
        # Store in database
        learning_content = upsert_learning_content(
            db=db,
            user_id=current_user.id,
            content_type="explanation",
            topic=topic,
            content_data=explanation,
            context=context,
            user_level=user_level,
            generation_metadata={
                "model": "gpt-3.5-turbo-16k",
                "generated_at": datetime.now().isoformat(),
                "request_context": context,
                "estimated_tokens": 3000
            }
        )
        
        # Update access tracking
        update_access_tracking(db, learning_content.id)
        
        return {
            "success": True,
            "explanation": explanation.get("explanation", ""),
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
                "explanation": f"""# {topic}

## Overview
This is a comprehensive lesson on {topic}, designed for {user_level} level learners.

**Context:** {context}

## What is {topic}?
{topic} is an important concept in software development that plays a crucial role in building modern applications. Understanding this topic will help you become a more effective developer and prepare you for technical interviews.

## Key Concepts
- **Fundamental principles:** Understanding the core concepts that make {topic} work
- **Implementation patterns:** Common ways to implement and use {topic}
- **Best practices:** Industry-standard approaches and recommendations
- **Common pitfalls:** Mistakes to avoid when working with {topic}

## Why is {topic} Important?
Learning {topic} will enhance your development skills and make you more competitive in the job market. Many companies use {topic} in their technology stack, making it a valuable skill for internship applications.

## Real-World Applications
{topic} is commonly used in:
- Web development projects
- Mobile applications
- Enterprise software systems
- Data processing pipelines

## Getting Started
1. Start by understanding the fundamental concepts
2. Practice with simple examples
3. Build small projects to apply your knowledge
4. Explore advanced use cases and patterns

## Best Practices
- Always follow established conventions
- Write clean, readable code
- Test your implementations
- Stay updated with latest developments

**Note:** To enable AI-powered detailed explanations, configure your OpenAI API key in the environment variables.""",
                "resources": [
                    f"Official {topic} documentation",
                    f"MDN Web Docs - {topic} guide",
                    f"YouTube: {topic} tutorial for beginners",
                    f"Stack Overflow discussions about {topic}",
                    f"GitHub repositories showcasing {topic}",
                    f"Online courses featuring {topic}"
                ],
                "subtasks": [
                    f"Research the fundamental concepts of {topic}",
                    f"Complete a basic tutorial on {topic}",
                    f"Build a simple project using {topic}",
                    f"Practice common patterns and techniques",
                    f"Explore advanced features and use cases",
                    f"Review real-world examples and case studies"
                ]
            }
        
        # Import OpenAI here to avoid import errors if not installed
        from openai import AsyncOpenAI
        
        client = AsyncOpenAI(api_key=openai_api_key)
        
        # Create an engaging, structured lesson prompt
        prompt = f"""
        CRITICAL: You must create a complete, practical lesson specifically about "{topic}". 
        Do NOT return template text, placeholders, or example structures.
        Generate REAL code-focused content about {topic} for INTERNSHIP preparation.

        You are a senior software engineer at a tech company. Create a practical, code-focused lesson on: "{topic}" for a {user_level} developer preparing for internships.

        Context: {context}

        🛠️ Format your response as a **pure JSON object**, with no markdown, no comments, and no extra text.

        The JSON must contain these top-level keys:
        - "explanation": A **single formatted string** containing the practical coding lesson about {topic}.
        - "resources": A list of 3 essential resources for implementing {topic} in real projects.
        - "subtasks": A list of 3 hands-on coding tasks for {topic} (easy, medium, hard).

        FOCUS: This lesson should be practical for internship interviews and real work. Less theory, more implementation.

        Start with: "# 🛠️ {topic}: Practical Implementation Guide\\n\\n"

        Then include these sections with REAL IMPLEMENTATION CONTENT about {topic}:

        ## 🎯 Why You Need This Code
        - Explain WHY {topic} is essential in real projects (2-3 concrete reasons)
        - What problems does {topic} solve in production code?

        ## ⚡ Quick Implementation 
        - Show the minimal working code for {topic}
        - Include complete, runnable code example (10-15 lines max)

        ## 🧪 Step-by-Step Build
        - Guide through building a practical example with {topic}
        - Show 3-4 code steps that demonstrate real usage
        - Each step should build something you'd actually use

        ## 🔧 Common Patterns
        - Show 2-3 essential patterns/variations of {topic} used in companies
        - Include code examples for each pattern

        ## 💪 Production-Level Code
        - Show how to write {topic} code that would pass code review
        - Include error handling, best practices
        - One solid code block (15-20 lines)

        ## 🚀 Integration Examples
        - How to integrate {topic} into existing projects
        - Show connection with other common technologies

        ## ❗ Interview Tips
        - What interviewers expect when you implement {topic}
        - Common mistakes that fail interviews

        Make the content:
        - 💻 Code-heavy: at least 5 working code examples
        - 🎯 Interview-focused: what hiring managers want to see
        - ⚡ Practical: everything should be usable in real projects
        - 🏢 Professional: enterprise-level implementation

        The "resources" array should contain 3 ESSENTIAL resources for implementing {topic} with ACTUAL CLICKABLE LINKS:
        [
        {{
            "title": "[specific resource title about {topic}]",
            "link": "https://[actual working URL to the resource]",
            "type": "documentation"
        }},
        {{
            "title": "[specific GitHub repository or tutorial about {topic}]", 
            "link": "https://[actual working URL to GitHub repo or tutorial]",
            "type": "tutorial"
        }},
        {{
            "title": "[specific video or interactive resource about {topic}]",
            "link": "https://[actual working URL to video/interactive resource]",
            "type": "video"
        }}
        ]

        The "subtasks" array should have 3 CODING tasks for {topic}:
        [
        {{
            "task": "Build: [specific coding project using {topic} - something you can show in interviews]",
            "hint": "[actual implementation tip for {topic}]",
            "level": "Beginner"
        }},
        {{
            "task": "Implement: [intermediate feature using {topic} - realistic work scenario]",
            "hint": "[practical coding strategy for {topic}]",
            "level": "Intermediate"
        }},
        {{
            "task": "Optimize: [advanced {topic} implementation - senior-level challenge]",
            "hint": "[performance/architecture guidance for {topic}]",
            "level": "Advanced"
        }}
        ]

        CRITICAL: 
        - Each resource MUST have a real, working URL starting with https://
        - Resource titles should be specific (not generic like "Documentation")
        - Include a mix of official docs, GitHub repos, and video tutorials
        - URLs must be actual links that users can click and visit
        - NO explanations of what {topic} "is" or "how it works conceptually"
        - FOCUS on implementation, code examples, and practical usage
        - Everything should be useful for someone building real applications
        - Code examples must be complete and runnable

        Return only the valid JSON object. Do not include any markdown, explanations, or comments outside the JSON.
        """
        
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo-16k",
            messages=[
                {"role": "system", "content": f"You are an expert technical educator and senior software engineer. Your task is to create a comprehensive lesson about '{topic}' - NOT a template or example structure. Generate actual educational content with real code examples, practical explanations, and specific information about {topic}. Never return placeholder text like '[Description of what to do]' or generic templates."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=4000,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        
        # Clean and extract JSON from content
        def extract_json_from_content(text: str) -> str:
            """Extract JSON from markdown code blocks or raw text."""
            # Remove markdown code block markers
            import re
            
            # Pattern to match ```json ... ``` blocks
            json_pattern = r'```(?:json)?\s*\n?(.*?)\n?```'
            match = re.search(json_pattern, text, re.DOTALL | re.IGNORECASE)
            
            if match:
                return match.group(1).strip()
            
            # If no code block, try to find JSON-like content
            # Look for content between first { and last }
            start = text.find('{')
            if start != -1:
                # Find the matching closing brace
                brace_count = 0
                end = start
                for i, char in enumerate(text[start:], start):
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            end = i + 1
                            break
                
                if end > start:
                    return text[start:end]
            
            return text
        
        # Try to parse JSON response
        try:
            import json
            
            # First try to parse as-is
            try:
                result = json.loads(content)
                return result
            except json.JSONDecodeError:
                # Extract JSON from markdown or find JSON in text
                extracted_json = extract_json_from_content(content)
                
                try:
                    result = json.loads(extracted_json)
                    return result
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse extracted JSON: {extracted_json[:200]}...")
                    # If still failing, return the content as explanation
                    return {
                        "explanation": extracted_json if extracted_json != content else content,
                        "resources": [],
                        "subtasks": []
                    }
                    
        except Exception as e:
            logger.error(f"Error processing AI response: {str(e)}")
            # Fallback if all parsing fails
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

@router.post(
    "/generate-subtopics",
    summary="Generate subtopics for a learning topic",
    description="Generate AI-powered subtopics for a specific learning topic and store them in the database"
)
async def generate_subtopics(
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate subtopics for a learning topic using AI.
    
    Request should contain:
    - topic: The main topic/theme to generate subtopics for
    - context: Optional context (e.g., week number, focus area)
    - user_level: User's experience level (beginner, intermediate, advanced)
    - force_regenerate: Whether to force regeneration even if content exists
    """
    
    try:
        topic = request.get("topic", "")
        context = request.get("context", "")
        user_level = request.get("user_level", "intermediate")
        force_regenerate = request.get("force_regenerate", False)
        
        if not topic:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Topic is required"
            )
        
        # Check if subtopics already exist for this topic (unless force regenerate)
        if not force_regenerate:
            existing_content = get_learning_content(
                db=db, 
                user_id=current_user.id, 
                topic=topic, 
                content_type="subtopics",
                context=context
            )
            
            if existing_content:
                # Update access tracking
                update_access_tracking(db, existing_content.id)
                
                return {
                    "success": True,
                    "subtopics": existing_content.content_data.get("subtopics", []),
                    "cached": True,
                    "generated_at": existing_content.created_at.isoformat(),
                    "access_count": existing_content.access_count
                }
        
        # Generate new subtopics using AI
        subtopics_data = await generate_subtopics_ai(topic, context, user_level)
        
        # Store in database
        learning_content = upsert_learning_content(
            db=db,
            user_id=current_user.id,
            content_type="subtopics",
            topic=topic,
            content_data=subtopics_data,
            context=context,
            user_level=user_level,
            generation_metadata={
                "model": "gpt-3.5-turbo",
                "generated_at": datetime.now().isoformat(),
                "request_context": context
            }
        )
        
        # Update access tracking
        update_access_tracking(db, learning_content.id)
        
        return {
            "success": True,
            "subtopics": subtopics_data.get("subtopics", []),
            "cached": False,
            "generated_at": learning_content.created_at.isoformat(),
            "access_count": learning_content.access_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating subtopics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate subtopics: {str(e)}"
        )

@router.get(
    "/learning-content/{content_type}",
    summary="Get user's learning content",
    description="Retrieve stored learning content (subtopics, explanations, etc.) for the user"
)
async def get_user_learning_content(
    content_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all learning content of a specific type for the authenticated user.
    
    content_type can be: subtopics, explanation, resources
    """
    
    try:
        content_list = get_learning_content_by_user(
            db=db,
            user_id=current_user.id,
            content_type=content_type
        )
        
        formatted_content = []
        for content in content_list:
            formatted_content.append({
                "id": str(content.id),
                "topic": content.topic,
                "context": content.context,
                "content_data": content.content_data,
                "user_level": content.user_level,
                "access_count": content.access_count,
                "last_accessed": content.last_accessed,
                "created_at": content.created_at.isoformat(),
                "updated_at": content.updated_at.isoformat()
            })
        
        return {
            "success": True,
            "content_type": content_type,
            "content": formatted_content,
            "total_count": len(formatted_content)
        }
        
    except Exception as e:
        logger.error(f"Error retrieving learning content: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve learning content: {str(e)}"
        )

async def generate_subtopics_ai(topic: str, context: str, user_level: str) -> Dict[str, Any]:
    """Generate subtopics using OpenAI GPT."""
    
    try:
        # Check if OpenAI API key is configured
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            logger.warning("OpenAI API key not configured, using fallback subtopics")
            return {
                "subtopics": [
                    f"Introduction to {topic}",
                    f"Core Concepts of {topic}",
                    f"Practical Applications of {topic}",
                    f"Best Practices for {topic}",
                    f"Common Challenges in {topic}",
                    f"Advanced {topic} Techniques"
                ]
            }
        
        # Import OpenAI here to avoid import errors if not installed
        from openai import AsyncOpenAI
        
        client = AsyncOpenAI(api_key=openai_api_key)
        
        # Create a focused prompt for subtopic generation
        prompt = f"""
        Generate exactly 6 specific, learnable subtopics for the topic: "{topic}"
        
        Context: {context}
        Target Level: {user_level}
        
        Requirements:
        - Generate exactly 6 subtopics (no more, no less)
        - Each subtopic should be specific and actionable
        - Subtopics should be ordered from basic to advanced
        - Focus on practical learning outcomes
        - Make them suitable for a {user_level} level learner
        
        Respond with a JSON object containing only a "subtopics" array with exactly 6 string values.
        Example: {{"subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3", "Subtopic 4", "Subtopic 5", "Subtopic 6"]}}
        """
        
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert educational content creator who generates clear, specific learning subtopics. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        
        # Try to parse JSON response
        try:
            import json
            result = json.loads(content)
            
            # Validate that we have subtopics
            if "subtopics" in result and isinstance(result["subtopics"], list):
                return result
            else:
                raise ValueError("Invalid response format")
                
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Failed to parse AI response as JSON: {str(e)}")
            # Fallback: try to extract subtopics from text
            lines = content.split('\n')
            subtopics = []
            for line in lines:
                line = line.strip()
                if line and not line.startswith('{') and not line.startswith('}'):
                    # Clean up the line (remove quotes, numbers, bullets)
                    cleaned = line.strip('"\'').strip('123456789.- ')
                    if cleaned and len(cleaned) > 5:
                        subtopics.append(cleaned)
            
            if subtopics:
                return {"subtopics": subtopics[:6]}  # Limit to 6
            else:
                raise ValueError("Could not extract subtopics from AI response")
            
    except Exception as e:
        logger.error(f"Error calling OpenAI API for subtopics: {str(e)}")
        # Return fallback subtopics
        return {
            "subtopics": [
                f"Introduction to {topic}",
                f"Core Concepts of {topic}",
                f"Practical Applications of {topic}",
                f"Best Practices for {topic}",
                f"Common Challenges in {topic}",
                f"Advanced {topic} Techniques"
            ]
        } 