'use client';

import { useState, useEffect } from 'react';
import { api, Application, ApplicationStats } from '@/lib/api';
import { useUserStore } from '@/lib/store';
import { Briefcase, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  saved: 'bg-gray-100 text-gray-800',
  applied: 'bg-blue-100 text-blue-800',
  interviewing: 'bg-purple-100 text-purple-800',
  offered: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  withdrawn: 'bg-orange-100 text-orange-800',
};

export default function DashboardPage() {
  const { userId } = useUserStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsData, statsData] = await Promise.all([
        api.getApplications(userId, filter || undefined),
        api.getApplicationStats(userId),
      ]);
      setApplications(appsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: Application['status']) => {
    try {
      await api.updateApplicationStatus(applicationId, userId, newStatus);
      loadData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Application Dashboard</h1>

      {/* Stats Cards */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Briefcase className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Applications</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Interviewing</p>
                <p className="text-3xl font-bold text-gray-900">{stats.byStatus.interviewing || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Offers</p>
                <p className="text-3xl font-bold text-gray-900">{stats.byStatus.offered || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Applied</p>
                <p className="text-3xl font-bold text-gray-900">{stats.byStatus.applied || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === '' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {Object.keys(stats?.byStatus || {}).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({stats?.byStatus[status] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-xl text-gray-600">No applications found.</p>
          <Link
            href="/jobs"
            className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <Link
                    href={`/jobs/${app.jobId}`}
                    className="text-xl font-bold text-gray-900 hover:text-indigo-600 transition"
                  >
                    {app.jobTitle}
                  </Link>
                  <p className="text-gray-600">{app.company}</p>
                </div>

                <select
                  value={app.status}
                  onChange={(e) => handleStatusUpdate(app.id, e.target.value as Application['status'])}
                  className={`px-4 py-2 rounded-lg font-medium ${statusColors[app.status]}`}
                >
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offered">Offered</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>

              <div className="flex gap-4 text-sm text-gray-600 mb-4">
                <span>Applied: {formatDate(app.appliedDate)}</span>
                <span>•</span>
                <span>Last Updated: {formatDate(app.lastUpdated)}</span>
              </div>

              {/* Timeline */}
              {app.timeline && app.timeline.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Timeline:</p>
                  <div className="space-y-2">
                    {app.timeline.slice(0, 3).map((event, index) => (
                      <div key={index} className="flex gap-3 text-sm">
                        <span className="text-gray-500">{formatDate(event.date)}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[event.status]}`}>
                          {event.status}
                        </span>
                        {event.note && <span className="text-gray-600">{event.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
