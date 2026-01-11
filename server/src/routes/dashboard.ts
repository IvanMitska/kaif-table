import { Router } from 'express'
import { prisma } from '../index.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { Prisma } from '@prisma/client'

const router = Router()

router.use(authMiddleware)

// Get dashboard stats
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo } = req.query

    const where: Prisma.TransactionWhereInput = {}
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom as string)
      if (dateTo) where.date.lte = new Date(dateTo as string)
    }

    // Get totals
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
        paymentMethod: true,
      },
    })

    let totalIncome = 0
    let totalExpenses = 0

    transactions.forEach(t => {
      const amount = Number(t.amount)
      if (amount >= 0) {
        totalIncome += amount
      } else {
        totalExpenses += amount
      }
    })

    // Group by category
    const categoryMap = new Map<number, { categoryId: number; categoryName: string; total: number; color?: string }>()
    transactions.forEach(t => {
      const key = t.categoryId
      const existing = categoryMap.get(key)
      if (existing) {
        existing.total += Number(t.amount)
      } else {
        categoryMap.set(key, {
          categoryId: t.categoryId,
          categoryName: t.category.name,
          total: Number(t.amount),
          color: t.category.color || undefined,
        })
      }
    })

    // Group by payment method
    const paymentMethodMap = new Map<number, { paymentMethodId: number; paymentMethodName: string; total: number }>()
    transactions.forEach(t => {
      const key = t.paymentMethodId
      const existing = paymentMethodMap.get(key)
      if (existing) {
        existing.total += Number(t.amount)
      } else {
        paymentMethodMap.set(key, {
          paymentMethodId: t.paymentMethodId,
          paymentMethodName: t.paymentMethod.name,
          total: Number(t.amount),
        })
      }
    })

    // Daily trend
    const dailyMap = new Map<string, { date: string; income: number; expenses: number }>()
    transactions.forEach(t => {
      const dateStr = t.date.toISOString().split('T')[0]
      const existing = dailyMap.get(dateStr)
      const amount = Number(t.amount)
      if (existing) {
        if (amount >= 0) {
          existing.income += amount
        } else {
          existing.expenses += Math.abs(amount)
        }
      } else {
        dailyMap.set(dateStr, {
          date: dateStr,
          income: amount >= 0 ? amount : 0,
          expenses: amount < 0 ? Math.abs(amount) : 0,
        })
      }
    })

    // Sort by date
    const dailyTrend = Array.from(dailyMap.values()).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    res.json({
      totalIncome,
      totalExpenses,
      balance: totalIncome + totalExpenses,
      transactionCount: transactions.length,
      byCategory: Array.from(categoryMap.values()).sort((a, b) => a.total - b.total),
      byPaymentMethod: Array.from(paymentMethodMap.values()),
      dailyTrend,
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ message: 'Failed to get stats' })
  }
})

export default router
