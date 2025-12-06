'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, Job } from '@/lib/api';
import JobCard from '@/components/JobCard';
import AdvancedFilters from '@/components/AdvancedFilters';
import { Search, Loader2, XCircle, AlertTriangle } from 'lucide-react';

export default function JobsPage() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [rejectedJobs, setRejectedJobs] = useState<any[]>([]);
  const [showRejected, setShowRejected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [advancedFilters, setAdvancedFilters] = useState<any>({});

  useEffect(() => {
    loadJobs();
    loadRejectedJobs();
  }, [searchParams]); // Re-run when URL params change

  const loadJobs = async () => {
    setLoading(true);
    try {
      const { jobs } = await api.searchJobs(keyword, location);
      setJobs(jobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRejectedJobs = async () => {
    try {
      const { jobs } = await api.getRejectedJobs();
      setRejectedJobs(jobs);
    } catch (error) {
      console.error('Failed to load rejected jobs:', error);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    setLoading(true);
    try {
      // If advanced filters are set, use them
      if (Object.keys(advancedFilters).length > 0) {
        const result = await api.advancedFilter({
          ...advancedFilters,
          keyword,
          location,
        });
        setJobs(result.jobs);
      } else {
        const { jobs } = await api.searchJobs(keyword, location);
        setJobs(jobs);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedFilter = async (filters: any) => {
    setAdvancedFilters(filters);
    setLoading(true);
    try {
      const result = await api.advancedFilter(filters);
      setJobs(result.jobs);
    } catch (error) {
      console.error('Filter failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Browse Jobs</h1>
        
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Job title, keywords..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full md:w-64 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Search className="w-5 h-5" />
              Search
            </button>
            <AdvancedFilters onFilterChange={handleAdvancedFilter} />
          </form>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${jobs.length} job${jobs.length !== 1 ? 's' : ''} found`}
          </p>
          
          {rejectedJobs.length > 0 && (
            <button
              onClick={() => setShowRejected(!showRejected)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition border border-orange-300"
            >
              <AlertTriangle className="w-4 h-4" />
              {rejectedJobs.length} Rejected Job{rejectedJobs.length !== 1 ? 's' : ''}
              {showRejected ? ' (Hide)' : ' (Show)'}
            </button>
          )}
        </div>
      </div>

      {/* Rejected Jobs Section */}
      {showRejected && rejectedJobs.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Rejected Jobs (Duplicates)</h2>
              <p className="text-sm text-gray-600">These jobs were not added because they already exist in the system</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {rejectedJobs.map((job, index) => (
              <div key={index} className="bg-white border border-orange-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.companyName} · {job.city}, {job.country}</p>
                    <p className="text-xs text-orange-600 mt-1">
                      {job.rejectionReason} · Rejected on {new Date(job.rejectedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                    Duplicate
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jobs Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-gray-600">No jobs found. Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
