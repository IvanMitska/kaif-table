import cors from 'cors'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'

import authRoutes from './routes/auth.js'
import categoriesRoutes from './routes/categories.js'
import dashboardRoutes from './routes/dashboard.js'
import exportRoutes from './routes/export.js'
import iikoRoutes from './routes/iiko.js'
import paymentMethodsRoutes from './routes/paymentMethods.js'
import transactionsRoutes from './routes/transactions.js'
import usersRoutes from './routes/users.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const prisma = new PrismaClient()

const app = express()
const PORT = process.env.PORT || 3001

// Debug logging
console.log('=== Server Starting ===')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT)
console.log('PORT:', PORT)
console.log('CWD:', process.cwd())

// Detect production mode (Railway sets RAILWAY_ENVIRONMENT)
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production'
console.log('isProduction:', isProduction)

// CORS configuration
app.use(cors({
  origin: isProduction
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
app.use('/api/iiko', iikoRoutes)

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' })
})

// Serve static files in production
console.log('Checking production mode...')
if (isProduction) {
  // CWD is /app/server, so go up one level to reach /app/client/dist
  const clientBuildPath = path.join(process.cwd(), '../client/dist')
  console.log('Production mode enabled!')
  console.log('Serving static files from:', clientBuildPath)

  // Check if directory exists
  try {
    const files = fs.readdirSync(clientBuildPath)
    console.log('client/dist exists! Files:', files)
  } catch (e) {
    console.log('ERROR: client/dist does NOT exist or cannot be read!', e)
  }

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
