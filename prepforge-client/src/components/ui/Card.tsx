import clsx from 'clsx';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const paddingStyles = {
  none: '',
  sm:  'p-3',
  md:  'p-4',
  lg:  'p-5',
};

export default function Card({ children, className, padding = 'md', hover = false, onClick }: CardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      className={clsx(
        'rounded-[10px] border',
        'bg-[var(--card-bg)] border-[var(--card-border)]',
        'shadow-[var(--card-shadow)]',
        'transition-colors duration-150',
        hover && 'hover:border-[var(--accent-primary)]/40 cursor-pointer',
        onClick && 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]',
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
