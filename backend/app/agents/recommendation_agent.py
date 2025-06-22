"""
Recommendation Agent - Suggests relevant internship listings based on user profile.
"""

from typing import Dict, Any, List
from datetime import datetime
from .base_agent import BaseAgent, AgentResponse

class RecommendationAgent(BaseAgent):
    """Agent responsible for recommending relevant internship opportunities."""
    
    def __init__(self):
        super().__init__("RecommendationAgent")
        self.mock_internships = self._get_mock_internship_data()
    
    async def run(self, input_data: Dict[str, Any]) -> AgentResponse:
        """
        Generate internship recommendations based on user profile.
        
        Args:
            input_data: Dictionary containing:
                - onboarding_data: User's onboarding information
                - resume_summary: Optional resume analysis from ResumeAgent
                - roadmap: Optional roadmap from RoadmapAgent
        
        Returns:
            AgentResponse with internship recommendations
        """
        try:
            self.log_info("Starting internship recommendation generation")
            
            onboarding_data = input_data.get("onboarding_data")
            resume_summary = input_data.get("resume_summary")
            roadmap = input_data.get("roadmap")
            
            if not onboarding_data:
                return self._create_response(
                    success=False,
                    error="Onboarding data is required for recommendations"
                )
            
            # Generate recommendations
            recommendations = await self._generate_recommendations(onboarding_data, resume_summary, roadmap)
            
            self.log_info(f"Generated {len(recommendations)} internship recommendations")
            
            return self._create_response(
                success=True,
                data={
                    "recommendations": recommendations,
                    "total_recommendations": len(recommendations),
                    "recommendation_criteria": self._get_recommendation_criteria(onboarding_data)
                }
            )
            
        except Exception as e:
            self.log_error(f"Error generating recommendations: {str(e)}")
            return self._create_response(
                success=False,
                error=f"Recommendation generation failed: {str(e)}"
            )
    
    async def _generate_recommendations(self, onboarding_data: Dict[str, Any], 
                                       resume_summary: Dict[str, Any] = None,
                                       roadmap: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Generate personalized internship recommendations."""
        
        # Create user profile for matching
        user_profile = self._create_user_profile(onboarding_data, resume_summary)
        
        # Score and rank internships
        scored_internships = []
        for internship in self.mock_internships:
            score = self._calculate_match_score(internship, user_profile)
            if score > 0.3:  # Only include internships with > 30% match
                internship_with_score = internship.copy()
                internship_with_score["match_score"] = round(score * 100, 1)
                internship_with_score["match_reasons"] = self._get_match_reasons(internship, user_profile)
                scored_internships.append(internship_with_score)
        
        # Sort by score and return top 5
        scored_internships.sort(key=lambda x: x["match_score"], reverse=True)
        
        return scored_internships[:5]
    
    def _create_user_profile(self, onboarding_data: Dict[str, Any], resume_summary: Dict[str, Any] = None) -> Dict[str, Any]:
        """Create a user profile for matching against internships."""
        
        profile = {
            "target_roles": onboarding_data.get("target_roles", []),
            "programming_languages": onboarding_data.get("programming_languages", []),
            "preferred_tech_stack": onboarding_data.get("preferred_tech_stack", []),
            "preferred_locations": onboarding_data.get("preferred_locations", []),
            "preferred_company_types": onboarding_data.get("preferred_company_types", []),
            "experience_level": onboarding_data.get("experience_level", "Beginner"),
            "major": onboarding_data.get("major", ""),
            "current_year": onboarding_data.get("current_year", ""),
            "has_internship_experience": onboarding_data.get("has_internship_experience", False)
        }
        
        # Add resume-based information if available
        if resume_summary:
            profile["resume_technical_skills"] = resume_summary.get("technical_skills", [])
            profile["resume_work_experience"] = resume_summary.get("work_experience", [])
            profile["resume_projects"] = resume_summary.get("projects", [])
        
        return profile
    
    def _calculate_match_score(self, internship: Dict[str, Any], user_profile: Dict[str, Any]) -> float:
        """Calculate how well an internship matches the user profile."""
        
        total_score = 0.0
        max_score = 0.0
        
        # Role matching (weight: 0.3)
        role_score = self._score_role_match(internship, user_profile)
        total_score += role_score * 0.3
        max_score += 0.3
        
        # Technical skills matching (weight: 0.25)
        tech_score = self._score_tech_match(internship, user_profile)
        total_score += tech_score * 0.25
        max_score += 0.25
        
        # Location matching (weight: 0.15)
        location_score = self._score_location_match(internship, user_profile)
        total_score += location_score * 0.15
        max_score += 0.15
        
        # Company type matching (weight: 0.15)
        company_score = self._score_company_match(internship, user_profile)
        total_score += company_score * 0.15
        max_score += 0.15
        
        # Experience level matching (weight: 0.15)
        experience_score = self._score_experience_match(internship, user_profile)
        total_score += experience_score * 0.15
        max_score += 0.15
        
        return total_score / max_score if max_score > 0 else 0.0
    
    def _score_role_match(self, internship: Dict[str, Any], user_profile: Dict[str, Any]) -> float:
        """Score how well the internship role matches user's target roles."""
        internship_role = internship.get("role", "").lower()
        target_roles = [role.lower() for role in user_profile.get("target_roles", [])]
        
        if not target_roles:
            return 0.5  # Neutral score if no preference
        
        # Direct match
        for target_role in target_roles:
            if self._roles_match(internship_role, target_role):
                return 1.0
        
        # Partial match
        for target_role in target_roles:
            if any(word in internship_role for word in target_role.split() if len(word) > 3):
                return 0.7
        
        return 0.2  # Low score for no match
    
    def _roles_match(self, internship_role: str, target_role: str) -> bool:
        """Check if roles are a good match."""
        role_synonyms = {
            "software engineer": ["software developer", "backend engineer", "frontend engineer", "full stack engineer"],
            "data science": ["data scientist", "data analyst", "machine learning engineer"],
            "machine learning": ["ml engineer", "ai engineer", "data scientist"],
            "product manager": ["product management", "pm intern"],
            "ux design": ["ui design", "product design", "user experience"],
            "devops": ["site reliability", "infrastructure", "platform engineer"]
        }
        
        # Check direct match
        if target_role in internship_role or internship_role in target_role:
            return True
        
        # Check synonyms
        for role_type, synonyms in role_synonyms.items():
            if role_type in target_role:
                return any(synonym in internship_role for synonym in synonyms)
        
        return False
    
    def _score_tech_match(self, internship: Dict[str, Any], user_profile: Dict[str, Any]) -> float:
        """Score technical skills match."""
        internship_techs = [tech.lower() for tech in internship.get("required_skills", [])]
        user_languages = [lang.lower() for lang in user_profile.get("programming_languages", [])]
        user_tech_stack = [tech.lower() for tech in user_profile.get("preferred_tech_stack", [])]
        resume_skills = [skill.lower() for skill in user_profile.get("resume_technical_skills", [])]
        
        all_user_skills = set(user_languages + user_tech_stack + resume_skills)
        
        if not internship_techs or not all_user_skills:
            return 0.5  # Neutral if no data
        
        # Calculate overlap
        matching_skills = sum(1 for tech in internship_techs if any(skill in tech or tech in skill for skill in all_user_skills))
        
        return min(matching_skills / len(internship_techs), 1.0)
    
    def _score_location_match(self, internship: Dict[str, Any], user_profile: Dict[str, Any]) -> float:
        """Score location preferences match."""
        internship_location = internship.get("location", "").lower()
        preferred_locations = [loc.lower() for loc in user_profile.get("preferred_locations", [])]
        
        if not preferred_locations:
            return 0.5  # Neutral if no preference
        
        # Check for matches
        for preferred in preferred_locations:
            if preferred in internship_location or internship_location in preferred:
                return 1.0
            
            # Check for city/state matches
            if any(word in internship_location for word in preferred.split() if len(word) > 2):
                return 0.8
        
        # Remote work preference
        if "remote" in preferred_locations and internship.get("remote_friendly", False):
            return 1.0
        
        return 0.3  # Low score for location mismatch
    
    def _score_company_match(self, internship: Dict[str, Any], user_profile: Dict[str, Any]) -> float:
        """Score company type preferences match."""
        company_type = internship.get("company_type", "").lower()
        preferred_types = [ct.lower() for ct in user_profile.get("preferred_company_types", [])]
        
        if not preferred_types:
            return 0.5  # Neutral if no preference
        
        for preferred in preferred_types:
            if preferred in company_type or company_type in preferred:
                return 1.0
        
        return 0.3  # Low score for mismatch
    
    def _score_experience_match(self, internship: Dict[str, Any], user_profile: Dict[str, Any]) -> float:
        """Score experience level match."""
        required_level = internship.get("experience_level", "").lower()
        user_level = user_profile.get("experience_level", "").lower()
        
        level_hierarchy = {
            "beginner": 1,
            "intermediate": 2,
            "advanced": 3
        }
        
        required_score = level_hierarchy.get(required_level, 1)
        user_score = level_hierarchy.get(user_level, 1)
        
        # Perfect match
        if required_score == user_score:
            return 1.0
        
        # User overqualified (still good)
        if user_score > required_score:
            return 0.9
        
        # User underqualified
        if user_score < required_score:
            return max(0.3, 1.0 - (required_score - user_score) * 0.3)
        
        return 0.5
    
    def _get_match_reasons(self, internship: Dict[str, Any], user_profile: Dict[str, Any]) -> List[str]:
        """Get reasons why this internship matches the user."""
        reasons = []
        
        # Role match
        internship_role = internship.get("role", "").lower()
        target_roles = [role.lower() for role in user_profile.get("target_roles", [])]
        for target_role in target_roles:
            if self._roles_match(internship_role, target_role):
                reasons.append(f"Matches your target role: {target_role.title()}")
                break
        
        # Tech skills match
        internship_techs = internship.get("required_skills", [])
        user_skills = (user_profile.get("programming_languages", []) + 
                      user_profile.get("preferred_tech_stack", []) +
                      user_profile.get("resume_technical_skills", []))
        
        matching_techs = []
        for tech in internship_techs:
            if any(skill.lower() in tech.lower() or tech.lower() in skill.lower() for skill in user_skills):
                matching_techs.append(tech)
        
        if matching_techs:
            reasons.append(f"Uses technologies you know: {', '.join(matching_techs[:3])}")
        
        # Location match
        internship_location = internship.get("location", "")
        preferred_locations = user_profile.get("preferred_locations", [])
        for preferred in preferred_locations:
            if preferred.lower() in internship_location.lower():
                reasons.append(f"Located in your preferred area: {internship_location}")
                break
        
        # Company type match
        company_type = internship.get("company_type", "")
        preferred_types = user_profile.get("preferred_company_types", [])
        for preferred in preferred_types:
            if preferred.lower() in company_type.lower():
                reasons.append(f"Matches your preferred company type: {company_type}")
                break
        
        return reasons[:4]  # Limit to top 4 reasons
    
    def _get_recommendation_criteria(self, onboarding_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get the criteria used for recommendations."""
        return {
            "target_roles": onboarding_data.get("target_roles", []),
            "preferred_locations": onboarding_data.get("preferred_locations", []),
            "preferred_company_types": onboarding_data.get("preferred_company_types", []),
            "experience_level": onboarding_data.get("experience_level", ""),
            "tech_preferences": onboarding_data.get("preferred_tech_stack", [])
        }
    
    def _get_mock_internship_data(self) -> List[Dict[str, Any]]:
        """Get mock internship data for recommendations."""
        return [
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
                "description": "STEP (Student Training in Engineering Program) is a 12-week internship for first and second-year undergraduate students with a passion for computer science.",
                "requirements_min": ["Currently enrolled in a BA/BS program", "Completed foundational courses in computer science"],
                "remote_friendly": False,
                "stipend_range": "$8000-10000/month",
                "website": "https://careers.google.com/jobs/results/?q=STEP"
            },
            {
                "id": "microsoft_explore_2024",
                "company": "Microsoft",
                "role": "Software Engineer Intern (Explore)",
                "location": "Redmond, WA",
                "company_type": "Big Tech",
                "required_skills": ["C#", "Python", "JavaScript", "Azure"],
                "experience_level": "Beginner",
                "duration": "12 weeks",
                "application_deadline": "2024-11-15",
                "description": "Microsoft Explore is a 12-week summer internship program specifically designed for first and second year college students.",
                "requirements_min": ["Currently enrolled in first or second year of BA/BS program", "Interest in technology and programming"],
                "remote_friendly": True,
                "stipend_range": "$7500-9500/month",
                "website": "https://careers.microsoft.com/students/us/en/job/1368428"
            },
            {
                "id": "meta_university_2024",
                "company": "Meta",
                "role": "Software Engineer Intern (Meta University)",
                "location": "Menlo Park, CA",
                "company_type": "Big Tech",
                "required_skills": ["JavaScript", "React", "Python", "PHP"],
                "experience_level": "Beginner",
                "duration": "10 weeks",
                "application_deadline": "2024-12-15",
                "description": "Meta University is a paid 10-week training program designed to provide hands-on experience to students from underrepresented communities.",
                "requirements_min": ["Currently enrolled undergraduate", "From underrepresented community in tech"],
                "remote_friendly": False,
                "stipend_range": "$8500-10500/month",
                "website": "https://www.metacareers.com/jobs/"
            },
            {
                "id": "amazon_sde_intern_2024",
                "company": "Amazon",
                "role": "Software Development Engineer Intern",
                "location": "Seattle, WA",
                "company_type": "Big Tech",
                "required_skills": ["Java", "Python", "AWS", "Data Structures"],
                "experience_level": "Intermediate",
                "duration": "12-16 weeks",
                "application_deadline": "2024-10-31",
                "description": "Join Amazon's Software Development Engineer Internship program and work on projects that impact millions of customers.",
                "requirements_min": ["Currently enrolled in CS or related degree", "Strong programming fundamentals"],
                "remote_friendly": False,
                "stipend_range": "$7000-9000/month",
                "website": "https://www.amazon.jobs/en/job_categories/student-programs"
            },
            {
                "id": "netflix_intern_2024",
                "company": "Netflix",
                "role": "Software Engineer Intern",
                "location": "Los Gatos, CA",
                "company_type": "Big Tech",
                "required_skills": ["Java", "Scala", "Python", "Microservices"],
                "experience_level": "Intermediate",
                "duration": "12 weeks",
                "application_deadline": "2024-11-30",
                "description": "Netflix internship program offers hands-on experience building systems that serve 200+ million members worldwide.",
                "requirements_min": ["Pursuing BS/MS in CS or related field", "Strong coding skills"],
                "remote_friendly": True,
                "stipend_range": "$9000-11000/month",
                "website": "https://jobs.netflix.com/students-and-grads"
            },
            {
                "id": "spotify_intern_2024",
                "company": "Spotify",
                "role": "Backend Engineer Intern",
                "location": "New York, NY",
                "company_type": "Big Tech",
                "required_skills": ["Java", "Python", "Kubernetes", "APIs"],
                "experience_level": "Intermediate",
                "duration": "12 weeks",
                "application_deadline": "2024-12-10",
                "description": "Help build the backend systems that power music discovery for millions of users worldwide.",
                "requirements_min": ["Currently enrolled in Computer Science program", "Experience with backend development"],
                "remote_friendly": True,
                "stipend_range": "$8000-10000/month",
                "website": "https://www.lifeatspotify.com/jobs"
            },
            {
                "id": "airbnb_intern_2024",
                "company": "Airbnb",
                "role": "Software Engineer Intern",
                "location": "San Francisco, CA",
                "company_type": "Big Tech",
                "required_skills": ["React", "Node.js", "Python", "Ruby"],
                "experience_level": "Intermediate",
                "duration": "12 weeks",
                "application_deadline": "2024-11-20",
                "description": "Work on products that help create a world where anyone can belong anywhere.",
                "requirements_min": ["Enrolled in Computer Science or related program", "Full-stack development experience"],
                "remote_friendly": False,
                "stipend_range": "$8500-10500/month",
                "website": "https://careers.airbnb.com/university/"
            },
            {
                "id": "stripe_intern_2024",
                "company": "Stripe",
                "role": "Software Engineer Intern",
                "location": "San Francisco, CA",
                "company_type": "Startup",
                "required_skills": ["Ruby", "JavaScript", "Python", "APIs"],
                "experience_level": "Intermediate",
                "duration": "12 weeks",
                "application_deadline": "2024-12-05",
                "description": "Build the infrastructure that powers internet commerce at Stripe.",
                "requirements_min": ["Currently pursuing a degree in Computer Science", "Strong programming skills"],
                "remote_friendly": True,
                "stipend_range": "$9000-11000/month",
                "website": "https://stripe.com/jobs/university"
            },
            {
                "id": "tesla_intern_2024",
                "company": "Tesla",
                "role": "Software Engineer Intern",
                "location": "Palo Alto, CA",
                "company_type": "Big Tech",
                "required_skills": ["Python", "C++", "Machine Learning", "Embedded Systems"],
                "experience_level": "Intermediate",
                "duration": "12 weeks",
                "application_deadline": "2024-11-25",
                "description": "Accelerate the world's transition to sustainable energy through software innovation.",
                "requirements_min": ["Pursuing degree in Computer Science or Engineering", "Interest in automotive/energy tech"],
                "remote_friendly": False,
                "stipend_range": "$7500-9500/month",
                "website": "https://www.tesla.com/careers/university"
            },
            {
                "id": "palantir_intern_2024",
                "company": "Palantir",
                "role": "Software Engineer Intern",
                "location": "Denver, CO",
                "company_type": "Big Tech",
                "required_skills": ["Java", "Python", "TypeScript", "Data Analysis"],
                "experience_level": "Advanced",
                "duration": "10-12 weeks",
                "application_deadline": "2024-10-15",
                "description": "Build software that solves the world's most important problems.",
                "requirements_min": ["Strong academic record in CS or related field", "Excellent problem-solving skills"],
                "remote_friendly": False,
                "stipend_range": "$8000-10000/month",
                "website": "https://www.palantir.com/careers/students/"
            }
        ] 