import clsx from 'clsx';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-primary)]',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  error:   'bg-rose-500/15 text-rose-400 border-rose-500/25',
  info:    'bg-sky-500/15 text-sky-400 border-sky-500/25',
  purple:  'bg-violet-500/15 text-violet-400 border-violet-500/25',
};

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-1.5 py-px rounded-[5px] text-xs font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
