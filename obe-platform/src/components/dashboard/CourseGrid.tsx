'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit,
  Sparkles,
  Network,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CourseEditor } from '../faculty/CourseEditor';
import { AIGeneratedContent } from '../faculty/AIGeneratedContent';
import { COPOMapping } from '../faculty/COPOMapping';
import { PermissionGuard } from '@/components/PermissionGuard';

// Course type (from MongoDB)
interface Course {
  id: string;
  code: string;
  name: string;
  semester: number;
  credits: number;
  status: 'approved' | 'draft' | 'review' | 'published';
  progress: number;
  department: string;
  faculty: string;
  cosCount: number;
  posCount: number;
}

const statusConfig = {
  approved: {
    label: 'Approved',
    className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    dot: 'bg-green-500',
    icon: CheckCircle,
  },
  draft: {
    label: 'Draft',
    className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
    dot: 'bg-gray-500',
    icon: Clock,
  },
  review: {
    label: 'Under Review',
    className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    dot: 'bg-orange-500',
    icon: Clock,
  },
  published: {
    label: 'Published',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    dot: 'bg-blue-500',
    icon: CheckCircle,
  },
};

function CourseCard({
  course, index, onOpenEditor, onOpenAIGenerate, onOpenCOPOMap, onApprove, onReject,
}: {
  course: Course; index: number;
  onOpenEditor: (course: Course) => void;
  onOpenAIGenerate: (course: Course) => void;
  onOpenCOPOMap: (course: Course) => void;
  onApprove: (course: Course) => void;
  onReject: (course: Course) => void;
}) {
  const status = statusConfig[course.status];
  const progressColor = course.progress < 30 ? 'bg-red-500' : course.progress < 70 ? 'bg-orange-500' : 'bg-green-500';

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 + index * 0.05, duration: 0.3 }}>
      <Card className="group flex flex-col h-full border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden relative">
        <div className={cn('h-1 w-full shrink-0',
          course.status === 'approved' ? 'bg-gradient-to-r from-green-400 to-green-500' :
          course.status === 'review' ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
          course.status === 'published' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
          'bg-gradient-to-r from-gray-300 to-gray-400')} />
        <CardContent className="p-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">{course.code}</h3>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{course.name}</p>
            </div>
            <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5 h-auto whitespace-nowrap shrink-0 ml-2', status.className)}>
              <div className={cn('h-1.5 w-1.5 rounded-full mr-1.5', status.dot)} />
              {status.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0">Sem {course.semester}</Badge>
            <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 bg-muted border-0">{course.credits} Credits</Badge>
            <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-0">{course.cosCount} COs</Badge>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground">Completion</span>
              <span className="text-[11px] font-semibold">{course.progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${course.progress}%` }}
                transition={{ delay: 1 + index * 0.05, duration: 0.8, ease: 'easeOut' }}
                className={cn('h-full rounded-full', progressColor)} />
            </div>
          </div>
          <div className="mt-auto pt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <PermissionGuard requiredRole={['FACULTY', 'ADMIN']} fallback={
                <Button disabled size="sm" variant="outline" className="w-full text-xs h-8 justify-start px-2 opacity-50">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5 opacity-50" /> Restricted
                </Button>}>
                <Button size="sm" variant="outline" className="w-full text-xs h-8 justify-start px-2 bg-purple-500/5 hover:bg-purple-500/10 hover:text-purple-600 border-purple-500/20"
                  onClick={() => onOpenAIGenerate(course)}>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5 text-purple-500" /> Generate COs
                </Button>
              </PermissionGuard>
              <PermissionGuard requiredRole={['FACULTY', 'ADMIN']} fallback={
                <Button disabled size="sm" variant="outline" className="w-full text-xs h-8 justify-start px-2 opacity-50">
                  <Network className="h-3.5 w-3.5 mr-1.5 opacity-50" /> Restricted
                </Button>}>
                <Button size="sm" variant="outline" className="w-full text-xs h-8 justify-start px-2 hover:bg-blue-500/10 hover:text-blue-600 border-blue-500/20"
                  onClick={() => onOpenCOPOMap(course)}>
                  <Network className="h-3.5 w-3.5 mr-1.5 text-blue-500" /> Map to POs
                </Button>
              </PermissionGuard>
            </div>
            <PermissionGuard requiredRole={['FACULTY', 'ADMIN']} fallback={null}>
              <Button size="sm" variant="outline" className="w-full text-xs h-8" onClick={() => onOpenEditor(course)}>
                <Edit className="h-3.5 w-3.5 mr-2" /> Edit Course Details
              </Button>
            </PermissionGuard>
            {course.status === 'review' && (
              <PermissionGuard requiredRole={['FACULTY', 'ADMIN']} fallback={null}>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button size="sm" variant="outline" className="w-full text-xs h-8 bg-green-500/5 hover:bg-green-500/15 text-green-600 border-green-500/20 gap-1.5"
                    onClick={() => onApprove(course)}><CheckCircle className="h-3.5 w-3.5" /> Approve</Button>
                  <Button size="sm" variant="outline" className="w-full text-xs h-8 bg-red-500/5 hover:bg-red-500/15 text-red-600 border-red-500/20 gap-1.5"
                    onClick={() => onReject(course)}><XCircle className="h-3.5 w-3.5" /> Reject</Button>
                </div>
              </PermissionGuard>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function CourseGrid() {
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [generatingForCourse, setGeneratingForCourse] = useState<Course | null>(null);
  const [mappingForCourse, setMappingForCourse] = useState<Course | null>(null);
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch courses from MongoDB
  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.ok ? res.json() : { courses: [] })
      .then(data => setCourseList(data.courses || []))
      .catch(e => console.error('Failed to fetch courses:', e))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = (course: Course) => {
    setCourseList((prev) =>
      prev.map((c) =>
        c.id === course.id ? { ...c, status: 'approved' as const } : c,
      ),
    );
  };

  const handleReject = (course: Course) => {
    setCourseList((prev) =>
      prev.map((c) =>
        c.id === course.id ? { ...c, status: 'draft' as const } : c,
      ),
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7, duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">My Courses</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
        >
          View All →
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {courseList.map((course, index) => (
          <CourseCard
            key={course.id}
            course={course}
            index={index}
            onOpenEditor={setEditingCourse}
            onOpenAIGenerate={setGeneratingForCourse}
            onOpenCOPOMap={setMappingForCourse}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))}
      </div>

      {/* Course Editor Dialog */}
      <Dialog
        open={!!editingCourse}
        onOpenChange={(open) => !open && setEditingCourse(null)}
      >
        <DialogContent className="max-w-3xl border-border bg-background shadow-2xl p-6 sm:p-8">
          {editingCourse && (
            <CourseEditor
              course={editingCourse}
              onClose={() => setEditingCourse(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* AI Generated Content Dialog */}
      <Dialog
        open={!!generatingForCourse}
        onOpenChange={(open) => !open && setGeneratingForCourse(null)}
      >
        <DialogContent className="max-w-2xl border-border bg-background shadow-2xl p-6 sm:p-8">
          {generatingForCourse && (
            <AIGeneratedContent
              courseCode={generatingForCourse.code}
              courseName={generatingForCourse.name}
              onClose={() => setGeneratingForCourse(null)}
            />
          )}

        </DialogContent>
      </Dialog>

      {/* CO-PO Mapping Dialog */}
      <Dialog
        open={!!mappingForCourse}
        onOpenChange={(open) => !open && setMappingForCourse(null)}
      >
        <DialogContent className="max-w-4xl border-border bg-background shadow-2xl p-6 sm:p-8">
          {mappingForCourse && (
            <COPOMapping
              courseCode={mappingForCourse.code}
              onClose={() => setMappingForCourse(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
