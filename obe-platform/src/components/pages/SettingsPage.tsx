'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, User, Bell, Palette, Shield, Database, Globe, Save,
  Moon, Sun, Monitor, Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/providers/ThemeProvider';
import { getCurrentUser } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'ai' | 'security';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'ai', label: 'AI Settings', icon: Database },
  { id: 'security', label: 'Security', icon: Shield },
];

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={cn(
      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
      enabled ? 'bg-primary' : 'bg-muted-foreground/30'
    )}>
      <span className={cn(
        'inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
        enabled ? 'translate-x-6' : 'translate-x-1'
      )} />
    </button>
  );
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useStore();
  const user = getCurrentUser();

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [department, setDepartment] = useState(user?.department || '');

  // Notification prefs
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [reviewAlerts, setReviewAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // AI settings
  const [ollamaHost, setOllamaHost] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3.1:8b');
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [mockFallback, setMockFallback] = useState(true);

  const handleSave = () => {
    addToast({ type: 'success', title: 'Settings Saved', description: 'Your preferences have been updated' });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold mb-1">Profile Information</h3>
              <p className="text-sm text-muted-foreground">Update your personal information and preferences</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{name}</p>
                <p className="text-sm text-muted-foreground">{user?.role} · {department}</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 max-w-lg">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email Address</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Department</label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Role</label>
                <Input value={user?.role || ''} disabled className="bg-muted/50" />
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold mb-1">Notification Preferences</h3>
              <p className="text-sm text-muted-foreground">Choose how and when you want to be notified</p>
            </div>
            <div className="space-y-4 max-w-lg">
              {[
                { label: 'Email Notifications', desc: 'Receive email updates for important events', value: emailNotifs, toggle: () => setEmailNotifs(!emailNotifs) },
                { label: 'AI Suggestions', desc: 'Get notified when AI generates new suggestions', value: aiSuggestions, toggle: () => setAiSuggestions(!aiSuggestions) },
                { label: 'Review Alerts', desc: 'Notifications for pending reviews and approvals', value: reviewAlerts, toggle: () => setReviewAlerts(!reviewAlerts) },
                { label: 'Weekly Digest', desc: 'Receive a weekly summary of curriculum progress', value: weeklyDigest, toggle: () => setWeeklyDigest(!weeklyDigest) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <ToggleSwitch enabled={item.value} onToggle={item.toggle} />
                </div>
              ))}
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold mb-1">Appearance</h3>
              <p className="text-sm text-muted-foreground">Customize the look and feel of the platform</p>
            </div>
            <div className="space-y-4 max-w-lg">
              <p className="text-sm font-medium">Theme</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Monitor },
                ].map((t) => {
                  const isActive = t.id === theme || (t.id === 'system' && false);
                  return (
                    <button key={t.id}
                      onClick={() => { if (t.id === 'light' || t.id === 'dark') { if (theme !== t.id) toggleTheme(); } }}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                        isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/50 hover:border-border'
                      )}
                    >
                      <t.icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                      <span className="text-xs font-medium">{t.label}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>

              <Separator className="my-4" />

              <div>
                <p className="text-sm font-medium mb-3">Accent Color</p>
                <div className="flex gap-2">
                  {[
                    { name: 'Blue', color: 'bg-blue-500' },
                    { name: 'Purple', color: 'bg-purple-500' },
                    { name: 'Green', color: 'bg-green-500' },
                    { name: 'Rose', color: 'bg-rose-500' },
                    { name: 'Amber', color: 'bg-amber-500' },
                  ].map((c) => (
                    <button key={c.name}
                      className={cn('h-8 w-8 rounded-full transition-all hover:scale-110 ring-2 ring-offset-2 ring-offset-background',
                        c.name === 'Blue' ? 'ring-primary' : 'ring-transparent', c.color)}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold mb-1">AI Integration Settings</h3>
              <p className="text-sm text-muted-foreground">Configure your Ollama connection and AI behavior</p>
            </div>
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Ollama Host URL</label>
                <Input value={ollamaHost} onChange={(e) => setOllamaHost(e.target.value)} placeholder="http://localhost:11434" />
                <p className="text-[11px] text-muted-foreground mt-1">The URL where your Ollama server is running</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Model</label>
                <Input value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} placeholder="llama3.1:8b" />
                <p className="text-[11px] text-muted-foreground mt-1">The Ollama model to use for generation</p>
              </div>
              <Separator />
              {[
                { label: 'Auto-Generate COs', desc: 'Automatically suggest COs when creating a new course', value: autoGenerate, toggle: () => setAutoGenerate(!autoGenerate) },
                { label: 'Mock Fallback', desc: 'Use mock responses when Ollama is unavailable', value: mockFallback, toggle: () => setMockFallback(!mockFallback) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <ToggleSwitch enabled={item.value} onToggle={item.toggle} />
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => addToast({ type: 'info', title: 'Testing Connection', description: 'Checking Ollama availability...' })}>
                <Database className="h-4 w-4 mr-1.5" /> Test Connection
              </Button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold mb-1">Security & Access</h3>
              <p className="text-sm text-muted-foreground">Manage your account security settings</p>
            </div>
            <div className="space-y-4 max-w-lg">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Current Role</p>
                      <p className="text-xs text-muted-foreground">Your access level on the platform</p>
                    </div>
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                      {user?.role || 'Unknown'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-2">Session Information</p>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p>Login method: <span className="text-foreground">JWT + MongoDB</span></p>
                    <p>User ID: <span className="font-mono text-foreground">{user?.id || 'N/A'}</span></p>
                    <p>Last active: <span className="text-foreground">Just now</span></p>
                  </div>
                </CardContent>
              </Card>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Change Password</label>
                <div className="space-y-2">
                  <Input type="password" placeholder="Current password" />
                  <Input type="password" placeholder="New password" />
                  <Input type="password" placeholder="Confirm new password" />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">Password is stored securely with bcrypt hashing</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and platform preferences</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs sidebar */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:w-56 shrink-0"
        >
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex-1"
        >
          <Card className="border-border/50">
            <CardContent className="p-6">
              {renderContent()}
              <Separator className="my-6" />
              <div className="flex justify-end">
                <Button onClick={handleSave} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <Save className="h-4 w-4 mr-1.5" /> Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
