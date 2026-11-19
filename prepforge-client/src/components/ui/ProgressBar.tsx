import clsx from 'clsx';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  showLabel?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2.5',
};

export default function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color,
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-[var(--text-secondary)] tabular">{Math.round(percentage)}%</span>
          <span className="text-xs text-[var(--text-tertiary)] tabular">{value}/{max}</span>
        </div>
      )}
      <div
        className={clsx('w-full rounded-full bg-[var(--bg-elevated)] overflow-hidden', sizeStyles[size])}
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            background: color ?? 'var(--accent-primary)',
          }}
        />
      </div>
    </div>
  );
}
