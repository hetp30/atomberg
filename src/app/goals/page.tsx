import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import GoalFormClient from './GoalFormClient'

export default async function GoalsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const cycle = await prisma.goalCycle.findFirst({ where: { isActive: true } })
  if (!cycle) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4 text-white">My Goals</h1>
        <div className="bg-amber-950/50 p-4 rounded-xl border border-amber-800 text-amber-200">
          No active goal cycle is currently configured. Please contact your administrator.
        </div>
      </div>
    )
  }

  const existingSheet = await prisma.goalSheet.findFirst({
    where: { employeeId: (session.user as any).id, cycleId: cycle.id },
    include: { goals: true }
  })

  return <GoalFormClient cycle={cycle} existingSheet={existingSheet} />
}
