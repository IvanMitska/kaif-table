import axios from 'axios'
import type { AuthResponse, Category, DashboardStats, PaymentMethod, Transaction, TransactionFilters, User } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api')

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },
  register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/register', { email, password, name })
    return data
  },
  me: async (): Promise<User> => {
    const { data } = await api.get('/auth/me')
    return data
  },
}

// Transactions
export const transactionsApi = {
  getAll: async (filters?: TransactionFilters): Promise<{ data: Transaction[]; total: number; page: number; limit: number }> => {
    const { data } = await api.get('/transactions', { params: filters })
    return data
  },
  getById: async (id: number): Promise<Transaction> => {
    const { data } = await api.get(`/transactions/${id}`)
    return data
  },
  create: async (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'user' | 'category' | 'paymentMethod'>): Promise<Transaction> => {
    const { data } = await api.post('/transactions', transaction)
    return data
  },
  update: async (id: number, transaction: Partial<Transaction>): Promise<Transaction> => {
    const { data } = await api.put(`/transactions/${id}`, transaction)
    return data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/transactions/${id}`)
  },
}

// Categories
export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const { data } = await api.get('/categories')
    return data
  },
  create: async (category: Omit<Category, 'id'>): Promise<Category> => {
    const { data } = await api.post('/categories', category)
    return data
  },
  update: async (id: number, category: Partial<Category>): Promise<Category> => {
    const { data } = await api.put(`/categories/${id}`, category)
    return data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`)
  },
}

// Payment Methods
export const paymentMethodsApi = {
  getAll: async (): Promise<PaymentMethod[]> => {
    const { data } = await api.get('/payment-methods')
    return data
  },
  create: async (paymentMethod: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> => {
    const { data } = await api.post('/payment-methods', paymentMethod)
    return data
  },
  update: async (id: number, paymentMethod: Partial<PaymentMethod>): Promise<PaymentMethod> => {
    const { data } = await api.put(`/payment-methods/${id}`, paymentMethod)
    return data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/payment-methods/${id}`)
  },
}

// Dashboard / Stats
export const dashboardApi = {
  getStats: async (dateFrom?: string, dateTo?: string): Promise<DashboardStats> => {
    const { data } = await api.get('/dashboard/stats', { params: { dateFrom, dateTo } })
    return data
  },
}

// Users (admin only)
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const { data } = await api.get('/users')
    return data
  },
  update: async (id: number, user: Partial<User>): Promise<User> => {
    const { data } = await api.put(`/users/${id}`, user)
    return data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`)
  },
}

// Export
export const exportApi = {
  toExcel: async (filters?: TransactionFilters): Promise<Blob> => {
    const { data } = await api.get('/export/excel', {
      params: filters,
      responseType: 'blob',
    })
    return data
  },
  toPdf: async (filters?: TransactionFilters): Promise<Blob> => {
    const { data } = await api.get('/export/pdf', {
      params: filters,
      responseType: 'blob',
    })
    return data
  },
}

// iiko Integration
export interface IikoSettings {
  id: number
  serverUrl: string
  login: string
  isActive: boolean
  lastSyncAt: string | null
}

export interface IikoSyncResult {
  success: boolean
  itemsImported: number
  summary: {
    totalAmount: number
    totalQuantity: number
    totalDiscount: number
  }
}

export interface IikoRevenue {
  totalRevenue: number
  totalQuantity: number
  orderCount: number
  averageCheck: number
  byCategory: Array<{ category: string; amount: number; quantity: number }>
  byDay: Array<{ date: string; amount: number }>
  byHour: Array<{ hour: number; amount: number }>
}

export interface IikoTopItem {
  dishId: string
  dishName: string
  category: string
  quantity: number
  amount: number
}

export const iikoApi = {
  getSettings: async (): Promise<IikoSettings | null> => {
    const { data } = await api.get('/iiko/settings')
    return data
  },
  saveSettings: async (settings: { serverUrl: string; login: string; password: string }): Promise<IikoSettings> => {
    const { data } = await api.post('/iiko/settings', settings)
    return data
  },
  testConnection: async (): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post('/iiko/test-connection')
    return data
  },
  sync: async (dateFrom: string, dateTo: string): Promise<IikoSyncResult> => {
    const { data } = await api.post('/iiko/sync', { dateFrom, dateTo })
    return data
  },
  getRevenue: async (dateFrom: string, dateTo: string): Promise<IikoRevenue> => {
    const { data } = await api.get('/iiko/revenue', { params: { dateFrom, dateTo } })
    return data
  },
  getTopItems: async (dateFrom: string, dateTo: string, limit?: number): Promise<IikoTopItem[]> => {
    const { data } = await api.get('/iiko/top-items', { params: { dateFrom, dateTo, limit } })
    return data
  },
}

export default api
