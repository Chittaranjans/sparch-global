const JobNormalizer = require('./normalizer');
const JobDeduplicator = require('./deduplicator');

/**
 * Job Ingestion Service
 * Handles ingestion from multiple sources with normalization and deduplication
 */
class JobIngestionService {
  constructor() {
    this.jobs = []; // In-memory storage
    this.nextId = 1;
    this.ingestionLog = [];
  }

  /**
   * Ingest jobs from Source 1
   */
  ingestSource1(rawJobs) {
    console.log(`\n📥 Ingesting ${rawJobs.length} jobs from Source 1...`);
    
    const normalizedJobs = rawJobs.map(job => {
      const normalized = JobNormalizer.normalizeSource1(job, `JOB-${this.nextId++}`);
      return normalized;
    });
    
    this.ingestionLog.push({
      source: 'source1',
      timestamp: new Date().toISOString(),
      jobsIngested: rawJobs.length
    });
    
    console.log(`✅ Normalized ${normalizedJobs.length} jobs from Source 1`);
    return normalizedJobs;
  }

  /**
   * Ingest jobs from Source 2
   */
  ingestSource2(rawJobs) {
    console.log(`\n📥 Ingesting ${rawJobs.length} jobs from Source 2...`);
    
    const normalizedJobs = rawJobs.map(job => {
      const normalized = JobNormalizer.normalizeSource2(job, `JOB-${this.nextId++}`);
      return normalized;
    });
    
    this.ingestionLog.push({
      source: 'source2',
      timestamp: new Date().toISOString(),
      jobsIngested: rawJobs.length
    });
    
    console.log(`✅ Normalized ${normalizedJobs.length} jobs from Source 2`);
    return normalizedJobs;
  }

  /**
   * Ingest jobs from multiple sources and deduplicate
   */
  ingestAll(sources) {
    console.log('\n🚀 Starting job ingestion process...\n');
    
    let allJobs = [];
    
    // Ingest from each source
    if (sources.source1) {
      const source1Jobs = this.ingestSource1(sources.source1);
      allJobs = allJobs.concat(source1Jobs);
    }
    
    if (sources.source2) {
      const source2Jobs = this.ingestSource2(sources.source2);
      allJobs = allJobs.concat(source2Jobs);
    }
    
    console.log(`\n📊 Total jobs before deduplication: ${allJobs.length}`);
    
    // Deduplicate
    console.log('\n🔍 Running deduplication...');
    const deduplicationResult = JobDeduplicator.deduplicate(allJobs);
    
    // Store unique jobs
    this.jobs = deduplicationResult.uniqueJobs;
    
    // Print report
    console.log(JobDeduplicator.generateReport(deduplicationResult));
    
    console.log(`\n✨ Ingestion complete! ${this.jobs.length} unique jobs available.\n`);
    
    return {
      success: true,
      totalIngested: allJobs.length,
      uniqueJobs: this.jobs.length,
      duplicatesRemoved: deduplicationResult.stats.duplicatesRemoved,
      deduplicationReport: deduplicationResult
    };
  }

  /**
   * Get all jobs
   */
  getAllJobs() {
    return this.jobs;
  }

  /**
   * Get job by ID
   */
  getJobById(id) {
    return this.jobs.find(job => job.id === id);
  }

  /**
   * Get ingestion statistics
   */
  getStats() {
    return {
      totalJobs: this.jobs.length,
      sources: this.ingestionLog.length,
      lastIngestion: this.ingestionLog[this.ingestionLog.length - 1],
      jobsBySource: this._groupBySource()
    };
  }

  /**
   * Group jobs by source
   */
  _groupBySource() {
    const grouped = {};
    this.jobs.forEach(job => {
      if (!grouped[job.sourceId]) {
        grouped[job.sourceId] = 0;
      }
      grouped[job.sourceId]++;
    });
    return grouped;
  }

  /**
   * Clear all jobs (for testing)
   */
  clear() {
    this.jobs = [];
    this.nextId = 1;
    this.ingestionLog = [];
  }
}

module.exports = JobIngestionService;
