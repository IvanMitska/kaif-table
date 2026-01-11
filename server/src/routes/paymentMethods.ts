import { Router } from 'express'
import { prisma } from '../index.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

// Get all payment methods
router.get('/', async (_req: AuthRequest, res) => {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      orderBy: { name: 'asc' },
    })

    res.json(paymentMethods)
  } catch (error) {
    console.error('Get payment methods error:', error)
    res.status(500).json({ message: 'Failed to get payment methods' })
  }
})

// Create payment method
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name } = req.body

    const paymentMethod = await prisma.paymentMethod.create({
      data: { name },
    })

    res.status(201).json(paymentMethod)
  } catch (error) {
    console.error('Create payment method error:', error)
    res.status(500).json({ message: 'Failed to create payment method' })
  }
})

// Update payment method
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { name } = req.body

    const paymentMethod = await prisma.paymentMethod.update({
      where: { id: parseInt(req.params.id) },
      data: { name },
    })

    res.json(paymentMethod)
  } catch (error) {
    console.error('Update payment method error:', error)
    res.status(500).json({ message: 'Failed to update payment method' })
  }
})

// Delete payment method
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.paymentMethod.delete({
      where: { id: parseInt(req.params.id) },
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete payment method error:', error)
    res.status(500).json({ message: 'Failed to delete payment method' })
  }
})

export default router
