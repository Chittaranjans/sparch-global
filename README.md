# Job Search Platform 🔍

A complete Job Ingestion & Search Service with **AI-powered chatbot interface** featuring a RAG (Retrieval-Augmented Generation) system for natural language job search.

## 📋 Project Overview

This platform ingests job postings from multiple sources, normalizes them into a unified schema, removes duplicates, and provides both a **powerful REST API** and an **intelligent AI chatbot interface** for searching jobs using natural language.

### Key Features

✅ **AI Chatbot Interface** - Natural language job search with RAG system
✅ **Multi-Source Ingestion** - Ingests jobs from 2 different data sources with different formats
✅ **Data Normalization** - Converts all jobs to a unified schema
✅ **Smart Deduplication** - Removes duplicate job postings across sources using similarity algorithms
✅ **Advanced Search** - Search by keyword, location, salary, company
✅ **In-Memory Storage** - No database required, perfect for demo/testing
✅ **RESTful API** - Clean, documented endpoints
✅ **Beautiful UI** - Modern, responsive chat interface

---

## 🏗️ Project Structure

```
job_task/
├── data/                      # Demo data sources
│   ├── source1.js            # Tech Jobs Portal format
│   └── source2.js            # Career Connect format
├── src/
│   ├── models/
│   │   └── jobSchema.js      # Unified job schema (UnifiedJob, Location, Salary)
│   ├── services/
│   │   ├── normalizer.js     # Normalizes jobs from different sources
│   │   ├── deduplicator.js   # Deduplication logic with Levenshtein distance
│   │   ├── ingestion.js      # Ingestion service for multiple sources
│   │   └── search.js         # Search and filtering service
│   └── app.js                # Express server and API routes
├── public/                    # Frontend AI Chatbot Interface
│   ├── index.html            # Chat UI
│   ├── styles.css            # Modern responsive styling
│   └── app.js                # RAG system implementation
├── tests/
│   └── test.js               # Test suite
├── package.json
├── README.md                 # This file
├── RAG_DOCUMENTATION.md      # RAG system details
└── SUMMARY.md               # Implementation summary
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Gemini API key
# Get your free API key from: https://makersuite.google.com/app/apikey
```

Your `.env` file should look like:
```env
GEMINI_API_KEY=your_actual_api_key_here
PORT=3000
NODE_ENV=development
```

### 3. Run the Server

```bash
bun start
```

The server will start on `http://localhost:3000`

**Open your browser and go to:** `http://localhost:3000`

You'll see the AI chatbot interface where you can ask questions like:
- "Show me software engineer jobs"
- "I want jobs in USA"
- "Find frontend developer positions in London"
- "What jobs pay more than $100,000?"

### 4. Run Tests

```bash
bun test
```

###🤖 AI Chatbot Interface

### Natural Language Job Search

The Web Interface
- **GET /** - AI Chatbot Interface (open in browser)

### API Endpoints
- **GET /api** - API DocumentationFind frontend developer positions in London"
- "Show me jobs at TechCorp"
- "What jobs pay more than $100,000?"
- "D1vOps positions in Berlin"
- "Data scientist roles in Europe"

### How It Works

1. **Intent Analysis**: Understands what you're looking for
2. **Parameter Extraction**: Extracts role, location, company, salary from your query
3. **Smart Retrieval**: Searches the job database
4. **Natural Response**: Generates human-friendly responses with job results

See [RAG_DOCUMENTATION.md](RAG_DOCUMENTATION.md) for detailed information about the AI system.

---

##  4. Development Mode (with auto-reload)

```bash
bun dev
```

---

## 📡 API Endpoints

### Base URL: `http://localhost:3000`

### 1. **GET /** - API Documentation
Returns API information and available endpoints.

```bash
curl http://localhost:3000/
```
2
### 2. **GET /api/jobs** - Basic Search
Search jobs by keyword and/or location.

**Query Parameters:**
- `keyword` (optional) - Search term for title, company, or description
- `location` (optional) - Location filter (city, state, or country)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Results per page

**Examples:**
```bash
# Search for engineers
curl "http://localhost:3000/api/jobs?keyword=engineer"

# Search in specific location
curl "http://localhost:3000/api/jobs?location=usa"

# Combined search
curl "http://localhost:3000/api/jobs?keyword=developer&location=london"

# Pagination
curl "http://localhost:3000/api/jobs?keyword=engineer&page=1&limit=5"
```

### 3. **GET /api/jobs/search** - Advanced Search
Advanced search with multiple filters.

**Query Parameters:**
- `keyword` - Search term
- `location` - Location filter
- `company` - Company name filter
- `m4nSalary` - Minimum salary
- `maxSalary` - Maximum salary
- `currency` - Currency code (USD, EUR, GBP, etc.)
- `page` - Page number
- `limit` - Results per page

**Examples:**
```bash
# Search by salary range
curl "http://localhost:3000/api/jobs/search?minSalary=80000&maxSalary=150000&currency=USD"

# Search by company
curl "http://localhost:3000/api/jobs/search?company=techcorp"

# Complex search
curl "http://localhost:3000/api/jobs/search?keyword=developer&location=berlin&minSalary=70000&currency=EUR"
```

### 4. **GET /api/jobs/:id** - Get Job by ID
Retrieve a specific job by its ID.

```bash
curl http://localhost:3000/api/jobs/JOB-1
```

### 5. **GET /api/stats** - Ingestion Statistics
Get statistics about ingested jobs.

```bash
curl http://localhost:3000/api/stats
```

### 6. **GET /api/suggestions** - Search Suggestions
Get 5opular keywords, locations, and companies.

```bash
curl http://localhost:3000/api/suggestions
```

### 7. **GET /api/locations** - All Locations
Get 6ist of all unique job locations.

```bash
curl http://localhost:3000/api/locations
```

### 8. **GET /api/companies** - All Companies
Get 7ist of all unique companies.

```bash
curl http://localhost:3000/api/companies
```

---

## 🔧 How It Works

### 1. **Data Ingestion**

Two data sources with different formats:

**Source 1 (Tech Jobs Portal):**
```javascript
{
  jobTitle: "Senior Software Engineer",
  company: "TechCorp Inc.",
  location: "San Francisco, CA, USA",
  salary: "$120,000 - $180,000",
  // ...
}
```

**Source 2 (Career Connect):**
```javascript
{
  title: "Sr. Software Engineer",
  companyName: "TechCorp Inc.",
  city: "San Francisco",
  country: "USA",
  salaryMin: 120000,
  salaryMax: 180000,
  // ...
}
```

### 2. **Normalization**

Both are converted to a unified schema:
```javascript
{
  id: "JOB-1",
  title: "Senior Software Engineer",
  company: "TechCorp Inc.",
  location: {
    city: "San Francisco",
    state: "CA",
    country: "USA",
    normalized: "san francisco, ca, usa"
  },
  salary: {
    min: 120000,
    max: 180000,
    currency: "USD",
    formatted: "$120,000 - $180,000"
  },
  // ...
}
```

### 3. **Deduplication**

Uses **Levenshtein distance algorithm** to:
- Compare job titles (85% similarity threshold)
- Match companies (90% similarity threshold)
- Match locations (85% similarity threshold)
- Keep the most recent posting when duplicates found

### 4. **Search**

Supports:
- **Keyword matching** - Searches title, company, description
- **Location filtering** - Matches city, state, country
- **Salary filtering** - Min/max range with currency
- **Company filtering** - Exact or partial match
- **Pagination** - Page and limit controls

---

## 📊 Example Responses

### Search Response
```json
{
  "success": true,
  "data": [
    {
      "id": "JOB-1",
      "title": "Senior Software Engineer",
      "company": "TechCorp Inc.",
      "location": {
        "city": "San Francisco",
        "state": "CA",
        "country": "USA",
        "normalized": "san francisco, ca, usa"
      },
      "salary": {
        "min": 120000,
        "max": 180000,
        "currency": "USD",
        "formatted": "$120,000 - $180,000"
      },
      "description": "...",
      "postedDate": "2025-12-01",
      "sourceId": "source1",
      "originalId": "TC001"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalResults": 15,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filters": {
    "keyword": "engineer",
    "location": "usa"
  }
}
```

---

## 🧪 Testing

Run the test suite:
```bash
bun test
```

Tests include:
1. ✅ Data ingestion from both sources
2. ✅ Deduplication verification
3. ✅ Basic keyword search
4. ✅ Location filtering
5. ✅ Advanced search with multiple filters
6. ✅ Search suggestions

---

## 🎯 Key Implementation Details

### Normalization Features
- **Title normalization**: Converts "Sr." to "Senior", standardizes capitalization
- **Location parsing**: Handles various formats (city, state, country)
- **Salary parsing**: Supports multiple currencies and formats ($120k, £60,000, etc.)

### Deduplication Algorithm
- Uses **Levenshtein distance** for fuzzy string matching
- Configurable similarity thresholds
- Keeps most recent posting when duplicates found
- Generates detailed deduplication report

### Search Capabilities
- **Full-text search** across title, company, description
- **Location search** with normalized matching
- **Salary filtering** with currency support
- **Pagination** for large result sets
- **Sorting** by posting date (most recent first)

---

## 📝 Notes

- **No database required** - All data stored in memory
- **Demo data** - Includes 16 sample jobs from 2 sources
- **RESTful API** - Clean, standard REST endpoints
- **CORS enabled** - Ready for frontend integration
- **Extensible** - Easy to add more data sources

---

## 🔄 Adding More Data Sources

To add a new data source:

1. Create new data file in `data/` folder
2. Add normalization function in `src/services/normalizer.js`
3. Add ingestion method in `src/services/ingestion.js`
4. Import and ingest in `src/app.js`

Example:
```javascript
// In normalizer.js
static normalizeSource3(job, internalId) {
  // Your normalization logic
}

// In ingestion.js
ingestSource3(rawJobs) {
  // Your ingestion logic
}
```

---

## 🚀 Next Steps

Potential enhancements:
- Add persistent storage (MongoDB, PostgreSQL)
- Implement job posting API
- Add user authentication
- Build frontend UI
- Add real-time updates with WebSockets
- Implement job recommendations
- Add analytics dashboard

---

## 📄 License

MIT

---

## 👤 Author

Built as a demonstration of job search platform architecture.
