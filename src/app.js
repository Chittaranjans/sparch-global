const express = require('express');
const path = require('path');

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

// Import data sources
const source1Jobs = require('../data/source1');
const source2Jobs = require('../data/source2');

// Initialize services
const ingestionService = new JobIngestionService();
const searchService = new JobSearchService(ingestionService);
const agenticRAG = new AgenticRAGSystem(ingestionService);

// Create Express app
const app = express();
app.use(express.json({ limit: '10mb' })); // Increased limit for resume uploads
app.use(express.text({ limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Enable CORS for frontend integration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
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
 * GET /api
 * API documentation
 */
app.get('/api', (req, res) => {
  res.json({
    message: 'Job Search Platform API with Agentic RAG System',
    version: '2.0.0',
    endpoints: {
      'GET /api/jobs': 'Search jobs (params: keyword, location, page, limit)',
      'GET /api/jobs/search': 'Advanced search (params: keyword, location, minSalary, maxSalary, currency, company, page, limit)',
      'GET /api/jobs/:id': 'Get job by ID',
      'GET /api/stats': 'Get ingestion statistics',
      'GET /api/suggestions': 'Get search suggestions',
      'GET /api/locations': 'Get all locations',
      'GET /api/companies': 'Get all companies',
      'POST /api/resume/analyze': 'Analyze resume and get ranked job recommendations (body: {resumeText, topN?, minScore?})',
      'POST /api/resume/match': 'Quick resume matching (body: {resumeText, limit?})'
    },
    examples: {
      basicSearch: '/api/jobs?keyword=engineer&location=usa',
      advancedSearch: '/api/jobs/search?keyword=developer&location=london&minSalary=60000&currency=GBP',
      byCompany: '/api/jobs/search?company=techcorp',
      resumeAnalysis: 'POST /api/resume/analyze with JSON body: {resumeText: "your resume..."}'
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`🤖 AI Chat Interface: http://localhost:${PORT}`);
  console.log(`📖 API Documentation: http://localhost:${PORT}/api`);
  console.log(`🔍 Try searching: "Show me software engineer jobs in USA"\n`);
});

module.exports = app;
