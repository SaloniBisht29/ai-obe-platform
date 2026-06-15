'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Link2,
  BarChart3,
  MessageSquare,
  Settings,
  ChevronLeft,
  CalendarDays,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useSidebar } from '@/components/providers/SidebarProvider';
import { useStore, type NavPage } from '@/lib/store';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  page: NavPage;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: GraduationCap, label: 'Programs', page: 'programs', badge: 3 },
  { icon: BookOpen, label: 'Courses', page: 'courses', badge: 24 },
  { icon: Link2, label: 'CO-PO Mapping', page: 'co-po-mapping' },
  { icon: CalendarDays, label: 'Sequencer', page: 'sequencer' },
  { icon: BarChart3, label: 'Analytics', page: 'analytics' },
  { icon: TrendingUp, label: 'Attainment', page: 'attainment' },
  { icon: MessageSquare, label: 'Feedback', page: 'feedback', badge: 'new', badgeVariant: 'destructive' },
  { icon: Settings, label: 'Settings', page: 'settings' },
];

function NavContent({ collapsed = false }: { collapsed?: boolean }) {
  const { state, setPage } = useStore();
  const { closeSidebar } = useSidebar();

  const handleNav = (page: NavPage) => {
    setPage(page);
    closeSidebar(); // Close mobile drawer
  };

  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = state.activePage === item.page;
          return (
            <button
              key={item.label}
              onClick={() => handleNav(item.page)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-500/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant={item.badgeVariant || 'secondary'}
                      className={cn(
                        'ml-auto text-[10px] px-1.5 py-0 h-5',
                        item.badgeVariant === 'destructive'
                          ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-0'
                          : 'bg-muted'
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-4">
          <Separator className="mb-4" />
          <div className="rounded-lg bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <GraduationCap className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-semibold">OBE Platform</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              AI-powered curriculum design for outcome-based education.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { isOpen, isCollapsed, toggleCollapse, closeSidebar } = useSidebar();

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 72 : 280 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 bg-card border-r border-border z-40 overflow-hidden"
      >
        {/* Collapse button */}
        <div className="flex items-center justify-end px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-7 w-7"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isCollapsed && 'rotate-180'
              )}
            />
          </Button>
        </div>
        <NavContent collapsed={isCollapsed} />
      </motion.aside>

      {/* Mobile sidebar (sheet/drawer) */}
      <Sheet open={isOpen} onOpenChange={closeSidebar}>
        <SheetContent side="left" className="w-[280px] p-0 pt-2">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                OBE Platform
              </span>
            </div>
          </div>
          <NavContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
