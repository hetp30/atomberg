import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { STATUS_COLORS } from '@/lib/goalUtils'

export default async function CompletionDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const user = session.user as any
  if (user.role !== 'ADMIN') redirect('/dashboard')

  // Fetch all employees and their goal sheets + achievements
  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    include: {
      manager: true,
      goalSheets: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { goals: { include: { achievements: true } } }
      }
    }
  })

  // Format data for the dashboard
  const data = employees.map(emp => {
    const sheet = emp.goalSheets[0]
    
    // Check if achievements exist for Q1, Q2, Q3, Q4
    const checkins = { Q1: false, Q2: false, Q3: false, Q4: false }
    
    if (sheet && sheet.status === 'APPROVED') {
      sheet.goals.forEach(goal => {
        goal.achievements.forEach(ach => {
          if (ach.actualValue) checkins[ach.cyclePhase as keyof typeof checkins] = true
        })
      })
    }

    return {
      id: emp.id,
      name: emp.name,
      department: emp.department,
      managerName: emp.manager?.name || 'Unassigned',
      sheetStatus: sheet?.status || 'NOT_CREATED',
      checkins
    }
  })

  const submittedCount = data.filter(d => d.sheetStatus === 'SUBMITTED' || d.sheetStatus === 'APPROVED' || d.sheetStatus === 'LOCKED').length
  const percentSubmitted = data.length > 0 ? Math.round((submittedCount / data.length) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Completion Dashboard</h1>
          <p className="text-sm text-slate-400">Track organization-wide goal and check-in completion.</p>
        </div>
        {/* Real CSV export would go here, stub for demo */}
        <button className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2 px-4 rounded-lg border border-slate-700 transition-colors">
          Download CSV Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">Total Employees</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{data.length}</p></CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">Sheets Submitted</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-white">{submittedCount} <span className="text-lg text-slate-500">({percentSubmitted}%)</span></p></CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">Fully Approved</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-400">{data.filter(d => d.sheetStatus === 'APPROVED').length}</p></CardContent>
        </Card>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Manager</th>
                <th className="px-6 py-4">Sheet Status</th>
                <th className="px-6 py-4 text-center">Q1</th>
                <th className="px-6 py-4 text-center">Q2</th>
                <th className="px-6 py-4 text-center">Q3</th>
                <th className="px-6 py-4 text-center">Q4</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.map(row => (
                <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{row.name}</td>
                  <td className="px-6 py-4">{row.department}</td>
                  <td className="px-6 py-4">{row.managerName}</td>
                  <td className="px-6 py-4">
                    <Badge className={STATUS_COLORS[row.sheetStatus] || 'bg-slate-700'}>{row.sheetStatus.replace('_', ' ')}</Badge>
                  </td>
                  {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                    <td key={q} className="px-6 py-4 text-center">
                      {row.checkins[q as keyof typeof row.checkins] ? (
                        <div className="w-6 h-6 rounded-full bg-green-900/50 text-green-400 flex items-center justify-center mx-auto text-xs font-bold">✓</div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-600 flex items-center justify-center mx-auto text-xs">-</div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
