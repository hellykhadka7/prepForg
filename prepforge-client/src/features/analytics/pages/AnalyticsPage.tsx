import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../../api/analytics.api';
import { activityApi } from '../../../api/activity.api';
import { Card, Spinner, Badge } from '../../../components/ui';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { TrendingUp, Target, Zap, Brain, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6'];
const DIFFICULTY_COLORS: Record<string, string> = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' };

export default function AnalyticsPage() {
  const { user } = useAuth();

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: analyticsApi.getSummary,
  });

  const { data: weekly, isLoading: loadingWeekly } = useQuery({
    queryKey: ['analytics', 'weekly'],
    queryFn: analyticsApi.getWeekly,
  });

  const { data: xpGrowth } = useQuery({
    queryKey: ['analytics', 'xp-growth'],
    queryFn: analyticsApi.getXPGrowth,
  });

  const { data: confidence } = useQuery({
    queryKey: ['analytics', 'confidence'],
    queryFn: analyticsApi.getConfidence,
  });

  const { data: solveTime } = useQuery({
    queryKey: ['analytics', 'solve-time'],
    queryFn: analyticsApi.getSolveTime,
  });

  const { data: streak } = useQuery({
    queryKey: ['activities', 'streak'],
    queryFn: activityApi.getStreak,
  });

  if (loadingSummary || loadingWeekly) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const difficultyData = summary?.difficulty
    ? Object.entries(summary.difficulty).map(([name, value]) => ({ name, value }))
    : [];

  const topicData = summary?.topics?.map((t) => ({
    topic: t._id,
    solved: t.solved,
    confidence: Math.round(t.avgConfidence * 10) / 10,
  })) || [];

  const patternData = summary?.patterns?.map((p) => ({
    name: p._id,
    count: p.count,
  })) || [];

  const mistakeData = summary?.mistakes?.map((m) => ({
    name: m._id,
    count: m.count,
  })) || [];

  const totalSolved = difficultyData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Deep insights into your problem-solving journey
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Target className="w-5 h-5" />} label="Problems Solved" value={totalSolved} color="text-emerald-400" />
        <StatCard icon={<Zap className="w-5 h-5" />} label="Total XP" value={user?.totalXP || 0} color="text-violet-400" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Current Streak" value={streak?.currentStreak || 0} color="text-amber-400" suffix=" days" />
        <StatCard icon={<Brain className="w-5 h-5" />} label="Level" value={user?.currentLevel || 1} color="text-sky-400" />
      </div>

      {/* Row 1: Weekly Progress + Difficulty Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Weekly Progress
          </h3>
          {weekly && weekly.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis dataKey="week" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
                <RechartsTooltip
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="easy" name="Easy" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="medium" name="Medium" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                <Bar dataKey="hard" name="Hard" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-10">No weekly data yet.</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Difficulty Breakdown
          </h3>
          {difficultyData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {difficultyData.map((entry) => (
                    <Cell key={entry.name} fill={DIFFICULTY_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-10">No data yet.</p>
          )}
        </Card>
      </div>

      {/* Row 2: XP Growth + Topic Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            XP Growth
          </h3>
          {xpGrowth && xpGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={xpGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
                <RechartsTooltip
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8 }}
                  labelFormatter={(d) => new Date(String(d)).toLocaleDateString()}
                />
                <Line type="monotone" dataKey="cumulativeXP" name="Total XP" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-10">No XP data yet.</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Topic Coverage
          </h3>
          {topicData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={topicData.slice(0, 8)}>
                <PolarGrid stroke="var(--border-primary)" />
                <PolarAngleAxis dataKey="topic" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }} />
                <Radar name="Solved" dataKey="solved" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-10">No topic data yet.</p>
          )}
        </Card>
      </div>

      {/* Row 3: Pattern Distribution + Mistakes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Pattern Distribution
          </h3>
          {patternData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={patternData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis type="number" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} width={100} />
                <RechartsTooltip
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 8 }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]}>
                  {patternData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-10">No pattern data yet.</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Common Mistakes
          </h3>
          {mistakeData.length > 0 ? (
            <div className="space-y-3">
              {mistakeData.map((m, i) => (
                <div key={m.name} className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4" style={{ color: COLORS[i % COLORS.length] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-[var(--text-primary)] truncate">{m.name}</span>
                      <span className="text-xs text-[var(--text-secondary)]">{m.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (m.count / Math.max(...mistakeData.map(d => d.count))) * 100)}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-10">No mistakes recorded yet! 🎉</p>
          )}
        </Card>
      </div>

      {/* Row 4: Confidence + Solve Time + Revision Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Avg Confidence by Difficulty
          </h3>
          {confidence && confidence.length > 0 ? (
            <div className="space-y-4">
              {confidence.map((c) => (
                <div key={c._id}>
                  <div className="flex justify-between items-center mb-1">
                    <Badge variant={c._id === 'Easy' ? 'success' : c._id === 'Medium' ? 'warning' : 'error'}>
                      {c._id}
                    </Badge>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {(c.avgConfidence).toFixed(1)} / 5
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(c.avgConfidence / 5) * 100}%`,
                        backgroundColor: DIFFICULTY_COLORS[c._id],
                      }}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{c.count} submissions</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-10">No data yet.</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            <Clock className="w-4 h-4 inline mr-1" />
            Avg Solve Time
          </h3>
          {solveTime && solveTime.length > 0 ? (
            <div className="space-y-4">
              {solveTime.map((s) => (
                <div key={s._id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]">
                  <Badge variant={s._id === 'Easy' ? 'success' : s._id === 'Medium' ? 'warning' : 'error'}>
                    {s._id}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {Math.round(s.avgTime / 60)} min avg
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {Math.round(s.minTime / 60)}–{Math.round(s.maxTime / 60)} min range
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-10">No timed data yet.</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Revision Completion
          </h3>
          {summary?.revisions ? (
            <div className="space-y-4">
              <p className="text-xs text-[var(--text-tertiary)]">{summary.revisions.total} total revisions tracked</p>
              {(['revision1Rate', 'revision2Rate', 'revision3Rate'] as const).map((key, i) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-[var(--text-primary)]">Rev {i + 1} ({[1, 7, 30][i]}d)</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">{summary.revisions[key]}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${summary.revisions[key]}%`,
                        backgroundColor: COLORS[i],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-10">No revisions yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  suffix = '',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  suffix?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`${color}`}>{icon}</div>
        <div>
          <p className="text-xs text-[var(--text-secondary)]">{label}</p>
          <p className="text-xl font-bold text-[var(--text-primary)]">
            {value.toLocaleString()}{suffix}
          </p>
        </div>
      </div>
    </Card>
  );
}
