/**
 * Job Deduplication Service
 * Identifies and removes duplicate job postings across sources
 */

class JobDeduplicator {
  
  /**
   * Calculate similarity score between two strings (0-1)
   * Uses Levenshtein distance normalized
   */
  static stringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.levenshteinDistance(s1, s2);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance algorithm
   */
  static levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Check if two jobs are duplicates
   * Uses multiple criteria: title, company, location
   */
  static isDuplicate(job1, job2) {
    // Calculate similarity scores
    const titleSimilarity = this.stringSimilarity(job1.title, job2.title);
    const companySimilarity = this.stringSimilarity(job1.company, job2.company);
    const locationSimilarity = this.stringSimilarity(
      job1.location.normalized,
      job2.location.normalized
    );
    
    // Threshold-based matching (made stricter to avoid false positives)
    const TITLE_THRESHOLD = 0.92;
    const COMPANY_THRESHOLD = 0.95;
    const LOCATION_THRESHOLD = 0.90;
    
    // Consider it a duplicate if:
    // 1. EXACT same company AND very similar title AND similar location
    const sameCompanyMatch = 
      companySimilarity >= COMPANY_THRESHOLD &&
      titleSimilarity >= TITLE_THRESHOLD &&
      locationSimilarity >= LOCATION_THRESHOLD;
    
    // 2. Nearly identical title AND location (cross-posting detection - made stricter)
    const crossPostMatch = 
      titleSimilarity >= 0.98 &&
      locationSimilarity >= 0.95;
    
    return sameCompanyMatch || crossPostMatch;
  }

  /**
   * Deduplicate an array of jobs
   * Returns array of unique jobs
   */
  static deduplicate(jobs) {
    if (!jobs || jobs.length === 0) return [];
    
    const uniqueJobs = [];
    const duplicateGroups = [];
    
    for (const job of jobs) {
      let isDupe = false;
      
      // Check against all unique jobs so far
      for (let i = 0; i < uniqueJobs.length; i++) {
        if (this.isDuplicate(job, uniqueJobs[i])) {
          isDupe = true;
          
          // Keep the job with the more recent posting date
          const jobDate = new Date(job.postedDate);
          const uniqueDate = new Date(uniqueJobs[i].postedDate);
          
          if (jobDate > uniqueDate) {
            // Replace with newer job
            duplicateGroups.push({
              kept: job.id,
              removed: uniqueJobs[i].id,
              reason: 'Newer posting date'
            });
            uniqueJobs[i] = job;
          } else {
            duplicateGroups.push({
              kept: uniqueJobs[i].id,
              removed: job.id,
              reason: 'Older posting date'
            });
          }
          
          break;
        }
      }
      
      if (!isDupe) {
        uniqueJobs.push(job);
      }
    }
    
    return {
      uniqueJobs,
      duplicateGroups,
      stats: {
        totalJobs: jobs.length,
        uniqueJobs: uniqueJobs.length,
        duplicatesRemoved: jobs.length - uniqueJobs.length
      }
    };
  }

  /**
   * Generate deduplication report
   */
  static generateReport(deduplicationResult) {
    const { stats, duplicateGroups } = deduplicationResult;
    
    let report = '\n=== DEDUPLICATION REPORT ===\n';
    report += `Total jobs processed: ${stats.totalJobs}\n`;
    report += `Unique jobs: ${stats.uniqueJobs}\n`;
    report += `Duplicates removed: ${stats.duplicatesRemoved}\n`;
    
    if (duplicateGroups.length > 0) {
      report += '\nDuplicate groups:\n';
      duplicateGroups.forEach((group, index) => {
        report += `  ${index + 1}. Kept job ${group.kept}, removed ${group.removed} (${group.reason})\n`;
      });
    }
    
    return report;
  }
}

module.exports = JobDeduplicator;
