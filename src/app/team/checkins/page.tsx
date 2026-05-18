import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function ManagerCheckinsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const user = session.user as any

  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') redirect('/dashboard')

  // This is a placeholder since the detailed check-in review page is large.
  // We'll show a message that they should use the completion dashboard.
  // In a full build, this would be `CheckinReviewClient.tsx`
  
  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Team Check-ins</h1>
        <p className="text-sm text-slate-400">Review quarterly actuals submitted by your team.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Check-in Module</h3>
        <p className="text-slate-400 mb-4">Please use the Admin Completion Dashboard to view overall check-in status across your team.</p>
      </div>
    </div>
  )
}
