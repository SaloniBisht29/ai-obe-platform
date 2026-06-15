'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Star, ThumbsUp, Clock, CheckCircle2,
  Search, ChevronDown, Loader2, Plus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface FeedbackItem {
  id: string;
  type: string;
  targetId?: string;
  targetName: string;
  comment: string;
  rating: number | null;
  createdByName: string;
  createdByRole?: string;
  createdAt: string;
  status?: string;
}

const typeConfig: Record<string, { color: string; icon: string }> = {
  suggestion: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: '💡' },
  issue: { color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: '⚠️' },
  praise: { color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: '🌟' },
  question: { color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: '❓' },
  course: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: '📚' },
  syllabus: { color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: '📋' },
  co: { color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: '🎯' },
  mapping: { color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: '🗺️' },
};

export function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showNewFeedback, setShowNewFeedback] = useState(false);
  const [newType, setNewType] = useState('suggestion');
  const [newComment, setNewComment] = useState('');
  const [newTargetName, setNewTargetName] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useStore();

  // ── Fetch feedback from MongoDB ───────────────────────────────
  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await fetch('/api/feedback');
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(data.feedback || []);
      }
    } catch (e) {
      console.error('Failed to fetch feedback:', e);
    } finally {
      setLoading(false);
    }
  };

  // ── Submit new feedback via API ───────────────────────────────
  const handleSubmitFeedback = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newType,
          targetName: newTargetName || 'General',
          comment: newComment,
          rating: newRating || null,
        }),
      });
      if (res.ok) {
        addToast({ type: 'success', title: 'Feedback Submitted', description: 'Your feedback has been recorded' });
        setShowNewFeedback(false);
        setNewComment('');
        setNewTargetName('');
        setNewRating(0);
        fetchFeedback(); // Refresh list
      } else {
        const data = await res.json();
        addToast({ type: 'error', title: 'Failed', description: data.error || 'Could not submit feedback' });
      }
    } catch {
      addToast({ type: 'error', title: 'Error', description: 'Network error' });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = feedbackList.filter((f) => {
    const matchSearch = f.comment.toLowerCase().includes(search.toLowerCase()) ||
      f.targetName.toLowerCase().includes(search.toLowerCase()) ||
      f.createdByName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || f.type === filter;
    return matchSearch && matchFilter;
  });

  const getTimeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading feedback...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            Feedback Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {feedbackList.length} feedback items · Review and respond to curriculum feedback
          </p>
        </div>
        <Button
          onClick={() => setShowNewFeedback(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" /> New Feedback
        </Button>
      </motion.div>

      {/* Search and filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search feedback..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', 'suggestion', 'issue', 'praise', 'question', 'course', 'syllabus'].map((f) => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}
              className={cn('text-[11px] h-7 capitalize', filter === f && 'bg-primary text-primary-foreground')}
            >
              {f}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Feedback list */}
      <div className="space-y-3">
        {filtered.map((item, index) => {
          const type = typeConfig[item.type] || typeConfig.suggestion;
          const isExpanded = expandedId === item.id;

          return (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
            >
              <Card className={cn('border-border/50 transition-all duration-300 hover:shadow-md', isExpanded && 'ring-1 ring-primary/20')}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                    <span className="text-xl">{type.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold">{item.createdByName}</span>
                        {item.createdByRole && <Badge variant="outline" className="text-[9px] h-4">{item.createdByRole}</Badge>}
                        <span className="text-xs text-muted-foreground">on {item.targetName}</span>
                        <Badge variant="outline" className={cn('text-[9px] h-4 ml-auto', type.color)}>
                          {item.type}
                        </Badge>
                      </div>
                      <p className={cn('text-sm text-muted-foreground', !isExpanded && 'line-clamp-2')}>
                        {item.comment}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{getTimeAgo(item.createdAt)}</span>
                        {item.rating && (
                          <span className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className={cn('h-3 w-3', i < item.rating! ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30')} />
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', isExpanded && 'rotate-180')} />
                  </div>

                  {/* Expanded section */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-3 border-t border-border/50 space-y-3">
                          <div className="flex items-center gap-2">
                            <Input placeholder="Write a reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)}
                              className="flex-1 h-9 text-sm"
                            />
                            <Button size="sm" disabled={!replyText.trim()} className="h-9"
                              onClick={() => { addToast({ type: 'success', title: 'Reply Sent' }); setReplyText(''); }}>
                              <Send className="h-3.5 w-3.5 mr-1" /> Reply
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-xs h-7 text-green-600 border-green-500/20 hover:bg-green-500/10"
                              onClick={() => addToast({ type: 'success', title: 'Resolved' })}>
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Resolved
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-7">
                              <ThumbsUp className="h-3 w-3 mr-1" /> Helpful
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No feedback yet</p>
          <p className="text-xs text-muted-foreground mt-1">Be the first to submit feedback</p>
        </motion.div>
      )}

      {/* New Feedback Modal */}
      <AnimatePresence>
        {showNewFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowNewFeedback(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" /> Submit Feedback
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm mt-1"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                  >
                    <option value="suggestion">💡 Suggestion</option>
                    <option value="issue">⚠️ Issue</option>
                    <option value="praise">🌟 Praise</option>
                    <option value="question">❓ Question</option>
                    <option value="course">📚 Course</option>
                    <option value="syllabus">📋 Syllabus</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Subject / Course</label>
                  <Input placeholder="e.g. CS301 - Operating Systems" value={newTargetName} onChange={e => setNewTargetName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Comment</label>
                  <textarea
                    className="w-full min-h-[100px] px-3 py-2 bg-background border border-input rounded-md text-sm mt-1 resize-none"
                    placeholder="Write your feedback..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Rating (optional)</label>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => setNewRating(s)} className="p-1">
                        <Star className={cn('h-5 w-5', s <= newRating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30')} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowNewFeedback(false)}>Cancel</Button>
                <Button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  onClick={handleSubmitFeedback} disabled={submitting || !newComment.trim()}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Submit
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
