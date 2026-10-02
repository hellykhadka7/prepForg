import { useState, useEffect } from 'react';
import { Card, Input, Button, Spinner, Badge } from '../../../components/ui';
import { User, Palette, Bell, Shield, Database, Save, LogOut } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../../api/user.api';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import type { ThemeName } from '../../../types';
import clsx from 'clsx';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'theme' | 'notifications' | 'data'>('profile');
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: userApi.getProfile,
  });

  const [editValues, setEditValues] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      setEditValues({ name: user.name, email: user.email });
    }
  }, [user]);

  const { mutate: saveProfile, isPending: savingProfile } = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['profile'], updatedUser);
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  const { mutate: updateTheme } = useMutation({
    mutationFn: userApi.updateTheme,
    onSuccess: (newTheme) => {
      setTheme(newTheme);
      toast.success('Theme updated successfully');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editValues.name.trim() || !editValues.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    saveProfile(editValues);
  };

  const tabs = [
    { id: 'profile', label: 'Profile & Account', icon: <User className="w-4 h-4" /> },
    { id: 'theme', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'data', label: 'Data Management', icon: <Database className="w-4 h-4" /> },
  ] as const;

  const themes: { id: ThemeName; name: string; type: 'dark' | 'light' }[] = [
    { id: 'vscode-dark', name: 'VS Code Dark', type: 'dark' },
    { id: 'github-dark', name: 'GitHub Dark', type: 'dark' },
    { id: 'github-light', name: 'GitHub Light', type: 'light' },
    { id: 'dracula', name: 'Dracula', type: 'dark' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your account and preferences</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-[var(--gradient-start)] text-white shadow-lg shadow-[var(--gradient-start)]/20'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <Card className="p-6 border border-[var(--border-primary)] shadow-sm">
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-sky-400" />
                Account Details
              </h2>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Display Name</label>
                  <Input
                    value={editValues.name}
                    onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email Address</label>
                  <Input
                    type="email"
                    value={editValues.email}
                    onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                </div>
                
                <div className="pt-4 flex items-center gap-4 border-t border-[var(--border-primary)]">
                  <Button type="submit" disabled={savingProfile} className="gap-2">
                    {savingProfile ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </Button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-[var(--border-primary)]">
                <h3 className="text-sm font-bold text-rose-500 mb-2">Danger Zone</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  Logging out will clear your current session.
                </p>
                <Button variant="outline" onClick={logout} className="gap-2 text-rose-500 border-rose-500/30 hover:bg-rose-500/10">
                  <LogOut className="w-4 h-4" />
                  Log Out
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'theme' && (
            <Card className="p-6 border border-[var(--border-primary)] shadow-sm">
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" />
                Theme & Appearance
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => updateTheme(t.id)}
                    className={clsx(
                      'flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left',
                      theme === t.id
                        ? 'border-[var(--gradient-start)] bg-[var(--gradient-start)]/5'
                        : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--text-tertiary)]'
                    )}
                  >
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">{t.name}</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1 capitalize">{t.type} Mode</div>
                    </div>
                    {theme === t.id && (
                      <Badge variant="info">Active</Badge>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="p-6 border border-[var(--border-primary)] shadow-sm">
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                Notification Preferences
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Push notifications and email summaries are coming in a future update.
              </p>
              <div className="space-y-4 opacity-50 pointer-events-none">
                <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Revision Reminders</div>
                    <div className="text-xs text-[var(--text-secondary)]">Get notified when you have problems due for review.</div>
                  </div>
                  <div className="w-10 h-5 rounded-full bg-[var(--bg-tertiary)]" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">Weekly Digest</div>
                    <div className="text-xs text-[var(--text-secondary)]">Receive a summary of your weekly progress via email.</div>
                  </div>
                  <div className="w-10 h-5 rounded-full bg-[var(--bg-tertiary)]" />
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'data' && (
            <Card className="p-6 border border-[var(--border-primary)] shadow-sm">
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                Data Management
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                To export or import your data, please head to the dedicated Data Management page.
              </p>
              <Button onClick={() => window.location.href = '/app/import'} className="gap-2">
                Go to Import / Export
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
