import clsx from 'clsx';
import type { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const positionStyles = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export default function Tooltip({ children, content, position = 'top', className }: TooltipProps) {
  return (
    <div className={clsx('relative group inline-flex', className)}>
      {children}
      <div
        className={clsx(
          'absolute z-50 px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap',
          'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-primary)]',
          'opacity-0 group-hover:opacity-100 pointer-events-none',
          'transition-opacity duration-200',
          positionStyles[position]
        )}
      >
        {content}
      </div>
    </div>
  );
}
