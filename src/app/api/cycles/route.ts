import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const cycles = await prisma.goalCycle.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(cycles)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const data = await req.json()

  // Deactivate existing cycles if this one is being set active
  if (data.isActive) {
    await prisma.goalCycle.updateMany({ data: { isActive: false } })
  }

  const cycle = await prisma.goalCycle.create({
    data: {
      name: data.name,
      phase: data.phase || 'GOAL_SETTING',
      windowOpen: new Date(data.windowOpen),
      windowClose: new Date(data.windowClose),
      isActive: data.isActive || false,
      createdById: user.id,
    },
  })

  return NextResponse.json({ success: true, cycle })
}
