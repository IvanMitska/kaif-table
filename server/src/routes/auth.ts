import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { prisma } from '../index.js'
import { authMiddleware, generateToken, type AuthRequest } from '../middleware/auth.js'

const router = Router()

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
      res.status(400).json({ message: 'Email, password and name are required' })
      return
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // First user becomes admin
    const userCount = await prisma.user.count()
    const role = userCount === 0 ? 'ADMIN' : 'ACCOUNTANT'

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    const token = generateToken(user.id, user.role)

    res.json({ token, user })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ message: 'Failed to register' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' })
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const token = generateToken(user.id, user.role)

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Failed to login' })
  }
})

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    res.json(user)
  } catch (error) {
    console.error('Get me error:', error)
    res.status(500).json({ message: 'Failed to get user' })
  }
})

export default router
