import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProblemDetail } from '../hooks/useProblemDetail';
import { Spinner, ErrorState, Badge, Button, Card } from '../../../components/ui';
import { ArrowLeft, CheckCircle2, Bookmark, AlertCircle, ExternalLink } from 'lucide-react';
import { ROUTES } from '../../../config/routes';
import { useToggleBookmark } from '../hooks/useProblems';
import ProblemWorkspace from '../components/ProblemWorkspace';
import ProblemDescriptionTab from '../components/ProblemDescriptionTab';
import ProblemSolutionsTab from '../components/ProblemSolutionsTab';
import ProblemNotesTab from '../components/ProblemNotesTab';
import ProblemRevisionsTab from '../components/ProblemRevisionsTab';

type Tab = 'description' | 'solutions' | 'notes' | 'revisions';

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: problem, isLoading, isError, refetch } = useProblemDetail(id!);
  const { mutate: toggleBookmark, isPending: isToggling } = useToggleBookmark();
  
  const [activeTab, setActiveTab] = useState<Tab>('description');

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }

  if (isError || !problem) {
    return <div className="flex items-center justify-center min-h-[60vh]"><ErrorState onRetry={() => refetch()} /></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-secondary)] mb-4">
        <div className="flex items-center gap-4">
          <Link to={ROUTES.PROBLEMS}>
            <Button variant="ghost" size="sm" className="px-2">
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{problem.title}</h1>
              {problem.solved && <CheckCircle2 className="w-5 h-5 text-[var(--accent-success)]" />}
              {problem.revisionDue && <AlertCircle className="w-5 h-5 text-[var(--accent-error)]" />}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={problem.difficulty === 'Easy' ? 'success' : problem.difficulty === 'Medium' ? 'warning' : 'error'}>
                {problem.difficulty}
              </Badge>
              <span className="text-xs text-[var(--text-secondary)]">{problem.topic}</span>
              <span className="text-xs text-[var(--text-tertiary)] mx-1">•</span>
              <span className="text-xs text-[var(--text-secondary)]">Week {problem.week}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {problem.leetcodeUrl && (
            <a href={problem.leetcodeUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="w-4 h-4" /> LeetCode
              </Button>
            </a>
          )}
          <Button
            variant={problem.bookmarked ? 'primary' : 'outline'}
            size="sm"
            onClick={() => toggleBookmark(problem._id)}
            disabled={isToggling}
            className="gap-2"
          >
            <Bookmark className={`w-4 h-4 ${problem.bookmarked ? 'fill-current' : ''}`} />
            {problem.bookmarked ? 'Bookmarked' : 'Bookmark'}
          </Button>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Pane: Info Tabs */}
        <Card className="w-1/2 flex flex-col p-0 overflow-hidden border border-[var(--border-secondary)]">
          <div className="flex border-b border-[var(--border-secondary)] overflow-x-auto">
            {(['description', 'solutions', 'notes', 'revisions'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg-primary)]">
            {activeTab === 'description' && <ProblemDescriptionTab problem={problem} />}
            {activeTab === 'solutions' && <ProblemSolutionsTab problemId={problem._id} />}
            {activeTab === 'notes' && <ProblemNotesTab problemId={problem._id} />}
            {activeTab === 'revisions' && <ProblemRevisionsTab problemId={problem._id} />}
          </div>
        </Card>

        {/* Right Pane: Workspace */}
        <Card className="w-1/2 flex flex-col p-0 overflow-hidden border border-[var(--border-secondary)]">
          <ProblemWorkspace problem={problem} />
        </Card>
      </div>
    </div>
  );
}
