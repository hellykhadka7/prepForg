import { useState } from 'react';
import { Card, Button, Badge } from '../../../components/ui';
import { Download, Upload, FileJson, FileArchive, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';

export default function ImportExportPage() {
  const [exportingJSON, setExportingJSON] = useState(false);
  const [exportingZIP, setExportingZIP] = useState(false);
  
  const handleExportJSON = async () => {
    setExportingJSON(true);
    try {
      const response = await api.get('/export/json', { responseType: 'blob' });
      downloadBlob(response.data, 'prepforge-export.json');
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExportingJSON(false);
    }
  };

  const handleExportZIP = async () => {
    setExportingZIP(true);
    try {
      const response = await api.get('/export/zip', { responseType: 'blob' });
      downloadBlob(response.data, 'prepforge-export.zip');
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExportingZIP(false);
    }
  };

  const handleExportPDF = () => {
    toast('PDF export is coming in Phase 6!', { icon: '🚧' });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Data Management</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Export your data or import from previous backups.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EXPORT SECTION */}
        <Card className="p-6 border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-primary)] pb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Export Data</h2>
              <p className="text-sm text-[var(--text-secondary)]">Download a copy of your progress</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                  <FileJson className="w-4 h-4 text-sky-400" />
                  JSON Export
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">All your data in a single JSON file. Best for developers.</div>
              </div>
              <Button onClick={handleExportJSON} disabled={exportingJSON} size="sm" className="w-full sm:w-auto">
                {exportingJSON ? 'Exporting...' : 'Export JSON'}
              </Button>
            </div>

            <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                  <FileArchive className="w-4 h-4 text-amber-400" />
                  ZIP Archive
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">Organized multiple JSON files. Recommended for backups.</div>
              </div>
              <Button onClick={handleExportZIP} disabled={exportingZIP} size="sm" className="w-full sm:w-auto">
                {exportingZIP ? 'Exporting...' : 'Export ZIP'}
              </Button>
            </div>

            <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 opacity-75">
              <div>
                <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                  <FileText className="w-4 h-4 text-rose-400" />
                  PDF Report
                  <Badge variant="info">Phase 6</Badge>
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">Visual progress report for sharing.</div>
              </div>
              <Button variant="outline" onClick={handleExportPDF} size="sm" className="w-full sm:w-auto">
                Coming Soon
              </Button>
            </div>
          </div>
          
          <div className="mt-6 p-4 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sm">
            <h4 className="font-semibold text-sky-400 flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4" /> What's included?
            </h4>
            <ul className="list-disc pl-5 text-[var(--text-secondary)] space-y-1 mt-2">
              <li>Profile & Account Settings</li>
              <li>Submitted Solutions & Code</li>
              <li>Personal Notes & Learnings</li>
              <li>Spaced Revision Schedules</li>
              <li>Analytics & Activity Heatmap</li>
              <li>Unlocked Achievements & Goals</li>
            </ul>
          </div>
        </Card>

        {/* IMPORT SECTION */}
        <Card className="p-6 border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--border-primary)] pb-4">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Import Data</h2>
              <p className="text-sm text-[var(--text-secondary)]">Restore from a previous backup</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed border-[var(--border-primary)] rounded-xl bg-[var(--bg-secondary)] opacity-50 cursor-not-allowed">
            <Upload className="w-10 h-10 text-[var(--text-tertiary)] mb-3" />
            <div className="font-semibold text-[var(--text-primary)]">Import functionality coming soon</div>
            <div className="text-xs text-[var(--text-secondary)] text-center mt-2 max-w-xs">
              Phase 5 currently supports exporting data to secure your progress. Import will be enabled in a future patch.
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-[var(--text-secondary)]">
              <strong className="text-rose-400 block mb-1">Warning</strong>
              When import becomes available, restoring data will overwrite your current progress. Always export your current state before importing.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
