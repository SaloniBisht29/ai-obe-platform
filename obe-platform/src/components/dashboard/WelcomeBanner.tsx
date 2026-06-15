'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';

export function WelcomeBanner() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const [userName, setUserName] = useState('');
  const [pendingCount, setPendingCount] = useState(3);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      // Extract last name or title from the full name
      const parts = user.name.split(' ');
      const displayName = parts.length > 1 ? parts.slice(0, -1).join(' ') + ' ' + parts[parts.length - 1] : user.name;
      setUserName(displayName);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 p-6 sm:p-8 text-white"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5 blur-xl" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-purple-400/20 blur-2xl" />
      </div>

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-2xl sm:text-3xl font-bold"
          >
            {greeting}, {userName || 'User'}! 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-1.5 text-blue-100 text-sm sm:text-base"
          >
            You have <span className="font-semibold text-white">{pendingCount} courses</span> pending review
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Button
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 group"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
            Create New Course
            <Sparkles className="h-4 w-4 ml-2 text-yellow-300" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
