"""
Roadmap Agent - Generates personalized 3-month weekly internship preparation roadmap using Google Gemini.
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
        """Debug environment variable and Gemini setup."""
        # Check if running in Docker or local environment
        is_docker = os.getenv("DOCKER_CONTAINER") == "true"
        self.log_info(f"Running in Docker: {is_docker}")
        
        if not is_docker:
            env_path = Path(__file__).parent.parent.parent / ".env"
            self.log_info(f"Looking for .env file at: {env_path}")
            self.log_info(f".env file exists: {env_path.exists()}")
        else:
            self.log_info("Using Docker environment variables (no .env file needed)")
        
        # Check Gemini API key
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            self.log_info(f"Gemini API key found (length: {len(gemini_key)})")
            # Log first 8 and last 4 characters for debugging
            self.log_info(f"Gemini key preview: {gemini_key[:8]}...{gemini_key[-4:]}")
        else:
            self.log_error("GEMINI_API_KEY environment variable not found!")
            self.log_info("Available environment variables with 'GEMINI': " + 
                         str([k for k in os.environ.keys() if 'GEMINI' in k.upper()]))
        
        # Test Gemini import
        try:
            from google import genai
            self.log_info("Google Generative AI import successful")
        except ImportError as e:
            self.log_error(f"Failed to import Google Generative AI: {e}")

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
    
    async def generate_roadmap(self, onboarding_data: Dict[str, Any], resume_summary: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Public method to generate roadmap directly.
        
        Args:
            onboarding_data: User's onboarding information
            resume_summary: Optional resume analysis
        
        Returns:
            Dictionary containing the generated roadmap
        """
        return await self._generate_roadmap(onboarding_data, resume_summary)
    
    async def _generate_roadmap(self, onboarding_data: Dict[str, Any], resume_summary: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate the personalized roadmap using OpenAI based on user data."""
        
        try:
            self.log_info("Starting Gemini roadmap generation")
            
            # Create user profile summary for Gemini
            user_profile = self._create_user_profile_summary(onboarding_data, resume_summary)
            self.log_info(f"Created user profile (length: {len(user_profile)} chars)")
            
            # Generate roadmap using Gemini
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
            # Fallback to basic structure if Gemini fails
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
        """Create a comprehensive user profile summary for Gemini prompt."""
        
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
        
        frameworks = onboarding_data.get('frameworks', [])
        if frameworks:
            profile_parts.append(f"Frameworks: {', '.join(frameworks)}")
        
        tools = onboarding_data.get('tools', [])
        if tools:
            profile_parts.append(f"Tools: {', '.join(tools)}")
        
        tech_stack = onboarding_data.get('preferred_tech_stack', '')
        if tech_stack:
            profile_parts.append(f"Preferred Tech Stack: {tech_stack}")
        
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
        
        # Source of discovery
        if onboarding_data.get('source_of_discovery'):
            profile_parts.append(f"How they found us: {onboarding_data['source_of_discovery']}")
        
        return "\n".join(profile_parts)
    
    async def _generate_ai_roadmap(self, user_profile: str) -> Dict[str, Any]:
        """Generate complete roadmap using Google Gemini."""
        
        # Check if Gemini API key is configured
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            self.log_error("Gemini API key not configured - check GEMINI_API_KEY environment variable")
            raise Exception("Gemini API key not configured")
        
        try:
            self.log_info("Importing Google Generative AI...")
            from google import genai
            from google.genai import types
            
            self.log_info("Configuring Gemini client...")
            client = genai.Client(api_key=gemini_api_key)
            
            # Create comprehensive prompt for roadmap generation
            prompt = self._create_roadmap_prompt(user_profile)
            self.log_info(f"Created prompt (length: {len(prompt)} chars)")
            
            self.log_info("Calling Gemini API...")
            
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    response_mime_type='application/json'
                )
            )
            
            self.log_info("Received Gemini response")
            content = response.text
            self.log_info(f"Response content length: {len(content)} chars")
            self.log_info(f"Response preview: {content[:200]}...")
            
            # Parse JSON response
            try:
                # Clean the response (remove any markdown formatting if present)
                cleaned_content = content.strip()
                if cleaned_content.startswith('```json'):
                    cleaned_content = cleaned_content[7:]
                if cleaned_content.endswith('```'):
                    cleaned_content = cleaned_content[:-3]
                cleaned_content = cleaned_content.strip()
                
                roadmap_data = json.loads(cleaned_content)
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
                raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
                
        except Exception as e:
            self.log_error(f"Gemini API error: {str(e)}")
            self.log_error(f"Error type: {type(e).__name__}")
            raise
    
    def _create_roadmap_prompt(self, user_profile: str) -> str:
        """Create detailed prompt for Gemini roadmap generation focused on MANGO companies with structured phases."""
        
        return f"""You are an expert career coach specializing in MANGO (Meta, Apple, Nvidia, Google, OpenAI) internship preparation. Create a personalized 12-week roadmap with a structured 4-phase approach.

STUDENT PROFILE:
{user_profile}

MANDATORY ROADMAP STRUCTURE:
The roadmap MUST follow this exact 4-phase structure based on the user's preferred tech stack:

**PHASE 1: Tech Stack Mastery (Weeks 1-4)**
- Deep dive into the user's preferred tech stack fundamentals
- Build strong foundation in their chosen technology
- Focus on core concepts, best practices, and practical implementation
- Each week should progressively build expertise in their tech stack

**PHASE 2: Technical Interview Preparation (Weeks 5-9)** 
- LeetCode practice focusing on MANGO company interview patterns
- Implement and optimize core data structures used in tech interviews
- Master problem-solving techniques required by MANGO interviewers
- Progress from easy to hard problems systematically

**PHASE 3: Portfolio Projects (Weeks 10-11)**
- Build 2 complete, production-quality projects each week that will stand out on your CV for MANGO companies
- Each project should demonstrate mastery of your tech stack and solve real-world problems
- Implement advanced features like authentication, CI/CD, testing, and performance optimization
- Focus on scalability, clean code, and industry best practices
- Ensure projects showcase skills specifically valued at your target MANGO companies

**PHASE 4: Interview Mastery (Weeks 11-12)**
- Technical interview practice (mock coding sessions and system design)
- Behavioral interview preparation aligned with MANGO values
- Final portfolio polish and readiness review
- Mock interviews and last-minute revision

MANGO COMPANY FOCUS:
- Meta (Facebook): System design, React/frontend, backend scalability, social media algorithms
- Apple: iOS/macOS development, Swift, design principles, hardware-software integration
- Nvidia: GPU computing, CUDA, machine learning, computer graphics, parallel programming
- Google: Algorithms, data structures, distributed systems, Android development, cloud technologies
- OpenAI: Machine learning, natural language processing, AI research, Python, deep learning frameworks

REQUIREMENTS:
- Exactly 12 weeks following the phase structure above
- 3-5 specific tasks per week tailored to the current phase and user's tech stack
- Realistic time estimates (12-25 hours/week based on phase intensity)
- Include concrete deliverables that showcase MANGO-relevant skills
- Provide high-quality learning resources (prefer official docs, top-tier courses)
- Ensure each phase fully covers its focus area while building on previous phases
- Tailor all content to the user's preferred tech stack throughout all phases

OUTPUT FORMAT: Return valid JSON only, structured as:
{{
    "weeks": [
        {{
            "week_number": 1,
            "theme": "Tech Stack Foundation - [Specific theme for user's stack]",
            "focus_area": "tech_stack_fundamentals", 
            "tasks": ["specific actionable task 1", "specific actionable task 2", ...],
            "estimated_hours": 15,
            "deliverables": ["concrete deliverable 1", "concrete deliverable 2"],
            "resources": ["high-quality resource 1", "high-quality resource 2", ...]
        }},
        ...
        {{
            "week_number": 5,
            "theme": "Algorithmic Thinking - [Interview topic for MANGO companies]",
            "focus_area": "algorithms_data_structures",
            "tasks": ["LeetCode practice task 1", "DSA implementation task 2", ...],
            "estimated_hours": 18,
            "deliverables": ["algorithm implementations", "problem solutions"],
            "resources": ["LeetCode free problems", "algorithm courses", ...]
        }},
        ...
        {{
            "week_number": 10,
            "theme": "Portfolio Project Development - [Tech stack specific]",
            "focus_area": "portfolio_projects",
            "tasks": ["project planning", "core feature implementation", ...],
            "estimated_hours": 22,
            "deliverables": ["project milestone", "code repository"],
            "resources": ["project tutorials", "deployment guides", ...]
        }},
        ...
        {{
            "week_number": 12,
            "theme": "Interview Mastery - [Tech stack + MANGO prep]",
            "focus_area": "interview_preparation",
            "tasks": ["mock interviews", "system design practice", ...],
            "estimated_hours": 20,
            "deliverables": ["interview readiness", "final portfolio"],
            "resources": ["interview prep platforms", "system design courses", ...]
        }}
    ]
}}

Create a roadmap that systematically builds from tech stack mastery to MANGO interview readiness. Every week should be deeply connected to the user's preferred technology while progressing through the structured phases."""
    
    def _extract_json_from_response(self, content: str) -> Dict[str, Any]:
        """Extract JSON from Gemini response if parsing fails."""
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
        preferred_tech_stack = onboarding_data.get("preferred_tech_stack", "")
        
        # Determine focus areas (simplified)
        focus_areas = []
        if "Software Engineer" in str(target_roles):
            focus_areas.extend(["algorithms", "coding_practice", "system_design", "data_structures", "object_oriented_programming", "testing", "version_control", "debugging"])
        if "Data Science" in str(target_roles):
            focus_areas.extend(["python", "machine_learning", "statistics", "data_visualization", "data_cleaning", "big_data", "sql", "deep_learning", "pandas", "numpy"])
        if "Web Development" in str(preferred_tech_stack):
            focus_areas.extend(["web_development", "apis", "databases", "frontend", "backend", "responsive_design", "javascript", "html_css", "frameworks", "authentication", "deployment"])
        if "Mobile Development" in str(preferred_tech_stack):
            focus_areas.extend(["mobile_development", "ui_design", "app_architecture", "native_apis", "cross_platform", "app_publishing", "mobile_testing"])
        if "DevOps" in str(preferred_tech_stack):
            focus_areas.extend(["ci_cd", "containerization", "cloud_services", "infrastructure_as_code", "monitoring", "security"])
        
        # Remove duplicates
        focus_areas = list(set(focus_areas))[:6]
        
        return {
            "experience_level": experience_level,
            "programming_languages": programming_languages,
            "focus_areas": focus_areas,
            "timeline_urgency": self._assess_timeline_urgency(onboarding_data.get("application_timeline", "")),
            "target_internships": target_internships,
            "has_resume": resume_summary is not None,
            "ai_generated": True
        }
    
    async def _generate_fallback_roadmap(self, onboarding_data: Dict[str, Any], resume_summary: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate a basic fallback roadmap if Gemini fails."""
        
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