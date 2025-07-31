# 🎓 InternAI - AI-Powered Internship Preparation Platform

[![Deploy to Azure VM](https://github.com/your-username/InternAI/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-username/InternAI/actions/workflows/deploy.yml)

**InternAI** is a student-built platform designed to guide you through internship preparation - step by step. It provides a clear **12-week roadmap** 🗓️ created by students who've been exactly where you are, breaking down the internship journey into small, focused goals that are easy to follow.

Whether you're aiming for top companies like **Meta, Apple, NVIDIA, Google and OpenAI (MANGO)** or just exploring your path into tech, this roadmap gives you clear direction - no more guesswork, no more overwhelm.

**Stop asking "Where do I even start?" and start saying "I've got this."**  
*One plan. Twelve weeks. Real progress.*

## 🌟 Key Features

### 🤖 AI-Powered Personalization
- **Smart Roadmap Generation**: AI analyzes your skills, target roles, and timeline to create personalized 12-week preparation plans
- **Dynamic Content Adaptation**: Roadmaps adjust based on your experience level, preferred tech stack, and target companies
- **Intelligent Topic Recommendations**: AI suggests relevant learning topics based on your goals and current progress

### 📚 Comprehensive Learning Journey
- **Structured Learning Path**: Move through key stages from tech skills to interview preparation
- **Interactive Topic Explorer**: Deep-dive into specific technologies with curated resources and practical exercises
- **Progress Tracking**: Monitor your advancement through each week and topic
- **Real-World Projects**: Build portfolio-worthy projects that strengthen your resume

### 🎯 MANGO Company Focus
- **Target Company Preparation**: Specialized preparation for Meta, Apple, NVIDIA, Google, and OpenAI
- **Industry-Specific Guidance**: Tailored advice for different tech sectors and company types
- **Interview Mastery**: Comprehensive interview preparation including technical and behavioral aspects

### 💼 Career Development Tools
- **Resume Analysis**: AI-powered resume review and optimization suggestions
- **Internship Matching**: Smart job matching based on your profile and preferences
- **Application Tracking**: Keep track of your internship applications and deadlines

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with Rolldown
- **Styling**: Tailwind CSS 4.x
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Routing**: React Router DOM v7
- **UI Components**: Lucide React icons, Monaco Editor
- **Data Fetching**: TanStack React Query, Axios

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: Google OAuth 2.0, JWT tokens
- **AI Integration**: Google Gemini API
- **Rate Limiting**: SlowAPI with Redis
- **Database Migrations**: Alembic
- **Email Service**: Brevo (Sendinblue)
- **File Storage**: AWS S3

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (reverse proxy, SSL termination)
- **Deployment**: Azure VM with GitHub Actions CI/CD
- **SSL**: Let's Encrypt certificates
- **Monitoring**: Built-in health checks

### Development Tools
- **Code Quality**: ESLint, TypeScript strict mode
- **Version Control**: Git with automated deployment
- **Environment Management**: Docker development containers
- **API Documentation**: FastAPI automatic OpenAPI docs

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- PostgreSQL (handled by Docker)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/InternAI.git
cd InternAI
```

### 2. Environment Setup
```bash
# Copy environment template
cp env.template .env

# Edit .env with your configuration
# Required: Database credentials, Google OAuth, Gemini API key
```

### 3. Start with Docker (Recommended)
```bash
# Production build
docker-compose up -d

# Development with hot reload
docker-compose -f docker-compose.dev.yml up -d
```

### 4. Database Setup
```bash
# Run migrations
docker-compose exec backend alembic upgrade head
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🔧 Development Setup

### Local Development (Without Docker)

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up database
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
POSTGRES_DB=internai_prod
POSTGRES_USER=internai_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_PORT=5432

# Backend Configuration  
SECRET_KEY=your_super_secret_key_here_minimum_32_characters
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key

# CORS Configuration
BACKEND_CORS_ORIGINS=["http://localhost:3000","https://yourdomain.com"]
VITE_API_BASE_URL=http://localhost:8000

# AWS Configuration (for file uploads)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_AVATAR_BUCKET=your-s3-bucket

# Email Configuration (Brevo)
BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=noreply@yourdomain.com
BREVO_FROM_NAME=InternAI
BREVO_TEMPLATE_ID=1

# YouTube API (for resource recommendations)
YOUTUBE_API_KEY=your_youtube_api_key
```

## 📁 Project Structure

```
InternAI/
├── 📁 backend/                 # FastAPI backend application
│   ├── 📁 app/
│   │   ├── 📁 agents/          # AI agents for roadmap, topics, etc.
│   │   ├── 📁 api/             # API endpoints and routing
│   │   ├── 📁 core/            # Core configuration and utilities
│   │   ├── 📁 crud/            # Database CRUD operations
│   │   ├── 📁 db/              # Database configuration
│   │   ├── 📁 models/          # SQLAlchemy database models
│   │   ├── 📁 schemas/         # Pydantic schemas for API
│   │   └── 📁 utils/           # Utility functions and helpers
│   ├── 📁 alembic/             # Database migration files
│   ├── 📄 requirements.txt     # Python dependencies
│   └── 📄 Dockerfile          # Backend container configuration
├── 📁 frontend/                # React frontend application
│   ├── 📁 src/
│   │   ├── 📁 components/      # Reusable React components
│   │   ├── 📁 contexts/        # React contexts (theme, auth)
│   │   ├── 📁 hooks/           # Custom React hooks
│   │   ├── 📁 pages/           # Page components and routing
│   │   ├── 📁 services/        # API service functions
│   │   ├── 📁 stores/          # Zustand state management
│   │   ├── 📁 types/           # TypeScript type definitions
│   │   └── 📁 utils/           # Frontend utility functions
│   ├── 📁 public/              # Static assets and images
│   ├── 📄 package.json         # Node.js dependencies
│   ├── 📄 vite.config.ts       # Vite build configuration
│   └── 📄 Dockerfile          # Frontend container configuration
├── 📁 nginx/                   # Nginx reverse proxy configuration
├── 📁 .github/workflows/       # GitHub Actions CI/CD
├── 📄 docker-compose.yml       # Production Docker setup
├── 📄 docker-compose.dev.yml   # Development Docker setup
├── 📄 env.template             # Environment variables template
└── 📄 validate-deployment.sh   # Deployment validation script
```

## 🎯 Core Features Deep Dive

### 1. AI-Powered Roadmap Generation
The platform uses advanced AI to create personalized 12-week internship preparation roadmaps:

- **User Profiling**: Analyzes experience level, programming languages, frameworks, and target roles
- **Dynamic Content**: Generates week-by-week themes, tasks, and deliverables
- **Resource Curation**: Provides relevant learning materials and project ideas
- **Progress Adaptation**: Adjusts difficulty and focus based on user progress

### 2. Interactive Learning Topics
Comprehensive topic exploration system:

- **Technology Deep-Dives**: Detailed explanations of programming concepts and frameworks
- **Practical Applications**: Real-world use cases and implementation examples
- **Resource Libraries**: Curated links to documentation, tutorials, and courses
- **Progress Tracking**: Monitor completion and understanding levels

### 3. Resume Analysis & Optimization
AI-powered resume enhancement:

- **Content Analysis**: Evaluates resume structure, content, and relevance
- **Skill Gap Identification**: Highlights missing skills for target roles
- **Improvement Suggestions**: Provides specific recommendations for enhancement
- **ATS Optimization**: Ensures compatibility with Applicant Tracking Systems

### 4. Smart Internship Matching
Intelligent job recommendation system:

- **Profile Matching**: Compares user skills with job requirements
- **Company Filtering**: Focuses on preferred company types and locations
- **Application Tracking**: Manages application status and deadlines
- **Interview Preparation**: Provides company-specific interview guidance

## 🔐 Security & Privacy

- **OAuth 2.0 Authentication**: Secure Google-based login system
- **JWT Token Management**: Stateless authentication with secure token handling
- **Rate Limiting**: API protection against abuse and spam
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **SSL/TLS Encryption**: End-to-end encrypted communications
- **Data Privacy**: GDPR-compliant data handling and user consent management

## 🚀 Deployment

### Production Deployment on Azure VM

1. **Server Setup**:
   ```bash
   # Install Docker and Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

2. **SSL Configuration**:
   ```bash
   # Install Certbot for Let's Encrypt
   sudo apt install certbot
   sudo certbot certonly --standalone -d yourdomain.com
   ```

3. **Deploy Application**:
   ```bash
   git clone https://github.com/your-username/InternAI.git
   cd InternAI
   cp env.template .env
   # Configure .env with production values
   docker-compose up -d
   ```

4. **Validate Deployment**:
   ```bash
   chmod +x validate-deployment.sh
   ./validate-deployment.sh yourdomain.com
   ```

### GitHub Actions CI/CD
Automated deployment pipeline:
- **Trigger**: Push to main branch
- **Process**: Checkout → SSH setup → Deploy to Azure VM
- **Features**: Zero-downtime deployment with Docker container rebuilds

## 🧪 Testing & Quality Assurance

### Backend Testing
```bash
cd backend
pytest tests/ -v --cov=app
```

### Frontend Testing
```bash
cd frontend
npm run test
npm run lint
```

### End-to-End Testing
```bash
# Validate full deployment
./validate-deployment.sh localhost
```

## 📊 Monitoring & Analytics

- **Application Health**: Built-in health check endpoints
- **Performance Monitoring**: Response time and error rate tracking
- **User Analytics**: Google Analytics integration with privacy controls
- **Error Logging**: Comprehensive error tracking and reporting

## 🤝 Contributing

We welcome contributions from the community! Here's how to get started:

1. **Fork the Repository**
2. **Create a Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Follow our coding standards and add tests
4. **Commit Changes**: `git commit -m 'Add amazing feature'`
5. **Push to Branch**: `git push origin feature/amazing-feature`
6. **Open Pull Request**: Describe your changes and their impact

### Development Guidelines
- Follow TypeScript/Python type hints
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure Docker builds pass
- Follow semantic commit messages

## 📝 API Documentation

The backend provides comprehensive API documentation:
- **Interactive Docs**: http://localhost:8000/docs (Swagger UI)
- **OpenAPI Schema**: http://localhost:8000/openapi.json
- **ReDoc**: http://localhost:8000/redoc

### Key API Endpoints
- `POST /api/auth/google` - Google OAuth authentication
- `GET /api/agents/roadmap` - Generate personalized roadmap
- `GET /api/agents/topics` - Get learning topics
- `POST /api/agents/resume-analysis` - Analyze resume
- `GET /api/agents/internships` - Get internship recommendations

## 🎨 Theming & Customization

InternAI supports light and dark themes with smooth transitions:

### Theme Configuration
- **Light Theme**: Clean, professional appearance for daytime use
- **Dark Theme**: Eye-friendly dark mode for extended coding sessions
- **System Preference**: Automatically matches user's system theme
- **Persistent Storage**: Remembers user's theme preference

### Custom Styling
The application uses Tailwind CSS with custom theme variables:
```css
/* Theme variables in index.css */
:root {
  --theme-primary: #FAFAFA;
  --theme-secondary: #EFEFEF;
  --theme-accent: #C700FF;
}
```

## 🔧 Troubleshooting

### Common Issues

**Database Connection Issues**:
```bash
# Check PostgreSQL container
docker-compose logs db

# Reset database
docker-compose down -v
docker-compose up -d
```

**Frontend Build Errors**:
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**SSL Certificate Issues**:
```bash
# Renew Let's Encrypt certificate
sudo certbot renew
docker-compose restart nginx
```

### Performance Optimization
- Enable Redis caching for API responses
- Optimize database queries with proper indexing
- Use CDN for static assets
- Implement lazy loading for large components

## 📈 Roadmap & Future Features

### Upcoming Features
- [ ] **Mobile Application**: React Native app for iOS and Android
- [ ] **Advanced Analytics**: Detailed progress tracking and insights
- [ ] **Peer Learning**: Study groups and collaborative features
- [ ] **Company Partnerships**: Direct internship application integration
- [ ] **Certification System**: Skill verification and digital badges
- [ ] **Mentorship Platform**: Connect with industry professionals

### Technical Improvements
- [ ] **Microservices Architecture**: Split monolith into specialized services
- [ ] **GraphQL API**: More efficient data fetching
- [ ] **Real-time Features**: WebSocket integration for live updates
- [ ] **Advanced AI**: GPT-4 integration for enhanced personalization
- [ ] **Kubernetes Deployment**: Scalable container orchestration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Student Contributors**: Built by students, for students
- **Open Source Community**: Thanks to all the amazing open-source projects we use
- **Beta Testers**: Early users who provided valuable feedback
- **Industry Mentors**: Professionals who guided our development process

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/your-username/InternAI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/InternAI/discussions)
- **Email**: support@internai.pro
- **Website**: [https://internai.pro](https://internai.pro)

---

**Made with ❤️ by students, for students preparing for their dream internships at MANGO companies and beyond.**

*Ready to transform your internship preparation journey? Get started today!* 🚀