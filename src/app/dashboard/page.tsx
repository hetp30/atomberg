import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = session.user as any

  const cycle = await prisma.goalCycle.findFirst({ where: { isActive: true } })

  let stats: any = {}

  if (user.role === 'EMPLOYEE') {
    const sheets = await prisma.goalSheet.findMany({
      where: { employeeId: user.id },
      include: { goals: { include: { achievements: true } } },
    })
    const latestSheet = sheets[0]
    const totalGoals = latestSheet?.goals.length || 0
    const approved = latestSheet?.status === 'APPROVED'
    const avgScore = latestSheet?.goals.reduce((acc: number, g) => {
      const latest = g.achievements[g.achievements.length - 1]
      return acc + (latest?.progressScore || 0)
    }, 0) / Math.max(totalGoals, 1)

    stats = { sheetStatus: latestSheet?.status || 'NONE', totalGoals, avgScore: Math.round(avgScore), approved, sheetId: latestSheet?.id }
  }

  if (user.role === 'MANAGER') {
    const pendingSheets = await prisma.goalSheet.count({
      where: { employee: { managerId: user.id }, status: 'SUBMITTED' },
    })
    const teamSize = await prisma.user.count({ where: { managerId: user.id } })
    stats = { pendingSheets, teamSize }
  }

  if (user.role === 'ADMIN') {
    const totalEmployees = await prisma.user.count({ where: { role: 'EMPLOYEE' } })
    const submitted = await prisma.goalSheet.count({ where: { status: 'SUBMITTED' } })
    const approved = await prisma.goalSheet.count({ where: { status: 'APPROVED' } })
    stats = { totalEmployees, submitted, approved }
  }

  return <DashboardClient user={user} cycle={cycle} stats={stats} />
}
