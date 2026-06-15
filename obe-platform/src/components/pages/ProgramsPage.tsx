'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap, Plus, Search, ChevronRight, BookOpen, Target, BarChart3,
  Edit, Loader2, X, Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { AnimatePresence } from 'framer-motion';

interface Program {
  id: string;
  name: string;
  code: string;
  department: string;
  level: string;
  duration: string;
  totalCourses: number;
  activeCourses: number;
  totalCOs: number;
  completionRate: number;
  status: 'active' | 'draft' | 'archived';
  semesters: number;
}

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  draft: { label: 'Draft', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  archived: { label: 'Archived', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

export function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newLevel, setNewLevel] = useState('B.Tech');
  const [saving, setSaving] = useState(false);
  const { addToast, setPage } = useStore();

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/programs');
      if (res.ok) {
        const data = await res.json();
        setPrograms(data.programs || []);
      }
    } catch (e) {
      console.error('Failed to fetch programs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = async () => {
    if (!newName.trim() || !newCode.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, code: newCode, level: newLevel }),
      });
      if (res.ok) {
        addToast({ type: 'success', title: 'Program Created', description: `${newCode} — ${newName}` });
        setShowCreate(false);
        setNewName(''); setNewCode('');
        fetchPrograms();
      } else {
        const data = await res.json();
        addToast({ type: 'error', title: 'Failed', description: data.error });
      }
    } catch {
      addToast({ type: 'error', title: 'Error', description: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = programs.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  // Compute real stats from loaded programs
  const totalCourses = programs.reduce((s, p) => s + p.totalCourses, 0);
  const totalCOs = programs.reduce((s, p) => s + p.totalCOs, 0);
  const avgCompletion = programs.length > 0 ? Math.round(programs.reduce((s, p) => s + p.completionRate, 0) / programs.length) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading programs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" /> Programs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage academic programs and their curriculum structure
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Program
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search programs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </motion.div>

      {/* Stats summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Programs', value: String(programs.length), icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-500/10' },
          { label: 'Total Courses', value: String(totalCourses), icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-500/10' },
          { label: 'Active COs', value: String(totalCOs), icon: Target, color: 'text-green-600', bg: 'bg-green-500/10' },
          { label: 'Avg Completion', value: `${avgCompletion}%`, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-500/10' },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('p-2.5 rounded-xl', stat.bg)}>
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Program cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((program, index) => {
          const status = statusConfig[program.status] || statusConfig.active;
          return (
            <motion.div key={program.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.08 }}>
              <Card className="border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {program.code.slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{program.name}</h3>
                        <p className="text-xs text-muted-foreground">{program.level} · {program.duration} · {program.semesters} Semesters</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] h-5', status.color)}>{status.label}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{program.totalCourses}</p>
                      <p className="text-[10px] text-muted-foreground">Courses</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{program.totalCOs}</p>
                      <p className="text-[10px] text-muted-foreground">COs</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{program.completionRate}%</p>
                      <p className="text-[10px] text-muted-foreground">Complete</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${program.completionRate}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                        className={cn('h-full rounded-full',
                          program.completionRate > 70 ? 'bg-green-500' :
                          program.completionRate > 40 ? 'bg-amber-500' : 'bg-red-500'
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                        onClick={() => { setPage('courses'); addToast({ type: 'info', title: `Viewing ${program.code} courses` }); }}>
                        <BookOpen className="h-3 w-3 mr-1" /> Courses
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <GraduationCap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No programs found. Create your first program above.</p>
        </motion.div>
      )}

      {/* Create Program Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-500" /> Create Program
                </h2>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCreate(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Program Name</label>
                  <Input placeholder="e.g. Computer Science & Engineering" value={newName} onChange={e => setNewName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Code</label>
                  <Input placeholder="e.g. CSE" value={newCode} onChange={e => setNewCode(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Level</label>
                  <select className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm mt-1"
                    value={newLevel} onChange={e => setNewLevel(e.target.value)}>
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="PhD">PhD</option>
                    <option value="BCA">BCA</option>
                    <option value="MCA">MCA</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  onClick={handleCreateProgram} disabled={saving || !newName.trim() || !newCode.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Create
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
