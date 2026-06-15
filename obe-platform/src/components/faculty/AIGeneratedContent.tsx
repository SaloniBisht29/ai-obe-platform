'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  Edit2,
  RotateCcw,
  Sparkles,
  Lightbulb,
  Brain,
  Save,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  Network,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useStore } from '@/lib/store';
import type { COObject } from '@/lib/api';


interface AICOItem {
  id: string;
  description: string;
  bloom: string;
  mappedPos: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'editing';
  confidence: number;
  editedText?: string;
}

const bloomsColors: Record<string, string> = {
  Remember: 'bg-sky-500/15 text-sky-600 border-sky-500/30',
  Understand: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  Apply: 'bg-violet-500/15 text-violet-600 border-violet-500/30',
  Analyze: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  Evaluate: 'bg-red-500/15 text-red-600 border-red-500/30',
  Create: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
};

const poDescriptions: Record<string, string> = {
  PO1: 'Engineering Knowledge',
  PO2: 'Problem Analysis',
  PO3: 'Design/Development of Solutions',
  PO4: 'Investigation',
  PO5: 'Modern Tool Usage',
  PO6: 'Engineer & Society',
};

// Fallback COs when backend is unreachable
const getFallbackCOs = (courseCode: string): AICOItem[] => [
  { id: 'CO1', description: `Define and recall fundamental concepts of ${courseCode}`, bloom: 'Remember', mappedPos: ['PO1', 'PO2'], status: 'pending', confidence: 82 },
  { id: 'CO2', description: `Explain the working principles and mechanisms in ${courseCode}`, bloom: 'Understand', mappedPos: ['PO1', 'PO3'], status: 'pending', confidence: 85 },
  { id: 'CO3', description: `Apply standard techniques to solve problems in ${courseCode}`, bloom: 'Apply', mappedPos: ['PO2', 'PO3', 'PO5'], status: 'pending', confidence: 88 },
  { id: 'CO4', description: `Analyze components and behavior of ${courseCode} systems`, bloom: 'Analyze', mappedPos: ['PO2', 'PO4'], status: 'pending', confidence: 84 },
  { id: 'CO5', description: `Evaluate and compare different approaches in ${courseCode}`, bloom: 'Evaluate', mappedPos: ['PO3', 'PO11', 'PO12'], status: 'pending', confidence: 80 },
];

async function fetchCOsFromBackend(courseCode: string, courseName: string): Promise<AICOItem[]> {

  const res = await fetch('/api/outcomes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      course_name: courseName || courseCode,
      course_description: `${courseName || courseCode} — standard Indian university course`,
      target_bloom_levels: ['remember', 'understand', 'apply', 'analyze', 'evaluate'],
      n_candidates: 5,
      education_level: 'undergraduate',
      programme: 'btech',
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as {
    outcomes: Array<{ text: string; bloom_level: string; assessment_suggestion: string; confidence_est: number }>;
  };

  const posMap = [['PO1', 'PO2'], ['PO1', 'PO3'], ['PO2', 'PO3', 'PO5'], ['PO2', 'PO4'], ['PO3', 'PO11', 'PO12']];

  return data.outcomes.map((o, i) => ({
    id: `CO${i + 1}`,
    description: o.text,
    bloom: o.bloom_level.charAt(0).toUpperCase() + o.bloom_level.slice(1),
    mappedPos: posMap[i] || ['PO1', 'PO2'],
    status: 'pending' as const,
    confidence: Math.round(o.confidence_est * 100),
  }));
}

export function AIGeneratedContent({
  courseCode,
  courseName,
  onClose,
  onMapToPOs,
}: {
  courseCode: string;
  courseName?: string;
  onClose: () => void;
  /** Called when user clicks 'Map to POs' — parent should open the COPOMapping dialog */
  onMapToPOs?: (cos: Array<{ id: string; text: string }>) => void;
}) {
  const { storeCourseOutcomes } = useStore();
  const [items, setItems] = useState<AICOItem[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [source, setSource] = useState<'ollama' | 'mock'>('mock');

  const streamIn = (coItems: AICOItem[], onDone?: () => void) => {
    setItems([]);
    let current = 0;
    const interval = setInterval(() => {
      if (current < coItems.length) {
        setItems((prev) => [...prev, coItems[current]]);
        current++;
      } else {
        clearInterval(interval);
        onDone?.();
      }
    }, 380);
    return () => clearInterval(interval);
  };

  // Initial load — try real backend, fall back to mock
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    fetchCOsFromBackend(courseCode, courseName || courseCode)
      .then((coItems) => {
        setSource('ollama');
        cleanup = streamIn(coItems, () => setIsGenerating(false));
      })
      .catch(() => {
        setSource('mock');
        cleanup = streamIn(getFallbackCOs(courseCode), () => setIsGenerating(false));
      });
    return () => cleanup?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseCode]);

  // When COs finish loading, persist them into the global store
  useEffect(() => {
    if (!isGenerating && items.length > 0) {
      // Convert AICOItem[] to COObject[] for the store
      const coObjects: COObject[] = items.map((item) => ({
        co_id: item.id,
        text: item.description,
        bloom_level: item.bloom,
        bloom_verb: item.bloom,
        bloom_level_number: String(['Remember','Understand','Apply','Analyze','Evaluate','Create'].indexOf(item.bloom) + 1),
        mapped_pos: item.mappedPos,
        po_correlation: {},
        mapped_psos: [],
        pso_correlation: {},
        attainment_target: '60%',
        attainment_level: 0,
        direct_assessment: [],
        indirect_assessment: [],
        unit_test_marks: 0,
        assignment_marks: 0,
        end_sem_marks: 0,
      }));
      storeCourseOutcomes(courseCode, coObjects);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating, items.length]);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    fetchCOsFromBackend(courseCode, courseName || courseCode)
      .then((coItems) => {
        setSource('ollama');
        streamIn(coItems, () => setIsRegenerating(false));
      })
      .catch(() => {
        setSource('mock');
        streamIn(getFallbackCOs(courseCode), () => setIsRegenerating(false));
      });
  };

  const updateStatus = (id: string, status: AICOItem['status']) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const startEditing = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'editing', editedText: item.description } : item,
      ),
    );
  };

  const saveEdit = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'accepted', description: item.editedText || item.description }
          : item,
      ),
    );
  };

  const cancelEdit = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'pending', editedText: undefined } : item)));
  };

  const updateEditText = (id: string, text: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, editedText: text } : item)));
  };

  const handleAcceptAll = () => {
    setItems((prev) => prev.map((item) => (item.status === 'pending' ? { ...item, status: 'accepted' } : item)));
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const acceptedCount = items.filter((i) => i.status === 'accepted').length;
  const rejectedCount = items.filter((i) => i.status === 'rejected').length;
  const pendingCount = items.filter((i) => i.status === 'pending').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2.5 rounded-xl shadow-lg shadow-purple-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            {(isGenerating || isRegenerating) && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-purple-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              AI-Generated Course Outcomes
              {(isGenerating || isRegenerating) && (
                <span className="text-xs font-normal text-purple-500 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Generating...
                </span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              Review AI suggestions for <span className="font-semibold text-foreground">{courseCode}</span>
              {!isGenerating && (
                <Badge variant="outline" className={`text-[9px] h-4 px-1.5 gap-1 ${source === 'ollama' ? 'border-green-500/30 text-green-600' : 'border-amber-500/30 text-amber-600'}`}>
                  <Zap className="h-2 w-2" />{source === 'ollama' ? 'Live AI' : 'Offline'}
                </Badge>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
        <div className="flex items-center gap-4 flex-1 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Accepted:</span>
            <span className="font-bold text-green-600">{acceptedCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Rejected:</span>
            <span className="font-bold text-red-600">{rejectedCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">Pending:</span>
            <span className="font-bold text-amber-600">{pendingCount}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isRegenerating || isGenerating}
            className="gap-1.5 text-xs h-8"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
          <Button
            size="sm"
            onClick={handleAcceptAll}
            disabled={pendingCount === 0 || isGenerating}
            className="gap-1.5 text-xs h-8 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Accept All
          </Button>
        </div>
      </div>

      {/* Suggestion hint */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 text-xs text-blue-600">
        <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          COs are generated using Bloom&apos;s Taxonomy analysis of your syllabus. Each CO includes
          a confidence score and suggested PO mappings. Click <strong>Edit</strong> to refine any outcome.
        </span>
      </div>

      {/* CO cards */}
      <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1.5">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                item.status === 'accepted'
                  ? 'border-green-500/40 bg-green-500/5'
                  : item.status === 'rejected'
                  ? 'border-red-500/30 bg-red-500/5 opacity-50'
                  : item.status === 'editing'
                  ? 'border-blue-500/40 bg-blue-500/5 ring-2 ring-blue-500/10'
                  : 'border-border/40 bg-card hover:border-purple-500/30'
              }`}
            >
              <div className="flex flex-col gap-3">
                {/* Top row: ID, Bloom's badge, confidence, status icons */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-purple-500">{item.id}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0 h-5 font-semibold uppercase ${bloomsColors[item.bloom] || 'bg-muted text-muted-foreground'}`}
                    >
                      <Brain className="h-2.5 w-2.5 mr-1" />
                      {item.bloom}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-muted/80 gap-1">
                      {item.confidence}% confidence
                    </Badge>
                  </div>

                  {/* Status indicator */}
                  {item.status === 'accepted' && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Accepted
                    </Badge>
                  )}
                  {item.status === 'rejected' && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px] gap-1">
                      <XCircle className="h-3 w-3" /> Rejected
                    </Badge>
                  )}
                </div>

                {/* Description / Edit field */}
                {item.status === 'editing' ? (
                  <div className="space-y-2">
                    <Input
                      value={item.editedText || ''}
                      onChange={(e) => updateEditText(item.id, e.target.value)}
                      className="text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => cancelEdit(item.id)}>
                        Cancel
                      </Button>
                      <Button size="sm" className="h-7 text-xs gap-1 bg-blue-600 hover:bg-blue-700" onClick={() => saveEdit(item.id)}>
                        <Save className="h-3 w-3" /> Save & Accept
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-medium leading-relaxed">{item.description}</p>
                )}

                {/* PO mapping suggestions */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground mr-0.5 flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      Suggested POs:
                    </span>
                    {item.mappedPos.map((po) => (
                      <Badge
                        key={po}
                        variant="outline"
                        className="text-[10px] px-2 h-5 bg-muted/40 hover:bg-muted/80 cursor-help transition-colors"
                        title={poDescriptions[po] || po}
                      >
                        {po}
                      </Badge>
                    ))}
                  </div>

                  {/* Action buttons */}
                  {item.status !== 'editing' && (
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="icon"
                        variant={item.status === 'accepted' ? 'default' : 'outline'}
                        className={`h-8 w-8 transition-all ${
                          item.status === 'accepted'
                            ? 'bg-green-500 hover:bg-green-600 text-white shadow-sm shadow-green-500/30'
                            : 'hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30'
                        }`}
                        onClick={() => updateStatus(item.id, 'accepted')}
                        title="Accept"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant={item.status === 'rejected' ? 'destructive' : 'outline'}
                        className={`h-8 w-8 transition-all ${
                          item.status === 'rejected'
                            ? 'shadow-sm shadow-red-500/30'
                            : 'hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30'
                        }`}
                        onClick={() => updateStatus(item.id, 'rejected')}
                        title="Reject"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30 transition-all"
                        onClick={() => startEditing(item.id)}
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading skeleton */}
        {(isGenerating || isRegenerating) && items.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-border/30 bg-muted/10 animate-pulse">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 w-10 bg-muted rounded" />
                  <div className="h-5 w-16 bg-muted rounded" />
                </div>
                <div className="h-4 w-full bg-muted rounded mb-2" />
                <div className="h-4 w-2/3 bg-muted rounded" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t gap-4">
        <p className="text-xs text-muted-foreground">
          {acceptedCount > 0 && <span className="text-green-600 font-medium">{acceptedCount} accepted</span>}
          {acceptedCount > 0 && (rejectedCount > 0 || pendingCount > 0) && ' • '}
          {rejectedCount > 0 && <span className="text-red-600 font-medium">{rejectedCount} rejected</span>}
          {rejectedCount > 0 && pendingCount > 0 && ' • '}
          {pendingCount > 0 && <span className="text-amber-600 font-medium">{pendingCount} pending review</span>}
        </p>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onClose} disabled={acceptedCount === 0} className="gap-2">
            <Save className="h-4 w-4" />
            Save ({acceptedCount})
          </Button>
          {onMapToPOs && acceptedCount > 0 && (
            <Button
              onClick={() => {
                const acceptedCOs = items
                  .filter(i => i.status === 'accepted' || i.status === 'pending')
                  .map(i => ({ id: i.id, text: i.description }));
                onMapToPOs(acceptedCOs);
                onClose();
              }}
              className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            >
              <Network className="h-4 w-4" />
              Save & Map to POs →
            </Button>
          )}
        </div>
      </div>

      {/* Confetti overlay */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-2xl shadow-green-500/30 flex items-center gap-2"
            >
              <CheckCircle2 className="h-5 w-5" />
              All COs Accepted!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
