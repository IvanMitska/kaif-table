import cors from 'cors'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'

import authRoutes from './routes/auth.js'
import categoriesRoutes from './routes/categories.js'
import dashboardRoutes from './routes/dashboard.js'
import exportRoutes from './routes/export.js'
import paymentMethodsRoutes from './routes/paymentMethods.js'
import transactionsRoutes from './routes/transactions.js'
import usersRoutes from './routes/users.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const prisma = new PrismaClient()

const app = express()
const PORT = process.env.PORT || 3001

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? true
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))

app.use(express.json())

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/payment-methods', paymentMethodsRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/export', exportRoutes)

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' })
})

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientBuildPath))

  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientBuildPath, 'index.html'))
    }
  })
}

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
