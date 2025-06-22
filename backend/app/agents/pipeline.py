"""
Agent Pipeline - Orchestrates the execution of all agents in the multi-agent system.
"""

from typing import Dict, Any, Optional
from .base_agent import AgentResponse
from .resume_agent import ResumeAgent
from .roadmap_agent import RoadmapAgent
from .recommendation_agent import RecommendationAgent
import logging
import time

logger = logging.getLogger(__name__)

class AgentPipeline:
    """Orchestrates the execution of the multi-agent internship preparation pipeline."""
    
    def __init__(self):
        self.resume_agent = ResumeAgent()
        self.roadmap_agent = RoadmapAgent()
        self.recommendation_agent = RecommendationAgent()
        self.logger = logging.getLogger("agents.pipeline")
    
    async def run_pipeline(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the complete agent pipeline.
        
        Args:
            input_data: Dictionary containing:
                - onboarding_data: User's onboarding information (required)
                - resume_text: Optional raw resume text
                - resume_file_path: Optional path to resume file
        
        Returns:
            Dictionary containing results from all agents
        """
        pipeline_results = {
            "resume_analysis": None,
            "roadmap": None,
            "recommendations": None,
            "pipeline_summary": {
                "success": False,
                "total_agents_executed": 0,
                "successful_agents": 0,
                "failed_agents": [],
                "execution_time": None
            }
        }
        
        start_time = time.time()
        
        try:
            self.logger.info("Starting agent pipeline execution")
            
            # Validate input
            if not input_data.get("onboarding_data"):
                raise ValueError("Onboarding data is required for pipeline execution")
            
            # Step 1: Resume Agent
            self.logger.info("Executing ResumeAgent...")
            resume_response = await self.resume_agent.run(input_data)
            pipeline_results["resume_analysis"] = resume_response
            pipeline_results["pipeline_summary"]["total_agents_executed"] += 1
            
            if resume_response.success:
                pipeline_results["pipeline_summary"]["successful_agents"] += 1
                self.logger.info("ResumeAgent completed successfully")
            else:
                pipeline_results["pipeline_summary"]["failed_agents"].append("ResumeAgent")
                self.logger.warning(f"ResumeAgent failed: {resume_response.error}")
            
            # Step 2: Roadmap Agent
            self.logger.info("Executing RoadmapAgent...")
            roadmap_input = {
                "onboarding_data": input_data["onboarding_data"],
                "resume_summary": resume_response.data.get("resume_summary") if resume_response.success else None
            }
            
            roadmap_response = await self.roadmap_agent.run(roadmap_input)
            pipeline_results["roadmap"] = roadmap_response
            pipeline_results["pipeline_summary"]["total_agents_executed"] += 1
            
            if roadmap_response.success:
                pipeline_results["pipeline_summary"]["successful_agents"] += 1
                self.logger.info("RoadmapAgent completed successfully")
            else:
                pipeline_results["pipeline_summary"]["failed_agents"].append("RoadmapAgent")
                self.logger.warning(f"RoadmapAgent failed: {roadmap_response.error}")
            
            # Step 3: Recommendation Agent
            self.logger.info("Executing RecommendationAgent...")
            recommendation_input = {
                "onboarding_data": input_data["onboarding_data"],
                "resume_summary": resume_response.data.get("resume_summary") if resume_response.success else None,
                "roadmap": roadmap_response.data.get("roadmap") if roadmap_response.success else None
            }
            
            recommendation_response = await self.recommendation_agent.run(recommendation_input)
            pipeline_results["recommendations"] = recommendation_response
            pipeline_results["pipeline_summary"]["total_agents_executed"] += 1
            
            if recommendation_response.success:
                pipeline_results["pipeline_summary"]["successful_agents"] += 1
                self.logger.info("RecommendationAgent completed successfully")
            else:
                pipeline_results["pipeline_summary"]["failed_agents"].append("RecommendationAgent")
                self.logger.warning(f"RecommendationAgent failed: {recommendation_response.error}")
            
            # Calculate execution time
            end_time = time.time()
            execution_time = end_time - start_time
            pipeline_results["pipeline_summary"]["execution_time"] = f"{execution_time:.2f}s"
            
            # Determine overall success
            successful_count = pipeline_results["pipeline_summary"]["successful_agents"]
            total_count = pipeline_results["pipeline_summary"]["total_agents_executed"]
            
            if successful_count == total_count:
                pipeline_results["pipeline_summary"]["success"] = True
                self.logger.info(f"Pipeline completed successfully - all {total_count} agents succeeded")
            elif successful_count > 0:
                pipeline_results["pipeline_summary"]["success"] = True  # Partial success
                self.logger.info(f"Pipeline completed with partial success - {successful_count}/{total_count} agents succeeded")
            else:
                pipeline_results["pipeline_summary"]["success"] = False
                self.logger.error("Pipeline failed - no agents succeeded")
            
            return pipeline_results
            
        except Exception as e:
            end_time = time.time()
            execution_time = end_time - start_time
            
            self.logger.error(f"Pipeline execution failed: {str(e)}")
            
            pipeline_results["pipeline_summary"].update({
                "success": False,
                "execution_time": f"{execution_time:.2f}s",
                "error": str(e)
            })
            
            return pipeline_results
    
    def create_unified_response(self, pipeline_results: Dict[str, Any]) -> Dict[str, Any]:
        """Create a unified response combining results from all agents."""
        unified_response = {
            "success": pipeline_results["pipeline_summary"]["success"],
            "pipeline_summary": pipeline_results["pipeline_summary"],
            "data": {}
        }
        
        # Extract resume analysis
        resume_analysis = pipeline_results.get("resume_analysis")
        if resume_analysis and resume_analysis.success:
            unified_response["data"]["resume_summary"] = resume_analysis.data.get("resume_summary")
            unified_response["data"]["has_resume"] = resume_analysis.data.get("has_resume", False)
        else:
            unified_response["data"]["has_resume"] = False
            unified_response["data"]["resume_summary"] = None
        
        # Extract roadmap
        roadmap_analysis = pipeline_results.get("roadmap")
        if roadmap_analysis and roadmap_analysis.success:
            unified_response["data"]["roadmap"] = roadmap_analysis.data.get("roadmap")
            unified_response["data"]["personalization_factors"] = roadmap_analysis.data.get("personalization_factors")
        else:
            unified_response["data"]["roadmap"] = None
            unified_response["data"]["personalization_factors"] = None
        
        # Extract recommendations
        recommendation_analysis = pipeline_results.get("recommendations")
        if recommendation_analysis and recommendation_analysis.success:
            unified_response["data"]["internship_recommendations"] = recommendation_analysis.data.get("recommendations")
            unified_response["data"]["recommendation_criteria"] = recommendation_analysis.data.get("recommendation_criteria")
        else:
            unified_response["data"]["internship_recommendations"] = []
            unified_response["data"]["recommendation_criteria"] = None
        
        # Add summary statistics
        unified_response["data"]["summary"] = self._create_summary_statistics(unified_response["data"])
        
        return unified_response
    
    def _create_summary_statistics(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create summary statistics from the pipeline results."""
        
        summary = {
            "has_resume": data.get("has_resume", False),
            "roadmap_weeks": 0,
            "recommended_internships": 0,
            "top_focus_areas": [],
            "estimated_weekly_hours": 0
        }
        
        # Roadmap statistics
        roadmap = data.get("roadmap")
        if roadmap and roadmap.get("weeks"):
            summary["roadmap_weeks"] = len(roadmap["weeks"])
            
            # Calculate average weekly hours
            total_hours = sum(week.get("estimated_hours", 0) for week in roadmap["weeks"])
            summary["estimated_weekly_hours"] = round(total_hours / len(roadmap["weeks"]), 1) if roadmap["weeks"] else 0
            
            # Extract top focus areas
            personalization_factors = data.get("personalization_factors", {})
            summary["top_focus_areas"] = personalization_factors.get("focus_areas", [])[:3]
        
        # Recommendation statistics
        recommendations = data.get("internship_recommendations", [])
        summary["recommended_internships"] = len(recommendations)
        
        return summary 