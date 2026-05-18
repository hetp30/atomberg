import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ApprovalClient from './ApprovalClient'

export default async function ApprovalsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const user = session.user as any

  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') redirect('/dashboard')

  // Get all SUBMITTED sheets for team members
  const pendingSheets = await prisma.goalSheet.findMany({
    where: { 
      employee: { managerId: user.id },
      status: 'SUBMITTED'
    },
    include: {
      employee: true,
      cycle: true,
      goals: true
    },
    orderBy: { submittedAt: 'asc' }
  })

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Goal Approvals</h1>
        <p className="text-sm text-slate-400">Review, edit, and approve your team's submitted goal sheets.</p>
      </div>

      {pendingSheets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🎉</div>
          <h3 className="text-lg font-semibold text-white mb-2">All Caught Up!</h3>
          <p className="text-slate-400">There are no pending goal sheet approvals for your team at this time.</p>
        </div>
      ) : (
        <ApprovalClient sheets={pendingSheets} />
      )}
    </div>
  )
}
