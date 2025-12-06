const express = require('express');
const path = require('path');
const fs = require('fs');

// Load environment variables
if (!process.env.GEMINI_API_KEY) {
  console.log('⚠️ Loading .env file...');
  try {
    require('dotenv').config();
  } catch (e) {
    console.log('⚠️ dotenv not installed, environment variables must be set manually');
  }
}

const JobIngestionService = require('./services/ingestion');
const JobSearchService = require('./services/search');
const AgenticRAGSystem = require('./services/agenticRAG');
const FavoritesService = require('./services/favorites');
const ApplicationService = require('./services/applications');
const SimilarJobsService = require('./services/similarJobs');
const InterviewPrepService = require('./services/interviewPrep');
const AdvancedFiltersService = require('./services/advancedFilters');

// Import data sources
const source1Jobs = require('../data/source1');
const source2Jobs = require('../data/source2');

// Track rejected jobs (in-memory for now)
const rejectedJobs = [];

// Initialize services
const ingestionService = new JobIngestionService();
const searchService = new JobSearchService(ingestionService);
const agenticRAG = new AgenticRAGSystem(ingestionService);
const favoritesService = new FavoritesService();
const applicationService = new ApplicationService();
const similarJobsService = new SimilarJobsService(ingestionService);
const interviewPrepService = new InterviewPrepService();

// Create Express app
const app = express();
app.use(express.json({ limit: '10mb' })); // Increased limit for resume uploads
app.use(express.text({ limit: '10mb' }));

// Serve static files from public directory (OLD HTML FRONTEND - DISABLED)
// Use Next.js frontend at http://localhost:3001 instead
// app.use(express.static(path.join(__dirname, '../public')));

// Enable CORS for frontend integration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Ingest data on startup
console.log('🚀 Starting Job Search Platform...\n');
ingestionService.ingestAll({
  source1: source1Jobs,
  source2: source2Jobs
});

// ============= ROUTES =============

/**
 * GET /api/jobs
 * Search jobs with keyword and location filters
 * Query params: keyword, location, page, limit
 */
app.get('/api/jobs', (req, res) => {
  try {
    const { keyword, location, page, limit } = req.query;
    
    const result = searchService.search({
      keyword,
      location,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/jobs/search
 * Advanced search with multiple filters
 * Query params: keyword, location, minSalary, maxSalary, currency, company, page, limit
 */
app.get('/api/jobs/search', (req, res) => {
  try {
    const {
      keyword,
      location,
      minSalary,
      maxSalary,
      currency,
      company,
      page,
      limit
    } = req.query;
    
    const result = searchService.advancedSearch({
      keyword,
      location,
      minSalary: minSalary ? parseFloat(minSalary) : null,
      maxSalary: maxSalary ? parseFloat(maxSalary) : null,
      currency,
      company,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/jobs/post
 * Post a new job and trigger re-ingestion
 */
app.post('/api/jobs/post', (req, res) => {
  try {
    const jobData = req.body;
    
    // Validate required fields
    const requiredFields = ['title', 'company', 'location', 'description'];
    const missingFields = requiredFields.filter(field => !jobData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    console.log('\n📝 New job posted, triggering re-ingestion...\n');
    
    // Transform frontend format to source2 format
    const source2Format = {
      title: jobData.title,
      companyName: jobData.company,
      city: jobData.location.split(',')[0]?.trim() || jobData.location,
      country: jobData.location.includes('USA') || jobData.location.includes('US') ? 'USA' : 
               jobData.location.split(',').pop()?.trim() || 'Unknown',
      state: jobData.location.includes(',') ? jobData.location.split(',')[1]?.trim() || '' : '',
      salaryMin: jobData.salary ? parseInt(jobData.salary.split('-')[0]?.replace(/\D/g, '')) || 0 : 0,
      salaryMax: jobData.salary ? parseInt(jobData.salary.split('-')[1]?.replace(/\D/g, '')) || 0 : 0,
      currency: jobData.salary?.includes('$') ? 'USD' : 
                jobData.salary?.includes('€') ? 'EUR' : 
                jobData.salary?.includes('£') ? 'GBP' : 'USD',
      jobDescription: jobData.description,
      datePosted: new Date().toISOString().split('T')[0],
      externalId: `USER-${Date.now()}`,
      workType: jobData.workType,
      jobType: jobData.jobType,
      experienceLevel: jobData.experienceLevel,
      skills: jobData.skills,
      requirements: jobData.requirements,
      benefits: jobData.benefits
    };
    
    // Add the new job to source2 (user-posted jobs)
    source2Jobs.push(source2Format);
    
    // Save to file for persistence
    const source2Path = path.join(__dirname, '../data/source2.js');
    const fileContent = `// Source 2: Career Connect - Different data format
const source2Jobs = ${JSON.stringify(source2Jobs, null, 2)};

module.exports = source2Jobs;
`;
    
    try {
      fs.writeFileSync(source2Path, fileContent, 'utf8');
      console.log('✅ Job saved to source2.js file');
      
      // Clear Node.js module cache to reload the file
      delete require.cache[require.resolve('../data/source2')];
      
      // Reload source2 with the new job
      const updatedSource2Jobs = require('../data/source2');
      
      // Re-run ingestion with the fresh data
      const stats = ingestionService.ingestAll({
        source1: source1Jobs,
        source2: updatedSource2Jobs
      });
      
      console.log(`📊 Re-ingestion complete: ${stats.uniqueJobs} unique jobs (${stats.duplicatesRemoved} duplicates removed)`);
      
      return res.json({
        success: true,
        message: 'Job posted successfully and re-ingested',
        data: jobData,
        stats: stats
      });
    } catch (writeError) {
      console.error('⚠️ Warning: Could not persist job to file:', writeError.message);
      
      // Fallback: ingest with in-memory data only
      const stats = ingestionService.ingestAll({
        source1: source1Jobs,
        source2: source2Jobs
      });
      
      return res.json({
        success: true,
        message: 'Job posted successfully (in-memory only)',
        data: jobData,
        stats: stats,
        warning: 'Job was not persisted to disk'
      });
    }
  } catch (error) {
    console.error('Job posting error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/jobs/bulk-post
 * Post multiple jobs at once and trigger re-ingestion
 */
app.post('/api/jobs/bulk-post', (req, res) => {
  try {
    const { jobs } = req.body;
    
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Jobs array is required and must not be empty'
      });
    }
    
    // Validate each job
    const requiredFields = ['title', 'company', 'location', 'description'];
    for (let i = 0; i < jobs.length; i++) {
      const missingFields = requiredFields.filter(field => !jobs[i][field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Job at index ${i} is missing fields: ${missingFields.join(', ')}`
        });
      }
    }
    
    console.log(`\n📝 ${jobs.length} new jobs posted, triggering re-ingestion...\n`);
    
    // Transform all jobs to source2 format
    const source2FormatJobs = jobs.map(jobData => ({
      title: jobData.title,
      companyName: jobData.company,
      city: jobData.location.split(',')[0]?.trim() || jobData.location,
      country: jobData.location.includes('USA') || jobData.location.includes('US') ? 'USA' : 
               jobData.location.split(',').pop()?.trim() || 'Unknown',
      state: jobData.location.includes(',') ? jobData.location.split(',')[1]?.trim() || '' : '',
      salaryMin: jobData.salary ? parseInt(jobData.salary.split('-')[0]?.replace(/\D/g, '')) || 0 : 0,
      salaryMax: jobData.salary ? parseInt(jobData.salary.split('-')[1]?.replace(/\D/g, '')) || 0 : 0,
      currency: jobData.salary?.includes('$') ? 'USD' : 
                jobData.salary?.includes('€') ? 'EUR' : 
                jobData.salary?.includes('£') ? 'GBP' : 'USD',
      jobDescription: jobData.description,
      datePosted: new Date().toISOString().split('T')[0],
      externalId: `USER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workType: jobData.workType,
      jobType: jobData.jobType,
      experienceLevel: jobData.experienceLevel,
      skills: jobData.skills,
      requirements: jobData.requirements,
      benefits: jobData.benefits
    }));
    
    // Add all new jobs to source2
    source2Jobs.push(...source2FormatJobs);
    
    // Save to file for persistence
    const source2Path = path.join(__dirname, '../data/source2.js');
    const fileContent = `// Source 2: Career Connect - Different data format
const source2Jobs = ${JSON.stringify(source2Jobs, null, 2)};

module.exports = source2Jobs;
`;
    
    try {
      fs.writeFileSync(source2Path, fileContent, 'utf8');
      console.log(`✅ ${jobs.length} jobs saved to source2.js file`);
      
      // Clear Node.js module cache to reload the file
      delete require.cache[require.resolve('../data/source2')];
      
      // Reload source2 with the new jobs
      const updatedSource2Jobs = require('../data/source2');
      
      // Re-run ingestion with the fresh data
      const stats = ingestionService.ingestAll({
        source1: source1Jobs,
        source2: updatedSource2Jobs
      });
      
      console.log(`📊 Re-ingestion complete: ${stats.uniqueJobs} unique jobs (${stats.duplicatesRemoved} duplicates removed)`);
      
      return res.json({
        success: true,
        message: `${jobs.length} jobs posted successfully and re-ingested`,
        jobsPosted: jobs.length,
        stats: stats
      });
    } catch (writeError) {
      console.error('⚠️ Warning: Could not persist jobs to file:', writeError.message);
      
      // Fallback: ingest with in-memory data only
      const stats = ingestionService.ingestAll({
        source1: source1Jobs,
        source2: source2Jobs
      });
      
      return res.json({
        success: true,
        message: `${jobs.length} jobs posted successfully (in-memory only)`,
        jobsPosted: jobs.length,
        stats: stats,
        warning: 'Jobs were not persisted to disk'
      });
    }
  } catch (error) {
    console.error('Bulk job posting error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/jobs/rejected
 * Get all rejected jobs (duplicates that were not added)
 */
app.get('/api/jobs/rejected', (req, res) => {
  try {
    res.json({
      success: true,
      data: rejectedJobs,
      count: rejectedJobs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/jobs/:id
 * Get a specific job by ID
 */
app.get('/api/jobs/:id', (req, res) => {
  try {
    const job = ingestionService.getJobById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stats
 * Get ingestion statistics
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = ingestionService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/suggestions
 * Get search suggestions (popular keywords, locations, companies)
 */
app.get('/api/suggestions', (req, res) => {
  try {
    const suggestions = searchService.getSuggestions();
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/locations
 * Get all unique job locations
 */
app.get('/api/locations', (req, res) => {
  try {
    const locations = searchService.getUniqueLocations();
    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/companies
 * Get all unique companies
 */
app.get('/api/companies', (req, res) => {
  try {
    const companies = searchService.getUniqueCompanies();
    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/resume/analyze
 * Analyze resume and get job recommendations with AI-powered scoring
 */
app.post('/api/resume/analyze', async (req, res) => {
  try {
    const { resumeText, topN, minScore } = req.body;
    
    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Resume text is required'
      });
    }
    
    let result;
    if (minScore !== undefined && minScore !== null) {
      result = await agenticRAG.getRecommendationsAboveThreshold(resumeText, parseFloat(minScore));
    } else if (topN) {
      result = await agenticRAG.getTopRecommendations(resumeText, parseInt(topN));
    } else {
      result = await agenticRAG.processResume(resumeText);
      result.recommendations = result.rankedJobs;
    }
    
    res.json(result);
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/resume/match
 * Quick match - just return top matches without full analysis
 */
app.post('/api/resume/match', async (req, res) => {
  try {
    const { resumeText, limit = 10 } = req.body;
    
    if (!resumeText) {
      return res.status(400).json({
        success: false,
        error: 'Resume text is required'
      });
    }
    
    const result = await agenticRAG.getTopRecommendations(resumeText, parseInt(limit));
    
    res.json({
      success: true,
      matches: result.recommendations,
      insights: result.insights
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/chat
 * AI-powered chat for job search assistance
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, resumeText } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }
    
    // Get all jobs for context
    const allJobs = ingestionService.getAllJobs();
    
    // Create context for AI
    let context = `You are a helpful AI job search assistant. You have access to ${allJobs.length} job listings.`;
    
    if (resumeText) {
      context += `\n\nUser's Resume Summary:\n${resumeText.substring(0, 500)}...`;
    }
    
    // Check if user is asking about specific jobs
    const jobKeywords = message.toLowerCase();
    let relevantJobs = [];
    
    if (jobKeywords.includes('job') || jobKeywords.includes('position') || jobKeywords.includes('role')) {
      // Extract potential search terms
      const terms = message.toLowerCase().match(/\b(software|engineer|developer|manager|designer|data|frontend|backend|fullstack|devops)\b/g);
      
      if (terms && terms.length > 0) {
        relevantJobs = allJobs.filter(job => 
          terms.some(term => job.title.toLowerCase().includes(term))
        ).slice(0, 5);
      }
    }
    
    // Use Gemini AI if available
    if (agenticRAG.model) {
      try {
        const prompt = `${context}

User Question: ${message}

${relevantJobs.length > 0 ? `\nRelevant Jobs Found:\n${relevantJobs.map((j, i) => 
  `${i + 1}. ${j.title} at ${j.company} - ${j.location.normalized}`
).join('\n')}` : ''}

Provide a helpful, conversational response. If discussing jobs, mention specific positions from the list above.`;

        const result = await agenticRAG.model.generateContent(prompt);
        const response = result.response.text();
        
        return res.json({
          success: true,
          message: response,
          relevantJobs: relevantJobs.map(j => ({
            id: j.id,
            title: j.title,
            company: j.company,
            location: j.location.normalized
          })),
          aiPowered: true
        });
      } catch (aiError) {
        console.error('AI chat error:', aiError);
        // Fall through to fallback
      }
    }
    
    // Fallback response
    let fallbackResponse = '';
    
    if (relevantJobs.length > 0) {
      fallbackResponse = `I found ${relevantJobs.length} jobs that might interest you:\n\n`;
      relevantJobs.forEach((job, i) => {
        fallbackResponse += `${i + 1}. **${job.title}** at ${job.company}\n   📍 ${job.location.normalized}\n\n`;
      });
      fallbackResponse += `Would you like more details about any of these positions?`;
    } else if (jobKeywords.includes('help') || jobKeywords.includes('how')) {
      fallbackResponse = `I can help you with:\n\n• Finding jobs based on skills or keywords\n• Analyzing your resume for job matches\n• Getting details about specific positions\n• Career advice and interview preparation\n\nWhat would you like to know?`;
    } else {
      fallbackResponse = `I have access to ${allJobs.length} job listings across various companies and locations. Try asking me:\n\n• "Show me software engineer jobs"\n• "What jobs match my resume?"\n• "Tell me about remote positions"\n\nHow can I help you today?`;
    }
    
    res.json({
      success: true,
      message: fallbackResponse,
      relevantJobs: relevantJobs.map(j => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location.normalized
      })),
      aiPowered: false
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============= NEW FEATURES =============

/**
 * POST /api/favorites/add
 * Add job to favorites
 */
app.post('/api/favorites/add', (req, res) => {
  try {
    const { userId, jobId } = req.body;
    
    if (!userId || !jobId) {
      return res.status(400).json({
        success: false,
        error: 'userId and jobId are required'
      });
    }
    
    const result = favoritesService.addFavorite(userId, jobId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/favorites/remove
 * Remove job from favorites
 */
app.post('/api/favorites/remove', (req, res) => {
  try {
    const { userId, jobId } = req.body;
    
    if (!userId || !jobId) {
      return res.status(400).json({
        success: false,
        error: 'userId and jobId are required'
      });
    }
    
    const result = favoritesService.removeFavorite(userId, jobId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/favorites/:userId
 * Get all favorited jobs for a user
 */
app.get('/api/favorites/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const result = favoritesService.getFavoriteJobs(userId, ingestionService);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/applications/apply
 * Submit job application
 */
app.post('/api/applications/apply', (req, res) => {
  try {
    const { userId, jobId } = req.body;
    
    if (!userId || !jobId) {
      return res.status(400).json({
        success: false,
        error: 'userId and jobId are required'
      });
    }
    
    // Check if already applied
    if (applicationService.hasApplied(userId, jobId)) {
      return res.status(400).json({
        success: false,
        error: 'Already applied to this job'
      });
    }
    
    const job = ingestionService.getJobById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    const result = applicationService.applyToJob(userId, jobId, job);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/applications/:id/status
 * Update application status
 */
app.patch('/api/applications/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { userId, status, note } = req.body;
    
    if (!userId || !status) {
      return res.status(400).json({
        success: false,
        error: 'userId and status are required'
      });
    }
    
    const result = applicationService.updateStatus(userId, id, status, note);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/applications/:userId
 * Get all applications for a user
 */
app.get('/api/applications/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { status, company } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (company) filters.company = company;
    
    const result = applicationService.getUserApplications(userId, filters);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/applications/:userId/stats
 * Get application statistics for a user
 */
app.get('/api/applications/:userId/stats', (req, res) => {
  try {
    const { userId } = req.params;
    const stats = applicationService.getUserStats(userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/jobs/:id/similar
 * Get similar jobs
 */
app.get('/api/jobs/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 5;
    const useAI = req.query.ai !== 'false';
    
    const result = useAI 
      ? await similarJobsService.getAISimilarJobs(id, limit)
      : similarJobsService.getSimilarJobs(id, limit);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/jobs/:id/interview-prep
 * Get interview preparation materials
 */
app.post('/api/jobs/:id/interview-prep', async (req, res) => {
  try {
    const { id } = req.params;
    const { resumeText } = req.body;
    
    const job = ingestionService.getJobById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    const result = await interviewPrepService.generateQuestions(job, resumeText);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/filters/options
 * Get available filter options
 */
app.get('/api/filters/options', (req, res) => {
  try {
    const allJobs = ingestionService.getAllJobs();
    const options = AdvancedFiltersService.getFilterOptions(allJobs);
    
    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/jobs/advanced-filter
 * Advanced filtering with work type, job type, experience level, etc.
 */
app.post('/api/jobs/advanced-filter', (req, res) => {
  try {
    const filters = req.body;
    const allJobs = ingestionService.getAllJobs();
    const filteredJobs = AdvancedFiltersService.filterJobs(allJobs, filters);
    
    res.json({
      success: true,
      data: filteredJobs,
      count: filteredJobs.length,
      filters: filters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api
 * API documentation
 */
app.get('/api', (req, res) => {
  res.json({
    message: 'Job Search Platform API with Agentic RAG System',
    version: '3.0.0',
    endpoints: {
      // Core endpoints
      'GET /api/jobs': 'Search jobs (params: keyword, location, page, limit)',
      'GET /api/jobs/search': 'Advanced search (params: keyword, location, minSalary, maxSalary, currency, company, page, limit)',
      'GET /api/jobs/:id': 'Get job by ID',
      'GET /api/stats': 'Get ingestion statistics',
      'GET /api/suggestions': 'Get search suggestions',
      'GET /api/locations': 'Get all locations',
      'GET /api/companies': 'Get all companies',
      
      // Job posting
      'POST /api/jobs/post': 'Post a new job with auto re-ingestion (body: {title, company, location, description, salary?, workType?, jobType?, ...})',
      'POST /api/jobs/bulk-post': 'Post multiple jobs at once (body: {jobs: [{title, company, location, description, ...}, ...]})',
      'GET /api/jobs/rejected': 'Get rejected jobs (duplicates that were not added)',
      
      // Resume & AI endpoints
      'POST /api/resume/analyze': 'Analyze resume and get ranked job recommendations (body: {resumeText, topN?, minScore?})',
      'POST /api/resume/match': 'Quick resume matching (body: {resumeText, limit?})',
      
      // Favorites endpoints
      'POST /api/favorites/add': 'Add job to favorites (body: {userId, jobId})',
      'POST /api/favorites/remove': 'Remove from favorites (body: {userId, jobId})',
      'GET /api/favorites/:userId': 'Get user favorites',
      
      // Applications endpoints
      'POST /api/applications/apply': 'Apply to job (body: {userId, jobId})',
      'PATCH /api/applications/:id/status': 'Update application status (body: {userId, status, note?})',
      'GET /api/applications/:userId': 'Get user applications (query: status?, company?)',
      'GET /api/applications/:userId/stats': 'Get application statistics',
      
      // Similar jobs & Interview prep
      'GET /api/jobs/:id/similar': 'Get similar jobs (query: limit?, ai?)',
      'POST /api/jobs/:id/interview-prep': 'Get interview questions (body: {resumeText?})',
      
      // Advanced filters
      'GET /api/filters/options': 'Get available filter options',
      'POST /api/jobs/advanced-filter': 'Advanced filtering (body: {workType?, jobType?, experienceLevel?, postedWithinDays?, skills?})'
    },
    examples: {
      basicSearch: '/api/jobs?keyword=engineer&location=usa',
      advancedSearch: '/api/jobs/search?keyword=developer&location=london&minSalary=60000&currency=GBP',
      byCompany: '/api/jobs/search?company=techcorp',
      postJob: 'POST /api/jobs/post with body: {title: "Senior Developer", company: "TechCo", location: "San Francisco", description: "...", salary: "120000-150000", workType: "remote", jobType: "full-time"}',
      bulkPostJobs: 'POST /api/jobs/bulk-post with body: {jobs: [{title: "...", company: "...", location: "...", description: "..."}, {...}]}',
      resumeAnalysis: 'POST /api/resume/analyze with JSON body: {resumeText: "your resume..."}',
      similarJobs: '/api/jobs/JOB-1/similar?limit=5&ai=true',
      interviewPrep: 'POST /api/jobs/JOB-1/interview-prep with body: {resumeText: "..."}',
      applyToJob: 'POST /api/applications/apply with body: {userId: "user123", jobId: "JOB-1"}',
      addFavorite: 'POST /api/favorites/add with body: {userId: "user123", jobId: "JOB-1"}'
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`🤖 AI Chat Interface: http://localhost:${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/api`);
  console.log(`🔍 Try searching: "Show me software engineer jobs in USA"`);
  console.log(`📝 Post a job: POST http://localhost:${PORT}/api/jobs/post\n`);
});

module.exports = app;
