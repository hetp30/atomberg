import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CheckinClient from './CheckinClient'

export default async function CheckinPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const user = session.user as any

  const cycle = await prisma.goalCycle.findFirst({ where: { isActive: true } })
  if (!cycle) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4 text-white">Quarterly Check-in</h1>
        <div className="bg-amber-950/50 p-4 rounded-xl border border-amber-800 text-amber-200">
          No active goal cycle is currently configured.
        </div>
      </div>
    )
  }

  const sheet = await prisma.goalSheet.findFirst({
    where: { employeeId: user.id, cycleId: cycle.id },
    include: { goals: { include: { achievements: true, checkinComments: true } } }
  })

  if (!sheet || sheet.status !== 'APPROVED') {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4 text-white">Quarterly Check-in</h1>
        <div className="bg-amber-950/50 p-4 rounded-xl border border-amber-800 text-amber-200">
          Your goals must be approved by your manager before you can enter quarterly check-ins. Current Status: {sheet?.status || 'Not Created'}
        </div>
      </div>
    )
  }

  return <CheckinClient cycle={cycle} sheet={sheet} />
}
