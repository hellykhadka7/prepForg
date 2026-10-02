import clsx from 'clsx';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

export default function SkeletonLoader({ className, variant = 'text', width, height }: SkeletonLoaderProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-[var(--bg-tertiary)]',
        variant === 'text' && 'h-4 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
      style={{ width, height }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 space-y-3">
      <SkeletonLoader variant="text" width="60%" />
      <SkeletonLoader variant="text" width="80%" />
      <SkeletonLoader variant="text" width="40%" />
    </div>
  );
}
