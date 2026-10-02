import { useDashboard } from '../hooks/useDashboard';
import { Card, ProgressBar, Spinner, ErrorState, Badge } from '../../../components/ui';
import { Target, Flame, Trophy, CheckCircle2, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function DashboardPage() {
  const { data: response, isLoading, isError, refetch } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !response) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const data = response;

  // Derived metrics
  const totalTarget =
    data.dailyGoal.easyTarget + data.dailyGoal.mediumTarget + data.dailyGoal.hardTarget;
  const totalDone =
    data.dailyGoal.easyDone + data.dailyGoal.mediumDone + data.dailyGoal.hardDone;
  const goalProgress = totalTarget > 0 ? (totalDone / totalTarget) * 100 : 0;
  
  const completionPercentage =
    data.solved.total + data.solved.remaining > 0
      ? (data.solved.total / (data.solved.total + data.solved.remaining)) * 100
      : 0;

  // Chart data format
  const chartData = [...data.recentActivity]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(activity => ({
      name: new Date(activity.date).toLocaleDateString(undefined, { weekday: 'short' }),
      solved: activity.solvedCount,
      xp: activity.xpEarned,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-[var(--text-secondary)]">Welcome back! Here's your progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Current Streak</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{data.streak.current}</span>
              <span className="text-xs text-[var(--text-tertiary)]">Best: {data.streak.longest}</span>
            </div>
          </div>
        </Card>

        {/* Total Solved */}
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-[var(--text-secondary)]">Total Solved</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{data.solved.total}</span>
              <span className="text-xs text-[var(--text-tertiary)]">/ {data.solved.total + data.solved.remaining}</span>
            </div>
            <ProgressBar value={completionPercentage} size="sm" className="mt-2" color="var(--accent-success)" />
          </div>
        </Card>

        {/* XP Progress */}
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-end">
              <p className="text-sm text-[var(--text-secondary)]">Level {data.xp.level}</p>
              <span className="text-xs text-[var(--text-tertiary)]">{data.xp.total} XP</span>
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{Math.round(data.xp.progress * 100)}%</span>
            </div>
            <ProgressBar value={data.xp.progress * 100} size="sm" className="mt-1" />
          </div>
        </Card>

        {/* Revisions Due */}
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Revisions Due</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {data.revisions.dueToday + data.revisions.overdue}
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">Today</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Weekly Progress
            </h3>
          </div>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'var(--bg-tertiary)' }}
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="solved" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--text-tertiary)]">
                No recent activity to show
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          {/* Difficulty Breakdown */}
          <Card className="space-y-4">
            <h3 className="font-semibold text-[var(--text-primary)]">Solved by Difficulty</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--accent-success)] font-medium">Easy</span>
                  <span className="text-[var(--text-secondary)]">{data.solved.easy}</span>
                </div>
                <ProgressBar value={data.solved.total > 0 ? (data.solved.easy / data.solved.total) * 100 : 0} color="var(--accent-success)" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--accent-warning)] font-medium">Medium</span>
                  <span className="text-[var(--text-secondary)]">{data.solved.medium}</span>
                </div>
                <ProgressBar value={data.solved.total > 0 ? (data.solved.medium / data.solved.total) * 100 : 0} color="var(--accent-warning)" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--accent-error)] font-medium">Hard</span>
                  <span className="text-[var(--text-secondary)]">{data.solved.hard}</span>
                </div>
                <ProgressBar value={data.solved.total > 0 ? (data.solved.hard / data.solved.total) * 100 : 0} color="var(--accent-error)" />
              </div>
            </div>
          </Card>

          {/* Daily Goal */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Target className="w-4 h-4" /> Daily Goal
              </h3>
              <span className="text-sm font-medium text-[var(--text-secondary)]">{Math.round(goalProgress)}%</span>
            </div>
            <ProgressBar value={goalProgress} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-center mt-4">
              <div className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Easy</p>
                <p className="font-semibold text-[var(--text-primary)]">{data.dailyGoal.easyDone}/{data.dailyGoal.easyTarget}</p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Medium</p>
                <p className="font-semibold text-[var(--text-primary)]">{data.dailyGoal.mediumDone}/{data.dailyGoal.mediumTarget}</p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Hard</p>
                <p className="font-semibold text-[var(--text-primary)]">{data.dailyGoal.hardDone}/{data.dailyGoal.hardTarget}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity List */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Recent Activity
          </h3>
        </div>
        {data.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {data.recentActivity.slice(0, 5).map((activity) => (
              <div key={activity._id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-secondary)]">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {new Date(activity.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Solved {activity.solvedCount} {activity.solvedCount === 1 ? 'problem' : 'problems'}
                  </p>
                </div>
                <Badge variant="success">+{activity.xpEarned} XP</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-tertiary)]">No recent activity found.</p>
        )}
      </Card>
    </div>
  );
}
