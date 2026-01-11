import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/datepicker'
import { Dropdown } from '@/components/ui/dropdown'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { categoriesApi, dashboardApi, paymentMethodsApi, transactionsApi } from '@/lib/api'
import { cn, formatCurrency } from '@/lib/utils'
import type { Category, DashboardStats, PaymentMethod } from '@/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, subDays, subMonths } from 'date-fns'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Plus,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6']

type DateRange = '7d' | '30d' | '3m' | '6m' | '1y'

function getDateRange(range: DateRange): { dateFrom: string; dateTo: string } {
  const dateTo = format(new Date(), 'yyyy-MM-dd')
  let dateFrom: string

  switch (range) {
    case '7d':
      dateFrom = format(subDays(new Date(), 7), 'yyyy-MM-dd')
      break
    case '30d':
      dateFrom = format(subDays(new Date(), 30), 'yyyy-MM-dd')
      break
    case '3m':
      dateFrom = format(subMonths(new Date(), 3), 'yyyy-MM-dd')
      break
    case '6m':
      dateFrom = format(subMonths(new Date(), 6), 'yyyy-MM-dd')
      break
    case '1y':
      dateFrom = format(subMonths(new Date(), 12), 'yyyy-MM-dd')
      break
  }

  return { dateFrom, dateTo }
}

export function DashboardPage() {
  const queryClient = useQueryClient()
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const { dateFrom, dateTo } = getDateRange(dateRange)

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', dateFrom, dateTo],
    queryFn: () => dashboardApi.getStats(dateFrom, dateTo),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: paymentMethodsApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: transactionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setIsQuickAddOpen(false)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const balance = (stats?.totalIncome || 0) + (stats?.totalExpenses || 0)
  const expenseCategories = stats?.byCategory?.filter(c => c.total < 0) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Обзор финансов</h2>
          <p className="text-slate-500 mt-1">Статистика за выбранный период</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsQuickAddOpen(true)}
            className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25"
          >
            <Zap className="h-4 w-4 mr-2" />
            Быстрая запись
          </Button>
          <Dropdown
            value={dateRange}
            onChange={(value) => setDateRange(value as DateRange)}
            className="w-40"
            options={[
              { value: '7d', label: '7 дней' },
              { value: '30d', label: '30 дней' },
              { value: '3m', label: '3 месяца' },
              { value: '6m', label: '6 месяцев' },
              { value: '1y', label: '1 год' },
            ]}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Доходы</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {formatCurrency(stats?.totalIncome || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-full" />
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Расходы</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {formatCurrency(Math.abs(stats?.totalExpenses || 0))}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <ArrowDownRight className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className={cn(
            "absolute top-0 right-0 w-32 h-32 rounded-bl-full",
            balance >= 0 ? "bg-gradient-to-br from-blue-500/10 to-transparent" : "bg-gradient-to-br from-orange-500/10 to-transparent"
          )} />
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Баланс</p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  balance >= 0 ? "text-blue-600" : "text-orange-600"
                )}>
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                balance >= 0 ? "bg-blue-100" : "bg-orange-100"
              )}>
                <Wallet className={cn("h-6 w-6", balance >= 0 ? "text-blue-600" : "text-orange-600")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-full" />
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Транзакций</p>
                <p className="text-2xl font-bold text-violet-600 mt-1">
                  {stats?.transactionCount || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-slate-400" />
              Динамика по дням
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.dailyTrend && stats.dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'dd.MM')}
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value), 'dd.MM.yyyy')}
                    formatter={(value) => formatCurrency(value as number)}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Доходы"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    name="Расходы"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                Нет данных за период
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-400" />
              Расходы по категориям
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseCategories.map(c => ({ ...c, total: Math.abs(c.total) }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="total"
                    nameKey="categoryName"
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                Нет данных за период
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart - Category breakdown */}
      {expenseCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Детализация расходов</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(300, expenseCategories.length * 45)}>
              <BarChart
                data={expenseCategories.map(c => ({
                  ...c,
                  total: Math.abs(c.total),
                }))}
                layout="vertical"
                margin={{ left: 100, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} stroke="#94a3b8" fontSize={12} />
                <YAxis type="category" dataKey="categoryName" width={90} stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="total" name="Сумма" radius={[0, 4, 4, 0]}>
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Quick Add Transaction Modal */}
      <QuickTransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        categories={categories}
        paymentMethods={paymentMethods}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
    </div>
  )
}

interface QuickTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  paymentMethods: PaymentMethod[]
  onSubmit: (data: {
    date: string
    amount: number
    categoryId: number
    paymentMethodId: number
    service: string
    comment?: string
    hasReceipt: boolean
    enteredInIiko: boolean
  }) => void
  isLoading: boolean
}

function QuickTransactionModal({
  isOpen,
  onClose,
  categories,
  paymentMethods,
  onSubmit,
  isLoading,
}: QuickTransactionModalProps) {
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    categoryId: '',
    paymentMethodId: '',
    service: '',
    comment: '',
    hasReceipt: false,
    enteredInIiko: false,
  })

  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense')

  const filteredCategories = categories.filter(c => c.type === transactionType)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(formData.amount)
    onSubmit({
      date: formData.date,
      amount: transactionType === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      categoryId: parseInt(formData.categoryId),
      paymentMethodId: parseInt(formData.paymentMethodId),
      service: formData.service,
      comment: formData.comment || undefined,
      hasReceipt: formData.hasReceipt,
      enteredInIiko: formData.enteredInIiko,
    })
    // Reset form
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: '',
      categoryId: '',
      paymentMethodId: '',
      service: '',
      comment: '',
      hasReceipt: false,
      enteredInIiko: false,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Быстрая запись"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type Toggle */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all",
              transactionType === 'expense'
                ? "bg-white text-red-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
            onClick={() => {
              setTransactionType('expense')
              setFormData({ ...formData, categoryId: '' })
            }}
          >
            <ArrowDownRight className="h-4 w-4 inline mr-1.5" />
            Расход
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all",
              transactionType === 'income'
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
            onClick={() => {
              setTransactionType('income')
              setFormData({ ...formData, categoryId: '' })
            }}
          >
            <ArrowUpRight className="h-4 w-4 inline mr-1.5" />
            Доход
          </button>
        </div>

        {/* Amount - большое поле */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Сумма (THB)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            className={cn(
              "text-2xl font-bold h-14 text-center",
              transactionType === 'expense' ? "text-red-600" : "text-emerald-600"
            )}
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>

        {/* Date & Category */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Дата</label>
            <DatePicker
              value={formData.date}
              onChange={(value) => setFormData({ ...formData, date: value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Категория</label>
            <Dropdown
              value={formData.categoryId}
              onChange={(value) => setFormData({ ...formData, categoryId: value })}
              placeholder="Выберите"
              options={filteredCategories.map(c => ({ value: c.id.toString(), label: c.name }))}
            />
          </div>
        </div>

        {/* Payment Method & Description */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Способ оплаты</label>
            <Dropdown
              value={formData.paymentMethodId}
              onChange={(value) => setFormData({ ...formData, paymentMethodId: value })}
              placeholder="Выберите"
              options={paymentMethods.map(p => ({ value: p.id.toString(), label: p.name }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Описание</label>
            <Input
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              placeholder="За что?"
              required
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex gap-6 py-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasReceipt}
              onChange={(e) => setFormData({ ...formData, hasReceipt: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-slate-600">Есть чек</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enteredInIiko}
              onChange={(e) => setFormData({ ...formData, enteredInIiko: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-slate-600">В iiko</span>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading || !formData.amount || !formData.categoryId || !formData.paymentMethodId}
          className={cn(
            "w-full h-12 text-base font-semibold",
            transactionType === 'expense'
              ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
              : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Сохранение...
            </div>
          ) : (
            <>
              <Plus className="h-5 w-5 mr-2" />
              Добавить {transactionType === 'expense' ? 'расход' : 'доход'}
            </>
          )}
        </Button>
      </form>
    </Modal>
  )
}
