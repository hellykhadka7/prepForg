import { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useCreateProblem } from '../hooks/useProblems';
import { Button, Input } from '../../../components/ui';
import { PATTERNS } from '../../../config/constants';
import type { Difficulty, Pattern, CreateCustomProblemPayload } from '../../../types';

// ── Types ─────────────────────────────────────────────────

interface AddProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────

const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

const difficultyStyle = (d: Difficulty, selected: boolean) => {
  const base = 'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer';
  if (!selected) return `${base} border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]`;
  const active: Record<Difficulty, string> = {
    Easy: `${base} bg-emerald-500/15 border-emerald-500/50 text-emerald-400`,
    Medium: `${base} bg-amber-500/15 border-amber-500/50 text-amber-400`,
    Hard: `${base} bg-rose-500/15 border-rose-500/50 text-rose-400`,
  };
  return active[d];
};

// ── Component ─────────────────────────────────────────────

interface FormState {
  title: string;
  difficulty: Difficulty;
  topic: string;
  sourceUrl: string;
  description: string;
  patterns: Pattern[];
}

const DEFAULT_FORM: FormState = {
  title: '',
  difficulty: 'Medium',
  topic: '',
  sourceUrl: '',
  description: '',
  patterns: [],
};

export default function AddProblemModal({ isOpen, onClose }: AddProblemModalProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const { mutate: createProblem, isPending } = useCreateProblem();

  if (!isOpen) return null;

  // ── Validation ─────────────────────────────────────────

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    else if (form.title.trim().length < 3) next.title = 'Title must be at least 3 characters.';
    if (form.sourceUrl && !/^https?:\/\/.+/.test(form.sourceUrl.trim())) {
      next.sourceUrl = 'Must be a valid URL starting with http:// or https://';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Handlers ───────────────────────────────────────────

  const handleClose = () => {
    if (!isPending) {
      setForm(DEFAULT_FORM);
      setErrors({});
      onClose();
    }
  };

  const togglePattern = (p: Pattern) => {
    setForm(prev => ({
      ...prev,
      patterns: prev.patterns.includes(p)
        ? prev.patterns.filter(x => x !== p)
        : [...prev.patterns, p],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateCustomProblemPayload = {
      title: form.title.trim(),
      difficulty: form.difficulty,
      topic: form.topic.trim() || undefined,
      sourceUrl: form.sourceUrl.trim() || undefined,
      description: form.description.trim() || undefined,
      patterns: form.patterns.length > 0 ? form.patterns : undefined,
    };

    createProblem(payload, {
      onSuccess: () => {
        toast.success(`"${payload.title}" added to your problem list.`);
        setForm(DEFAULT_FORM);
        setErrors({});
        onClose();
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(msg || 'Failed to create problem. Please try again.');
      },
    });
  };

  // ── Render ─────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-problem-title"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-xl border bg-[var(--bg-secondary)] border-[var(--border-primary)] shadow-2xl animate-fade-in overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[var(--accent-primary)]" />
            <h2 id="add-problem-title" className="text-base font-semibold text-[var(--text-primary)]">
              Add Custom Problem
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">

            {/* Title — required */}
            <div>
              <Input
                id="add-problem-title-input"
                label="Problem Title *"
                placeholder="e.g. Maximum Subarray"
                value={form.title}
                onChange={e => {
                  setForm(prev => ({ ...prev, title: e.target.value }));
                  if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
                }}
                error={errors.title}
                autoFocus
                disabled={isPending}
              />
            </div>

            {/* Difficulty — required */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Difficulty *
              </label>
              <div className="flex gap-2">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, difficulty: d }))}
                    className={difficultyStyle(d, form.difficulty === d)}
                    disabled={isPending}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic — optional */}
            <Input
              id="add-problem-topic"
              label="Topic (optional)"
              placeholder="e.g. Array, Tree, Graph…"
              value={form.topic}
              onChange={e => setForm(prev => ({ ...prev, topic: e.target.value }))}
              disabled={isPending}
            />

            {/* Source URL — optional */}
            <div>
              <Input
                id="add-problem-url"
                label="Source URL (optional)"
                placeholder="https://leetcode.com/problems/…"
                value={form.sourceUrl}
                onChange={e => {
                  setForm(prev => ({ ...prev, sourceUrl: e.target.value }));
                  if (errors.sourceUrl) setErrors(prev => ({ ...prev, sourceUrl: undefined }));
                }}
                error={errors.sourceUrl}
                disabled={isPending}
              />
            </div>

            {/* Description — optional */}
            <div>
              <label htmlFor="add-problem-description" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Description / Notes (optional)
              </label>
              <textarea
                id="add-problem-description"
                rows={3}
                placeholder="Brief description of the problem or personal notes…"
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                disabled={isPending}
                className={clsx(
                  'w-full rounded-lg border px-3 py-2.5 text-sm resize-none',
                  'bg-[var(--bg-input)] border-[var(--border-primary)] text-[var(--text-primary)]',
                  'placeholder:text-[var(--text-tertiary)]',
                  'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]',
                  'transition-colors duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              />
            </div>

            {/* Patterns — optional multi-select */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Patterns (optional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PATTERNS.map(p => {
                  const selected = form.patterns.includes(p as Pattern);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePattern(p as Pattern)}
                      disabled={isPending}
                      className={clsx(
                        'px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer',
                        selected
                          ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/50 text-[var(--accent-primary)]'
                          : 'bg-[var(--bg-tertiary)] border-[var(--border-secondary)] text-[var(--text-tertiary)] hover:border-[var(--text-tertiary)]'
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              {form.patterns.length > 0 && (
                <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5">
                  {form.patterns.length} pattern{form.patterns.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
            <p className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Only you can see and edit this problem.
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isPending}>
                Add Problem
              </Button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
