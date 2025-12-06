# Quick Start Guide 🚀

## Prerequisites
- [Bun](https://bun.sh) installed on your system

## Setup & Run

```bash
# Install dependencies
bun install

# Run tests
bun tests/test.js

# Start the server
bun start

# Start in development mode (auto-reload)
bun dev
```

## Server Running ✅

Your Job Search Platform API is now running at:
**http://localhost:3000**

## Quick API Tests

### 1. View API Documentation
```bash
curl http://localhost:3000/
```

### 2. Search for Engineers
```bash
curl "http://localhost:3000/api/jobs?keyword=engineer"
```

### 3. Search in USA
```bash
curl "http://localhost:3000/api/jobs?location=usa"
```

### 4. Combined Search
```bash
curl "http://localhost:3000/api/jobs?keyword=developer&location=london"
```

### 5. Advanced Search with Salary Filter
```bash
curl "http://localhost:3000/api/jobs/search?keyword=developer&minSalary=80000&currency=USD"
```

### 6. Get All Statistics
```bash
curl http://localhost:3000/api/stats
```

### 7. Get Suggestions
```bash
curl http://localhost:3000/api/suggestions
```

### 8. Get a Specific Job
```bash
curl http://localhost:3000/api/jobs/JOB-1
```

## Project Structure

```
job_task/
├── data/                    # Demo data sources (16 jobs)
│   ├── source1.js          # Tech Jobs Portal format
│   └── source2.js          # Career Connect format
├── src/
│   ├── models/
│   │   └── jobSchema.js    # Unified job schema
│   ├── services/
│   │   ├── normalizer.js   # Data normalization
│   │   ├── deduplicator.js # Deduplication with Levenshtein
│   │   ├── ingestion.js    # Multi-source ingestion
│   │   └── search.js       # Search & filtering
│   └── app.js              # Express API server
├── tests/
│   └── test.js             # Test suite
└── README.md               # Full documentation
```

## What It Does

✅ **Ingests** jobs from 2 different data sources (16 total jobs)
✅ **Normalizes** them into a unified schema
✅ **Deduplicates** using fuzzy matching (13 unique jobs)
✅ **Provides** REST API for searching and filtering
✅ **In-memory** storage (no database needed)

## Results

- **16 jobs** ingested from 2 sources
- **3 duplicates** removed
- **13 unique jobs** available to search
- **7 API endpoints** ready to use

## Next Steps

1. Open browser: http://localhost:3000
2. Try the API endpoints above
3. Read [README.md](README.md) for complete documentation
4. Read [SUMMARY.md](SUMMARY.md) for implementation details

---

**Built with Bun for blazing-fast performance! ⚡**
