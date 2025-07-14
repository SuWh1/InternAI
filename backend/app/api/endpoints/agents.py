"""
Agent pipeline API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from starlette.requests import Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List
import asyncio
import os
from datetime import datetime

from app.core.security import get_current_user
from app.core.rate_limit import limiter, RateLimits
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
from app.utils.youtube_service import youtube_service

import logging
import re
import json

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post(
    "/run-pipeline",
    response_model=AgentPipelineResponse,
    summary="Run the complete agent pipeline",
    description="Execute the multi-agent pipeline to generate personalized roadmap and internship recommendations"
)
@limiter.limit(RateLimits.AI_PIPELINE_RUN)
async def run_agent_pipeline(
    request: Request,
    pipeline_request: AgentPipelineRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
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
        onboarding_data = await get_onboarding_data_by_user_id(db, user_id=current_user.id)
        
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
            "frameworks": onboarding_data.frameworks,
            "tools": onboarding_data.tools,
            "preferred_tech_stack": onboarding_data.preferred_tech_stack,
            "experience_level": onboarding_data.experience_level,
            "skill_confidence": onboarding_data.skill_confidence,
            "has_internship_experience": onboarding_data.has_internship_experience,
            "previous_internships": onboarding_data.previous_internships,
            "projects": onboarding_data.projects,
            "target_roles": onboarding_data.target_roles,
            "preferred_company_types": onboarding_data.preferred_company_types,
            "preferred_locations": onboarding_data.preferred_locations,
            "application_timeline": onboarding_data.application_timeline,
            "additional_info": onboarding_data.additional_info,
            "source_of_discovery": onboarding_data.source_of_discovery
        }
        
        # Prepare pipeline input
        pipeline_input = {
            "onboarding_data": onboarding_dict,
            "resume_text": pipeline_request.resume_text,
            "resume_file_path": pipeline_request.resume_file_path
        }
        
        # Initialize and run pipeline
        pipeline = AgentPipeline()
        pipeline_results = await pipeline.run_pipeline(pipeline_input)
        
        # Create unified response
        unified_response = pipeline.create_unified_response(pipeline_results)
        
        # Save roadmap to database if generation was successful
        if unified_response['success'] and unified_response['data'].get('roadmap'):
            # Clear any existing learning content cache for this user so subtopics regenerate
            try:
                from app.crud.learning_content import delete_all_by_user
                await delete_all_by_user(db, current_user.id)
            except Exception as e:
                logger.error(f"Error clearing learning content for user {current_user.id}: {str(e)}")
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
                await upsert_roadmap(
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
@limiter.limit(RateLimits.API_READ)
async def get_pipeline_status(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Check if the user can run the agent pipeline.
    
    Returns information about the user's readiness to run the pipeline,
    including onboarding completion status and any missing requirements.
    """
    try:
        # Get user's onboarding data
        onboarding_data = await get_onboarding_data_by_user_id(db, user_id=current_user.id)
        
        if not onboarding_data:
            return {
                "can_run_pipeline": False,
                "reason": "Onboarding not completed",
                "missing_requirements": ["Complete onboarding process"],
                "onboarding_completed": False
            }
        
        # If onboarding record exists, all required fields are guaranteed to be present
        # (database constraints ensure nullable=False fields cannot be missing)
        return {
            "can_run_pipeline": True,
            "reason": "Ready to run pipeline",
            "missing_requirements": [],
            "onboarding_completed": True,
            "user_profile_summary": {
                "experience_level": onboarding_data.experience_level,
                "target_roles": onboarding_data.target_roles[:3],  # First 3 roles
                "preferred_tech_stack": onboarding_data.preferred_tech_stack,  # Now a string, not a list
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
    "/roadmap",
    summary="Get user's roadmap",
    description="Retrieve the current roadmap and progress for the authenticated user"
)
@limiter.limit(RateLimits.API_READ)
async def get_user_roadmap(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the user's roadmap and progress from the database.
    
    Returns the complete roadmap data and progress tracking for the authenticated user.
    """
    try:
        roadmap_record = await get_roadmap_by_user_id(db, user_id=current_user.id)
        
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
@limiter.limit(RateLimits.API_WRITE)
async def update_roadmap_progress_endpoint(
    request: Request,
    progress_data: List[Dict[str, Any]],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update the progress tracking for the user's roadmap.
    
    This endpoint allows updating which tasks are completed, progress percentages, etc.
    """
    try:
        updated_roadmap = await update_roadmap_progress(
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
    summary="Get detailed explanation for a topic using Gemini",
    description="Generate detailed explanations for roadmap topics using Google Gemini and store them in database"
)
@limiter.limit(RateLimits.AI_TOPIC_DETAILS)
async def get_topic_details(
    request: Request,
    topic_request: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
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
        topic = topic_request.get("topic", "")
        context = topic_request.get("context", "")
        user_level = topic_request.get("user_level", "intermediate")
        force_regenerate = topic_request.get("force_regenerate", False)
        
        if not topic:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Topic is required"
            )
        
        # Check if explanation already exists for this topic (unless force regenerate)
        if not force_regenerate:
            existing_content = await get_learning_content(
                db=db, 
                user_id=current_user.id, 
                topic=topic, 
                content_type="explanation",
                context=context
            )
            
            if existing_content:
                # Update access tracking
                await update_access_tracking(db, existing_content.id)
                
                # Post-process cached content to fix any formatting issues
                cached_content = existing_content.content_data.copy()
                if not validate_content_quality(cached_content):
                    logger.info("Post-processing cached content to improve formatting")
                    cached_content = post_process_content(cached_content)
                
                return {
                    "success": True,
                    "explanation": cached_content.get("explanation", ""),
                    "resources": cached_content.get("resources", []),
                    "subtasks": cached_content.get("subtasks", []),
                    "youtube_videos": cached_content.get("youtube_videos", []),
                    "cached": True
                }
        
        # Generate Gemini explanation
        explanation = await generate_topic_explanation(topic, context, user_level)
        
        # PHASE 1: Content Quality Improvement (Safe, additive)
        retry_count = 0
        max_retries = 2
        
        while retry_count <= max_retries:
            # Validate content quality
            if validate_content_quality(explanation):
                # Post-process to fix common issues
                explanation = post_process_content(explanation)
                logger.info("Content passed quality validation")
                break
            else:
                logger.warning(f"Content quality validation failed, attempt {retry_count + 1}/{max_retries + 1}")
                if retry_count < max_retries:
                    # Retry with improved prompt
                    explanation = await generate_topic_explanation(topic, context, user_level)
                    retry_count += 1
                else:
                    # Use post-processing to fix what we can
                    explanation = post_process_content(explanation)
                    logger.info("Using post-processed content after max retries")
                    break
        
        # Fetch popular YouTube videos for this topic
        try:
            youtube_videos = await youtube_service.get_popular_videos(topic, context, max_results=2)
            # Add YouTube videos to resources
            if youtube_videos:
                if 'youtube_videos' not in explanation:
                    explanation['youtube_videos'] = youtube_videos
        except Exception as e:
            logger.error(f"Error fetching YouTube videos: {str(e)}")
            # Continue without YouTube videos if fetch fails
        
        # Check if the response is an error message - don't store errors in database
        def is_error_content(content_data):
            if not content_data or not isinstance(content_data, dict):
                return True
            explanation_text = content_data.get("explanation", "")
            if not explanation_text or not isinstance(explanation_text, str):
                return True
            # Check for error patterns
            error_patterns = [
                "Error parsing lesson content",
                "Error generating lesson",
                "Please try again",
                "Failed to generate",
                "Content generation failed"
            ]
            return any(pattern.lower() in explanation_text.lower() for pattern in error_patterns)
        
        # Only store successful content generation in database
        if not is_error_content(explanation):
            # Store in database
            learning_content = await upsert_learning_content(
                db=db,
                user_id=current_user.id,
                content_type="explanation",
                topic=topic,
                content_data=explanation,
                context=context,
                user_level=user_level,
                generation_metadata={
                    "model": "gemini-2.0-flash",
                    "generated_at": datetime.now().isoformat(),
                    "request_context": context,
                    "has_youtube_videos": len(explanation.get('youtube_videos', [])) > 0
                }
            )
            
            # Update access tracking
            await update_access_tracking(db, learning_content.id)
        else:
            logger.warning(f"Not storing error response for topic: {topic}")
            # Don't store error content, just return it
        
        return {
            "success": True,
            "explanation": explanation.get("explanation", ""),
            "resources": explanation.get("resources", []),
            "subtasks": explanation.get("subtasks", []),
            "youtube_videos": explanation.get("youtube_videos", []),
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
    """Generate detailed explanation using Google Gemini."""
    
    try:
        # Check if Gemini API key is configured
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            logger.warning("Gemini API key not configured")
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

                **Note:** To enable AI-powered detailed explanations, configure your Gemini API key in the environment variables.""",
                "resources": [
                    f"Official {topic} documentation",
                    f"MDN Web Docs - {topic} guide",
                    f"YouTube: {topic} top 3 tutorials",
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
        
        # Import Google Generative AI here to avoid import errors if not installed
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=gemini_api_key)
        
        # Check if this is for weeks 5-9 (intermediate weeks that should include LeetCode problems)
        import re
        week_match = re.search(r'Week\s+(\d+)', context)
        is_week_5_to_9 = week_match and 5 <= int(week_match.group(1)) <= 9
        
        # Create a concise, effective prompt using best practices
        if is_week_5_to_9:
            prompt = f"""Create a comprehensive lesson about "{topic}" for a {user_level} developer preparing for internships.

                User Context: {context}

                CRITICAL: Return ONLY valid JSON with proper string escaping. Use actual newlines in strings, NOT literal \\n characters.

                {{
                "explanation": "Your complete lesson content with proper markdown formatting",
                "resources": [
                    "Resource 1 with clear description and URL",
                    "Resource 2 with clear description and URL", 
                    "Resource 3 with clear description and URL"
                ],
                "subtasks": [
                    "Specific hands-on task 1",
                    "Specific hands-on task 2", 
                    "Specific hands-on task 3"
                ],
                "leetcode_problems": [
                    {{"title": "Problem Name 1", "link": "https://leetcode.com/problems/...", "difficulty": "Easy/Medium/Hard"}},
                    {{"title": "Problem Name 2", "link": "https://leetcode.com/problems/...", "difficulty": "Easy/Medium/Hard"}}
                ]
                }}

                ADDITIONAL REQUIREMENT FOR WEEKS 5-9:
                - Include exactly 2 LeetCode problems that are directly related to "{topic}"
                - Problems should be appropriate for {user_level} level
                - Provide actual LeetCode problem names and correct URLs
                - Choose problems that reinforce the lesson concepts
                - Mix difficulty levels (e.g., one Easy/Medium, one Medium/Hard)
            """
        else:
            prompt = f"""Create a comprehensive lesson about "{topic}" for a {user_level} developer preparing for internships.

                        User Context: {context}

                        CRITICAL: Return ONLY valid JSON with proper string escaping. Use actual newlines in strings, NOT literal \\n characters.

                        {{
                        "explanation": "Your complete lesson content with proper markdown formatting",
                        "resources": [
                            "Resource 1 with clear description and URL",
                            "Resource 2 with clear description and URL", 
                            "Resource 3 with clear description and URL"
                        ],
                        "subtasks": [
                            "Specific hands-on task 1",
                            "Specific hands-on task 2", 
                            "Specific hands-on task 3"
                        ]
                        }}

                        FORMATTING REQUIREMENTS:
                        - Use actual newlines, not \\n literals
                        - Code blocks: ```javascript (with proper newlines)
                        - Headers: ## Header Name (with newlines before/after)
                        - Bold text: **text** (not **text**)
                        - Lists: Use - or * with spaces
                        - No malformed markdown
                        - No escaped quotes in markdown text
                        - Proper paragraph spacing

                        CONTENT STRUCTURE:
                        1. Start with topic overview
                        2. Core concepts with examples  
                        3. Practical code demonstrations
                        4. Real-world applications
                        5. Best practices and tips

                        Make this genuinely helpful for landing internships with clean, readable formatting.
                    """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.5,
                response_mime_type='application/json'
            )
        )
        
        content = response.text
        
        # Parse JSON response with robust error handling
        try:
            # Clean the response (remove any markdown formatting if present)
            cleaned_content = content.strip()
            if cleaned_content.startswith('```json'):
                cleaned_content = cleaned_content[7:]
            if cleaned_content.endswith('```'):
                cleaned_content = cleaned_content[:-3]
            cleaned_content = cleaned_content.strip()
            
            # Try to fix common JSON syntax errors
            def fix_json_syntax(json_str):
                try:
                    # Remove trailing commas before } or ]
                    json_str = re.sub(r',\s*([}\]])', r'\1', json_str)
                    
                    # Better approach: Extract each JSON field separately and reconstruct
                    # This handles very long content with embedded quotes better
                    
                    # Extract explanation using a more robust approach
                    explanation_content = ""
                    explanation_start = json_str.find('"explanation":')
                    if explanation_start != -1:
                        # Find the opening quote after "explanation":
                        quote_start = json_str.find('"', explanation_start + len('"explanation":'))
                        if quote_start != -1:
                            # Find the closing quote by counting brackets and handling escapes
                            quote_pos = quote_start + 1
                            bracket_count = 0
                            escape_next = False
                            
                            while quote_pos < len(json_str):
                                char = json_str[quote_pos]
                                
                                if escape_next:
                                    escape_next = False
                                elif char == '\\':
                                    escape_next = True
                                elif char == '"' and bracket_count == 0:
                                    # Found the closing quote
                                    explanation_content = json_str[quote_start + 1:quote_pos]
                                    break
                                elif char in ['{', '[']:
                                    bracket_count += 1
                                elif char in ['}', ']']:
                                    bracket_count -= 1
                                
                                quote_pos += 1
                    
                    # Extract resources array
                    resources = []
                    resources_match = re.search(r'"resources":\s*\[(.*?)\]', json_str, re.DOTALL)
                    if resources_match:
                        # More robust resource extraction
                        resources_content = resources_match.group(1)
                        # Find all quoted strings, handling escaped quotes
                        resource_pattern = r'"((?:[^"\\]|\\.)*)"'
                        resource_matches = re.findall(resource_pattern, resources_content)
                        resources = [r.replace('\\"', '"').replace('\\\\', '\\') for r in resource_matches[:5]]
                    
                    if not resources:
                        resources = [f"Official {topic} documentation", f"Tutorial on {topic}"]
                    
                    # Extract subtasks array
                    subtasks = []
                    subtasks_match = re.search(r'"subtasks":\s*\[(.*?)\]', json_str, re.DOTALL)
                    if subtasks_match:
                        subtasks_content = subtasks_match.group(1)
                        # More robust subtask extraction
                        subtask_pattern = r'"((?:[^"\\]|\\.)*)"'
                        subtask_matches = re.findall(subtask_pattern, subtasks_content)
                        subtasks = [s.replace('\\"', '"').replace('\\\\', '\\') for s in subtask_matches[:4]]
                    
                    if not subtasks:
                        subtasks = [f"Learn {topic} basics", f"Practice {topic} examples"]
                    
                    # Extract LeetCode problems (for weeks 5-9)
                    leetcode_problems = []
                    leetcode_match = re.search(r'"leetcode_problems":\s*\[(.*?)\]', json_str, re.DOTALL)
                    if leetcode_match:
                        leetcode_content = leetcode_match.group(1)
                        # Extract individual problem objects
                        problem_pattern = r'\{[^}]*"title":\s*"([^"]*)"[^}]*"link":\s*"([^"]*)"[^}]*"difficulty":\s*"([^"]*)"[^}]*\}'
                        problem_matches = re.findall(problem_pattern, leetcode_content)
                        for title, link, difficulty in problem_matches[:2]:  # Limit to 2 problems
                            leetcode_problems.append({
                                "title": title.replace('\\"', '"').replace('\\\\', '\\'),
                                "link": link.replace('\\"', '"').replace('\\\\', '\\'),
                                "type": "leetcode",
                                "difficulty": difficulty.replace('\\"', '"').replace('\\\\', '\\')
                            })
                    
                    # Reconstruct clean JSON
                    # Properly escape the explanation content
                    escaped_explanation = explanation_content.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')
                    
                    # Add LeetCode problems to resources if present
                    if leetcode_problems:
                        resources.extend(leetcode_problems)
                    
                    clean_json = {
                        "explanation": explanation_content,  # Use raw content, not escaped
                        "resources": resources,
                        "subtasks": subtasks
                    }
                    
                    return json.dumps(clean_json)
                    
                except Exception as e:
                    logger.error(f"Error in fix_json_syntax: {str(e)}")
                    # Return a basic structure if all else fails
                    return json.dumps({
                        "explanation": f"# {topic}\n\nDetailed lesson content about {topic} for {user_level} developers.\n\n## Key Concepts\nThis covers the essential aspects of {topic} with practical examples and real-world applications.",
                        "resources": [f"Official {topic} documentation", "Online tutorials", "Practice exercises"],
                        "subtasks": ["Learn the basics", "Practice with examples", "Build a project"]
                    })
            
            # First attempt: parse as-is
            try:
                result = json.loads(cleaned_content)
                # Post-process result to add LeetCode problems to resources if present
                if 'leetcode_problems' in result and result['leetcode_problems']:
                    if 'resources' not in result:
                        result['resources'] = []
                    # Add LeetCode problems to resources array
                    for problem in result['leetcode_problems']:
                        result['resources'].append(problem)
                    # Remove the separate leetcode_problems field
                    del result['leetcode_problems']
                return result
            except json.JSONDecodeError:
                # Second attempt: try to fix common syntax errors
                fixed_content = fix_json_syntax(cleaned_content)
                try:
                    result = json.loads(fixed_content)
                    # Post-process result to add LeetCode problems to resources if present
                    if 'leetcode_problems' in result and result['leetcode_problems']:
                        if 'resources' not in result:
                            result['resources'] = []
                        # Add LeetCode problems to resources array
                        for problem in result['leetcode_problems']:
                            result['resources'].append(problem)
                        # Remove the separate leetcode_problems field
                        del result['leetcode_problems']
                    logger.info("Successfully parsed JSON after syntax fixes")
                    return result
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON even after fixes: {str(e)}")
                    logger.error(f"Original content length: {len(content)}")
                    logger.error(f"Cleaned content preview: {cleaned_content[:500]}...")
                    
                    # Third attempt: extract content using regex patterns (fallback)
                    try:
                        logger.info("Attempting regex-based content extraction...")
                        
                        # Extract explanation
                        explanation_match = re.search(r'"explanation":\s*"(.*?)"(?=\s*,\s*"[^"]*":|$)', cleaned_content, re.DOTALL)
                        explanation = explanation_match.group(1) if explanation_match else f"Basic overview of {topic}"
                        
                        # Extract resources array
                        resources_match = re.search(r'"resources":\s*\[(.*?)\]', cleaned_content, re.DOTALL)
                        resources = []
                        if resources_match:
                            # Simple extraction of quoted strings
                            resource_items = re.findall(r'"([^"]*)"', resources_match.group(1))
                            # Clean each resource item
                            cleaned_resources = []
                            for item in resource_items[:5]:  # Limit to 5 resources
                                # Remove extra characters and clean URLs
                                cleaned_item = item.strip()
                                # Remove trailing brackets, @ symbols, and other artifacts
                                cleaned_item = re.sub(r'[@\[\]{}()]+$', '', cleaned_item)
                                # Remove leading @ symbols and brackets
                                cleaned_item = re.sub(r'^[@\[\]{}()]+', '', cleaned_item)
                                # Remove duplicate spaces
                                cleaned_item = re.sub(r'\s+', ' ', cleaned_item).strip()
                                if cleaned_item:
                                    cleaned_resources.append(cleaned_item)
                            resources = cleaned_resources
                        
                        if not resources:
                            resources = [f"Official {topic} documentation", f"Tutorial on {topic}"]
                        
                        # Extract subtasks array  
                        subtasks_match = re.search(r'"subtasks":\s*\[(.*?)\]', cleaned_content, re.DOTALL)
                        subtasks = []
                        if subtasks_match:
                            # Simple extraction of quoted strings
                            subtask_items = re.findall(r'"([^"]*)"', subtasks_match.group(1))
                            subtasks = subtask_items[:4]  # Limit to 4 subtasks
                        
                        if not subtasks:
                            subtasks = [f"Learn {topic} basics", f"Practice {topic} examples"]
                        
                        result = {
                            "explanation": explanation,
                            "resources": resources,
                            "subtasks": subtasks
                        }
                        
                        logger.info("Successfully extracted content using regex fallback")
                        return result
                        
                    except Exception as regex_error:
                        logger.error(f"Regex extraction also failed: {str(regex_error)}")
                        raise e
                    
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {str(e)}")
            return {
                "subtopics": [
                    {"title": f"Introduction to {topic}", "description": f"Learn the fundamental concepts and principles of {topic} with hands-on examples"},
                    {"title": f"Core Concepts", "description": f"Master the essential concepts and building blocks of {topic} development"},
                    {"title": f"Practical Applications", "description": f"Apply {topic} skills through real-world projects and practical implementations"},
                    {"title": f"Best Practices", "description": f"Understand industry standards, coding conventions, and optimization techniques for {topic}"},
                    {"title": f"Common Challenges", "description": f"Learn to troubleshoot and solve typical problems encountered when working with {topic}"},
                    {"title": f"Advanced Techniques", "description": f"Explore advanced patterns, performance optimization, and professional-level {topic} development"}
                ]
            }
        except Exception as e:
            logger.error(f"Error processing AI response: {str(e)}")
            return {
                "explanation": f"Error generating lesson for {topic}. Please try again.",
                "resources": [],
                "subtasks": []
            }
            
    except Exception as e:
        logger.error(f"Error calling Gemini API: {str(e)}")
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

def validate_content_quality(content_data: Dict[str, Any]) -> bool:
    """Validate if content is well-formatted and suitable for display."""
    try:
        if not isinstance(content_data, dict):
            return False
            
        explanation = content_data.get("explanation", "")
        if not explanation or not isinstance(explanation, str):
            return False
            
        # Check for common formatting issues
        issues = [
            # Literal \n instead of actual newlines
            explanation.count("\\n") > explanation.count("\n") * 0.1,
            # Too many consecutive newlines (malformed)
            "\\n\\n\\n" in explanation,
            # Malformed code blocks
            explanation.count("```") % 2 != 0,
            # Missing spaces in markdown
            "**text**" in explanation.lower(),
            # Very long lines without breaks (over 500 chars)
            any(len(line) > 500 for line in explanation.split('\n')),
            # Empty or very short content
            len(explanation.strip()) < 100
        ]
        
        # If more than 2 issues detected, consider it poor quality
        if sum(issues) > 2:
            logger.warning(f"Content quality issues detected: {sum(issues)} problems found")
            return False
            
        return True
        
    except Exception as e:
        logger.error(f"Error validating content quality: {str(e)}")
        return False

def post_process_content(content_data: Dict[str, Any]) -> Dict[str, Any]:
    """Post-process content to fix common formatting issues."""
    try:
        if not isinstance(content_data, dict):
            return content_data
            
        explanation = content_data.get("explanation", "")
        if not explanation or not isinstance(explanation, str):
            return content_data
            
        # Fix literal \n characters to actual newlines
        if "\\n" in explanation:
            explanation = explanation.replace("\\n", "\n")
            
        # Fix common markdown issues
        explanation = explanation.replace("**text**", "**bold text**")
        explanation = explanation.replace("*text*", "*italic text*")
        
        # Fix malformed code blocks
        if explanation.count("```") % 2 != 0:
            explanation += "\n```"
            
        # Ensure proper spacing around headers
        import re
        explanation = re.sub(r'(\n?)##([^\n]+)(\n?)', r'\n\n##\2\n\n', explanation)
        explanation = re.sub(r'(\n?)###([^\n]+)(\n?)', r'\n\n###\2\n\n', explanation)
        
        # Remove excessive newlines
        explanation = re.sub(r'\n{4,}', '\n\n\n', explanation)
        
        # Clean up leading/trailing whitespace
        explanation = explanation.strip()
        
        # Update the content
        processed_content = content_data.copy()
        processed_content["explanation"] = explanation
        
        logger.info("Content post-processing completed successfully")
        return processed_content
        
    except Exception as e:
        logger.error(f"Error post-processing content: {str(e)}")
        return content_data  # Return original if processing fails

@router.post(
    "/generate-subtopics",
    summary="Generate subtopics for a learning topic",
    description="Generate AI-powered subtopics for a specific learning topic and store them in the database"
)
@limiter.limit(RateLimits.AI_SUBTOPICS)
async def generate_subtopics(
    request: Request,
    subtopic_request: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate subtopics for a specific learning topic using AI and store them in the database.
    
    Request should contain:
    - topic: The main topic to generate subtopics for
    - context: Optional context about the topic
    - user_level: User's experience level (beginner, intermediate, advanced)
    - force_regenerate: Whether to force regeneration even if subtopics exist
    """
    try:
        topic = subtopic_request.get("topic", "")
        context = subtopic_request.get("context", "")
        user_level = subtopic_request.get("user_level", "intermediate")
        force_regenerate = subtopic_request.get("force_regenerate", False)
        
        if not topic:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Topic is required"
            )
        
        # Get user's onboarding data for personalized suggestions
        onboarding_data = await get_onboarding_data_by_user_id(db, user_id=current_user.id)
        
        # Check if subtopics already exist for this topic (unless force regenerate)
        if not force_regenerate:
            existing_content = await get_learning_content(
                db=db, 
                user_id=current_user.id, 
                topic=topic, 
                content_type="subtopics",
                context=context
            )
            
            if existing_content:
                # Update access tracking
                await update_access_tracking(db, existing_content.id)
                
                return {
                    "success": True,
                    "subtopics": existing_content.content_data.get("subtopics", []),
                    "cached": True
                }
        
        # Generate new subtopics using AI with user profile
        subtopics_data = await generate_subtopics_ai(topic, context, user_level, onboarding_data)
        
        # Store in database
        learning_content = await upsert_learning_content(
            db=db,
            user_id=current_user.id,
            content_type="subtopics",
            topic=topic,
            content_data=subtopics_data,
            context=context,
            user_level=user_level,
            generation_metadata={
                "model": "gemini-2.0-flash",
                "generated_at": datetime.now().isoformat(),
                "request_context": context,
                "personalized": True
            }
        )
        
        # Update access tracking
        await update_access_tracking(db, learning_content.id)
        
        return {
            "success": True,
            "subtopics": subtopics_data.get("subtopics", []),
            "cached": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating subtopics: {str(e)}")
        return {
            "success": False,
            "subtopics": [],
            "cached": False
        }

@router.get(
    "/learning-content/{content_type}",
    summary="Get user's learning content",
    description="Retrieve stored learning content (subtopics, explanations, etc.) for the user"
)
@limiter.limit(RateLimits.API_READ)
async def get_user_learning_content(
    request: Request,
    content_type: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all learning content of a specific type for the authenticated user.
    
    content_type can be: subtopics, explanation, resources
    """
    
    try:
        content_list = await get_learning_content_by_user(
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

async def generate_subtopics_ai(topic: str, context: str, user_level: str, onboarding_data: any = None) -> Dict[str, Any]:
    """Generate subtopics using Google Gemini with personalized AI suggestions."""
    
    try:
        # Check if Gemini API key is configured
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            logger.warning("Gemini API key not configured, using fallback subtopics")
            return {
                "subtopics": [
                    {"title": f"AI Suggestion: {topic} Fundamentals", "description": f"Learn the fundamental concepts and principles of {topic} with hands-on examples", "type": "ai_suggestion"},
                    {"title": f"AI Suggestion: {topic} for MANGO", "description": f"Understand how {topic} is used at Meta, Apple, Nvidia, Google, and OpenAI", "type": "ai_suggestion"},
                    {"title": f"Core Concepts", "description": f"Master the essential concepts and building blocks of {topic} development", "type": "regular"},
                    {"title": f"Practical Applications", "description": f"Apply {topic} skills through real-world projects and practical implementations", "type": "regular"},
                    {"title": f"Best Practices", "description": f"Understand industry standards, coding conventions, and optimization techniques for {topic}", "type": "regular"},
                    {"title": f"Advanced Techniques", "description": f"Explore advanced patterns, performance optimization, and professional-level {topic} development", "type": "regular"},
                    {"title": f"Industry Integration", "description": f"Learn how {topic} integrates with other technologies and fits into larger systems", "type": "regular"}
                ]
            }
        
        # Create user profile summary for personalized suggestions
        user_profile = ""
        if onboarding_data:
            profile_parts = []
            profile_parts.append(f"Experience Level: {onboarding_data.experience_level}")
            profile_parts.append(f"Major: {onboarding_data.major}")
            
            if onboarding_data.programming_languages:
                profile_parts.append(f"Programming Languages: {', '.join(onboarding_data.programming_languages)}")
            
            if onboarding_data.frameworks:
                profile_parts.append(f"Frameworks: {', '.join(onboarding_data.frameworks)}")
            
            if onboarding_data.tools:
                profile_parts.append(f"Tools: {', '.join(onboarding_data.tools)}")
            
            if onboarding_data.preferred_tech_stack:
                profile_parts.append(f"Preferred Tech Stack: {onboarding_data.preferred_tech_stack}")
            
            if onboarding_data.target_roles:
                profile_parts.append(f"Target Roles: {', '.join(onboarding_data.target_roles)}")
            
            user_profile = "\n".join(profile_parts)
        
        # Import Google Generative AI here to avoid import errors if not installed
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=gemini_api_key)
        
        # Create a focused prompt for subtopic generation with AI suggestions
        prompt = f"""Generate exactly 7 specific, learnable subtopics for "{topic}" tailored for a {user_level} developer preparing for MANGO company internships (Meta, Apple, Nvidia, Google, OpenAI).

Topic: {topic}
Context: {context}
User Profile:
{user_profile}

REQUIREMENTS:
- Generate exactly 7 subtopics
- First 2 subtopics should be AI SUGGESTIONS based on user's profile gaps and MANGO company requirements
- Last 5 subtopics should be regular improvement topics for the current subject
- Order from foundational to advanced concepts
- Make each subtopic specific and actionable
- Focus on practical skills for MANGO internship preparation

AI SUGGESTIONS (First 2):
- Analyze the user's profile and identify skill gaps relevant to MANGO companies
- Suggest complementary topics that would strengthen their profile
- Consider what MANGO companies value most for their target roles

REGULAR TOPICS (Last 5):
- Focus on deepening knowledge of the current topic
- Build upon each other logically
- Include hands-on learning opportunities

Return JSON format with titles, descriptions, and type markers:
{{
  "subtopics": [
    {{
      "title": "Short UI-friendly title (max 4-5 words)",
      "description": "Detailed description explaining what will be covered and why it's important for MANGO prep",
      "type": "ai_suggestion"
    }},
    {{
      "title": "Short UI-friendly title (max 4-5 words)", 
      "description": "Detailed description explaining what will be covered and why it's important for MANGO prep",
      "type": "ai_suggestion"
    }},
    {{
      "title": "Short UI-friendly title (max 4-5 words)",
      "description": "Detailed description for current topic improvement",
      "type": "regular"
    }},
    {{
      "title": "Short UI-friendly title (max 4-5 words)",
      "description": "Detailed description for current topic improvement", 
      "type": "regular"
    }},
    {{
      "title": "Short UI-friendly title (max 4-5 words)",
      "description": "Detailed description for current topic improvement",
      "type": "regular"
    }},
    {{
      "title": "Short UI-friendly title (max 4-5 words)",
      "description": "Detailed description for current topic improvement",
      "type": "regular"
    }},
    {{
      "title": "Short UI-friendly title (max 4-5 words)",
      "description": "Detailed description for current topic improvement",
      "type": "regular"
    }}
  ]
}}

The AI suggestions should address gaps in the user's profile and recommend complementary skills that MANGO companies value."""
        
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                response_mime_type='application/json'
            )
        )
        
        content = response.text
        
        # Parse JSON response
        try:
            # Clean the response
            cleaned_content = content.strip()
            if cleaned_content.startswith('```json'):
                cleaned_content = cleaned_content[7:]
            if cleaned_content.endswith('```'):
                cleaned_content = cleaned_content[:-3]
            cleaned_content = cleaned_content.strip()
            
            subtopics_data = json.loads(cleaned_content)
            
            # Validate structure
            if "subtopics" not in subtopics_data:
                raise ValueError("Invalid response structure")
            
            # Ensure we have exactly 7 subtopics with proper types
            subtopics = subtopics_data["subtopics"]
            if len(subtopics) != 7:
                logger.warning(f"Expected 7 subtopics, got {len(subtopics)}")
            
            # Ensure first 2 are marked as AI suggestions
            for i in range(min(2, len(subtopics))):
                if subtopics[i].get("type") != "ai_suggestion":
                    subtopics[i]["type"] = "ai_suggestion"
            
            # Ensure last 5 are marked as regular
            for i in range(2, len(subtopics)):
                if subtopics[i].get("type") != "regular":
                    subtopics[i]["type"] = "regular"
            
            return {"subtopics": subtopics}
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Error parsing AI response: {str(e)}")
            # Return fallback with proper structure
            return {
                "subtopics": [
                    {"title": f"AI Suggestion: {topic} Fundamentals", "description": f"Learn the fundamental concepts and principles of {topic} with hands-on examples", "type": "ai_suggestion"},
                    {"title": f"AI Suggestion: {topic} for MANGO", "description": f"Understand how {topic} is used at Meta, Apple, Nvidia, Google, and OpenAI", "type": "ai_suggestion"},
                    {"title": f"Core Concepts", "description": f"Master the essential concepts and building blocks of {topic} development", "type": "regular"},
                    {"title": f"Practical Applications", "description": f"Apply {topic} skills through real-world projects and practical implementations", "type": "regular"},
                    {"title": f"Best Practices", "description": f"Understand industry standards, coding conventions, and optimization techniques for {topic}", "type": "regular"},
                    {"title": f"Advanced Techniques", "description": f"Explore advanced patterns, performance optimization, and professional-level {topic} development", "type": "regular"},
                    {"title": f"Industry Integration", "description": f"Learn how {topic} integrates with other technologies and fits into larger systems", "type": "regular"}
                ]
            }
        
    except Exception as e:
        logger.error(f"Error in AI subtopic generation: {str(e)}")
        # Return fallback with proper structure
        return {
            "subtopics": [
                {"title": f"AI Suggestion: {topic} Fundamentals", "description": f"Learn the fundamental concepts and principles of {topic} with hands-on examples", "type": "ai_suggestion"},
                {"title": f"AI Suggestion: {topic} for MANGO", "description": f"Understand how {topic} is used at Meta, Apple, Nvidia, Google, and OpenAI", "type": "ai_suggestion"},
                {"title": f"Core Concepts", "description": f"Master the essential concepts and building blocks of {topic} development", "type": "regular"},
                {"title": f"Practical Applications", "description": f"Apply {topic} skills through real-world projects and practical implementations", "type": "regular"},
                {"title": f"Best Practices", "description": f"Understand industry standards, coding conventions, and optimization techniques for {topic}", "type": "regular"},
                {"title": f"Advanced Techniques", "description": f"Explore advanced patterns, performance optimization, and professional-level {topic} development", "type": "regular"},
                {"title": f"Industry Integration", "description": f"Learn how {topic} integrates with other technologies and fits into larger systems", "type": "regular"}
            ]
        } 

@router.post(
    "/lesson-chat",
    summary="Chat with AI about lesson content",
    description="Get AI responses about the current lesson topic with context awareness"
)
@limiter.limit(RateLimits.AI_CHAT)
async def lesson_chat(
    request: Request,
    chat_request: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Chat with AI about a specific lesson topic.
    
    Request should contain:
    - message: User's message (max 300 characters)
    - topic: Current lesson topic
    - context: Lesson context (e.g., "Week 1: Introduction to React")
    - chat_history: Array of previous messages for context
    - lesson_content: Brief summary of the lesson content
    """
    
    try:
        message = chat_request.get("message", "").strip()
        topic = chat_request.get("topic", "")
        context = chat_request.get("context", "")
        chat_history = chat_request.get("chat_history", [])
        lesson_content = chat_request.get("lesson_content", "")
        
        # Validate inputs
        if not message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message is required"
            )
        
        if len(message) > 300:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message must be 300 characters or less"
            )
        
        if not topic:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Topic is required"
            )
        
        # Generate AI response using Gemini
        response = await generate_chat_response(
            message=message,
            topic=topic,
            context=context,
            chat_history=chat_history,
            lesson_content=lesson_content
        )
        
        return {
            "success": True,
            "response": response,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in lesson chat: {str(e)}")
        return {
            "success": False,
            "response": "I apologize, but I'm having trouble processing your request. Please try again.",
            "timestamp": datetime.now().isoformat()
        }

async def generate_chat_response(
    message: str, 
    topic: str, 
    context: str, 
    chat_history: List[Dict[str, str]], 
    lesson_content: str
) -> str:
    """Generate chat response using Google Gemini with lesson context."""
    
    try:
        # Check if Gemini API key is configured
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            logger.warning("Gemini API key not configured")
            return "I'm currently unavailable. Please ensure the AI service is properly configured."
        
        # Import Google AI Python SDK (using the same pattern as existing code)
        try:
            from google import genai
            from google.genai import types
        except ImportError:
            logger.error("Google Generative AI package not installed")
            return "AI service is not properly configured. Please contact support."
        
        # Configure Gemini client (same pattern as existing code)
        client = genai.Client(api_key=gemini_api_key)
        
        # Build conversation history
        conversation_context = ""
        if chat_history:
            # Limit to last 5 exchanges to manage token usage
            recent_history = chat_history[-10:]  # Last 5 user + 5 AI messages
            for msg in recent_history:
                role = "User" if msg.get("type") == "user" else "Assistant"
                conversation_context += f"{role}: {msg.get('content', '')}\n"
        
        # Create the prompt
        prompt = f"""You are an AI tutor helping a student understand the lesson on "{topic}".

            Current lesson context: {context}

            Lesson summary: {lesson_content[:500] if lesson_content else 'No summary available'}

            Previous conversation:
            {conversation_context}

            Student's current question: {message}

            Instructions:
            1. Provide a helpful, concise response (2-3 sentences max)
            2. Stay focused ONLY on the lesson topic: {topic}
            3. If the question is unrelated to {topic}, politely redirect to the lesson
            4. Use simple, clear language appropriate for learning
            5. Include a brief code example if relevant and helpful
            6. Be encouraging and supportive

            Response:"""

        # Generate response using Gemini (same pattern as existing code)
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                top_p=0.9,
                max_output_tokens=300,  # Keep responses concise
            )
        )
        
        # Extract and clean the response
        if response and response.text:
            ai_response = response.text.strip()
            
            # Ensure response stays on topic
            off_topic_phrases = [
                "that's not related", 
                "let's focus on", 
                "getting back to",
                "outside the scope"
            ]
            
            # If response seems off-topic, provide a redirect
            if any(phrase in ai_response.lower() for phrase in off_topic_phrases):
                return f"That's an interesting question! However, let's stay focused on our current lesson about {topic}. Is there anything specific about {topic} you'd like me to explain?"
            
            return ai_response
        else:
            logger.error("Empty response from Gemini")
            return f"I'd be happy to help you understand {topic} better. Could you please rephrase your question?"
            
    except Exception as e:
        logger.error(f"Error calling Gemini API for chat: {str(e)}")
        return "I'm having trouble connecting to the AI service. Please try again in a moment." 