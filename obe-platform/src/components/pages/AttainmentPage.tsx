'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Save,
  Download,
  Users,
  Target,
  Calculator,
  RefreshCw,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useStore } from '@/lib/store';
import { type MappingItem } from '@/lib/api';

const FALLBACK_COURSES = ['CS201', 'CS301', 'CS302', 'CS303', 'CS401', 'CS202'];

interface StudentMarks {
  id: string;
  name: string;
  [co_id: string]: number | string; // mark out of 100
}

export function AttainmentPage() {
  const { state, addToast } = useStore();

  const availableCourses = Object.keys(state.courseOutcomes).length > 0
    ? Object.keys(state.courseOutcomes)
    : FALLBACK_COURSES;

  const [selectedCourse, setSelectedCourse] = useState(availableCourses[0] || '');
  const [students, setStudents] = useState<StudentMarks[]>([]);
  const [targetMarks, setTargetMarks] = useState<number>(60); // 60% marks is the target

  const courseOutcomes: MappingItem[] = state.courseOutcomes[selectedCourse]
    ? state.courseOutcomes[selectedCourse].map(co => ({ id: co.co_id, text: co.text }))
    : [
        { id: 'CO1', text: 'Analyze algorithm complexity' },
        { id: 'CO2', text: 'Design efficient data structures' },
        { id: 'CO3', text: 'Evaluate memory management' },
        { id: 'CO4', text: 'Apply sorting and searching' },
        { id: 'CO5', text: 'Understand data representation' },
      ];

  const programOutcomes: MappingItem[] = state.programmePos.length > 0
    ? state.programmePos.map(po => ({ id: po.po_id, text: po.title }))
    : Array.from({ length: 12 }).map((_, i) => ({ id: `PO${i + 1}`, text: `PO${i + 1}` }));

  // Get matrix for selected course
  const matrix = state.mappingMatrix && Object.keys(state.mappingMatrix).length > 0
    ? state.mappingMatrix
    : null; // We will handle null gracefully

  // Generate Mock Data
  const generateMockData = () => {
    const mockStudents: StudentMarks[] = [];
    for (let i = 1; i <= 20; i++) {
      const student: StudentMarks = { id: `STU${i.toString().padStart(3, '0')}`, name: `Student ${i}` };
      courseOutcomes.forEach(co => {
        // Random marks between 40 and 100
        student[co.id] = Math.floor(Math.random() * 60) + 40;
      });
      mockStudents.push(student);
    }
    setStudents(mockStudents);
    addToast({ type: 'info', title: 'Mock Data Loaded', description: 'Generated 20 students with random marks.' });
  };

  // Initialize empty students if none
  useEffect(() => {
    if (students.length === 0) {
      setStudents([{ id: 'STU001', name: 'Student 1' }]);
    }
  }, [selectedCourse]);

  // Handle Mark Change
  const handleMarkChange = (index: number, coId: string, value: string) => {
    const newStudents = [...students];
    const num = parseInt(value, 10);
    newStudents[index][coId] = isNaN(num) ? '' : Math.min(100, Math.max(0, num));
    setStudents(newStudents);
  };

  const addStudentRow = () => {
    const newId = `STU${(students.length + 1).toString().padStart(3, '0')}`;
    setStudents([...students, { id: newId, name: `Student ${students.length + 1}` }]);
  };

  // Calculations
  const coAttainment = useMemo(() => {
    const attainment: Record<string, number> = {}; // Attainment Level (0-3)
    const percentages: Record<string, number> = {}; // % of students above target

    courseOutcomes.forEach(co => {
      let passedCount = 0;
      let totalValid = 0;
      students.forEach(s => {
        if (typeof s[co.id] === 'number') {
          totalValid++;
          if ((s[co.id] as number) >= targetMarks) {
            passedCount++;
          }
        }
      });

      const pct = totalValid > 0 ? (passedCount / totalValid) * 100 : 0;
      percentages[co.id] = pct;

      // NBA Attainment Levels
      if (pct >= 70) attainment[co.id] = 3;
      else if (pct >= 60) attainment[co.id] = 2;
      else if (pct >= 50) attainment[co.id] = 1;
      else attainment[co.id] = 0;
    });

    return { levels: attainment, percentages };
  }, [students, targetMarks, courseOutcomes]);

  const poAttainment = useMemo(() => {
    const poResults: Record<string, number> = {};
    
    if (!matrix) return poResults;

    programOutcomes.forEach(po => {
      let weightedSum = 0;
      let totalCorrelation = 0;

      courseOutcomes.forEach(co => {
        const correlation = matrix[co.id]?.[po.id] || 0;
        const coLevel = coAttainment.levels[co.id] || 0;
        
        weightedSum += (correlation * coLevel);
        totalCorrelation += correlation;
      });

      poResults[po.id] = totalCorrelation > 0 ? Number((weightedSum / totalCorrelation).toFixed(2)) : 0;
    });

    return poResults;
  }, [coAttainment.levels, matrix, programOutcomes, courseOutcomes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attainment Engine</h1>
          <p className="text-muted-foreground mt-1">
            Calculate CO & PO attainment from student marks and mapping matrices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 py-1.5 px-3">
            <Calculator className="w-4 h-4 mr-2" />
            NBA Compliant
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Marks Entry */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Student Marks Entry
                  </CardTitle>
                  <CardDescription>Enter marks out of 100 for each Course Outcome</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={generateMockData}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Mock Data
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Upload className="w-4 h-4 mr-2" /> CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4 p-4 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Target Marks (%)</label>
                  <div className="flex items-center gap-2 max-w-[200px]">
                    <Input 
                      type="number" 
                      value={targetMarks} 
                      onChange={(e) => setTargetMarks(Number(e.target.value) || 0)}
                      className="h-8"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="flex-1 text-sm text-muted-foreground border-l border-border/50 pl-4">
                  <p><strong>Level 3:</strong> ≥70% students pass</p>
                  <p><strong>Level 2:</strong> 60%-69% students pass</p>
                  <p><strong>Level 1:</strong> 50%-59% students pass</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-semibold w-[120px]">Student ID</th>
                      {courseOutcomes.map(co => (
                        <th key={co.id} className="px-4 py-3 font-semibold text-center w-[100px] border-l border-border/50" title={co.text}>
                          {co.id}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => (
                      <tr key={student.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2 font-medium text-foreground">{student.id}</td>
                        {courseOutcomes.map(co => (
                          <td key={co.id} className="px-2 py-2 border-l border-border/50">
                            <Input 
                              type="number"
                              className="h-8 text-center"
                              value={student[co.id] ?? ''}
                              onChange={(e) => handleMarkChange(idx, co.id, e.target.value)}
                              placeholder="-"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-between">
                <Button variant="ghost" size="sm" onClick={addStudentRow} className="text-muted-foreground">
                  + Add Student
                </Button>
                <div className="text-xs text-muted-foreground flex items-center">
                  Showing {students.length} students
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results & Calculations */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                CO Attainment Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {courseOutcomes.map(co => (
                  <div key={co.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div>
                      <div className="font-semibold">{co.id}</div>
                      <div className="text-[10px] text-muted-foreground">{coAttainment.percentages[co.id]?.toFixed(1)}% &gt; target</div>
                    </div>
                    <Badge className={
                      coAttainment.levels[co.id] === 3 ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30' :
                      coAttainment.levels[co.id] === 2 ? 'bg-blue-500/20 text-blue-700 hover:bg-blue-500/30' :
                      coAttainment.levels[co.id] === 1 ? 'bg-amber-500/20 text-amber-700 hover:bg-amber-500/30' :
                      'bg-red-500/20 text-red-700 hover:bg-red-500/30'
                    }>
                      Level {coAttainment.levels[co.id] || 0}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-gradient-to-br from-blue-500/5 to-purple-500/5">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                PO Attainment
              </CardTitle>
              <CardDescription>Weighted by CO-PO Matrix</CardDescription>
            </CardHeader>
            <CardContent>
              {!matrix ? (
                <div className="text-sm text-amber-600 bg-amber-500/10 p-3 rounded-md border border-amber-500/20">
                  No Mapping Matrix found. Please generate the matrix in the CO-PO Mapping page first.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {programOutcomes.slice(0, 12).map(po => (
                    <div key={po.id} className="p-2 text-center rounded-lg bg-card border border-border shadow-sm flex flex-col justify-center">
                      <div className="text-xs text-muted-foreground font-medium mb-1">{po.id}</div>
                      <div className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {poAttainment[po.id] > 0 ? poAttainment[po.id] : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
