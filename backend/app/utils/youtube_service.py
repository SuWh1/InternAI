"""YouTube API service for fetching popular educational videos.

SETUP INSTRUCTIONS:
1. Go to Google Cloud Console (https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the YouTube Data API v3
4. Create credentials (API Key)
5. Add the API key to your environment: YOUTUBE_API_KEY=your-key-here

FEATURES:
- Fetches popular programming tutorials from YouTube
- Filters for educational content only
- Provides fallback curated videos if API is unavailable
- Smart search queries based on topic and context
- Video metadata including views, duration, thumbnails
- Quota management and circuit breaker pattern
- Graceful degradation when quota is exceeded

FALLBACK: If no API key is configured or quota is exceeded, returns curated video search URLs
from high-quality programming channels.
"""

import os
import logging
import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)


class YouTubeQuotaManager:
    """Manages YouTube API quota usage and implements circuit breaker pattern."""
    
    def __init__(self):
        self.quota_exceeded = False
        self.quota_exceeded_time = None
        self.daily_requests = 0
        self.last_reset_date = datetime.now().date()
        self.max_daily_requests = 9000  # Conservative limit (YouTube allows 10,000)
        self.circuit_breaker_duration = 3600  # 1 hour in seconds
        
    def is_quota_available(self) -> bool:
        """Check if quota is available for making API requests."""
        # Reset daily counter if it's a new day
        current_date = datetime.now().date()
        if current_date > self.last_reset_date:
            self.daily_requests = 0
            self.last_reset_date = current_date
            self.quota_exceeded = False
            self.quota_exceeded_time = None
            
        # Check if circuit breaker should be reset
        if self.quota_exceeded and self.quota_exceeded_time:
            time_since_exceeded = time.time() - self.quota_exceeded_time
            if time_since_exceeded > self.circuit_breaker_duration:
                logger.info("YouTube API circuit breaker reset - attempting to restore service")
                self.quota_exceeded = False
                self.quota_exceeded_time = None
                
        # Check daily quota limit
        if self.daily_requests >= self.max_daily_requests:
            if not self.quota_exceeded:
                logger.warning(f"YouTube API daily quota limit reached ({self.daily_requests}/{self.max_daily_requests})")
                self.quota_exceeded = True
                self.quota_exceeded_time = time.time()
            return False
            
        return not self.quota_exceeded
    
    def record_request(self, cost: int = 100):
        """Record an API request with its quota cost."""
        self.daily_requests += cost
        
    def record_quota_exceeded(self):
        """Record that quota has been exceeded."""
        self.quota_exceeded = True
        self.quota_exceeded_time = time.time()
        logger.error(f"YouTube API quota exceeded. Circuit breaker activated for {self.circuit_breaker_duration} seconds")
        
    def get_status(self) -> Dict[str, Any]:
        """Get current quota status for debugging."""
        return {
            "quota_exceeded": self.quota_exceeded,
            "daily_requests": self.daily_requests,
            "max_daily_requests": self.max_daily_requests,
            "quota_available": self.is_quota_available(),
            "last_reset_date": self.last_reset_date.isoformat(),
            "circuit_breaker_active": self.quota_exceeded,
            "time_until_reset": self.circuit_breaker_duration - (time.time() - (self.quota_exceeded_time or 0)) if self.quota_exceeded_time else 0
        }


class YouTubeService:
    """Service for fetching popular YouTube videos related to programming topics."""
    
    def __init__(self):
        self.api_key = os.getenv("YOUTUBE_API_KEY")
        self.youtube = None
        self.quota_manager = YouTubeQuotaManager()
        
        if self.api_key:
            try:
                self.youtube = build('youtube', 'v3', developerKey=self.api_key)
                logger.info("YouTube API client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize YouTube API client: {str(e)}")
        else:
            logger.warning("YOUTUBE_API_KEY not configured - using fallback videos only")

    async def get_popular_videos(self, topic: str, context: str = "", max_results: int = 3) -> List[Dict[str, Any]]:
        """
        Get popular YouTube videos related to a programming topic with quota management.
        
        Args:
            topic: The main topic (e.g., "JavaScript Promises")
            context: Additional context (e.g., "Week 3: Async Programming")
            max_results: Number of videos to return (default: 3)
            
        Returns:
            List of video dictionaries with title, url, description, duration, view_count
        """
        
        # Check quota availability first
        if not self.quota_manager.is_quota_available():
            logger.info(f"YouTube API quota not available - using fallback videos for topic: {topic}")
            return self._get_fallback_videos(topic)
            
        # If no API client, use fallback
        if not self.youtube:
            logger.info(f"YouTube API not configured - using fallback videos for topic: {topic}")
            return self._get_fallback_videos(topic)
            
        try:
            # Create smart search queries
            search_queries = self._generate_search_queries(topic, context)
            
            videos = []
            seen_video_ids = set()  # Track video IDs to prevent duplicates
            
            for query in search_queries:
                try:
                    # Record the API request cost (search costs 100 quota units)
                    self.quota_manager.record_request(100)
                    
                    # Search for videos
                    search_response = self.youtube.search().list(
                        q=query,
                        part='id,snippet',
                        type='video',
                        order='relevance',  # Most relevant first
                        maxResults=min(max_results * 3, 15),  # Get more to filter better, but not too many
                        videoDuration='medium',  # 4-20 minutes (good for learning)
                        videoDefinition='high',
                        relevanceLanguage='en',
                        safeSearch='strict',
                        publishedAfter='2020-01-01T00:00:00Z'  # Only recent videos (last 4+ years)
                    ).execute()
                    
                    video_ids = [item['id']['videoId'] for item in search_response['items']]
                    
                    # Filter out already seen video IDs
                    new_video_ids = [vid_id for vid_id in video_ids if vid_id not in seen_video_ids]
                    
                    if new_video_ids:
                        # Record additional API request cost (videos.list costs 1 quota unit per video)
                        self.quota_manager.record_request(len(new_video_ids))
                        
                        # Get detailed video statistics
                        videos_response = self.youtube.videos().list(
                            part='snippet,statistics,contentDetails',
                            id=','.join(new_video_ids)
                        ).execute()
                        
                        for video in videos_response['items']:
                            video_id = video['id']
                            
                            # Skip if we've already processed this video
                            if video_id in seen_video_ids:
                                continue
                                
                            video_data = self._process_video_data(video)
                            if video_data and self._is_educational_video(video_data):
                                videos.append(video_data)
                                seen_video_ids.add(video_id)  # Mark as seen
                                
                        # If we found enough good videos, break
                        if len(videos) >= max_results:
                            break
                            
                except HttpError as e:
                    error_details = str(e)
                    
                    # Check for quota exceeded error specifically
                    if "quotaExceeded" in error_details or "quota" in error_details.lower():
                        logger.error(f"YouTube API quota exceeded: {error_details}")
                        self.quota_manager.record_quota_exceeded()
                        # Immediately return fallback videos
                        return self._get_fallback_videos(topic)
                    else:
                        logger.error(f"YouTube API error for query '{query}': {error_details}")
                        continue
            
            # Final deduplication by URL (just in case)
            unique_videos = []
            seen_urls = set()
            
            for video in videos:
                video_url = video.get('url', '')
                if video_url not in seen_urls:
                    unique_videos.append(video)
                    seen_urls.add(video_url)
            
            # Sort by relevance score and return top results
            unique_videos.sort(key=lambda x: x.get('relevance_score', 0), reverse=True)
            result = unique_videos[:max_results]
            
            # If we got very few results from API, supplement with fallback
            if len(result) < 2:
                logger.info(f"Got only {len(result)} videos from API, supplementing with fallback videos")
                fallback_videos = self._get_fallback_videos(topic)
                # Add fallback videos that aren't already in results
                existing_urls = {v.get('url', '') for v in result}
                for fallback_video in fallback_videos:
                    if fallback_video.get('url', '') not in existing_urls and len(result) < max_results:
                        result.append(fallback_video)
                        
            return result
            
        except Exception as e:
            logger.error(f"Error fetching YouTube videos: {str(e)}")
            return self._get_fallback_videos(topic)

    def get_quota_status(self) -> Dict[str, Any]:
        """Get current YouTube API quota status for debugging."""
        return self.quota_manager.get_status()

    def _generate_search_queries(self, topic: str, context: str) -> List[str]:
        """Generate smart search queries for the topic."""
        
        queries = []
        
        # Clean the topic for better search
        clean_topic = topic.replace("Week ", "").replace(":", "").strip()
        
        # Primary query - most specific
        queries.append(f'"{clean_topic}" tutorial programming')
        
        # Secondary queries for broader coverage
        queries.append(f'{clean_topic} explained programming')
        queries.append(f'learn {clean_topic} coding tutorial')
        queries.append(f'{clean_topic} beginner guide programming')
        
        # Topic-specific enhanced queries
        topic_lower = clean_topic.lower()
        if 'javascript' in topic_lower or 'js' in topic_lower:
            queries.insert(0, f'{clean_topic} javascript tutorial')
        elif 'python' in topic_lower:
            queries.insert(0, f'{clean_topic} python tutorial')
        elif 'react' in topic_lower:
            queries.insert(0, f'{clean_topic} react tutorial')
        elif 'git' in topic_lower:
            queries.insert(0, f'{clean_topic} git tutorial')
        
        return queries[:3]  # Limit to 3 best queries

    def _process_video_data(self, video: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Process raw YouTube video data into our format."""
        
        try:
            snippet = video['snippet']
            statistics = video.get('statistics', {})
            content_details = video.get('contentDetails', {})
            
            # Calculate relevance score
            view_count = int(statistics.get('viewCount', 0))
            like_count = int(statistics.get('likeCount', 0))
            comment_count = int(statistics.get('commentCount', 0))
            
            # Simple relevance scoring
            relevance_score = (
                min(view_count / 1000, 1000) +  # Normalize views (cap at 1M)
                min(like_count / 100, 100) +    # Normalize likes  
                min(comment_count / 10, 50)     # Normalize comments
            )
            
            # Parse duration (PT15M33S -> 15:33)
            duration = self._parse_duration(content_details.get('duration', ''))
            
            return {
                'title': snippet['title'],
                'url': f"https://www.youtube.com/watch?v={video['id']}",
                'description': snippet['description'][:200] + "..." if len(snippet['description']) > 200 else snippet['description'],
                'channel': snippet['channelTitle'],
                'duration': duration,
                'view_count': view_count,
                'like_count': like_count,
                'thumbnail': snippet['thumbnails']['medium']['url'],
                'published_at': snippet['publishedAt'][:10],  # Just the date
                'relevance_score': relevance_score
            }
            
        except (KeyError, ValueError) as e:
            logger.error(f"Error processing video data: {str(e)}")
            return None

    def _parse_duration(self, duration_str: str) -> str:
        """Parse YouTube duration format (PT15M33S) to readable format (15:33)."""
        
        try:
            import re
            
            # Extract minutes and seconds
            match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str)
            if not match:
                return "Unknown"
                
            hours, minutes, seconds = match.groups()
            
            hours = int(hours) if hours else 0
            minutes = int(minutes) if minutes else 0
            seconds = int(seconds) if seconds else 0
            
            if hours > 0:
                return f"{hours}:{minutes:02d}:{seconds:02d}"
            else:
                return f"{minutes}:{seconds:02d}"
                
        except Exception:
            return "Unknown"

    def _is_educational_video(self, video_data: Dict[str, Any]) -> bool:
        """Filter out non-educational content."""
        
        title = video_data['title'].lower()
        description = video_data['description'].lower()
        channel = video_data['channel'].lower()
        
        # Educational indicators (must have at least one)
        educational_keywords = [
            'tutorial', 'learn', 'course', 'lesson', 'guide', 'explained', 
            'programming', 'coding', 'development', 'how to', 'introduction',
            'beginner', 'advanced', 'complete', 'crash course', 'step by step',
            'walkthrough', 'fundamentals', 'basics', 'deep dive'
        ]
        
        # High-quality educational channels (auto-approve)
        trusted_channels = [
            'programming with mosh', 'traversy media', 'freecodecamp', 'the net ninja',
            'web dev simplified', 'techsith', 'corey schafer', 'sentdex', 'derek banas',
            'thenewboston', 'academind', 'dev ed', 'coding train', 'fireship',
            'kevin powell', 'net ninja', 'tech with tim', 'clever programmer'
        ]
        
        # Non-educational indicators (immediate disqualification)
        spam_keywords = [
            'reaction', 'funny', 'meme', 'prank', 'vlog', 'unboxing',
            'review', 'gameplay', 'music', 'song', 'dance', 'fails',
            'compilation', 'shorts', 'tiktok', 'challenge', 'vs', 'versus'
        ]
        
        # Check for trusted channels first
        if any(trusted in channel for trusted in trusted_channels):
            return True
        
        # Check for educational content
        has_educational = any(keyword in title or keyword in description for keyword in educational_keywords)
        
        # Check for spam content (disqualify)
        has_spam = any(keyword in title for keyword in spam_keywords)
        
        # Additional quality checks
        min_views = 1000  # At least 1k views
        min_duration_seconds = 180  # At least 3 minutes (converted from duration string)
        
        # Parse duration to seconds for checking
        duration_ok = True
        try:
            duration_parts = video_data['duration'].split(':')
            if len(duration_parts) == 2:  # MM:SS format
                minutes, seconds = map(int, duration_parts)
                total_seconds = minutes * 60 + seconds
                duration_ok = total_seconds >= min_duration_seconds
        except:
            duration_ok = True  # If parsing fails, don't disqualify
        
        # Final decision
        return (
            has_educational and 
            not has_spam and 
            video_data['view_count'] >= min_views and
            duration_ok
        )

    def _get_fallback_videos(self, topic: str) -> List[Dict[str, Any]]:
        """Fallback videos when API is not available - returns actual video URLs."""
        
        # Expanded curated high-quality programming videos by topic
        curated_videos = {
            'javascript': [
                {
                    'title': 'JavaScript Crash Course For Beginners',
                    'url': 'https://www.youtube.com/watch?v=hdI2bqOjy3c',
                    'channel': 'Traversy Media',
                    'duration': '1:40:17',
                    'description': 'Complete JavaScript crash course covering all the fundamentals you need to know.'
                },
                {
                    'title': 'Learn JavaScript in 1 Hour',
                    'url': 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
                    'channel': 'Programming with Mosh',
                    'duration': '1:02:16',
                    'description': 'JavaScript tutorial for beginners. Learn the basics of JavaScript in one hour.'
                }
            ],
            'promises': [
                {
                    'title': 'JavaScript Promises In 10 Minutes',
                    'url': 'https://www.youtube.com/watch?v=DHvZLI7Db8E',
                    'channel': 'Web Dev Simplified',
                    'duration': '10:42',
                    'description': 'Learn JavaScript promises in 10 minutes with practical examples.'
                },
                {
                    'title': 'JavaScript Promise - Explained with Simple Examples',
                    'url': 'https://www.youtube.com/watch?v=PyRyGOdUMPw',
                    'channel': 'Techsith',
                    'duration': '12:33',
                    'description': 'JavaScript promises explained with simple, easy to understand examples.'
                }
            ],
            'react': [
                {
                    'title': 'React Course - Beginner\'s Tutorial for React JavaScript Library',
                    'url': 'https://www.youtube.com/watch?v=bMknfKXIFA8',
                    'channel': 'freeCodeCamp.org',
                    'duration': '11:55:27',
                    'description': 'Learn React from scratch in this comprehensive course for beginners.'
                },
                {
                    'title': 'React Tutorial for Beginners',
                    'url': 'https://www.youtube.com/watch?v=SqcY0GlETPk',
                    'channel': 'Programming with Mosh',
                    'duration': '1:23:14',
                    'description': 'Complete React tutorial for beginners covering all fundamentals.'
                }
            ],
            'python': [
                {
                    'title': 'Python Tutorial for Beginners - Full Course in 12 Hours',
                    'url': 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
                    'channel': 'Programming with Mosh',
                    'duration': '12:32:30',
                    'description': 'Complete Python course for beginners covering all the basics you need to know.'
                },
                {
                    'title': 'Learn Python - Full Course for Beginners',
                    'url': 'https://www.youtube.com/watch?v=rfscVS0vtbw',
                    'channel': 'freeCodeCamp.org',
                    'duration': '4:26:52',
                    'description': 'Learn Python programming from scratch in this complete course for beginners.'
                }
            ],
            'git': [
                {
                    'title': 'Git and GitHub for Beginners - Crash Course',
                    'url': 'https://www.youtube.com/watch?v=RGOj5yH7evk',
                    'channel': 'freeCodeCamp.org',
                    'duration': '1:08:53',
                    'description': 'Learn Git and GitHub in this crash course for beginners.'
                },
                {
                    'title': 'Git Tutorial for Beginners: Learn Git in 1 Hour',
                    'url': 'https://www.youtube.com/watch?v=8JJ101D3knE',
                    'channel': 'Programming with Mosh',
                    'duration': '1:09:13',
                    'description': 'Complete Git tutorial covering all the fundamentals in one hour.'
                }
            ],
            'html': [
                {
                    'title': 'HTML Tutorial for Beginners: HTML Crash Course',
                    'url': 'https://www.youtube.com/watch?v=qz0aGYrrlhU',
                    'channel': 'Programming with Mosh',
                    'duration': '1:09:33',
                    'description': 'Learn HTML from scratch in this comprehensive crash course for beginners.'
                },
                {
                    'title': 'HTML Full Course - Build a Website Tutorial',
                    'url': 'https://www.youtube.com/watch?v=pQN-pnXPaVg',
                    'channel': 'freeCodeCamp.org',
                    'duration': '2:04:25',
                    'description': 'Complete HTML course covering everything you need to build websites.'
                }
            ],
            'css': [
                {
                    'title': 'CSS Tutorial - Zero to Hero (Complete Course)',
                    'url': 'https://www.youtube.com/watch?v=1Rs2ND1ryYc',
                    'channel': 'freeCodeCamp.org',
                    'duration': '6:18:36',
                    'description': 'Complete CSS course from beginner to advanced level.'
                },
                {
                    'title': 'CSS Crash Course For Absolute Beginners',
                    'url': 'https://www.youtube.com/watch?v=yfoY53QXEnI',
                    'channel': 'Traversy Media',
                    'duration': '1:25:06',
                    'description': 'Learn CSS fundamentals in this crash course for beginners.'
                }
            ],
            'sql': [
                {
                    'title': 'SQL Tutorial - Full Database Course for Beginners',
                    'url': 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
                    'channel': 'freeCodeCamp.org',
                    'duration': '4:20:33',
                    'description': 'Complete SQL course covering database fundamentals and advanced queries.'
                },
                {
                    'title': 'MySQL Tutorial for Beginners [Full Course]',
                    'url': 'https://www.youtube.com/watch?v=7S_tz1z_5bA',
                    'channel': 'Programming with Mosh',
                    'duration': '3:10:44',
                    'description': 'Learn MySQL database management from scratch.'
                }
            ],
            'nodejs': [
                {
                    'title': 'Node.js Tutorial for Beginners: Learn Node in 1 Hour',
                    'url': 'https://www.youtube.com/watch?v=TlB_eWDSMt4',
                    'channel': 'Programming with Mosh',
                    'duration': '1:08:35',
                    'description': 'Complete Node.js tutorial covering server-side JavaScript development.'
                },
                {
                    'title': 'Node.js Crash Course',
                    'url': 'https://www.youtube.com/watch?v=fBNz5xF-Kx4',
                    'channel': 'Traversy Media',
                    'duration': '1:33:06',
                    'description': 'Learn Node.js fundamentals in this comprehensive crash course.'
                }
            ],
            'algorithms': [
                {
                    'title': 'Algorithms and Data Structures Tutorial - Full Course for Beginners',
                    'url': 'https://www.youtube.com/watch?v=8hly31xKli0',
                    'channel': 'freeCodeCamp.org',
                    'duration': '5:18:57',
                    'description': 'Complete course on algorithms and data structures for programming interviews.'
                },
                {
                    'title': 'Data Structures Easy to Advanced Course - Full Tutorial',
                    'url': 'https://www.youtube.com/watch?v=RBSGKlAvoiM',
                    'channel': 'freeCodeCamp.org',
                    'duration': '8:52:52',
                    'description': 'Comprehensive data structures course from basic to advanced concepts.'
                }
            ],
            'database': [
                {
                    'title': 'Database Design Course - Learn how to design and plan a database',
                    'url': 'https://www.youtube.com/watch?v=ztHopE5Wnpc',
                    'channel': 'freeCodeCamp.org',
                    'duration': '8:36:33',
                    'description': 'Learn database design principles and best practices.'
                },
                {
                    'title': 'SQL vs NoSQL or MySQL vs MongoDB',
                    'url': 'https://www.youtube.com/watch?v=ZS_kXvOeQ5Y',
                    'channel': 'Academind',
                    'duration': '18:09',
                    'description': 'Understanding the differences between SQL and NoSQL databases.'
                }
            ],
            'api': [
                {
                    'title': 'APIs for Beginners - How to use an API (Full Course)',
                    'url': 'https://www.youtube.com/watch?v=GZvSYJDk-us',
                    'channel': 'freeCodeCamp.org',
                    'duration': '2:19:16',
                    'description': 'Complete guide to understanding and using APIs.'
                },
                {
                    'title': 'REST API concepts and examples',
                    'url': 'https://www.youtube.com/watch?v=7YcW25PHnAA',
                    'channel': 'WebConcepts',
                    'duration': '8:53',
                    'description': 'Learn REST API fundamentals with practical examples.'
                }
            ]
        }
        
        # Enhanced smart topic matching with better coverage
        topic_lower = topic.lower()
        selected_videos = []
        
        # Try exact matches first
        for key, videos in curated_videos.items():
            if key in topic_lower:
                selected_videos = videos[:2]  # Take first 2 videos
                break
        
        # If no exact match, use keyword-based matching with broader coverage
        if not selected_videos:
            # JavaScript and related
            if any(word in topic_lower for word in ['javascript', 'js', 'node', 'npm', 'express', 'jquery']):
                selected_videos = curated_videos['javascript'][:2]
            # Node.js specific
            elif any(word in topic_lower for word in ['nodejs', 'node.js', 'server', 'backend', 'express']):
                selected_videos = curated_videos['nodejs'][:2]
            # Python and related
            elif any(word in topic_lower for word in ['python', 'django', 'flask', 'pandas', 'numpy']):
                selected_videos = curated_videos['python'][:2]
            # React and related
            elif any(word in topic_lower for word in ['react', 'jsx', 'component', 'hooks', 'redux']):
                selected_videos = curated_videos['react'][:2]
            # Async programming
            elif any(word in topic_lower for word in ['promise', 'async', 'await', 'callback', 'asynchronous']):
                selected_videos = curated_videos['promises'][:2]
            # Version control
            elif any(word in topic_lower for word in ['git', 'github', 'version', 'commit', 'branch', 'merge']):
                selected_videos = curated_videos['git'][:2]
            # HTML and markup
            elif any(word in topic_lower for word in ['html', 'markup', 'semantic', 'dom', 'element']):
                selected_videos = curated_videos['html'][:2]
            # CSS and styling
            elif any(word in topic_lower for word in ['css', 'style', 'flexbox', 'grid', 'responsive', 'bootstrap']):
                selected_videos = curated_videos['css'][:2]
            # Database and SQL
            elif any(word in topic_lower for word in ['sql', 'database', 'mysql', 'postgresql', 'query', 'table']):
                selected_videos = curated_videos['sql'][:2]
            # Database design and concepts
            elif any(word in topic_lower for word in ['database', 'db', 'nosql', 'mongodb', 'schema', 'relational']):
                selected_videos = curated_videos['database'][:2]
            # Algorithms and data structures
            elif any(word in topic_lower for word in ['algorithm', 'data structure', 'sorting', 'searching', 'tree', 'graph', 'array', 'linked list']):
                selected_videos = curated_videos['algorithms'][:2]
            # APIs and web services
            elif any(word in topic_lower for word in ['api', 'rest', 'endpoint', 'http', 'request', 'response', 'json']):
                selected_videos = curated_videos['api'][:2]
            else:
                # If still no match, provide general programming content (mix of popular topics)
                # Instead of defaulting to JavaScript, provide a mix
                general_videos = [
                    curated_videos['javascript'][0],  # One JS video
                    curated_videos['python'][0]       # One Python video
                ]
                selected_videos = general_videos
        
        # Format as our standard structure and ensure no duplicates
        formatted_videos = []
        seen_urls = set()
        
        for idx, video in enumerate(selected_videos):
            video_url = video['url']
            if video_url not in seen_urls:
                formatted_videos.append({
                    'title': video['title'],
                    'url': video_url,
                    'description': video['description'],
                    'channel': video['channel'],
                    'duration': video['duration'],
                    'view_count': 0,  # Would need API call to get real numbers
                    'like_count': 0,
                    'thumbnail': f"https://img.youtube.com/vi/{video_url.split('v=')[1]}/maxresdefault.jpg" if 'v=' in video_url else '',
                    'published_at': '',
                    'relevance_score': 100 - len(formatted_videos)  # Higher score for first videos
                })
                seen_urls.add(video_url)
        
        return formatted_videos

# Create singleton instance
youtube_service = YouTubeService()