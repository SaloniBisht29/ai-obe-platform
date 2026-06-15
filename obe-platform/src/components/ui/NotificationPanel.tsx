'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  FileCheck,
  Sparkles,
  Server,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  review: { icon: FileCheck, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ai: { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  system: { icon: Server, color: 'text-blue-500', bg: 'bg-blue-500/10' },
};

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  // No mock data — notifications will come from the DB
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full right-0 mt-2 w-[360px] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <Badge variant="secondary" className="text-[10px] px-1.5 h-4 bg-muted text-muted-foreground border-0">
            0 new
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Separator />

      <div className="py-12 text-center text-muted-foreground">
        <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">No notifications yet</p>
        <p className="text-xs mt-1">You&apos;re all caught up!</p>
      </div>

      <Separator />

      <div className="p-3 flex justify-center">
        <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80 w-full">
          View all notifications
        </Button>
      </div>
    </motion.div>
  );
}
