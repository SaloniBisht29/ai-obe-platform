'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  PlayCircle,
  ChevronRight,
  X,
  FileText,
  Target,
  Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';

// ── Types ──────────────────────────────────────────────────────────

type CourseStatus = 'completed' | 'in-progress' | 'not-started';

interface SemesterCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  status: CourseStatus;
  progress: number;
  faculty: string;
  cosCount: number;
  posCount: number;
}

interface SemesterGroup {
  semester: number;
  courses: SemesterCourse[];
}

// ── Mock data ──────────────────────────────────────────────────────

const curriculumData: SemesterGroup[] = [
  {
    semester: 3,
    courses: [
      { id: 'c1', code: 'CS201', name: 'Data Structures', credits: 4, status: 'completed', progress: 100, faculty: 'Dr. Amit Verma', cosCount: 6, posCount: 4 },
      { id: 'c2', code: 'CS202', name: 'Web Development', credits: 3, status: 'completed', progress: 100, faculty: 'Dr. Neha Gupta', cosCount: 5, posCount: 3 },
      { id: 'c3', code: 'MA201', name: 'Discrete Mathematics', credits: 3, status: 'completed', progress: 100, faculty: 'Prof. R. Sharma', cosCount: 4, posCount: 3 },
    ],
  },
  {
    semester: 4,
    courses: [
      { id: 'c4', code: 'CS251', name: 'Design & Analysis of Algorithms', credits: 4, status: 'completed', progress: 100, faculty: 'Dr. Priya Singh', cosCount: 6, posCount: 5 },
      { id: 'c5', code: 'CS252', name: 'Object Oriented Programming', credits: 3, status: 'completed', progress: 100, faculty: 'Dr. Amit Verma', cosCount: 5, posCount: 4 },
      { id: 'c6', code: 'CS253', name: 'Computer Architecture', credits: 3, status: 'completed', progress: 100, faculty: 'Prof. K. Joshi', cosCount: 4, posCount: 3 },
    ],
  },
  {
    semester: 5,
    courses: [
      { id: 'c7', code: 'CS301', name: 'Operating Systems', credits: 4, status: 'in-progress', progress: 80, faculty: 'Dr. Priya Singh', cosCount: 5, posCount: 4 },
      { id: 'c8', code: 'CS302', name: 'Database Management Systems', credits: 4, status: 'in-progress', progress: 65, faculty: 'Dr. Rajesh Kumar', cosCount: 4, posCount: 5 },
      { id: 'c9', code: 'CS303', name: 'Computer Networks', credits: 4, status: 'in-progress', progress: 55, faculty: 'Dr. Neha Gupta', cosCount: 5, posCount: 4 },
      { id: 'c10', code: 'CS304', name: 'Software Engineering', credits: 3, status: 'in-progress', progress: 90, faculty: 'Dr. Amit Verma', cosCount: 4, posCount: 3 },
      { id: 'c11', code: 'CS305', name: 'Theory of Computation', credits: 3, status: 'in-progress', progress: 42, faculty: 'Prof. R. Sharma', cosCount: 4, posCount: 3 },
    ],
  },
  {
    semester: 6,
    courses: [
      { id: 'c12', code: 'CS351', name: 'Compiler Design', credits: 4, status: 'not-started', progress: 0, faculty: 'TBA', cosCount: 5, posCount: 4 },
      { id: 'c13', code: 'CS352', name: 'Artificial Intelligence', credits: 3, status: 'not-started', progress: 0, faculty: 'TBA', cosCount: 5, posCount: 5 },
      { id: 'c14', code: 'CS353', name: 'Cloud Computing', credits: 3, status: 'not-started', progress: 0, faculty: 'TBA', cosCount: 4, posCount: 3 },
    ],
  },
];

const courseDetails: Record<string, {
  description: string;
  cos: { id: string; description: string; bloom: string }[];
  pos: { id: string; description: string }[];
  copoMapping: Record<string, Record<string, number>>;
}> = {
  c7: {
    description: 'Study of operating system concepts including process management, memory management, file systems, and I/O systems.',
    cos: [
      { id: 'CO1', description: 'Understand process management and scheduling algorithms', bloom: 'Understand' },
      { id: 'CO2', description: 'Analyze memory management techniques including paging and segmentation', bloom: 'Analyze' },
      { id: 'CO3', description: 'Evaluate file system design and implementation strategies', bloom: 'Evaluate' },
      { id: 'CO4', description: 'Apply synchronization concepts to solve concurrency problems', bloom: 'Apply' },
      { id: 'CO5', description: 'Design solutions for deadlock detection and prevention', bloom: 'Create' },
    ],
    pos: [
      { id: 'PO1', description: 'Engineering Knowledge' },
      { id: 'PO2', description: 'Problem Analysis' },
      { id: 'PO3', description: 'Design/Development of Solutions' },
      { id: 'PO4', description: 'Modern Tool Usage' },
    ],
    copoMapping: {
      CO1: { PO1: 3, PO2: 2, PO3: 1, PO4: 0 },
      CO2: { PO1: 2, PO2: 3, PO3: 2, PO4: 1 },
      CO3: { PO1: 1, PO2: 2, PO3: 3, PO4: 2 },
      CO4: { PO1: 2, PO2: 3, PO3: 2, PO4: 1 },
      CO5: { PO1: 1, PO2: 2, PO3: 3, PO4: 2 },
    },
  },
};

// ── Sub-components ─────────────────────────────────────────────────

function StatusPill({ status }: { status: CourseStatus }) {
  const map = {
    completed: { label: 'Completed', icon: CheckCircle2, cls: 'bg-green-500/10 text-green-600 dark:text-green-400' },
    'in-progress': { label: 'In Progress', icon: PlayCircle, cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    'not-started': { label: 'Not Started', icon: Clock, cls: 'bg-slate-500/10 text-slate-500 dark:text-slate-400' },
  };
  const { label, icon: Icon, cls } = map[status];
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full', cls)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function ProgressBar({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  return (
    <div className={cn('w-full rounded-full bg-muted/50 overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2')}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={cn(
          'h-full rounded-full',
          value === 100 ? 'bg-green-500' : value >= 60 ? 'bg-blue-500' : value > 0 ? 'bg-amber-500' : 'bg-muted'
        )}
      />
    </div>
  );
}

function MappingCell({ value }: { value: number }) {
  const bg = value === 3 ? 'bg-green-500/20 text-green-700 dark:text-green-400 font-bold'
    : value === 2 ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
    : value === 1 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
    : 'bg-muted/30 text-muted-foreground';
  return (
    <td className={cn('py-2 px-3 text-center text-xs rounded', bg)}>
      {value > 0 ? value : '-'}
    </td>
  );
}

// ── Course Detail Modal ────────────────────────────────────────────

function CourseDetailPanel({ course, onClose }: { course: SemesterCourse; onClose: () => void }) {
  const detail = courseDetails[course.id];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm p-5">
          <div>
            <span className="text-xs font-mono text-muted-foreground">{course.code}</span>
            <h2 className="text-lg font-bold">{course.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground">{course.credits} Credits</span>
              <span className="text-xs text-muted-foreground">Faculty: {course.faculty}</span>
              <StatusPill status={course.status} />
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-5 space-y-6">
          {detail ? (
            <>
              {/* Description */}
              <p className="text-sm text-muted-foreground">{detail.description}</p>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Course Progress</span>
                  <span className="text-sm font-bold">{course.progress}%</span>
                </div>
                <ProgressBar value={course.progress} />
              </div>

              {/* Course Outcomes */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-purple-500" />
                  <h3 className="text-sm font-semibold">Course Outcomes (COs)</h3>
                </div>
                <div className="space-y-2">
                  {detail.cos.map((co) => (
                    <div key={co.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                      <span className="text-xs font-mono font-bold text-blue-500 mt-0.5 shrink-0">{co.id}</span>
                      <p className="text-sm flex-1">{co.description}</p>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                        {co.bloom}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CO-PO Mapping Table */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="h-4 w-4 text-green-500" />
                  <h3 className="text-sm font-semibold">CO-PO Mapping (Read Only)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">CO / PO</th>
                        {detail.pos.map((po) => (
                          <th key={po.id} className="text-center py-2 px-3 font-medium text-muted-foreground">
                            {po.id}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.cos.map((co) => (
                        <tr key={co.id} className="border-b border-border/30 last:border-0">
                          <td className="py-2 px-3 font-mono font-semibold text-blue-500 text-xs">{co.id}</td>
                          {detail.pos.map((po) => (
                            <MappingCell key={po.id} value={detail.copoMapping[co.id]?.[po.id] ?? 0} />
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Scale: 3 = High, 2 = Medium, 1 = Low, - = No mapping
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Detailed course information will be available soon.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────

export function MyCurriculum() {
  const user = getCurrentUser();
  const [selectedCourse, setSelectedCourse] = useState<SemesterCourse | null>(null);

  const totalCourses = curriculumData.flatMap((s) => s.courses);
  const completed = totalCourses.filter((c) => c.status === 'completed').length;
  const inProgress = totalCourses.filter((c) => c.status === 'in-progress').length;
  const totalCredits = totalCourses.reduce((s, c) => s + c.credits, 0);
  const earnedCredits = totalCourses.filter((c) => c.status === 'completed').reduce((s, c) => s + c.credits, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-500" />
            My Curriculum
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {user?.program || 'B.Tech CSE'} &middot; Semester {user?.semester || 5}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-green-500/10 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="bg-blue-500/10 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{inProgress}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2 text-center">
            <p className="text-lg font-bold">{earnedCredits}/{totalCredits}</p>
            <p className="text-xs text-muted-foreground">Credits</p>
          </div>
        </div>
      </div>

      {/* Semester Sections */}
      {curriculumData.map((sem, si) => (
        <motion.div
          key={sem.semester}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * si, duration: 0.4 }}
        >
          <Card className="border-border/50 overflow-hidden">
            {/* Semester header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-muted/20">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Semester {sem.semester}
              </h3>
              <span className="text-xs text-muted-foreground">
                {sem.courses.length} courses &middot;{' '}
                {sem.courses.reduce((s, c) => s + c.credits, 0)} credits
              </span>
            </div>

            {/* Course list */}
            <div className="divide-y divide-border/30">
              {sem.courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-muted/20 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{course.code}</span>
                      <StatusPill status={course.status} />
                    </div>
                    <p className="text-sm font-medium mt-0.5 truncate group-hover:text-blue-500 transition-colors">
                      {course.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {course.credits} credits &middot; {course.faculty}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="w-24 shrink-0 hidden sm:block">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{course.progress}%</span>
                    </div>
                    <ProgressBar value={course.progress} size="sm" />
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </Card>
        </motion.div>
      ))}

      {/* Course Detail Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <CourseDetailPanel course={selectedCourse} onClose={() => setSelectedCourse(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
