'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, Send, Bot, User, Loader2, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { askAI } from '@/lib/api';
import { useStore } from '@/lib/store';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  source?: string;
}

const quickSuggestions = [
  'Generate COs for Machine Learning',
  'Explain CO-PO mapping',
  "Bloom's taxonomy tips",
  'How to improve CO attainment?',
];

const initMsg: Msg = {
  id: 'init',
  role: 'assistant',
  content: "Hi! I'm your AI curriculum assistant. Ask me anything about COs, POs, or Bloom's taxonomy. For a full syllabus, use the **AI Assistant** panel on the dashboard.",
};

export function FloatingAIButton() {
  const [isOpen, setIsOpen]       = useState(false);
  const [input, setInput]         = useState('');
  const [messages, setMessages]   = useState<Msg[]>([initMsg]);
  const [busy, setBusy]           = useState(false);
  const endRef                    = useRef<HTMLDivElement>(null);
  const { addToast }              = useStore();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const push = (m: Omit<Msg, 'id'>) =>
    setMessages(p => [...p, { ...m, id: `m-${Date.now()}-${Math.random()}` }]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || busy) return;
    push({ role: 'user', content: text });
    setInput('');
    setBusy(true);
    try {
      const result = await askAI(text);
      if (result.type === 'outcomes') {
        const coText = result.data.outcomes
          .map((o, i) => `CO${i + 1} (${o.bloom_level}): ${o.text}`)
          .join('\n');
        push({
          role: 'assistant',
          content: `**COs for ${result.data.course_name}:**\n\n${coText}\n\n_Assessment: ${result.data.outcomes[0]?.assessment_suggestion}_`,
          source: 'ollama',
        });
        addToast({ type: 'success', title: 'COs Generated', description: `${result.data.outcomes.length} outcomes` });
      } else {
        push({ role: 'assistant', content: result.data });
      }
    } catch {
      push({ role: 'assistant', content: 'Sorry, something went wrong. Please try again.' });
    } finally {
      setBusy(false);
    }
  }, [busy, addToast]);

  const renderMd = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    );

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.5, type: 'spring', stiffness: 200 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 h-14 w-14 rounded-full z-50 bg-gradient-to-br from-purple-500 to-pink-500',
          'flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow',
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X className="h-5 w-5 text-white" /></motion.div>
            : <motion.div key="s" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Sparkles className="h-5 w-5 text-white" /></motion.div>
          }
        </AnimatePresence>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-background">
            <Zap className="h-3 w-3" />
          </span>
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[380px] max-h-[580px] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-purple-500/5 to-pink-500/5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">AI Curriculum Assistant</h3>
                  <p className="text-[10px] text-green-500 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Online — NBA Engine
                  </p>
                </div>
              </div>
            </div>

            {/* Quick suggestions */}
            <div className="px-3 pt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {quickSuggestions.map(s => (
                <button key={s} onClick={() => handleSend(s)} disabled={busy}
                  className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium border border-border/50 bg-muted/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all whitespace-nowrap disabled:opacity-50">
                  {s}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto min-h-[200px] max-h-[360px]">
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'assistant' && (
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div className={cn(
                    'rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap max-w-[85%]',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md border border-border/30'
                  )}>
                    {renderMd(msg.content)}
                    {msg.source === 'ollama' && (
                      <div className="mt-1 flex items-center gap-0.5 text-[9px] text-purple-500 opacity-70">
                        <Zap className="h-2 w-2" /> AI engine
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3 w-3 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}

              {busy && (
                <div className="flex gap-2 items-start">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2 flex items-center gap-1">
                    {[0, 0.15, 0.3].map(d => (
                      <motion.div key={d} animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: d }}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSend(input); } }}
                placeholder="Ask about COs, POs, Bloom's..."
                className="flex-1 bg-muted/30 border border-border/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
              />
              <Button size="icon" className="h-9 w-9 shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                onClick={() => handleSend(input)} disabled={!input.trim() || busy}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
