import { Router } from 'express'
import { prisma } from '../index.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'
import * as XLSX from 'xlsx'
import PDFDocument from 'pdfkit'
import { Prisma } from '@prisma/client'

const router = Router()

router.use(authMiddleware)

// Export to Excel
router.get('/excel', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo, categoryId, paymentMethodId } = req.query

    const where: Prisma.TransactionWhereInput = {}
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom as string)
      if (dateTo) where.date.lte = new Date(dateTo as string)
    }
    if (categoryId) where.categoryId = parseInt(categoryId as string)
    if (paymentMethodId) where.paymentMethodId = parseInt(paymentMethodId as string)

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
        paymentMethod: true,
        user: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    })

    const data = transactions.map(t => ({
      'Дата': t.date.toLocaleDateString('ru-RU'),
      'Сумма': Number(t.amount),
      'Категория': t.category.name,
      'Описание': t.service,
      'Способ оплаты': t.paymentMethod.name,
      'Поставщик': t.supplier || '',
      'Комментарий': t.comment || '',
      'Есть чек': t.hasReceipt ? 'Да' : 'Нет',
      'В iiko': t.enteredInIiko ? 'Да' : 'Нет',
      'Добавил': t.user.name,
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Транзакции')

    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // Дата
      { wch: 15 }, // Сумма
      { wch: 20 }, // Категория
      { wch: 40 }, // Описание
      { wch: 15 }, // Способ оплаты
      { wch: 20 }, // Поставщик
      { wch: 30 }, // Комментарий
      { wch: 10 }, // Есть чек
      { wch: 10 }, // В iiko
      { wch: 15 }, // Добавил
    ]

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.xlsx')
    res.send(buffer)
  } catch (error) {
    console.error('Export Excel error:', error)
    res.status(500).json({ message: 'Failed to export' })
  }
})

// Export to PDF
router.get('/pdf', async (req: AuthRequest, res) => {
  try {
    const { dateFrom, dateTo } = req.query

    const where: Prisma.TransactionWhereInput = {}
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom as string)
      if (dateTo) where.date.lte = new Date(dateTo as string)
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
        paymentMethod: true,
      },
      orderBy: { date: 'desc' },
    })

    // Calculate totals
    let totalIncome = 0
    let totalExpenses = 0
    const categoryTotals = new Map<string, number>()

    transactions.forEach(t => {
      const amount = Number(t.amount)
      if (amount >= 0) totalIncome += amount
      else totalExpenses += amount

      const catTotal = categoryTotals.get(t.category.name) || 0
      categoryTotals.set(t.category.name, catTotal + amount)
    })

    // Create PDF
    const doc = new PDFDocument({ margin: 50 })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=report.pdf')

    doc.pipe(res)

    // Title
    doc.fontSize(20).text('Финансовый отчёт KAIF', { align: 'center' })
    doc.moveDown()

    // Period
    const periodText = dateFrom && dateTo
      ? `Период: ${new Date(dateFrom as string).toLocaleDateString('ru-RU')} - ${new Date(dateTo as string).toLocaleDateString('ru-RU')}`
      : 'Все время'
    doc.fontSize(12).text(periodText, { align: 'center' })
    doc.moveDown(2)

    // Summary
    doc.fontSize(14).text('Сводка', { underline: true })
    doc.moveDown(0.5)
    doc.fontSize(12)
    doc.text(`Доходы: ${totalIncome.toLocaleString('ru-RU')} THB`)
    doc.text(`Расходы: ${Math.abs(totalExpenses).toLocaleString('ru-RU')} THB`)
    doc.text(`Баланс: ${(totalIncome + totalExpenses).toLocaleString('ru-RU')} THB`)
    doc.text(`Всего транзакций: ${transactions.length}`)
    doc.moveDown(2)

    // By category
    doc.fontSize(14).text('По категориям', { underline: true })
    doc.moveDown(0.5)
    doc.fontSize(10)

    Array.from(categoryTotals.entries())
      .sort((a, b) => a[1] - b[1])
      .forEach(([name, total]) => {
        doc.text(`${name}: ${total.toLocaleString('ru-RU')} THB`)
      })

    doc.end()
  } catch (error) {
    console.error('Export PDF error:', error)
    res.status(500).json({ message: 'Failed to export' })
  }
})

export default router
