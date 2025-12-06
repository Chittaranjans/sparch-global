const { UnifiedJob, Location, Salary } = require('../models/jobSchema');

/**
 * Job Normalizer - Converts jobs from different sources to unified schema
 */
class JobNormalizer {
  
  /**
   * Normalize job title
   * - Convert to title case
   * - Remove extra spaces
   * - Standardize common abbreviations
   */
  static normalizeTitle(title) {
    if (!title) return '';
    
    // Clean up the title
    let normalized = title.trim();
    
    // Replace common abbreviations (using word boundaries to avoid partial matches)
    const replacements = {
      '\\bsr\\.?\\b': 'Senior',
      '\\bjr\\.?\\b': 'Junior',
      '\\bmgr\\b': 'Manager'
    };
    
    Object.entries(replacements).forEach(([pattern, replacement]) => {
      normalized = normalized.replace(new RegExp(pattern, 'gi'), replacement);
    });
    
    // Convert to title case
    normalized = normalized
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return normalized;
  }

  /**
   * Parse location from various string formats
   */
  static parseLocation(locationString) {
    if (!locationString) return new Location({ city: '', country: '' });
    
    // Clean the string
    const parts = locationString.split(',').map(p => p.trim());
    
    let city = '';
    let state = '';
    let country = '';
    
    if (parts.length >= 3) {
      city = parts[0];
      state = parts[1];
      country = parts[2];
    } else if (parts.length === 2) {
      city = parts[0];
      country = parts[1];
    } else {
      city = parts[0];
    }
    
    // Normalize country names
    const countryMap = {
      'usa': 'USA',
      'united states': 'USA',
      'us': 'USA',
      'uk': 'UK',
      'united kingdom': 'UK',
      'germany': 'Germany',
      'france': 'France',
      'canada': 'Canada',
      'singapore': 'Singapore',
      'ireland': 'Ireland'
    };
    
    country = countryMap[country.toLowerCase()] || country;
    
    return new Location({ city, state, country });
  }

  /**
   * Parse salary from various formats
   */
  static parseSalary(salaryString) {
    if (!salaryString) return new Salary({ min: null, max: null, currency: 'USD' });
    
    // Detect currency
    let currency = 'USD';
    if (salaryString.includes('£') || salaryString.includes('GBP')) currency = 'GBP';
    if (salaryString.includes('€') || salaryString.includes('EUR')) currency = 'EUR';
    if (salaryString.includes('CAD')) currency = 'CAD';
    if (salaryString.includes('SGD')) currency = 'SGD';
    
    // Extract numbers (handle k notation)
    const numbers = salaryString.match(/[\d,]+/g);
    if (!numbers) return new Salary({ min: null, max: null, currency });
    
    const parseAmount = (str) => {
      let num = parseFloat(str.replace(/,/g, ''));
      // Check if it's in k format (less than 1000 usually means it's in thousands)
      if (salaryString.toLowerCase().includes('k') && num < 1000) {
        num *= 1000;
      }
      return num;
    };
    
    let min = null;
    let max = null;
    
    if (numbers.length >= 2) {
      min = parseAmount(numbers[0]);
      max = parseAmount(numbers[1]);
    } else if (numbers.length === 1) {
      min = parseAmount(numbers[0]);
    }
    
    return new Salary({ min, max, currency });
  }

  /**
   * Normalize a job from Source 1 format
   */
  static normalizeSource1(job, internalId) {
    return new UnifiedJob({
      id: internalId,
      title: this.normalizeTitle(job.jobTitle),
      company: job.company,
      location: this.parseLocation(job.location),
      salary: this.parseSalary(job.salary),
      description: job.description,
      postedDate: job.postedDate,
      sourceId: 'source1',
      originalId: job.jobId
    });
  }

  /**
   * Normalize a job from Source 2 format
   */
  static normalizeSource2(job, internalId) {
    // Construct location string
    const locationParts = [job.city, job.state, job.country].filter(p => p);
    const locationString = locationParts.join(', ');
    
    // Construct salary string from numeric values
    const salaryString = job.salaryMin && job.salaryMax 
      ? `${job.salaryMin} - ${job.salaryMax} ${job.currency}`
      : '';
    
    return new UnifiedJob({
      id: internalId,
      title: this.normalizeTitle(job.title),
      company: job.companyName,
      location: this.parseLocation(locationString),
      salary: new Salary({ 
        min: job.salaryMin, 
        max: job.salaryMax, 
        currency: job.currency 
      }),
      description: job.jobDescription,
      postedDate: job.datePosted,
      sourceId: 'source2',
      originalId: job.externalId
    });
  }
}

module.exports = JobNormalizer;
