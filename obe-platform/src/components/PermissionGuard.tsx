'use client';

import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { ShieldOff } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredRole: string | string[];
  fallback?: React.ReactNode;
}

export function PermissionGuard({ children, requiredRole, fallback }: PermissionGuardProps) {
  const user = getCurrentUser();
  const roles = Array.isArray(requiredRole) ? requiredRole.map(r => r.toUpperCase()) : [requiredRole.toUpperCase()];
  const userRole = user?.role?.toUpperCase() || '';

  if (userRole && roles.includes(userRole)) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-md text-sm font-medium">
      <ShieldOff className="h-4 w-4 shrink-0" />
      Access Denied
    </div>
  );
}
