"""
YouTube API service for fetching popular educational videos.

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

FALLBACK: If no API key is configured, returns curated video search URLs
from high-quality programming channels.
"""

import os
import logging
from typing import List, Dict, Any, Optional
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

class YouTubeService:
    """Service for fetching popular YouTube videos related to programming topics."""
    
    def __init__(self):
        self.api_key = os.getenv("YOUTUBE_API_KEY")
        self.youtube = None
        if self.api_key:
            try:
                self.youtube = build('youtube', 'v3', developerKey=self.api_key)
                logger.info("YouTube API client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize YouTube API client: {str(e)}")
        else:
            logger.warning("YOUTUBE_API_KEY not configured")

    async def get_popular_videos(self, topic: str, context: str = "", max_results: int = 3) -> List[Dict[str, Any]]:
        """
        Get popular YouTube videos related to a programming topic.
        
        Args:
            topic: The main topic (e.g., "JavaScript Promises")
            context: Additional context (e.g., "Week 3: Async Programming")
            max_results: Number of videos to return (default: 3)
            
        Returns:
            List of video dictionaries with title, url, description, duration, view_count
        """
        
        if not self.youtube:
            return self._get_fallback_videos(topic)
            
        try:
            # Create smart search queries
            search_queries = self._generate_search_queries(topic, context)
            
            videos = []
            seen_video_ids = set()  # Track video IDs to prevent duplicates
            
            for query in search_queries:
                try:
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
                    logger.error(f"YouTube API error for query '{query}': {str(e)}")
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
            return unique_videos[:max_results]
            
        except Exception as e:
            logger.error(f"Error fetching YouTube videos: {str(e)}")
            return self._get_fallback_videos(topic)

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
        
        # Curated high-quality programming videos by topic
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
            ]
        }
        
        # Smart topic matching
        topic_lower = topic.lower()
        selected_videos = []
        
        # Try exact matches first
        for key, videos in curated_videos.items():
            if key in topic_lower:
                selected_videos = videos[:2]  # Take first 2 videos
                break
        
        # If no exact match, use general programming videos
        if not selected_videos:
            if any(word in topic_lower for word in ['javascript', 'js', 'node', 'npm']):
                selected_videos = curated_videos['javascript'][:2]
            elif any(word in topic_lower for word in ['python', 'django', 'flask']):
                selected_videos = curated_videos['python'][:2]
            elif any(word in topic_lower for word in ['react', 'jsx', 'component']):
                selected_videos = curated_videos['react'][:2]
            elif any(word in topic_lower for word in ['promise', 'async', 'await']):
                selected_videos = curated_videos['promises'][:2]
            elif any(word in topic_lower for word in ['git', 'github', 'version']):
                selected_videos = curated_videos['git'][:2]
            else:
                # Default to JavaScript videos as they're most common
                selected_videos = curated_videos['javascript'][:2]
        
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