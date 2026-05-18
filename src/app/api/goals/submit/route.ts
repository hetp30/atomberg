import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// POST /api/goals/submit
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as any

  const { sheetId } = await req.json()

  const sheet = await prisma.goalSheet.findUnique({ where: { id: sheetId } })
  if (!sheet) return NextResponse.json({ error: 'Sheet not found' }, { status: 404 })

  // Only the employee owner can submit
  if (sheet.employeeId !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!['DRAFT', 'RETURNED'].includes(sheet.status)) {
    return NextResponse.json({ error: `Cannot submit a sheet with status '${sheet.status}'` }, { status: 409 })
  }

  const updated = await prisma.goalSheet.update({
    where: { id: sheetId },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
  })

  return NextResponse.json({ success: true, sheet: updated })
}
