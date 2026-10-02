import { useQuery } from '@tanstack/react-query';
import { roadmapApi } from '../../../api/roadmap.api';
import { Card, Spinner, ProgressBar, Badge, EmptyState } from '../../../components/ui';
import { Map, ChevronRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RoadmapWithProgress } from '../../../types';

export default function RoadmapsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['roadmaps'],
    queryFn: roadmapApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const system = data?.system || [];
  const personal = data?.personal || [];
  const hasRoadmaps = system.length > 0 || personal.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Roadmaps</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Structured learning paths to master DSA topics
          </p>
        </div>
      </div>

      {!hasRoadmaps && (
        <EmptyState
          icon="🗺️"
          title="No Roadmaps Yet"
          description="Roadmaps will appear here once they're created. Check back soon!"
        />
      )}

      {/* System Roadmaps */}
      {system.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Map className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-wider">
              DSA Roadmaps ({system.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {system.map((roadmap) => (
              <RoadmapCard key={roadmap._id} roadmap={roadmap} />
            ))}
          </div>
        </section>
      )}

      {/* Personal Roadmaps */}
      {personal.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-sky-400 uppercase tracking-wider">
              My Roadmaps ({personal.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personal.map((roadmap) => (
              <RoadmapCard key={roadmap._id} roadmap={roadmap} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Roadmap Card ──────────────────────────────────────────

function RoadmapCard({ roadmap }: { roadmap: RoadmapWithProgress }) {
  const pct = roadmap.userProgress?.percentage || 0;
  const solved = roadmap.userProgress?.solved || 0;
  const total = roadmap.problemCount || 0;

  const progressColor =
    pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : pct >= 20 ? '#06b6d4' : 'var(--gradient-start)';

  return (
    <Link to={`/app/roadmaps/${roadmap._id}`}>
      <Card className="p-5 hover:border-[var(--gradient-start)] transition-colors cursor-pointer group h-full">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--gradient-start)] transition-colors">
            {roadmap.name}
          </h3>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--gradient-start)] transition-colors" />
        </div>

        {roadmap.description && (
          <p className="text-xs text-[var(--text-tertiary)] mb-3 line-clamp-2">{roadmap.description}</p>
        )}

        {roadmap.tags && roadmap.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {roadmap.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="default">{tag}</Badge>
            ))}
          </div>
        )}

        <div className="mt-auto">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-[var(--text-secondary)]">
              {solved}/{total} problems
            </span>
            <span className="text-xs font-medium" style={{ color: progressColor }}>
              {pct}%
            </span>
          </div>
          <ProgressBar value={solved} max={Math.max(total, 1)} size="sm" color={progressColor} />
        </div>
      </Card>
    </Link>
  );
}
