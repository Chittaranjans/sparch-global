const ResumeAnalyzer = require('./resumeAnalyzer');
const JobMatchingAgent = require('./jobMatchingAgent');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Agentic RAG System Orchestrator
 * Coordinates resume analysis and job matching with AI-powered insights
 */
class AgenticRAGSystem {
  constructor(jobIngestionService) {
    this.jobIngestionService = jobIngestionService;
    
    // Initialize Gemini AI for career insights with API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    } else {
      console.log('⚠️ GEMINI_API_KEY not found, AI insights will use fallback mode');
      this.genAI = null;
      this.model = null;
    }
  }

  /**
   * Process resume and return ranked job recommendations with AI insights
   */
  async processResume(resumeText) {
    console.log('\n🤖 Agentic RAG System Starting...');
    console.log('📄 Analyzing resume with AI...\n');
    
    // Step 1: Analyze resume using AI
    const resumeAnalysis = await ResumeAnalyzer.analyzeResume(resumeText);
    console.log('✅ Resume Analysis Complete:');
    console.log(`   - Skills found: ${resumeAnalysis.skills.length}`);
    console.log(`   - Roles identified: ${resumeAnalysis.roles.length}`);
    console.log(`   - Experience: ${resumeAnalysis.experience} years`);
    console.log(`   - Education: ${Array.isArray(resumeAnalysis.education) ? resumeAnalysis.education.join(', ') : resumeAnalysis.education}`);
    console.log(`   - AI-Powered: ${resumeAnalysis.aiPowered ? '✨ Yes' : '🔄 Fallback'}\n`);
    
    // Step 2: Get all available jobs
    const allJobs = this.jobIngestionService.getAllJobs();
    console.log(`🔍 Evaluating ${allJobs.length} jobs...\n`);
    
    // Step 3: Score and rank jobs
    const rankedJobs = JobMatchingAgent.rankJobs(allJobs, resumeAnalysis);
    console.log('✅ Job Matching Complete\n');
    
    // Step 4: Generate AI-powered career insights
    const insights = await this.generateAIInsights(resumeAnalysis, rankedJobs);
    console.log('📊 AI Career Insights Generated');
    console.log(`   - Excellent matches: ${rankedJobs.filter(j => j.matchLevel === 'Excellent').length}`);
    console.log(`   - Good matches: ${rankedJobs.filter(j => j.matchLevel === 'Good').length}`);
    console.log(`   - Recommendations: ${insights.recommendations.length}\n`);
    
    return {
      success: true,
      resumeAnalysis,
      rankedJobs,
      insights,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate AI-powered career insights and recommendations
   */
  async generateAIInsights(resumeAnalysis, rankedJobs) {
    try {
      // Check if AI model is available
      if (!this.model) {
        console.log('⚠️ AI model not available, using fallback insights');
        return this.fallbackInsights(resumeAnalysis, rankedJobs);
      }
      
      const topJobs = rankedJobs.slice(0, 5).map(j => ({
        title: j.job.title,
        company: j.job.company,
        score: j.percentage,
        matchLevel: j.matchLevel,
        location: j.job.location.city || j.job.location.country
      }));

      const educationStr = Array.isArray(resumeAnalysis.education) ? resumeAnalysis.education.join(', ') : resumeAnalysis.education;
      const rolesStr = resumeAnalysis.roles && resumeAnalysis.roles.length > 0 ? resumeAnalysis.roles.join(', ') : 'Not specified';
      
      const prompt = `As an expert career advisor AI, analyze this candidate's resume and job matches to provide personalized career recommendations:

**Resume Profile:**
- Skills: ${resumeAnalysis.skills.join(', ')}
- Experience: ${resumeAnalysis.experience} years
- Recent Roles: ${rolesStr}
- Education: ${educationStr}
- Summary: ${resumeAnalysis.summary}

**Top Job Matches:**
${topJobs.map((j, i) => `${i + 1}. ${j.title} at ${j.company} - ${j.location} (${j.score}% match - ${j.matchLevel})`).join('\n')}

**Task:** Provide 3-5 specific, actionable career recommendations to help this candidate:
- Improve their job match scores
- Bridge any skills gaps
- Position themselves better for their target roles
- Strategic next steps for career growth

Return your recommendations as a JSON array of strings. Each recommendation should be:
- Specific and actionable (not generic advice)
- Based on the actual match scores and skills analysis
- Focused on immediate next steps
- Professional and encouraging

Example format: ["Consider obtaining AWS certification to strengthen your cloud skills for the DevOps Engineer role", "Add React projects to your portfolio to increase matches for Frontend positions"]

Return ONLY the JSON array without any markdown formatting.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      try {
        const cleanedText = text.replace(/```json\n?|```\n?/g, '').trim();
        const recommendations = JSON.parse(cleanedText);
        
        return {
          recommendations: Array.isArray(recommendations) ? recommendations : this.fallbackRecommendations(resumeAnalysis, rankedJobs),
          topMatches: topJobs.slice(0, 3).map(j => j.title),
          averageScore: Math.round(rankedJobs.reduce((sum, j) => sum + j.score, 0) / rankedJobs.length * 100),
          excellentMatches: rankedJobs.filter(j => j.matchLevel === 'Excellent').length,
          goodMatches: rankedJobs.filter(j => j.matchLevel === 'Good').length,
          aiPowered: true
        };
      } catch (e) {
        console.log('⚠️ AI insights parsing failed, using fallback');
        return this.fallbackInsights(resumeAnalysis, rankedJobs);
      }
    } catch (error) {
      console.error('❌ AI insights error:', error.message);
      return this.fallbackInsights(resumeAnalysis, rankedJobs);
    }
  }

  /**
   * Fallback insights without AI
   */
  fallbackInsights(resumeAnalysis, rankedJobs) {
    const recommendations = this.fallbackRecommendations(resumeAnalysis, rankedJobs);
    const avgScore = rankedJobs.reduce((sum, j) => sum + j.score, 0) / rankedJobs.length;
    
    return {
      recommendations,
      topMatches: rankedJobs.slice(0, 3).map(j => j.job.title),
      averageScore: Math.round(avgScore * 100),
      excellentMatches: rankedJobs.filter(j => j.matchLevel === 'Excellent').length,
      goodMatches: rankedJobs.filter(j => j.matchLevel === 'Good').length,
      aiPowered: false
    };
  }

  /**
   * Generate fallback recommendations
   */
  fallbackRecommendations(resumeAnalysis, rankedJobs) {
    const recommendations = [];
    const avgScore = rankedJobs.reduce((sum, j) => sum + j.score, 0) / rankedJobs.length;
    
    if (avgScore < 0.6) {
      recommendations.push('Consider adding more relevant technical skills to strengthen your resume');
      recommendations.push('Review top job matches and identify common skill requirements');
    }
    
    if (resumeAnalysis.experience < 2) {
      recommendations.push('Focus on entry-level and junior positions to build experience');
      recommendations.push('Consider internships or contract roles to gain practical experience');
    } else if (resumeAnalysis.experience >= 5) {
      recommendations.push('Target senior or lead positions that match your experience level');
      recommendations.push('Highlight leadership and mentorship experience in your resume');
    }
    
    if (resumeAnalysis.locations.length === 0) {
      recommendations.push('Specify preferred work locations to get more targeted job matches');
    }
    
    if (resumeAnalysis.skills.length < 10) {
      recommendations.push('Expand your technical skills section to increase visibility to recruiters');
    }
    
    return recommendations.slice(0, 5);
  }

  /**
   * Get top N job recommendations
   */
  async getTopRecommendations(resumeText, topN = 5) {
    const result = await this.processResume(resumeText);
    return {
      success: true,
      recommendations: result.rankedJobs.slice(0, topN),
      insights: result.insights,
      resumeAnalysis: result.resumeAnalysis
    };
  }

  /**
   * Filter recommendations by minimum score
   */
  getRecommendationsAboveThreshold(resumeText, minScore = 0.6) {
    const result = this.processResume(resumeText);
    const filtered = result.rankedJobs.filter(job => job.score >= minScore);
    
    return {
      success: true,
      recommendations: filtered,
      insights: result.insights,
      resumeAnalysis: result.resumeAnalysis,
      threshold: minScore
    };
  }
}

module.exports = AgenticRAGSystem;
