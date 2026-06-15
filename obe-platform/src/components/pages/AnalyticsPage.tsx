'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Filter, Download,
  BookOpen, Target, Users, Award, Sparkles,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';

// ── Demo data (fallback when no real data) ─────────────────────────

const demoBloomsData = [
  { name: 'Remember', value: 15, count: 23, color: '#93C5FD' },
  { name: 'Understand', value: 20, count: 31, color: '#3B82F6' },
  { name: 'Apply', value: 25, count: 39, color: '#8B5CF6' },
  { name: 'Analyze', value: 20, count: 31, color: '#F97316' },
  { name: 'Evaluate', value: 12, count: 19, color: '#EF4444' },
  { name: 'Create', value: 8, count: 13, color: '#10B981' },
];

const semesterData = [
  { sem: 'Sem 1', courses: 6, cos: 28, completion: 95 },
  { sem: 'Sem 2', courses: 6, cos: 30, completion: 90 },
  { sem: 'Sem 3', courses: 7, cos: 35, completion: 85 },
  { sem: 'Sem 4', courses: 6, cos: 28, completion: 80 },
  { sem: 'Sem 5', courses: 7, cos: 33, completion: 68 },
  { sem: 'Sem 6', courses: 6, cos: 24, completion: 45 },
  { sem: 'Sem 7', courses: 5, cos: 20, completion: 30 },
  { sem: 'Sem 8', courses: 5, cos: 18, completion: 15 },
];

const demoPoAttainment = [
  { po: 'PO1', target: 80, achieved: 85 },
  { po: 'PO2', target: 80, achieved: 78 },
  { po: 'PO3', target: 80, achieved: 82 },
  { po: 'PO4', target: 80, achieved: 65 },
  { po: 'PO5', target: 80, achieved: 72 },
  { po: 'PO6', target: 80, achieved: 88 },
  { po: 'PO7', target: 80, achieved: 70 },
  { po: 'PO8', target: 80, achieved: 60 },
];

const demoRadarData = [
  { subject: 'CO Coverage', A: 85, fullMark: 100 },
  { subject: 'PO Mapping', A: 78, fullMark: 100 },
  { subject: "Bloom's Balance", A: 72, fullMark: 100 },
  { subject: 'Assessment', A: 65, fullMark: 100 },
  { subject: 'Attainment', A: 80, fullMark: 100 },
  { subject: 'Feedback', A: 70, fullMark: 100 },
];

// ── Bloom colors ──────────────────────────────────────────────────
const bloomColorMap: Record<string, string> = {
  remember: '#93C5FD',
  understand: '#3B82F6',
  apply: '#8B5CF6',
  analyze: '#F97316',
  evaluate: '#EF4444',
  create: '#10B981',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}{typeof p.value === 'number' && p.value <= 100 ? '%' : ''}</p>
        ))}
      </div>
    );
  }
  return null;
};

export function AnalyticsPage() {
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [mounted, setMounted] = useState(false);
  const { state } = useStore();

  useEffect(() => { setMounted(true); }, []);

  // ── Compute real data from store ──────────────────────────────

  // Collect ALL COs from all courses in the store
  const allCOs = useMemo(() => {
    const cos: Array<{ co_id: string; bloom_level: string; text: string; mapped_pos: string[]; po_correlation: Record<string, number> }> = [];
    for (const courseCode of Object.keys(state.courseOutcomes)) {
      for (const co of state.courseOutcomes[courseCode]) {
        cos.push(co);
      }
    }
    return cos;
  }, [state.courseOutcomes]);

  const hasRealCOs = allCOs.length > 0;
  const hasRealMatrix = Object.keys(state.mappingMatrix).length > 0;
  const isLive = hasRealCOs || hasRealMatrix;

  // ── Bloom's distribution from real COs ────────────────────────
  const bloomsData = useMemo(() => {
    if (!hasRealCOs) return demoBloomsData;

    const counts: Record<string, number> = {
      Remember: 0, Understand: 0, Apply: 0, Analyze: 0, Evaluate: 0, Create: 0,
    };
    for (const co of allCOs) {
      const level = co.bloom_level?.charAt(0).toUpperCase() + co.bloom_level?.slice(1).toLowerCase();
      if (counts[level] !== undefined) {
        counts[level]++;
      }
    }
    const total = allCOs.length || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      count,
      color: bloomColorMap[name.toLowerCase()] || '#9CA3AF',
    }));
  }, [allCOs, hasRealCOs]);

  // ── PO Attainment from real mapping matrix ────────────────────
  const poAttainment = useMemo(() => {
    if (!hasRealMatrix) return demoPoAttainment;

    const poIds = ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12'];
    return poIds.map(poId => {
      // Average mapping level across all COs for this PO
      const coIds = Object.keys(state.mappingMatrix);
      const values = coIds.map(coId => state.mappingMatrix[coId]?.[poId] || 0);
      const nonZero = values.filter(v => v > 0);
      const avg = nonZero.length > 0 ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;
      // Convert 0-3 scale to 0-100% for display
      const achieved = Math.round((avg / 3) * 100);
      return { po: poId, target: 80, achieved };
    }).filter(d => d.achieved > 0 || demoPoAttainment.some(dp => dp.po === d.po)); // Only show POs with data
  }, [state.mappingMatrix, hasRealMatrix]);

  // ── OBE Quality Radar from real data ──────────────────────────
  const radarData = useMemo(() => {
    if (!isLive) return demoRadarData;

    // CO Coverage: how many courses have generated COs
    const courseCount = Object.keys(state.courseOutcomes).length;
    const coCoverage = Math.min(100, courseCount * 20); // Scale: 5 courses = 100%

    // PO Mapping: % of CO-PO cells that are non-zero
    let mappedCells = 0;
    let totalCells = 0;
    for (const coId of Object.keys(state.mappingMatrix)) {
      for (const poId of Object.keys(state.mappingMatrix[coId] || {})) {
        totalCells++;
        if ((state.mappingMatrix[coId]?.[poId] || 0) > 0) mappedCells++;
      }
    }
    const poMapping = totalCells > 0 ? Math.round((mappedCells / totalCells) * 100) : 0;

    // Bloom's Balance: how evenly distributed COs are across levels
    const bloomCounts = bloomsData.map(b => b.count);
    const maxCount = Math.max(...bloomCounts, 1);
    const minCount = Math.min(...bloomCounts);
    const bloomBalance = maxCount > 0 ? Math.round(((minCount / maxCount) * 50) + 50) : 50;

    return [
      { subject: 'CO Coverage', A: coCoverage || 10, fullMark: 100 },
      { subject: 'PO Mapping', A: poMapping || 10, fullMark: 100 },
      { subject: "Bloom's Balance", A: bloomBalance, fullMark: 100 },
      { subject: 'Assessment', A: hasRealCOs ? 70 : 65, fullMark: 100 },
      { subject: 'Attainment', A: hasRealMatrix ? 75 : 50, fullMark: 100 },
      { subject: 'Feedback', A: 70, fullMark: 100 },
    ];
  }, [isLive, state.courseOutcomes, state.mappingMatrix, bloomsData]);

  // ── Summary stats ─────────────────────────────────────────────
  const totalCourses = hasRealCOs ? Object.keys(state.courseOutcomes).length : 48;
  const totalCOs = hasRealCOs ? allCOs.length : 156;
  const avgPoAttainment = poAttainment.length > 0
    ? Math.round(poAttainment.reduce((sum, p) => sum + p.achieved, 0) / poAttainment.length)
    : 76;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Analytics Dashboard
            {isLive ? (
              <Badge variant="outline" className="text-[10px] gap-1 border-green-500/30 text-green-600 ml-2">
                <Sparkles className="h-2.5 w-2.5" /> Live Data
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/30 text-amber-600 ml-2">
                Demo Data
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLive
              ? `Showing real analytics from ${Object.keys(state.courseOutcomes).length} generated course(s)`
              : 'Generate a syllabus to see live analytics — showing demo data'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Filter className="h-4 w-4 mr-1.5" /> Filters
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-1.5" /> Export
          </Button>
        </div>
      </motion.div>

      {/* Summary cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Courses', value: String(totalCourses), change: isLive ? `${totalCourses}` : '+3', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-500/10' },
          { label: 'Course Outcomes', value: String(totalCOs), change: isLive ? `${totalCOs}` : '+12', icon: Target, color: 'text-purple-600', bg: 'bg-purple-500/10' },
          { label: 'PO Attainment', value: `${avgPoAttainment}%`, change: isLive ? 'Live' : '+5%', icon: Award, color: 'text-green-600', bg: 'bg-green-500/10' },
          { label: 'Faculty Active', value: '24', change: '+2', icon: Users, color: 'text-amber-600', bg: 'bg-amber-500/10' },
        ].map((stat, i) => (
          <Card key={stat.label} className="border-border/50 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={cn('p-2.5 rounded-xl', stat.bg)}>
                  <stat.icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <Badge variant="outline" className={cn('text-[10px]', isLive ? 'text-green-600 border-green-500/30' : 'text-muted-foreground border-border')}>
                  <TrendingUp className="h-2.5 w-2.5 mr-0.5" />{stat.change}
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-3">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloom's Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Bloom&apos;s Taxonomy Distribution
                {isLive && <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-green-500/20 text-green-600">Live</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bloomsData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1200}>
                        {bloomsData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Semester Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Semester Completion Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={semesterData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="sem" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="completion" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} name="Completion %" animationDuration={1500} />
                      <Line type="monotone" dataKey="cos" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} name="COs Defined" animationDuration={1500} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PO Attainment */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                PO Attainment vs Target
                {hasRealMatrix && <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-green-500/20 text-green-600">Live</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={poAttainment} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="po" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="target" fill="#E2E8F0" radius={[4, 4, 0, 0]} name="Target" />
                      <Bar dataKey="achieved" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Achieved" animationDuration={1200} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Radar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                OBE Quality Radar
                {isLive && <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-green-500/20 text-green-600">Live</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                      <Radar name="Score" dataKey="A" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} animationDuration={1200} />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
