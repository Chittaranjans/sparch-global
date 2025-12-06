'use client';

import { useState } from 'react';
import { Job } from '@/lib/api';
import { MapPin, DollarSign, Briefcase, Heart, Send, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { useUserStore } from '@/lib/store';
import Link from 'next/link';

interface JobCardProps {
  job: Job;
  isFavorited?: boolean;
  hasApplied?: boolean;
  onFavoriteToggle?: () => void;
  onApply?: () => void;
}

export default function JobCard({ job, isFavorited = false, hasApplied = false, onFavoriteToggle, onApply }: JobCardProps) {
  const { userId } = useUserStore();
  const [favorited, setFavorited] = useState(isFavorited);
  const [applied, setApplied] = useState(hasApplied);
  const [loading, setLoading] = useState(false);

  const handleFavoriteToggle = async () => {
    setLoading(true);
    try {
      if (favorited) {
        await api.removeFavorite(userId, job.id);
      } else {
        await api.addFavorite(userId, job.id);
      }
      setFavorited(!favorited);
      onFavoriteToggle?.();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      await api.applyToJob(userId, job.id);
      setApplied(true);
      onApply?.();
    } catch (error) {
      console.error('Failed to apply:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (type?: string) => {
    switch (type) {
      case 'remote': return 'bg-green-100 text-green-800';
      case 'hybrid': return 'bg-blue-100 text-blue-800';
      case 'onsite': return 'bg-gray-100 text-gray-800';
      case 'full-time': return 'bg-purple-100 text-purple-800';
      case 'part-time': return 'bg-yellow-100 text-yellow-800';
      case 'contract': return 'bg-orange-100 text-orange-800';
      case 'senior': return 'bg-indigo-100 text-indigo-800';
      case 'mid': return 'bg-teal-100 text-teal-800';
      case 'entry': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Link href={`/jobs/${job.id}`} className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition">
            {job.title}
          </Link>
          <p className="text-lg text-gray-700 mt-1">{job.company}</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleFavoriteToggle}
            disabled={loading}
            className={`p-2 rounded-lg transition ${
              favorited
                ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
          </button>
          
          {!applied ? (
            <button
              onClick={handleApply}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Apply
            </button>
          ) : (
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
              ✓ Applied
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        {job.location && formatLocation(job.location) && (
          <div className="flex items-center gap-1 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{formatLocation(job.location)}</span>
          </div>
        )}
        
        {(job.salary || job.salaryRange) && formatSalary(job.salary, job.salaryRange) && (
          <div className="flex items-center gap-1 text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">{formatSalary(job.salary, job.salaryRange)}</span>
          </div>
        )}
        
        {job.source && (
          <div className="flex items-center gap-1 text-gray-600">
            <Briefcase className="w-4 h-4" />
            <span className="text-sm capitalize">{job.source}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {job.workType && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBadgeColor(job.workType)}`}>
            {job.workType}
          </span>
        )}
        {job.jobType && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBadgeColor(job.jobType)}`}>
            {job.jobType}
          </span>
        )}
        {job.experienceLevel && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBadgeColor(job.experienceLevel)}`}>
            {job.experienceLevel}
          </span>
        )}
      </div>

      <p className="text-gray-600 mb-4 line-clamp-3">
        {job.description}
      </p>

      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {job.skills.slice(0, 5).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 5 && (
            <span className="px-2 py-1 text-gray-500 text-xs">
              +{job.skills.length - 5} more
            </span>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link
          href={`/jobs/${job.id}`}
          className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1"
        >
          View Details
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
