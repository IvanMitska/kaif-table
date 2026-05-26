export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'accountant' | 'manager'
  createdAt: string
}

export interface Category {
  id: number
  name: string
  type: 'expense' | 'income'
  color?: string
}

export interface PaymentMethod {
  id: number
  name: string
}

export interface Transaction {
  id: number
  date: string
  amount: number
  paymentMethodId: number
  paymentMethod?: PaymentMethod
  service: string
  categoryId: number
  category?: Category
  supplier?: string
  comment?: string
  hasReceipt: boolean
  enteredInIiko: boolean
  userId: number
  user?: User
  createdAt: string
  updatedAt: string
}

export interface TransactionFilters {
  dateFrom?: string
  dateTo?: string
  categoryId?: number
  paymentMethodId?: number
  search?: string
  minAmount?: number
  maxAmount?: number
}

export interface DashboardStats {
  /** Revenue from iiko sales for the period (POS-imported, not manual). */
  totalIncome: number
  /** Sum of manual expense transactions (negative number). */
  totalExpenses: number
  balance: number
  /** Count of manual Transaction rows. */
  transactionCount: number
  byCategory: { categoryId: number; categoryName: string; total: number; color?: string }[]
  byPaymentMethod: { paymentMethodId: number; paymentMethodName: string; total: number }[]
  dailyTrend: { date: string; income: number; expenses: number }[]
  /** Distinct order numbers from iiko sales for the period. */
  iikoOrderCount?: number
  /** Average check across iiko orders for the period. */
  iikoAverageCheck?: number
  /** Revenue broken down by iiko dish category. */
  iikoRevenueByCategory?: { category: string; amount: number }[]
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
