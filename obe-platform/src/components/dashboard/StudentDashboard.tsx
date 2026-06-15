'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { getCurrentUser } from '@/lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import our student-specific components
import { ProgressTracker } from '../student/ProgressTracker';
import { MyCurriculum } from '../student/MyCurriculum';
import { CourseView } from '../student/CourseView';

export function StudentDashboard() {
  const user = getCurrentUser();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-600 p-6 sm:p-8 text-white shadow-lg"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5 blur-xl" />
        </div>
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {greeting}, {user?.name?.split(' ')[0] || 'Student'}! 🎓
          </h1>
          <p className="mt-1.5 text-blue-100 text-sm sm:text-base">
            {user?.program || 'B.Tech CSE'} &middot; Semester {user?.semester || 5}
          </p>
        </div>
      </motion.div>

      {/* Tabs Layout for Student Sections */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex justify-center sm:justify-start">
          <TabsList className="bg-muted/50 p-1 w-full sm:w-auto overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="flex-1 sm:flex-none">Overview</TabsTrigger>
            <TabsTrigger value="curriculum" className="flex-1 sm:flex-none">My Curriculum</TabsTrigger>
            <TabsTrigger value="active-course" className="flex-1 sm:flex-none">Active Course</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ProgressTracker />
          </motion.div>
        </TabsContent>

        <TabsContent value="curriculum" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <MyCurriculum />
          </motion.div>
        </TabsContent>

        <TabsContent value="active-course" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <CourseView />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
