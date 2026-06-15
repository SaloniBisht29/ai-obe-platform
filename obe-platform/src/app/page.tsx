'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { FloatingAIButton } from '@/components/ui/FloatingAIButton';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { useSidebar } from '@/components/providers/SidebarProvider';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { getCurrentUser, fetchCurrentUser } from '@/lib/auth';
import { UserRole, type User } from '@/types/user';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { FacultyDashboard } from '@/components/dashboard/FacultyDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { ProgramsPage } from '@/components/pages/ProgramsPage';
import { CoursesPage } from '@/components/pages/CoursesPage';
import { COPOMappingPage } from '@/components/pages/COPOMappingPage';
import { AnalyticsPage } from '@/components/pages/AnalyticsPage';
import { FeedbackPage } from '@/components/pages/FeedbackPage';
import { SettingsPage } from '@/components/pages/SettingsPage';
import { SequencerPage } from '@/components/pages/SequencerPage';
import { AttainmentPage } from '@/components/pages/AttainmentPage';

// Prevent static prerendering — page requires auth and browser APIs
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { isCollapsed } = useSidebar();
  const { state } = useStore();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Quick check: if no cached user, redirect immediately
    const cached = getCurrentUser();
    if (!cached) {
      router.push('/login');
      return;
    }
    // Show cached user immediately, then verify with server
    setUser(cached);
    setLoading(false);

    // Verify session with server in background
    fetchCurrentUser().then((serverUser) => {
      if (!serverUser) {
        router.push('/login');
      } else {
        setUser(serverUser);
      }
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Render the active page content based on sidebar navigation
  const renderPageContent = () => {
    switch (state.activePage) {
      case 'programs':
        return <ProgramsPage />;
      case 'courses':
        return <CoursesPage />;
      case 'co-po-mapping':
        return <COPOMappingPage />;
      case 'sequencer':
        return <SequencerPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'feedback':
        return <FeedbackPage />;
      case 'settings':
        return <SettingsPage />;
      case 'attainment':
        return <AttainmentPage />;
      case 'dashboard':
      default:
        return (
          <>
            {user?.role === UserRole.STUDENT && <StudentDashboard />}
            {user?.role === UserRole.FACULTY && <FacultyDashboard />}
            {user?.role === UserRole.ADMIN && <AdminDashboard />}
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      {/* Main content area */}
      <main
        className={cn(
          'pt-16 transition-all duration-200',
          'lg:pl-[280px]',
          isCollapsed && 'lg:pl-[72px]'
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {renderPageContent()}
        </div>
      </main>

      {/* Floating AI Button */}
      <FloatingAIButton />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
