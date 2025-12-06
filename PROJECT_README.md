# 🚀 AI Job Search Platform - Complete Guide

A full-stack AI-powered job search platform with resume analysis, intelligent matching, application tracking, and interview preparation.

## 📋 Project Overview

This platform combines a **Bun + Express backend** with a **Next.js + TypeScript frontend** to deliver a complete job search experience powered by Google Gemini AI.

### Architecture

```
job_task/
├── 📁 Backend (Express + Bun)
│   ├── src/
│   │   ├── app.js                    # Main Express app
│   │   └── services/                 # Business logic
│   │       ├── resumeAnalyzer.js     # AI resume parsing
│   │       ├── jobMatchingAgent.js   # Intelligent matching
│   │       ├── favorites.js          # Save jobs
│   │       ├── applications.js       # Track applications
│   │       ├── similarJobs.js        # AI recommendations
│   │       ├── interviewPrep.js      # Interview questions
│   │       └── advancedFilters.js    # Advanced filtering
│   ├── .env                          # Backend config
│   └── package.json
│
└── 📁 Frontend (Next.js + TypeScript)
    ├── app/                          # Pages (App Router)
    │   ├── page.tsx                  # Home
    │   ├── jobs/                     # Job listing & details
    │   ├── dashboard/                # Application tracking
    │   └── favorites/                # Saved jobs
    ├── components/                   # Reusable components
    ├── lib/                          # API client & state
    └── .env.local                    # Frontend config
```

## ✨ Features

### 🤖 AI-Powered Features
- **Resume Analysis**: Extract skills, experience, education using Gemini AI
- **Smart Job Matching**: Weighted scoring algorithm (40% skills, 30% experience, 30% location)
- **Similar Jobs**: AI-powered "you might also like" recommendations
- **Interview Prep**: Role-specific interview questions and preparation tips
- **Career Insights**: Personalized career recommendations

### 💼 Job Management
- **Search & Filter**: Keyword, location, and advanced filters
- **Advanced Filters**: Remote/hybrid, job type, experience level, salary range
- **Favorites**: Save jobs for later viewing
- **Application Tracking**: Manage entire hiring pipeline (7 statuses)

### 📊 Application Lifecycle
```
Saved → Applied → Interviewing → Offered → Accepted/Rejected/Withdrawn
```

### 🎨 User Interface
- Modern, responsive design with Tailwind CSS
- Beautiful gradient backgrounds
- Smooth animations and transitions
- Mobile-first responsive layout
- Accessible components

## 🚀 Quick Start

### Prerequisites
- **Bun**: Install from [bun.sh](https://bun.sh)
- **Google Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

```bash
# 1. Clone or navigate to the project
cd job_task

# 2. Set up backend environment
cat > .env << 'EOF'
GEMINI_API_KEY=your_api_key_here
PORT=3000
NODE_ENV=development
EOF

# 3. Install all dependencies
bun install
cd frontend && bun install && cd ..

# 4. Start both servers
./start.sh
```

**Or start manually:**

```bash
# Terminal 1 - Backend
bun start

# Terminal 2 - Frontend
cd frontend && bun run dev
```

### Access the Application
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api

## 🔧 Environment Variables

### Backend (`.env`)
```env
GEMINI_API_KEY=AIzaSy...    # Your Google Gemini API key
PORT=3000                    # Backend server port
NODE_ENV=development         # Environment
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 📡 API Endpoints

### Core Features
- `GET /api/jobs` - Search jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/resume/analyze` - Analyze resume with AI
- `POST /api/chat` - Natural language chat

### Favorites
- `POST /api/favorites/add` - Add to favorites
- `POST /api/favorites/remove` - Remove from favorites
- `GET /api/favorites/:userId` - Get user favorites

### Applications
- `POST /api/applications/apply` - Apply to job
- `PATCH /api/applications/:id/status` - Update status
- `GET /api/applications/:userId` - Get applications
- `GET /api/applications/:userId/stats` - Get statistics

### AI Features
- `GET /api/jobs/:id/similar` - Get similar jobs
- `POST /api/jobs/:id/interview-prep` - Get interview questions

### Advanced Filters
- `GET /api/filters/options` - Get filter options
- `POST /api/jobs/advanced-filter` - Apply filters

## 🎯 Usage Examples

### 1. Search for Jobs
Navigate to http://localhost:3001 and enter keywords or location.

### 2. Upload Resume
Paste your resume on the home page to get AI-powered job recommendations.

### 3. Apply to Jobs
Click "Apply" on any job card to track your application.

### 4. Get Interview Prep
On a job detail page, click "Get AI Interview Preparation" for customized questions.

### 5. Track Applications
Visit the Dashboard to see all your applications and update their status.

## 🧪 Testing the API

```bash
# Search jobs
curl "http://localhost:3000/api/jobs?keyword=engineer&location=remote"

# Analyze resume
curl -X POST http://localhost:3000/api/resume/analyze \
  -H "Content-Type: application/json" \
  -d '{"resumeText": "Senior Software Engineer with 5 years in React...", "topN": 5}'

# Add to favorites
curl -X POST http://localhost:3000/api/favorites/add \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "jobId": "JOB-1"}'

# Apply to job
curl -X POST http://localhost:3000/api/applications/apply \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "jobId": "JOB-1"}'

# Get similar jobs
curl "http://localhost:3000/api/jobs/JOB-1/similar?limit=5&ai=true"

# Get interview prep
curl -X POST http://localhost:3000/api/jobs/JOB-1/interview-prep \
  -H "Content-Type: application/json" \
  -d '{"resumeText": "Your resume here..."}'
```

## 📊 Project Stats

- **Backend Services**: 12 specialized services
- **API Endpoints**: 20+ RESTful endpoints
- **Frontend Pages**: 5 main pages + dynamic routes
- **React Components**: 6+ reusable components
- **AI Integration**: Google Gemini 1.5 Flash
- **Code Quality**: TypeScript, ESLint, Modern ES6+

## 🔐 Security Notes

⚠️ **Important**: Your API key in `.env` should NEVER be committed to git!

The `.gitignore` is already configured to exclude:
- `.env`
- `frontend/.env.local`
- `node_modules/`

**If you've already committed your API key:**
1. Revoke it at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Generate a new API key
3. Update your `.env` file

## 📚 Tech Stack

### Backend
- **Runtime**: Bun 1.3.1
- **Framework**: Express.js 4.18.2
- **AI**: Google Generative AI (@google/generative-ai)
- **Environment**: dotenv 17.2.3

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **State**: Zustand 5
- **Icons**: Lucide React
- **Runtime**: Bun

## 🎨 Key Features Breakdown

### 1. Resume Analysis (AI)
```javascript
// Upload resume → AI extracts skills, experience, education
// Match with jobs using weighted algorithm
// Get top N matching jobs with scores
```

### 2. Application Tracking
```
7 Statuses: saved, applied, interviewing, offered, 
           rejected, accepted, withdrawn
Timeline: Track every status change with dates and notes
Stats: View application statistics dashboard
```

### 3. Interview Preparation (AI)
```
Common Questions: 5-7 general interview questions
Technical: 5-7 role-specific technical questions
Behavioral: 3-5 STAR method questions
Questions to Ask: 3-5 questions for interviewer
Tips: 3-4 preparation tips
```

### 4. Advanced Filters
```
Work Type: remote, hybrid, onsite
Job Type: full-time, part-time, contract, internship, freelance
Experience: entry, mid, senior, lead, executive
Salary Range: Min-Max
Posted Date: Last 24h, 7d, 30d
```

## 🚀 Deployment

### Backend (Render, Railway, Fly.io)
```bash
# Build command
bun install

# Start command
bun start

# Environment variables
GEMINI_API_KEY=your_key
PORT=3000
NODE_ENV=production
```

### Frontend (Vercel, Netlify)
```bash
# Build command
cd frontend && bun install && bun run build

# Output directory
frontend/.next

# Environment variables
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

## 📖 Documentation

- [Backend API Documentation](./NEW_FEATURES_V3.md)
- [Frontend README](./frontend/README.md)
- [Environment Setup](./frontend/.env.local)

## 🐛 Troubleshooting

### Backend won't start
- Check if `.env` file exists with `GEMINI_API_KEY`
- Verify port 3000 is not in use: `lsof -i :3000`
- Check Bun installation: `bun --version`

### Frontend won't start
- Check if backend is running on port 3000
- Verify `frontend/.env.local` exists
- Clear Next.js cache: `rm -rf frontend/.next`

### API calls failing
- Ensure CORS is enabled (already configured)
- Check `NEXT_PUBLIC_API_URL` in frontend/.env.local
- Verify backend health: `curl http://localhost:3000/api`

### AI features not working
- Verify Gemini API key is valid
- Check API quota limits in Google Cloud Console
- Look for error messages in backend logs

## 📝 Development Tips

### Backend Development
```bash
# Watch mode (auto-restart on changes)
bun --watch start

# View logs
tail -f logs/app.log  # if logging is set up
```

### Frontend Development
```bash
cd frontend

# Development server with hot reload
bun run dev

# Type checking
bun run build  # TypeScript checks during build
```

## 🎯 Roadmap

### Completed ✅
- AI resume analysis
- Job search and filtering
- Favorites management
- Application tracking
- Interview preparation
- Similar jobs recommendations
- Advanced filters
- Modern UI/UX

### Future Enhancements 🚧
- [ ] User authentication (Auth0/NextAuth)
- [ ] Email notifications
- [ ] Real-time updates (WebSockets)
- [ ] Resume builder
- [ ] Company reviews
- [ ] Salary insights
- [ ] Job alerts
- [ ] Export applications to PDF
- [ ] Mobile app (React Native)
- [ ] Database integration (PostgreSQL/MongoDB)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a pull request

## 📄 License

This project is for educational purposes.

## 🙏 Acknowledgments

- Google Gemini AI for intelligent features
- Next.js team for the amazing framework
- Tailwind CSS for beautiful styling
- Bun for blazing-fast runtime

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review the documentation
3. Check if backend and frontend are both running
4. Verify environment variables are set correctly

---

**Built with ❤️ using Bun, Express, Next.js, TypeScript, and Google Gemini AI**

🌟 Star this project if you find it helpful!
