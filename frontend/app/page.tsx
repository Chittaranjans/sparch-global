'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Upload, Sparkles, TrendingUp, Users, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { useUserStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const { resumeText, setResumeText } = useUserStore();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [resume, setResume] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (location) params.append('location', location);
    router.push(`/jobs?${params.toString()}`);
  };

  const handleResumeAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resume.trim()) return;

    setLoading(true);
    try {
      setResumeText(resume);
      const result = await api.analyzeResume(resume, 10);
      router.push('/jobs?analyzed=true');
    } catch (error) {
      console.error('Resume analysis failed:', error);
      alert('Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setResume(text);
    };

    reader.onerror = () => {
      alert('Failed to read file. Please try again.');
    };

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      alert('PDF support coming soon! Please paste your resume as text or upload a .txt file.');
    } else {
      reader.readAsText(file);
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Matching',
      description: 'Smart algorithms match your skills with the perfect opportunities',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: TrendingUp,
      title: 'Career Insights',
      description: 'Get personalized recommendations to advance your career',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Zap,
      title: 'Instant Applications',
      description: 'Apply to multiple jobs with one click and track your progress',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Users,
      title: 'Interview Prep',
      description: 'AI-generated interview questions tailored to each position',
      color: 'from-green-500 to-emerald-500'
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Find Your Dream Job with AI
            </h1>
            <p className="text-xl md:text-2xl mb-12 opacity-90">
              Powered by advanced AI technology to match you with the perfect opportunities
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-6 mb-8">
              <div className="grid md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Job title, keywords..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Search Jobs
                </button>
              </div>
            </form>

            {/* Resume Upload Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Upload className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Upload Your Resume for AI Matching</h2>
              </div>
              <p className="mb-6 opacity-90 text-center">
                Get personalized job recommendations based on your skills and experience
              </p>
              
              <form onSubmit={handleResumeAnalysis}>
                {/* File Upload Button */}
                <div className="mb-4">
                  <label className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 transition cursor-pointer border-2 border-dashed border-white/40 hover:border-white/60">
                    <Upload className="w-5 h-5" />
                    <span className="font-semibold">
                      {fileName || 'Choose Resume File (.txt, .pdf, .doc)'}
                    </span>
                    <input
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Or Divider */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-px bg-white/30"></div>
                  <span className="text-white/70 font-medium">OR</span>
                  <div className="flex-1 h-px bg-white/30"></div>
                </div>

                {/* Text Area */}
                <textarea
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  placeholder="Paste your resume here or describe your skills, experience, and preferred location..."
                  className="w-full px-4 py-3 rounded-lg border-2 border-white/30 focus:ring-2 focus:ring-white focus:border-white bg-white text-gray-900 placeholder:text-gray-500 min-h-40 mb-4 shadow-lg"
                />
                
                {fileName && (
                  <p className="text-sm text-white/80 mb-4">
                    ✓ File loaded: {fileName}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !resume.trim()}
                  className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto shadow-lg"
                >
                  <Sparkles className="w-6 h-6" />
                  {loading ? 'Analyzing...' : 'Analyze Resume & Find Jobs'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
            Why Choose Our Platform?
          </h2>
          <p className="text-xl text-center text-gray-600 mb-12">
            Experience the future of job searching with our AI-powered features
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow p-6 border border-gray-100"
                >
                  <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">1000+</div>
              <div className="text-xl opacity-90">Active Jobs</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">95%</div>
              <div className="text-xl opacity-90">Match Accuracy</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-xl opacity-90">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4 text-gray-900">
            Ready to Find Your Dream Job?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of job seekers using AI to land their perfect role
          </p>
          <button
            onClick={() => router.push('/jobs')}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold text-lg"
          >
            Browse All Jobs
          </button>
        </div>
      </section>
    </div>
  );
}
