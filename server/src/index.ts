import cors from 'cors'
import express from 'express'
import { PrismaClient } from '@prisma/client'

import authRoutes from './routes/auth.js'
import categoriesRoutes from './routes/categories.js'
import dashboardRoutes from './routes/dashboard.js'
import exportRoutes from './routes/export.js'
import paymentMethodsRoutes from './routes/paymentMethods.js'
import transactionsRoutes from './routes/transactions.js'
import usersRoutes from './routes/users.js'

export const prisma = new PrismaClient()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Routes
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

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
