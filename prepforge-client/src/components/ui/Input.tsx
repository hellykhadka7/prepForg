import { forwardRef, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[var(--text-secondary)] tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              // Uniform height: h-9 (36px) per design plan
              'w-full h-9 rounded-md border px-3 text-sm',
              'bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]',
              'placeholder:text-[var(--text-tertiary)]',
              'focus:outline-none focus:border-[var(--border-active)] focus:ring-1 focus:ring-[var(--border-active)]/50',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon  && 'pl-9',
              rightIcon && 'pr-9',
              error && 'border-[var(--accent-error)] focus:border-[var(--accent-error)] focus:ring-[var(--accent-error)]/30',
              className
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-[var(--accent-error)]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-[var(--text-tertiary)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
