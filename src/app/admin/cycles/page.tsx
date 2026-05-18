import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CycleClient from './CycleClient'

export default async function CyclesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  const user = session.user as any
  if (user.role !== 'ADMIN') redirect('/dashboard')

  const cycles = await prisma.goalCycle.findMany({ orderBy: { createdAt: 'desc' } })
  
  return <CycleClient initialCycles={cycles} />
}
