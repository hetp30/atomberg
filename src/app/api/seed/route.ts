import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@test.com' } })
    if (existingAdmin) {
      return NextResponse.json({ message: 'Already seeded', seeded: false })
    }

    const hashedPassword = await bcrypt.hash('password123', 10)

    const admin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'ADMIN',
        department: 'HR',
      },
    })

    const manager = await prisma.user.create({
      data: {
        name: 'Manager Mike',
        email: 'manager@test.com',
        password: hashedPassword,
        role: 'MANAGER',
        department: 'Sales',
      },
    })

    const manager2 = await prisma.user.create({
      data: {
        name: 'Manager Priya',
        email: 'manager2@test.com',
        password: hashedPassword,
        role: 'MANAGER',
        department: 'Operations',
      },
    })

    const employee = await prisma.user.create({
      data: {
        name: 'Employee Emma',
        email: 'employee@test.com',
        password: hashedPassword,
        role: 'EMPLOYEE',
        department: 'Sales',
        managerId: manager.id,
      },
    })

    const employee2 = await prisma.user.create({
      data: {
        name: 'Employee Raj',
        email: 'employee2@test.com',
        password: hashedPassword,
        role: 'EMPLOYEE',
        department: 'Sales',
        managerId: manager.id,
      },
    })

    // Create an active goal cycle
    const cycle = await prisma.goalCycle.create({
      data: {
        name: 'FY 2025-26',
        phase: 'GOAL_SETTING',
        windowOpen: new Date('2025-05-01'),
        windowClose: new Date('2025-06-30'),
        isActive: true,
        createdById: admin.id,
      },
    })

    // Create a default escalation rule
    await prisma.escalationRule.create({
      data: {
        triggerType: 'NOT_SUBMITTED',
        daysThreshold: 3,
        notifyChain: 'EMPLOYEE,MANAGER,ADMIN',
        isActive: true,
      },
    })

    return NextResponse.json({
      message: 'Database seeded successfully!',
      seeded: true,
      credentials: [
        { role: 'Employee', email: 'employee@test.com', password: 'password123' },
        { role: 'Manager', email: 'manager@test.com', password: 'password123' },
        { role: 'Admin', email: 'admin@test.com', password: 'password123' },
      ],
    })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
