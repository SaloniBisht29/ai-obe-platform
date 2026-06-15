'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Calendar as CalendarIcon,
  FileSpreadsheet, CheckCircle2, BarChart3,
  Users, BookOpen, Target, Loader2, Eye,
  TrendingUp, GraduationCap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';

// ── Report type metadata ──
const reportTypes = [
  {
    value: 'course-completion',
    label: 'Course Completion Report',
    description: 'Tracks completion rates across all courses, COs & assessment marks',
    icon: BookOpen,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    value: 'faculty-activity',
    label: 'Faculty Activity Report',
    description: 'Summary of faculty contributions: COs mapped, courses created, reviews done',
    icon: Users,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    value: 'student-progress',
    label: 'Student Progress Report',
    description: 'Individual & batch-level academic progress with CO attainment',
    icon: GraduationCap,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    value: 'co-po-coverage',
    label: 'CO-PO Coverage Report',
    description: 'Mapping coverage matrix, gaps analysis, and compliance score',
    icon: Target,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
];

// ── Mock preview data for reports ──
const mockReportPreview: Record<string, { headers: string[]; rows: string[][] }> = {
  'course-completion': {
    headers: ['Course Code', 'Course Name', 'Enrolled', 'Completed', 'Rate'],
    rows: [
      ['CS201', 'Data Structures', '120', '108', '90%'],
      ['CS301', 'Operating Systems', '98', '72', '73%'],
      ['CS302', 'Database Management', '110', '55', '50%'],
      ['CS401', 'Machine Learning', '85', '30', '35%'],
      ['CS202', 'Web Development', '95', '92', '97%'],
    ],
  },
  'faculty-activity': {
    headers: ['Faculty', 'Courses', 'COs Defined', 'POs Mapped', 'AI Reviews'],
    rows: [
      ['Dr. Priya Singh', '6', '31', '24', '12'],
      ['Dr. Neha Gupta', '4', '20', '18', '8'],
      ['Dr. Amit Verma', '5', '25', '19', '6'],
      ['Dr. Sunita Rao', '3', '15', '12', '4'],
    ],
  },
  'student-progress': {
    headers: ['Student', 'Program', 'Sem', 'CO Attainment', 'CGPA'],
    rows: [
      ['Rahul Sharma', 'B.Tech CSE', '5', '78%', '8.2'],
      ['Sneha Patel', 'B.Tech CSE', '5', '85%', '8.7'],
      ['Vikram Joshi', 'B.Tech ECE', '5', '72%', '7.8'],
      ['Aisha Khan', 'B.Tech IT', '7', '68%', '7.4'],
      ['Mohit Agarwal', 'B.Tech CSE', '3', '82%', '8.5'],
    ],
  },
  'co-po-coverage': {
    headers: ['Program', 'Total COs', 'Mapped POs', 'Coverage', 'Compliance'],
    rows: [
      ['B.Tech CSE', '31', '12/12', '96%', 'Excellent'],
      ['B.Tech ECE', '25', '12/12', '88%', 'Good'],
      ['B.Tech IT', '20', '10/12', '74%', 'Needs Improvement'],
      ['B.Tech ME', '18', '9/12', '65%', 'Below Threshold'],
    ],
  },
};

export function ReportsGeneration() {
  const [reportType, setReportType] = useState('course-completion');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-04-09');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { addToast } = useStore();

  const currentReport = reportTypes.find(r => r.value === reportType)!;
  const preview = mockReportPreview[reportType];

  const handleGenerate = () => {
    setIsGenerating(true);
    setShowPreview(false);
    setTimeout(() => {
      setIsGenerating(false);
      setShowPreview(true);
    }, 1800);
  };

  const handleExport = (format: string) => {
    addToast({ type: 'success', title: 'Export Started', description: `Downloading ${currentReport.label} as ${format}...` });
  };

  return (
    <div className="space-y-6">
      {/* ── Report Type Cards ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {reportTypes.map((rt, i) => (
          <motion.button
            key={rt.value}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => { setReportType(rt.value); setShowPreview(false); }}
            className={`
              text-left p-4 rounded-xl border transition-all duration-200
              ${reportType === rt.value
                ? 'border-blue-500/40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/20'
                : 'border-border/50 bg-card hover:bg-muted/30 hover:border-border'}
            `}
          >
            <div className={`p-2 rounded-lg ${rt.bg} inline-flex mb-3`}>
              <rt.icon className={`h-5 w-5 ${rt.color}`} />
            </div>
            <p className="font-semibold text-sm">{rt.label}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rt.description}</p>
          </motion.button>
        ))}
      </div>

      {/* ── Configuration Card ─────────────────────────── */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${currentReport.bg}`}>
                <currentReport.icon className={`h-5 w-5 ${currentReport.color}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{currentReport.label}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{currentReport.description}</CardDescription>
              </div>
            </div>
            {showPreview && (
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Generated
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-border/50">
            <Button
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/20"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Compiling Data...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>

            <div className="flex w-full sm:w-auto gap-2">
              <Button
                variant="outline"
                className="flex-1 sm:flex-auto"
                disabled={!showPreview}
                onClick={() => handleExport('PDF')}
              >
                <Download className="h-4 w-4 mr-2 text-red-500" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                className="flex-1 sm:flex-auto"
                disabled={!showPreview}
                onClick={() => handleExport('Excel')}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                Export Excel
              </Button>
            </div>
          </div>

          {/* ── Report Preview Table ───────────────────── */}
          <AnimatePresence>
            {showPreview && preview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden"
              >
                <div className="border border-border/50 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">Preview</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {startDate} → {endDate} · {preview.rows.length} records
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/20">
                        <tr>
                          {preview.headers.map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {preview.rows.map((row, ri) => (
                          <motion.tr
                            key={ri}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: ri * 0.05 }}
                            className="hover:bg-muted/10 transition-colors"
                          >
                            {row.map((cell, ci) => (
                              <td key={ci} className={`px-4 py-2.5 ${ci === 0 ? 'font-medium' : 'text-muted-foreground'}`}>
                                {/* Color-code percentage cells */}
                                {cell.endsWith('%') ? (
                                  <span className={`font-semibold ${
                                    parseInt(cell) >= 80 ? 'text-emerald-500' :
                                    parseInt(cell) >= 60 ? 'text-amber-500' :
                                    'text-red-500'
                                  }`}>{cell}</span>
                                ) : cell === 'Excellent' ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px]">{cell}</Badge>
                                ) : cell === 'Good' ? (
                                  <Badge className="bg-blue-500/10 text-blue-500 border-0 text-[10px]">{cell}</Badge>
                                ) : cell === 'Needs Improvement' ? (
                                  <Badge className="bg-amber-500/10 text-amber-500 border-0 text-[10px]">{cell}</Badge>
                                ) : cell === 'Below Threshold' ? (
                                  <Badge className="bg-red-500/10 text-red-500 border-0 text-[10px]">{cell}</Badge>
                                ) : cell}
                              </td>
                            ))}
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Local toast removed in favor of global store toasts */}
    </div>
  );
}
