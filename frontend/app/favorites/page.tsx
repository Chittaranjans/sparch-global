'use client';

import { useState, useEffect } from 'react';
import { api, Job } from '@/lib/api';
import { useUserStore } from '@/lib/store';
import JobCard from '@/components/JobCard';
import { Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function FavoritesPage() {
  const { userId } = useUserStore();
  const [favorites, setFavorites] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const { jobs } = await api.getFavorites(userId);
      setFavorites(jobs);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-10 h-10 text-pink-600 fill-current" />
        <h1 className="text-4xl font-bold text-gray-900">Favorite Jobs</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-600 mb-4">No favorite jobs yet.</p>
          <p className="text-gray-500 mb-6">
            Start adding jobs to your favorites to keep track of opportunities you're interested in.
          </p>
          <Link
            href="/jobs"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-6">
            You have {favorites.length} favorite job{favorites.length !== 1 ? 's' : ''}
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {favorites.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isFavorited={true}
                onFavoriteToggle={loadFavorites}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
