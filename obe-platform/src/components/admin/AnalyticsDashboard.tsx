'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, BookOpen, GraduationCap, Server,
  Activity, TrendingUp, ArrowUpRight, ArrowDownRight,
  BarChart3, Clock, Zap, Globe, Shield, Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ── Mock data ────────────────────────────────────────────────────────
const statCards = [
  { label: 'Total Students', value: '1,240', change: '+12%', up: true, icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-500/10', gradient: 'from-blue-500 to-cyan-400' },
  { label: 'Total Faculty', value: '185', change: '+3%', up: true, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10', gradient: 'from-purple-500 to-violet-400' },
  { label: 'Admin Staff', value: '12', change: '0%', up: true, icon: Shield, color: 'text-amber-500', bg: 'bg-amber-500/10', gradient: 'from-amber-500 to-orange-400' },
  { label: 'Active Courses', value: '94', change: '+8%', up: true, icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10', gradient: 'from-emerald-500 to-teal-400' },
  { label: 'Programs', value: '12', change: '+1', up: true, icon: Layers, color: 'text-pink-500', bg: 'bg-pink-500/10', gradient: 'from-pink-500 to-rose-400' },
  { label: 'System Uptime', value: '99.8%', change: 'Stable', up: true, icon: Server, color: 'text-cyan-500', bg: 'bg-cyan-500/10', gradient: 'from-cyan-500 to-sky-400' },
];

const recentActivities = [
  { id: 1, user: 'Dr. Neha Gupta', action: 'created 4 new COs for CS302', time: '5 min ago', type: 'academic', avatar: 'NG' },
  { id: 2, user: 'Rahul Sharma', action: 'submitted assignment for CS201', time: '12 min ago', type: 'student', avatar: 'RS' },
  { id: 3, user: 'System', action: 'Course Completion report exported as PDF', time: '28 min ago', type: 'system', avatar: 'SY' },
  { id: 4, user: 'Dr. Priya Singh', action: 'approved CO-PO mapping for CS301', time: '1 hour ago', type: 'academic', avatar: 'PS' },
  { id: 5, user: 'Admin', action: 'Changed role of Amit Verma to Faculty', time: '2 hours ago', type: 'admin', avatar: 'AD' },
  { id: 6, user: 'Sneha Patel', action: 'enrolled in Machine Learning course', time: '3 hours ago', type: 'student', avatar: 'SP' },
  { id: 7, user: 'System', action: 'Scheduled backup completed successfully', time: '5 hours ago', type: 'system', avatar: 'SY' },
  { id: 8, user: 'Dr. Amit Verma', action: 'added new program B.Tech AI & ML', time: '6 hours ago', type: 'academic', avatar: 'AV' },
];

const activityTypeConfig: Record<string, { color: string; bg: string }> = {
  academic: { color: 'text-blue-500', bg: 'bg-blue-500' },
  student: { color: 'text-emerald-500', bg: 'bg-emerald-500' },
  system: { color: 'text-amber-500', bg: 'bg-amber-500' },
  admin: { color: 'text-purple-500', bg: 'bg-purple-500' },
};

// Stable mock chart data (generated deterministically)
const chartData = [68, 42, 55, 78, 35, 62, 88, 45, 72, 58, 82, 38, 65, 90, 48, 75, 52, 70, 85, 40, 60, 78, 55, 68, 92, 45, 72, 58, 82, 65];

const weeklyDistribution = [
  { day: 'Mon', students: 85, faculty: 72 },
  { day: 'Tue', students: 92, faculty: 78 },
  { day: 'Wed', students: 78, faculty: 85 },
  { day: 'Thu', students: 88, faculty: 68 },
  { day: 'Fri', students: 95, faculty: 82 },
  { day: 'Sat', students: 45, faculty: 30 },
  { day: 'Sun', students: 25, faculty: 15 },
];

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      {/* ── Quick Stat Cards ────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className="border-border/50 hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
              {/* Gradient accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${stat.gradient}`} />
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.bg} transition-transform group-hover:scale-110 duration-300`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${stat.up ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Charts Row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* System Activity Chart - 30 Day Login Trend */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5 text-blue-500" />
                  System Login Activity
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">Last 30 Days</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-[3px] h-[200px] pt-6">
                {chartData.map((height, i) => (
                  <div key={i} className="relative w-full flex flex-col justify-end h-full group">
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-foreground text-background px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap z-10 shadow-lg">
                      {height} logins
                    </div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.8, delay: 0.5 + (i * 0.02), ease: 'easeOut' }}
                      className={`w-full rounded-t transition-colors duration-200 ${
                        height > 70 ? 'bg-blue-500 group-hover:bg-blue-400' :
                        height > 50 ? 'bg-blue-400 group-hover:bg-blue-300' :
                        'bg-blue-300/60 dark:bg-blue-800 group-hover:bg-blue-300 dark:group-hover:bg-blue-700'
                      }`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                <span>Mar 10</span>
                <span>Mar 20</span>
                <span>Mar 30</span>
                <span>Apr 09</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Distribution */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Weekly Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mt-2">
                {weeklyDistribution.map((day, i) => (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xs font-medium text-muted-foreground w-8">{day.day}</span>
                    <div className="flex-1 flex gap-1 h-5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${day.students}%` }}
                        transition={{ duration: 0.8, delay: 0.7 + i * 0.05 }}
                        className="bg-blue-500/70 rounded-l flex items-center justify-end pr-1"
                      >
                        <span className="text-[9px] text-white font-medium">{day.students}%</span>
                      </motion.div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${day.faculty}%` }}
                        transition={{ duration: 0.8, delay: 0.8 + i * 0.05 }}
                        className="bg-purple-500/70 rounded-r flex items-center justify-end pr-1"
                      >
                        <span className="text-[9px] text-white font-medium">{day.faculty}%</span>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-blue-500/70" /> Students
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-purple-500/70" /> Faculty
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Bottom Row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-full border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-5 w-5 text-amber-500" />
                Quick Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Avg. Session Duration', value: '24 min', icon: Clock },
                  { label: 'AI Suggestions Accepted', value: '78%', icon: Sparkle },
                  { label: 'CO-PO Coverage', value: '91%', icon: TrendingUp },
                  { label: 'Active Sessions Now', value: '147', icon: Globe },
                ].map((m, i) => (
                  <div key={m.label} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                        <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">{m.label}</span>
                    </div>
                    <span className="text-sm font-bold">{m.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="h-full border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  Recent User Activities
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">Live</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
                {recentActivities.map((act, i) => {
                  const typeConf = activityTypeConfig[act.type] || activityTypeConfig.system;
                  return (
                    <motion.div
                      key={act.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + i * 0.05 }}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-colors group"
                    >
                      {/* Avatar */}
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${typeConf.color} bg-opacity-10`}
                        style={{ backgroundColor: `color-mix(in srgb, currentColor 10%, transparent)` }}
                      >
                        {act.avatar}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold">{act.user}</span>{' '}
                          <span className="text-muted-foreground">{act.action}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {act.time}
                          </span>
                          <span className={`inline-flex h-1.5 w-1.5 rounded-full ${typeConf.bg}`} />
                          <span className="text-[10px] text-muted-foreground/60 capitalize">{act.type}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// Tiny helper to avoid importing Sparkles (already used in data) — just reuse Zap
function Sparkle(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return <Zap {...props} />;
}
