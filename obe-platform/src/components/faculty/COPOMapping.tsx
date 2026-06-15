'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Network,
  Save,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { autoMapCOPO, updateProject, type MappingItem } from '@/lib/api';
import { useStore } from '@/lib/store';

interface COPOMappingProps {
  courseCode: string;
  /** Real COs from the AI Syllabus Generator (optional — falls back to defaults) */
  cos?: MappingItem[];
  /** Real POs from the programme (optional — falls back to store's NBA defaults) */
  pos?: MappingItem[];
  /** Initial matrix to pre-populate (e.g. from a saved project) */
  initialMatrix?: Record<string, Record<string, number>>;
  onClose: () => void;
}

// Default fallback COs if none are passed
function getDefaultCOs(courseCode: string): MappingItem[] {
  return [
    { id: 'CO1', text: `Define and recall fundamental concepts of ${courseCode}` },
    { id: 'CO2', text: `Explain the working principles and mechanisms in ${courseCode}` },
    { id: 'CO3', text: `Apply standard techniques to solve problems in ${courseCode}` },
    { id: 'CO4', text: `Analyze components and behavior of ${courseCode} systems` },
    { id: 'CO5', text: `Evaluate and compare different approaches in ${courseCode}` },
  ];
}

// Default NBA PO list (used as fallback if store has no POs)
const DEFAULT_POS: MappingItem[] = [
  { id: 'PO1', text: 'Engineering Knowledge' },
  { id: 'PO2', text: 'Problem Analysis' },
  { id: 'PO3', text: 'Design/Development of Solutions' },
  { id: 'PO4', text: 'Investigation of Problems' },
  { id: 'PO5', text: 'Modern Tool Usage' },
  { id: 'PO6', text: 'The Engineer and Society' },
  { id: 'PO7', text: 'Environment and Sustainability' },
  { id: 'PO8', text: 'Ethics' },
  { id: 'PO9', text: 'Individual and Team Work' },
  { id: 'PO10', text: 'Communication' },
  { id: 'PO11', text: 'Project Management and Finance' },
  { id: 'PO12', text: 'Life-long Learning' },
];

const levelLabels: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: '-', color: 'text-muted-foreground/40', bg: 'bg-transparent' },
  1: { label: '1', color: 'text-amber-700', bg: 'bg-amber-500/15' },
  2: { label: '2', color: 'text-blue-700', bg: 'bg-blue-500/20' },
  3: { label: '3', color: 'text-green-700', bg: 'bg-green-500/25' },
};

function buildInitialMatrix(cos: MappingItem[], pos: MappingItem[]): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  for (const co of cos) {
    matrix[co.id] = {};
    for (const po of pos) {
      matrix[co.id][po.id] = 0;
    }
  }
  return matrix;
}

export function COPOMapping({ courseCode, cos: propCos, pos: propPos, initialMatrix, onClose }: COPOMappingProps) {
  const { state, setMappingResult, addToast } = useStore();

  // Use props if provided, else fall back to store / defaults
  const courseOutcomes: MappingItem[] = propCos && propCos.length > 0
    ? propCos
    : (state.courseOutcomes[courseCode]?.map(co => ({ id: co.co_id, text: co.text })) ?? getDefaultCOs(courseCode));

  const programOutcomes: MappingItem[] = propPos && propPos.length > 0
    ? propPos
    : (state.programmePos.length > 0
        ? state.programmePos.map(po => ({ id: po.po_id, text: po.title }))
        : DEFAULT_POS);

  const [mapping, setMapping] = useState<Record<string, Record<string, number>>>(() =>
    initialMatrix ?? buildInitialMatrix(courseOutcomes, programOutcomes)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isAutoMapping, setIsAutoMapping] = useState(false);
  const [autoMapError, setAutoMapError] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ co: string; po: string } | null>(null);

  // Re-initialize matrix when COs/POs change (e.g. after syllabus generated)
  useEffect(() => {
    if (!initialMatrix) {
      setMapping(buildInitialMatrix(courseOutcomes, programOutcomes));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseCode]);

  const cycleValue = (co: string, po: string) => {
    const current = mapping[co]?.[po] || 0;
    const next = (current + 1) % 4;
    setMapping((prev) => ({
      ...prev,
      [co]: { ...prev[co], [po]: next },
    }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Persist to Mapping Sequencer project if one is active
      if (state.currentProjectId) {
        await updateProject(state.currentProjectId, {
          matrix_json: JSON.stringify(mapping),
        });
      }
      // Update global store with the latest matrix
      setMappingResult({
        co_ids: courseOutcomes.map(c => c.id),
        po_ids: programOutcomes.map(p => p.id),
        pso_ids: [],
        peo_ids: [],
        matrix: mapping,
        table: [],
        explanations: {},
        peo_matrix: null,
        peo_table: [],
        peo_explanations: {},
      });
      setSaved(true);
      setHasChanges(false);
      addToast({ type: 'success', title: 'Mapping Saved', description: `CO-PO mapping for ${courseCode} saved successfully.` });
      setTimeout(() => setSaved(false), 3000);
    } catch {
      addToast({ type: 'error', title: 'Save Failed', description: 'Could not persist mapping. Check that the Mapping Sequencer is running.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoMap = async () => {
    setIsAutoMapping(true);
    setAutoMapError(null);
    try {
      const result = await autoMapCOPO({
        cos: courseOutcomes,
        pos: programOutcomes,
        top_k: 3,
        subject: courseCode,
      });

      // Build a full matrix from the API result (fill 0 for missing entries)
      const newMatrix = buildInitialMatrix(courseOutcomes, programOutcomes);
      for (const [coId, poMap] of Object.entries(result.matrix)) {
        for (const [poId, level] of Object.entries(poMap)) {
          if (newMatrix[coId] !== undefined) {
            newMatrix[coId][poId] = level;
          }
        }
      }
      setMapping(newMatrix);
      setHasChanges(true);
      setSaved(false);
      setMappingResult(result);
      addToast({ type: 'success', title: 'AI Mapping Complete', description: `CO-PO mapping for ${courseCode} generated using semantic similarity.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setAutoMapError(msg);
      addToast({
        type: 'error',
        title: 'Auto-Map Failed',
        description: 'Mapping Sequencer may be offline. Start it on port 8001.',
      });
    } finally {
      setIsAutoMapping(false);
    }
  };

  const handleReset = () => {
    setMapping(buildInitialMatrix(courseOutcomes, programOutcomes));
    setHasChanges(false);
    setSaved(false);
  };

  // Calculate averages
  const getPoAverage = (poId: string) => {
    const values = courseOutcomes.map((co) => mapping[co.id]?.[poId] || 0);
    const nonZero = values.filter((v) => v > 0);
    return nonZero.length > 0 ? (nonZero.reduce((a, b) => a + b, 0) / nonZero.length).toFixed(1) : '-';
  };

  const getCoAverage = (coId: string) => {
    const values = programOutcomes.map((po) => mapping[coId]?.[po.id] || 0);
    const nonZero = values.filter((v) => v > 0);
    return nonZero.length > 0 ? (nonZero.reduce((a, b) => a + b, 0) / nonZero.length).toFixed(1) : '-';
  };

  const getMappedCount = () => {
    let count = 0;
    courseOutcomes.forEach((co) => {
      programOutcomes.forEach((po) => {
        if ((mapping[co.id]?.[po.id] || 0) > 0) count++;
      });
    });
    return count;
  };

  const totalPossible = courseOutcomes.length * programOutcomes.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/25">
            <Network className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">CO-PO Mapping Matrix</h2>
            <p className="text-sm text-muted-foreground">
              Map Course Outcomes to Program Outcomes for{' '}
              <span className="font-semibold text-foreground">{courseCode}</span>
              {' '}· {courseOutcomes.length} COs × {programOutcomes.length} POs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 text-[10px]">
                <AlertTriangle className="h-3 w-3" />
                Unsaved
              </Badge>
            </motion.div>
          )}
          {saved && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1 text-[10px]">
                <CheckCircle2 className="h-3 w-3" />
                Saved
              </Badge>
            </motion.div>
          )}
        </div>
      </div>

      {/* Legend + Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground font-medium">Correlation levels:</span>
          <div className="flex gap-2">
            {[1, 2, 3].map((level) => (
              <div key={level} className="flex items-center gap-1">
                <div
                  className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold ${levelLabels[level].bg} ${levelLabels[level].color} border border-border/30`}
                >
                  {level}
                </div>
                <span className="text-muted-foreground">
                  {level === 1 ? 'Low' : level === 2 ? 'Medium' : 'High'}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div className="h-6 w-6 rounded-md flex items-center justify-center text-xs text-muted-foreground/40 border border-dashed border-border/30">
                -
              </div>
              <span className="text-muted-foreground">None</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-8 text-xs gap-1.5"
            disabled={!hasChanges}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoMap}
            disabled={isAutoMapping}
            className="h-8 text-xs gap-1.5 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600 border-purple-500/20"
          >
            {isAutoMapping ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isAutoMapping ? 'Mapping with AI...' : 'AI Auto-Map'}
          </Button>
        </div>
      </div>

      {/* Auto-map error */}
      {autoMapError && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/15 text-xs text-red-600">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Mapping Sequencer error: {autoMapError}. Make sure it is running on port 8001.
        </div>
      )}

      {/* Click instruction */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/15 text-xs text-blue-600">
        <Info className="h-3.5 w-3.5 shrink-0" />
        Click any cell to manually cycle: None → 1 (Low) → 2 (Medium) → 3 (High). Or click AI Auto-Map to generate automatically.
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-border/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="p-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground border-b border-r border-border/30 min-w-[120px]">
                CO / PO
              </th>
              {programOutcomes.map((po) => (
                <th
                  key={po.id}
                  className="p-3 text-center font-semibold text-xs border-b border-r border-border/30 min-w-[60px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-primary font-bold">{po.id}</span>
                    <span className="text-[9px] text-muted-foreground font-normal leading-tight max-w-[55px] truncate" title={po.text}>
                      {po.text}
                    </span>
                  </div>
                </th>
              ))}
              <th className="p-3 text-center font-semibold text-xs border-b border-border/30 text-muted-foreground min-w-[50px]">
                Avg
              </th>
            </tr>
          </thead>
          <tbody>
            {courseOutcomes.map((co, coIdx) => (
              <tr
                key={co.id}
                className={`hover:bg-muted/20 transition-colors ${coIdx % 2 === 0 ? '' : 'bg-muted/5'}`}
              >
                <td className="p-3 border-r border-border/30 border-b border-b-border/20">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary shrink-0">{co.id}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={co.text}>
                      {co.text}
                    </span>
                  </div>
                </td>
                {programOutcomes.map((po) => {
                  const val = mapping[co.id]?.[po.id] || 0;
                  const level = levelLabels[val];
                  const isHovered = hoveredCell?.co === co.id && hoveredCell?.po === po.id;
                  return (
                    <td
                      key={po.id}
                      className="p-2 text-center border-r border-border/30 border-b border-b-border/20"
                    >
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => cycleValue(co.id, po.id)}
                        onMouseEnter={() => setHoveredCell({ co: co.id, po: po.id })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold mx-auto cursor-pointer transition-all duration-200 border ${
                          val > 0
                            ? `${level.bg} ${level.color} border-current/10 shadow-sm`
                            : 'border-dashed border-border/40 text-muted-foreground/30 hover:border-primary/30 hover:text-primary/40'
                        } ${isHovered ? 'ring-2 ring-primary/30' : ''}`}
                      >
                        {level.label}
                      </motion.button>
                    </td>
                  );
                })}
                <td className="p-2 text-center border-b border-b-border/20">
                  <span className="text-xs font-semibold text-muted-foreground bg-muted/40 px-2 py-1 rounded-md">
                    {getCoAverage(co.id)}
                  </span>
                </td>
              </tr>
            ))}
            {/* Average row */}
            <tr className="bg-muted/30 border-t border-border/50">
              <td className="p-3 border-r border-border/30 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Average
              </td>
              {programOutcomes.map((po) => (
                <td key={po.id} className="p-2 text-center border-r border-border/30">
                  <span className="text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                    {getPoAverage(po.id)}
                  </span>
                </td>
              ))}
              <td className="p-2 text-center">
                <Badge variant="secondary" className="text-[10px]">
                  {getMappedCount()}/{totalPossible}
                </Badge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          Mapped: <strong className="text-foreground">{getMappedCount()}</strong> / {totalPossible} cells
        </span>
        <span>•</span>
        <span>
          Coverage:{' '}
          <strong className="text-foreground">
            {totalPossible > 0 ? Math.round((getMappedCount() / totalPossible) * 100) : 0}%
          </strong>
        </span>
        {state.currentProjectId && (
          <>
            <span>•</span>
            <span className="text-green-600">Project #{state.currentProjectId} active</span>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 min-w-[140px]">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Mapping
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
