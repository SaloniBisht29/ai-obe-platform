'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Search, Plus, SortAsc, SortDesc, ChevronLeft, ChevronRight,
  Sparkles, Network, Edit, CheckCircle, XCircle, Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CourseEditor } from '@/components/faculty/CourseEditor';
import { AIGeneratedContent } from '@/components/faculty/AIGeneratedContent';
import { COPOMapping } from '@/components/faculty/COPOMapping';
import { PermissionGuard } from '@/components/PermissionGuard';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

// Course type — same shape as before but from DB
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
  approved: { label: 'Approved', className: 'bg-green-500/10 text-green-600 border-green-500/20', dot: 'bg-green-500' },
  draft: { label: 'Draft', className: 'bg-gray-500/10 text-gray-600 border-gray-500/20', dot: 'bg-gray-500' },
  review: { label: 'Under Review', className: 'bg-orange-500/10 text-orange-600 border-orange-500/20', dot: 'bg-orange-500' },
  published: { label: 'Published', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20', dot: 'bg-blue-500' },
};

type SortField = 'name' | 'code' | 'semester' | 'progress';

const PAGE_SIZE = 6;

export function CoursesPage() {
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPageNum] = useState(1);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [generatingFor, setGeneratingFor] = useState<Course | null>(null);
  const [mappingFor, setMappingFor] = useState<Course | null>(null);
  const [pendingMapCOs, setPendingMapCOs] = useState<Array<{ id: string; text: string }> | null>(null);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({ code: '', name: '', semester: 1, credits: 3 });
  const [saving, setSaving] = useState(false);
  const { addToast } = useStore();

  // ── Fetch courses from MongoDB ────────────────────────────────
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        setCourseList(data.courses || []);
      }
    } catch (e) {
      console.error('Failed to fetch courses:', e);
    } finally {
      setLoading(false);
    }
  };

  // ── Create course via API ─────────────────────────────────────
  const handleCreateCourse = async () => {
    if (!newCourse.code.trim() || !newCourse.name.trim()) {
      addToast({ type: 'error', title: 'Missing Fields', description: 'Course code and name are required' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse),
      });
      const data = await res.json();
      if (res.ok) {
        setCourseList(prev => [data.course, ...prev]);
        setShowNewCourse(false);
        setNewCourse({ code: '', name: '', semester: 1, credits: 3 });
        addToast({ type: 'success', title: 'Course Created', description: `${data.course.code} — ${data.course.name}` });
      } else {
        addToast({ type: 'error', title: 'Failed', description: data.error || 'Could not create course' });
      }
    } catch {
      addToast({ type: 'error', title: 'Error', description: 'Network error creating course' });
    } finally {
      setSaving(false);
    }
  };

  // ── Update course status via API ──────────────────────────────
  const handleStatusChange = async (course: Course, newStatus: string) => {
    try {
      const res = await fetch(`/api/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCourseList((prev) => prev.map((c) => c.id === course.id ? { ...c, status: newStatus as Course['status'] } : c));
        addToast({ type: 'success', title: newStatus === 'approved' ? 'Course Approved' : 'Course Rejected', description: `${course.code} status updated` });
      }
    } catch {
      addToast({ type: 'error', title: 'Error', description: 'Failed to update course status' });
    }
  };

  const filtered = useMemo(() => {
    const list = courseList.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'code') cmp = a.code.localeCompare(b.code);
      else if (sortField === 'semester') cmp = a.semester - b.semester;
      else if (sortField === 'progress') cmp = a.progress - b.progress;
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [courseList, search, statusFilter, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading courses...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Course Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} courses · Manage curriculum, COs, and mappings</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white" onClick={() => setShowNewCourse(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Course
        </Button>
      </motion.div>

      {/* Filters row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search courses..." value={search} onChange={(e) => { setSearch(e.target.value); setPageNum(1); }} className="pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'approved', 'review', 'draft', 'published'].map((s) => (
            <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => { setStatusFilter(s); setPageNum(1); }}
              className={cn('text-xs h-8 capitalize', statusFilter === s && 'bg-primary text-primary-foreground')}
            >
              {s === 'all' ? 'All' : statusConfig[s as keyof typeof statusConfig]?.label || s}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Sort controls */}
      <div className="flex gap-2 items-center text-xs text-muted-foreground">
        <span>Sort by:</span>
        {(['code', 'name', 'semester', 'progress'] as SortField[]).map((f) => (
          <button key={f} onClick={() => toggleSort(f)}
            className={cn('px-2 py-1 rounded border text-xs capitalize transition-colors',
              sortField === f ? 'border-primary/50 bg-primary/5 text-primary' : 'border-border hover:bg-muted')}
          >
            {f} {sortField === f && (sortAsc ? <SortAsc className="h-3 w-3 inline ml-0.5" /> : <SortDesc className="h-3 w-3 inline ml-0.5" />)}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {paginated.map((course, index) => {
          const status = statusConfig[course.status];
          const progressColor = course.progress < 30 ? 'bg-red-500' : course.progress < 70 ? 'bg-orange-500' : 'bg-green-500';
          return (
            <motion.div key={course.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.05 }}
            >
              <Card className="group flex flex-col h-full border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                <div className={cn('h-1 w-full',
                  course.status === 'approved' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                  course.status === 'review' ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                  course.status === 'published' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                  'bg-gradient-to-r from-gray-300 to-gray-400'
                )} />
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">{course.code}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{course.name}</p>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5 h-auto whitespace-nowrap shrink-0', status.className)}>
                      <div className={cn('h-1.5 w-1.5 rounded-full mr-1.5', status.dot)} />
                      {status.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 bg-blue-500/10 text-blue-600 border-0">Sem {course.semester}</Badge>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 bg-muted border-0">{course.credits} Credits</Badge>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 bg-purple-500/10 text-purple-600 border-0">{course.cosCount} COs</Badge>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-muted-foreground">Completion</span>
                      <span className="text-[11px] font-semibold">{course.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${course.progress}%` }}
                        transition={{ delay: 0.3 + index * 0.05, duration: 0.8 }}
                        className={cn('h-full rounded-full', progressColor)}
                      />
                    </div>
                  </div>

                  <div className="mt-auto pt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <PermissionGuard requiredRole={['FACULTY', 'ADMIN']} fallback={
                        <Button disabled size="sm" variant="outline" className="w-full text-xs h-8 opacity-50"><Sparkles className="h-3.5 w-3.5 mr-1.5" />Restricted</Button>
                      }>
                        <Button size="sm" variant="outline" className="w-full text-xs h-8 bg-purple-500/5 hover:bg-purple-500/10 hover:text-purple-600 border-purple-500/20"
                          onClick={() => setGeneratingFor(course)}>
                          <Sparkles className="h-3.5 w-3.5 mr-1.5 text-purple-500" /> Generate COs
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard requiredRole={['FACULTY', 'ADMIN']} fallback={
                        <Button disabled size="sm" variant="outline" className="w-full text-xs h-8 opacity-50"><Network className="h-3.5 w-3.5 mr-1.5" />Restricted</Button>
                      }>
                        <Button size="sm" variant="outline" className="w-full text-xs h-8 hover:bg-blue-500/10 hover:text-blue-600 border-blue-500/20"
                          onClick={() => setMappingFor(course)}>
                          <Network className="h-3.5 w-3.5 mr-1.5 text-blue-500" /> Map to POs
                        </Button>
                      </PermissionGuard>
                    </div>
                    <PermissionGuard requiredRole={['FACULTY', 'ADMIN']} fallback={null}>
                      <Button size="sm" variant="outline" className="w-full text-xs h-8" onClick={() => setEditingCourse(course)}>
                        <Edit className="h-3.5 w-3.5 mr-2" /> Edit Course
                      </Button>
                    </PermissionGuard>
                    {course.status === 'review' && (
                      <PermissionGuard requiredRole={['FACULTY', 'ADMIN']} fallback={null}>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button size="sm" variant="outline" className="w-full text-xs h-8 bg-green-500/5 hover:bg-green-500/15 text-green-600 border-green-500/20"
                            onClick={() => handleStatusChange(course, 'approved')}><CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve</Button>
                          <Button size="sm" variant="outline" className="w-full text-xs h-8 bg-red-500/5 hover:bg-red-500/15 text-red-600 border-red-500/20"
                            onClick={() => handleStatusChange(course, 'draft')}><XCircle className="h-3.5 w-3.5 mr-1" /> Reject</Button>
                        </div>
                      </PermissionGuard>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {paginated.length === 0 && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No courses found</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first course or adjust your filters</p>
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPageNum(page - 1)} className="h-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => setPageNum(p)} className="h-8 w-8 p-0 text-xs">
              {p}
            </Button>
          ))}
          <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPageNum(page + 1)} className="h-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
        <DialogContent className="max-w-3xl border-border bg-background shadow-2xl p-6 sm:p-8">
          {editingCourse && <CourseEditor course={editingCourse} onClose={() => setEditingCourse(null)} />}
        </DialogContent>
      </Dialog>
      <Dialog open={!!generatingFor} onOpenChange={(open) => !open && setGeneratingFor(null)}>
        <DialogContent className="max-w-2xl border-border bg-background shadow-2xl p-6 sm:p-8">
          {generatingFor && (
            <AIGeneratedContent
              courseCode={generatingFor.code}
              courseName={generatingFor.name}
              onClose={() => setGeneratingFor(null)}
              onMapToPOs={(cos) => {
                setPendingMapCOs(cos);
                setMappingFor(generatingFor);
                setGeneratingFor(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!mappingFor} onOpenChange={(open) => { if (!open) { setMappingFor(null); setPendingMapCOs(null); } }}>
        <DialogContent className="max-w-4xl border-border bg-background shadow-2xl p-6 sm:p-8">
          {mappingFor && (
            <COPOMapping
              courseCode={mappingFor.code}
              cos={pendingMapCOs ?? undefined}
              onClose={() => { setMappingFor(null); setPendingMapCOs(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* New Course Dialog */}
      <Dialog open={showNewCourse} onOpenChange={setShowNewCourse}>
        <DialogContent className="max-w-md border-border bg-background shadow-2xl p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-blue-600" /> Create New Course</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Course Code</label>
              <Input placeholder="e.g. CS501" value={newCourse.code} onChange={e => setNewCourse(p => ({ ...p, code: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Course Name</label>
              <Input placeholder="e.g. Machine Learning" value={newCourse.name} onChange={e => setNewCourse(p => ({ ...p, name: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Semester</label>
                <Input type="number" min={1} max={8} value={newCourse.semester} onChange={e => setNewCourse(p => ({ ...p, semester: parseInt(e.target.value) || 1 }))} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Credits</label>
                <Input type="number" min={1} max={6} value={newCourse.credits} onChange={e => setNewCourse(p => ({ ...p, credits: parseInt(e.target.value) || 3 }))} className="mt-1" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewCourse(false)}>Cancel</Button>
              <Button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white" onClick={handleCreateCourse} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Course
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
