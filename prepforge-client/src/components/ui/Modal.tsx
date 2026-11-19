import { useEffect, useRef, type ReactNode } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hideCloseButton?: boolean;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md', hideCloseButton }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);

  // Close on Escape; trap body scroll
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
      // Move focus into the modal panel
      setTimeout(() => panelRef.current?.focus(), 20);
    }
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={clsx(
          'relative w-full rounded-xl border outline-none',
          'bg-[var(--bg-elevated)] border-[var(--border-primary)]',
          'shadow-2xl',
          'animate-fade-in',
          sizeStyles[size]
        )}
      >
        {/* Header */}
        {(title || !hideCloseButton) && (
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-primary)]">
            {title && (
              <h2 id="modal-title" className="text-base font-semibold text-[var(--text-primary)]">
                {title}
              </h2>
            )}
            {!hideCloseButton && (
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="ml-auto p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
