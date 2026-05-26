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
          // Extended fields for deep analytics (verified working with iiko Syrve)
          waiterId: item.waiterId || null,
          waiterName: item.waiterName || null,
          paymentType: item.paymentType || null,
          orderType: item.orderType || null,
          tableNum: item.tableNum || null,
          guestCount: item.guestCount || null,
          closeTime: item.closeTime ? new Date(item.closeTime) : null,
          discountType: item.discountType || null,
          sessionNum: item.sessionNum || null,
          productCost: item.productCost || null,
          // Additional analytics fields
          cookingPlace: (item as any).cookingPlace || null,
          nonCashPaymentType: (item as any).nonCashPaymentType || null,
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

    // Group by category with order count for average check
    const categoryMap = new Map<string, { amount: number; quantity: number; orders: Set<string> }>()
    for (const sale of sales) {
      const existing = categoryMap.get(sale.dishCategory) || { amount: 0, quantity: 0, orders: new Set<string>() }
      existing.amount += sale.amount
      existing.quantity += sale.quantity
      existing.orders.add(sale.orderNum)
      categoryMap.set(sale.dishCategory, existing)
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
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          quantity: data.quantity,
          orderCount: data.orders.size,
          averageCheck: data.orders.size > 0 ? data.amount / data.orders.size : 0,
        }))
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

// Try alternative iiko APIs for comparison
router.get('/alt-api', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo, type = 'sales' } = req.query

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

    let result
    if (type === 'orders') {
      result = await service.getOrders({
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      })
    } else if (type === 'daily') {
      // Use the accurate "Отчет по дням новый" report
      result = await service.getDailyReport({
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      })
    } else if (type === 'session') {
      // Get close session data
      result = await service.getCloseSessionData({
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      })
    } else {
      result = await service.getSalesByDepartment({
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      })
    }

    await service.logout()

    res.json({ type, dateFrom, dateTo, result })
  } catch (error: any) {
    console.error('Alt API error:', error)
    res.status(500).json({ message: error.message || 'Failed to get data' })
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

// ==================== EXTENDED ANALYTICS ====================

// Get analytics by waiters
router.get('/analytics/waiters', async (req: AuthRequest, res) => {
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

    // Group by waiter
    const waiterMap = new Map<string, {
      waiterId: string
      waiterName: string
      revenue: number
      quantity: number
      orders: Set<string>
      guestCount: number
    }>()

    for (const sale of sales) {
      const key = sale.waiterId || sale.waiterName || 'unknown'
      const existing = waiterMap.get(key) || {
        waiterId: sale.waiterId || '',
        waiterName: sale.waiterName || 'Неизвестно',
        revenue: 0,
        quantity: 0,
        orders: new Set<string>(),
        guestCount: 0,
      }
      existing.revenue += sale.amount
      existing.quantity += sale.quantity
      existing.orders.add(sale.orderNum)
      if (sale.guestCount && !existing.orders.has(sale.orderNum)) {
        existing.guestCount += sale.guestCount
      }
      waiterMap.set(key, existing)
    }

    const byWaiter = Array.from(waiterMap.values())
      .filter(w => w.waiterName && w.waiterName !== 'Неизвестно')
      .map(w => ({
        waiterId: w.waiterId,
        waiterName: w.waiterName,
        revenue: w.revenue,
        quantity: w.quantity,
        orderCount: w.orders.size,
        averageCheck: w.orders.size > 0 ? w.revenue / w.orders.size : 0,
        guestCount: w.guestCount,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    res.json({
      byWaiter,
      totalWaiters: byWaiter.length,
    })
  } catch (error) {
    console.error('Get waiter analytics error:', error)
    res.status(500).json({ message: 'Failed to get waiter analytics' })
  }
})

// Get analytics by payment types
router.get('/analytics/payments', async (req: AuthRequest, res) => {
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

    // Group by payment type
    const paymentMap = new Map<string, {
      paymentType: string
      revenue: number
      orders: Set<string>
    }>()

    for (const sale of sales) {
      const key = sale.paymentType || 'unknown'
      const existing = paymentMap.get(key) || {
        paymentType: sale.paymentType || 'Неизвестно',
        revenue: 0,
        orders: new Set<string>(),
      }
      existing.revenue += sale.amount
      existing.orders.add(sale.orderNum)
      paymentMap.set(key, existing)
    }

    const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0)

    const byPaymentType = Array.from(paymentMap.values())
      .filter(p => p.paymentType && p.paymentType !== 'Неизвестно' && p.paymentType !== 'unknown')
      .map(p => ({
        paymentType: p.paymentType,
        revenue: p.revenue,
        orderCount: p.orders.size,
        percentage: totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    res.json({
      byPaymentType,
      totalRevenue,
    })
  } catch (error) {
    console.error('Get payment analytics error:', error)
    res.status(500).json({ message: 'Failed to get payment analytics' })
  }
})

// Get analytics by tables
router.get('/analytics/tables', async (req: AuthRequest, res) => {
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

    // Group by table
    const tableMap = new Map<string, {
      tableNum: string
      revenue: number
      orders: Set<string>
      guestCount: number
    }>()

    for (const sale of sales) {
      const key = sale.tableNum || 'unknown'
      const existing = tableMap.get(key) || {
        tableNum: sale.tableNum || 'Неизвестно',
        revenue: 0,
        orders: new Set<string>(),
        guestCount: 0,
      }
      existing.revenue += sale.amount
      if (!existing.orders.has(sale.orderNum) && sale.guestCount) {
        existing.guestCount += sale.guestCount
      }
      existing.orders.add(sale.orderNum)
      tableMap.set(key, existing)
    }

    const byTable = Array.from(tableMap.values())
      .filter(t => t.tableNum && t.tableNum !== 'Неизвестно' && t.tableNum !== 'unknown')
      .map(t => ({
        tableNum: t.tableNum,
        revenue: t.revenue,
        orderCount: t.orders.size,
        averageCheck: t.orders.size > 0 ? t.revenue / t.orders.size : 0,
        guestCount: t.guestCount,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    res.json({
      byTable,
      totalTables: byTable.length,
    })
  } catch (error) {
    console.error('Get table analytics error:', error)
    res.status(500).json({ message: 'Failed to get table analytics' })
  }
})

// Get analytics by order types
router.get('/analytics/order-types', async (req: AuthRequest, res) => {
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

    // Group by order type
    const orderTypeMap = new Map<string, {
      orderType: string
      revenue: number
      orders: Set<string>
    }>()

    for (const sale of sales) {
      const key = sale.orderType || 'unknown'
      const existing = orderTypeMap.get(key) || {
        orderType: sale.orderType || 'Неизвестно',
        revenue: 0,
        orders: new Set<string>(),
      }
      existing.revenue += sale.amount
      existing.orders.add(sale.orderNum)
      orderTypeMap.set(key, existing)
    }

    const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0)

    const byOrderType = Array.from(orderTypeMap.values())
      .filter(o => o.orderType && o.orderType !== 'Неизвестно' && o.orderType !== 'unknown')
      .map(o => ({
        orderType: o.orderType,
        revenue: o.revenue,
        orderCount: o.orders.size,
        percentage: totalRevenue > 0 ? (o.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    res.json({
      byOrderType,
      totalRevenue,
    })
  } catch (error) {
    console.error('Get order type analytics error:', error)
    res.status(500).json({ message: 'Failed to get order type analytics' })
  }
})

// Get profitability analytics (margin)
router.get('/analytics/profitability', async (req: AuthRequest, res) => {
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

    // Calculate profitability by category
    const categoryMap = new Map<string, {
      category: string
      revenue: number
      cost: number
      quantity: number
    }>()

    for (const sale of sales) {
      const key = sale.dishCategory || 'unknown'
      const existing = categoryMap.get(key) || {
        category: sale.dishCategory || 'Неизвестно',
        revenue: 0,
        cost: 0,
        quantity: 0,
      }
      existing.revenue += sale.amount
      existing.cost += sale.productCost || 0
      existing.quantity += sale.quantity
      categoryMap.set(key, existing)
    }

    const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0)
    const totalCost = sales.reduce((sum, s) => sum + (s.productCost || 0), 0)

    const byCategory = Array.from(categoryMap.values())
      .map(c => ({
        category: c.category,
        revenue: c.revenue,
        cost: c.cost,
        profit: c.revenue - c.cost,
        margin: c.revenue > 0 ? ((c.revenue - c.cost) / c.revenue) * 100 : 0,
        quantity: c.quantity,
      }))
      .sort((a, b) => b.profit - a.profit)

    // Calculate profitability by dish
    const dishMap = new Map<string, {
      dishId: string
      dishName: string
      category: string
      revenue: number
      cost: number
      quantity: number
    }>()

    for (const sale of sales) {
      const key = sale.dishId || sale.dishName
      const existing = dishMap.get(key) || {
        dishId: sale.dishId,
        dishName: sale.dishName,
        category: sale.dishCategory,
        revenue: 0,
        cost: 0,
        quantity: 0,
      }
      existing.revenue += sale.amount
      existing.cost += sale.productCost || 0
      existing.quantity += sale.quantity
      dishMap.set(key, existing)
    }

    const topProfitableItems = Array.from(dishMap.values())
      .map(d => ({
        dishId: d.dishId,
        dishName: d.dishName,
        category: d.category,
        revenue: d.revenue,
        cost: d.cost,
        profit: d.revenue - d.cost,
        margin: d.revenue > 0 ? ((d.revenue - d.cost) / d.revenue) * 100 : 0,
        quantity: d.quantity,
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 20)

    res.json({
      summary: {
        totalRevenue,
        totalCost,
        totalProfit: totalRevenue - totalCost,
        overallMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
        hasCostData: totalCost > 0,
      },
      byCategory,
      topProfitableItems,
    })
  } catch (error) {
    console.error('Get profitability analytics error:', error)
    res.status(500).json({ message: 'Failed to get profitability analytics' })
  }
})

// Get discount analytics
router.get('/analytics/discounts', async (req: AuthRequest, res) => {
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

    // Group by discount type
    const discountMap = new Map<string, {
      discountType: string
      totalDiscount: number
      orders: Set<string>
    }>()

    for (const sale of sales) {
      if (sale.discountSum > 0) {
        const key = sale.discountType || 'unknown'
        const existing = discountMap.get(key) || {
          discountType: sale.discountType || 'Другая скидка',
          totalDiscount: 0,
          orders: new Set<string>(),
        }
        existing.totalDiscount += sale.discountSum
        existing.orders.add(sale.orderNum)
        discountMap.set(key, existing)
      }
    }

    const totalDiscount = sales.reduce((sum, s) => sum + s.discountSum, 0)
    const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0)

    const byDiscountType = Array.from(discountMap.values())
      .map(d => ({
        discountType: d.discountType,
        totalDiscount: d.totalDiscount,
        orderCount: d.orders.size,
        percentage: totalDiscount > 0 ? (d.totalDiscount / totalDiscount) * 100 : 0,
      }))
      .sort((a, b) => b.totalDiscount - a.totalDiscount)

    res.json({
      summary: {
        totalDiscount,
        totalRevenue,
        discountPercentage: totalRevenue > 0 ? (totalDiscount / (totalRevenue + totalDiscount)) * 100 : 0,
      },
      byDiscountType,
    })
  } catch (error) {
    console.error('Get discount analytics error:', error)
    res.status(500).json({ message: 'Failed to get discount analytics' })
  }
})

// Get service speed analytics (time from open to close)
router.get('/analytics/service-speed', async (req: AuthRequest, res) => {
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
        closeTime: {
          not: null,
        },
      },
    })

    // Group by order to calculate service time
    const orderMap = new Map<string, {
      orderNum: string
      openTime: Date
      closeTime: Date
      waiterName: string
      amount: number
    }>()

    for (const sale of sales) {
      if (sale.closeTime) {
        const existing = orderMap.get(sale.orderNum)
        if (!existing) {
          orderMap.set(sale.orderNum, {
            orderNum: sale.orderNum,
            openTime: sale.openTime,
            closeTime: sale.closeTime,
            waiterName: sale.waiterName || '',
            amount: sale.amount,
          })
        } else {
          existing.amount += sale.amount
        }
      }
    }

    // Calculate service times
    const serviceTimes: number[] = []
    const serviceByHour = new Map<number, { totalMinutes: number; count: number }>()

    for (const order of orderMap.values()) {
      const minutes = (order.closeTime.getTime() - order.openTime.getTime()) / (1000 * 60)
      if (minutes > 0 && minutes < 480) { // Ignore outliers (> 8 hours)
        serviceTimes.push(minutes)
        const hour = order.openTime.getHours()
        const existing = serviceByHour.get(hour) || { totalMinutes: 0, count: 0 }
        existing.totalMinutes += minutes
        existing.count++
        serviceByHour.set(hour, existing)
      }
    }

    // Calculate stats
    const avgServiceTime = serviceTimes.length > 0
      ? serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length
      : 0
    const sortedTimes = serviceTimes.sort((a, b) => a - b)
    const medianServiceTime = serviceTimes.length > 0
      ? sortedTimes[Math.floor(sortedTimes.length / 2)]
      : 0

    const byHour = Array.from(serviceByHour.entries())
      .map(([hour, data]) => ({
        hour,
        avgMinutes: data.count > 0 ? data.totalMinutes / data.count : 0,
        orderCount: data.count,
      }))
      .sort((a, b) => a.hour - b.hour)

    res.json({
      summary: {
        avgServiceMinutes: avgServiceTime,
        medianServiceMinutes: medianServiceTime,
        totalOrders: orderMap.size,
      },
      byHour,
    })
  } catch (error) {
    console.error('Get service speed analytics error:', error)
    res.status(500).json({ message: 'Failed to get service speed analytics' })
  }
})

// Get guest analytics (revenue per guest)
router.get('/analytics/guests', async (req: AuthRequest, res) => {
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

    // Group by order to get guest count per order
    const orderMap = new Map<string, {
      orderNum: string
      revenue: number
      guestCount: number
      date: string
    }>()

    for (const sale of sales) {
      const existing = orderMap.get(sale.orderNum)
      if (!existing) {
        orderMap.set(sale.orderNum, {
          orderNum: sale.orderNum,
          revenue: sale.amount,
          guestCount: sale.guestCount || 0,
          date: sale.openTime.toISOString().split('T')[0],
        })
      } else {
        existing.revenue += sale.amount
        if (sale.guestCount && sale.guestCount > existing.guestCount) {
          existing.guestCount = sale.guestCount
        }
      }
    }

    const ordersWithGuests = Array.from(orderMap.values()).filter(o => o.guestCount > 0)
    const totalGuests = ordersWithGuests.reduce((sum, o) => sum + o.guestCount, 0)
    const totalRevenue = ordersWithGuests.reduce((sum, o) => sum + o.revenue, 0)
    const avgCheckPerGuest = totalGuests > 0 ? totalRevenue / totalGuests : 0

    // Group by day
    const dailyMap = new Map<string, { guests: number; revenue: number }>()
    for (const order of ordersWithGuests) {
      const existing = dailyMap.get(order.date) || { guests: 0, revenue: 0 }
      existing.guests += order.guestCount
      existing.revenue += order.revenue
      dailyMap.set(order.date, existing)
    }

    const byDay = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        guests: data.guests,
        revenue: data.revenue,
        avgCheckPerGuest: data.guests > 0 ? data.revenue / data.guests : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Group by guest count ranges
    const guestRanges = [
      { min: 1, max: 1, label: '1 гость' },
      { min: 2, max: 2, label: '2 гостя' },
      { min: 3, max: 4, label: '3-4 гостя' },
      { min: 5, max: 6, label: '5-6 гостей' },
      { min: 7, max: 100, label: '7+ гостей' },
    ]

    const byGuestCount = guestRanges.map(range => {
      const orders = ordersWithGuests.filter(o => o.guestCount >= range.min && o.guestCount <= range.max)
      const revenue = orders.reduce((sum, o) => sum + o.revenue, 0)
      const guests = orders.reduce((sum, o) => sum + o.guestCount, 0)
      return {
        label: range.label,
        orderCount: orders.length,
        revenue,
        avgCheck: orders.length > 0 ? revenue / orders.length : 0,
        avgCheckPerGuest: guests > 0 ? revenue / guests : 0,
      }
    }).filter(r => r.orderCount > 0)

    res.json({
      summary: {
        totalGuests,
        totalRevenue,
        avgCheckPerGuest,
        ordersWithGuestData: ordersWithGuests.length,
        hasGuestData: totalGuests > 0,
      },
      byDay,
      byGuestCount,
    })
  } catch (error) {
    console.error('Get guest analytics error:', error)
    res.status(500).json({ message: 'Failed to get guest analytics' })
  }
})

// Get analytics by cooking place (Bar, Kitchen Hot, Pool)
router.get('/analytics/cooking-places', async (req: AuthRequest, res) => {
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

    // Group by cooking place
    const placeMap = new Map<string, {
      cookingPlace: string
      revenue: number
      quantity: number
      orders: Set<string>
    }>()

    for (const sale of sales) {
      const key = (sale as any).cookingPlace || 'unknown'
      const existing = placeMap.get(key) || {
        cookingPlace: (sale as any).cookingPlace || 'Неизвестно',
        revenue: 0,
        quantity: 0,
        orders: new Set<string>(),
      }
      existing.revenue += sale.amount
      existing.quantity += sale.quantity
      existing.orders.add(sale.orderNum)
      placeMap.set(key, existing)
    }

    const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0)

    const byCookingPlace = Array.from(placeMap.values())
      .filter(p => p.cookingPlace && p.cookingPlace !== 'Неизвестно' && p.cookingPlace !== 'unknown')
      .map(p => ({
        cookingPlace: p.cookingPlace,
        revenue: p.revenue,
        quantity: p.quantity,
        orderCount: p.orders.size,
        percentage: totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    res.json({
      byCookingPlace,
      totalRevenue,
    })
  } catch (error) {
    console.error('Get cooking place analytics error:', error)
    res.status(500).json({ message: 'Failed to get cooking place analytics' })
  }
})

// ==================== NOMENCLATURE ====================

// Get current nomenclature (categories and dishes) directly from iiko
router.get('/nomenclature', async (_req: AuthRequest, res) => {
  try {
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

    const { products, categories } = await service.getNomenclature()
    await service.logout()

    // Group products by category/parent
    const categoryMap = new Map<string, any>()
    for (const cat of categories) {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        deleted: cat.deleted || false,
      })
    }

    // Build product list with useful fields
    const menuItems = products
      .filter((p: any) => p.type === 'DISH' || p.type === 'GOOD' || p.type === 'MODIFIER')
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        code: p.code || null,
        type: p.type,
        parentId: p.parentId || null,
        parentName: p.parent || null,
        categoryId: p.productCategoryId || null,
        categoryName: categoryMap.get(p.productCategoryId)?.name || null,
        price: p.price || null,
        deleted: p.deleted || false,
      }))
      .filter((p: any) => !p.deleted)
      .sort((a: any, b: any) => (a.parentName || '').localeCompare(b.parentName || ''))

    // Group items by parent (menu group)
    const groupMap = new Map<string, any[]>()
    for (const item of menuItems) {
      const group = item.parentName || 'Без группы'
      if (!groupMap.has(group)) groupMap.set(group, [])
      groupMap.get(group)!.push(item)
    }

    const byGroup = Array.from(groupMap.entries())
      .map(([group, items]) => ({
        group,
        itemCount: items.length,
        items: items.sort((a: any, b: any) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.group.localeCompare(b.group))

    // Active categories from categories list
    const activeCategories = categories
      .filter((c: any) => !c.deleted)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))

    res.json({
      totalItems: menuItems.length,
      totalCategories: activeCategories.length,
      totalGroups: byGroup.length,
      categories: activeCategories,
      byGroup,
    })
  } catch (error: any) {
    console.error('Get nomenclature error:', error)
    res.status(500).json({ message: error.message || 'Failed to get nomenclature' })
  }
})

// ==================== EXTENDED WAITER ANALYTICS ====================

// Detailed waiter analytics with shifts, sessions, daily breakdown
router.get('/analytics/waiters/detailed', async (req: AuthRequest, res) => {
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

    // Build detailed waiter data
    const waiterMap = new Map<string, {
      waiterId: string
      waiterName: string
      revenue: number
      quantity: number
      orders: Set<string>
      guestCount: number
      totalDiscount: number
      // By session (shift)
      sessions: Map<string, {
        sessionNum: string
        revenue: number
        orders: Set<string>
        firstOrder: Date
        lastOrder: Date
      }>
      // By day
      days: Map<string, {
        date: string
        revenue: number
        orders: Set<string>
        guestCount: number
      }>
      // By category
      categories: Map<string, {
        category: string
        revenue: number
        quantity: number
      }>
      // By hour
      hours: Map<number, {
        hour: number
        revenue: number
        orderCount: number
      }>
      // Service time tracking
      orderTimes: Map<string, { open: Date; close: Date | null }>
    }>()

    for (const sale of sales) {
      const key = sale.waiterId || sale.waiterName || 'unknown'
      if (key === 'unknown' || !sale.waiterName) continue

      // Safely convert dates - handle null/string/Date values from Prisma
      const openTime = sale.openTime instanceof Date ? sale.openTime : new Date(sale.openTime)
      if (isNaN(openTime.getTime())) continue // skip invalid dates

      const closeTime = sale.closeTime
        ? (sale.closeTime instanceof Date ? sale.closeTime : new Date(sale.closeTime))
        : null

      if (!waiterMap.has(key)) {
        waiterMap.set(key, {
          waiterId: sale.waiterId || '',
          waiterName: sale.waiterName || 'Неизвестно',
          revenue: 0,
          quantity: 0,
          orders: new Set(),
          guestCount: 0,
          totalDiscount: 0,
          sessions: new Map(),
          days: new Map(),
          categories: new Map(),
          hours: new Map(),
          orderTimes: new Map(),
        })
      }

      const waiter = waiterMap.get(key)!
      waiter.revenue += sale.amount || 0
      waiter.quantity += sale.quantity || 0
      waiter.totalDiscount += sale.discountSum || 0

      const isNewOrder = !waiter.orders.has(sale.orderNum)
      waiter.orders.add(sale.orderNum)

      if (isNewOrder && sale.guestCount) {
        waiter.guestCount += sale.guestCount
      }

      // Track order times for service speed
      if (!waiter.orderTimes.has(sale.orderNum)) {
        waiter.orderTimes.set(sale.orderNum, {
          open: openTime,
          close: closeTime && !isNaN(closeTime.getTime()) ? closeTime : null,
        })
      }

      // By session/shift
      const sessionKey = sale.sessionNum || 'no-session'
      if (sessionKey !== 'no-session') {
        if (!waiter.sessions.has(sessionKey)) {
          waiter.sessions.set(sessionKey, {
            sessionNum: sessionKey,
            revenue: 0,
            orders: new Set(),
            firstOrder: openTime,
            lastOrder: openTime,
          })
        }
        const session = waiter.sessions.get(sessionKey)!
        session.revenue += sale.amount || 0
        session.orders.add(sale.orderNum)
        if (openTime.getTime() < session.firstOrder.getTime()) session.firstOrder = openTime
        if (openTime.getTime() > session.lastOrder.getTime()) session.lastOrder = openTime
      }

      // By day
      const dayKey = openTime.toISOString().split('T')[0]
      if (!waiter.days.has(dayKey)) {
        waiter.days.set(dayKey, {
          date: dayKey,
          revenue: 0,
          orders: new Set(),
          guestCount: 0,
        })
      }
      const day = waiter.days.get(dayKey)!
      day.revenue += sale.amount || 0
      if (!day.orders.has(sale.orderNum) && sale.guestCount) {
        day.guestCount += sale.guestCount
      }
      day.orders.add(sale.orderNum)

      // By category
      const catKey = sale.dishCategory || 'Другое'
      if (!waiter.categories.has(catKey)) {
        waiter.categories.set(catKey, { category: catKey, revenue: 0, quantity: 0 })
      }
      const cat = waiter.categories.get(catKey)!
      cat.revenue += sale.amount || 0
      cat.quantity += sale.quantity || 0

      // By hour
      const hour = openTime.getHours()
      if (!waiter.hours.has(hour)) {
        waiter.hours.set(hour, { hour, revenue: 0, orderCount: 0 })
      }
      const h = waiter.hours.get(hour)!
      h.revenue += sale.amount || 0
      if (isNewOrder) h.orderCount++
    }

    // Build response
    const waiters = Array.from(waiterMap.values())
      .map(w => {
        // Calculate avg service time
        const serviceTimes: number[] = []
        for (const order of w.orderTimes.values()) {
          if (order.close) {
            const minutes = (order.close.getTime() - order.open.getTime()) / (1000 * 60)
            if (minutes > 0 && minutes < 480) serviceTimes.push(minutes)
          }
        }
        const avgServiceMinutes = serviceTimes.length > 0
          ? serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length
          : 0

        return {
          waiterId: w.waiterId,
          waiterName: w.waiterName,
          revenue: w.revenue,
          quantity: w.quantity,
          orderCount: w.orders.size,
          averageCheck: w.orders.size > 0 ? w.revenue / w.orders.size : 0,
          guestCount: w.guestCount,
          totalDiscount: w.totalDiscount,
          avgServiceMinutes,
          // Shifts/sessions
          shiftCount: w.sessions.size,
          shifts: Array.from(w.sessions.values())
            .map(s => {
              const firstMs = s.firstOrder instanceof Date ? s.firstOrder.getTime() : 0
              const lastMs = s.lastOrder instanceof Date ? s.lastOrder.getTime() : 0
              return {
                sessionNum: s.sessionNum,
                revenue: s.revenue,
                orderCount: s.orders.size,
                firstOrder: firstMs ? new Date(firstMs).toISOString() : '',
                lastOrder: lastMs ? new Date(lastMs).toISOString() : '',
                durationHours: firstMs && lastMs ? (lastMs - firstMs) / (1000 * 60 * 60) : 0,
              }
            })
            .sort((a, b) => a.firstOrder.localeCompare(b.firstOrder)),
          // Daily breakdown
          daysWorked: w.days.size,
          byDay: Array.from(w.days.values())
            .map(d => ({
              date: d.date,
              revenue: d.revenue,
              orderCount: d.orders.size,
              averageCheck: d.orders.size > 0 ? d.revenue / d.orders.size : 0,
              guestCount: d.guestCount,
            }))
            .sort((a, b) => a.date.localeCompare(b.date)),
          // Top categories for this waiter
          byCategory: Array.from(w.categories.values())
            .sort((a, b) => b.revenue - a.revenue),
          // By hour
          byHour: Array.from(w.hours.values())
            .sort((a, b) => a.hour - b.hour),
        }
      })
      .sort((a, b) => b.revenue - a.revenue)

    // Summary
    const totalRevenue = waiters.reduce((sum, w) => sum + w.revenue, 0)
    const totalOrders = waiters.reduce((sum, w) => sum + w.orderCount, 0)

    res.json({
      summary: {
        totalWaiters: waiters.length,
        totalRevenue,
        totalOrders,
        avgRevenuePerWaiter: waiters.length > 0 ? totalRevenue / waiters.length : 0,
        avgOrdersPerWaiter: waiters.length > 0 ? totalOrders / waiters.length : 0,
      },
      waiters,
    })
  } catch (error: any) {
    console.error('Get detailed waiter analytics error:', error)
    console.error('Stack:', error?.stack)
    res.status(500).json({
      message: error?.message || 'Failed to get detailed waiter analytics',
      stack: process.env.NODE_ENV !== 'production' ? error?.stack : undefined,
    })
  }
})

// ==================== API EXPLORATION ====================

// Discover available OLAP fields
router.get('/explore/olap-fields', async (req: AuthRequest, res) => {
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

    const result = await service.discoverOlapFields({
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    })

    await service.logout()

    res.json(result)
  } catch (error: any) {
    console.error('Explore OLAP fields error:', error)
    res.status(500).json({ message: error.message || 'Failed to explore OLAP fields' })
  }
})

// Discover available API endpoints
router.get('/explore/endpoints', async (req: AuthRequest, res) => {
  try {
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

    const result = await service.exploreApiEndpoints()

    await service.logout()

    res.json(result)
  } catch (error: any) {
    console.error('Explore endpoints error:', error)
    res.status(500).json({ message: error.message || 'Failed to explore endpoints' })
  }
})

// Discover available report types
router.get('/explore/report-types', async (req: AuthRequest, res) => {
  try {
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

    const result = await service.discoverReportTypes()

    await service.logout()

    res.json(result)
  } catch (error: any) {
    console.error('Explore report types error:', error)
    res.status(500).json({ message: error.message || 'Failed to explore report types' })
  }
})

// Get detailed sales report with all available fields
router.get('/explore/detailed-sales', async (req: AuthRequest, res) => {
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

    const result = await service.getDetailedSalesReport({
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
    })

    await service.logout()

    res.json(result)
  } catch (error: any) {
    console.error('Detailed sales error:', error)
    res.status(500).json({ message: error.message || 'Failed to get detailed sales' })
  }
})

export default router
