import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { computeProgressScore } from '@/lib/goalUtils'

// POST /api/achievements — upsert achievement for a goal/phase
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any

  const { goalId, cyclePhase, actualValue, status } = await req.json()

  // RULE: Only employees can enter actuals
  if (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // RULE: Goal must be APPROVED to enter check-in
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { sheet: { include: { cycle: true } } },
  })
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  if (goal.sheet.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Goal is not approved — cannot enter check-in data' }, { status: 403 })
  }

  // RULE: Check window is open
  const cycle = goal.sheet.cycle
  const now = new Date()
  if (now < new Date(cycle.windowOpen) || now > new Date(cycle.windowClose)) {
    return NextResponse.json({
      error: `Check-in window is currently closed. Opens: ${new Date(cycle.windowOpen).toLocaleDateString()}, Closes: ${new Date(cycle.windowClose).toLocaleDateString()}`,
    }, { status: 403 })
  }

  const progressScore = computeProgressScore(goal.uomType as any, goal.target, actualValue)

  const achievement = await prisma.achievement.upsert({
    where: { goalId_cyclePhase: { goalId, cyclePhase } },
    update: { actualValue, progressScore, status, updatedAt: new Date() },
    create: { goalId, cyclePhase, actualValue, progressScore, status },
  })

  return NextResponse.json({ success: true, achievement })
}

// GET /api/achievements?goalId=X or ?employeeId=X
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const goalId = url.searchParams.get('goalId')
  const employeeId = url.searchParams.get('employeeId')

  if (goalId) {
    const achievements = await prisma.achievement.findMany({ where: { goalId } })
    return NextResponse.json(achievements)
  }
  if (employeeId) {
    const achievements = await prisma.achievement.findMany({
      where: { goal: { sheet: { employeeId } } },
      include: { goal: true },
    })
    return NextResponse.json(achievements)
  }

  return NextResponse.json([])
}
