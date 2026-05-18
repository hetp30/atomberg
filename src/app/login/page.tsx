'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const DEMO_ACCOUNTS = [
  { role: 'Employee', email: 'employee@test.com', color: 'bg-green-600' },
  { role: 'Manager', email: 'manager@test.com', color: 'bg-blue-600' },
  { role: 'Admin', email: 'admin@test.com', color: 'bg-purple-600' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.ok) {
      router.push('/dashboard')
    } else {
      toast.error('Invalid email or password. Try seeding the database first.')
    }
  }

  const quickLogin = async (demoEmail: string) => {
    setLoading(true)
    const result = await signIn('credentials', { email: demoEmail, password: 'password123', redirect: false })
    setLoading(false)
    if (result?.ok) router.push('/dashboard')
    else toast.error('Please seed the database first using the button below.')
  }

  const seedDb = async () => {
    setSeeding(true)
    const res = await fetch('/api/seed')
    const data = await res.json()
    setSeeding(false)
    if (data.seeded) toast.success('Demo database initialized! You can now log in.')
    else if (data.message === 'Already seeded') toast.info('Database already initialized.')
    else toast.error('Seeding failed: ' + data.error)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-2xl mx-auto mb-4 shadow-lg shadow-indigo-500/25">
            GT
          </div>
          <h1 className="text-2xl font-bold text-white">GoalTrack</h1>
          <p className="text-slate-400 text-sm mt-1">AtomQuest Hackathon 1.0 — Goal Setting Portal</p>
        </div>

        {/* Login form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold mb-6 text-white">Sign in to your account</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-indigo-500"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700" /></div>
            <div className="relative flex justify-center"><span className="bg-slate-900 px-3 text-xs text-slate-500">DEMO QUICK ACCESS</span></div>
          </div>

          {/* Quick login buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {DEMO_ACCOUNTS.map(({ role, email: demoEmail, color }) => (
              <button
                key={role}
                onClick={() => quickLogin(demoEmail)}
                disabled={loading}
                className={`${color} text-white text-xs font-semibold py-2 px-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Seed button */}
          <button
            onClick={seedDb}
            disabled={seeding}
            className="w-full text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-600 rounded-lg py-2 transition-all"
          >
            {seeding ? 'Initializing...' : '⚡ Initialize Demo Database (first time only)'}
          </button>
        </div>

        {/* Credentials hint */}
        <p className="text-center text-xs text-slate-600 mt-4">
          Demo password for all accounts: <span className="text-slate-400 font-mono">password123</span>
        </p>
      </div>
    </div>
  )
}
