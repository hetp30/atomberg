const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  console.log('Total users:', users.length)
  for (const user of users) {
    const match = await bcrypt.compare('password123', user.password)
    console.log(`User: ${user.email}, Password Match: ${match}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
