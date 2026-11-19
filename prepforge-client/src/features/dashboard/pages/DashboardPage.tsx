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

  // ── Derived metrics (all computed from live API data, unchanged) ──
  const totalTarget =
    data.dailyGoal.easyTarget + data.dailyGoal.mediumTarget + data.dailyGoal.hardTarget;
  const totalDone =
    data.dailyGoal.easyDone + data.dailyGoal.mediumDone + data.dailyGoal.hardDone;
  const goalProgress = totalTarget > 0 ? (totalDone / totalTarget) * 100 : 0;

  const completionPercentage =
    data.solved.total + data.solved.remaining > 0
      ? (data.solved.total / (data.solved.total + data.solved.remaining)) * 100
      : 0;

  // ── Chart data — sorted ascending by date ──
  const chartData = [...data.recentActivity]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(activity => ({
      name: new Date(activity.date).toLocaleDateString(undefined, { weekday: 'short' }),
      solved: activity.solvedCount,
      xp: activity.xpEarned,
    }));

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)] leading-tight">
          Dashboard
        </h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
          Welcome back! Here's your progress.
        </p>
      </div>

      {/* ── KPI stat cards (4-grid) ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Streak */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-[var(--bg-elevated)]">
              <Flame className="w-5 h-5 text-orange-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                Current Streak
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-[26px] font-semibold tabular text-[var(--text-primary)] leading-none">
                  {data.streak.current}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">days</span>
              </div>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
                Best: <span className="tabular">{data.streak.longest}</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Total Solved */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-[var(--bg-elevated)]">
              <CheckCircle2 className="w-5 h-5 text-[var(--accent-success)]" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                Total Solved
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-[26px] font-semibold tabular text-[var(--text-primary)] leading-none">
                  {data.solved.total}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  / <span className="tabular">{data.solved.total + data.solved.remaining}</span>
                </span>
              </div>
              <ProgressBar
                value={completionPercentage}
                size="sm"
                className="mt-2"
                color="var(--accent-success)"
              />
            </div>
          </div>
        </Card>

        {/* XP / Level */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-[var(--bg-elevated)]">
              <Trophy className="w-5 h-5 text-[var(--accent-primary)]" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                Level {data.xp.level}
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-[26px] font-semibold tabular text-[var(--text-primary)] leading-none">
                  {Math.round(data.xp.progress * 100)}%
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">to next</span>
              </div>
              <div className="flex items-center justify-between mt-1 mb-1">
                <span className="text-[11px] text-[var(--text-tertiary)] tabular">
                  {data.xp.total} XP total
                </span>
              </div>
              <ProgressBar value={data.xp.progress * 100} size="sm" />
            </div>
          </div>
        </Card>

        {/* Revisions Due */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-[var(--bg-elevated)]">
              <AlertCircle className="w-5 h-5 text-[var(--accent-error)]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                Revisions Due
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-[26px] font-semibold tabular text-[var(--text-primary)] leading-none">
                  {data.revisions.dueToday + data.revisions.overdue}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">today</span>
              </div>
              {data.revisions.upcoming > 0 && (
                <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
                  <span className="tabular">{data.revisions.upcoming}</span> upcoming
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Main content row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Weekly Progress chart — 2/3 width */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" aria-hidden="true" />
              Weekly Progress
            </h2>
          </div>
          <div className="h-56">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="40%">
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-tertiary)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--text-tertiary)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--bg-hover)' }}
                    contentStyle={{
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                    }}
                    itemStyle={{ color: 'var(--text-secondary)' }}
                  />
                  <Bar
                    dataKey="solved"
                    fill="var(--accent-primary)"
                    radius={[3, 3, 0, 0]}
                    name="Problems Solved"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-[var(--text-tertiary)]">No recent activity to show</p>
              </div>
            )}
          </div>
        </Card>

        {/* Right column: Difficulty + Daily Goal */}
        <div className="space-y-6">

          {/* Difficulty Breakdown */}
          <Card className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Solved by Difficulty
            </h2>
            <div className="space-y-3">
              {/* Easy */}
              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="font-medium text-emerald-400">Easy</span>
                  <span className="tabular text-[var(--text-secondary)]">{data.solved.easy}</span>
                </div>
                <ProgressBar
                  value={data.solved.total > 0 ? (data.solved.easy / data.solved.total) * 100 : 0}
                  color="var(--accent-success)"
                />
              </div>
              {/* Medium */}
              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="font-medium text-amber-400">Medium</span>
                  <span className="tabular text-[var(--text-secondary)]">{data.solved.medium}</span>
                </div>
                <ProgressBar
                  value={data.solved.total > 0 ? (data.solved.medium / data.solved.total) * 100 : 0}
                  color="var(--accent-warning)"
                />
              </div>
              {/* Hard */}
              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="font-medium text-rose-400">Hard</span>
                  <span className="tabular text-[var(--text-secondary)]">{data.solved.hard}</span>
                </div>
                <ProgressBar
                  value={data.solved.total > 0 ? (data.solved.hard / data.solved.total) * 100 : 0}
                  color="var(--accent-error)"
                />
              </div>
            </div>
          </Card>

          {/* Daily Goal */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Target className="w-4 h-4 text-[var(--accent-primary)]" aria-hidden="true" />
                Daily Goal
              </h2>
              <span className="text-[12px] font-semibold tabular text-[var(--text-secondary)]">
                {Math.round(goalProgress)}%
              </span>
            </div>
            <ProgressBar value={goalProgress} />
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2 rounded-md bg-[var(--bg-elevated)] text-center">
                <p className="text-[11px] text-[var(--text-tertiary)] mb-1">Easy</p>
                <p className="text-sm font-semibold tabular text-[var(--text-primary)]">
                  {data.dailyGoal.easyDone}/{data.dailyGoal.easyTarget}
                </p>
              </div>
              <div className="p-2 rounded-md bg-[var(--bg-elevated)] text-center">
                <p className="text-[11px] text-[var(--text-tertiary)] mb-1">Medium</p>
                <p className="text-sm font-semibold tabular text-[var(--text-primary)]">
                  {data.dailyGoal.mediumDone}/{data.dailyGoal.mediumTarget}
                </p>
              </div>
              <div className="p-2 rounded-md bg-[var(--bg-elevated)] text-center">
                <p className="text-[11px] text-[var(--text-tertiary)] mb-1">Hard</p>
                <p className="text-sm font-semibold tabular text-[var(--text-primary)]">
                  {data.dailyGoal.hardDone}/{data.dailyGoal.hardTarget}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Recent Activity list ──────────────────────────────── */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--accent-primary)]" aria-hidden="true" />
            Recent Activity
          </h2>
        </div>

        {data.recentActivity.length > 0 ? (
          <div>
            {data.recentActivity.slice(0, 5).map((activity, idx) => (
              <div
                key={activity._id}
                className={[
                  'flex items-center justify-between py-2.5 pl-3',
                  'border-l-2 border-[var(--accent-primary)]/30',
                  idx < Math.min(data.recentActivity.length, 5) - 1
                    ? 'border-b border-b-[var(--border-secondary)] mb-0'
                    : '',
                ].join(' ')}
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {new Date(activity.date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
                    Solved{' '}
                    <span className="tabular font-medium">{activity.solvedCount}</span>{' '}
                    {activity.solvedCount === 1 ? 'problem' : 'problems'}
                  </p>
                </div>
                <Badge variant="info">
                  +<span className="tabular">{activity.xpEarned}</span> XP
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-tertiary)] py-2">No recent activity found.</p>
        )}
      </Card>

    </div>
  );
}
