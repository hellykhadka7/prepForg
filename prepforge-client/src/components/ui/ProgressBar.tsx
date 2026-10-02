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
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
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
          <span className="text-xs text-[var(--text-secondary)]">{Math.round(percentage)}%</span>
          <span className="text-xs text-[var(--text-tertiary)]">{value}/{max}</span>
        </div>
      )}
      <div className={clsx('w-full rounded-full bg-[var(--bg-tertiary)] overflow-hidden', sizeStyles[size])}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            background: color || 'linear-gradient(90deg, var(--gradient-start), var(--gradient-end))',
          }}
        />
      </div>
    </div>
  );
}
