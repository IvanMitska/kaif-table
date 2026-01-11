import { Router } from 'express'
import { prisma } from '../index.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

// Get all categories
router.get('/', async (_req: AuthRequest, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    })

    res.json(categories.map(c => ({
      ...c,
      type: c.type.toLowerCase(),
    })))
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ message: 'Failed to get categories' })
  }
})

// Create category
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, type, color } = req.body

    const category = await prisma.category.create({
      data: {
        name,
        type: type.toUpperCase(),
        color,
      },
    })

    res.status(201).json({
      ...category,
      type: category.type.toLowerCase(),
    })
  } catch (error) {
    console.error('Create category error:', error)
    res.status(500).json({ message: 'Failed to create category' })
  }
})

// Update category
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { name, type, color } = req.body

    const category = await prisma.category.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        type: type?.toUpperCase(),
        color,
      },
    })

    res.json({
      ...category,
      type: category.type.toLowerCase(),
    })
  } catch (error) {
    console.error('Update category error:', error)
    res.status(500).json({ message: 'Failed to update category' })
  }
})

// Delete category
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    await prisma.category.delete({
      where: { id: parseInt(req.params.id) },
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete category error:', error)
    res.status(500).json({ message: 'Failed to delete category' })
  }
})

export default router
