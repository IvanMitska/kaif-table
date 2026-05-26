import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/datepicker'
import { Dropdown } from '@/components/ui/dropdown'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useLanguage } from '@/context/LanguageContext'
import { categoriesApi, dashboardApi, paymentMethodsApi, transactionsApi } from '@/lib/api'
import { cn, formatCurrency } from '@/lib/utils'
import type { Category, DashboardStats, PaymentMethod } from '@/types'
import type { Translations } from '@/lib/i18n'
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

const COLORS = ['#6d28d9', '#2563eb', '#047857', '#b45309', '#be123c', '#0891b2', '#7c3aed', '#b8d92e', '#db2777', '#475569']

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
  const { t } = useLanguage()
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
        <div className="w-8 h-8 spinner" />
      </div>
    )
  }

  const balance = (stats?.totalIncome || 0) + (stats?.totalExpenses || 0)
  const expenseCategories = stats?.byCategory?.filter(c => c.total < 0) || []

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="page-title">{t.dashboard.title}</h2>
          <p className="page-subtitle">{t.dashboard.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsQuickAddOpen(true)}>
            <Zap className="h-[15px] w-[15px] mr-2" strokeWidth={1.8} />
            {t.dashboard.quickAdd}
          </Button>
          <Dropdown
            value={dateRange}
            onChange={(value) => setDateRange(value as DateRange)}
            className="w-40"
            options={[
              { value: '7d', label: t.dashboard.periods['7d'] },
              { value: '30d', label: t.dashboard.periods['30d'] },
              { value: '3m', label: t.dashboard.periods['3m'] },
              { value: '6m', label: t.dashboard.periods['6m'] },
              { value: '1y', label: t.dashboard.periods['1y'] },
            ]}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger-animation">
        {/* Income */}
        <Card className="card-hover">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-medium text-[#9a9a98]">{t.dashboard.income}</p>
                <p className="text-[26px] font-bold tabular-nums text-[#15803d] mt-1 leading-none">
                  {formatCurrency(stats?.totalIncome || 0)}
                </p>
              </div>
              <div className="icon-soft w-11 h-11 shrink-0 bg-[#ecfdf5] rounded-[12px] flex items-center justify-center">
                <ArrowUpRight className="h-[18px] w-[18px] text-[#047857]" strokeWidth={1.8} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="card-hover">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-medium text-[#9a9a98]">{t.dashboard.expenses}</p>
                <p className="text-[26px] font-bold tabular-nums text-[#be123c] mt-1 leading-none">
                  {formatCurrency(Math.abs(stats?.totalExpenses || 0))}
                </p>
              </div>
              <div className="icon-soft w-11 h-11 shrink-0 bg-[#fef2f2] rounded-[12px] flex items-center justify-center">
                <ArrowDownRight className="h-[18px] w-[18px] text-[#be123c]" strokeWidth={1.8} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance */}
        <Card className="card-hover">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-medium text-[#9a9a98]">{t.dashboard.balance}</p>
                <p className={cn(
                  "text-[26px] font-bold tabular-nums mt-1 leading-none",
                  balance >= 0 ? "text-[#2563eb]" : "text-[#b45309]"
                )}>
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className={cn(
                "icon-soft w-11 h-11 shrink-0 rounded-[12px] flex items-center justify-center",
                balance >= 0 ? "bg-[#eff6ff]" : "bg-[#fffbeb]"
              )}>
                <Wallet className={cn(
                  "h-[18px] w-[18px]",
                  balance >= 0 ? "text-[#2563eb]" : "text-[#b45309]"
                )} strokeWidth={1.8} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="card-hover">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-medium text-[#9a9a98]">{t.dashboard.transactions}</p>
                <p className="text-[26px] font-bold tabular-nums text-[#6d28d9] mt-1 leading-none">
                  {stats?.transactionCount || 0}
                </p>
              </div>
              <div className="icon-soft w-11 h-11 shrink-0 bg-[#f3effc] rounded-[12px] flex items-center justify-center">
                <TrendingUp className="h-[18px] w-[18px] text-[#6d28d9]" strokeWidth={1.8} />
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
              <TrendingUp className="h-[16px] w-[16px] text-[#9a9a98]" strokeWidth={1.8} />
              {t.dashboard.dailyTrend}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.dailyTrend && stats.dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ebe9e3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'dd.MM')}
                    stroke="#9a9a98"
                    fontSize={11}
                  />
                  <YAxis stroke="#9a9a98" fontSize={11} />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value), 'dd.MM.yyyy')}
                    formatter={(value) => formatCurrency(value as number)}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #ebe9e3',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    name={t.dashboard.income}
                    stroke="#15803d"
                    strokeWidth={2}
                    dot={{ fill: '#15803d', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    name={t.dashboard.expenses}
                    stroke="#be123c"
                    strokeWidth={2}
                    dot={{ fill: '#be123c', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-[#9a9a98] text-[13.5px]">
                {t.dashboard.noData}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-[16px] w-[16px] text-[#9a9a98]" strokeWidth={1.8} />
              {t.dashboard.expensesByCategory}
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
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #ebe9e3',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value) => (
                      <span className="text-[12px] text-[#6b6b6b]">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-[#9a9a98] text-[13.5px]">
                {t.dashboard.noData}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart - Category breakdown */}
      {expenseCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.expenseDetails}</CardTitle>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#ebe9e3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatCurrency(value)}
                  stroke="#9a9a98"
                  fontSize={11}
                />
                <YAxis
                  type="category"
                  dataKey="categoryName"
                  width={90}
                  stroke="#9a9a98"
                  fontSize={11}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #ebe9e3',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="total" name={t.reports.amount} radius={[0, 6, 6, 0]}>
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
        t={t}
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
  t: Translations
}

function QuickTransactionModal({
  isOpen,
  onClose,
  categories,
  paymentMethods,
  onSubmit,
  isLoading,
  t,
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
      title={t.quickTransaction.title}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type Toggle — segmented control */}
        <div className="flex p-1 bg-[#faf9f5] border border-[#ebe9e3] rounded-full gap-1">
          <button
            type="button"
            className={cn(
              "flex-1 py-2 px-4 rounded-full text-[13px] font-medium transition-all duration-150 flex items-center justify-center gap-1.5",
              transactionType === 'expense'
                ? "bg-white text-[#be123c] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                : "text-[#6b6b6b] hover:text-[#0a0a0a]"
            )}
            onClick={() => {
              setTransactionType('expense')
              setFormData({ ...formData, categoryId: '' })
            }}
          >
            <ArrowDownRight className="h-[14px] w-[14px]" strokeWidth={1.8} />
            {t.quickTransaction.expense}
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 py-2 px-4 rounded-full text-[13px] font-medium transition-all duration-150 flex items-center justify-center gap-1.5",
              transactionType === 'income'
                ? "bg-white text-[#15803d] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                : "text-[#6b6b6b] hover:text-[#0a0a0a]"
            )}
            onClick={() => {
              setTransactionType('income')
              setFormData({ ...formData, categoryId: '' })
            }}
          >
            <ArrowUpRight className="h-[14px] w-[14px]" strokeWidth={1.8} />
            {t.quickTransaction.income}
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-[12.5px] font-medium text-[#6b6b6b] mb-1.5">
            {t.quickTransaction.amount}
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            className={cn(
              "text-2xl font-bold h-14 text-center tabular-nums",
              transactionType === 'expense' ? "text-[#be123c]" : "text-[#15803d]"
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
            <label className="block text-[12.5px] font-medium text-[#6b6b6b] mb-1.5">
              {t.quickTransaction.date}
            </label>
            <DatePicker
              value={formData.date}
              onChange={(value) => setFormData({ ...formData, date: value })}
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-medium text-[#6b6b6b] mb-1.5">
              {t.quickTransaction.category}
            </label>
            <Dropdown
              value={formData.categoryId}
              onChange={(value) => setFormData({ ...formData, categoryId: value })}
              placeholder={t.quickTransaction.selectPlaceholder}
              options={filteredCategories.map(c => ({ value: c.id.toString(), label: c.name }))}
            />
          </div>
        </div>

        {/* Payment Method & Description */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12.5px] font-medium text-[#6b6b6b] mb-1.5">
              {t.quickTransaction.paymentMethod}
            </label>
            <Dropdown
              value={formData.paymentMethodId}
              onChange={(value) => setFormData({ ...formData, paymentMethodId: value })}
              placeholder={t.quickTransaction.selectPlaceholder}
              options={paymentMethods.map(p => ({ value: p.id.toString(), label: p.name }))}
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-medium text-[#6b6b6b] mb-1.5">
              {t.quickTransaction.description}
            </label>
            <Input
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              placeholder={t.quickTransaction.whatFor}
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
              className="h-4 w-4 rounded accent-[#0a0a0a]"
            />
            <span className="text-[13px] text-[#6b6b6b]">{t.quickTransaction.hasReceipt}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enteredInIiko}
              onChange={(e) => setFormData({ ...formData, enteredInIiko: e.target.checked })}
              className="h-4 w-4 rounded accent-[#0a0a0a]"
            />
            <span className="text-[13px] text-[#6b6b6b]">{t.quickTransaction.inIiko}</span>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant={transactionType === 'expense' ? 'destructive' : 'success'}
          size="lg"
          disabled={isLoading || !formData.amount || !formData.categoryId || !formData.paymentMethodId}
          className="w-full text-[14px] font-semibold"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 spinner border-white/30 border-t-white" />
              {t.quickTransaction.saving}
            </div>
          ) : (
            <>
              <Plus className="h-[16px] w-[16px] mr-2" strokeWidth={1.8} />
              {transactionType === 'expense' ? t.quickTransaction.addExpense : t.quickTransaction.addIncome}
            </>
          )}
        </Button>
      </form>
    </Modal>
  )
}
