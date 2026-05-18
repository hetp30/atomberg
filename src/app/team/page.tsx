import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { STATUS_COLORS } from '@/lib/goalUtils'

export default async function TeamDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const user = session.user as any

  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const team = await prisma.user.findMany({
    where: { managerId: user.id },
    include: {
      goalSheets: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { goals: { include: { achievements: true } } }
      }
    }
  })

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Team Dashboard</h1>
          <p className="text-sm text-slate-400">Overview of your direct reports and their goal status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.map(member => {
          const sheet = member.goalSheets[0]
          const status = sheet?.status || 'NOT CREATED'
          
          return (
            <Card key={member.id} className="bg-slate-900 border-slate-800 shadow-sm hover:border-indigo-500/50 transition-colors">
              <CardHeader className="pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-900 flex items-center justify-center text-sm font-bold text-indigo-300">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-base text-white">{member.name}</CardTitle>
                    <p className="text-xs text-slate-400">{member.department} • Employee</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-slate-400">Goal Sheet</span>
                  <Badge className={STATUS_COLORS[status] || 'bg-slate-700'}>{status}</Badge>
                </div>
                
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm text-slate-400">Total Goals</span>
                  <span className="font-mono text-white">{sheet?.goals.length || 0}/8</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {status === 'SUBMITTED' ? (
                    <Link href={`/team/approvals`} className="col-span-2">
                      <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">Review & Approve</Button>
                    </Link>
                  ) : status === 'APPROVED' ? (
                    <Link href={`/team/checkins`} className="col-span-2">
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Review Check-ins</Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full col-span-2 bg-slate-800 text-slate-500">Waiting for Employee</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {team.length === 0 && (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">No Direct Reports</h3>
            <p className="text-slate-400">You do not currently have any employees assigned to you in the system.</p>
          </div>
        )}
      </div>
    </div>
  )
}
