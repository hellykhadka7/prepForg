import { useQuery } from '@tanstack/react-query';
import { achievementApi } from '../../../api/achievement.api';
import { Card, Spinner } from '../../../components/ui';
import type { AchievementDefinition } from '../../../types';

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievements', 'all'],
    queryFn: achievementApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const all = achievements || [];
  const unlocked = all.filter((a) => a.unlocked);
  const locked = all.filter((a) => !a.unlocked);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Achievements</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {unlocked.length} of {all.length} unlocked
        </p>
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
            🏆 Unlocked ({unlocked.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unlocked.map((a) => (
              <AchievementCard key={a.name} achievement={a} />
            ))}
          </div>
        </section>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
            🔒 Locked ({locked.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {locked.map((a) => (
              <AchievementCard key={a.name} achievement={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: AchievementDefinition }) {
  return (
    <Card className={`p-4 ${achievement.unlocked ? 'border-emerald-500/20 bg-emerald-500/5' : 'opacity-60'}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{achievement.icon}</span>
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{achievement.name}</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{achievement.description}</p>
          {achievement.unlocked && achievement.unlockedAt && (
            <p className="text-xs text-emerald-400 mt-1">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
