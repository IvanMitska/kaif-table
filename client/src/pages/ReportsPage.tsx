import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/datepicker'
import { useLanguage } from '@/context/LanguageContext'
import { dashboardApi, exportApi } from '@/lib/api'
import { cn, formatCurrency } from '@/lib/utils'
import type { DashboardStats } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { format, subMonths } from 'date-fns'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CreditCard,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6']

export function ReportsPage() {
  const { t } = useLanguage()
  const [dateFrom, setDateFrom] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null)

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['report-stats', dateFrom, dateTo],
    queryFn: () => dashboardApi.getStats(dateFrom, dateTo),
  })

  const handleExportExcel = async () => {
    setIsExporting('excel')
    try {
      const blob = await exportApi.toExcel({ dateFrom, dateTo })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${dateFrom}-${dateTo}.xlsx`
      a.click()
    } finally {
      setIsExporting(null)
    }
  }

  const handleExportPdf = async () => {
    setIsExporting('pdf')
    try {
      const blob = await exportApi.toPdf({ dateFrom, dateTo })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${dateFrom}-${dateTo}.pdf`
      a.click()
    } finally {
      setIsExporting(null)
    }
  }

  const balance = (stats?.totalIncome || 0) + (stats?.totalExpenses || 0)
  const expenseCategories = stats?.byCategory?.filter(c => c.total < 0) || []
  const incomeCategories = stats?.byCategory?.filter(c => c.total > 0) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.reports.title}</h2>
          <p className="text-slate-500 mt-1">{t.reports.subtitle}</p>
        </div>
      </div>

      {/* Date Range & Export */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-bl-full" />
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Date Range */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-slate-500 w-8">{t.reports.from}</span>
                <DatePicker
                  value={dateFrom}
                  onChange={setDateFrom}
                  className="flex-1 sm:w-40"
                />
              </div>
              <span className="text-slate-300 hidden sm:block">—</span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-slate-500 w-8">{t.reports.to}</span>
                <DatePicker
                  value={dateTo}
                  onChange={setDateTo}
                  className="flex-1 sm:w-40"
                />
              </div>
            </div>
            <div className="hidden sm:flex flex-1" />
            {/* Export Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={isExporting !== null}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
              >
                {isExporting === 'excel' ? (
                  <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mr-2" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                )}
                {t.reports.exportExcel}
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPdf}
                disabled={isExporting !== null}
                className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
              >
                {isExporting === 'pdf' ? (
                  <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin mr-2" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                {t.reports.exportPdf}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <span className="text-sm text-slate-500">{t.common.loading}</span>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full" />
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{t.reports.totalIncome}</p>
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
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-full" />
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{t.reports.totalExpenses}</p>
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
                "absolute top-0 right-0 w-24 h-24 rounded-bl-full",
                balance >= 0 ? "bg-gradient-to-br from-blue-500/10 to-transparent" : "bg-gradient-to-br from-orange-500/10 to-transparent"
              )} />
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{t.reports.netProfit}</p>
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
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-full" />
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{t.reports.transactionCount}</p>
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

          {/* Expenses by Category Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-slate-400" />
                {t.reports.byCategory}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenseCategories.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(300, expenseCategories.length * 50)}>
                  <BarChart
                    data={expenseCategories.map(c => ({
                      ...c,
                      total: Math.abs(c.total),
                    }))}
                    layout="vertical"
                    margin={{ left: 100, right: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(value) => formatCurrency(value)}
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <YAxis
                      type="category"
                      dataKey="categoryName"
                      width={90}
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar dataKey="total" name={t.reports.amount} radius={[0, 6, 6, 0]}>
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-slate-400">
                  {t.reports.noData}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Tables */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Expenses Table */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/5 to-transparent rounded-bl-full" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  </div>
                  {t.reports.totalExpenses}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expenseCategories.map((cat) => {
                    const total = Math.abs(stats?.totalExpenses || 1)
                    const percent = (Math.abs(cat.total) / total) * 100
                    return (
                      <div
                        key={cat.categoryId}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color || '#ef4444' }}
                          />
                          <span className="font-medium text-slate-700">{cat.categoryName}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-red-600 font-semibold">
                            {formatCurrency(Math.abs(cat.total))}
                          </span>
                          <span className="text-sm text-slate-400 w-14 text-right">
                            {percent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {expenseCategories.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      {t.reports.noData}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Income Table */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-bl-full" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-600">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                  </div>
                  {t.reports.totalIncome}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {incomeCategories.map((cat) => {
                    const total = stats?.totalIncome || 1
                    const percent = (cat.total / total) * 100
                    return (
                      <div
                        key={cat.categoryId}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color || '#10b981' }}
                          />
                          <span className="font-medium text-slate-700">{cat.categoryName}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-emerald-600 font-semibold">
                            {formatCurrency(cat.total)}
                          </span>
                          <span className="text-sm text-slate-400 w-14 text-right">
                            {percent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {incomeCategories.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      {t.reports.noData}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-slate-400" />
                {t.reports.byPaymentMethod}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats?.byPaymentMethod?.map((pm) => (
                  <div
                    key={pm.paymentMethodId}
                    className={cn(
                      "p-5 rounded-2xl border-2 transition-all hover:shadow-md",
                      pm.total >= 0
                        ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-100"
                        : "bg-gradient-to-br from-red-50 to-white border-red-100"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        pm.total >= 0 ? "bg-emerald-100" : "bg-red-100"
                      )}>
                        <CreditCard className={cn(
                          "h-5 w-5",
                          pm.total >= 0 ? "text-emerald-600" : "text-red-600"
                        )} />
                      </div>
                      <span className="font-medium text-slate-700">{pm.paymentMethodName}</span>
                    </div>
                    <p className={cn(
                      "text-2xl font-bold",
                      pm.total >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {formatCurrency(pm.total)}
                    </p>
                  </div>
                ))}
                {(!stats?.byPaymentMethod || stats.byPaymentMethod.length === 0) && (
                  <div className="col-span-full text-center py-8 text-slate-400">
                    {t.reports.noData}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
