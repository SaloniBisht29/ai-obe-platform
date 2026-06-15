'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useStore, type Toast } from '@/lib/store';

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400',
  error: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',
};

const iconColor = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-blue-600 dark:text-blue-400',
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useStore();
  const Icon = iconMap[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm ${colorMap[toast.type]}`}
    >
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColor[toast.type]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && (
          <p className="text-xs opacity-80 mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const { state } = useStore();

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {state.toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
