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

export default function AuthLayout({
  children,
  title,
  subtitle,
  footerText,
  footerLinkText,
  footerLinkTo,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — Branding ──────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[var(--bg-secondary)]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--border-primary) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Subtle top-edge separator */}
        <div className="absolute inset-x-0 top-0 h-px bg-[var(--border-secondary)]" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">

          {/* Logo wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-primary)]/15 flex items-center justify-center">
              <Zap className="h-5 w-5 text-[var(--accent-primary)]" />
            </div>
            <span className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
              PrepForge
            </span>
          </div>

          {/* Brand copy */}
          <div className="max-w-sm">
            <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-5 leading-snug">
              Track. Practice.<br />Revise. Master.
            </h1>
            <p className="text-[var(--text-secondary)] text-base leading-relaxed">
              Your personal DSA preparation companion. Track progress like LeetCode,
              maintain streaks like Duolingo, and visualize growth like GitHub.
            </p>
          </div>

          {/* Footer */}
          <p className="text-sm text-[var(--text-tertiary)]">
            © 2024 PrepForge. Built for engineers, by engineers.
          </p>
        </div>
      </div>

      {/* ── Right panel — Form ─────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[var(--bg-primary)]">
        <div className="w-full max-w-md">

          {/* Mobile logo — preserved */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/15 flex items-center justify-center">
              <Zap className="h-4 w-4 text-[var(--accent-primary)]" />
            </div>
            <span className="text-xl font-semibold text-[var(--text-primary)]">PrepForge</span>
          </div>

          {/* Screen-reader h1 for mobile — desktop h1 is in the left panel */}
          <h1 className="sr-only lg:hidden">PrepForge</h1>

          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{title}</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-8">{subtitle}</p>

          {children}

          <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
            {footerText}{' '}
            <Link
              to={footerLinkTo}
              className="font-medium text-[var(--accent-primary)] hover:underline"
            >
              {footerLinkText}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
