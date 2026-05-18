'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Target,
  ClipboardCheck,
  Users,
  Settings,
  BarChart3,
  LogOut,
  Bell,
  FileText,
  Shield,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const employeeLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/goals', label: 'My Goals', icon: Target },
  { href: '/checkin', label: 'Quarterly Check-in', icon: ClipboardCheck },
  { href: '/progress', label: 'My Progress', icon: BarChart3 },
]

const managerLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/team', label: 'Team Dashboard', icon: Users },
  { href: '/team/approvals', label: 'Goal Approvals', icon: ClipboardCheck },
  { href: '/team/checkins', label: 'Check-in Review', icon: FileText },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

const adminLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/cycles', label: 'Cycle Management', icon: Settings },
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/admin/completion', label: 'Completion Dashboard', icon: ClipboardCheck },
  { href: '/admin/audit', label: 'Audit Trail', icon: Shield },
  { href: '/admin/escalation', label: 'Escalation Rules', icon: Bell },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const user = session?.user as any

  const links =
    user?.role === 'ADMIN' ? adminLinks :
    user?.role === 'MANAGER' ? managerLinks :
    employeeLinks

  const roleColor =
    user?.role === 'ADMIN' ? 'bg-purple-600' :
    user?.role === 'MANAGER' ? 'bg-blue-600' :
    'bg-green-600'

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm">GT</div>
          <div>
            <p className="font-bold text-white text-sm">GoalTrack</p>
            <p className="text-xs text-slate-400">AtomQuest Portal</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
            {user?.name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <Badge className={cn('text-xs mt-0.5', roleColor)}>{user?.role}</Badge>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <p className="text-xs text-slate-500 uppercase font-semibold px-3 mb-2">Navigation</p>
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-all group',
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={12} />}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/50 transition-all w-full"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
