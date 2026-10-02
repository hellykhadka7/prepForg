import { useState, useEffect } from 'react';
import { useProblemNote } from '../hooks/useProblemDetail';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { noteApi } from '../../../api/note.api';
import { Spinner, ErrorState, Button } from '../../../components/ui';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProblemNotesTab({ problemId }: { problemId: string }) {
  const { data: note, isLoading, isError, refetch } = useProblemNote(problemId);
  const [content, setContent] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (note) {
      setContent(note.learning || '');
    }
  }, [note]);

  const { mutate: saveNote, isPending: isSaving } = useMutation({
    mutationFn: (newContent: string) => noteApi.upsert(problemId, { learning: newContent }),
    onSuccess: () => {
      toast.success('Notes saved successfully');
      queryClient.invalidateQueries({ queryKey: ['notes', 'problem', problemId] });
    },
    onError: () => {
      toast.error('Failed to save notes');
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Spinner /></div>;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">Write your personal notes and takeaways here.</p>
        <Button
          size="sm"
          onClick={() => saveNote(content)}
          disabled={isSaving || content === note?.learning}
          className="gap-2"
        >
          <Save className="w-4 h-4" /> Save
        </Button>
      </div>
      <textarea
        className="flex-1 w-full p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none font-mono text-sm"
        placeholder="Write down edge cases, time/space complexity, or general tips..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
    </div>
  );
}
