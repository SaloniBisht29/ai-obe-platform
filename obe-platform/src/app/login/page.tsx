'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '@/types/user';
import { login, register } from '@/lib/auth';

type Mode = 'login' | 'register';

// Wrapper with Suspense boundary (required for useSearchParams in App Router)
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-600 border-t-blue-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Form state ─────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.FACULTY);
  const [department, setDepartment] = useState('Computer Science & Engineering');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ name, email, password, role, department });
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: UserRole.STUDENT, label: 'Student', icon: '🎓' },
    { value: UserRole.FACULTY, label: 'Faculty', icon: '👩‍🏫' },
    { value: UserRole.ADMIN, label: 'Admin', icon: '🛡️' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      {/* Background decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/25 mb-4">
            <span className="text-3xl">📚</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            OBE Platform
          </h1>
          <p className="text-slate-400 text-sm">
            Outcome-Based Education Management System
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 gap-1">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={[
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                mode === m
                  ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white',
              ].join(' ')}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Error message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forms */}
        <AnimatePresence mode="wait">
          {mode === 'login' ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@university.edu"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  minLength={6}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={[
                  'w-full py-3 rounded-xl font-semibold text-white transition-all duration-200',
                  'bg-gradient-to-r from-blue-500 to-violet-500',
                  'hover:from-blue-400 hover:to-violet-400 hover:shadow-lg hover:shadow-blue-500/25',
                  'active:scale-[0.98]',
                  loading ? 'opacity-70 cursor-not-allowed' : '',
                ].join(' ')}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleRegister}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="reg-name">Full Name</label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Priya Singh"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="reg-email">Email</label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@university.edu"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="reg-password">Password</label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  minLength={6}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                />
              </div>

              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={[
                        'flex flex-col items-center gap-1 py-3 rounded-xl border transition-all duration-200',
                        role === r.value
                          ? 'bg-violet-500/20 border-violet-500/50 text-white'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20',
                      ].join(' ')}
                    >
                      <span className="text-xl">{r.icon}</span>
                      <span className="text-xs font-medium">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor="reg-dept">Department</label>
                <input
                  id="reg-dept"
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={[
                  'w-full py-3 rounded-xl font-semibold text-white transition-all duration-200',
                  'bg-gradient-to-r from-violet-500 to-purple-500',
                  'hover:from-violet-400 hover:to-purple-400 hover:shadow-lg hover:shadow-violet-500/25',
                  'active:scale-[0.98]',
                  loading ? 'opacity-70 cursor-not-allowed' : '',
                ].join(' ')}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-600">
          Secured with bcrypt password hashing & JWT authentication
        </p>
      </motion.div>
    </div>
  );
}
