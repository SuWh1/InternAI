# YouTube Video Integration Setup

## 🎯 What You Get
- **Real YouTube videos** for each lesson topic (not search results)
- **3 most popular/relevant** videos per topic
- **Video thumbnails, duration, view counts** 
- **Educational content filtering** (removes music, vlogs, etc.)
- **Curated fallback videos** when API is unavailable

## 🔧 Setup YouTube Data API (5 minutes)

### Step 1: Google Cloud Console
1. Go to https://console.cloud.google.com/
2. **Create project** or select existing one
3. **Enable API**: 
   - Go to "APIs & Services" → "Library"
   - Search "YouTube Data API v3" 
   - Click "Enable"

### Step 2: Get API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. **Copy the API key** (looks like: `AIzaSyDaGmWnG4tADSzE_rkG7hqPQ8VqBzOgNjQ`)

### Step 3: Add to Environment
Create/update your `.env` file in the backend folder:

```bash
# Add this line to backend/.env
YOUTUBE_API_KEY=AIzaSyDaGmWnG4tADSzE_rkG7hqPQ8VqBzOgNjQ
```

### Step 4: Restart Docker
```bash
docker-compose down
docker-compose -f docker-compose.dev.yml up --build
```

## ✅ Test It Works
1. Generate any lesson (e.g., "JavaScript Promises")
2. You should see **"Popular Video Tutorials"** section
3. Videos should have real thumbnails and go to actual YouTube videos

## 🔄 Fallback Mode
If no API key is configured, the system uses **curated educational videos**:
- Programming with Mosh tutorials
- Traversy Media courses  
- freeCodeCamp content
- Other high-quality channels

## 📊 API Usage
- **Free tier**: 10,000 requests/day (plenty for your app)
- **Each lesson**: Uses ~3-5 API calls
- **Rate limits**: Built-in (won't exceed quotas)

## 🛡️ Security
- API key is server-side only (not exposed to frontend)
- Educational content filtering prevents inappropriate videos
- Safe search enabled

## 🎯 Smart Features
- **Topic matching**: "JavaScript Promises" → finds promise-specific videos
- **Quality filtering**: Minimum views, duration, educational keywords
- **Channel prioritization**: Trusted educational channels ranked higher
- **Recent content**: Only videos from 2020+ (no outdated content)

That's it! Your lessons now have engaging video content. 🚀 