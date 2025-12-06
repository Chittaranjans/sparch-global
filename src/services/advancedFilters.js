/**
 * Advanced Filters Service
 * Provides advanced filtering capabilities
 */
class AdvancedFiltersService {
  /**
   * Work type constants
   */
  static WORK_TYPE = {
    REMOTE: 'remote',
    HYBRID: 'hybrid',
    ONSITE: 'onsite'
  };

  /**
   * Job type constants
   */
  static JOB_TYPE = {
    FULL_TIME: 'full-time',
    PART_TIME: 'part-time',
    CONTRACT: 'contract',
    INTERNSHIP: 'internship',
    FREELANCE: 'freelance'
  };

  /**
   * Experience level constants
   */
  static EXPERIENCE_LEVEL = {
    ENTRY: 'entry',
    MID: 'mid',
    SENIOR: 'senior',
    LEAD: 'lead',
    EXECUTIVE: 'executive'
  };

  /**
   * Detect work type from job description/title
   */
  static detectWorkType(job) {
    const searchText = `${job.title} ${job.description || ''}`.toLowerCase();
    
    if (searchText.includes('remote') || searchText.includes('work from home')) {
      return this.WORK_TYPE.REMOTE;
    }
    if (searchText.includes('hybrid')) {
      return this.WORK_TYPE.HYBRID;
    }
    return this.WORK_TYPE.ONSITE;
  }

  /**
   * Detect job type from description/title
   */
  static detectJobType(job) {
    const searchText = `${job.title} ${job.description || ''}`.toLowerCase();
    
    if (searchText.includes('contract') || searchText.includes('contractor')) {
      return this.JOB_TYPE.CONTRACT;
    }
    if (searchText.includes('part-time') || searchText.includes('part time')) {
      return this.JOB_TYPE.PART_TIME;
    }
    if (searchText.includes('intern')) {
      return this.JOB_TYPE.INTERNSHIP;
    }
    if (searchText.includes('freelance')) {
      return this.JOB_TYPE.FREELANCE;
    }
    return this.JOB_TYPE.FULL_TIME;
  }

  /**
   * Detect experience level from title
   */
  static detectExperienceLevel(job) {
    const title = job.title.toLowerCase();
    
    if (title.includes('executive') || title.includes('vp') || title.includes('director')) {
      return this.EXPERIENCE_LEVEL.EXECUTIVE;
    }
    if (title.includes('lead') || title.includes('principal') || title.includes('staff')) {
      return this.EXPERIENCE_LEVEL.LEAD;
    }
    if (title.includes('senior') || title.includes('sr')) {
      return this.EXPERIENCE_LEVEL.SENIOR;
    }
    if (title.includes('junior') || title.includes('jr') || title.includes('entry')) {
      return this.EXPERIENCE_LEVEL.ENTRY;
    }
    return this.EXPERIENCE_LEVEL.MID;
  }

  /**
   * Calculate days since posted
   */
  static daysSincePosted(job) {
    if (!job.postedDate) return null;
    
    const posted = new Date(job.postedDate);
    const now = new Date();
    const diff = now - posted;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Apply advanced filters to job list
   */
  static filterJobs(jobs, filters = {}) {
    let filtered = [...jobs];

    // Work type filter
    if (filters.workType) {
      filtered = filtered.filter(job => 
        this.detectWorkType(job) === filters.workType
      );
    }

    // Job type filter
    if (filters.jobType) {
      filtered = filtered.filter(job => 
        this.detectJobType(job) === filters.jobType
      );
    }

    // Experience level filter
    if (filters.experienceLevel) {
      filtered = filtered.filter(job => 
        this.detectExperienceLevel(job) === filters.experienceLevel
      );
    }

    // Posted date filter
    if (filters.postedWithinDays) {
      const maxDays = parseInt(filters.postedWithinDays);
      filtered = filtered.filter(job => {
        const days = this.daysSincePosted(job);
        return days !== null && days <= maxDays;
      });
    }

    // Salary range filter
    if (filters.minSalary || filters.maxSalary) {
      filtered = filtered.filter(job => {
        if (!job.salary || !job.salary.min) return false;
        
        const jobSalary = job.salary.min;
        
        if (filters.minSalary && jobSalary < parseInt(filters.minSalary)) {
          return false;
        }
        if (filters.maxSalary && jobSalary > parseInt(filters.maxSalary)) {
          return false;
        }
        
        return true;
      });
    }

    // Skills filter (must have all specified skills)
    if (filters.skills && filters.skills.length > 0) {
      filtered = filtered.filter(job => {
        const jobText = `${job.title} ${job.description || ''}`.toLowerCase();
        return filters.skills.every(skill => 
          jobText.includes(skill.toLowerCase())
        );
      });
    }

    // Benefits filter
    if (filters.benefits && filters.benefits.length > 0) {
      filtered = filtered.filter(job => {
        const jobText = `${job.description || ''}`.toLowerCase();
        return filters.benefits.some(benefit => 
          jobText.includes(benefit.toLowerCase())
        );
      });
    }

    // Company size filter (would need to be added to job data)
    if (filters.companySize) {
      // This would require additional company data
      // For now, just a placeholder
    }

    return filtered;
  }

  /**
   * Get available filter options from job list
   */
  static getFilterOptions(jobs) {
    const workTypes = new Set();
    const jobTypes = new Set();
    const experienceLevels = new Set();
    const skills = new Set();

    jobs.forEach(job => {
      workTypes.add(this.detectWorkType(job));
      jobTypes.add(this.detectJobType(job));
      experienceLevels.add(this.detectExperienceLevel(job));
      
      // Extract common skills from descriptions
      const text = `${job.title} ${job.description || ''}`.toLowerCase();
      const commonSkills = [
        'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue',
        'typescript', 'aws', 'azure', 'docker', 'kubernetes', 'sql'
      ];
      
      commonSkills.forEach(skill => {
        if (text.includes(skill)) skills.add(skill);
      });
    });

    return {
      workTypes: Array.from(workTypes),
      jobTypes: Array.from(jobTypes),
      experienceLevels: Array.from(experienceLevels),
      skills: Array.from(skills),
      postedDateOptions: [
        { label: 'Last 24 hours', days: 1 },
        { label: 'Last 7 days', days: 7 },
        { label: 'Last 30 days', days: 30 },
        { label: 'Any time', days: null }
      ]
    };
  }

  /**
   * Add metadata to jobs with detected attributes
   */
  static enrichJobs(jobs) {
    return jobs.map(job => ({
      ...job,
      metadata: {
        workType: this.detectWorkType(job),
        jobType: this.detectJobType(job),
        experienceLevel: this.detectExperienceLevel(job),
        daysSincePosted: this.daysSincePosted(job)
      }
    }));
  }
}

module.exports = AdvancedFiltersService;
