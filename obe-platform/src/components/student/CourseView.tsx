'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Target, Layers, FileText, Video, ClipboardList, CheckSquare, Square, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';

interface LearningResource { title: string; type: 'pdf' | 'video' | 'link'; url: string; }
interface Task { id: string; type: 'quiz' | 'assignment'; title: string; dueDate: string; status: 'pending' | 'submitted' | 'graded'; marks?: string; }
interface Topic { id: string; title: string; objectives: string[]; resources: LearningResource[]; tasks: Task[]; completed: boolean; }
interface Unit { id: string; title: string; topics: Topic[]; }

const courseInfo = { code: 'CS301', name: 'Operating Systems', credits: 4, semester: 5, faculty: 'Dr. Priya Singh' };

const cos = [
  { id: 'CO1', description: 'Understand process management and scheduling algorithms', bloom: 'Understand' },
  { id: 'CO2', description: 'Analyze memory management techniques', bloom: 'Analyze' },
  { id: 'CO3', description: 'Evaluate file system design strategies', bloom: 'Evaluate' },
  { id: 'CO4', description: 'Apply synchronization concepts to concurrency problems', bloom: 'Apply' },
  { id: 'CO5', description: 'Design solutions for deadlock prevention', bloom: 'Create' },
];

const pos = [
  { id: 'PO1', desc: 'Engineering Knowledge' }, { id: 'PO2', desc: 'Problem Analysis' },
  { id: 'PO3', desc: 'Design/Development' }, { id: 'PO4', desc: 'Modern Tools' },
];

const copoMap: Record<string, Record<string, number>> = {
  CO1: { PO1: 3, PO2: 2, PO3: 1, PO4: 0 }, CO2: { PO1: 2, PO2: 3, PO3: 2, PO4: 1 },
  CO3: { PO1: 1, PO2: 2, PO3: 3, PO4: 2 }, CO4: { PO1: 2, PO2: 3, PO3: 2, PO4: 1 },
  CO5: { PO1: 1, PO2: 2, PO3: 3, PO4: 2 },
};

const units: Unit[] = [
  { id: 'u1', title: 'Unit 1: Process Management', topics: [
    { id: 't1', title: 'OS Concepts & Types', objectives: ['Define OS role', 'Classify OS types'], resources: [{ title: 'Chapter 1 (PDF)', type: 'pdf', url: '#' }, { title: 'Intro Video', type: 'video', url: '#' }], tasks: [], completed: true },
    { id: 't2', title: 'Process Lifecycle & PCB', objectives: ['Explain process states', 'Describe PCB structure'], resources: [{ title: 'Process Notes (PDF)', type: 'pdf', url: '#' }], tasks: [{ id: 'tsk1', type: 'quiz', title: 'Quiz: Process Basics', dueDate: 'Mar 15', status: 'graded', marks: '8/10' }], completed: true },
    { id: 't3', title: 'CPU Scheduling Algorithms', objectives: ['Implement FCFS, SJF, RR', 'Calculate turnaround time'], resources: [{ title: 'Scheduling (PDF)', type: 'pdf', url: '#' }, { title: 'Scheduling Video', type: 'video', url: '#' }], tasks: [{ id: 'tsk2', type: 'assignment', title: 'Scheduling Simulation', dueDate: 'Mar 22', status: 'submitted' }], completed: true },
  ]},
  { id: 'u2', title: 'Unit 2: Memory Management', topics: [
    { id: 't4', title: 'Contiguous Allocation', objectives: ['Explain fixed/dynamic partitioning', 'Apply fit strategies'], resources: [{ title: 'Memory Basics (PDF)', type: 'pdf', url: '#' }], tasks: [], completed: true },
    { id: 't5', title: 'Paging & Segmentation', objectives: ['Implement page tables', 'Calculate physical address'], resources: [{ title: 'Paging Notes (PDF)', type: 'pdf', url: '#' }, { title: 'Virtual Memory Video', type: 'video', url: '#' }], tasks: [{ id: 'tsk3', type: 'assignment', title: 'Page Table Implementation', dueDate: 'Apr 5', status: 'pending' }], completed: false },
    { id: 't6', title: 'Virtual Memory', objectives: ['Explain demand paging', 'Implement page replacement'], resources: [{ title: 'Virtual Memory (PDF)', type: 'pdf', url: '#' }], tasks: [{ id: 'tsk4', type: 'quiz', title: 'Quiz: Virtual Memory', dueDate: 'Apr 12', status: 'pending' }], completed: false },
  ]},
  { id: 'u3', title: 'Unit 3: Synchronization & Deadlocks', topics: [
    { id: 't7', title: 'Process Synchronization', objectives: ['Identify critical section', 'Implement mutex/semaphores'], resources: [{ title: 'Sync Concepts (PDF)', type: 'pdf', url: '#' }], tasks: [], completed: false },
    { id: 't8', title: 'Deadlock Handling', objectives: ['Apply Banker\'s algorithm', 'Implement detection/recovery'], resources: [{ title: 'Deadlocks (PDF)', type: 'pdf', url: '#' }, { title: 'Banker\'s Algo Video', type: 'video', url: '#' }], tasks: [{ id: 'tsk5', type: 'assignment', title: 'Banker\'s Algorithm', dueDate: 'Apr 20', status: 'pending' }], completed: false },
  ]},
];

function ResIcon({ type }: { type: string }) {
  if (type === 'pdf') return <FileText className="h-3.5 w-3.5 text-red-500" />;
  if (type === 'video') return <Video className="h-3.5 w-3.5 text-blue-500" />;
  return <ExternalLink className="h-3.5 w-3.5 text-green-500" />;
}

function MapCell({ value }: { value: number }) {
  const bg = value === 3 ? 'bg-green-500/20 text-green-700 dark:text-green-400 font-bold' : value === 2 ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' : value === 1 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-muted/30 text-muted-foreground';
  return <td className={cn('py-2 px-3 text-center text-xs', bg)}>{value > 0 ? value : '-'}</td>;
}

function TopicRow({ topic, index, onToggle }: { topic: Topic; index: number; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/20 last:border-0">
      <div className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors cursor-pointer group" onClick={() => setOpen(!open)}>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(); }} 
          className="hover:scale-110 transition-transform focus:outline-none"
        >
          {topic.completed ? <CheckSquare className="h-4 w-4 text-green-500 shrink-0" /> : <Square className="h-4 w-4 text-muted-foreground shrink-0 hover:text-green-500 transition-colors" />}
        </button>
        <span className="text-xs text-muted-foreground font-mono w-5 shrink-0">{index + 1}.</span>
        <span className={cn('text-sm flex-1 transition-all', topic.completed && 'text-muted-foreground line-through')}>{topic.title}</span>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />}
      </div>
      {open && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-4 pb-4 pl-14 space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Objectives</h4>
            <ul className="space-y-1">{topic.objectives.map((o, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-blue-500">•</span>{o}</li>)}</ul>
          </div>
          {topic.resources.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Resources</h4>
              {topic.resources.map((r, i) => <a key={i} href={r.url} className="flex items-center gap-2 text-sm hover:text-blue-500 p-1 rounded hover:bg-muted/30"><ResIcon type={r.type} />{r.title}</a>)}
            </div>
          )}
          {topic.tasks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Tasks</h4>
              {topic.tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20">
                  <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded', t.type === 'quiz' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500')}>{t.type}</span>
                      <span className="text-sm font-medium truncate">{t.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Due: {t.dueDate}</span>
                  </div>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', t.status === 'graded' ? 'text-green-500' : t.status === 'submitted' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500')}>{t.marks || t.status}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export function CourseView() {
  const [localUnits, setLocalUnits] = useState(units);
  const { addToast } = useStore();

  const allTopics = localUnits.flatMap((u) => u.topics);
  const done = allTopics.filter((t) => t.completed).length;
  const pct = Math.round((done / allTopics.length) * 100);

  const handleToggleTopic = (unitId: string, topicId: string) => {
    setLocalUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;
      return {
        ...u,
        topics: u.topics.map(t => {
          if (t.id !== topicId) return t;
          const isNowCompleted = !t.completed;
          addToast({ 
            type: isNowCompleted ? 'success' : 'info', 
            title: isNowCompleted ? 'Topic Completed' : 'Topic Reopened', 
            description: t.title 
          });
          return { ...t, completed: isNowCompleted };
        })
      };
    }));
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6 border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1"><BookOpen className="h-5 w-5 text-blue-500" /><span className="text-xs font-mono text-muted-foreground">{courseInfo.code}</span></div>
              <h2 className="text-xl font-bold">{courseInfo.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{courseInfo.credits} Credits &middot; Sem {courseInfo.semester} &middot; {courseInfo.faculty}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center"><p className="text-2xl font-bold">{done}/{allTopics.length}</p><p className="text-xs text-muted-foreground">Topics</p></div>
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                  <motion.circle cx="18" cy="18" r="14" fill="none" stroke="url(#cvG)" strokeWidth="3" strokeLinecap="round" strokeDasharray={88} initial={{ strokeDashoffset: 88 }} animate={{ strokeDashoffset: 88 - (pct / 100) * 88 }} transition={{ duration: 1 }} />
                  <defs><linearGradient id="cvG"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-bold">{pct}%</span></div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-6 border-border/50">
          <div className="flex items-center gap-2 mb-4"><Target className="h-5 w-5 text-purple-500" /><h3 className="font-semibold">Course Outcomes & PO Mapping</h3><span className="ml-auto text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">Read Only</span></div>
          <div className="space-y-2 mb-5">
            {cos.map((co) => (
              <div key={co.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/15">
                <span className="text-xs font-mono font-bold text-blue-500 mt-0.5 shrink-0">{co.id}</span>
                <p className="text-sm flex-1">{co.description}</p>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 shrink-0">{co.bloom}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-3"><Layers className="h-4 w-4 text-green-500" /><h4 className="text-sm font-semibold">CO-PO Matrix</h4></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/50"><th className="text-left py-2 px-3 text-xs text-muted-foreground">CO/PO</th>{pos.map((p) => <th key={p.id} className="text-center py-2 px-3 text-xs text-muted-foreground">{p.id}</th>)}</tr></thead>
              <tbody>{cos.map((co) => <tr key={co.id} className="border-b border-border/30 last:border-0"><td className="py-2 px-3 font-mono font-semibold text-blue-500 text-xs">{co.id}</td>{pos.map((p) => <MapCell key={p.id} value={copoMap[co.id]?.[p.id] ?? 0} />)}</tr>)}</tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">3 = High, 2 = Medium, 1 = Low</p>
        </Card>
      </motion.div>

      {units.map((unit, ui) => (
        <motion.div key={unit.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + 0.08 * ui }}>
          <Card className="border-border/50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-muted/20">
              <h3 className="text-sm font-semibold">{unit.title}</h3>
              <span className="text-xs text-muted-foreground">{unit.topics.filter((t) => t.completed).length}/{unit.topics.length} done</span>
            </div>
            {unit.topics.map((topic, ti) => <TopicRow key={topic.id} topic={topic} index={ti} onToggle={() => handleToggleTopic(unit.id, topic.id)} />)}
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
