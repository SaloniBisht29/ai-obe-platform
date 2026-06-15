'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Sparkles, Target, TrendingUp, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalCourses: number;
  pendingReviews: number;
  aiGenerated: number;
  completionRate: number;
}

function AnimatedNumber({ value, suffix = '', duration = 1.5 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}{suffix}</span>;
}

function MiniSparkline({ color }: { color: string }) {
  const points = [4, 8, 6, 12, 9, 15, 11, 18, 14, 20];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const h = 24;
  const w = 60;

  const pathData = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / (max - min)) * h;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={pathData} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60" />
    </svg>
  );
}

function CircularProgress({ value, color, size = 48 }: { value: number; color: string; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(value), 200);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference - (progress / 100) * circumference}
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold">{value}%</span>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  trend?: string;
  description: string;
  color: string;
  bgColor: string;
  delay: number;
  isPercentage?: boolean;
}

function StatCard({ icon: Icon, label, value, suffix, trend, description, color, bgColor, delay, isPercentage = false }: StatCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
      <Card className="p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 group cursor-pointer">
        <div className="flex items-start justify-between">
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110', bgColor)}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
              <TrendingUp className="h-3 w-3" /> {trend}
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="text-3xl font-bold tracking-tight">
            {isPercentage ? <CircularProgress value={value} color={`hsl(var(--obe-green))`} size={56} /> : <AnimatedNumber value={value} suffix={suffix} />}
          </div>
          <p className="text-sm font-medium text-foreground mt-1">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        {!isPercentage && (
          <div className="mt-3"><MiniSparkline color={`hsl(var(--obe-blue))`} /></div>
        )}
      </Card>
    </motion.div>
  );
}

export function StatsGrid() {
  const [stats, setStats] = useState<DashboardStats>({ totalCourses: 0, pendingReviews: 0, aiGenerated: 0, completionRate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.stats) {
          setStats({
            totalCourses: data.stats.totalCourses || 0,
            pendingReviews: data.stats.pendingReviews || 0,
            aiGenerated: data.stats.aiGenerated || 0,
            completionRate: data.stats.completionRate || 0,
          });
        }
      })
      .catch(e => console.error('Failed to fetch stats:', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-5 border-border/50">
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <StatCard icon={BookOpen} label="Total Courses" value={stats.totalCourses} description="in database"
        color="text-blue-600 dark:text-blue-400" bgColor="bg-blue-500/10" delay={0.1} />
      <StatCard icon={Clock} label="Pending Reviews" value={stats.pendingReviews} description="Need attention"
        color="text-orange-600 dark:text-orange-400" bgColor="bg-orange-500/10" delay={0.2} />
      <StatCard icon={Sparkles} label="AI Syllabi" value={stats.aiGenerated} description="Generated"
        color="text-purple-600 dark:text-purple-400" bgColor="bg-purple-500/10" delay={0.3} />
      <StatCard icon={Target} label="Completion Rate" value={stats.completionRate} description="Overall progress"
        color="text-green-600 dark:text-green-400" bgColor="bg-green-500/10" delay={0.4} isPercentage />
    </div>
  );
}
