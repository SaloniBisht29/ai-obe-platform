'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Target,
  Layers,
  Plus,
  Trash2,
  Save,
  X,
  GripVertical,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PermissionGuard } from '@/components/PermissionGuard';

interface CourseEditorProps {
  course: any;
  onClose: () => void;
}

const bloomsLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

const bloomsColors: Record<string, string> = {
  Remember: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  Understand: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Apply: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  Analyze: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  Evaluate: 'bg-red-500/10 text-red-600 border-red-500/20',
  Create: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

interface CO {
  id: string;
  text: string;
  bloom: string;
}

interface Unit {
  id: string;
  title: string;
  topics: string[];
  hours: number;
}

export function CourseEditor({ course, onClose }: CourseEditorProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [basicInfo, setBasicInfo] = useState({
    name: course.name || '',
    code: course.code || '',
    credits: course.credits || 4,
    semester: course.semester || 1,
    department: course.department || 'CSE',
    description:
      'This course provides a comprehensive introduction to ' +
      (course.name || 'the subject') +
      ', covering fundamental concepts, practical applications, and industry-relevant case studies.',
  });

  const [cos, setCos] = useState<CO[]>([
    { id: 'CO1', text: 'Understand the fundamental concepts and principles of ' + (course.name || 'the subject'), bloom: 'Understand' },
    { id: 'CO2', text: 'Apply theoretical knowledge to solve real-world problems', bloom: 'Apply' },
    { id: 'CO3', text: 'Analyze complex scenarios and identify optimal solutions', bloom: 'Analyze' },
    { id: 'CO4', text: 'Evaluate different methodologies and justify appropriate choices', bloom: 'Evaluate' },
    { id: 'CO5', text: 'Design and implement comprehensive solutions', bloom: 'Create' },
  ]);

  const [units, setUnits] = useState<Unit[]>([
    { id: 'u1', title: 'Introduction & Fundamentals', topics: ['Overview', 'Basic Concepts', 'History & Evolution'], hours: 8 },
    { id: 'u2', title: 'Core Principles', topics: ['Theory', 'Models & Frameworks', 'Algorithms'], hours: 10 },
    { id: 'u3', title: 'Advanced Concepts', topics: ['Advanced Topics', 'Optimization', 'Case Studies'], hours: 12 },
    { id: 'u4', title: 'Applications & Projects', topics: ['Real-world Applications', 'Mini Projects', 'Industry Practices'], hours: 10 },
  ]);

  const markChanged = () => {
    setHasChanges(true);
    setSaved(false);
  };

  // CO operations
  const addCO = () => {
    setCos([...cos, { id: `CO${cos.length + 1}`, text: '', bloom: 'Remember' }]);
    markChanged();
  };

  const removeCO = (index: number) => {
    setCos(cos.filter((_, i) => i !== index).map((co, i) => ({ ...co, id: `CO${i + 1}` })));
    markChanged();
  };

  const updateCO = (index: number, field: keyof CO, value: string) => {
    const newCos = [...cos];
    newCos[index] = { ...newCos[index], [field]: value };
    setCos(newCos);
    markChanged();
  };

  // Unit operations
  const addUnit = () => {
    setUnits([...units, { id: `u${units.length + 1}`, title: '', topics: [''], hours: 0 }]);
    markChanged();
  };

  const removeUnit = (index: number) => {
    setUnits(units.filter((_, i) => i !== index));
    markChanged();
  };

  const updateUnit = (index: number, field: keyof Unit, value: any) => {
    const newUnits = [...units];
    newUnits[index] = { ...newUnits[index], [field]: value };
    setUnits(newUnits);
    markChanged();
  };

  const addTopic = (unitIndex: number) => {
    const newUnits = [...units];
    newUnits[unitIndex].topics.push('');
    setUnits(newUnits);
    markChanged();
  };

  const removeTopic = (unitIndex: number, topicIndex: number) => {
    const newUnits = [...units];
    newUnits[unitIndex].topics = newUnits[unitIndex].topics.filter((_, i) => i !== topicIndex);
    setUnits(newUnits);
    markChanged();
  };

  const updateTopic = (unitIndex: number, topicIndex: number, value: string) => {
    const newUnits = [...units];
    newUnits[unitIndex].topics[topicIndex] = value;
    setUnits(newUnits);
    markChanged();
  };

  // Save handler
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setHasChanges(false);
      setTimeout(() => setSaved(false), 3000);
    }, 1200);
  };

  const totalHours = units.reduce((sum, u) => sum + u.hours, 0);

  return (
    <div className="flex flex-col h-[75vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Edit Course: {course.code}</h2>
            <p className="text-sm text-muted-foreground">Modify details, outcomes, and syllabus structure.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                <AlertTriangle className="h-3 w-3" />
                Unsaved changes
              </Badge>
            </motion.div>
          )}
          {saved && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Saved successfully
              </Badge>
            </motion.div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-5 gap-1">
          <TabsTrigger
            value="basic"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2.5 text-sm gap-2"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Basic Details
          </TabsTrigger>
          <TabsTrigger
            value="cos"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2.5 text-sm gap-2"
          >
            <Target className="h-3.5 w-3.5" />
            Course Outcomes
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] ml-1">{cos.length}</Badge>
          </TabsTrigger>
          <TabsTrigger
            value="units"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2.5 text-sm gap-2"
          >
            <Layers className="h-3.5 w-3.5" />
            Units & Topics
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] ml-1">{units.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <div className="overflow-y-auto flex-1 pr-1">
          {/* Basic Details Tab */}
          <TabsContent value="basic" className="space-y-5 m-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  Course Code <span className="text-red-500">*</span>
                </label>
                <Input
                  value={basicInfo.code}
                  onChange={(e) => { setBasicInfo({ ...basicInfo, code: e.target.value }); markChanged(); }}
                  placeholder="e.g. CS201"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  Credits <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={basicInfo.credits}
                  onChange={(e) => { setBasicInfo({ ...basicInfo, credits: parseInt(e.target.value) || 0 }); markChanged(); }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                Course Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={basicInfo.name}
                onChange={(e) => { setBasicInfo({ ...basicInfo, name: e.target.value }); markChanged(); }}
                placeholder="e.g. Data Structures & Algorithms"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Semester</label>
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={basicInfo.semester}
                  onChange={(e) => { setBasicInfo({ ...basicInfo, semester: parseInt(e.target.value) || 1 }); markChanged(); }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Input
                  value={basicInfo.department}
                  onChange={(e) => { setBasicInfo({ ...basicInfo, department: e.target.value }); markChanged(); }}
                  placeholder="e.g. CSE"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Course Description</label>
              <Textarea
                rows={5}
                value={basicInfo.description}
                onChange={(e) => { setBasicInfo({ ...basicInfo, description: e.target.value }); markChanged(); }}
                placeholder="Provide a brief overview of the course..."
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">{basicInfo.description.length}/500 characters</p>
            </div>
          </TabsContent>

          {/* Course Outcomes Tab */}
          <TabsContent value="cos" className="space-y-4 m-0">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Define measurable learning outcomes aligned with Bloom's Taxonomy.</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cos.length} outcomes defined • Distribution: {
                    bloomsLevels.map(l => {
                      const count = cos.filter(c => c.bloom === l).length;
                      return count > 0 ? `${l} (${count})` : null;
                    }).filter(Boolean).join(', ') || 'None yet'
                  }
                </p>
              </div>
              <PermissionGuard requiredRole={['FACULTY', 'ADMIN']} fallback={null}>
                <Button size="sm" variant="outline" onClick={addCO} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add CO
                </Button>
              </PermissionGuard>
            </div>

            <AnimatePresence mode="popLayout">
              {cos.map((co, index) => (
                <motion.div
                  key={co.id + index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="group relative flex gap-3 items-start p-4 rounded-xl border border-border/60 bg-card hover:border-primary/20 hover:shadow-sm transition-all"
                >
                  {/* Drag handle area */}
                  <div className="flex flex-col items-center gap-2 pt-1 shrink-0">
                    <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 cursor-grab" />
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{co.id}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <Input
                      value={co.text}
                      onChange={(e) => updateCO(index, 'text', e.target.value)}
                      placeholder="Describe what the student will be able to do..."
                      className="text-sm"
                    />
                    {/* Bloom's level selector */}
                    <div className="flex flex-wrap gap-1.5">
                      {bloomsLevels.map((level) => (
                        <button
                          key={level}
                          onClick={() => updateCO(index, 'bloom', level)}
                          className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all ${
                            co.bloom === level
                              ? bloomsColors[level] + ' ring-1 ring-offset-1 ring-current/20'
                              : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground bg-transparent'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delete button */}
                  <PermissionGuard
                    requiredRole={['FACULTY', 'ADMIN']}
                    fallback={
                      <Button disabled variant="ghost" size="icon" className="shrink-0 opacity-30 h-8 w-8">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    }
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCO(index)}
                      className="text-red-500/60 hover:text-red-500 hover:bg-red-500/10 shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </PermissionGuard>
                </motion.div>
              ))}
            </AnimatePresence>

            {cos.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No Course Outcomes defined</p>
                <p className="text-xs mt-1">Click &ldquo;Add CO&rdquo; to create your first outcome.</p>
              </div>
            )}
          </TabsContent>

          {/* Units & Topics Tab */}
          <TabsContent value="units" className="space-y-4 m-0">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Define the syllabus structure with units and topics.</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {units.length} units • Total: {totalHours} teaching hours
                </p>
              </div>
              <PermissionGuard requiredRole={['FACULTY', 'ADMIN']} fallback={null}>
                <Button size="sm" variant="outline" onClick={addUnit} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Unit
                </Button>
              </PermissionGuard>
            </div>

            <AnimatePresence mode="popLayout">
              {units.map((unit, uIndex) => (
                <motion.div
                  key={unit.id + uIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="group rounded-xl border border-border/60 bg-card overflow-hidden hover:border-primary/20 hover:shadow-sm transition-all"
                >
                  {/* Unit header */}
                  <div className="flex items-center gap-3 p-4 bg-muted/30">
                    <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 cursor-grab shrink-0" />
                    <Badge variant="secondary" className="text-xs font-bold shrink-0 bg-primary/10 text-primary border-0">
                      Unit {uIndex + 1}
                    </Badge>
                    <Input
                      value={unit.title}
                      onChange={(e) => updateUnit(uIndex, 'title', e.target.value)}
                      placeholder="Unit title..."
                      className="border-0 bg-transparent p-0 h-auto font-medium text-sm focus-visible:ring-0 shadow-none"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="number"
                        min={0}
                        value={unit.hours}
                        onChange={(e) => updateUnit(uIndex, 'hours', parseInt(e.target.value) || 0)}
                        className="w-16 h-7 text-xs text-center"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">hrs</span>
                      <PermissionGuard
                        requiredRole={['FACULTY', 'ADMIN']}
                        fallback={null}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeUnit(uIndex)}
                          className="text-red-500/60 hover:text-red-500 hover:bg-red-500/10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </PermissionGuard>
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="p-4 pt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Topics</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addTopic(uIndex)}
                        className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground px-2"
                      >
                        <Plus className="h-3 w-3" /> Add Topic
                      </Button>
                    </div>
                    {unit.topics.map((topic, tIndex) => (
                      <div key={tIndex} className="flex items-center gap-2 pl-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                        <Input
                          value={topic}
                          onChange={(e) => updateTopic(uIndex, tIndex, e.target.value)}
                          placeholder="Topic name..."
                          className="h-8 text-sm border-0 bg-muted/20 rounded-lg focus-visible:bg-muted/40"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTopic(uIndex, tIndex)}
                          className="h-6 w-6 text-muted-foreground hover:text-red-500 shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {units.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No Units defined</p>
                <p className="text-xs mt-1">Click &ldquo;Add Unit&rdquo; to structure your syllabus.</p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          {cos.length} COs • {units.length} Units • {totalHours} Hours
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 min-w-[140px]">
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
