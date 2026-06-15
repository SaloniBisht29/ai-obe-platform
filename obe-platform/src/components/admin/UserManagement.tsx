'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, MoreVertical, Edit, Trash2,
  ShieldCheck, ShieldOff, UserPlus, X, Check, Users,
  GraduationCap, BookOpen, Shield, Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStore } from '@/lib/store';

interface DbUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  createdAt: string;
  avatar: string;
}

const roleConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  ADMIN:   { color: 'text-amber-500',  bg: 'bg-amber-500/10',  icon: Shield },
  Admin:   { color: 'text-amber-500',  bg: 'bg-amber-500/10',  icon: Shield },
  FACULTY: { color: 'text-purple-500', bg: 'bg-purple-500/10', icon: BookOpen },
  Faculty: { color: 'text-purple-500', bg: 'bg-purple-500/10', icon: BookOpen },
  STUDENT: { color: 'text-blue-500',   bg: 'bg-blue-500/10',   icon: GraduationCap },
  Student: { color: 'text-blue-500',   bg: 'bg-blue-500/10',   icon: GraduationCap },
};

export function UserManagement() {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('STUDENT');
  const [newDept, setNewDept] = useState('Computer Science & Engineering');
  const [saving, setSaving] = useState(false);

  const { addToast } = useStore();

  // ── Fetch users from MongoDB ──────────────────────────────────
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setLoading(false);
    }
  };

  const displayedUsers = useMemo(() =>
    users.filter(u =>
      (filter === 'All' || u.role === filter) &&
      (u.name.toLowerCase().includes(search.toLowerCase()) ||
       u.email.toLowerCase().includes(search.toLowerCase()))
    ), [users, filter, search]);

  const roleCounts = useMemo(() => ({
    All: users.length,
    STUDENT: users.filter(u => u.role === 'STUDENT').length,
    FACULTY: users.filter(u => u.role === 'FACULTY').length,
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
  }), [users]);

  // ── Toggle user status via API ────────────────────────────────
  const toggleStatus = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const newStatus = user.status === 'Active' ? 'Disabled' : 'Active';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, status: newStatus }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
        addToast({ type: 'info', title: 'Status Updated', description: `${user.name} is now ${newStatus}` });
      }
    } catch {
      addToast({ type: 'error', title: 'Error', description: 'Failed to update status' });
    }
  };

  // ── Change user role via API ──────────────────────────────────
  const changeRole = async (id: string, newR: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, role: newR }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newR } : u));
        addToast({ type: 'success', title: 'Role Updated', description: `Role changed to ${newR}` });
      }
    } catch {
      addToast({ type: 'error', title: 'Error', description: 'Failed to change role' });
    }
  };

  // ── Delete user via API ───────────────────────────────────────
  const deleteUser = async (id: string) => {
    const user = users.find(u => u.id === id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id }),
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
        setDeleteConfirm(null);
        addToast({ type: 'warning', title: 'User Removed', description: `${user?.name} has been removed` });
      } else {
        const data = await res.json();
        addToast({ type: 'error', title: 'Failed', description: data.error || 'Could not delete' });
      }
    } catch {
      addToast({ type: 'error', title: 'Error', description: 'Failed to delete user' });
    }
  };

  // ── Add user via registration API ─────────────────────────────
  const addUser = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          department: newDept,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        setNewName(''); setNewEmail(''); setNewPassword(''); setNewRole('STUDENT');
        addToast({ type: 'success', title: 'User Added', description: `${newName} added successfully` });
        fetchUsers(); // Refresh user list
      } else {
        addToast({ type: 'error', title: 'Failed', description: data.error || 'Could not add user' });
      }
    } catch {
      addToast({ type: 'error', title: 'Error', description: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Role Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {([['All', Users], ['STUDENT', GraduationCap], ['FACULTY', BookOpen], ['ADMIN', Shield]] as const).map(([role, Icon]) => (
          <button key={role} onClick={() => setFilter(role)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border
              ${filter === role
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 text-blue-400 shadow-sm'
                : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/60'}`}>
            <Icon className="h-3.5 w-3.5" />
            {role === 'All' ? 'All' : role}
            <span className="ml-0.5 text-[10px] bg-background/50 px-1.5 py-0.5 rounded-full">
              {roleCounts[role as keyof typeof roleCounts] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Main Card */}
      <Card className="border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-3 items-center justify-between bg-muted/10">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." className="pl-9 bg-background/50" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md shadow-blue-500/20">
            <UserPlus className="h-4 w-4 mr-2" /> Add New User
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Department</th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              <AnimatePresence mode="popLayout">
                {displayedUsers.map((user) => {
                  const rc = roleConfig[user.role] || roleConfig.STUDENT;
                  return (
                    <motion.tr key={user.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={`text-[10px] font-bold ${rc.bg} ${rc.color}`}>{user.avatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${rc.bg} ${rc.color}`}>
                          <rc.icon className="h-3 w-3" /> {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{user.department}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleStatus(user.id)}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer border ${
                            user.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20'}`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          {user.status || 'Active'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium opacity-60 group-hover:opacity-100 transition-opacity hover:bg-accent hover:text-accent-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => changeRole(user.id, 'STUDENT')}>
                              <GraduationCap className="h-4 w-4 mr-2" /> Set as Student
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => changeRole(user.id, 'FACULTY')}>
                              <BookOpen className="h-4 w-4 mr-2" /> Set as Faculty
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => changeRole(user.id, 'ADMIN')}>
                              <Shield className="h-4 w-4 mr-2" /> Set as Admin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleStatus(user.id)}>
                              {user.status === 'Active'
                                ? <><ShieldOff className="h-4 w-4 mr-2" /> Disable Access</>
                                : <><ShieldCheck className="h-4 w-4 mr-2" /> Enable Access</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => setDeleteConfirm(user.id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {displayedUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-10 w-10 opacity-30" />
                      <p className="text-sm font-medium">No users found</p>
                      <p className="text-xs">Try adjusting your search or filter</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-border/50 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {displayedUsers.length} of {users.length} users</span>
          <span>Real-time from MongoDB</span>
        </div>
      </Card>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-500" /> Add New User
                </h2>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowAddModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input placeholder="e.g. Dr. Amit Verma" value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input placeholder="e.g. amit@univ.edu" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Password</label>
                  <Input type="password" placeholder="Min. 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Role</label>
                    <select className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm"
                      value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                      <option value="STUDENT">Student</option>
                      <option value="FACULTY">Faculty</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Department</label>
                    <Input placeholder="e.g. CSE" value={newDept} onChange={e => setNewDept(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  onClick={addUser} disabled={saving || !newName.trim() || !newEmail.trim() || !newPassword.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Add User
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-card border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 rounded-xl"><Trash2 className="h-5 w-5 text-red-500" /></div>
                <div>
                  <h3 className="font-bold">Delete User</h3>
                  <p className="text-xs text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to permanently delete <strong className="text-foreground">{users.find(u => u.id === deleteConfirm)?.name}</strong>?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteUser(deleteConfirm)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
