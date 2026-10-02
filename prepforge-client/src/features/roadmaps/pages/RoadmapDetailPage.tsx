import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { roadmapApi } from '../../../api/roadmap.api';
import { Card, Spinner, Badge, ProgressBar, EmptyState } from '../../../components/ui';
import { ArrowLeft, CheckCircle2, Circle, ExternalLink } from 'lucide-react';

interface RoadmapProblem {
  _id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  week: number;
  orderIndex: number;
  patterns: string[];
  leetcodeUrl: string;
  solved: boolean;
}

interface RoadmapDetail {
  _id: string;
  name: string;
  description: string;
  tags: string[];
  problemIds: RoadmapProblem[];
  userProgress: {
    solved: number;
    total: number;
    percentage: number;
  };
}

export default function RoadmapDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: roadmap, isLoading } = useQuery({
    queryKey: ['roadmaps', id],
    queryFn: () => roadmapApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!roadmap) {
    return <EmptyState icon="🗺️" title="Roadmap Not Found" description="This roadmap does not exist." />;
  }

  const detail = roadmap as unknown as RoadmapDetail;
  const problems = detail.problemIds || [];
  const progress = detail.userProgress;
  const progressColor = progress.percentage >= 80 ? '#10b981' : progress.percentage >= 50 ? '#f59e0b' : '#06b6d4';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/app/roadmaps"
          className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Roadmaps
        </Link>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{detail.name}</h1>
        {detail.description && (
          <p className="text-sm text-[var(--text-secondary)] mt-1">{detail.description}</p>
        )}
      </div>

      {/* Progress Card */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-[var(--text-secondary)]">
            {progress.solved} of {progress.total} problems completed
          </span>
          <span className="text-sm font-bold" style={{ color: progressColor }}>{progress.percentage}%</span>
        </div>
        <ProgressBar value={progress.solved} max={Math.max(progress.total, 1)} size="md" color={progressColor} />
      </Card>

      {/* Problem List */}
      <div className="space-y-2">
        {problems.map((problem, index) => (
          <Card key={problem._id} className={`p-4 ${problem.solved ? 'border-emerald-500/20' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-tertiary)] w-6 text-right">{index + 1}</span>
              {problem.solved ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/app/problems/${problem._id}`}
                  className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--gradient-start)] transition-colors"
                >
                  {problem.title}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant={problem.difficulty === 'Easy' ? 'success' : problem.difficulty === 'Medium' ? 'warning' : 'error'}
                  >
                    {problem.difficulty}
                  </Badge>
                  <span className="text-xs text-[var(--text-tertiary)]">{problem.topic}</span>
                </div>
              </div>
              {problem.leetcodeUrl && (
                <a
                  href={problem.leetcodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>

      {problems.length === 0 && (
        <EmptyState icon="📋" title="No Problems" description="This roadmap has no problems yet." />
      )}
    </div>
  );
}
