import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Pause, RotateCcw, Send, Check } from 'lucide-react';
import { Button } from '../../../components/ui';
import type { ProblemWithStatus, SubmitSolutionPayload } from '../../../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { solutionApi } from '../../../api/solution.api';
import toast from 'react-hot-toast';


const LANGUAGES = [
  { id: 'python', name: 'Python', defaultCode: 'def solve():\n    pass' },
  { id: 'javascript', name: 'JavaScript', defaultCode: 'function solve() {\n\n}' },
  { id: 'typescript', name: 'TypeScript', defaultCode: 'function solve(): void {\n\n}' },
  { id: 'cpp', name: 'C++', defaultCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}' },
  { id: 'java', name: 'Java', defaultCode: 'class Solution {\n    public static void main(String[] args) {\n        \n    }\n}' },
];

const MISTAKE_TAGS = ['Syntax', 'Logic', 'Edge Case', 'Time Limit', 'Space Limit', 'Misread'];

export default function ProblemWorkspace({ problem }: { problem: ProblemWithStatus }) {
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(language.defaultCode);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  
  const [confidence, setConfidence] = useState<'High' | 'Medium' | 'Low'>('High');
  const [selectedMistakes, setSelectedMistakes] = useState<string[]>([]);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    let interval: number;
    if (isTimerRunning) {
      interval = setInterval(() => setTimeSpent(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = LANGUAGES.find(l => l.id === e.target.value)!;
    setLanguage(lang);
    setCode(lang.defaultCode);
  };

  const { mutate: submitSolution, isPending } = useMutation({
    mutationFn: (payload: SubmitSolutionPayload) => solutionApi.submit(payload),
    onSuccess: () => {
      toast.success('Solution submitted!');
      setShowSubmitForm(false);
      setIsTimerRunning(false);
      setTimeSpent(0);
      setSelectedMistakes([]);
      queryClient.invalidateQueries({ queryKey: ['problems', 'status', problem._id] });
      queryClient.invalidateQueries({ queryKey: ['problems', 'detail', problem._id] });
      queryClient.invalidateQueries({ queryKey: ['solutions', 'problem', problem._id] });
      queryClient.invalidateQueries({ queryKey: ['revisions', 'problem', problem._id] });
    },
    onError: () => toast.error('Failed to submit solution'),
  });

  const handleSubmit = () => {
    submitSolution({
      problemId: problem._id,
      code,
      language: language.id as SubmitSolutionPayload['language'],
      solveDuration: timeSpent,
      confidence: confidence === 'High' ? 5 : confidence === 'Medium' ? 3 : 1,
      mistakes: selectedMistakes as SubmitSolutionPayload['mistakes'],
    });
  };

  const toggleMistake = (tag: string) => {
    setSelectedMistakes(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* Workspace Header */}
      <div className="flex items-center justify-between p-2 border-b border-[#333] bg-[#252526]">
        <select
          value={language.id}
          onChange={handleLanguageChange}
          className="bg-[#333] text-[#ccc] border border-[#444] rounded px-3 py-1 text-sm focus:outline-none focus:border-[var(--accent-primary)]"
        >
          {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#333] rounded px-3 py-1 mr-2">
            <span className="text-[#ccc] text-sm font-mono mr-3 w-12 text-center">{formatTime(timeSpent)}</span>
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="text-[#aaa] hover:text-white mx-1">
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button onClick={() => { setIsTimerRunning(false); setTimeSpent(0); }} className="text-[#aaa] hover:text-white mx-1">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          <Button size="sm" variant="primary" onClick={() => setShowSubmitForm(!showSubmitForm)} className="gap-2 h-8">
            <Send className="w-4 h-4" /> Submit
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language.id}
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
          }}
        />

        {/* Submit Form Overlay */}
        {showSubmitForm && (
          <div className="absolute bottom-0 left-0 right-0 bg-[var(--bg-primary)] border-t border-[var(--border-secondary)] p-6 shadow-2xl z-10 animate-in slide-in-from-bottom-2">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Submit Solution</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Confidence Level</p>
                <div className="flex gap-2">
                  {(['High', 'Medium', 'Low'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => setConfidence(level)}
                      className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                        confidence === level 
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' 
                          : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Mistakes (Optional)</p>
                <div className="flex flex-wrap gap-2">
                  {MISTAKE_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleMistake(tag)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors flex items-center gap-1 ${
                        selectedMistakes.includes(tag)
                          ? 'border-red-500 bg-red-500/10 text-red-500'
                          : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                      }`}
                    >
                      {selectedMistakes.includes(tag) && <Check className="w-3 h-3" />}
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-secondary)]">
                <Button variant="ghost" onClick={() => setShowSubmitForm(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={isPending}>
                  {isPending ? 'Submitting...' : 'Confirm Submission'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
