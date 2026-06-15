'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import our new Admin components
import { AnalyticsDashboard } from '../admin/AnalyticsDashboard';
import { UserManagement } from '../admin/UserManagement';
import { ReportsGeneration } from '../admin/ReportsGeneration';

export function AdminDashboard() {
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
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 border border-slate-600 p-6 sm:p-8 text-white shadow-xl"
      >
        <div className="absolute inset-0 overflow-hidden">
           <div className="absolute top-1/2 right-10 -translate-y-1/2 opacity-10">
             <ShieldAlert className="h-32 w-32" />
           </div>
        </div>
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            {greeting}, {user?.name?.split(' ')[0] || 'Administrator'} 
            <span className="text-amber-400 text-sm font-mono bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">ROOT</span>
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-lg">
            System health is stable. You have elevated access to manage users, configure programs, and generate compliance reports.
          </p>
        </div>
      </motion.div>

      {/* Tabs Layout for Admin Interfaces */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <div className="flex justify-center sm:justify-start">
          <TabsList className="bg-muted/50 p-1 w-full sm:w-auto overflow-x-auto flex-nowrap">
            <TabsTrigger value="analytics" className="flex-1 sm:flex-none">System Analytics</TabsTrigger>
            <TabsTrigger value="users" className="flex-1 sm:flex-none">User Management</TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 sm:flex-none">Reports & Exports</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="analytics" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <AnalyticsDashboard />
          </motion.div>
        </TabsContent>

        <TabsContent value="users" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
             <UserManagement />
          </motion.div>
        </TabsContent>

        <TabsContent value="reports" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
             <ReportsGeneration />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
