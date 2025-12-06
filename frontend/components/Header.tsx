'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Heart, FileText, Home, Sparkles, Plus } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/dashboard', label: 'Dashboard', icon: FileText },
    { href: '/favorites', label: 'Favorites', icon: Heart },
  ];

  return (
    <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold hover:opacity-90 transition">
            <Sparkles className="w-8 h-8" />
            <span>AI Job Search</span>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="flex gap-6">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      isActive
                        ? 'bg-white/20 font-semibold'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
            
            <Link
              href="/post-job"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-semibold border-2 border-white ${
                pathname === '/post-job'
                  ? 'bg-white text-indigo-600'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span>Post Job</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
