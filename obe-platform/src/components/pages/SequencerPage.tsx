'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Plus,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  Loader2,
  Settings,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { generateSequencerPlan, type CourseInput, type SequencerResponse } from '@/lib/api';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

// Hardcoded initial courses for demo purposes
const INITIAL_COURSES: CourseInput[] = [
  { id: 'CS101', credits: 4, prerequisites: [] },
  { id: 'CS102', credits: 4, prerequisites: ['CS101'] },
  { id: 'CS201', credits: 3, prerequisites: ['CS101'] },
  { id: 'CS202', credits: 3, prerequisites: ['CS102', 'CS201'] },
  { id: 'CS301', credits: 4, prerequisites: ['CS202'] },
  { id: 'CS302', credits: 3, prerequisites: ['CS301'] },
];

export function SequencerPage() {
  const { state, setSequencerPlan, addToast } = useStore();
  const [courses, setCourses] = useState<CourseInput[]>(INITIAL_COURSES);
  const [maxCredits, setMaxCredits] = useState(12);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New course state
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseId, setNewCourseId] = useState('');
  const [newCourseCredits, setNewCourseCredits] = useState(3);
  const [newCoursePrereqs, setNewCoursePrereqs] = useState('');

  const plan = state.sequencerPlan;

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const result = await generateSequencerPlan({
        courses,
        max_credits_per_sem: maxCredits,
      });

      if ((result as any).error) {
         setErrorMsg((result as any).error);
         addToast({ type: 'error', title: 'Sequencing Failed', description: (result as any).error });
      } else {
        setSequencerPlan(result);
        addToast({ type: 'success', title: 'Plan Generated', description: `Curriculum plan created across ${result.total_semesters} semesters.` });
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMsg(msg);
      addToast({ type: 'error', title: 'Connection Failed', description: 'Make sure the Mapping Sequencer is running on port 8001.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddCourse = () => {
    if (!newCourseId.trim()) return;
    const prereqs = newCoursePrereqs.split(',').map(s => s.trim()).filter(Boolean);
    setCourses(prev => [...prev, {
      id: newCourseId.toUpperCase(),
      credits: newCourseCredits,
      prerequisites: prereqs
    }]);
    setShowAddCourse(false);
    setNewCourseId('');
    setNewCourseCredits(3);
    setNewCoursePrereqs('');
  };

  const removeCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-purple-600" />
            Curriculum Sequencer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-driven semester planning based on prerequisites and credit limits
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGeneratePlan} disabled={isGenerating || courses.length === 0}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate Sequence
          </Button>
        </div>
      </motion.div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Course list & settings */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="border-border/50">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" /> Configuration
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Max Credits per Semester</label>
                <div className="flex items-center gap-3 mt-1.5">
                  <Input type="number" min={3} max={30} value={maxCredits} onChange={(e) => setMaxCredits(parseInt(e.target.value) || 12)} className="w-24" />
                  <span className="text-xs text-muted-foreground">credits</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" /> Courses ({courses.length})
                </CardTitle>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowAddCourse(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto">
                {courses.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">No courses added.</div>
                ) : (
                  <ul className="divide-y divide-border/50">
                    {courses.map(course => (
                      <li key={course.id} className="p-3 hover:bg-muted/30 group flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{course.id}</span>
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">{course.credits} cr</Badge>
                          </div>
                          {course.prerequisites.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[10px] text-muted-foreground">Requires:</span>
                              <div className="flex gap-1 flex-wrap">
                                {course.prerequisites.map(p => (
                                  <Badge key={p} variant="outline" className="text-[9px] px-1 h-4 bg-background">{p}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10" onClick={() => removeCourse(course.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Generated Plan */}
        <div className="lg:col-span-2">
          {plan ? (
            <Card className="border-border/50 h-full">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  Semester Plan
                  <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">{plan.total_semesters} Semesters</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plan.plan.map((sem, i) => (
                    <motion.div key={sem.semester} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm"
                    >
                      <div className="bg-muted/30 p-3 border-b border-border/50 flex items-center justify-between">
                        <span className="font-bold text-sm">Semester {sem.semester}</span>
                        <Badge variant="outline" className={cn("text-[10px]", sem.credits > maxCredits ? "text-red-500 border-red-500" : "text-muted-foreground")}>
                          {sem.credits} / {maxCredits} cr
                        </Badge>
                      </div>
                      <div className="p-3 space-y-2">
                        {sem.courses.map(courseId => {
                          const course = courses.find(c => c.id === courseId);
                          return (
                            <div key={courseId} className="flex items-center justify-between p-2 rounded-md bg-muted/10 border border-border/30">
                              <span className="font-mono font-semibold text-xs text-primary">{courseId}</span>
                              <Badge variant="secondary" className="text-[10px] h-4 px-1">{course?.credits} cr</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] flex items-center justify-center border-2 border-dashed border-border/50 rounded-xl bg-muted/10">
              <div className="text-center max-w-sm px-6">
                <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-1">No plan generated yet</h3>
                <p className="text-sm text-muted-foreground">Add your courses with their prerequisites and credit values, then click Generate Sequence to see the optimal semester layout.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Course Dialog */}
      <Dialog open={showAddCourse} onOpenChange={setShowAddCourse}>
        <DialogContent className="max-w-sm">
          <h2 className="text-lg font-bold mb-2">Add Course to Sequencer</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Course ID</label>
              <Input placeholder="e.g. CS101" value={newCourseId} onChange={e => setNewCourseId(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Credits</label>
              <Input type="number" min={1} value={newCourseCredits} onChange={e => setNewCourseCredits(parseInt(e.target.value) || 3)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Prerequisites (comma separated)</label>
              <Input placeholder="e.g. CS101, MATH101" value={newCoursePrereqs} onChange={e => setNewCoursePrereqs(e.target.value)} className="mt-1" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowAddCourse(false)}>Cancel</Button>
              <Button onClick={handleAddCourse} disabled={!newCourseId.trim()}>Add Course</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
