import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create categories from Excel
  const categories = [
    { name: 'BAR', type: 'EXPENSE' as const, color: '#ef4444' },
    { name: 'KITCHEN', type: 'EXPENSE' as const, color: '#f97316' },
    { name: 'STAFF', type: 'EXPENSE' as const, color: '#eab308' },
    { name: 'General expenses', type: 'EXPENSE' as const, color: '#84cc16' },
    { name: 'Ice Bath', type: 'EXPENSE' as const, color: '#22c55e' },
    { name: 'BEAUTY SALON', type: 'EXPENSE' as const, color: '#14b8a6' },
    { name: 'Housekeeping', type: 'EXPENSE' as const, color: '#06b6d4' },
    { name: 'GYM & POOL', type: 'EXPENSE' as const, color: '#3b82f6' },
    { name: 'MASSAGE ROOM', type: 'EXPENSE' as const, color: '#6366f1' },
    { name: 'STEAM ROOMS', type: 'EXPENSE' as const, color: '#8b5cf6' },
    { name: 'FIGHT CLUB', type: 'EXPENSE' as const, color: '#a855f7' },
    { name: 'DANCE STUDIO', type: 'EXPENSE' as const, color: '#d946ef' },
    { name: 'FITNESS BAR', type: 'EXPENSE' as const, color: '#ec4899' },
    { name: 'Revenue', type: 'INCOME' as const, color: '#10b981' },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }
  console.log('Categories created')

  // Create payment methods
  const paymentMethods = [
    { name: 'Cash box' },
    { name: 'Safe' },
    { name: 'Bank transfer' },
  ]

  for (const pm of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { name: pm.name },
      update: {},
      create: pm,
    })
  }
  console.log('Payment methods created')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@kaif.com' },
    update: {},
    create: {
      email: 'admin@kaif.com',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
    },
  })
  console.log('Admin user created: admin@kaif.com / admin123')

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
