// API Base URL
const API_BASE = 'http://localhost:3000';

// State
let allJobs = [];
let companies = [];
let locations = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadInitialData();
    setupEventListeners();
});

// Load initial data
async function loadInitialData() {
    try {
        // Load stats
        const statsResponse = await fetch(`${API_BASE}/api/stats`);
        const statsData = await statsResponse.json();
        document.getElementById('totalJobs').textContent = `${statsData.data.totalJobs} Jobs Available`;

        // Load companies
        const companiesResponse = await fetch(`${API_BASE}/api/companies`);
        const companiesData = await companiesResponse.json();
        companies = companiesData.data;
        renderCompanies();

        // Load locations
        const locationsResponse = await fetch(`${API_BASE}/api/locations`);
        const locationsData = await locationsResponse.json();
        locations = locationsData.data;
        renderLocations();

    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// Render companies sidebar
function renderCompanies() {
    const container = document.getElementById('companiesList');
    container.innerHTML = companies.slice(0, 10).map(company => 
        `<div class="filter-item" data-query="Show me jobs at ${company}">${company}</div>`
    ).join('');

    // Add click handlers
    container.querySelectorAll('.filter-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const query = e.target.getAttribute('data-query');
            sendMessage(query);
        });
    });
}

// Render locations sidebar
function renderLocations() {
    const container = document.getElementById('locationsList');
    container.innerHTML = locations.slice(0, 10).map(location => 
        `<div class="filter-item" data-query="Show me jobs in ${location}">${location}</div>`
    ).join('');

    // Add click handlers
    container.querySelectorAll('.filter-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const query = e.target.getAttribute('data-query');
            sendMessage(query);
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Chat form submission
    document.getElementById('chatForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (message) {
            sendMessage(message);
            input.value = '';
        }
    });

    // Suggestion buttons
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const query = e.target.getAttribute('data-query');
            sendMessage(query);
        });
    });

    // Job modal close
    document.querySelector('.modal-close').addEventListener('click', () => {
        document.getElementById('jobModal').style.display = 'none';
    });

    // Resume upload button
    document.getElementById('uploadResumeBtn').addEventListener('click', () => {
        document.getElementById('resumeModal').style.display = 'block';
    });

    // Resume modal close
    document.getElementById('closeResumeModal').addEventListener('click', () => {
        document.getElementById('resumeModal').style.display = 'none';
    });

    // Resume file input
    const fileInput = document.getElementById('resumeFileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Analyze resume button
    document.getElementById('analyzeResumeBtn').addEventListener('click', analyzeResume);

    // Modal window click (close on outside click)
    window.addEventListener('click', (e) => {
        const jobModal = document.getElementById('jobModal');
        const resumeModal = document.getElementById('resumeModal');
        if (e.target === jobModal) {
            jobModal.style.display = 'none';
        }
        if (e.target === resumeModal) {
            resumeModal.style.display = 'none';
        }
    });
}

// Send message and process with RAG
async function sendMessage(message) {
    // Add user message to chat
    addMessage(message, 'user');

    // Show typing indicator
    showTypingIndicator();

    try {
        // Process query with RAG system
        const intent = analyzeIntent(message);
        const searchParams = extractSearchParameters(message);
        
        // Debug: Log extracted parameters
        console.log('Intent:', intent);
        console.log('Extracted params:', searchParams);
        
        // Fetch relevant jobs
        const jobs = await searchJobs(searchParams);
        
        // Generate response
        const response = generateResponse(intent, searchParams, jobs);
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add bot response
        addMessage(response, 'bot', jobs);

    } catch (error) {
        console.error('Error processing message:', error);
        removeTypingIndicator();
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
    }
}

// RAG System: Analyze user intent
function analyzeIntent(query) {
    const lowerQuery = query.toLowerCase();
    
    const intents = {
        searchByRole: /\b(software|developer|engineer|designer|manager|analyst|devops|frontend|backend|fullstack|full stack|data scientist|machine learning|ml|ai)\b/i,
        searchByLocation: /\b(in|at|near|from)\s+([a-z\s,]+)/i,
        searchByCompany: /\b(at|for|with)\s+([a-z\s]+)\b/i,
        searchBySalary: /\b(\$|£|€)?(\d{1,3}[,k]?\d{0,3})\+?|above|more than|greater than|over|minimum/i,
        listAll: /\b(all|show me|list|what|available)\b/i,
        greeting: /\b(hi|hello|hey|good morning|good afternoon)\b/i
    };

    const detected = {
        type: 'general',
        confidence: 0.5
    };

    if (intents.greeting.test(lowerQuery)) {
        detected.type = 'greeting';
        detected.confidence = 1.0;
    } else if (intents.searchByRole.test(lowerQuery)) {
        detected.type = 'searchByRole';
        detected.confidence = 0.9;
    } else if (intents.searchByLocation.test(lowerQuery)) {
        detected.type = 'searchByLocation';
        detected.confidence = 0.9;
    } else if (intents.searchByCompany.test(lowerQuery)) {
        detected.type = 'searchByCompany';
        detected.confidence = 0.9;
    } else if (intents.searchBySalary.test(lowerQuery)) {
        detected.type = 'searchBySalary';
        detected.confidence = 0.85;
    } else if (intents.listAll.test(lowerQuery)) {
        detected.type = 'listAll';
        detected.confidence = 0.95;
    }

    return detected;
}

// RAG System: Extract search parameters from natural language
function extractSearchParameters(query) {
    const params = {
        keyword: '',
        location: '',
        company: '',
        minSalary: null,
        currency: 'USD'
    };

    const lowerQuery = query.toLowerCase();

    // Extract role/keyword
    const roleKeywords = ['software engineer', 'developer', 'frontend', 'backend', 'full stack', 
                         'fullstack', 'devops', 'data scientist', 'designer', 'engineer', 
                         'manager', 'analyst', 'machine learning', 'ml engineer', 'product manager',
                         'qa engineer', 'ux designer', 'data engineer'];
    
    for (const role of roleKeywords) {
        if (lowerQuery.includes(role)) {
            params.keyword = role;
            break;
        }
    }

    // Extract location - but only if it's not a company name
    const locationMatch = lowerQuery.match(/\b(?:in|from|near)\s+([a-z][a-z\s,]+?)(?:\s+(?:with|for|at|paying|making|company|jobs?|\.|$))/i);
    if (locationMatch && locationMatch[1]) {
        const potentialLocation = locationMatch[1].trim();
        // Make sure it's not a company name
        const isCompany = companies.some(c => c.toLowerCase().includes(potentialLocation.toLowerCase()));
        if (!isCompany) {
            params.location = potentialLocation;
        }
    }

    // Extract company - multiple strategies
    let companyFound = false;
    
    // Strategy 1: Look for "at/for/with/from COMPANY" pattern
    const companyPatterns = [
        /\b(?:at|for|with|from)\s+([a-z][a-z\s&.,]+?)(?:\s+(?:in|near|paying|making|company|jobs?|inc|ltd|corp|\.|$))/i,
        /\b(?:jobs?\s+at|work\s+at|positions?\s+at)\s+([a-z][a-z\s&.,]+?)(?:\s|$)/i
    ];
    
    for (const pattern of companyPatterns) {
        if (companyFound) break;
        const match = lowerQuery.match(pattern);
        if (match && match[1]) {
            const potentialCompany = match[1].trim();
            // Find matching company (case insensitive, partial match)
            const matchedCompany = companies.find(c => 
                c.toLowerCase().includes(potentialCompany.toLowerCase()) ||
                potentialCompany.toLowerCase().includes(c.toLowerCase().split(' ')[0])
            );
            if (matchedCompany) {
                params.company = matchedCompany;
                companyFound = true;
            }
        }
    }
    
    // Strategy 2: Direct company name mention anywhere in the query
    if (!companyFound) {
        for (const company of companies) {
            const companyBase = company.split(' ')[0].toLowerCase(); // Get first word (e.g., "TechCorp" from "TechCorp Inc.")
            if (lowerQuery.includes(company.toLowerCase()) || lowerQuery.includes(companyBase)) {
                params.company = company;
                companyFound = true;
                break;
            }
        }
    }

    // Extract salary
    const salaryMatch = lowerQuery.match(/(\$|£|€)?(\d{1,3})[,k]?(\d{0,3})/);
    if (salaryMatch && (lowerQuery.includes('salary') || lowerQuery.includes('pay') || lowerQuery.includes('more than') || lowerQuery.includes('above') || salaryMatch[1])) {
        let amount = parseInt(salaryMatch[2]);
        if (salaryMatch[3]) {
            amount = parseInt(salaryMatch[2] + salaryMatch[3]);
        } else if (lowerQuery.includes('k') || amount < 1000) {
            amount *= 1000;
        }
        params.minSalary = amount;
        
        if (salaryMatch[1] === '£') params.currency = 'GBP';
        else if (salaryMatch[1] === '€') params.currency = 'EUR';
    }

    return params;
}

// Search jobs via API
async function searchJobs(params) {
    try {
        const queryParams = new URLSearchParams();
        
        if (params.keyword) queryParams.append('keyword', params.keyword);
        if (params.location) queryParams.append('location', params.location);
        if (params.company) queryParams.append('company', params.company);
        if (params.minSalary) queryParams.append('minSalary', params.minSalary);
        if (params.currency && params.minSalary) queryParams.append('currency', params.currency);
        
        queryParams.append('limit', '20');

        const url = `${API_BASE}/api/jobs/search?${queryParams.toString()}`;
        const response = await fetch(url);
        const data = await response.json();
        
        return data.data || [];
    } catch (error) {
        console.error('Error searching jobs:', error);
        return [];
    }
}

// RAG System: Generate natural language response
function generateResponse(intent, params, jobs) {
    if (intent.type === 'greeting') {
        return "Hello! I'm here to help you find the perfect job. You can ask me about jobs by role, location, company, or salary. What are you looking for?";
    }

    let response = '';
    const jobCount = jobs.length;

    // Build context-aware response with specific filters
    const filters = [];
    if (params.keyword) filters.push(`<strong>role:</strong> "${params.keyword}"`);
    if (params.location) filters.push(`<strong>location:</strong> ${params.location}`);
    if (params.company) filters.push(`<strong>company:</strong> ${params.company}`);
    if (params.minSalary) filters.push(`<strong>salary above:</strong> ${formatCurrency(params.minSalary, params.currency)}`);

    if (jobCount === 0) {
        if (filters.length > 0) {
            response = `I couldn't find any jobs matching your criteria (${filters.join(', ')}). Try adjusting your search or browse all available positions.`;
        } else {
            response = "I couldn't find any jobs matching your criteria. Could you try rephrasing your question?";
        }
    } else {
        const plural = jobCount === 1 ? 'job' : 'jobs';
        if (filters.length > 0) {
            response = `I found <strong>${jobCount} ${plural}</strong> matching (${filters.join(', ')}):`;
        } else {
            response = `I found <strong>${jobCount} ${plural}</strong>. Here are all available positions:`;
        }
    }

    return response;
}

// Add message to chat
function addMessage(text, sender, jobs = null) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const avatar = sender === 'bot' ? '🤖' : '👤';
    
    let content = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <p>${text}</p>
    `;

    // Add job cards if available
    if (jobs && jobs.length > 0) {
        content += '<div class="job-cards">';
        jobs.forEach(job => {
            content += createJobCard(job);
        });
        content += '</div>';
    } else if (jobs && jobs.length === 0 && sender === 'bot') {
        content += `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <p>Try different keywords or filters</p>
            </div>
        `;
    }

    content += '</div>';
    messageDiv.innerHTML = content;
    messagesContainer.appendChild(messageDiv);

    // Add click handlers to job cards
    if (jobs && jobs.length > 0) {
        messageDiv.querySelectorAll('.job-card').forEach((card, index) => {
            card.addEventListener('click', () => showJobDetails(jobs[index]));
        });
    }

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Create job card HTML
function createJobCard(job) {
    return `
        <div class="job-card" data-job-id="${job.id}">
            <div class="job-card-header">
                <div>
                    <div class="job-title">${job.title}</div>
                    <div class="job-company">${job.company}</div>
                </div>
            </div>
            <div class="job-details">
                <span class="job-tag">📍 ${job.location.city}, ${job.location.country}</span>
                <span class="job-tag job-salary">💰 ${job.salary.formatted}</span>
                <span class="job-tag">📅 ${formatDate(job.postedDate)}</span>
            </div>
        </div>
    `;
}

// Show job details in modal
function showJobDetails(job) {
    const modal = document.getElementById('jobModal');
    const detailsDiv = document.getElementById('jobDetails');
    
    detailsDiv.innerHTML = `
        <h2 style="color: var(--primary-color); margin-bottom: 16px;">${job.title}</h2>
        <p style="font-size: 18px; color: var(--text-secondary); margin-bottom: 24px;">
            <strong>${job.company}</strong>
        </p>
        
        <div style="display: grid; gap: 16px; margin-bottom: 24px;">
            <div>
                <strong>📍 Location:</strong><br>
                ${job.location.city}${job.location.state ? ', ' + job.location.state : ''}, ${job.location.country}
            </div>
            
            <div>
                <strong>💰 Salary:</strong><br>
                <span style="color: var(--success-color); font-size: 18px; font-weight: 600;">
                    ${job.salary.formatted}
                </span>
            </div>
            
            <div>
                <strong>📅 Posted:</strong><br>
                ${formatDate(job.postedDate)}
            </div>
            
            <div>
                <strong>📝 Description:</strong><br>
                ${job.description}
            </div>
            
            <div style="font-size: 12px; color: var(--text-secondary);">
                <strong>Job ID:</strong> ${job.id} | <strong>Source:</strong> ${job.sourceId}
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Show typing indicator
function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator-message';
    typingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const indicator = document.querySelector('.typing-indicator-message');
    if (indicator) {
        indicator.remove();
    }
}

// Format currency
function formatCurrency(amount, currency = 'USD') {
    const symbols = { USD: '$', GBP: '£', EUR: '€', CAD: 'CAD $', SGD: 'SGD $' };
    const symbol = symbols[currency] || '$';
    return `${symbol}${amount.toLocaleString()}`;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Resume Upload Handlers
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('resumeText').value = e.target.result;
        };
        reader.readAsText(file);
    } else if (file.type === 'application/pdf') {
        alert('PDF parsing requires a PDF library. For now, please copy and paste your resume text manually.');
    } else {
        alert('Please upload a .txt file or paste your resume text.');
    }
}

async function analyzeResume() {
    const resumeText = document.getElementById('resumeText').value.trim();
    
    if (!resumeText) {
        alert('Please enter or upload your resume first.');
        return;
    }
    
    // Close modal
    document.getElementById('resumeModal').style.display = 'none';
    
    // Add system message
    const systemMessage = 'Analyzing your resume and finding the best job matches...';
    addMessage(systemMessage, 'bot');
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Call API
        const response = await fetch(`${API_BASE}/api/resume/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                resumeText: resumeText,
                topN: 10
            })
        });
        
        const data = await response.json();
        
        removeTypingIndicator();
        
        if (data.success) {
            // Display analysis results
            displayResumeAnalysisResults(data);
        } else {
            addMessage('Sorry, there was an error analyzing your resume. Please try again.', 'bot');
        }
        
    } catch (error) {
        console.error('Resume analysis error:', error);
        removeTypingIndicator();
        addMessage('Sorry, I encountered an error analyzing your resume. Please try again.', 'bot');
    }
}

function displayResumeAnalysisResults(data) {
    const { resumeAnalysis, recommendations, insights } = data;
    
    // Create summary message with AI badge
    let summaryHTML = '<div class="resume-analysis-summary">';
    summaryHTML += '<h3>📊 Resume Analysis Complete! ' + (resumeAnalysis.aiPowered ? '✨ AI-Powered' : '') + '</h3>';
    
    // Show professional summary if available (from AI)
    if (resumeAnalysis.summary) {
        summaryHTML += `<div class="ai-summary"><strong>Professional Summary:</strong> ${resumeAnalysis.summary}</div>`;
    }
    
    summaryHTML += '<div class="analysis-stats">';
    summaryHTML += `<div class="stat-item"><strong>${recommendations.length}</strong> jobs analyzed</div>`;
    summaryHTML += `<div class="stat-item"><strong>${insights.excellentMatches}</strong> excellent matches (80%+)</div>`;
    summaryHTML += `<div class="stat-item"><strong>${insights.goodMatches}</strong> good matches (60-80%)</div>`;
    summaryHTML += `<div class="stat-item">Average match: <strong>${insights.averageScore}%</strong></div>`;
    summaryHTML += '</div>';
    
    if (resumeAnalysis.skills.length > 0) {
        summaryHTML += `<p><strong>🎯 Your key skills:</strong> ${resumeAnalysis.skills.slice(0, 10).join(', ')}${resumeAnalysis.skills.length > 10 ? '...' : ''}</p>`;
    }
    
    if (resumeAnalysis.experience) {
        summaryHTML += `<p><strong>💼 Experience level:</strong> ${resumeAnalysis.experience} years</p>`;
    }
    
    if (resumeAnalysis.education && resumeAnalysis.education.length > 0) {
        summaryHTML += `<p><strong>🎓 Education:</strong> ${resumeAnalysis.education.join(', ')}</p>`;
    }
    
    // Display AI-powered recommendations
    if (insights.recommendations && insights.recommendations.length > 0) {
        summaryHTML += '<div class="ai-recommendations">';
        summaryHTML += '<strong>💡 AI Career Recommendations:</strong>';
        summaryHTML += '<ul>';
        insights.recommendations.forEach(rec => {
            summaryHTML += `<li>${rec}</li>`;
        });
        summaryHTML += '</ul>';
        summaryHTML += '</div>';
    }
    
    summaryHTML += `<p>Here are your top ${recommendations.length} job matches, ranked by compatibility:</p>`;
    summaryHTML += '</div>';
    
    // Add message with summary
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            ${summaryHTML}
        </div>
    `;
    messagesContainer.appendChild(messageDiv);
    
    // Display scored job cards
    displayScoredJobs(recommendations);
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function displayScoredJobs(scoredJobs) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    let jobCardsHTML = '<div class="message-avatar">🎯</div><div class="message-content"><div class="job-cards">';
    
    scoredJobs.forEach(scored => {
        jobCardsHTML += createScoredJobCard(scored);
    });
    
    jobCardsHTML += '</div></div>';
    messageDiv.innerHTML = jobCardsHTML;
    messagesContainer.appendChild(messageDiv);
    
    // Add click handlers
    messageDiv.querySelectorAll('.job-card').forEach((card, index) => {
        card.addEventListener('click', () => showScoredJobDetails(scoredJobs[index]));
    });
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function createScoredJobCard(scored) {
    const { job, percentage, matchLevel, breakdown } = scored;
    const matchClass = matchLevel.toLowerCase().replace(' ', '-');
    
    return `
        <div class="job-card" data-job-id="${job.id}">
            <div class="job-card-header">
                <div>
                    <div class="job-title">${job.title}</div>
                    <div class="job-company">${job.company}</div>
                </div>
                <div class="match-score ${matchClass}">
                    ${percentage}% Match
                </div>
            </div>
            <div class="job-details">
                <span class="job-tag">📍 ${job.location.city}, ${job.location.country}</span>
                <span class="job-tag job-salary">💰 ${job.salary.formatted}</span>
                <span class="job-tag">📅 ${formatDate(job.postedDate)}</span>
            </div>
            <div class="match-details">
                <div class="match-breakdown">
                    <div class="match-item">
                        <span>Skills:</span>
                        <strong>${Math.round(breakdown.skillMatch * 100)}%</strong>
                    </div>
                    <div class="match-item">
                        <span>Role:</span>
                        <strong>${Math.round(breakdown.roleMatch * 100)}%</strong>
                    </div>
                    <div class="match-item">
                        <span>Location:</span>
                        <strong>${Math.round(breakdown.locationMatch * 100)}%</strong>
                    </div>
                    <div class="match-item">
                        <span>Experience:</span>
                        <strong>${Math.round(breakdown.experienceMatch * 100)}%</strong>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showScoredJobDetails(scored) {
    const { job, percentage, matchLevel, breakdown } = scored;
    const modal = document.getElementById('jobModal');
    const detailsDiv = document.getElementById('jobDetails');
    
    const matchClass = matchLevel.toLowerCase().replace(' ', '-');
    
    detailsDiv.innerHTML = `
        <div class="match-score ${matchClass}" style="font-size: 18px; margin-bottom: 16px;">
            ${percentage}% Match - ${matchLevel}
        </div>
        
        <h2 style="color: var(--primary-color); margin-bottom: 16px;">${job.title}</h2>
        <p style="font-size: 18px; color: var(--text-secondary); margin-bottom: 24px;">
            <strong>${job.company}</strong>
        </p>
        
        <div style="background: var(--bg-color); padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h4 style="margin-bottom: 12px;">Match Breakdown:</h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                <div>
                    <strong>Skills Match:</strong> ${Math.round(breakdown.skillMatch * 100)}%
                </div>
                <div>
                    <strong>Role Match:</strong> ${Math.round(breakdown.roleMatch * 100)}%
                </div>
                <div>
                    <strong>Location Match:</strong> ${Math.round(breakdown.locationMatch * 100)}%
                </div>
                <div>
                    <strong>Experience Match:</strong> ${Math.round(breakdown.experienceMatch * 100)}%
                </div>
            </div>
        </div>
        
        <div style="display: grid; gap: 16px; margin-bottom: 24px;">
            <div>
                <strong>📍 Location:</strong><br>
                ${job.location.city}${job.location.state ? ', ' + job.location.state : ''}, ${job.location.country}
            </div>
            
            <div>
                <strong>💰 Salary:</strong><br>
                <span style="color: var(--success-color); font-size: 18px; font-weight: 600;">
                    ${job.salary.formatted}
                </span>
            </div>
            
            <div>
                <strong>📅 Posted:</strong><br>
                ${formatDate(job.postedDate)}
            </div>
            
            <div>
                <strong>📝 Description:</strong><br>
                ${job.description}
            </div>
            
            <div style="font-size: 12px; color: var(--text-secondary);">
                <strong>Job ID:</strong> ${job.id} | <strong>Source:</strong> ${job.sourceId}
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

