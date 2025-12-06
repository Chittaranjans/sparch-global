/**
 * Job Search Service
 * Provides search and filtering capabilities for jobs
 */
class JobSearchService {
  constructor(jobIngestionService) {
    this.ingestionService = jobIngestionService;
  }

  /**
   * Search jobs by keyword and location
   */
  search(params = {}) {
    const { keyword = '', location = '', page = 1, limit = 50 } = params;
    
    let results = this.ingestionService.getAllJobs();
    
    // Filter by keyword (search in title, company, description)
    if (keyword) {
      const searchTerm = keyword.toLowerCase().trim();
      results = results.filter(job => {
        return (
          job.title.toLowerCase().includes(searchTerm) ||
          job.company.toLowerCase().includes(searchTerm) ||
          job.description.toLowerCase().includes(searchTerm)
        );
      });
    }
    
    // Filter by location (search in city, state, country)
    if (location) {
      const locationTerm = location.toLowerCase().trim();
      results = results.filter(job => {
        return job.location.normalized.includes(locationTerm);
      });
    }
    
    // Calculate pagination
    const totalResults = results.length;
    const totalPages = Math.ceil(totalResults / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Apply pagination
    const paginatedResults = results.slice(startIndex, endIndex);
    
    return {
      success: true,
      data: paginatedResults,
      pagination: {
        page,
        limit,
        totalResults,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        keyword: keyword || 'none',
        location: location || 'none'
      }
    };
  }

  /**
   * Advanced search with multiple filters
   */
  advancedSearch(params = {}) {
    const {
      keyword = '',
      location = '',
      minSalary = null,
      maxSalary = null,
      currency = null,
      company = '',
      page = 1,
      limit = 50
    } = params;
    
    let results = this.ingestionService.getAllJobs();
    
    // Keyword filter
    if (keyword) {
      const searchTerm = keyword.toLowerCase().trim();
      results = results.filter(job => {
        return (
          job.title.toLowerCase().includes(searchTerm) ||
          job.company.toLowerCase().includes(searchTerm) ||
          job.description.toLowerCase().includes(searchTerm)
        );
      });
    }
    
    // Location filter
    if (location) {
      const locationTerm = location.toLowerCase().trim();
      results = results.filter(job => {
        return job.location.normalized.includes(locationTerm);
      });
    }
    
    // Company filter
    if (company) {
      const companyTerm = company.toLowerCase().trim();
      results = results.filter(job => {
        return job.company.toLowerCase().includes(companyTerm);
      });
    }
    
    // Salary filter
    if (minSalary !== null || maxSalary !== null || currency !== null) {
      results = results.filter(job => {
        const jobSalary = job.salary;
        
        // Currency filter
        if (currency && jobSalary.currency !== currency) {
          return false;
        }
        
        // Min salary filter
        if (minSalary !== null && jobSalary.max < minSalary) {
          return false;
        }
        
        // Max salary filter
        if (maxSalary !== null && jobSalary.min > maxSalary) {
          return false;
        }
        
        return true;
      });
    }
    
    // Sort by most recent
    results.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    
    // Pagination
    const totalResults = results.length;
    const totalPages = Math.ceil(totalResults / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = results.slice(startIndex, endIndex);
    
    return {
      success: true,
      data: paginatedResults,
      pagination: {
        page,
        limit,
        totalResults,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: {
        keyword: keyword || 'none',
        location: location || 'none',
        company: company || 'none',
        minSalary: minSalary || 'none',
        maxSalary: maxSalary || 'none',
        currency: currency || 'none'
      }
    };
  }

  /**
   * Get jobs by location
   */
  getJobsByLocation(location) {
    return this.search({ location });
  }

  /**
   * Get jobs by company
   */
  getJobsByCompany(company) {
    return this.advancedSearch({ company });
  }

  /**
   * Get all unique locations
   */
  getUniqueLocations() {
    const jobs = this.ingestionService.getAllJobs();
    const locations = new Set();
    
    jobs.forEach(job => {
      locations.add(job.location.normalized);
    });
    
    return Array.from(locations).sort();
  }

  /**
   * Get all unique companies
   */
  getUniqueCompanies() {
    const jobs = this.ingestionService.getAllJobs();
    const companies = new Set();
    
    jobs.forEach(job => {
      companies.add(job.company);
    });
    
    return Array.from(companies).sort();
  }

  /**
   * Get search suggestions based on current jobs
   */
  getSuggestions() {
    return {
      popularKeywords: this._getPopularKeywords(),
      locations: this.getUniqueLocations().slice(0, 10),
      companies: this.getUniqueCompanies().slice(0, 10)
    };
  }

  /**
   * Extract popular keywords from job titles
   */
  _getPopularKeywords() {
    const jobs = this.ingestionService.getAllJobs();
    const keywords = {};
    
    jobs.forEach(job => {
      const words = job.title.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 3) { // Only count words longer than 3 chars
          keywords[word] = (keywords[word] || 0) + 1;
        }
      });
    });
    
    // Sort by frequency and return top 10
    return Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }
}

module.exports = JobSearchService;
