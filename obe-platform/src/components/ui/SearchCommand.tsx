'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  BookOpen,
  Sparkles,
  Clock,
  ArrowRight,
  GraduationCap,
  X,
} from 'lucide-react';
import { Command as CommandPrimitive } from 'cmdk';
import { cn } from '@/lib/utils';

interface SearchCourse {
  id: string;
  code: string;
  name: string;
  semester: number;
  credits: number;
}

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const [courses, setCourses] = useState<SearchCourse[]>([]);

  // Fetch courses from DB
  useEffect(() => {
    if (open) {
      fetch('/api/courses')
        .then(r => r.ok ? r.json() : { courses: [] })
        .then(d => setCourses(d.courses || []))
        .catch(() => {});
    }
  }, [open]);

  // ⌘K keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleSelect = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Command palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[20%] z-[101] w-full max-w-lg -translate-x-1/2"
          >
            <CommandPrimitive
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl"
              loop
            >
              {/* Search input */}
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <CommandPrimitive.Input
                  placeholder="Search courses, outcomes, or ask AI..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  autoFocus
                />
                <button
                  onClick={() => onOpenChange(false)}
                  className="shrink-0 rounded-md p-1 hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Results */}
              <CommandPrimitive.List className="max-h-72 overflow-y-auto p-2">
                <CommandPrimitive.Empty className="py-6 text-center text-sm text-muted-foreground">
                  <div className="flex flex-col items-center">
                    <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p>No results found.</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Try searching for a course name or code
                    </p>
                  </div>
                </CommandPrimitive.Empty>

                <CommandPrimitive.Group
                  heading="AI Suggestions"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground p-1"
                >
                  <CommandPrimitive.Item
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm cursor-pointer aria-selected:bg-muted transition-colors"
                    onSelect={handleSelect}
                  >
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Generate Course Outcomes</p>
                      <p className="text-xs text-muted-foreground">
                        Use AI to create COs for any course
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </CommandPrimitive.Item>
                  <CommandPrimitive.Item
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm cursor-pointer aria-selected:bg-muted transition-colors"
                    onSelect={handleSelect}
                  >
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Analyze Bloom&apos;s Distribution</p>
                      <p className="text-xs text-muted-foreground">
                        Check taxonomy balance across courses
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </CommandPrimitive.Item>
                </CommandPrimitive.Group>

                <CommandPrimitive.Separator className="-mx-1 my-1 h-px bg-border" />

                <CommandPrimitive.Group
                  heading="Courses"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground p-1"
                >
                  {courses.map((course) => (
                    <CommandPrimitive.Item
                      key={course.id}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm cursor-pointer aria-selected:bg-muted transition-colors"
                      onSelect={handleSelect}
                    >
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          <span className="font-semibold">{course.code}</span> -{' '}
                          {course.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Semester {course.semester} • {course.credits} Credits
                        </p>
                      </div>
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>

                <CommandPrimitive.Separator className="-mx-1 my-1 h-px bg-border" />

                <CommandPrimitive.Group
                  heading="Recent Searches"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground p-1"
                >
                  <CommandPrimitive.Item
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm cursor-pointer aria-selected:bg-muted transition-colors"
                    onSelect={handleSelect}
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>CO-PO mapping for CS201</span>
                  </CommandPrimitive.Item>
                  <CommandPrimitive.Item
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm cursor-pointer aria-selected:bg-muted transition-colors"
                    onSelect={handleSelect}
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Semester 5 curriculum</span>
                  </CommandPrimitive.Item>
                </CommandPrimitive.Group>

                <CommandPrimitive.Separator className="-mx-1 my-1 h-px bg-border" />

                <CommandPrimitive.Group
                  heading="Quick Actions"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground p-1"
                >
                  <CommandPrimitive.Item
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm cursor-pointer aria-selected:bg-muted transition-colors"
                    onSelect={handleSelect}
                  >
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>Create New Course</span>
                    <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                      ⌘N
                    </kbd>
                  </CommandPrimitive.Item>
                </CommandPrimitive.Group>
              </CommandPrimitive.List>

              {/* Footer */}
              <div className="border-t border-border px-3 py-2 flex items-center gap-4 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <kbd className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="bg-muted px-1 py-0.5 rounded text-[10px] font-mono">esc</kbd>
                  <span>Close</span>
                </div>
              </div>
            </CommandPrimitive>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
