#!/bin/bash

# Setup Google Gemini API Key for InternAI
# This script helps users configure their Gemini API key for AI-powered roadmap generation

echo "🤖 InternAI - Gemini API Key Setup"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    echo "Please copy env.template to .env first:"
    echo "  cp env.template .env"
    echo ""
    exit 1
fi

echo "📝 To enable AI-powered roadmap generation, you need a Google Gemini API key."
echo ""
echo "Steps to get your API key:"
echo "1. Go to https://aistudio.google.com/app/apikey"
echo "2. Sign in with your Google account"
echo "3. Click 'Create API key'"
echo "4. Copy the generated API key"
echo ""

# Prompt for API key
read -p "Enter your Gemini API key: " GEMINI_KEY

if [ -z "$GEMINI_KEY" ]; then
    echo "❌ No API key provided. Exiting."
    exit 1
fi

# Check if GEMINI_API_KEY already exists in .env
if grep -q "GEMINI_API_KEY=" .env; then
    # Update existing key
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/GEMINI_API_KEY=.*/GEMINI_API_KEY=$GEMINI_KEY/" .env
    else
        # Linux
        sed -i "s/GEMINI_API_KEY=.*/GEMINI_API_KEY=$GEMINI_KEY/" .env
    fi
    echo "✅ Updated existing GEMINI_API_KEY in .env"
else
    # Add new key
    echo "GEMINI_API_KEY=$GEMINI_KEY" >> .env
    echo "✅ Added GEMINI_API_KEY to .env"
fi

echo ""
echo "🔄 Restarting backend service to apply changes..."
docker-compose restart backend

echo ""
echo "✅ Setup complete! Your InternAI deployment now supports AI-powered roadmap generation."
echo ""
echo "Next steps:"
echo "1. Visit your app and complete the onboarding"
echo "2. Generate your personalized roadmap"
echo "3. The AI will create a custom 12-week internship prep plan based on your profile"
echo "" 