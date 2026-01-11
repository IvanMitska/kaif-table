import { Router } from 'express'
import { prisma } from '../index.js'
import { adminMiddleware, authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)
router.use(adminMiddleware)

// Get all users
router.get('/', async (_req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ message: 'Failed to get users' })
  }
})

// Update user role
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { role, name } = req.body

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: {
        role: role?.toUpperCase(),
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    res.json(user)
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ message: 'Failed to update user' })
  }
})

// Delete user
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    // Prevent self-deletion
    if (parseInt(req.params.id) === req.userId) {
      res.status(400).json({ message: 'Cannot delete yourself' })
      return
    }

    await prisma.user.delete({
      where: { id: parseInt(req.params.id) },
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ message: 'Failed to delete user' })
  }
})

export default router
