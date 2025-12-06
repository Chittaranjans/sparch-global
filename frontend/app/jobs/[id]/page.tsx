'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Job, SimilarJob, InterviewPrep } from '@/lib/api';
import { useUserStore } from '@/lib/store';
import { MapPin, DollarSign, Briefcase, Heart, Send, ArrowLeft, Sparkles, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userId, resumeText } = useUserStore();
  const [job, setJob] = useState<Job | null>(null);
  const [similarJobs, setSimilarJobs] = useState<SimilarJob[]>([]);
  const [interviewPrep, setInterviewPrep] = useState<InterviewPrep | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInterviewPrep, setShowInterviewPrep] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadJobDetails(params.id as string);
    }
  }, [params.id]);

  const loadJobDetails = async (id: string) => {
    setLoading(true);
    try {
      const jobData = await api.getJobById(id);
      setJob(jobData);
      
      // Load similar jobs
      const similar = await api.getSimilarJobs(id, 3, true);
      setSimilarJobs(similar);
    } catch (error) {
      console.error('Failed to load job:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInterviewPrep = async () => {
    if (!job) return;
    try {
      const prep = await api.getInterviewPrep(job.id, resumeText || undefined);
      setInterviewPrep(prep);
      setShowInterviewPrep(true);
    } catch (error) {
      console.error('Failed to load interview prep:', error);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!job) return;
    try {
      if (favorited) {
        await api.removeFavorite(userId, job.id);
      } else {
        await api.addFavorite(userId, job.id);
      }
      setFavorited(!favorited);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleApply = async () => {
    if (!job) return;
    try {
      await api.applyToJob(userId, job.id);
      setApplied(true);
    } catch (error) {
      console.error('Failed to apply:', error);
    }
  };

  // Format location - handle both string and object
  const formatLocation = (location: any): string => {
    if (!location) return '';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      return location.normalized || 
             [location.city, location.state, location.country]
               .filter(Boolean)
               .join(', ') || 
             '';
    }
    return '';
  };

  // Format salary - handle both string and object
  const formatSalary = (salary: any, salaryRange?: any): string => {
    if (salary) {
      if (typeof salary === 'string') return salary;
      if (typeof salary === 'object' && salary.formatted) return salary.formatted;
    }
    if (salaryRange) {
      if (typeof salaryRange === 'string') return salaryRange;
      if (typeof salaryRange === 'object' && salaryRange.formatted) return salaryRange.formatted;
    }
    return '';
  };

  if (loading || !job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Jobs
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <p className="text-xl text-gray-700">{job.company}</p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleFavoriteToggle}
                  className={`p-3 rounded-lg transition ${
                    favorited
                      ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${favorited ? 'fill-current' : ''}`} />
                </button>
                
                {!applied ? (
                  <button
                    onClick={handleApply}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-semibold"
                  >
                    <Send className="w-5 h-5" />
                    Apply Now
                  </button>
                ) : (
                  <span className="px-6 py-3 bg-green-100 text-green-700 rounded-lg font-semibold">
                    ✓ Applied
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-gray-200">
              {job.location && formatLocation(job.location) && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span>{formatLocation(job.location)}</span>
                </div>
              )}
              
              {(job.salary || job.salaryRange) && formatSalary(job.salary, job.salaryRange) && (
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-5 h-5" />
                  <span>{formatSalary(job.salary, job.salaryRange)}</span>
                </div>
              )}
              
              {job.source && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Briefcase className="w-5 h-5" />
                  <span className="capitalize">{job.source}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {job.workType && (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium">
                  {job.workType}
                </span>
              )}
              {job.jobType && (
                <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-medium">
                  {job.jobType}
                </span>
              )}
              {job.experienceLevel && (
                <span className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full font-medium">
                  {job.experienceLevel}
                </span>
              )}
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
            </div>

            {job.requirements && job.requirements.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {job.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {job.skills && job.skills.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interview Prep Button */}
            <button
              onClick={loadInterviewPrep}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition flex items-center justify-center gap-2 font-semibold text-lg"
            >
              <Sparkles className="w-6 h-6" />
              Get AI Interview Preparation
            </button>
          </div>

          {/* Interview Prep Section */}
          {showInterviewPrep && interviewPrep && (
            <div className="bg-white rounded-xl shadow-lg p-8 mt-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Sparkles className="w-7 h-7 text-purple-600" />
                Interview Preparation
                {interviewPrep.aiPowered && (
                  <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                    AI Powered
                  </span>
                )}
              </h2>

              {/* Common Questions */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Common Questions</h3>
                <ul className="space-y-2">
                  {interviewPrep.commonQuestions.map((q, i) => (
                    <li key={i} className="flex gap-2 text-gray-700">
                      <span className="text-indigo-600 font-semibold">{i + 1}.</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Technical Questions */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Technical Questions</h3>
                <ul className="space-y-2">
                  {interviewPrep.technicalQuestions.map((q, i) => (
                    <li key={i} className="flex gap-2 text-gray-700">
                      <span className="text-purple-600 font-semibold">{i + 1}.</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Behavioral Questions */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Behavioral Questions</h3>
                <ul className="space-y-2">
                  {interviewPrep.behavioralQuestions.map((q, i) => (
                    <li key={i} className="flex gap-2 text-gray-700">
                      <span className="text-green-600 font-semibold">{i + 1}.</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Questions to Ask */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Questions to Ask the Interviewer</h3>
                <ul className="space-y-2">
                  {interviewPrep.questionsToAsk.map((q, i) => (
                    <li key={i} className="flex gap-2 text-gray-700">
                      <span className="text-orange-600 font-semibold">•</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preparation Tips */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Preparation Tips</h3>
                <ul className="space-y-2">
                  {interviewPrep.preparationTips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-gray-700">
                      <span className="text-indigo-600">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Similar Jobs */}
          {similarJobs.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Similar Jobs</h2>
              <div className="space-y-4">
                {similarJobs.map((similarJob) => (
                  <Link
                    key={similarJob.id}
                    href={`/jobs/${similarJob.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition"
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">{similarJob.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{similarJob.company}</p>
                    {similarJob.similarityScore && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${similarJob.similarityScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-indigo-600">
                          {similarJob.similarityScore}%
                        </span>
                      </div>
                    )}
                    {similarJob.matchReasons && similarJob.matchReasons.length > 0 && (
                      <p className="text-xs text-gray-500">{similarJob.matchReasons[0]}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
