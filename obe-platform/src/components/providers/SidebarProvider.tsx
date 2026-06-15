'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  toggleCollapse: () => void;
  closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  isCollapsed: false,
  toggleSidebar: () => {},
  toggleCollapse: () => {},
  closeSidebar: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => setIsOpen((prev) => !prev), []);
  const toggleCollapse = useCallback(() => setIsCollapsed((prev) => !prev), []);
  const closeSidebar = useCallback(() => setIsOpen(false), []);

  return (
    <SidebarContext.Provider
      value={{ isOpen, isCollapsed, toggleSidebar, toggleCollapse, closeSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
