import { Router } from 'express'
import { prisma } from '../index.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import { IikoService, initIikoService, getIikoService } from '../services/iikoService.js'
import crypto from 'crypto'

const router = Router()

router.use(authMiddleware)

// Helper to hash password with SHA1 (iiko requirement)
function sha1Hash(password: string): string {
  return crypto.createHash('sha1').update(password).digest('hex')
}

// Get iiko settings
router.get('/settings', async (_req: AuthRequest, res) => {
  try {
    const settings = await prisma.iikoSettings.findFirst({
      where: { isActive: true },
    })

    if (!settings) {
      return res.json(null)
    }

    // Don't send the password hash to client
    res.json({
      id: settings.id,
      serverUrl: settings.serverUrl,
      login: settings.login,
      isActive: settings.isActive,
      lastSyncAt: settings.lastSyncAt,
    })
  } catch (error) {
    console.error('Get iiko settings error:', error)
    res.status(500).json({ message: 'Failed to get iiko settings' })
  }
})

// Save iiko settings
router.post('/settings', async (req: AuthRequest, res) => {
  try {
    const { serverUrl: rawUrl, login: rawLogin, password } = req.body

    // Clean up inputs
    const serverUrl = rawUrl?.trim().replace(/\/+$/, '') // Remove trailing slashes
    const login = rawLogin?.trim()

    if (!serverUrl || !login || !password) {
      return res.status(400).json({ message: 'Server URL, login and password are required' })
    }

    // Hash the password
    const passwordHash = sha1Hash(password)

    // Check if settings already exist
    const existing = await prisma.iikoSettings.findFirst()

    let settings
    if (existing) {
      settings = await prisma.iikoSettings.update({
        where: { id: existing.id },
        data: {
          serverUrl,
          login,
          passwordHash,
          isActive: true,
        },
      })
    } else {
      settings = await prisma.iikoSettings.create({
        data: {
          serverUrl,
          login,
          passwordHash,
          isActive: true,
        },
      })
    }

    // Initialize the iiko service with new settings
    initIikoService({
      serverUrl: settings.serverUrl,
      login: settings.login,
      password: settings.passwordHash,
    })

    res.json({
      id: settings.id,
      serverUrl: settings.serverUrl,
      login: settings.login,
      isActive: settings.isActive,
      lastSyncAt: settings.lastSyncAt,
    })
  } catch (error) {
    console.error('Save iiko settings error:', error)
    res.status(500).json({ message: 'Failed to save iiko settings' })
  }
})

// Test iiko connection
router.post('/test-connection', async (_req: AuthRequest, res) => {
  try {
    const settings = await prisma.iikoSettings.findFirst({
      where: { isActive: true },
    })

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'iiko settings not configured'
      })
    }

    const service = new IikoService({
      serverUrl: settings.serverUrl,
      login: settings.login,
      password: settings.passwordHash,
    })

    const result = await service.testConnection()
    res.json(result)
  } catch (error) {
    console.error('Test connection error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to test connection'
    })
  }
})

// Sync sales data from iiko
router.post('/sync', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo } = req.body

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ message: 'Date range is required' })
    }

    const settings = await prisma.iikoSettings.findFirst({
      where: { isActive: true },
    })

    if (!settings) {
      return res.status(400).json({ message: 'iiko settings not configured' })
    }

    const service = new IikoService({
      serverUrl: settings.serverUrl,
      login: settings.login,
      password: settings.passwordHash,
    })

    // Get sales report from iiko
    const report = await service.getSalesReport({ dateFrom, dateTo })

    // Delete existing sales for this period to avoid duplicates
    await prisma.iikoSale.deleteMany({
      where: {
        openTime: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo + 'T23:59:59'),
        },
      },
    })

    // Insert new sales data
    if (report.data.length > 0) {
      await prisma.iikoSale.createMany({
        data: report.data.map(item => ({
          dishId: item.dishId || '',
          dishName: item.dishName || '',
          dishCode: item.dishCode || null,
          dishCategory: item.dishCategory || '',
          dishCategoryId: item.dishCategoryId || null,
          dishGroup: item.dishGroup || null,
          dishGroupId: item.dishGroupId || null,
          quantity: item.quantity || 0,
          amount: item.amount || 0,
          discountSum: item.discountSum || 0,
          orderNum: String(item.orderNum || ''),
          openTime: new Date(item.openTime),
          departmentId: item.departmentId || null,
          departmentName: item.departmentName || null,
        })),
      })
    }

    // Update last sync time
    await prisma.iikoSettings.update({
      where: { id: settings.id },
      data: { lastSyncAt: new Date() },
    })

    // Logout from iiko
    await service.logout()

    res.json({
      success: true,
      itemsImported: report.data.length,
      summary: report.summary,
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    const message = error.message || 'Failed to sync data from iiko'
    res.status(500).json({ message })
  }
})

// Get iiko sales data (already imported)
router.get('/sales', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo, category, groupBy } = req.query

    const where: any = {}

    if (dateFrom && dateTo) {
      where.openTime = {
        gte: new Date(dateFrom as string),
        lte: new Date((dateTo as string) + 'T23:59:59'),
      }
    }

    if (category) {
      where.dishCategory = category
    }

    const sales = await prisma.iikoSale.findMany({
      where,
      orderBy: { openTime: 'desc' },
    })

    // Calculate summary
    const summary = {
      totalAmount: sales.reduce((sum: number, s) => sum + s.amount, 0),
      totalQuantity: sales.reduce((sum: number, s) => sum + s.quantity, 0),
      totalDiscount: sales.reduce((sum: number, s) => sum + s.discountSum, 0),
      orderCount: new Set(sales.map((s) => s.orderNum)).size,
    }

    // Group by category if requested
    let byCategory: any[] = []
    if (groupBy === 'category') {
      const categoryMap = new Map<string, { amount: number; quantity: number }>()
      for (const sale of sales) {
        const existing = categoryMap.get(sale.dishCategory) || { amount: 0, quantity: 0 }
        categoryMap.set(sale.dishCategory, {
          amount: existing.amount + sale.amount,
          quantity: existing.quantity + sale.quantity,
        })
      }
      byCategory = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.amount - a.amount)
    }

    res.json({
      sales: groupBy ? [] : sales,
      summary,
      byCategory,
    })
  } catch (error) {
    console.error('Get iiko sales error:', error)
    res.status(500).json({ message: 'Failed to get iiko sales' })
  }
})

// Get revenue summary for dashboard
router.get('/revenue', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo } = req.query

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ message: 'Date range is required' })
    }

    const sales = await prisma.iikoSale.findMany({
      where: {
        openTime: {
          gte: new Date(dateFrom as string),
          lte: new Date((dateTo as string) + 'T23:59:59'),
        },
      },
    })

    // Calculate totals
    const totalRevenue = sales.reduce((sum: number, s) => sum + s.amount, 0)
    const totalQuantity = sales.reduce((sum: number, s) => sum + s.quantity, 0)
    const orderCount = new Set(sales.map((s) => s.orderNum)).size
    const averageCheck = orderCount > 0 ? totalRevenue / orderCount : 0

    // Group by category
    const categoryMap = new Map<string, { amount: number; quantity: number }>()
    for (const sale of sales) {
      const existing = categoryMap.get(sale.dishCategory) || { amount: 0, quantity: 0 }
      categoryMap.set(sale.dishCategory, {
        amount: existing.amount + sale.amount,
        quantity: existing.quantity + sale.quantity,
      })
    }

    // Group by day
    const dailyMap = new Map<string, number>()
    for (const sale of sales) {
      const day = sale.openTime.toISOString().split('T')[0]
      dailyMap.set(day, (dailyMap.get(day) || 0) + sale.amount)
    }

    // Group by hour
    const hourMap = new Map<number, number>()
    for (const sale of sales) {
      const hour = sale.openTime.getHours()
      hourMap.set(hour, (hourMap.get(hour) || 0) + sale.amount)
    }

    res.json({
      totalRevenue,
      totalQuantity,
      orderCount,
      averageCheck,
      byCategory: Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.amount - a.amount),
      byDay: Array.from(dailyMap.entries())
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      byHour: Array.from(hourMap.entries())
        .map(([hour, amount]) => ({ hour, amount }))
        .sort((a, b) => a.hour - b.hour),
    })
  } catch (error) {
    console.error('Get revenue error:', error)
    res.status(500).json({ message: 'Failed to get revenue data' })
  }
})

// Get raw OLAP data directly from iiko (for debugging/comparison)
router.get('/raw-olap', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo } = req.query

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ message: 'Date range is required' })
    }

    const settings = await prisma.iikoSettings.findFirst({
      where: { isActive: true },
    })

    if (!settings) {
      return res.status(400).json({ message: 'iiko settings not configured' })
    }

    const service = new IikoService({
      serverUrl: settings.serverUrl,
      login: settings.login,
      password: settings.passwordHash,
    })

    const rawData = await service.getRawOlapReport({
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    })

    // Logout from iiko
    await service.logout()

    // Return first 20 rows for inspection
    const rows = rawData.response.data || rawData.response.rows || []
    const sampleRows = rows.slice(0, 20)

    // Analyze OrderDeleted and Storned values
    const deletedValues = new Set<string>()
    const stornedValues = new Set<string>()
    for (const row of rows) {
      if (row['OrderDeleted']) deletedValues.add(String(row['OrderDeleted']))
      if (row['Storned']) stornedValues.add(String(row['Storned']))
    }

    res.json({
      totalRows: rawData.rowCount,
      sampleRows,
      uniqueDeletedValues: Array.from(deletedValues),
      uniqueStornedValues: Array.from(stornedValues),
      requestBody: rawData.requestBody,
    })
  } catch (error: any) {
    console.error('Raw OLAP error:', error)
    res.status(500).json({ message: error.message || 'Failed to get raw OLAP data' })
  }
})

// Debug endpoint to see raw data samples
router.get('/debug', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo } = req.query

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ message: 'Date range is required' })
    }

    // Get sample of raw sales data
    const sampleSales = await prisma.iikoSale.findMany({
      where: {
        openTime: {
          gte: new Date(dateFrom as string),
          lte: new Date((dateTo as string) + 'T23:59:59'),
        },
      },
      take: 50,
      orderBy: { amount: 'desc' },
    })

    // Get all sales for stats
    const allSales = await prisma.iikoSale.findMany({
      where: {
        openTime: {
          gte: new Date(dateFrom as string),
          lte: new Date((dateTo as string) + 'T23:59:59'),
        },
      },
    })

    // Check for potential duplicates (same orderNum + dishName)
    const duplicateCheck = new Map<string, number>()
    for (const sale of allSales) {
      const key = `${sale.orderNum}-${sale.dishName}`
      duplicateCheck.set(key, (duplicateCheck.get(key) || 0) + 1)
    }
    const duplicates = Array.from(duplicateCheck.entries())
      .filter(([_, count]) => count > 1)
      .slice(0, 20)

    // Get unique categories
    const categories = [...new Set(allSales.map(s => s.dishCategory))].sort()

    // Stats by category
    const categoryStats = new Map<string, { count: number; totalAmount: number; avgAmount: number }>()
    for (const sale of allSales) {
      const existing = categoryStats.get(sale.dishCategory) || { count: 0, totalAmount: 0, avgAmount: 0 }
      categoryStats.set(sale.dishCategory, {
        count: existing.count + 1,
        totalAmount: existing.totalAmount + sale.amount,
        avgAmount: 0,
      })
    }
    for (const [cat, stats] of categoryStats) {
      stats.avgAmount = stats.totalAmount / stats.count
    }

    // Check amount ranges
    const amounts = allSales.map(s => s.amount)
    const minAmount = Math.min(...amounts)
    const maxAmount = Math.max(...amounts)
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length

    res.json({
      totalRecords: allSales.length,
      sampleSales: sampleSales.map(s => ({
        dishName: s.dishName,
        dishCategory: s.dishCategory,
        quantity: s.quantity,
        amount: s.amount,
        discountSum: s.discountSum,
        orderNum: s.orderNum,
        openTime: s.openTime,
      })),
      categories,
      categoryStats: Array.from(categoryStats.entries()).map(([cat, stats]) => ({
        category: cat,
        ...stats,
      })).sort((a, b) => b.totalAmount - a.totalAmount),
      amountStats: {
        min: minAmount,
        max: maxAmount,
        avg: avgAmount,
      },
      potentialDuplicates: duplicates,
    })
  } catch (error) {
    console.error('Debug error:', error)
    res.status(500).json({ message: 'Debug failed' })
  }
})

// Get top selling items
router.get('/top-items', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo, limit = '10' } = req.query

    if (!dateFrom || !dateTo) {
      return res.status(400).json({ message: 'Date range is required' })
    }

    const sales = await prisma.iikoSale.findMany({
      where: {
        openTime: {
          gte: new Date(dateFrom as string),
          lte: new Date((dateTo as string) + 'T23:59:59'),
        },
      },
    })

    // Group by dish
    const dishMap = new Map<string, {
      dishId: string
      dishName: string
      category: string
      quantity: number
      amount: number
    }>()

    for (const sale of sales) {
      const key = sale.dishId || sale.dishName
      const existing = dishMap.get(key) || {
        dishId: sale.dishId,
        dishName: sale.dishName,
        category: sale.dishCategory,
        quantity: 0,
        amount: 0,
      }
      dishMap.set(key, {
        ...existing,
        quantity: existing.quantity + sale.quantity,
        amount: existing.amount + sale.amount,
      })
    }

    const topItems = Array.from(dishMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, parseInt(limit as string))

    res.json(topItems)
  } catch (error) {
    console.error('Get top items error:', error)
    res.status(500).json({ message: 'Failed to get top items' })
  }
})

export default router
