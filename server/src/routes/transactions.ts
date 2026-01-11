import { Router } from 'express'
import { prisma } from '../index.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

// Get all transactions with filters
router.get('/', async (req: AuthRequest, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      dateFrom,
      dateTo,
      categoryId,
      paymentMethodId,
      search,
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = {}

    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) (where.date as Record<string, Date>).gte = new Date(dateFrom as string)
      if (dateTo) (where.date as Record<string, Date>).lte = new Date(dateTo as string)
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId as string)
    }

    if (paymentMethodId) {
      where.paymentMethodId = parseInt(paymentMethodId as string)
    }

    if (search) {
      where.OR = [
        { service: { contains: search as string, mode: 'insensitive' } },
        { comment: { contains: search as string, mode: 'insensitive' } },
        { supplier: { contains: search as string, mode: 'insensitive' } },
      ]
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: true,
          paymentMethod: true,
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.transaction.count({ where }),
    ])

    res.json({
      data: transactions.map(t => ({
        ...t,
        amount: Number(t.amount),
      })),
      total,
      page: pageNum,
      limit: limitNum,
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    res.status(500).json({ message: 'Failed to get transactions' })
  }
})

// Get single transaction
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        category: true,
        paymentMethod: true,
        user: {
          select: { id: true, name: true },
        },
      },
    })

    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' })
      return
    }

    res.json({
      ...transaction,
      amount: Number(transaction.amount),
    })
  } catch (error) {
    console.error('Get transaction error:', error)
    res.status(500).json({ message: 'Failed to get transaction' })
  }
})

// Create transaction
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      date,
      amount,
      service,
      categoryId,
      paymentMethodId,
      supplier,
      comment,
      hasReceipt,
      enteredInIiko,
    } = req.body

    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(date),
        amount,
        service,
        categoryId,
        paymentMethodId,
        supplier,
        comment,
        hasReceipt: hasReceipt || false,
        enteredInIiko: enteredInIiko || false,
        userId: req.userId!,
      },
      include: {
        category: true,
        paymentMethod: true,
      },
    })

    res.status(201).json({
      ...transaction,
      amount: Number(transaction.amount),
    })
  } catch (error) {
    console.error('Create transaction error:', error)
    res.status(500).json({ message: 'Failed to create transaction' })
  }
})

// Update transaction
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const {
      date,
      amount,
      service,
      categoryId,
      paymentMethodId,
      supplier,
      comment,
      hasReceipt,
      enteredInIiko,
    } = req.body

    const transaction = await prisma.transaction.update({
      where: { id: parseInt(req.params.id) },
      data: {
        date: date ? new Date(date) : undefined,
        amount,
        service,
        categoryId,
        paymentMethodId,
        supplier,
        comment,
        hasReceipt,
        enteredInIiko,
      },
      include: {
        category: true,
        paymentMethod: true,
      },
    })

    res.json({
      ...transaction,
      amount: Number(transaction.amount),
    })
  } catch (error) {
    console.error('Update transaction error:', error)
    res.status(500).json({ message: 'Failed to update transaction' })
  }
})

// Delete transaction
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.transaction.delete({
      where: { id: parseInt(req.params.id) },
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete transaction error:', error)
    res.status(500).json({ message: 'Failed to delete transaction' })
  }
})

export default router
