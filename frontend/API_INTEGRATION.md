# Frontend API Integration

This document explains how the frontend has been refactored to connect to a backend API instead of using hardcoded data.

## Overview

The frontend now uses a clean API architecture with:
- TypeScript interfaces for type safety
- Custom hooks for state management
- Centralized API service
- Proper loading and error states
- Consistent error handling

## Architecture

### Core Components

1. **API Service** (`src/services/api.ts`)
   - Centralized HTTP client with authentication
   - Error handling and response parsing
   - Token management

2. **Type Definitions** (`src/types/api.ts`)
   - TypeScript interfaces for all API requests/responses
   - Ensures type safety across the application

3. **Custom Hooks** (`src/hooks/useApi.ts`)
   - `useApi` - For data fetching with loading/error states
   - `useApiMutation` - For data mutations (create/update/delete)

4. **UI Components** (`src/components/common/`)
   - `LoadingSpinner` - Reusable loading indicator
   - `ErrorMessage` - Consistent error display with retry functionality

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Onboarding
- `GET /onboarding/questions` - Fetch dynamic questions
- `POST /onboarding/submit` - Submit answers and generate roadmap

### Roadmap
- `GET /roadmap` - Get user's personalized roadmap
- `PATCH /roadmap/checklist/:id` - Update checklist item
- `GET /roadmap/export/pdf` - Export roadmap as PDF

### Dashboard
- `GET /dashboard` - Get dashboard data (tasks, stats, deadlines)
- `GET /dashboard/tasks` - Get user tasks
- `PATCH /dashboard/tasks/:id` - Update task completion
- `GET /dashboard/stats` - Get user statistics

### Feedback
- `POST /feedback` - Submit user feedback
- `GET /feedback` - Get user feedback history

## Environment Configuration

Set the following environment variable:
```
VITE_API_BASE_URL=http://localhost:3001/api
```

## Page Updates

### OnboardingPage
- **Before**: Hardcoded questions array
- **After**: Dynamic questions from API
- **Features**: Loading states, error handling, backend submission

### RoadmapPage
- **Before**: Static learning plan and projects
- **After**: Personalized roadmap from API
- **Features**: Real-time checklist updates, PDF export

### DashboardPage
- **Before**: Mock task data and statistics
- **After**: Live task management and real stats
- **Features**: Task completion tracking, feedback submission

## Error Handling

All API calls include comprehensive error handling:
- Network errors
- Authentication failures
- Validation errors
- Server errors

Errors are displayed to users with retry options where appropriate.

## Loading States

Every API operation shows appropriate loading indicators:
- Skeleton screens for initial data loading
- Button spinners for form submissions
- Disabled states during updates

## Authentication Flow

1. User logs in via API
2. JWT token stored in localStorage
3. Token automatically included in all subsequent requests
4. Token cleared on logout or expiration

## Development vs Production

The API base URL is configurable via environment variables:
- Development: `http://localhost:3001/api`
- Production: Set via `VITE_API_BASE_URL`

## Next Steps

To fully implement this integration:

1. **Set up backend API** matching the defined endpoints
2. **Configure environment variables** for API URL
3. **Implement authentication pages** (login/register)
4. **Add API monitoring** and analytics
5. **Implement offline support** with service workers
6. **Add API caching** for better performance

## Backend Requirements

The backend should implement:
- JWT authentication
- User management
- Onboarding flow with AI-generated roadmaps
- Task management system
- File upload/download for PDFs
- Feedback system

## Security Considerations

- All sensitive data transmitted over HTTPS
- JWT tokens with appropriate expiration
- Input validation on all forms
- CORS configuration for cross-origin requests
- Rate limiting for API endpoints 