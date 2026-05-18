import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { validateGoalSheet } from '@/lib/goalUtils'

// POST /api/goals — create goal sheet with goals
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  if (user.role !== 'EMPLOYEE' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { goals, cycleId } = await req.json()

  // Validate — enforced at API level
  const validation = validateGoalSheet(goals)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.errors.join(' | ') }, { status: 400 })
  }

  // Check for existing sheet in this cycle
  const existing = await prisma.goalSheet.findFirst({
    where: { employeeId: user.id, cycleId },
  })

  if (existing) {
    if (existing.status !== 'DRAFT' && existing.status !== 'RETURNED') {
      return NextResponse.json({ error: 'Cannot modify a submitted or approved sheet.' }, { status: 409 })
    }
    
    // Update existing sheet: delete old goals and recreate them
    await prisma.goal.deleteMany({ where: { sheetId: existing.id, isShared: false } })
    
    const updatedSheet = await prisma.goalSheet.update({
      where: { id: existing.id },
      data: {
        totalWeightage: validation.total,
        goals: {
          create: goals.filter((g: any) => !g.isShared).map((g: any) => ({
            title: g.title,
            thrustArea: g.thrustArea || 'Financial',
            description: g.description || '',
            uomType: g.uomType || 'MIN',
            target: g.target,
            weightage: Number(g.weightage),
          })),
        }
      },
      include: { goals: true }
    })
    
    return NextResponse.json({ success: true, sheet: updatedSheet })
  }

  const sheet = await prisma.goalSheet.create({
    data: {
      employeeId: user.id,
      cycleId,
      totalWeightage: validation.total,
      goals: {
        create: goals.map((g: any) => ({
          title: g.title,
          thrustArea: g.thrustArea || 'Financial',
          description: g.description || '',
          uomType: g.uomType || 'MIN',
          target: g.target,
          weightage: Number(g.weightage),
        })),
      },
    },
    include: { goals: true },
  })

  return NextResponse.json({ success: true, sheet })
}

// GET /api/goals?employeeId=X or ?managerId=X
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const url = new URL(req.url)
  const employeeId = url.searchParams.get('employeeId')
  const managerId = url.searchParams.get('managerId')

  let sheets

  if (managerId && (user.role === 'MANAGER' || user.role === 'ADMIN')) {
    sheets = await prisma.goalSheet.findMany({
      where: { employee: { managerId } },
      include: { goals: true, employee: true, cycle: true },
      orderBy: { updatedAt: 'desc' },
    })
  } else {
    // Employee sees their own sheets
    const targetId = employeeId === user.id || user.role === 'ADMIN' ? employeeId || user.id : user.id
    sheets = await prisma.goalSheet.findMany({
      where: { employeeId: targetId },
      include: { goals: true, employee: true, cycle: true },
      orderBy: { updatedAt: 'desc' },
    })
  }

  return NextResponse.json(sheets)
}
