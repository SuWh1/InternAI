"""
Resume Agent - Extracts and summarizes resume information.
"""

import asyncio
from typing import Dict, Any, Optional, List
from .base_agent import BaseAgent, AgentResponse
import re

class ResumeAgent(BaseAgent):
    """Agent responsible for processing and summarizing resume data."""
    
    def __init__(self):
        super().__init__("ResumeAgent")
    
    async def run(self, input_data: Dict[str, Any]) -> AgentResponse:
        """
        Process resume data if available.
        
        Args:
            input_data: Dictionary containing:
                - resume_text: Optional raw resume text
                - resume_file_path: Optional path to resume file
                - onboarding_data: User's onboarding information
        
        Returns:
            AgentResponse with resume summary or indication that no resume is available
        """
        try:
            self.log_info("Starting resume processing")
            
            resume_text = input_data.get("resume_text")
            resume_file_path = input_data.get("resume_file_path")
            
            if not resume_text and not resume_file_path:
                self.log_info("No resume provided, skipping resume analysis")
                return self._create_response(
                    success=True,
                    data={
                        "has_resume": False,
                        "resume_summary": None,
                        "message": "No resume provided - will use onboarding data only"
                    }
                )
            
            # Process resume text
            if resume_file_path and not resume_text:
                resume_text = await self._read_resume_file(resume_file_path)
            
            if not resume_text:
                return self._create_response(
                    success=False,
                    error="Failed to read resume content"
                )
            
            # Extract resume information
            resume_summary = await self._extract_resume_info(resume_text)
            
            self.log_info("Resume processing completed successfully")
            
            return self._create_response(
                success=True,
                data={
                    "has_resume": True,
                    "resume_summary": resume_summary
                }
            )
            
        except Exception as e:
            self.log_error(f"Error processing resume: {str(e)}")
            return self._create_response(
                success=False,
                error=f"Resume processing failed: {str(e)}"
            )
    
    async def _read_resume_file(self, file_path: str) -> Optional[str]:
        """Read resume file content (placeholder for file reading logic)."""
        # TODO: Implement actual file reading logic for PDF, DOCX, etc.
        # For now, return None to simulate no file content
        self.log_info(f"File reading not implemented yet for: {file_path}")
        return None
    
    async def _extract_resume_info(self, resume_text: str) -> Dict[str, Any]:
        """
        Extract structured information from resume text.
        
        This is a simplified extraction logic. In production, you might want to use:
        - NLP libraries for better text analysis
        - ML models for resume parsing
        - Third-party resume parsing APIs
        """
        
        # Extract technical skills
        technical_skills = self._extract_technical_skills(resume_text)
        
        # Extract work experience
        work_experience = self._extract_work_experience(resume_text)
        
        # Extract education
        education = self._extract_education(resume_text)
        
        # Extract projects
        projects = self._extract_projects(resume_text)
        
        return {
            "technical_skills": technical_skills,
            "work_experience": work_experience,
            "education": education,
            "projects": projects,
            "resume_length": len(resume_text.split()),
            "extraction_confidence": "medium"  # Placeholder confidence score
        }
    
    def _extract_technical_skills(self, text: str) -> List[str]:
        """Extract technical skills from resume text."""
        # Common programming languages and technologies
        tech_keywords = [
            "Python", "JavaScript", "Java", "C++", "C#", "TypeScript", "Go", "Rust",
            "React", "Vue", "Angular", "Node.js", "Express", "Django", "Flask",
            "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker", "Kubernetes",
            "AWS", "Azure", "GCP", "Git", "Linux", "API", "REST", "GraphQL",
            "Machine Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy"
        ]
        
        found_skills = []
        text_lower = text.lower()
        
        for skill in tech_keywords:
            if skill.lower() in text_lower:
                found_skills.append(skill)
        
        return found_skills
    
    def _extract_work_experience(self, text: str) -> List[Dict[str, str]]:
        """Extract work experience from resume text."""
        # Simple regex patterns for common experience sections
        experience_patterns = [
            r"(intern|internship|engineer|developer|analyst|assistant).*?(\d{4}|\d{1,2}/\d{4})",
            r"(software|web|data|mobile|full.?stack).*?(intern|engineer|developer)",
        ]
        
        experiences = []
        for pattern in experience_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                experiences.append({
                    "position": match.group(0),
                    "context": text[max(0, match.start()-50):match.end()+50]
                })
        
        return experiences[:5]  # Limit to 5 most relevant matches
    
    def _extract_education(self, text: str) -> List[Dict[str, str]]:
        """Extract education information from resume text."""
        education_keywords = [
            "bachelor", "master", "phd", "degree", "university", "college",
            "computer science", "engineering", "mathematics", "physics"
        ]
        
        education_info = []
        text_lower = text.lower()
        
        for keyword in education_keywords:
            if keyword in text_lower:
                # Find context around the keyword
                start_idx = text_lower.find(keyword)
                context = text[max(0, start_idx-30):start_idx+100]
                education_info.append({
                    "keyword": keyword,
                    "context": context.strip()
                })
        
        return education_info[:3]  # Limit results
    
    def _extract_projects(self, text: str) -> List[Dict[str, str]]:
        """Extract project information from resume text."""
        project_indicators = [
            "project", "built", "developed", "created", "implemented", "designed"
        ]
        
        projects = []
        sentences = text.split('.')
        
        for sentence in sentences:
            sentence_lower = sentence.lower()
            for indicator in project_indicators:
                if indicator in sentence_lower and len(sentence.strip()) > 20:
                    projects.append({
                        "description": sentence.strip(),
                        "indicator": indicator
                    })
                    break
        
        return projects[:5]  # Limit to 5 most relevant project descriptions 