'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { STATUS_COLORS } from '@/lib/goalUtils'
import { Target, Users, ClipboardCheck, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export default function DashboardClient({ user, cycle, stats }: { user: any; cycle: any; stats: any }) {
  const role = user.role

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="text-indigo-400">{user.name.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-slate-400">
          {role === 'EMPLOYEE' && 'Track your goals and quarterly achievements.'}
          {role === 'MANAGER' && "Monitor your team's progress and approve goals."}
          {role === 'ADMIN' && 'Manage cycles, users, and view organization-wide analytics.'}
        </p>
      </div>

      {/* Active Cycle Banner */}
      {cycle ? (
        <div className="bg-indigo-950/50 border border-indigo-800 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-indigo-200 font-medium">Active Cycle: {cycle.name} — {cycle.phase}</span>
          </div>
          <span className="text-xs text-indigo-400">
            Window: {new Date(cycle.windowOpen).toLocaleDateString()} – {new Date(cycle.windowClose).toLocaleDateString()}
          </span>
        </div>
      ) : (
        <div className="bg-amber-950/50 border border-amber-800 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle size={16} className="text-amber-400" />
          <span className="text-sm text-amber-300">No active cycle. Ask your Admin to configure one.</span>
        </div>
      )}

      {/* Role: Employee */}
      {role === 'EMPLOYEE' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400 font-medium">Goal Sheet Status</CardTitle></CardHeader>
            <CardContent>
              <Badge className={STATUS_COLORS[stats.sheetStatus] || 'bg-slate-700'}>{stats.sheetStatus}</Badge>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400 font-medium">Goals Defined</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{stats.totalGoals}<span className="text-slate-500 text-lg">/8</span></p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400 font-medium">Avg Progress Score</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-indigo-400">{stats.avgScore || 0}<span className="text-slate-400 text-lg">%</span></p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Role: Manager */}
      {role === 'MANAGER' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400 font-medium flex items-center gap-2"><Users size={14} />Team Size</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-white">{stats.teamSize}</p></CardContent>
          </Card>
          <Card className="bg-amber-950 border-amber-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-400 font-medium flex items-center gap-2"><Clock size={14} />Pending Approvals</CardTitle></CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-300">{stats.pendingSheets}</p>
              {stats.pendingSheets > 0 && (
                <Link href="/team/approvals"><Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700 text-white">Review Now</Button></Link>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Role: Admin */}
      {role === 'ADMIN' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400 font-medium">Total Employees</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-white">{stats.totalEmployees}</p></CardContent>
          </Card>
          <Card className="bg-blue-950 border-blue-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-400 font-medium">Submitted Sheets</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-blue-300">{stats.submitted}</p></CardContent>
          </Card>
          <Card className="bg-green-950 border-green-800">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-green-400 font-medium">Approved Sheets</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-green-300">{stats.approved}</p></CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader><CardTitle className="text-white text-base">Quick Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {role === 'EMPLOYEE' && (
            <>
              <Link href="/goals"><Button className="bg-indigo-600 hover:bg-indigo-700"><Target size={14} className="mr-2" />Manage Goals</Button></Link>
              <Link href="/checkin"><Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800"><ClipboardCheck size={14} className="mr-2" />Quarterly Check-in</Button></Link>
            </>
          )}
          {role === 'MANAGER' && (
            <>
              <Link href="/team/approvals"><Button className="bg-indigo-600 hover:bg-indigo-700"><CheckCircle size={14} className="mr-2" />Review Approvals</Button></Link>
              <Link href="/team"><Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800"><Users size={14} className="mr-2" />Team Dashboard</Button></Link>
            </>
          )}
          {role === 'ADMIN' && (
            <>
              <Link href="/admin/cycles"><Button className="bg-indigo-600 hover:bg-indigo-700"><Clock size={14} className="mr-2" />Manage Cycles</Button></Link>
              <Link href="/admin/completion"><Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800"><TrendingUp size={14} className="mr-2" />Completion Dashboard</Button></Link>
              <Link href="/analytics"><Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800"><TrendingUp size={14} className="mr-2" />Analytics</Button></Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
