const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Resume Analysis Service
 * Analyzes resume and extracts key information for job matching
 */
class ResumeAnalyzer {
  
  /**
   * Parse resume text and extract structured information using Gemini AI
   */
  static async analyzeResume(resumeText) {
    try {
      // Initialize Gemini AI with API key from environment
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.log('⚠️ GEMINI_API_KEY not found in environment, using fallback');
        return this.fallbackAnalysis(resumeText);
      }
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Analyze this resume and extract structured information in JSON format:

Resume:
${resumeText}

Extract:
1. skills: Array of technical and professional skills (programming languages, frameworks, tools, soft skills)
2. experience_years: Number of years of professional experience (numeric, best estimate)
3. education: Array of degrees/certifications (e.g., ["Bachelor's in Computer Science", "AWS Certified"])
4. job_roles: Array of job titles/roles mentioned in experience (e.g., ["Senior Software Engineer", "Frontend Developer"])
5. preferred_locations: Array of locations mentioned or preferred (cities, countries)
6. summary: Brief professional summary (2-3 sentences highlighting key strengths)

Return ONLY valid JSON without any markdown formatting or code blocks.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse AI response
      let aiAnalysis;
      try {
        // Remove markdown code blocks if present
        const cleanedText = text.replace(/```json\n?|```\n?/g, '').trim();
        aiAnalysis = JSON.parse(cleanedText);
      } catch (e) {
        console.log('⚠️ AI response parsing failed, using fallback analysis');
        return this.fallbackAnalysis(resumeText);
      }

      const analysis = {
        skills: aiAnalysis.skills || this.extractSkills(resumeText),
        experience: aiAnalysis.experience_years || this.extractExperience(resumeText),
        education: aiAnalysis.education || this.extractEducation(resumeText),
        roles: aiAnalysis.job_roles || this.extractRoles(resumeText),
        locations: aiAnalysis.preferred_locations || this.extractLocations(resumeText),
        summary: aiAnalysis.summary || 'Professional with diverse experience',
        rawText: resumeText,
        aiPowered: true
      };

      console.log('✨ AI-Powered Resume Analysis Complete');
      return analysis;
    } catch (error) {
      console.error('❌ Gemini AI error:', error.message);
      return this.fallbackAnalysis(resumeText);
    }
  }

  /**
   * Fallback analysis without AI
   */
  static fallbackAnalysis(resumeText) {
    console.log('🔄 Using fallback pattern-matching analysis');
    const education = this.extractEducation(resumeText);
    return {
      skills: this.extractSkills(resumeText),
      experience: this.extractExperience(resumeText),
      education: Array.isArray(education) ? education : (education ? [education] : ['Not specified']),
      roles: this.extractRoles(resumeText),
      locations: this.extractLocations(resumeText),
      summary: 'Experienced professional with relevant technical skills',
      rawText: resumeText,
      aiPowered: false
    };
  }

  /**
   * Extract technical skills from resume
   */
  static extractSkills(text) {
    const lowerText = text.toLowerCase();
    const skills = new Set();
    
    // Technical skills database
    const skillsDatabase = {
      languages: ['javascript', 'python', 'java', 'c++', 'typescript', 'ruby', 'go', 'rust', 'php', 'c#', 'swift', 'kotlin'],
      frameworks: ['react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'rails', 'laravel', 'next.js'],
      databases: ['mongodb', 'postgresql', 'mysql', 'redis', 'dynamodb', 'cassandra', 'elasticsearch'],
      cloud: ['aws', 'azure', 'gcp', 'google cloud', 'heroku', 'docker', 'kubernetes', 'jenkins'],
      tools: ['git', 'jira', 'figma', 'sketch', 'photoshop', 'illustrator'],
      methodologies: ['agile', 'scrum', 'devops', 'ci/cd', 'tdd', 'microservices'],
      general: ['frontend', 'backend', 'full stack', 'machine learning', 'data science', 'ux design', 'ui design']
    };
    
    // Extract all skills
    Object.values(skillsDatabase).forEach(category => {
      category.forEach(skill => {
        if (lowerText.includes(skill)) {
          skills.add(skill);
        }
      });
    });
    
    return Array.from(skills);
  }

  /**
   * Extract years of experience
   */
  static extractExperience(text) {
    const lowerText = text.toLowerCase();
    
    // Look for experience patterns
    const patterns = [
      /(\d+)\+?\s*years?\s*(?:of\s*)?experience/i,
      /experience[:\s]*(\d+)\+?\s*years?/i,
      /(\d+)\+?\s*yrs?\s*experience/i
    ];
    
    for (const pattern of patterns) {
      const match = lowerText.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }
    
    // Count job positions mentioned (rough estimate)
    const jobKeywords = ['software engineer', 'developer', 'designer', 'manager', 'analyst'];
    let jobCount = 0;
    jobKeywords.forEach(keyword => {
      const matches = lowerText.match(new RegExp(keyword, 'g'));
      if (matches) jobCount += matches.length;
    });
    
    // Estimate: each position ~2 years
    return Math.min(jobCount * 2, 15);
  }

  /**
   * Extract education level
   */
  static extractEducation(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('phd') || lowerText.includes('ph.d') || lowerText.includes('doctorate')) {
      return 'PhD';
    }
    if (lowerText.includes('master') || lowerText.includes('msc') || lowerText.includes('m.s.') || lowerText.includes('mba')) {
      return 'Masters';
    }
    if (lowerText.includes('bachelor') || lowerText.includes('bsc') || lowerText.includes('b.s.') || lowerText.includes('b.tech')) {
      return 'Bachelors';
    }
    
    return 'Not specified';
  }

  /**
   * Extract preferred job roles
   */
  static extractRoles(text) {
    const lowerText = text.toLowerCase();
    const roles = new Set();
    
    const roleKeywords = [
      'software engineer', 'senior software engineer', 'junior software engineer',
      'frontend developer', 'backend developer', 'full stack developer', 'fullstack developer',
      'devops engineer', 'data scientist', 'data engineer', 'machine learning engineer',
      'product manager', 'project manager', 'designer', 'ux designer', 'ui designer',
      'qa engineer', 'test engineer', 'analyst', 'data analyst'
    ];
    
    roleKeywords.forEach(role => {
      if (lowerText.includes(role)) {
        roles.add(role);
      }
    });
    
    return Array.from(roles);
  }

  /**
   * Extract location preferences
   */
  static extractLocations(text) {
    const lowerText = text.toLowerCase();
    const locations = new Set();
    
    const commonLocations = [
      'usa', 'united states', 'uk', 'united kingdom', 'canada', 'germany', 
      'france', 'singapore', 'ireland', 'india', 'australia',
      'san francisco', 'new york', 'london', 'berlin', 'paris', 'toronto',
      'seattle', 'boston', 'austin', 'chicago'
    ];
    
    commonLocations.forEach(location => {
      if (lowerText.includes(location)) {
        locations.add(location);
      }
    });
    
    return Array.from(locations);
  }
}

module.exports = ResumeAnalyzer;
