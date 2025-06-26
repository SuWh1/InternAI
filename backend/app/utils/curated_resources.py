"""
Curated learning resources with validated URLs for reliable learning content.
Enhanced with freeCodeCamp video integration and practical resources.
"""

from typing import Dict, List, Any
import aiohttp
import asyncio
import logging

logger = logging.getLogger(__name__)

# freeCodeCamp YouTube video database (verified working URLs)
FREECODECAMP_VIDEOS = {
    "javascript": [
        {"title": "JavaScript Full Course", "url": "https://www.youtube.com/watch?v=PkZNo7MFNFg", "duration": "3h 26m"},
        {"title": "JavaScript DOM Manipulation", "url": "https://www.youtube.com/watch?v=5fb2aPlgoys", "duration": "1h 14m"},
        {"title": "JavaScript Algorithms and Data Structures", "url": "https://www.youtube.com/watch?v=t2CEgPsws3U", "duration": "5h"}
    ],
    "python": [
        {"title": "Python for Beginners - Full Course", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "duration": "4h 26m"},
        {"title": "Python Django Full Course", "url": "https://www.youtube.com/watch?v=F5mRW0jo-U4", "duration": "1h 43m"},
        {"title": "Machine Learning with Python", "url": "https://www.youtube.com/watch?v=i_LwzRVP7bg", "duration": "4h 20m"}
    ],
    "react": [
        {"title": "React Course - Beginner's Tutorial", "url": "https://www.youtube.com/watch?v=bMknfKXIFA8", "duration": "5h 25m"},
        {"title": "React and Firebase Full Course", "url": "https://www.youtube.com/watch?v=PKwu15ldZ7k", "duration": "3h 15m"},
        {"title": "React Hooks Course", "url": "https://www.youtube.com/watch?v=iVRO0toVdYM", "duration": "2h 17m"}
    ],
    "nodejs": [
        {"title": "Node.js and Express.js Full Course", "url": "https://www.youtube.com/watch?v=Oe421EPjeBE", "duration": "8h 16m"},
        {"title": "Node.js Crash Course", "url": "https://www.youtube.com/watch?v=fBNz5xF-Kx4", "duration": "1h 30m"},
        {"title": "RESTful APIs with Node.js", "url": "https://www.youtube.com/watch?v=0oXYLzuucwE", "duration": "2h 28m"}
    ],
    "git": [
        {"title": "Git and GitHub for Beginners", "url": "https://www.youtube.com/watch?v=RGOj5yH7evk", "duration": "1h 8m"},
        {"title": "Git Tutorial for Beginners", "url": "https://www.youtube.com/watch?v=8JJ101D3knE", "duration": "1h 21m"}
    ],
    "algorithms": [
        {"title": "Algorithms and Data Structures", "url": "https://www.youtube.com/watch?v=8hly31xKli0", "duration": "5h"},
        {"title": "Dynamic Programming - Learn to Solve Problems", "url": "https://www.youtube.com/watch?v=oBt53YbR9Kk", "duration": "5h 18m"}
    ],
    "datastructures": [
        {"title": "Data Structures Full Course", "url": "https://www.youtube.com/watch?v=RBSGKlAvoiM", "duration": "8h 18m"},
        {"title": "Data Structures and Algorithms in Python", "url": "https://www.youtube.com/watch?v=pkYVOmU96Uk", "duration": "13h"}
    ],
    "webdevelopment": [
        {"title": "HTML CSS JavaScript Full Course", "url": "https://www.youtube.com/watch?v=mU6anWqZJcc", "duration": "4h 30m"},
        {"title": "Full Stack Web Development Course", "url": "https://www.youtube.com/watch?v=nu_pCVPKzTk", "duration": "7h"},
        {"title": "Responsive Web Design Course", "url": "https://www.youtube.com/watch?v=srvUrASNdxk", "duration": "4h 18m"}
    ],
    "sql": [
        {"title": "SQL Tutorial - Full Database Course", "url": "https://www.youtube.com/watch?v=HXV3zeQKqGY", "duration": "4h 20m"},
        {"title": "MySQL Database Tutorial", "url": "https://www.youtube.com/watch?v=7S_tz1z_5bA", "duration": "3h 10m"}
    ],
    "systemdesign": [
        {"title": "System Design Course", "url": "https://www.youtube.com/watch?v=MbjObHmDbZo", "duration": "4h"},
        {"title": "System Design Fundamentals", "url": "https://www.youtube.com/watch?v=SqcXvc3ZmRU", "duration": "1h 53m"}
    ],
    "java": [
        {"title": "Java Tutorial for Beginners", "url": "https://www.youtube.com/watch?v=eIrMbAQSU34", "duration": "9h"},
        {"title": "Java Full Course", "url": "https://www.youtube.com/watch?v=xk4_1vDrzzo", "duration": "12h 18m"}
    ]
}

# Enhanced curated resources with practical focus
CURATED_RESOURCES = {
    "javascript": [
        {"title": "MDN JavaScript Guide - Complete Reference", "link": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", "type": "documentation", "practical_focus": "Essential for daily JS development"},
        {"title": "JavaScript.info - Modern Tutorial with Examples", "link": "https://javascript.info/", "type": "tutorial", "practical_focus": "Step-by-step with real code examples"},
        {"title": "FreeCodeCamp JavaScript Certification", "link": "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", "type": "course", "practical_focus": "Hands-on projects and certifications"}
    ],
    "python": [
        {"title": "Official Python Tutorial", "link": "https://docs.python.org/3/tutorial/", "type": "documentation", "practical_focus": "Direct from Python creators"},
        {"title": "Real Python - Industry-Focused Tutorials", "link": "https://realpython.com/", "type": "tutorial", "practical_focus": "Professional Python development"},
        {"title": "Automate the Boring Stuff", "link": "https://automatetheboringstuff.com/", "type": "book", "practical_focus": "Real-world automation projects"}
    ],
    "react": [
        {"title": "Official React Documentation", "link": "https://react.dev/", "type": "documentation", "practical_focus": "Latest React patterns and hooks"},
        {"title": "React DevTools Guide", "link": "https://react.dev/learn/react-developer-tools", "type": "tool", "practical_focus": "Essential debugging skills"},
        {"title": "React Tutorial - Build Production Apps", "link": "https://react.dev/learn", "type": "tutorial", "practical_focus": "Industry-standard development patterns"}
    ],
    "nodejs": [
        {"title": "Official Node.js Documentation", "link": "https://nodejs.org/en/docs/", "type": "documentation", "practical_focus": "Server-side JavaScript mastery"},
        {"title": "Express.js Official Guide", "link": "https://expressjs.com/en/guide/routing.html", "type": "framework", "practical_focus": "Most popular Node.js framework"},
        {"title": "Node.js Best Practices", "link": "https://github.com/goldbergyoni/nodebestpractices", "type": "guide", "practical_focus": "Production-ready coding standards"}
    ],
    "git": [
        {"title": "Official Git Documentation", "link": "https://git-scm.com/doc", "type": "documentation", "practical_focus": "Version control mastery"},
        {"title": "Interactive Git Tutorial", "link": "https://learngitbranching.js.org/", "type": "interactive", "practical_focus": "Visual learning with hands-on practice"},
        {"title": "GitHub Skills", "link": "https://skills.github.com/", "type": "course", "practical_focus": "Professional Git workflows"}
    ],
    "algorithms": [
        {"title": "LeetCode Practice Problems", "link": "https://leetcode.com/problemset/all/", "type": "practice", "practical_focus": "Interview preparation coding challenges"},
        {"title": "HackerRank Algorithm Challenges", "link": "https://www.hackerrank.com/domains/algorithms", "type": "practice", "practical_focus": "Company-specific coding assessments"},
        {"title": "Algorithm Visualizer", "link": "https://algorithm-visualizer.org/", "type": "tool", "practical_focus": "Visual understanding of complex algorithms"}
    ],
    "datastructures": [
        {"title": "VisuAlgo - Data Structure Visualizations", "link": "https://visualgo.net/en", "type": "interactive", "practical_focus": "Interactive algorithm visualization"},
        {"title": "GeeksforGeeks Data Structures", "link": "https://www.geeksforgeeks.org/data-structures/", "type": "tutorial", "practical_focus": "Interview-focused implementations"},
        {"title": "Data Structure Practice Problems", "link": "https://www.hackerrank.com/domains/data-structures", "type": "practice", "practical_focus": "Coding interview preparation"}
    ],
    "webdevelopment": [
        {"title": "MDN Web Docs - Complete Web Reference", "link": "https://developer.mozilla.org/en-US/docs/Web", "type": "documentation", "practical_focus": "Comprehensive web development guide"},
        {"title": "Web.dev by Google", "link": "https://web.dev/", "type": "guide", "practical_focus": "Modern web performance and best practices"},
        {"title": "FreeCodeCamp Web Development", "link": "https://www.freecodecamp.org/learn/", "type": "course", "practical_focus": "Full-stack development projects"}
    ],
    "sql": [
        {"title": "SQLBolt Interactive Lessons", "link": "https://sqlbolt.com/", "type": "interactive", "practical_focus": "Hands-on SQL practice"},
        {"title": "W3Schools SQL Tutorial", "link": "https://www.w3schools.com/sql/", "type": "tutorial", "practical_focus": "Quick reference and examples"},
        {"title": "PostgreSQL Tutorial", "link": "https://www.postgresqltutorial.com/", "type": "tutorial", "practical_focus": "Production database skills"}
    ],
    "systemdesign": [
        {"title": "System Design Primer", "link": "https://github.com/donnemartin/system-design-primer", "type": "guide", "practical_focus": "Interview preparation and real-world systems"},
        {"title": "High Scalability", "link": "http://highscalability.com/", "type": "blog", "practical_focus": "Real-world system architecture case studies"},
        {"title": "AWS Architecture Center", "link": "https://aws.amazon.com/architecture/", "type": "documentation", "practical_focus": "Cloud architecture patterns"}
    ]
}

# Fallback resources for topics not in curated list
DEFAULT_FALLBACK_RESOURCES = [
    {"title": "Stack Overflow Community", "link": "https://stackoverflow.com/", "type": "community"},
    {"title": "GitHub Repositories", "link": "https://github.com/", "type": "code"},
    {"title": "YouTube Educational Content", "link": "https://www.youtube.com/", "type": "video"}
]

def get_curated_resources(topic: str) -> List[Dict[str, str]]:
    """Get curated resources for a topic."""
    # Normalize topic name
    topic_key = topic.lower().replace(" ", "").replace("-", "").replace("_", "")
    
    # Check for exact match
    if topic_key in CURATED_RESOURCES:
        return CURATED_RESOURCES[topic_key].copy()
    
    # Check for partial matches
    for key, resources in CURATED_RESOURCES.items():
        if key in topic_key or topic_key in key:
            return resources.copy()
    
    # Return default fallback
    return DEFAULT_FALLBACK_RESOURCES.copy()

async def validate_url(url: str, timeout: int = 5) -> bool:
    """Validate if a URL is accessible."""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.head(url, timeout=timeout) as response:
                return response.status == 200
    except Exception as e:
        logger.warning(f"URL validation failed for {url}: {str(e)}")
        return False

async def validate_and_fix_resources(topic: str, ai_resources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Validate AI-generated resources and replace invalid ones with curated resources.
    
    Args:
        topic: The topic these resources are for
        ai_resources: List of resources generated by AI
        
    Returns:
        List of validated resources (mix of valid AI resources + curated fallbacks)
    """
    validated = []
    curated = get_curated_resources(topic)
    
    # Quick validation of AI resources (with timeout to avoid blocking)
    for resource in ai_resources[:3]:  # Limit to first 3 AI resources
        if isinstance(resource, dict) and 'link' in resource:
            try:
                # Quick check - if URL looks reasonable, accept it
                url = resource['link']
                if url.startswith('https://') and any(domain in url for domain in [
                    'github.com', 'stackoverflow.com', 'mozilla.org', 'w3schools.com',
                    'freecodecamp.org', 'docs.python.org', 'reactjs.org', 'react.dev',
                    'nodejs.org', 'developer.mozilla.org', 'geeksforgeeks.org'
                ]):
                    validated.append(resource)
                elif curated:
                    # Replace suspicious URL with curated resource
                    validated.append(curated.pop(0))
            except Exception:
                # If any error, use curated resource
                if curated:
                    validated.append(curated.pop(0))
        elif curated:
            # Invalid resource format, use curated
            validated.append(curated.pop(0))
    
    # Fill remaining slots with curated resources if needed
    while len(validated) < 3 and curated:
        validated.append(curated.pop(0))
    
    # Ensure we have at least 3 resources
    if len(validated) < 3:
        remaining_needed = 3 - len(validated)
        validated.extend(DEFAULT_FALLBACK_RESOURCES[:remaining_needed])
    
    return validated[:3]  # Return exactly 3 resources

def get_topic_suggestions(topic: str) -> List[str]:
    """Get related topic suggestions based on curated resources."""
    topic_lower = topic.lower()
    suggestions = []
    
    # Find related topics
    if "web" in topic_lower or "html" in topic_lower or "css" in topic_lower:
        suggestions.extend(["javascript", "react", "nodejs"])
    elif "python" in topic_lower:
        suggestions.extend(["algorithms", "datastructures", "sql"])
    elif "algorithm" in topic_lower or "coding" in topic_lower:
        suggestions.extend(["datastructures", "python", "javascript"])
    elif "data" in topic_lower:
        suggestions.extend(["sql", "python", "algorithms"])
    
    return suggestions[:3]

def get_freecodecamp_videos(topic: str, limit: int = 2) -> List[Dict[str, str]]:
    """Get freeCodeCamp video resources for a specific topic."""
    topic_key = topic.lower().replace(" ", "").replace("-", "").replace("_", "")
    
    # Direct match
    if topic_key in FREECODECAMP_VIDEOS:
        return FREECODECAMP_VIDEOS[topic_key][:limit]
    
    # Partial matches
    for key, videos in FREECODECAMP_VIDEOS.items():
        if key in topic_key or topic_key in key:
            return videos[:limit]
    
    # Related topics
    related_videos = []
    if "web" in topic_key:
        related_videos.extend(FREECODECAMP_VIDEOS.get("webdevelopment", [])[:1])
        related_videos.extend(FREECODECAMP_VIDEOS.get("javascript", [])[:1])
    elif "data" in topic_key:
        related_videos.extend(FREECODECAMP_VIDEOS.get("datastructures", [])[:1])
        related_videos.extend(FREECODECAMP_VIDEOS.get("algorithms", [])[:1])
    
    return related_videos[:limit]

def build_comprehensive_resources(topic: str, user_tech_stack: List[str] = None) -> Dict[str, List[Dict[str, Any]]]:
    """Build comprehensive resource package including curated resources and freeCodeCamp videos."""
    
    # Get curated resources
    curated = get_curated_resources(topic)
    
    # Get freeCodeCamp videos
    videos = get_freecodecamp_videos(topic, limit=2)
    
    # Add tech stack specific resources
    tech_specific = []
    if user_tech_stack:
        for tech in user_tech_stack:
            tech_resources = get_curated_resources(tech)
            if tech_resources and tech_resources != curated:
                tech_specific.extend(tech_resources[:1])
    
    return {
        "primary_resources": curated[:3],
        "freecodecamp_videos": videos,
        "tech_stack_resources": tech_specific[:2],
        "total_resources": len(curated) + len(videos) + len(tech_specific)
    } 