'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Sparkles,
  Menu,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  BookOpen,
  HelpCircle,
  Keyboard,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/components/providers/SidebarProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { getCurrentUser, logout } from '@/lib/auth';
import { NotificationPanel } from '@/components/ui/NotificationPanel';
import { SearchCommand } from '@/components/ui/SearchCommand';

export function Header() {
  const { toggleSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Get the actual logged-in user from localStorage
  const [loggedUser, setLoggedUser] = useState<{ name: string; role: string; initials: string } | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      const initials = user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      setLoggedUser({
        name: user.name,
        role: `${user.role} · ${user.department || 'OBE Platform'}`,
        initials,
      });
    }
  }, []);

  const unreadCount = 0; // Will be fetched from DB when notifications are implemented

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Fallback display info
  const displayName = loggedUser?.name || 'User';
  const displayRole = loggedUser?.role || '';
  const displayInitials = loggedUser?.initials || 'U';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 glass z-50 flex items-center px-4 lg:px-6 gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg hidden sm:block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            OBE Platform
          </span>
        </div>

        {/* Search bar */}
        <div className="flex-1 flex justify-center max-w-xl mx-auto">
          <button
            onClick={() => setShowSearch(true)}
            className="w-full max-w-md flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-muted/50 hover:bg-muted transition-colors text-sm text-muted-foreground"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline truncate">
              Ask me anything about courses, outcomes, or curriculum...
            </span>
            <span className="sm:hidden">Search...</span>
            <div className="ml-auto flex items-center gap-1 shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="hidden sm:flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
            </TooltipTrigger>
            <TooltipContent>Toggle theme</TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <div className="relative">
            <Tooltip>
              <TooltipTrigger
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications"
                  className="relative inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            <AnimatePresence>
              {showNotifications && (
                <NotificationPanel onClose={() => setShowNotifications(false)} />
              )}
            </AnimatePresence>
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
                className="flex items-center gap-2 pl-2 pr-1 h-9 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                    {displayInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
                  {displayName}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">{displayName}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {displayRole}
                    </span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BookOpen className="mr-2 h-4 w-4" />
                My Courses
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === 'light' ? (
                  <Moon className="mr-2 h-4 w-4" />
                ) : (
                  <Sun className="mr-2 h-4 w-4" />
                )}
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Documentation
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Keyboard className="mr-2 h-4 w-4" />
                Keyboard Shortcuts
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Search Command Palette */}
      <SearchCommand open={showSearch} onOpenChange={setShowSearch} />
    </>
  );
}
