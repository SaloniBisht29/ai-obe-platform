'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Target,
  Sparkles,
  Clock,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  X,
} from 'lucide-react';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { AIAssistant } from '@/components/dashboard/AIAssistant';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { CourseGrid } from '@/components/dashboard/CourseGrid';
import { BloomsTaxonomyChart } from '@/components/dashboard/BloomsTaxonomyChart';
import { COPOHeatmap } from '@/components/dashboard/COPOHeatmap';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';

// Mock pending items for the faculty action center
const initialPendingActions = [
  {
    id: '1',
    type: 'review' as const,
    title: 'Review AI-Generated COs',
    course: 'CS301 - Operating Systems',
    description: '4 new AI-generated Course Outcomes awaiting your review',
    urgency: 'high' as const,
    timeAgo: '2 hours ago',
  },
  {
    id: '2',
    type: 'mapping' as const,
    title: 'Complete CO-PO Mapping',
    course: 'CS302 - Database Management',
    description: '3 COs still need PO mapping',
    urgency: 'medium' as const,
    timeAgo: '1 day ago',
  },
  {
    id: '3',
    type: 'approval' as const,
    title: 'Syllabus Pending Approval',
    course: 'CS401 - Machine Learning',
    description: 'Submitted for HoD approval, awaiting response',
    urgency: 'low' as const,
    timeAgo: '3 days ago',
  },
];

const urgencyConfig = {
  high: { color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20', badge: 'Urgent' },
  medium: { color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20', badge: 'Medium' },
  low: { color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20', badge: 'Low' },
};

const quickStats = [
  { label: 'Courses Assigned', value: '6', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-500/10' },
  { label: 'COs Defined', value: '31', icon: Target, color: 'text-purple-600', bg: 'bg-purple-500/10' },
  { label: 'AI Suggestions', value: '12', icon: Sparkles, color: 'text-pink-600', bg: 'bg-pink-500/10' },
  { label: 'Pending Reviews', value: '3', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/10' },
];

export function FacultyDashboard() {
  const [pendingActions, setPendingActions] = useState(initialPendingActions);
  const { addToast, setPage } = useStore();

  const handleDismissAction = (id: string) => {
    setPendingActions((prev) => prev.filter((a) => a.id !== id));
    addToast({ type: 'info', title: 'Action Dismissed', description: 'Removed from your action center' });
  };

  const handleActionClick = (action: typeof initialPendingActions[0]) => {
    if (action.type === 'review') {
      setPage('courses');
      addToast({ type: 'info', title: 'Navigating to Courses', description: action.course });
    } else if (action.type === 'mapping') {
      setPage('co-po-mapping');
      addToast({ type: 'info', title: 'Opening CO-PO Mapping', description: action.course });
    } else {
      addToast({ type: 'info', title: action.title, description: action.description });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Faculty Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.08 }}
          >
            <Card className="border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              onClick={() => {
                if (stat.label === 'Courses Assigned') setPage('courses');
                else if (stat.label === 'COs Defined') setPage('co-po-mapping');
                else if (stat.label === 'AI Suggestions') setPage('courses');
                else if (stat.label === 'Pending Reviews') setPage('feedback');
              }}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Action Center - Pending Items */}
      {pendingActions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card className="border-border/50 overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-0">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-xl shadow-lg shadow-amber-500/20">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Action Center</h3>
                  <p className="text-xs text-muted-foreground">Items requiring your attention</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 border-0">
                {pendingActions.length} pending
              </Badge>
            </div>
            <CardContent className="p-5 pt-4">
              <div className="space-y-3">
                {pendingActions.map((action, index) => {
                  const urgency = urgencyConfig[action.urgency];
                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className={`flex items-center justify-between gap-4 p-3.5 rounded-xl border ${urgency.border} ${urgency.bg} hover:shadow-sm transition-all cursor-pointer group`}
                      onClick={() => handleActionClick(action)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">{action.title}</span>
                          <Badge variant="outline" className={`text-[9px] px-1.5 h-4 ${urgency.color} border-current/20`}>
                            {urgency.badge}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {action.course} — {action.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{action.timeAgo}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); handleDismissAction(action.id); }}
                          aria-label="Dismiss"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <StatsGrid />

      {/* AI Assistant */}
      <AIAssistant />

      {/* Main Grid - Courses + Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        {/* Left column (2/3) */}
        <div className="xl:col-span-2 space-y-6 sm:space-y-8">
          <ActivityFeed />
          <CourseGrid />
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-6 sm:space-y-8">
          <BloomsTaxonomyChart />
          <COPOHeatmap />
        </div>
      </div>
    </div>
  );
}
