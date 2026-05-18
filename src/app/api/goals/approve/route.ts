import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { validateGoalSheet } from '@/lib/goalUtils'

// POST /api/goals/approve — approve or return a goal sheet
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any

  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Managers only' }, { status: 403 })
  }

  const { sheetId, action, returnComment, updatedGoals } = await req.json()

  const sheet = await prisma.goalSheet.findUnique({
    where: { id: sheetId },
    include: { goals: true, employee: true },
  })
  if (!sheet) return NextResponse.json({ error: 'Sheet not found' }, { status: 404 })

  // RULE: Only manager of this employee can approve (unless Admin)
  if (user.role === 'MANAGER' && sheet.employee.managerId !== user.id) {
    return NextResponse.json({ error: 'Not your team member' }, { status: 403 })
  }

  // RULE: Can only act on SUBMITTED sheets
  if (sheet.status !== 'SUBMITTED') {
    return NextResponse.json({ error: `Sheet status is '${sheet.status}' — can only act on SUBMITTED sheets` }, { status: 409 })
  }

  if (action === 'RETURN') {
    if (!returnComment?.trim()) {
      return NextResponse.json({ error: 'A comment is required when returning a goal sheet.' }, { status: 400 })
    }
    await prisma.goalSheet.update({
      where: { id: sheetId },
      data: { status: 'RETURNED', returnComment },
    })
    return NextResponse.json({ success: true, status: 'RETURNED' })
  }

  if (action === 'APPROVE') {
    // Manager may have edited targets/weightages inline
    if (updatedGoals && Array.isArray(updatedGoals)) {
      const validation = validateGoalSheet(updatedGoals)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.errors.join(' | ') }, { status: 400 })
      }
      // Update goals in transaction
      await prisma.$transaction(
        updatedGoals.map((g: any) =>
          prisma.goal.update({
            where: { id: g.id },
            data: { target: g.target, weightage: Number(g.weightage) },
          })
        )
      )
    }

    const updatedSheet = await prisma.goalSheet.update({
      where: { id: sheetId },
      data: {
        status: 'APPROVED',
        approvedById: user.id,
        approvedAt: new Date(),
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'goal_sheet',
        entityId: sheetId,
        changedById: user.id,
        changeType: 'APPROVE',
        oldValue: JSON.stringify({ status: 'SUBMITTED' }),
        newValue: JSON.stringify({ status: 'APPROVED' }),
      },
    })

    return NextResponse.json({ success: true, status: 'APPROVED' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
