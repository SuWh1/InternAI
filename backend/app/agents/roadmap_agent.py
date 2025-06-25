"""
Roadmap Agent - Generates personalized 3-month weekly internship preparation roadmap using OpenAI.
"""

import os
import json
from typing import Dict, Any, List
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv
from .base_agent import BaseAgent, AgentResponse

# Note: In Docker, environment variables are passed via docker-compose
# Only load .env file if not running in Docker (for local development)
if not os.getenv("DOCKER_CONTAINER"):
    env_path = Path(__file__).parent.parent.parent / ".env"
    load_dotenv(dotenv_path=env_path)

class RoadmapAgent(BaseAgent):
    """Agent responsible for generating personalized internship preparation roadmap."""
    
    def __init__(self):
        super().__init__("RoadmapAgent")
        # Debug environment setup
        self._debug_environment()
    
    def _debug_environment(self):
        """Debug environment variable and OpenAI setup."""
        # Check if running in Docker or local environment
        is_docker = os.getenv("DOCKER_CONTAINER") == "true"
        self.log_info(f"Running in Docker: {is_docker}")
        
        if not is_docker:
            env_path = Path(__file__).parent.parent.parent / ".env"
            self.log_info(f"Looking for .env file at: {env_path}")
            self.log_info(f".env file exists: {env_path.exists()}")
        else:
            self.log_info("Using Docker environment variables (no .env file needed)")
        
        # Check OpenAI API key
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            self.log_info(f"OpenAI API key found (length: {len(openai_key)})")
            # Log first 8 and last 4 characters for debugging
            self.log_info(f"OpenAI key preview: {openai_key[:8]}...{openai_key[-4:]}")
        else:
            self.log_error("OPENAI_API_KEY environment variable not found!")
            self.log_info("Available environment variables with 'OPENAI': " + 
                         str([k for k in os.environ.keys() if 'OPENAI' in k.upper()]))
        
        # Test OpenAI import
        try:
            from openai import AsyncOpenAI
            self.log_info("OpenAI import successful")
        except ImportError as e:
            self.log_error(f"Failed to import OpenAI: {e}")

    async def run(self, input_data: Dict[str, Any]) -> AgentResponse:
        """
        Generate a personalized 3-month weekly roadmap.
        
        Args:
            input_data: Dictionary containing:
                - onboarding_data: User's onboarding information
                - resume_summary: Optional resume analysis from ResumeAgent
        
        Returns:
            AgentResponse with personalized roadmap
        """
        try:
            self.log_info("Starting roadmap generation")
            
            onboarding_data = input_data.get("onboarding_data")
            resume_summary = input_data.get("resume_summary")
            
            if not onboarding_data:
                return self._create_response(
                    success=False,
                    error="Onboarding data is required for roadmap generation"
                )
            
            # Generate personalized roadmap
            roadmap = await self._generate_roadmap(onboarding_data, resume_summary)
            
            self.log_info("Roadmap generation completed successfully")
            
            return self._create_response(
                success=True,
                data={
                    "roadmap": roadmap,
                    "total_weeks": len(roadmap["weeks"]),
                    "personalization_factors": roadmap["personalization_factors"]
                }
            )
            
        except Exception as e:
            self.log_error(f"Error generating roadmap: {str(e)}")
            return self._create_response(
                success=False,
                error=f"Roadmap generation failed: {str(e)}"
            )
    
    async def _generate_roadmap(self, onboarding_data: Dict[str, Any], resume_summary: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate the personalized roadmap using OpenAI based on user data."""
        
        try:
            self.log_info("Starting OpenAI roadmap generation")
            
            # Create user profile summary for OpenAI
            user_profile = self._create_user_profile_summary(onboarding_data, resume_summary)
            self.log_info(f"Created user profile (length: {len(user_profile)} chars)")
            
            # Generate roadmap using OpenAI
            ai_roadmap = await self._generate_ai_roadmap(user_profile)
            
            # Create personalization factors for tracking
            personalization_factors = self._extract_personalization_factors(onboarding_data, resume_summary)
            
            self.log_info("Successfully generated AI roadmap")
            return {
                "weeks": ai_roadmap["weeks"],
                "personalization_factors": personalization_factors,
                "generated_at": datetime.now().isoformat(),
                "roadmap_type": "3_month_internship_prep",
                "ai_generated": True
            }
            
        except Exception as e:
            self.log_error(f"Error in AI roadmap generation: {str(e)}")
            self.log_error(f"Exception type: {type(e).__name__}")
            # Fallback to basic structure if OpenAI fails
            self.log_info("Falling back to template roadmap")
            return await self._generate_fallback_roadmap(onboarding_data, resume_summary)

    def _assess_timeline_urgency(self, application_timeline: str) -> str:
        """Assess how urgent the preparation is based on timeline."""
        timeline_lower = application_timeline.lower()
        
        if "this summer" in timeline_lower or "2024" in timeline_lower:
            return "high"
        elif "next summer" in timeline_lower or "2025" in timeline_lower:
            return "medium"
        elif "not sure" in timeline_lower:
            return "low"
        else:
            return "medium"

    def _create_user_profile_summary(self, onboarding_data: Dict[str, Any], resume_summary: Dict[str, Any] = None) -> str:
        """Create a comprehensive user profile summary for OpenAI prompt."""
        
        profile_parts = []
        
        # Basic info
        profile_parts.append(f"Academic Level: {onboarding_data.get('current_year', 'Unknown')}")
        profile_parts.append(f"Major: {onboarding_data.get('major', 'Unknown')}")
        profile_parts.append(f"Experience Level: {onboarding_data.get('experience_level', 'Beginner')}")
        profile_parts.append(f"Timeline: {onboarding_data.get('application_timeline', 'Unknown')}")
        
        # Technical background
        prog_langs = onboarding_data.get('programming_languages', [])
        if prog_langs:
            profile_parts.append(f"Programming Languages: {', '.join(prog_langs)}")
        
        frameworks = onboarding_data.get('frameworks_tools', [])
        if frameworks:
            profile_parts.append(f"Frameworks/Tools: {', '.join(frameworks)}")
        
        tech_stack = onboarding_data.get('preferred_tech_stack', [])
        if tech_stack:
            profile_parts.append(f"Preferred Tech Stack: {', '.join(tech_stack)}")
        
        # Experience
        if onboarding_data.get('has_internship_experience'):
            profile_parts.append("Has previous internship experience")
            if onboarding_data.get('previous_internships'):
                profile_parts.append(f"Previous Internships: {onboarding_data['previous_internships']}")
        
        if onboarding_data.get('projects'):
            profile_parts.append(f"Projects: {onboarding_data['projects']}")
        
        # Goals
        target_roles = onboarding_data.get('target_roles', [])
        if target_roles:
            profile_parts.append(f"Target Roles: {', '.join(target_roles)}")
        
        target_internships = onboarding_data.get('target_internships', [])
        if target_internships:
            profile_parts.append(f"Target Internships: {', '.join(target_internships)}")
        
        company_types = onboarding_data.get('preferred_company_types', [])
        if company_types:
            profile_parts.append(f"Preferred Company Types: {', '.join(company_types)}")
        
        # Resume info
        if resume_summary:
            tech_skills = resume_summary.get('technical_skills', [])
            if tech_skills:
                profile_parts.append(f"Resume Technical Skills: {', '.join(tech_skills[:10])}")
            
            work_exp = resume_summary.get('work_experience', [])
            if work_exp:
                profile_parts.append(f"Work Experience Count: {len(work_exp)} positions")
        
        # Additional info
        if onboarding_data.get('additional_info'):
            profile_parts.append(f"Additional Info: {onboarding_data['additional_info']}")
        
        return "\n".join(profile_parts)
    
    async def _generate_ai_roadmap(self, user_profile: str) -> Dict[str, Any]:
        """Generate complete roadmap using OpenAI."""
        
        # Check if OpenAI API key is configured
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            self.log_error("OpenAI API key not configured - check OPENAI_API_KEY environment variable")
            raise Exception("OpenAI API key not configured")
        
        try:
            self.log_info("Importing OpenAI...")
            # Import OpenAI
            from openai import AsyncOpenAI
            
            self.log_info("Creating OpenAI client...")
            client = AsyncOpenAI(api_key=openai_api_key)
            
            # Create comprehensive prompt for roadmap generation
            prompt = self._create_roadmap_prompt(user_profile)
            self.log_info(f"Created prompt (length: {len(prompt)} chars)")
            
            self.log_info("Calling OpenAI API...")
            
            response = await client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system", 
                        "content": "You are an expert career coach specializing in tech internship preparation. Generate detailed, personalized 12-week roadmaps for students. Always respond with valid JSON only."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=3000,  # Increased for full roadmap
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            self.log_info("Received OpenAI response")
            content = response.choices[0].message.content
            self.log_info(f"Response content length: {len(content)} chars")
            self.log_info(f"Response preview: {content[:200]}...")
            
            # Parse JSON response (guaranteed to be valid JSON due to response_format)
            try:
                roadmap_data = json.loads(content)
                self.log_info("Successfully parsed JSON roadmap")
                
                # Validate structure
                if "weeks" not in roadmap_data:
                    self.log_error("Invalid roadmap structure: missing 'weeks' key")
                    raise Exception("Invalid roadmap structure: missing 'weeks' key")
                
                weeks_count = len(roadmap_data["weeks"])
                self.log_info(f"Generated roadmap with {weeks_count} weeks")
                
                return roadmap_data
                
            except json.JSONDecodeError as e:
                self.log_error(f"JSON parsing error: {str(e)}")
                self.log_error(f"Raw content: {content}")
                # This should rarely happen with response_format, but provide fallback
                raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
                
        except Exception as e:
            self.log_error(f"OpenAI API error: {str(e)}")
            self.log_error(f"Error type: {type(e).__name__}")
            raise
    
    def _create_roadmap_prompt(self, user_profile: str) -> str:
        """Create detailed prompt for OpenAI roadmap generation."""
        
        return f"""Generate a personalized 12-week internship preparation roadmap for this student:

{user_profile}

Return ONLY valid JSON with this exact structure (no additional text or markdown):
{{
    "weeks": [
        {{
            "week_number": 1,
            "theme": "Week theme/title",
            "focus_area": "main_focus_area_keyword",
            "tasks": ["task1", "task2", "task3", "task4"],
            "estimated_hours": 15,
            "deliverables": ["deliverable1", "deliverable2"],
            "resources": ["resource1", "resource2", "resource3"]
        }}
    ]
}}

Requirements:
1. Generate exactly 12 weeks of content
2. Each week should have 3-5 specific, actionable tasks
3. Tailor content to the student's experience level, goals, and timeline
4. Include relevant resources (websites, books, platforms)
5. Estimate realistic weekly hours (8-25 hours depending on urgency)
6. Create meaningful deliverables for each week
7. Progression should build from foundational to advanced concepts
8. Focus on practical skills needed for target internships

Make it highly personalized based on:
- Their experience level and background
- Target internships and roles
- Programming languages and tech stack
- Timeline urgency
- Previous experience

Ensure tasks are specific and actionable, not generic advice.
Return only the JSON, no other text."""
    
    def _extract_json_from_response(self, content: str) -> Dict[str, Any]:
        """Extract JSON from OpenAI response if parsing fails."""
        try:
            # Look for JSON content between ```json and ``` or { and }
            import re
            
            self.log_info("Attempting to extract JSON from malformed response...")
            
            # Try to find JSON block
            json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', content, re.DOTALL)
            if json_match:
                self.log_info("Found JSON in code block")
                return json.loads(json_match.group(1))
            
            # Try to find raw JSON
            json_match = re.search(r'(\{.*\})', content, re.DOTALL)
            if json_match:
                self.log_info("Found raw JSON")
                return json.loads(json_match.group(1))
            
            # If no JSON found, raise error
            raise Exception("No valid JSON found in response")
            
        except Exception as e:
            self.log_error(f"Failed to extract JSON: {str(e)}")
            raise
    
    def _extract_personalization_factors(self, onboarding_data: Dict[str, Any], resume_summary: Dict[str, Any] = None) -> Dict[str, Any]:
        """Extract key personalization factors for tracking."""
        
        # Simplified version of the old analyze_user_profile for compatibility
        experience_level = onboarding_data.get("experience_level", "Beginner")
        target_roles = onboarding_data.get("target_roles", [])
        target_internships = onboarding_data.get("target_internships", [])
        programming_languages = onboarding_data.get("programming_languages", [])
        preferred_tech_stack = onboarding_data.get("preferred_tech_stack", [])
        
        # Determine focus areas (simplified)
        focus_areas = []
        if "Software Engineer" in str(target_roles):
            focus_areas.extend(["algorithms", "coding_practice", "system_design"])
        if "Data Science" in str(target_roles):
            focus_areas.extend(["python", "machine_learning", "statistics"])
        if "Web Development" in str(preferred_tech_stack):
            focus_areas.extend(["web_development", "apis", "databases"])
        
        # Remove duplicates
        focus_areas = list(set(focus_areas))[:6]
        
        return {
            "experience_level": experience_level,
            "focus_areas": focus_areas,
            "skill_assessment": {
                "overall_score": 5,  # Default middle score since AI handles assessment
                "level_category": experience_level.lower()
            },
            "timeline_urgency": self._assess_timeline_urgency(onboarding_data.get("application_timeline", "")),
            "target_internships": target_internships,
            "has_resume": resume_summary is not None,
            "ai_generated": True
        }
    
    async def _generate_fallback_roadmap(self, onboarding_data: Dict[str, Any], resume_summary: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate a basic fallback roadmap if OpenAI fails."""
        
        self.log_info("Using fallback roadmap generation")
        
        experience_level = onboarding_data.get("experience_level", "Beginner").lower()
        
        # Create basic 12-week structure
        weeks = []
        for i in range(1, 13):
            week = {
                "week_number": i,
                "theme": f"Week {i}: Preparation Phase {(i-1)//3 + 1}",
                "focus_area": "general_preparation",
                "tasks": [
                    "Study fundamental concepts for your target role",
                    "Practice coding problems appropriate to your level",
                    "Work on building or improving your portfolio",
                    "Research companies and internship opportunities"
                ],
                "estimated_hours": 12,
                "deliverables": ["Weekly progress summary"],
                "resources": ["Online coding platforms", "Official documentation", "Industry blogs"]
            }
            weeks.append(week)
        
        personalization_factors = self._extract_personalization_factors(onboarding_data, resume_summary)
        personalization_factors["ai_generated"] = False
        personalization_factors["fallback_used"] = True
        
        return {
            "weeks": weeks,
            "personalization_factors": personalization_factors,
            "generated_at": datetime.now().isoformat(),
            "roadmap_type": "3_month_internship_prep",
            "ai_generated": False,
            "fallback_used": True
        } 