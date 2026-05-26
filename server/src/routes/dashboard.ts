import { Router } from 'express'
import { prisma } from '../index.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { Prisma } from '@prisma/client'

const router = Router()

router.use(authMiddleware)

// Get dashboard stats.
//
// Income comes from iiko sales (the IikoSale table, populated by sync).
// Expenses come from manually-entered Transaction rows (negative amounts).
// This split matches how the business operates: revenue is automated via
// the iiko POS integration, costs are recorded by hand.
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo } = req.query

    const txWhere: Prisma.TransactionWhereInput = {}
    if (dateFrom || dateTo) {
      txWhere.date = {}
      if (dateFrom) txWhere.date.gte = new Date(dateFrom as string)
      if (dateTo) txWhere.date.lte = new Date(dateTo as string)
    }

    const iikoWhere: Prisma.IikoSaleWhereInput = {}
    if (dateFrom || dateTo) {
      iikoWhere.openTime = {}
      if (dateFrom) iikoWhere.openTime.gte = new Date(dateFrom as string)
      if (dateTo) iikoWhere.openTime.lte = new Date((dateTo as string) + 'T23:59:59')
    }

    const [transactions, iikoSales] = await Promise.all([
      prisma.transaction.findMany({
        where: txWhere,
        include: { category: true, paymentMethod: true },
      }),
      prisma.iikoSale.findMany({ where: iikoWhere }),
    ])

    // — Totals —
    const totalIncome = iikoSales.reduce((sum, s) => sum + s.amount, 0)

    let totalExpenses = 0
    transactions.forEach((t) => {
      const amount = Number(t.amount)
      if (amount < 0) totalExpenses += amount
    })

    // — Category breakdown (expenses only, from manual transactions) —
    const categoryMap = new Map<
      number,
      { categoryId: number; categoryName: string; total: number; color?: string }
    >()
    transactions.forEach((t) => {
      const amount = Number(t.amount)
      if (amount >= 0) return // skip non-expense rows
      const key = t.categoryId
      const existing = categoryMap.get(key)
      if (existing) {
        existing.total += amount
      } else {
        categoryMap.set(key, {
          categoryId: t.categoryId,
          categoryName: t.category.name,
          total: amount,
          color: t.category.color || undefined,
        })
      }
    })

    // — Payment-method breakdown (across all manual transactions) —
    const paymentMethodMap = new Map<
      number,
      { paymentMethodId: number; paymentMethodName: string; total: number }
    >()
    transactions.forEach((t) => {
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

    // — Daily trend: income line from iiko, expenses line from transactions —
    const dailyMap = new Map<string, { date: string; income: number; expenses: number }>()
    const upsertDay = (dateStr: string) => {
      let row = dailyMap.get(dateStr)
      if (!row) {
        row = { date: dateStr, income: 0, expenses: 0 }
        dailyMap.set(dateStr, row)
      }
      return row
    }
    iikoSales.forEach((s) => {
      const dateStr = s.openTime.toISOString().split('T')[0]
      upsertDay(dateStr).income += s.amount
    })
    transactions.forEach((t) => {
      const amount = Number(t.amount)
      if (amount >= 0) return
      const dateStr = t.date.toISOString().split('T')[0]
      upsertDay(dateStr).expenses += Math.abs(amount)
    })

    const dailyTrend = Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    // — iiko-derived extras (let the UI show order count / avg check / etc.) —
    const iikoOrderCount = new Set(iikoSales.map((s) => s.orderNum)).size
    const iikoAverageCheck = iikoOrderCount > 0 ? totalIncome / iikoOrderCount : 0

    // — Revenue by iiko dish category — useful as a calm pie/list on dashboard —
    const iikoCategoryMap = new Map<string, number>()
    iikoSales.forEach((s) => {
      iikoCategoryMap.set(
        s.dishCategory,
        (iikoCategoryMap.get(s.dishCategory) || 0) + s.amount,
      )
    })
    const iikoRevenueByCategory = Array.from(iikoCategoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)

    res.json({
      totalIncome,
      totalExpenses,
      balance: totalIncome + totalExpenses,
      transactionCount: transactions.length,
      byCategory: Array.from(categoryMap.values()).sort((a, b) => a.total - b.total),
      byPaymentMethod: Array.from(paymentMethodMap.values()),
      dailyTrend,
      // iiko-side stats
      iikoOrderCount,
      iikoAverageCheck,
      iikoRevenueByCategory,
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ message: 'Failed to get stats' })
  }
})

export default router
