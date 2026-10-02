import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalApi } from '../../../api/goal.api';
import { Card, Button, Spinner, ProgressBar, Badge } from '../../../components/ui';
import { Target, Edit3, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({ easyTarget: 3, mediumTarget: 2, hardTarget: 1 });

  const { data: goals, isLoading: loadingGoals } = useQuery({
    queryKey: ['goals'],
    queryFn: goalApi.get,
  });

  // Sync edit values when goals load
  if (goals && editValues.easyTarget !== goals.easyTarget && !isEditing) {
    setEditValues({
      easyTarget: goals.easyTarget,
      mediumTarget: goals.mediumTarget,
      hardTarget: goals.hardTarget,
    });
  }

  const { data: progress, isLoading: loadingProgress } = useQuery({
    queryKey: ['goals', 'progress'],
    queryFn: goalApi.getProgress,
  });

  const { mutate: saveGoals, isPending: saving } = useMutation({
    mutationFn: () => goalApi.upsert(editValues),
    onSuccess: () => {
      toast.success('Goals updated!');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: () => toast.error('Failed to save goals.'),
  });

  if (loadingGoals || loadingProgress) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const easyPct = progress && progress.easyTarget > 0 ? Math.min(100, Math.round((progress.easyDone / progress.easyTarget) * 100)) : 0;
  const medPct = progress && progress.mediumTarget > 0 ? Math.min(100, Math.round((progress.mediumDone / progress.mediumTarget) * 100)) : 0;
  const hardPct = progress && progress.hardTarget > 0 ? Math.min(100, Math.round((progress.hardDone / progress.hardTarget) * 100)) : 0;
  const totalTarget = (progress?.easyTarget || 0) + (progress?.mediumTarget || 0) + (progress?.hardTarget || 0);
  const totalDone = (progress?.easyDone || 0) + (progress?.mediumDone || 0) + (progress?.hardDone || 0);
  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalDone / totalTarget) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Daily Goals</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Set daily problem-solving targets and track your progress
          </p>
        </div>
        {!isEditing ? (
          <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)} className="gap-2">
            <Edit3 className="w-4 h-4" /> Edit Goals
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="gap-1">
              <X className="w-4 h-4" /> Cancel
            </Button>
            <Button size="sm" onClick={() => saveGoals()} disabled={saving} className="gap-1">
              <Save className="w-4 h-4" /> Save
            </Button>
          </div>
        )}
      </div>

      {/* Overall Progress */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Today's Progress</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {totalDone} of {totalTarget} problems · {overallPct}% complete
            </p>
          </div>
          {overallPct >= 100 && (
            <Badge variant="success" className="ml-auto">🎉 Goal Met!</Badge>
          )}
        </div>
        <ProgressBar value={totalDone} max={totalTarget} size="lg" showLabel />
      </Card>

      {/* Goal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GoalCard
          title="Easy"
          done={progress?.easyDone || 0}
          target={progress?.easyTarget || 0}
          percentage={easyPct}
          color="#10b981"
          variant="success"
          editing={isEditing}
          editValue={editValues.easyTarget}
          onEditChange={(v) => setEditValues((prev) => ({ ...prev, easyTarget: v }))}
        />
        <GoalCard
          title="Medium"
          done={progress?.mediumDone || 0}
          target={progress?.mediumTarget || 0}
          percentage={medPct}
          color="#f59e0b"
          variant="warning"
          editing={isEditing}
          editValue={editValues.mediumTarget}
          onEditChange={(v) => setEditValues((prev) => ({ ...prev, mediumTarget: v }))}
        />
        <GoalCard
          title="Hard"
          done={progress?.hardDone || 0}
          target={progress?.hardTarget || 0}
          percentage={hardPct}
          color="#ef4444"
          variant="error"
          editing={isEditing}
          editValue={editValues.hardTarget}
          onEditChange={(v) => setEditValues((prev) => ({ ...prev, hardTarget: v }))}
        />
      </div>

      {/* Tips */}
      <Card className="p-5 border border-[var(--border-primary)]">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">💡 Goal Tips</h3>
        <ul className="space-y-2 text-sm text-[var(--text-tertiary)]">
          <li>• Goals reset daily at midnight UTC</li>
          <li>• Only <strong>first-time solves</strong> count toward goals</li>
          <li>• Progress updates automatically as you submit solutions</li>
          <li>• Start with achievable targets and increase gradually</li>
        </ul>
      </Card>
    </div>
  );
}

// ── Goal Card ─────────────────────────────────────────────

function GoalCard({
  title,
  done,
  target,
  percentage,
  color,
  variant,
  editing,
  editValue,
  onEditChange,
}: {
  title: string;
  done: number;
  target: number;
  percentage: number;
  color: string;
  variant: 'success' | 'warning' | 'error';
  editing: boolean;
  editValue: number;
  onEditChange: (v: number) => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <Badge variant={variant}>{title}</Badge>
        {percentage >= 100 && <span className="text-lg">✅</span>}
      </div>

      {editing ? (
        <div className="mb-3">
          <label className="text-xs text-[var(--text-secondary)] block mb-1">Daily Target</label>
          <input
            type="number"
            min={0}
            max={20}
            value={editValue}
            onChange={(e) => onEditChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--gradient-start)]"
          />
        </div>
      ) : (
        <div className="mb-3">
          <p className="text-3xl font-bold text-[var(--text-primary)]">
            {done}<span className="text-lg text-[var(--text-tertiary)]">/{target}</span>
          </p>
        </div>
      )}

      <ProgressBar value={done} max={Math.max(target, 1)} size="md" color={color} />
      <p className="text-xs text-[var(--text-tertiary)] mt-2">{percentage}% complete</p>
    </Card>
  );
}
