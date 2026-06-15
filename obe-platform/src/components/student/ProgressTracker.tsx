'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BookOpen, CheckCircle2, Clock, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ── Mock data ──────────────────────────────────────────────────────

const courseProgress = [
  { code: 'CS301', name: 'Operating Systems', progress: 80, color: 'bg-blue-500' },
  { code: 'CS302', name: 'Database Management', progress: 65, color: 'bg-violet-500' },
  { code: 'CS303', name: 'Computer Networks', progress: 55, color: 'bg-cyan-500' },
  { code: 'CS304', name: 'Software Engineering', progress: 90, color: 'bg-green-500' },
  { code: 'CS305', name: 'Theory of Computation', progress: 42, color: 'bg-amber-500' },
];

const recentActivities = [
  { action: 'Completed Quiz: Process Basics', course: 'CS301', time: '2 hours ago', type: 'completed' as const },
  { action: 'Submitted: Scheduling Simulation', course: 'CS301', time: '1 day ago', type: 'submitted' as const },
  { action: 'Viewed: Paging & Segmentation', course: 'CS301', time: '1 day ago', type: 'viewed' as const },
  { action: 'Completed: ER Diagram Quiz', course: 'CS302', time: '2 days ago', type: 'completed' as const },
  { action: 'Started: Network Layer', course: 'CS303', time: '3 days ago', type: 'viewed' as const },
  { action: 'Submitted: UML Diagrams Assignment', course: 'CS304', time: '4 days ago', type: 'submitted' as const },
];

// ── Main Component ─────────────────────────────────────────────────

export function ProgressTracker() {
  const overall = Math.round(courseProgress.reduce((s, c) => s + c.progress, 0) / courseProgress.length);
  const maxProgress = Math.max(...courseProgress.map((c) => c.progress));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6 text-green-500" />
        <h2 className="text-xl font-bold">Progress Tracker</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Circular + Bar chart (2/3) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Top row: Circular progress + quick stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card className="p-6 border-border/50">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* Circular progress */}
                <div className="relative w-40 h-40 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/20" />
                    <motion.circle
                      cx="18" cy="18" r="15.9" fill="none" stroke="url(#ptGrad)" strokeWidth="2.5" strokeLinecap="round"
                      strokeDasharray={100}
                      initial={{ strokeDashoffset: 100 }}
                      animate={{ strokeDashoffset: 100 - overall }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                    <defs>
                      <linearGradient id="ptGrad">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{overall}%</span>
                    <span className="text-xs text-muted-foreground">Overall</span>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-4 flex-1 w-full">
                  {[
                    { icon: BookOpen, label: 'Courses', value: courseProgress.length, bg: 'bg-blue-500/10', color: 'text-blue-500' },
                    { icon: CheckCircle2, label: 'Topics Done', value: 18, bg: 'bg-green-500/10', color: 'text-green-500' },
                    { icon: Award, label: 'Best Course', value: `${maxProgress}%`, bg: 'bg-purple-500/10', color: 'text-purple-500' },
                    { icon: Clock, label: 'Pending Tasks', value: 4, bg: 'bg-amber-500/10', color: 'text-amber-500' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-border/50 p-3">
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center mb-2', s.bg)}>
                        <s.icon className={cn('h-4 w-4', s.color)} />
                      </div>
                      <p className="text-lg font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Bar chart — course-wise progress */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
            <Card className="p-6 border-border/50">
              <h3 className="text-base font-semibold mb-5">Course-wise Progress</h3>
              <div className="space-y-4">
                {courseProgress.map((course, i) => (
                  <div key={course.code}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground w-12">{course.code}</span>
                        <span className="text-sm font-medium">{course.name}</span>
                      </div>
                      <span className="text-sm font-bold">{course.progress}%</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted/40 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        transition={{ duration: 0.8, delay: 0.1 * i, ease: 'easeOut' }}
                        className={cn('h-full rounded-full', course.color)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Right: Recent activities (1/3) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          <Card className="p-6 border-border/50 h-full">
            <h3 className="text-base font-semibold mb-5">Recent Activity</h3>
            <div className="space-y-1">
              {recentActivities.map((act, i) => {
                const iconMap = { completed: CheckCircle2, submitted: Award, viewed: BookOpen };
                const colorMap = { completed: 'text-green-500 bg-green-500/10', submitted: 'text-blue-500 bg-blue-500/10', viewed: 'text-slate-400 bg-muted/30' };
                const Icon = iconMap[act.type];
                return (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-colors">
                    <div className={cn('mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0', colorMap[act.type].split(' ').slice(1).join(' '))}>
                      <Icon className={cn('h-3.5 w-3.5', colorMap[act.type].split(' ')[0])} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{act.action}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{act.course}</span>
                        <span className="text-xs text-muted-foreground">&middot;</span>
                        <span className="text-xs text-muted-foreground">{act.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
