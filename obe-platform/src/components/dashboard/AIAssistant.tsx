'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Bot, User, Loader2, Copy, Check,
  Zap, FileDown, BookOpen, Target, Grid3X3, ChevronDown,
  ChevronRight, RotateCcw, ExternalLink, PlayCircle, Library,
  Award, Clock, Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  SyllabusResponse, SyllabusRequest, COObject, UnitObject,
  generateSyllabus, generateSyllabusStreaming, autoMapCOPO, exportDocx, askAI,
  MappingMatrixResponse, MappingItem, SyllabusProgressEvent,
} from '@/lib/api';

import { useStore } from '@/lib/store';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   TYPES
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: string;
  kind?: 'text' | 'form' | 'syllabus-result';
  syllabusData?: SyllabusResponse;
  syllabusReq?: SyllabusRequest;
}

const quickPrompts = [
  'âœ¨ Create New Syllabus',
  'Generate COs for Data Mining',
  'Generate COs for Computer Networks',
  "Explain CO-PO mapping",
];

const welcomeMsg: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I'm your AI curriculum assistant powered by the 4-call NBA engine. I can **generate complete syllabi** with COs, unit content, CO-PO matrices, textbooks and CQI plans â€” all in one go. Click **âœ¨ Create New Syllabus** to start, or ask me anything!",
  timestamp: new Date(),
  source: 'system',
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN COMPONENT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMsg]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [liveStep, setLiveStep] = useState<SyllabusProgressEvent | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { addToast, storeCourseOutcomes, setMappingResult } = useStore();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);

  const push = (m: Omit<ChatMessage, 'id' | 'timestamp'>) =>
    setMessages(p => [...p, { ...m, id: `m-${Date.now()}-${Math.random()}`, timestamp: new Date() }]);

  /* â”€â”€ sendChat â”€â”€ */
  const sendChat = useCallback(async (text: string) => {
    if (!text.trim() || busy) return;

    if (text === 'âœ¨ Create New Syllabus') {
      push({ role: 'user', content: text });
      push({ role: 'assistant', content: "Let's build a complete syllabus! Fill in the course details below:", kind: 'form' });
      setInput('');
      return;
    }

    push({ role: 'user', content: text });
    setInput('');
    setBusy(true);
    try {
      const result = await askAI(text);
      if (result.type === 'outcomes') {
        const coText = result.data.outcomes
          .map((o, i) => `**CO${i + 1} (${o.bloom_level}):** ${o.text}\n   *Assessment: ${o.assessment_suggestion}*`)
          .join('\n\n');
        push({
          role: 'assistant',
          content: `**AI-Generated Course Outcomes for "${result.data.course_name}":**\n\n${coText}`,
          source: 'ollama',
        });
        addToast({ type: 'success', title: 'COs Generated', description: `${result.data.outcomes.length} outcomes via AI engine` });
      } else {
        push({ role: 'assistant', content: result.data, source: 'mock' });
      }
    } catch {
      push({ role: 'assistant', content: 'Sorry, something went wrong. Please try again.', source: 'error' });
    } finally { setBusy(false); }
  }, [busy, addToast]);

  /* ── startSyllabusGeneration: streaming with automatic fallback ── */
  const startSyllabusGeneration = useCallback(async (req: SyllabusRequest) => {
    push({ role: 'user', content: `Generate syllabus for: **${req.course_name}**` });
    setBusy(true);
    setLiveStep(null);
    let finalSyllabus: SyllabusResponse | null = null;

    try {
      // PATH A: Try SSE streaming (real-time step progress)
      let streamOk = false;
      try {
        for await (const event of generateSyllabusStreaming(req)) {
          if (event.done) {
            finalSyllabus = event.syllabus;
            streamOk = true;
          } else {
            setLiveStep(event as SyllabusProgressEvent);
          }
        }
      } catch (streamErr: unknown) {
        const msg = String(streamErr);
        const is404 = msg.includes('404') || msg.includes('Not Found');
        console.warn(
          is404
            ? '[AIAssistant] SSE endpoint not ready (404) — falling back to blocking call'
            : '[AIAssistant] SSE error — falling back:',
          streamErr
        );
        finalSyllabus = null;
        streamOk = false;
      }

      // PATH B: Fallback blocking call if streaming failed or returned nothing
      if (!finalSyllabus || !streamOk) {
        setLiveStep({ step: 1, total: 2, label: 'Generating syllabus (4-call engine)…', detail: 'This takes 2–5 minutes. Please wait…', done: false });
        finalSyllabus = await generateSyllabus(req);
      }

      const data = finalSyllabus;

      // Step: CO-PO Semantic Mapping via Mapping Sequencer
      setLiveStep({ step: 2, total: 2, label: 'CO-PO Semantic Mapping', detail: 'Calling Mapping Sequencer…', done: false });
      let mapping: MappingMatrixResponse | null = null;
      try {
        if (data.course_outcomes.length > 0) {
          const cos: MappingItem[] = data.course_outcomes.map(co => ({ id: co.co_id, text: co.text }));
          const pos: MappingItem[] = [
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
          const psoIds = new Set<string>();
          data.course_outcomes.forEach(co => co.mapped_psos?.forEach(p => psoIds.add(p)));
          const psos: MappingItem[] = Array.from(psoIds).map(id => ({ id, text: id }));
          mapping = await autoMapCOPO({ cos, pos, psos, top_k: 3, subject: req.course_name });
        }
      } catch (mapErr) {
        console.warn('[AIAssistant] Mapping Sequencer offline — using LLM CO-PO matrix:', mapErr);
      }

      // Store in global state for Analytics + CO-PO Mapping pages
      if (data.course_outcomes.length > 0) storeCourseOutcomes(req.course_name, data.course_outcomes);
      if (mapping) setMappingResult(mapping);
      setLiveStep(null);

      // Show result card
      setMessages(prev => {
        const clean = prev.filter(m => m.kind !== 'form');
        return [...clean, {
          id: `syl-${Date.now()}`,
          role: 'assistant' as const,
          content: '',
          timestamp: new Date(),
          kind: 'syllabus-result' as const,
          syllabusData: mapping ? { ...data, co_po_matrix: mapping.matrix } : data,
          syllabusReq: req,
          source: 'ollama',
        }];
      });

      const mappingNote = mapping ? ' • CO-PO via semantic similarity' : ' • CO-PO from LLM';
      addToast({
        type: 'success',
        title: 'Syllabus Generated!',
        description: `${data.units.length} units • ${data.course_outcomes.length} COs • ${data.textbooks.length} textbooks${mappingNote}`,
      });

    } catch (e: unknown) {
      setLiveStep(null);
      const rawMsg = String(e);
      // Give a useful error — show actual backend error, not a generic hint
      const is404 = rawMsg.includes('404');
      const isOllama = rawMsg.toLowerCase().includes('ollama') || rawMsg.includes('11434');
      let humanMsg: string;
      if (is404) {
        humanMsg = `❌ Backend route not found (404).\n\nThe FastAPI server may still be starting up or needs a restart.\n\nRun in your terminal:\n\`uvicorn app.main:app --reload\`\n\nThen try again.`;
      } else if (isOllama) {
        humanMsg = `❌ Ollama is not running or the model is missing.\n\nRun: \`ollama run curriculum-ai\`\nThen try again.`;
      } else {
        humanMsg = `❌ Generation failed.\n\nError: ${rawMsg}\n\nCheck the uvicorn terminal for the full traceback.`;
      }
      push({ role: 'assistant', content: humanMsg, source: 'error' });
      addToast({ type: 'error', title: 'Generation Failed', description: rawMsg.slice(0, 120) });
    } finally {
      setBusy(false);
    }
  }, [addToast, storeCourseOutcomes, setMappingResult]);


  /* â”€â”€ handleExport â”€â”€ */
  const handleExport = useCallback(async (req: SyllabusRequest) => {
    setBusy(true);
    try {
      await exportDocx(req);
      addToast({ type: 'success', title: 'Downloaded!', description: `${req.course_name}_syllabus.docx` });
    } catch {
      addToast({ type: 'error', title: 'Export Failed', description: 'Could not download .docx' });
    } finally { setBusy(false); }
  }, [addToast]);

  /* â”€â”€ handleRegenerate â”€â”€ */
  const handleRegenerate = useCallback(async (req: SyllabusRequest, reason?: string) => {
    const regenReq: SyllabusRequest = { ...req, regenerate: true, rejection_reason: reason };
    setMessages(prev => prev.filter(m => m.kind !== 'syllabus-result'));
    await startSyllabusGeneration(regenReq);
  }, [startSyllabusGeneration]);

  const renderMd = (s: string) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Curriculum Assistant âœ¨</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">NBA 4-call engine â€” syllabi, COs, CO-PO matrices</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] gap-1 border-green-500/30 text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Online
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick prompts */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
            {quickPrompts.map(p => (
              <button key={p} onClick={() => sendChat(p)} disabled={busy}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border border-border/50 bg-muted/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >{p}</button>
            ))}
          </div>

          {/* Messages */}
          <div className="h-[520px] overflow-y-auto space-y-4 pr-1">
            <AnimatePresence>
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                  className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>

                  {msg.role === 'assistant' && (
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}

                  <div className="max-w-[95%] space-y-1">
                    {msg.kind === 'form' ? (
                      <SyllabusForm onSubmit={startSyllabusGeneration} disabled={busy} />
                    ) : msg.kind === 'syllabus-result' && msg.syllabusData && msg.syllabusReq ? (
                      <SyllabusViewer
                        data={msg.syllabusData}
                        req={msg.syllabusReq}
                        busy={busy}
                        onExport={handleExport}
                        onRegenerate={handleRegenerate}
                      />
                    ) : (
                      <div className={cn('rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md border border-border/30')}>
                        {renderMd(msg.content)}
                      </div>
                    )}

                    {msg.role === 'assistant' && !msg.kind && msg.id !== 'welcome' && (
                      <div className="flex items-center gap-1 pl-1">
                        <button onClick={() => { navigator.clipboard.writeText(msg.content); setCopiedId(msg.id); setTimeout(() => setCopiedId(null), 2000); }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Copy">
                          {copiedId === msg.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                        {msg.source && <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 ml-1 border-purple-500/20 text-purple-500"><Zap className="h-2 w-2 mr-0.5" />{msg.source}</Badge>}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {busy && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-start">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 min-w-[260px]">
                  {liveStep ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500 shrink-0" />
                        <span className="text-xs font-semibold">Step {liveStep.step}/{liveStep.total}: {liveStep.label}</span>
                      </div>
                      {liveStep.detail && <p className="text-[10px] text-muted-foreground pl-5">{liveStep.detail}</p>}
                      {/* Progress bar */}
                      <div className="h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(liveStep.step / liveStep.total) * 100}%` }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground">This takes 2â€“5 minutes total</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {[0, 0.15, 0.3].map(d => (
                        <motion.div key={d} animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: d }}
                          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                      ))}
                      <span className="text-xs text-muted-foreground ml-2">Connecting to AI engineâ€¦</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="flex items-end gap-2 pt-2 border-t border-border/50">
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(input); } }}
              placeholder="Ask about COs, POs, Bloom's taxonomy, curriculumâ€¦" rows={1}
              className="flex-1 resize-none rounded-xl border border-border/50 bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-muted-foreground/50"
              style={{ minHeight: 40, maxHeight: 120 }} />
            <Button size="icon" className="h-10 w-10 shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md"
              onClick={() => sendChat(input)} disabled={!input.trim() || busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SYLLABUS FORM â€” collects course details and calls the 4-call engine
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function SyllabusForm({ onSubmit, disabled }: { onSubmit: (req: SyllabusRequest) => void; disabled: boolean }) {
  const [courseName, setCourseName]       = useState('');
  const [description, setDescription]     = useState('');
  const [programme, setProgramme]         = useState('btech');
  const [numUnits, setNumUnits]           = useState(5);
  const [year, setYear]                   = useState(2);
  const [semester, setSemester]           = useState(3);
  const [branch, setBranch]               = useState('');
  const [credits, setCredits]             = useState(4);
  const [ltp, setLtp]                     = useState('3:1:0');
  const [university, setUniversity]       = useState('G.B. Pant Institute of Engineering & Technology');

  const programmes = [
    { v: 'btech', l: 'B.Tech' }, { v: 'bsc', l: 'B.Sc' }, { v: 'mtech', l: 'M.Tech' },
    { v: 'mca', l: 'MCA' }, { v: 'bca', l: 'BCA' }, { v: 'mba', l: 'MBA' }, { v: 'msc', l: 'M.Sc' },
  ];

  const canSubmit = courseName.trim().length >= 3 && description.trim().length >= 10 && !disabled;

  return (
    <div className="bg-muted rounded-2xl rounded-bl-md p-5 border border-border/30 space-y-4 shadow-sm w-full max-w-xl">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <p className="text-sm font-bold">New Syllabus â€” NBA 4-Call Engine</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Course Name */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Course Name *</label>
          <input value={courseName} onChange={e => setCourseName(e.target.value)}
            placeholder="e.g. Machine Learning, Data Structures, Computer Networks"
            className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20 outline-none" />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Course Description * (min 10 chars)</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            placeholder="Brief description of the course content and scope..."
            className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20 outline-none resize-none" />
        </div>

        {/* Programme + Units */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Programme</label>
            <select value={programme} onChange={e => setProgramme(e.target.value)}
              className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20 outline-none">
              {programmes.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">No. of Units</label>
            <select value={numUnits} onChange={e => setNumUnits(Number(e.target.value))}
              className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20 outline-none">
              {[3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Units</option>)}
            </select>
          </div>
        </div>

        {/* Year + Semester */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Year</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20 outline-none">
              {[1, 2, 3, 4].map(n => <option key={n} value={n}>Year {n}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Semester</label>
            <select value={semester} onChange={e => setSemester(Number(e.target.value))}
              className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20 outline-none">
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Sem {n}</option>)}
            </select>
          </div>
        </div>

        {/* Branch + Credits + LTP */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Credits</label>
            <select value={credits} onChange={e => setCredits(Number(e.target.value))}
              className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20 outline-none">
              {[2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="col-span-1 space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">L:T:P</label>
            <input value={ltp} onChange={e => setLtp(e.target.value)}
              className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20 outline-none" />
          </div>
          <div className="col-span-1 space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Branch</label>
            <input value={branch} onChange={e => setBranch(e.target.value)} placeholder="e.g. CSE"
              className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20 outline-none" />
          </div>
        </div>

        {/* University */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">University Name</label>
          <input value={university} onChange={e => setUniversity(e.target.value)}
            className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:ring-2 ring-primary/20 outline-none" />
        </div>
      </div>

      <Button className="w-full h-10 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md"
        disabled={!canSubmit}
        onClick={() => onSubmit({
          course_name: courseName.trim(),
          course_description: description.trim(),
          programme,
          num_units: numUnits,
          year_of_study: year,
          semester,
          branch: branch || undefined,
          credits,
          ltp,
          university_name: university,
          education_level: 'undergraduate',
        })}>
        <Sparkles className="h-4 w-4" />
        Generate Full Syllabus (4-Call Engine)
      </Button>
      <p className="text-[10px] text-muted-foreground text-center">â± Takes 2â€“4 minutes â€¢ Generates COs, units, CO-PO matrix, textbooks</p>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SYLLABUS VIEWER â€” renders + allows editing of the SyllabusResponse
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

import { Edit3, Save, X as XIcon, Plus, Trash2 } from 'lucide-react';

function EditableList({
  items, onChange, placeholder = 'Add itemâ€¦', rows = 1,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex gap-1 items-start">
          <textarea
            value={item}
            rows={rows}
            onChange={e => { const next = [...items]; next[i] = e.target.value; onChange(next); }}
            className="flex-1 text-xs bg-background border border-border/50 rounded-md px-2 py-1 resize-none focus:ring-1 ring-primary/30 outline-none"
          />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="p-1 mt-0.5 text-red-400 hover:text-red-600 shrink-0">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ''])}
        className="text-[10px] text-primary flex items-center gap-1 hover:underline mt-1">
        <Plus className="h-2.5 w-2.5" /> {placeholder}
      </button>
    </div>
  );
}

function SyllabusViewer({
  data, req, busy, onExport, onRegenerate,
}: {
  data: SyllabusResponse;
  req: SyllabusRequest;
  busy: boolean;
  onExport: (req: SyllabusRequest) => void;
  onRegenerate: (req: SyllabusRequest, reason?: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'units' | 'matrix' | 'resources'>('overview');
  const [expandedUnit, setExpandedUnit] = useState<number | null>(0);
  const [editMode, setEditMode] = useState(false);

  // Editable copies of the syllabus sections
  const [editObjectives, setEditObjectives] = useState<string[]>(data.course_objectives);
  const [editCOs, setEditCOs] = useState<COObject[]>(data.course_outcomes);
  const [editUnits, setEditUnits] = useState<UnitObject[]>(data.units);
  const [editTextbooks, setEditTextbooks] = useState<string[]>(data.textbooks);
  const [editYoutube, setEditYoutube] = useState<string[]>(data.youtube_resources);
  const [editOSR, setEditOSR] = useState<string[]>(data.open_source_resources);
  const [editCQI, setEditCQI] = useState(data.cqi_plan || '');
  const [saveToast, setSaveToast] = useState(false);

  const handleSaveEdits = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const editedData: SyllabusResponse = {
    ...data,
    course_objectives: editObjectives,
    course_outcomes: editCOs,
    units: editUnits,
    textbooks: editTextbooks,
    youtube_resources: editYoutube,
    open_source_resources: editOSR,
    cqi_plan: editCQI,
  };

  const tabs = [
    { id: 'overview',   label: 'Overview',   icon: Target },
    { id: 'units',      label: `Units (${editUnits.length})`, icon: Layers },
    { id: 'matrix',     label: 'CO-PO Matrix', icon: Grid3X3 },
    { id: 'resources',  label: 'Resources',  icon: Library },
  ] as const;

  const bloomColors: Record<string, string> = {
    remember:   'bg-sky-500/15 text-sky-600 border-sky-500/30',
    understand: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    apply:      'bg-violet-500/15 text-violet-600 border-violet-500/30',
    analyze:    'bg-orange-500/15 text-orange-600 border-orange-500/30',
    evaluate:   'bg-red-500/15 text-red-600 border-red-500/30',
    create:     'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  };

  const getBloomColor = (level: string) => bloomColors[level?.toLowerCase()] || 'bg-muted text-muted-foreground';

  const allPOs = ['PO1','PO2','PO3','PO4','PO5','PO6','PO7','PO8','PO9','PO10','PO11','PO12'];
  const coPoMatrix = data.co_po_matrix || {};
  const coIds = Object.keys(coPoMatrix);

  const cellColor = (val: number) => {
    if (val === 3) return 'bg-green-500 text-white font-bold';
    if (val === 2) return 'bg-yellow-400 text-black font-semibold';
    if (val === 1) return 'bg-blue-400 text-white';
    return 'bg-muted/30 text-muted-foreground/50';
  };

  return (
    <div className="w-full space-y-3 max-w-2xl">
      {/* Header card */}
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl rounded-bl-md p-4 border border-purple-500/20">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold">{data.course_name}</h3>
              {data.course_code && <Badge variant="outline" className="text-[10px] font-mono border-purple-500/30 text-purple-600">{data.course_code}</Badge>}
              <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-600 gap-1"><Zap className="h-2 w-2" />NBA 4-Call Engine</Badge>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 text-[10px] text-muted-foreground">
              {data.programme && <span className="bg-muted px-2 py-0.5 rounded-full">{data.programme.toUpperCase()}</span>}
              {data.semester && <span className="bg-muted px-2 py-0.5 rounded-full">Sem {data.semester}</span>}
              {data.credits && <span className="bg-muted px-2 py-0.5 rounded-full">{data.credits} Credits</span>}
              {data.ltp && <span className="bg-muted px-2 py-0.5 rounded-full">L:T:P {data.ltp}</span>}
              {data.total_hours && <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full"><Clock className="h-2.5 w-2.5" />{data.total_hours}h</span>}
            </div>
            {data.standards && <p className="text-[9px] text-muted-foreground mt-1 italic">{data.standards}</p>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Edit toggle */}
            <Button size="sm" variant={editMode ? 'default' : 'outline'}
              className={cn('h-8 text-xs gap-1.5', editMode && 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500')}
              onClick={() => { if (editMode) handleSaveEdits(); setEditMode(e => !e); }}>
              {editMode ? <><Save className="h-3 w-3" /> Save Edits</> : <><Edit3 className="h-3 w-3" /> Edit</>}
            </Button>
            {editMode && (
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 text-red-500"
                onClick={() => setEditMode(false)}>
                <XIcon className="h-3 w-3" /> Cancel
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" disabled={busy}
              onClick={() => onRegenerate(req, 'User requested regeneration')}>
              <RotateCcw className="h-3 w-3" /> Regenerate
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white" disabled={busy}
              onClick={() => onExport(req)}>
              <FileDown className="h-3 w-3" /> Export .docx
            </Button>
          </div>
        </div>
        {saveToast && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-2 text-[10px] text-green-600 flex items-center gap-1">
            <Check className="h-3 w-3" /> Edits saved to session
          </motion.div>
        )}
        {editMode && (
          <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
            <Edit3 className="h-2.5 w-2.5" /> Edit mode active â€” modify any field below, then click Save Edits
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 p-1 rounded-xl border border-border/30">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn('flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all',
              activeTab === tab.id
                ? 'bg-background border border-border/50 shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground')}>
            <tab.icon className="h-3 w-3" />{tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-muted/20 rounded-xl border border-border/30 overflow-hidden">

        {/* â”€â”€ OVERVIEW â”€â”€ */}
        {activeTab === 'overview' && (
          <div className="p-4 space-y-4">
            {/* Course Objectives */}
            <section>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Course Objectives
              </h4>
              {editMode ? (
                <EditableList items={editObjectives} onChange={setEditObjectives} placeholder="Add objectiveâ€¦" />
              ) : (
                <ol className="space-y-1">
                  {editObjectives.map((obj, i) => (
                    <li key={i} className="text-xs flex gap-2">
                      <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* Course Outcomes */}
            {editCOs.length > 0 && (
              <section>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" /> Course Outcomes (COs)
                </h4>
                <div className="space-y-2">
                  {editCOs.map((co: COObject, coIdx: number) => (
                    <div key={co.co_id} className="bg-background rounded-lg p-3 border border-border/30">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-purple-600 shrink-0">{co.co_id}</span>
                        <Badge variant="outline" className={cn('text-[9px] h-4 px-1.5 shrink-0', getBloomColor(co.bloom_level))}>
                          {co.bloom_level} ({co.bloom_level_number})
                        </Badge>
                        {editMode ? (
                          <textarea
                            value={co.text}
                            rows={2}
                            onChange={e => {
                              const next = [...editCOs];
                              next[coIdx] = { ...next[coIdx], text: e.target.value };
                              setEditCOs(next);
                            }}
                            className="flex-1 min-w-0 text-xs bg-muted/50 border border-border/50 rounded px-2 py-1 resize-none focus:ring-1 ring-primary/30 outline-none"
                          />
                        ) : (
                          <p className="text-xs flex-1 min-w-0">{co.text}</p>
                        )}
                        {editMode && (
                          <button onClick={() => setEditCOs(editCOs.filter((_, j) => j !== coIdx))}
                            className="text-red-400 hover:text-red-600 shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {co.mapped_pos.map(po => (
                          <Badge key={po} variant="secondary" className="text-[9px] h-4 px-1.5">
                            {po}({co.po_correlation[po] || 0})
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-1 text-[9px] text-muted-foreground">
                        Assessment: {co.direct_assessment.join(' â€¢ ')}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* â”€â”€ UNITS â”€â”€ */}
        {activeTab === 'units' && (
          <div className="divide-y divide-border/30">
            {editUnits.map((unit: UnitObject, idx: number) => (
              <div key={unit.unit_id}>
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                  onClick={() => setExpandedUnit(expandedUnit === idx ? null : idx)}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{unit.unit_title}</p>
                      <p className="text-[10px] text-muted-foreground">{unit.unit_id} â€¢ {unit.hours ?? 8}h â€¢ {unit.topics.length} topics</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {unit.satisfied_cos.map(co => (
                      <Badge key={co} variant="outline" className="text-[9px] h-4 px-1.5 border-purple-500/30 text-purple-600">{co}</Badge>
                    ))}
                    {expandedUnit === idx
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedUnit === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3 bg-background/50">

                        {/* Topics paragraph */}
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Topics</p>
                          {editMode ? (
                            <textarea
                              value={unit.topics_paragraph}
                              rows={3}
                              onChange={e => {
                                const next = [...editUnits];
                                next[idx] = { ...next[idx], topics_paragraph: e.target.value };
                                setEditUnits(next);
                              }}
                              className="w-full text-xs bg-background border border-border/50 rounded-md px-2 py-1 resize-none focus:ring-1 ring-primary/30 outline-none"
                            />
                          ) : (
                            <p className="text-xs leading-relaxed text-foreground/80">{unit.topics_paragraph}</p>
                          )}
                        </div>

                        {/* Lecture plan */}
                        {unit.lecture_plan && (
                          <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Lecture Plan</p>
                            <p className="text-xs leading-relaxed italic text-foreground/70">{unit.lecture_plan}</p>
                          </div>
                        )}

                        {/* Unit Objectives */}
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Unit Objectives</p>
                          {editMode ? (
                            <EditableList
                              items={unit.unit_objectives}
                              onChange={items => {
                                const next = [...editUnits];
                                next[idx] = { ...next[idx], unit_objectives: items };
                                setEditUnits(next);
                              }}
                              placeholder="Add objectiveâ€¦"
                            />
                          ) : (
                            <ul className="space-y-0.5">
                              {unit.unit_objectives.map((o, i) => (
                                <li key={i} className="text-xs flex gap-1.5 text-foreground/80">
                                  <span className="text-muted-foreground shrink-0">â€¢</span>{o}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Unit Outcomes */}
                        <div>
                          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Unit Outcomes</p>
                          {editMode ? (
                            <EditableList
                              items={unit.unit_outcomes}
                              onChange={items => {
                                const next = [...editUnits];
                                next[idx] = { ...next[idx], unit_outcomes: items };
                                setEditUnits(next);
                              }}
                              placeholder="Add outcomeâ€¦"
                            />
                          ) : (
                            <ul className="space-y-0.5">
                              {unit.unit_outcomes.map((o, i) => (
                                <li key={i} className="text-xs flex gap-1.5 text-foreground/80">
                                  <span className="text-green-500 shrink-0">âœ“</span>{o}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Assessments */}
                        {unit.assessments.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Assessments</p>
                            {unit.assessments.map((a, i) => (
                              <p key={i} className="text-xs text-foreground/70">â€¢ {a}</p>
                            ))}
                          </div>
                        )}

                        {/* Readings */}
                        {unit.readings.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Readings</p>
                            {unit.readings.map((r, i) => (
                              <p key={i} className="text-xs text-foreground/70">ðŸ“– {r}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}

        {/* â”€â”€ CO-PO MATRIX â”€â”€ */}
        {activeTab === 'matrix' && (
          <div className="p-4 space-y-4">
            {coIds.length > 0 ? (
              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">CO-PO Correlation Matrix (0=None, 1=Low, 2=Medium, 3=High)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-1.5 font-bold text-muted-foreground w-14">CO\PO</th>
                        {allPOs.map(po => (
                          <th key={po} className="p-1 text-center font-bold text-muted-foreground w-8">{po.replace('PO','')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {coIds.map(coId => (
                        <tr key={coId} className="border-t border-border/20">
                          <td className="p-1.5 font-bold text-purple-600 font-mono">{coId}</td>
                          {allPOs.map(po => {
                            const val = coPoMatrix[coId]?.[po] ?? 0;
                            return (
                              <td key={po} className="p-1 text-center">
                                <span className={cn('inline-flex items-center justify-center h-6 w-6 rounded text-[10px]', cellColor(val))}>
                                  {val || '-'}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3 mt-3 flex-wrap text-[10px]">
                  <span className="flex items-center gap-1"><span className="h-4 w-4 rounded bg-green-500 inline-block" /> 3 = High</span>
                  <span className="flex items-center gap-1"><span className="h-4 w-4 rounded bg-yellow-400 inline-block" /> 2 = Medium</span>
                  <span className="flex items-center gap-1"><span className="h-4 w-4 rounded bg-blue-400 inline-block" /> 1 = Low</span>
                  <span className="flex items-center gap-1"><span className="h-4 w-4 rounded bg-muted inline-block border" /> 0 = None</span>
                </div>

                {data.attainment_formula && (
                  <div className="mt-3 p-3 bg-blue-500/5 rounded-lg border border-blue-500/15 text-[10px] text-blue-700 space-y-1">
                    <p><strong>Attainment Formula:</strong> {data.attainment_formula}</p>
                    {data.po_attainment_formula && <p><strong>PO Attainment:</strong> {data.po_attainment_formula}</p>}
                  </div>
                )}

                {data.attainment_levels && Object.keys(data.attainment_levels).length > 0 && (
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border/30">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Attainment Levels (NBA)</p>
                    <div className="space-y-1">
                      {Object.entries(data.attainment_levels).map(([level, desc]) => (
                        <p key={level} className="text-[10px]"><strong>{level}:</strong> {desc}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">CO-PO matrix not generated</p>
            )}
          </div>
        )}

        {/* â”€â”€ RESOURCES â”€â”€ */}
        {activeTab === 'resources' && (
          <div className="p-4 space-y-4">
            {/* Textbooks */}
            <section>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Textbooks
              </h4>
              {editMode ? (
                <EditableList items={editTextbooks} onChange={setEditTextbooks} placeholder="Add textbookâ€¦" />
              ) : (
                <div className="space-y-1.5">
                  {editTextbooks.map((tb, i) => (
                    <div key={i} className="bg-background rounded-lg p-2.5 border border-border/30 text-xs text-foreground/80">ðŸ“š {tb}</div>
                  ))}
                </div>
              )}
            </section>

            {/* YouTube */}
            {(editYoutube.length > 0 || editMode) && (
              <section>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                  <PlayCircle className="h-3.5 w-3.5 text-red-500" /> Online Video Resources
                </h4>
                {editMode ? (
                  <EditableList items={editYoutube} onChange={setEditYoutube} placeholder="Add video resourceâ€¦" />
                ) : (
                  <div className="space-y-1.5">
                    {editYoutube.map((r, i) => (
                      <div key={i} className="bg-background rounded-lg p-2.5 border border-border/30 text-xs text-foreground/80">ðŸŽ¬ {r}</div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Open Source */}
            {(editOSR.length > 0 || editMode) && (
              <section>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" /> Open Source / NPTEL / SWAYAM
                </h4>
                {editMode ? (
                  <EditableList items={editOSR} onChange={setEditOSR} placeholder="Add open source resourceâ€¦" />
                ) : (
                  <div className="space-y-1.5">
                    {editOSR.map((r, i) => (
                      <div key={i} className="bg-background rounded-lg p-2.5 border border-border/30 text-xs text-foreground/80">ðŸ”— {r}</div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* CQI Plan */}
            <section>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">CQI Plan</h4>
              {editMode ? (
                <textarea
                  value={editCQI}
                  rows={4}
                  onChange={e => setEditCQI(e.target.value)}
                  className="w-full text-xs bg-background border border-border/50 rounded-lg px-3 py-2 resize-none focus:ring-1 ring-primary/30 outline-none"
                />
              ) : (
                editCQI ? (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs text-foreground/80 leading-relaxed">
                    {editCQI}
                  </div>
                ) : null
              )}
            </section>

            {data.naac_iqac_note && (
              <p className="text-[10px] text-muted-foreground italic border-t pt-3">{data.naac_iqac_note}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


