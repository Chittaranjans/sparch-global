// API Service Layer for Backend Integration

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string | { city?: string; state?: string; country?: string; normalized?: string };
  description: string;
  salary?: string | { min?: number; max?: number; currency?: string; formatted?: string };
  minSalary?: number;
  maxSalary?: number;
  salaryRange?: string | { min?: number; max?: number; currency?: string; formatted?: string };
  posted?: string;
  requirements?: string[];
  skills?: string[];
  source?: string;
  workType?: 'remote' | 'hybrid' | 'onsite';
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'freelance';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'accepted' | 'withdrawn';
  appliedDate: string;
  lastUpdated: string;
  timeline: Array<{
    status: string;
    date: string;
    note?: string;
  }>;
  notes?: string[];
}

export interface ApplicationStats {
  total: number;
  byStatus: Record<string, number>;
  recent: Application[];
}

export interface InterviewPrep {
  commonQuestions: string[];
  technicalQuestions: string[];
  behavioralQuestions: string[];
  questionsToAsk: string[];
  preparationTips: string[];
  aiPowered: boolean;
}

export interface SimilarJob extends Job {
  similarityScore: number;
  matchReasons: string[];
  aiPowered: boolean;
}

export interface FilterOptions {
  workTypes: string[];
  jobTypes: string[];
  experienceLevels: string[];
  skills: string[];
  postedDateOptions: Array<{ label: string; days: number }>;
}

class APIService {
  private async fetch(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Job Search & Retrieval
  async searchJobs(keyword?: string, location?: string, limit: number = 100): Promise<{ jobs: Job[]; total: number }> {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (location) params.append('location', location);
    params.append('limit', limit.toString());
    
    const data = await this.fetch(`/api/jobs?${params.toString()}`);
    return { jobs: data.data, total: data.total };
  }

  async getJobById(id: string): Promise<Job> {
    const data = await this.fetch(`/api/jobs/${id}`);
    return data.data;
  }

  // Resume Analysis
  async analyzeResume(resumeText: string, topN: number = 5): Promise<any> {
    return this.fetch('/api/resume/analyze', {
      method: 'POST',
      body: JSON.stringify({ resumeText, topN }),
    });
  }

  // Chat
  async chat(message: string, resumeText?: string): Promise<any> {
    return this.fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, resumeText }),
    });
  }

  // Favorites
  async addFavorite(userId: string, jobId: string): Promise<any> {
    return this.fetch('/api/favorites/add', {
      method: 'POST',
      body: JSON.stringify({ userId, jobId }),
    });
  }

  async removeFavorite(userId: string, jobId: string): Promise<any> {
    return this.fetch('/api/favorites/remove', {
      method: 'POST',
      body: JSON.stringify({ userId, jobId }),
    });
  }

  async getFavorites(userId: string): Promise<{ jobs: Job[]; count: number }> {
    const data = await this.fetch(`/api/favorites/${userId}`);
    return { jobs: data.data, count: data.count };
  }

  // Applications
  async applyToJob(userId: string, jobId: string): Promise<Application> {
    const data = await this.fetch('/api/applications/apply', {
      method: 'POST',
      body: JSON.stringify({ userId, jobId }),
    });
    return data.data;
  }

  async updateApplicationStatus(
    applicationId: string,
    userId: string,
    status: Application['status'],
    note?: string
  ): Promise<Application> {
    const data = await this.fetch(`/api/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ userId, status, note }),
    });
    return data.data;
  }

  async getApplications(userId: string, status?: string, company?: string): Promise<Application[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (company) params.append('company', company);
    
    const data = await this.fetch(`/api/applications/${userId}?${params.toString()}`);
    return data.data;
  }

  async getApplicationStats(userId: string): Promise<ApplicationStats> {
    const data = await this.fetch(`/api/applications/${userId}/stats`);
    return data.data;
  }

  // Similar Jobs
  async getSimilarJobs(jobId: string, limit: number = 5, useAI: boolean = true): Promise<SimilarJob[]> {
    const params = new URLSearchParams({ limit: limit.toString(), ai: useAI.toString() });
    const data = await this.fetch(`/api/jobs/${jobId}/similar?${params.toString()}`);
    return data.similarJobs;
  }

  // Interview Prep
  async getInterviewPrep(jobId: string, resumeText?: string): Promise<InterviewPrep> {
    const data = await this.fetch(`/api/jobs/${jobId}/interview-prep`, {
      method: 'POST',
      body: JSON.stringify({ resumeText }),
    });
    return data.interview;
  }

  // Advanced Filters
  async getFilterOptions(): Promise<FilterOptions> {
    const data = await this.fetch('/api/filters/options');
    return data.data;
  }

  async advancedFilter(filters: {
    workType?: string;
    jobType?: string;
    experienceLevel?: string;
    postedWithinDays?: number;
    minSalary?: number;
    maxSalary?: number;
    skills?: string[];
    benefits?: string[];
  }): Promise<{ jobs: Job[]; count: number }> {
    const data = await this.fetch('/api/jobs/advanced-filter', {
      method: 'POST',
      body: JSON.stringify(filters),
    });
    return { jobs: data.data, count: data.count };
  }

  // Job Posting
  async postJob(jobData: {
    title: string;
    company: string;
    location: string;
    description: string;
    salary?: string;
    workType?: string;
    jobType?: string;
    experienceLevel?: string;
    skills?: string[];
    requirements?: string[];
    benefits?: string[];
  }): Promise<{ success: boolean; data: Job; stats: any }> {
    const data = await this.fetch('/api/jobs/post', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
    return data;
  }

  async bulkPostJobs(jobs: Array<{
    title: string;
    company: string;
    location: string;
    description: string;
    salary?: string;
    workType?: string;
    jobType?: string;
    experienceLevel?: string;
    skills?: string[];
    requirements?: string[];
  }>): Promise<{ success: boolean; jobsPosted: number; stats: any }> {
    const data = await this.fetch('/api/jobs/bulk-post', {
      method: 'POST',
      body: JSON.stringify({ jobs }),
    });
    return data;
  }

  // Rejected Jobs
  async getRejectedJobs(): Promise<{ jobs: Job[]; count: number }> {
    const data = await this.fetch('/api/jobs/rejected');
    return { jobs: data.data, count: data.count };
  }
}

export const api = new APIService();
