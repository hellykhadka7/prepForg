import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
}

export default function AuthLayout({ children, title, subtitle, footerText, footerLinkText, footerLinkTo }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">PrepForge</span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
              Track. Practice.<br />Revise. Master.
            </h1>
            <p className="text-white/80 text-lg leading-relaxed">
              Your personal DSA preparation companion. Track progress like LeetCode,
              maintain streaks like Duolingo, and visualize growth like GitHub.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { label: 'Problems', value: '141+' },
                { label: 'Patterns', value: '20' },
                { label: 'Analytics', value: '9+' },
                { label: 'Themes', value: '4' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-white/70">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-white/50">
            © 2024 PrepForge. Built for engineers, by engineers.
          </p>
        </div>

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
      </div>

      {/* Right panel — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[var(--bg-primary)]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)]">PrepForge</span>
          </div>

          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{title}</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-8">{subtitle}</p>

          {children}

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            {footerText}{' '}
            <Link to={footerLinkTo} className="font-medium text-[var(--accent-primary)] hover:underline">
              {footerLinkText}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
