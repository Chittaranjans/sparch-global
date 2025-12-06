'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Building2, MapPin, FileText, DollarSign, Calendar, Users, Plus, Sparkles, CheckCircle, Loader2, Upload, Database, GitMerge } from 'lucide-react';
import { api } from '@/lib/api';

export default function PostJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [processingStep, setProcessingStep] = useState<'uploading' | 'normalizing' | 'deduplicating' | 'complete'>('uploading');
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    salary: '',
    workType: 'remote',
    jobType: 'full-time',
    experienceLevel: 'mid',
    skills: '',
    requirements: '',
    benefits: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.company || !formData.location || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setShowSuccess(false);
    setProcessingStep('uploading');
    
    try {
      const jobData = {
        title: formData.title,
        company: formData.company,
        location: formData.location,
        description: formData.description,
        salary: formData.salary || undefined,
        workType: formData.workType,
        jobType: formData.jobType,
        experienceLevel: formData.experienceLevel,
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        requirements: formData.requirements ? formData.requirements.split('\n').map(r => r.trim()).filter(Boolean) : [],
        benefits: formData.benefits ? formData.benefits.split(',').map(b => b.trim()).filter(Boolean) : [],
      };

      console.log('Posting job:', jobData);
      
      // Simulate processing steps
      setTimeout(() => setProcessingStep('normalizing'), 500);
      setTimeout(() => setProcessingStep('deduplicating'), 1000);
      
      const result = await api.postJob(jobData);
      
      console.log('Job posted successfully:', result);
      
      if (result.success) {
        setProcessingStep('complete');
        setSuccessData(result);
        setShowSuccess(true);
        
        // Force refresh and redirect after 2 seconds
        setTimeout(() => {
          // Force a hard refresh by adding timestamp
          router.push(`/jobs?refresh=${Date.now()}`);
          router.refresh();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Failed to post job:', error);
      alert(`Failed to post job: ${error.message}\n\nMake sure the backend server is running on http://localhost:3000`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {/* Processing/Success Overlay */}
      {(loading || showSuccess) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform animate-in fade-in zoom-in duration-300">
            {loading && !showSuccess ? (
              /* Processing Steps */
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Processing Your Job...
                </h2>

                {/* Progress Steps */}
                <div className="space-y-4 mb-6">
                  {/* Uploading */}
                  <div className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    processingStep === 'uploading' 
                      ? 'bg-indigo-50 border-2 border-indigo-500' 
                      : processingStep === 'normalizing' || processingStep === 'deduplicating' || processingStep === 'complete'
                      ? 'bg-green-50 border-2 border-green-500'
                      : 'bg-gray-50 border-2 border-gray-200'
                  }`}>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      processingStep === 'uploading'
                        ? 'bg-indigo-500'
                        : processingStep === 'normalizing' || processingStep === 'deduplicating' || processingStep === 'complete'
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}>
                      {processingStep === 'uploading' ? (
                        <Upload className="w-5 h-5 text-white animate-pulse" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900">Uploading Job</div>
                      <div className="text-sm text-gray-600">Sending data to server...</div>
                    </div>
                  </div>

                  {/* Normalizing */}
                  <div className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    processingStep === 'normalizing'
                      ? 'bg-indigo-50 border-2 border-indigo-500'
                      : processingStep === 'deduplicating' || processingStep === 'complete'
                      ? 'bg-green-50 border-2 border-green-500'
                      : 'bg-gray-50 border-2 border-gray-200'
                  }`}>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      processingStep === 'normalizing'
                        ? 'bg-indigo-500'
                        : processingStep === 'deduplicating' || processingStep === 'complete'
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}>
                      {processingStep === 'normalizing' ? (
                        <Database className="w-5 h-5 text-white animate-pulse" />
                      ) : processingStep === 'deduplicating' || processingStep === 'complete' ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <Database className="w-5 h-5 text-white opacity-50" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900">Normalizing Data</div>
                      <div className="text-sm text-gray-600">Standardizing job information...</div>
                    </div>
                  </div>

                  {/* Deduplicating */}
                  <div className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    processingStep === 'deduplicating'
                      ? 'bg-indigo-50 border-2 border-indigo-500'
                      : processingStep === 'complete'
                      ? 'bg-green-50 border-2 border-green-500'
                      : 'bg-gray-50 border-2 border-gray-200'
                  }`}>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      processingStep === 'deduplicating'
                        ? 'bg-indigo-500'
                        : processingStep === 'complete'
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}>
                      {processingStep === 'deduplicating' ? (
                        <GitMerge className="w-5 h-5 text-white animate-pulse" />
                      ) : processingStep === 'complete' ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <GitMerge className="w-5 h-5 text-white opacity-50" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900">Checking Duplicates</div>
                      <div className="text-sm text-gray-600">Running deduplication...</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Success State */
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Job Uploaded Successfully! 🎉
                </h2>
                
                <p className="text-gray-600 mb-6">
                  Your job has been processed and added to the platform
                </p>

                {/* Stats */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Processing Results</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Unique Jobs</span>
                      <span className="text-2xl font-bold text-indigo-600">
                        {successData?.stats?.uniqueJobs || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Duplicates Removed</span>
                      <span className="text-2xl font-bold text-purple-600">
                        {successData?.stats?.duplicatesRemoved || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Job Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {successData?.data?.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {successData?.data?.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {successData?.data?.location}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  Redirecting to jobs page in 2 seconds...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Post a New Job</h1>
              <p className="text-gray-600">Add a job listing to the platform</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <strong>Auto-processing enabled:</strong> Your job will be automatically normalized, 
                deduplicated, and indexed for AI-powered matching.
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Basic Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Senior Software Engineer"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g., TechCorp Inc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., San Francisco, CA or Remote"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Job Details
            </h2>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Type
                </label>
                <select
                  name="workType"
                  value={formData.workType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Experience Level
                </label>
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="lead">Lead</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Salary Range
              </label>
              <input
                type="text"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="e.g., $120,000 - $150,000 or 120000-150000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
              <p className="text-sm text-gray-500 mt-1">Format: $min - $max or min-max</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the role, responsibilities, and what makes this opportunity great..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-40 text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                placeholder="List each requirement on a new line&#10;• 5+ years of experience&#10;• Bachelor's degree in CS&#10;• Strong problem-solving skills"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-32 text-gray-900 placeholder:text-gray-400"
              />
              <p className="text-sm text-gray-500 mt-1">One requirement per line</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g., JavaScript, React, Node.js, PostgreSQL"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
              <p className="text-sm text-gray-500 mt-1">Comma-separated list</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Benefits
              </label>
              <input
                type="text"
                name="benefits"
                value={formData.benefits}
                onChange={handleChange}
                placeholder="e.g., Health Insurance, 401k, Remote Work, PTO"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
              <p className="text-sm text-gray-500 mt-1">Comma-separated list</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Post Job
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/jobs')}
              className="px-6 py-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
