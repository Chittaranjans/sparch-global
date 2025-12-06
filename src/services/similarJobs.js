const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Similar Jobs Recommendation Service
 * Uses AI to find similar jobs based on job description, skills, and role
 */
class SimilarJobsService {
  constructor(jobIngestionService) {
    this.jobIngestionService = jobIngestionService;
    
    // Initialize Gemini AI if available
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    } else {
      this.model = null;
    }
  }

  /**
   * Calculate similarity score between two jobs (0-1)
   */
  calculateSimilarity(job1, job2) {
    let score = 0;
    let factors = 0;

    // Title similarity (30%)
    const titleSimilarity = this.textSimilarity(
      job1.title.toLowerCase(),
      job2.title.toLowerCase()
    );
    score += titleSimilarity * 0.3;
    factors += 0.3;

    // Location similarity (20%)
    const location1 = `${job1.location.city} ${job1.location.country}`.toLowerCase();
    const location2 = `${job2.location.city} ${job2.location.country}`.toLowerCase();
    const locationSimilarity = this.textSimilarity(location1, location2);
    score += locationSimilarity * 0.2;
    factors += 0.2;

    // Salary range overlap (20%)
    if (job1.salary.min && job2.salary.min) {
      const salaryOverlap = this.salaryOverlap(job1.salary, job2.salary);
      score += salaryOverlap * 0.2;
      factors += 0.2;
    }

    // Description keywords (30%)
    const descSimilarity = this.keywordSimilarity(
      job1.description || '',
      job2.description || ''
    );
    score += descSimilarity * 0.3;
    factors += 0.3;

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Simple text similarity using common words
   */
  textSimilarity(text1, text2) {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate keyword similarity
   */
  keywordSimilarity(desc1, desc2) {
    const keywords = [
      'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue',
      'senior', 'junior', 'lead', 'manager', 'engineer', 'developer',
      'frontend', 'backend', 'fullstack', 'devops', 'aws', 'cloud',
      'remote', 'hybrid', 'onsite', 'full-time', 'contract'
    ];

    const desc1Lower = desc1.toLowerCase();
    const desc2Lower = desc2.toLowerCase();

    const matches = keywords.filter(kw => 
      desc1Lower.includes(kw) && desc2Lower.includes(kw)
    ).length;

    return matches / keywords.length;
  }

  /**
   * Calculate salary range overlap
   */
  salaryOverlap(salary1, salary2) {
    const min1 = salary1.min || 0;
    const max1 = salary1.max || min1 * 1.5;
    const min2 = salary2.min || 0;
    const max2 = salary2.max || min2 * 1.5;

    const overlapStart = Math.max(min1, min2);
    const overlapEnd = Math.min(max1, max2);
    
    if (overlapStart >= overlapEnd) return 0;

    const overlap = overlapEnd - overlapStart;
    const totalRange = Math.max(max1, max2) - Math.min(min1, min2);

    return totalRange > 0 ? overlap / totalRange : 0;
  }

  /**
   * Get similar jobs using pattern matching
   */
  getSimilarJobs(jobId, limit = 5) {
    const sourceJob = this.jobIngestionService.getJobById(jobId);
    
    if (!sourceJob) {
      return {
        success: false,
        message: 'Job not found'
      };
    }

    const allJobs = this.jobIngestionService.getAllJobs();
    
    // Calculate similarity for all jobs except the source
    const similarities = allJobs
      .filter(job => job.id !== jobId)
      .map(job => ({
        job,
        similarity: this.calculateSimilarity(sourceJob, job),
        matchReasons: this.getMatchReasons(sourceJob, job)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return {
      success: true,
      sourceJob: {
        id: sourceJob.id,
        title: sourceJob.title,
        company: sourceJob.company
      },
      similarJobs: similarities.map(s => ({
        ...s.job,
        similarityScore: Math.round(s.similarity * 100),
        matchReasons: s.matchReasons
      })),
      count: similarities.length
    };
  }

  /**
   * Get reasons why jobs match
   */
  getMatchReasons(job1, job2) {
    const reasons = [];

    // Similar title
    if (this.textSimilarity(job1.title.toLowerCase(), job2.title.toLowerCase()) > 0.3) {
      reasons.push('Similar job title');
    }

    // Same company
    if (job1.company === job2.company) {
      reasons.push('Same company');
    }

    // Same location
    if (job1.location.city === job2.location.city) {
      reasons.push('Same location');
    }

    // Similar salary range
    if (job1.salary.min && job2.salary.min) {
      if (this.salaryOverlap(job1.salary, job2.salary) > 0.5) {
        reasons.push('Similar salary range');
      }
    }

    return reasons.length > 0 ? reasons : ['Related field'];
  }

  /**
   * AI-powered similar jobs (if Gemini is available)
   */
  async getAISimilarJobs(jobId, limit = 5) {
    if (!this.model) {
      console.log('⚠️ AI not available, using pattern matching');
      return this.getSimilarJobs(jobId, limit);
    }

    const sourceJob = this.jobIngestionService.getJobById(jobId);
    if (!sourceJob) {
      return {
        success: false,
        message: 'Job not found'
      };
    }

    try {
      const allJobs = this.jobIngestionService.getAllJobs()
        .filter(job => job.id !== jobId);

      const prompt = `You are a job matching AI. Analyze this job and rank the following jobs by similarity.

Source Job:
- Title: ${sourceJob.title}
- Company: ${sourceJob.company}
- Location: ${sourceJob.location.city}, ${sourceJob.location.country}
- Description: ${sourceJob.description || 'N/A'}

Other Jobs (JSON):
${JSON.stringify(allJobs.map(j => ({
  id: j.id,
  title: j.title,
  company: j.company,
  location: `${j.location.city}, ${j.location.country}`,
  description: (j.description || '').substring(0, 200)
})))}

Return ONLY a JSON array of the top ${limit} most similar job IDs in order, with similarity scores (0-100) and match reasons.
Format: [{"id": "JOB-X", "score": 85, "reasons": ["Similar role", "Same industry"]}]`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const cleanedText = text.replace(/```json\n?|```\n?/g, '').trim();
      const aiRanking = JSON.parse(cleanedText);

      const similarJobs = aiRanking.map(ranking => {
        const job = this.jobIngestionService.getJobById(ranking.id);
        return job ? {
          ...job,
          similarityScore: ranking.score,
          matchReasons: ranking.reasons,
          aiPowered: true
        } : null;
      }).filter(j => j !== null);

      return {
        success: true,
        sourceJob: {
          id: sourceJob.id,
          title: sourceJob.title,
          company: sourceJob.company
        },
        similarJobs,
        count: similarJobs.length,
        aiPowered: true
      };

    } catch (error) {
      console.error('AI similar jobs error:', error.message);
      return this.getSimilarJobs(jobId, limit);
    }
  }
}

module.exports = SimilarJobsService;
