# Gemini API Setup Guide

## Overview
To enable AI-powered personalized roadmap generation in InternAI, you need to configure a Google Gemini API key. This guide will walk you through the process.

## Why is this needed?
- **Current Issue**: Roadmaps are showing generic "Preparation Phase" content instead of personalized AI-generated content
- **Root Cause**: Missing `GEMINI_API_KEY` environment variable
- **Solution**: Add your Gemini API key to enable AI-powered roadmap generation

## Quick Setup (Recommended)

### Step 1: Get Your Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API key"
4. Copy the generated API key (starts with `AIza...`)

### Step 2: Add API Key to Your VM
SSH into your Azure VM and run the setup script:

```bash
# Navigate to your InternAI directory
cd ~/InternAI

# Run the setup script
bash setup-gemini-key.sh
```

The script will:
- Guide you through entering your API key
- Update your `.env` file
- Restart the backend service
- Verify the setup

## Manual Setup (Alternative)

If you prefer to set it up manually:

### 1. Edit your .env file
```bash
cd ~/InternAI
nano .env
```

### 2. Add the Gemini API key
Add this line to your `.env` file:
```
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Restart the backend
```bash
docker-compose restart backend
```

## Verification

### Test the API Key Setup
Run this command to verify the API key is loaded:

```bash
docker-compose exec backend python -c "
import os
gemini_key = os.getenv('GEMINI_API_KEY')
if gemini_key:
    print(f'✅ Gemini API key found (length: {len(gemini_key)})')
    print(f'Key preview: {gemini_key[:8]}...{gemini_key[-4:]}')
else:
    print('❌ Gemini API key not found')
"
```

### Test Roadmap Generation
1. Go to your InternAI application: `http://YOUR_VM_IP`
2. Complete the onboarding process (if not already done)
3. Navigate to "My Roadmap"
4. The roadmap should now show personalized content instead of "Preparation Phase"

## Troubleshooting

### Issue: "GEMINI_API_KEY environment variable not found"
**Solution**: Ensure you've added the API key to your `.env` file and restarted the backend service.

### Issue: "'RoadmapAgent' object has no attribute 'generate_roadmap'"
**Solution**: This issue has been fixed in the latest code. Make sure you've pulled the latest changes:
```bash
git pull origin main
docker-compose restart backend
```

### Issue: API key not working
1. Verify your API key is correct (no extra spaces)
2. Check that you have quota remaining in Google AI Studio
3. Ensure your API key has the necessary permissions

### Issue: Still getting generic roadmaps
1. Check backend logs: `docker-compose logs backend | grep -i roadmap`
2. Verify the API key is being loaded correctly
3. Check for any error messages in the logs

## API Usage & Costs

- **Google Gemini API**: Free tier includes 15 requests per minute
- **Cost**: Very minimal for typical usage patterns
- **Rate Limits**: The free tier should be sufficient for testing and light usage

## What Changes After Setup

Before setup:
- ❌ Generic "Preparation Phase" roadmaps
- ❌ No personalization based on user profile
- ❌ Static content for all users

After setup:
- ✅ AI-generated personalized roadmaps
- ✅ Content tailored to experience level, major, and goals
- ✅ Dynamic 12-week plans based on user preferences
- ✅ Specific tasks, resources, and deliverables

## Security Notes

- Keep your API key secure and never commit it to version control
- The API key is stored in your `.env` file which should be in `.gitignore`
- Consider rotating your API key periodically for security

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the backend logs: `docker-compose logs backend`
3. Ensure your VM has internet access to reach Google's APIs 