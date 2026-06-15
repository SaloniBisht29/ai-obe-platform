'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2,
  Save,
  RotateCcw,
  Sparkles,
  Download,
  Info,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useStore } from '@/lib/store';
import { autoMapCOPO, updateProject, type MappingItem } from '@/lib/api';
import { cn } from '@/lib/utils';

// Hardcoded fallback list if the store has no courses
const FALLBACK_COURSES = ['CS201', 'CS301', 'CS302', 'CS303', 'CS401', 'CS202'];

const levelLabels: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: '-', color: 'text-muted-foreground/40', bg: 'bg-transparent' },
  1: { label: '1', color: 'text-amber-700', bg: 'bg-amber-500/15' },
  2: { label: '2', color: 'text-blue-700', bg: 'bg-blue-500/20' },
  3: { label: '3', color: 'text-green-700', bg: 'bg-green-500/25' },
};

export function COPOMappingPage() {
  const { state, setMappingResult, addToast } = useStore();

  // Get courses that have generated COs, or fallback to the mock list
  const availableCourses = Object.keys(state.courseOutcomes).length > 0
    ? Object.keys(state.courseOutcomes)
    : FALLBACK_COURSES;

  const [selectedCourse, setSelectedCourse] = useState(availableCourses[0] || '');
  const [mapping, setMapping] = useState<Record<string, Record<string, number>>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoMapping, setIsAutoMapping] = useState(false);
  const [autoMapError, setAutoMapError] = useState<string | null>(null);

  // Derive COs and POs for the selected course
  const courseOutcomes: MappingItem[] = state.courseOutcomes[selectedCourse]
    ? state.courseOutcomes[selectedCourse].map(co => ({ id: co.co_id, text: co.text }))
    : [
        { id: 'CO1', text: 'Analyze algorithm complexity' },
        { id: 'CO2', text: 'Design efficient data structures' },
        { id: 'CO3', text: 'Evaluate memory management' },
        { id: 'CO4', text: 'Apply sorting and searching' },
        { id: 'CO5', text: 'Understand data representation' },
      ]; // Fallback mock COs

  const programOutcomes: MappingItem[] = state.programmePos.length > 0
    ? state.programmePos.map(po => ({ id: po.po_id, text: po.title }))
    : [
        { id: 'PO1', text: 'Engineering Knowledge' },
        { id: 'PO2', text: 'Problem Analysis' },
        { id: 'PO3', text: 'Design/Development' },
        { id: 'PO4', text: 'Investigation' },
        { id: 'PO5', text: 'Modern Tool Usage' },
        { id: 'PO6', text: 'Engineer & Society' },
      ];

  const psos: MappingItem[] = state.programmePsos.length > 0
    ? state.programmePsos.map(pso => ({ id: pso.pso_id, text: pso.text }))
    : [
        { id: 'PSO1', text: 'Technical Skills' },
        { id: 'PSO2', text: 'Tools & Technology' },
        { id: 'PSO3', text: 'Professional Ethics' },
      ];

  const allCols = [...programOutcomes, ...psos];

  // Helper to build a completely empty matrix
  const buildInitialMatrix = () => {
    const mat: Record<string, Record<string, number>> = {};
    for (const co of courseOutcomes) {
      mat[co.id] = {};
      for (const col of allCols) {
        mat[co.id][col.id] = 0;
      }
    }
    return mat;
  };

  // Initialize mapping when the course changes
  useEffect(() => {
    if (Object.keys(state.mappingMatrix).length > 0) {
      // If we have a matrix in the store, use it (could be from previous load)
      // Make sure it matches the current course (simplified logic: we just use it)
      setMapping(state.mappingMatrix);
    } else {
      setMapping(buildInitialMatrix());
    }
    setHasChanges(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse]);

  const handleCellClick = (coId: string, colId: string) => {
    setMapping((prev) => {
      const current = prev[coId]?.[colId] || 0;
      const next = current >= 3 ? 0 : current + 1;
      return {
        ...prev,
        [coId]: { ...prev[coId], [colId]: next },
      };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (state.currentProjectId) {
        await updateProject(state.currentProjectId, {
          matrix_json: JSON.stringify(mapping),
        });
      }
      setMappingResult({
        co_ids: courseOutcomes.map(c => c.id),
        po_ids: programOutcomes.map(p => p.id),
        pso_ids: psos.map(p => p.id),
        peo_ids: [],
        matrix: mapping,
        table: [],
        explanations: {},
        peo_matrix: null,
        peo_table: [],
        peo_explanations: {},
      });
      setHasChanges(false);
      addToast({ type: 'success', title: 'Mapping Saved', description: `CO-PO mapping for ${selectedCourse} saved successfully.` });
    } catch {
      addToast({ type: 'error', title: 'Save Failed', description: 'Could not persist mapping.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setMapping(buildInitialMatrix());
    setHasChanges(false);
    addToast({ type: 'info', title: 'Mapping Reset', description: 'Matrix has been cleared.' });
  };

  const handleAIGenerate = async () => {
    setIsAutoMapping(true);
    setAutoMapError(null);
    try {
      const result = await autoMapCOPO({
        cos: courseOutcomes,
        pos: programOutcomes,
        psos: psos,
        top_k: 3,
        subject: selectedCourse,
      });

      // Merge API result with empty matrix (handles missing entries as 0)
      const newMatrix = buildInitialMatrix();
      for (const [coId, poMap] of Object.entries(result.matrix)) {
        for (const [colId, level] of Object.entries(poMap)) {
          if (newMatrix[coId] !== undefined) {
            newMatrix[coId][colId] = level;
          }
        }
      }
      setMapping(newMatrix);
      setHasChanges(true);
      setMappingResult(result);
      addToast({ type: 'success', title: 'AI Mapping Complete', description: `Mapping for ${selectedCourse} generated via semantic similarity.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setAutoMapError(msg);
      addToast({ type: 'error', title: 'Auto-Map Failed', description: 'Mapping Sequencer may be offline. Start it on port 8001.' });
    } finally {
      setIsAutoMapping(false);
    }
  };

  // Compute stats
  const totalCells = courseOutcomes.length * allCols.length;
  let mappedCells = 0;
  let sumLevel = 0;
  courseOutcomes.forEach(co => {
    allCols.forEach(col => {
      const v = mapping[co.id]?.[col.id] || 0;
      if (v > 0) {
        mappedCells++;
        sumLevel += v;
      }
    });
  });

  const coverage = totalCells > 0 ? Math.round((mappedCells / totalCells) * 100) : 0;
  const avgStrength = mappedCells > 0 ? (sumLevel / mappedCells).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Link2 className="h-6 w-6 text-blue-600" />
            CO-PO Mapping
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Interactive Course Outcome to Programme Outcome mapping matrix
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleAIGenerate} disabled={isAutoMapping}>
            {isAutoMapping ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5 text-purple-500" />}
            {isAutoMapping ? 'Mapping...' : 'AI Generate'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges || isSaving}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            {isSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save
          </Button>
        </div>
      </motion.div>

      {/* Auto-map error */}
      {autoMapError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Error communicating with Mapping Sequencer: {autoMapError}
        </div>
      )}

      {/* Course selector */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
      >
        {availableCourses.map((c) => (
          <Button key={c} size="sm" variant={selectedCourse === c ? 'default' : 'outline'}
            onClick={() => setSelectedCourse(c)}
            className={cn('text-xs h-8', selectedCourse === c && 'bg-primary text-primary-foreground')}
          >
            {c}
          </Button>
        ))}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Coverage', value: `${coverage}%`, color: coverage > 70 ? 'text-green-600' : 'text-amber-600' },
          { label: 'Mapped Cells', value: `${mappedCells}/${totalCells}`, color: 'text-blue-600' },
          { label: 'Avg Strength', value: avgStrength, color: 'text-purple-600' },
          { label: 'COs × (POs + PSOs)', value: `${courseOutcomes.length} × ${allCols.length}`, color: 'text-muted-foreground' },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-3 text-center">
              <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Matrix */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                Mapping Matrix — {selectedCourse}
                {hasChanges && <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-500/30">Unsaved</Badge>}
              </CardTitle>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Info className="h-3 w-3" /> Click cells to cycle: 0 → 1 → 2 → 3 → 0
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr>
                    <th className="w-16 h-10 text-xs font-semibold text-muted-foreground text-left pl-2">CO / PO</th>
                    {allCols.map((col, i) => (
                      <th key={col.id} className={cn(
                        'text-[10px] font-semibold text-center h-10 w-10',
                        i < programOutcomes.length ? 'text-blue-600' : 'text-purple-600'
                      )} title={col.text}>
                        {col.id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courseOutcomes.map((co) => (
                    <tr key={co.id} className="hover:bg-muted/10">
                      <td className="text-xs font-semibold text-muted-foreground pr-2 h-11 pl-2 truncate max-w-[120px]" title={co.text}>
                        {co.id}
                      </td>
                      {allCols.map((col) => {
                        const value = mapping[co.id]?.[col.id] || 0;
                        const level = levelLabels[value];
                        return (
                          <td key={col.id} className="p-0.5">
                            <Tooltip>
                              <TooltipTrigger>
                                <button
                                  onClick={() => handleCellClick(co.id, col.id)}
                                  className={cn(
                                    'w-full h-9 rounded-md flex items-center justify-center text-xs font-bold cursor-pointer transition-all',
                                    'hover:ring-2 hover:ring-primary/50 active:scale-95',
                                    value > 0 ? `${level.bg} ${level.color}` : 'bg-muted/30 text-muted-foreground/30 border border-dashed border-border/40'
                                  )}
                                >
                                  {level.label}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">{co.id} × {col.id}: {value === 0 ? 'No mapping' : `${level.label} mapping`}</p>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/50">
              {[
                { label: 'High (3)', bg: 'bg-green-500/25', border: 'border-green-600/30' },
                { label: 'Medium (2)', bg: 'bg-blue-500/20', border: 'border-blue-600/30' },
                { label: 'Low (1)', bg: 'bg-amber-500/15', border: 'border-amber-600/30' },
                { label: 'None (0)', bg: 'bg-muted/30', border: 'border-dashed border-border/40' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={cn('h-4 w-4 rounded-sm border', item.bg, item.border)} />
                  <span className="text-[11px] text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
