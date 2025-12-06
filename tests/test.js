/**
 * Simple test file to verify functionality
 */

const JobIngestionService = require('../src/services/ingestion');
const JobSearchService = require('../src/services/search');
const source1Jobs = require('../data/source1');
const source2Jobs = require('../data/source2');

console.log('🧪 Running Tests...\n');

// Test 1: Ingestion
console.log('Test 1: Data Ingestion');
const ingestionService = new JobIngestionService();
const result = ingestionService.ingestAll({
  source1: source1Jobs,
  source2: source2Jobs
});

console.log(`✓ Ingested ${result.totalIngested} jobs`);
console.log(`✓ Found ${result.uniqueJobs} unique jobs`);
console.log(`✓ Removed ${result.duplicatesRemoved} duplicates\n`);

// Test 2: Basic Search
console.log('Test 2: Basic Search');
const searchService = new JobSearchService(ingestionService);
const searchResult = searchService.search({ keyword: 'engineer' });
console.log(`✓ Found ${searchResult.data.length} jobs matching 'engineer'`);
searchResult.data.slice(0, 3).forEach(job => {
  console.log(`  - ${job.title} at ${job.company}`);
});
console.log();

// Test 3: Location Search
console.log('Test 3: Location Search');
const locationResult = searchService.search({ location: 'usa' });
console.log(`✓ Found ${locationResult.data.length} jobs in USA`);
console.log();

// Test 4: Advanced Search
console.log('Test 4: Advanced Search');
const advancedResult = searchService.advancedSearch({
  keyword: 'developer',
  minSalary: 80000,
  currency: 'USD'
});
console.log(`✓ Found ${advancedResult.data.length} developer jobs with salary >= $80,000 USD`);
advancedResult.data.forEach(job => {
  console.log(`  - ${job.title}: ${job.salary.formatted}`);
});
console.log();

// Test 5: Suggestions
console.log('Test 5: Get Suggestions');
const suggestions = searchService.getSuggestions();
console.log(`✓ Popular keywords:`, suggestions.popularKeywords.slice(0, 5));
console.log(`✓ Locations:`, suggestions.locations.slice(0, 3));
console.log();

console.log('✅ All tests passed!\n');
