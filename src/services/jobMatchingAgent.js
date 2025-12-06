/**
 * Job Matching Agent
 * Scores and ranks jobs based on resume analysis
 */
class JobMatchingAgent {
  
  /**
   * Score a single job against resume analysis
   */
  static scoreJob(job, resumeAnalysis) {
    const scores = {
      skillMatch: this.calculateSkillMatch(job, resumeAnalysis),
      roleMatch: this.calculateRoleMatch(job, resumeAnalysis),
      locationMatch: this.calculateLocationMatch(job, resumeAnalysis),
      experienceMatch: this.calculateExperienceMatch(job, resumeAnalysis)
    };
    
    // Weighted scoring
    const weights = {
      skillMatch: 0.40,      // 40% weight
      roleMatch: 0.35,       // 35% weight
      locationMatch: 0.15,   // 15% weight
      experienceMatch: 0.10  // 10% weight
    };
    
    const totalScore = 
      scores.skillMatch * weights.skillMatch +
      scores.roleMatch * weights.roleMatch +
      scores.locationMatch * weights.locationMatch +
      scores.experienceMatch * weights.experienceMatch;
    
    return {
      job,
      score: Math.round(totalScore * 100) / 100,
      breakdown: scores,
      percentage: Math.round(totalScore * 100),
      matchLevel: this.getMatchLevel(totalScore)
    };
  }

  /**
   * Calculate skill match score
   */
  static calculateSkillMatch(job, resumeAnalysis) {
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    const userSkills = resumeAnalysis.skills;
    
    if (userSkills.length === 0) return 0.5; // Default if no skills found
    
    let matchedSkills = 0;
    userSkills.forEach(skill => {
      if (jobText.includes(skill.toLowerCase())) {
        matchedSkills++;
      }
    });
    
    // Calculate score (max 1.0)
    const score = Math.min(matchedSkills / Math.max(userSkills.length * 0.5, 1), 1.0);
    return score;
  }

  /**
   * Calculate role match score
   */
  static calculateRoleMatch(job, resumeAnalysis) {
    const jobTitle = job.title.toLowerCase();
    const userRoles = resumeAnalysis.roles;
    
    if (userRoles.length === 0) {
      // If no specific roles, use general keyword matching
      const keywords = resumeAnalysis.rawText.toLowerCase().split(/\s+/);
      let matches = 0;
      keywords.forEach(keyword => {
        if (keyword.length > 3 && jobTitle.includes(keyword)) {
          matches++;
        }
      });
      return Math.min(matches * 0.2, 1.0);
    }
    
    // Check for exact or partial role matches
    let bestMatch = 0;
    userRoles.forEach(role => {
      const roleLower = role.toLowerCase();
      const titleWords = jobTitle.split(/\s+/);
      const roleWords = roleLower.split(/\s+/);
      
      // Exact match
      if (jobTitle === roleLower) {
        bestMatch = Math.max(bestMatch, 1.0);
      }
      // Contains role
      else if (jobTitle.includes(roleLower) || roleLower.includes(jobTitle)) {
        bestMatch = Math.max(bestMatch, 0.8);
      }
      // Word overlap
      else {
        const commonWords = titleWords.filter(word => roleWords.includes(word));
        if (commonWords.length > 0) {
          bestMatch = Math.max(bestMatch, commonWords.length / Math.max(titleWords.length, roleWords.length));
        }
      }
    });
    
    return bestMatch;
  }

  /**
   * Calculate location match score
   */
  static calculateLocationMatch(job, resumeAnalysis) {
    const jobLocation = job.location.normalized;
    const userLocations = resumeAnalysis.locations;
    
    if (userLocations.length === 0) return 0.5; // Neutral if no preference
    
    // Check for matches
    for (const userLocation of userLocations) {
      if (jobLocation.includes(userLocation.toLowerCase())) {
        return 1.0;
      }
    }
    
    // Check country-level matches
    const jobCountry = job.location.country.toLowerCase();
    for (const userLocation of userLocations) {
      const userLoc = userLocation.toLowerCase();
      if (jobCountry.includes(userLoc) || userLoc.includes(jobCountry)) {
        return 0.7;
      }
    }
    
    return 0.3; // Different location
  }

  /**
   * Calculate experience match score
   */
  static calculateExperienceMatch(job, resumeAnalysis) {
    const jobTitle = job.title.toLowerCase();
    const userExperience = resumeAnalysis.experience || 0;
    
    // Determine job seniority
    let requiredExperience = 0;
    if (jobTitle.includes('senior') || jobTitle.includes('sr.')) {
      requiredExperience = 5;
    } else if (jobTitle.includes('junior') || jobTitle.includes('jr.')) {
      requiredExperience = 1;
    } else if (jobTitle.includes('lead') || jobTitle.includes('principal')) {
      requiredExperience = 8;
    } else {
      requiredExperience = 2; // Mid-level
    }
    
    // Calculate match
    const difference = Math.abs(userExperience - requiredExperience);
    
    if (difference === 0) return 1.0;
    if (difference <= 2) return 0.8;
    if (difference <= 4) return 0.6;
    return 0.4;
  }

  /**
   * Get match level label
   */
  static getMatchLevel(score) {
    if (score >= 0.8) return 'Excellent Match';
    if (score >= 0.6) return 'Good Match';
    if (score >= 0.4) return 'Fair Match';
    return 'Low Match';
  }

  /**
   * Rank all jobs by score
   */
  static rankJobs(jobs, resumeAnalysis) {
    const scoredJobs = jobs.map(job => this.scoreJob(job, resumeAnalysis));
    
    // Sort by score descending
    scoredJobs.sort((a, b) => b.score - a.score);
    
    return scoredJobs;
  }

  /**
   * Generate recommendation insights
   */
  static generateInsights(scoredJobs, resumeAnalysis) {
    const insights = {
      totalJobs: scoredJobs.length,
      excellentMatches: scoredJobs.filter(j => j.percentage >= 80).length,
      goodMatches: scoredJobs.filter(j => j.percentage >= 60 && j.percentage < 80).length,
      fairMatches: scoredJobs.filter(j => j.percentage >= 40 && j.percentage < 60).length,
      topSkills: resumeAnalysis.skills.slice(0, 5),
      recommendedRoles: this.getTopRoles(scoredJobs.slice(0, 10)),
      averageScore: scoredJobs.length > 0 
        ? Math.round(scoredJobs.reduce((sum, j) => sum + j.percentage, 0) / scoredJobs.length)
        : 0
    };
    
    return insights;
  }

  /**
   * Get most common roles from top matches
   */
  static getTopRoles(topJobs) {
    const roleCounts = {};
    topJobs.forEach(scored => {
      const title = scored.job.title;
      roleCounts[title] = (roleCounts[title] || 0) + 1;
    });
    
    return Object.entries(roleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([role]) => role);
  }
}

module.exports = JobMatchingAgent;
