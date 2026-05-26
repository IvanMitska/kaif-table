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

const COLORS = [
  '#6d28d9',
  '#2563eb',
  '#047857',
  '#b45309',
  '#be123c',
  '#0891b2',
  '#7c3aed',
  '#b8d92e',
  '#db2777',
  '#475569',
]

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
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="page-title">{t.reports.title}</h2>
          <p className="page-subtitle">{t.reports.subtitle}</p>
        </div>
      </div>

      {/* Date Range & Export controls */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Date Range */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[13px] text-[#9a9a98] w-8 shrink-0">{t.reports.from}</span>
                <DatePicker
                  value={dateFrom}
                  onChange={setDateFrom}
                  className="flex-1 sm:w-40"
                />
              </div>
              <span className="text-[#ebe9e3] hidden sm:block select-none">—</span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[13px] text-[#9a9a98] w-8 shrink-0">{t.reports.to}</span>
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
              >
                {isExporting === 'excel' ? (
                  <div className="w-4 h-4 spinner mr-2" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-2" strokeWidth={1.8} />
                )}
                {t.reports.exportExcel}
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPdf}
                disabled={isExporting !== null}
              >
                {isExporting === 'pdf' ? (
                  <div className="w-4 h-4 spinner mr-2" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" strokeWidth={1.8} />
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
            <div className="w-8 h-8 spinner" />
            <span className="text-[13px] text-[#9a9a98]">{t.common.loading}</span>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger-animation">
            {/* Total Income */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="eyebrow mb-2">{t.reports.totalIncome}</p>
                    <p className="text-[26px] font-bold tracking-[-0.03em] tabular-nums text-[#15803d]">
                      {formatCurrency(stats?.totalIncome || 0)}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-[12px] bg-[#ecfdf5] flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-[18px] h-[18px] text-[#047857]" strokeWidth={1.8} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Expenses */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="eyebrow mb-2">{t.reports.totalExpenses}</p>
                    <p className="text-[26px] font-bold tracking-[-0.03em] tabular-nums text-[#be123c]">
                      {formatCurrency(Math.abs(stats?.totalExpenses || 0))}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-[12px] bg-[#fef2f2] flex items-center justify-center shrink-0">
                    <ArrowDownRight className="w-[18px] h-[18px] text-[#be123c]" strokeWidth={1.8} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Net Profit */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="eyebrow mb-2">{t.reports.netProfit}</p>
                    <p className={cn(
                      "text-[26px] font-bold tracking-[-0.03em] tabular-nums",
                      balance >= 0 ? "text-[#2563eb]" : "text-[#b45309]"
                    )}>
                      {formatCurrency(balance)}
                    </p>
                  </div>
                  <div className={cn(
                    "w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0",
                    balance >= 0 ? "bg-[#dbeafe]" : "bg-[#fef3c7]"
                  )}>
                    <Wallet className={cn(
                      "w-[18px] h-[18px]",
                      balance >= 0 ? "text-[#2563eb]" : "text-[#b45309]"
                    )} strokeWidth={1.8} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Count */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="eyebrow mb-2">{t.reports.transactionCount}</p>
                    <p className="text-[26px] font-bold tracking-[-0.03em] tabular-nums text-[#6d28d9]">
                      {stats?.transactionCount || 0}
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-[12px] bg-[#f3effc] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-[18px] h-[18px] text-[#6d28d9]" strokeWidth={1.8} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expenses by Category Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[12px] bg-[#f3effc] flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-[#6d28d9]" strokeWidth={1.8} />
                </div>
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
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center gap-3">
                  <div className="w-11 h-11 rounded-[12px] bg-[#faf9f5] flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-[#9a9a98]" strokeWidth={1.8} />
                  </div>
                  <span className="text-[13px] text-[#9a9a98]">{t.reports.noData}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Tables */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Expenses Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[12px] bg-[#fef2f2] flex items-center justify-center">
                    <ArrowDownRight className="w-4 h-4 text-[#be123c]" strokeWidth={1.8} />
                  </div>
                  <span className="text-[#be123c]">{t.reports.totalExpenses}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {expenseCategories.map((cat) => {
                    const total = Math.abs(stats?.totalExpenses || 1)
                    const percent = (Math.abs(cat.total) / total) * 100
                    return (
                      <div
                        key={cat.categoryId}
                        className="flex items-center justify-between px-3 py-2.5 rounded-[12px] hover:bg-[#faf9f5] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color || '#be123c' }}
                          />
                          <span className="text-[13.5px] font-medium text-[#1f1f1f]">
                            {cat.categoryName}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[13.5px] font-semibold tabular-nums text-[#be123c]">
                            {formatCurrency(Math.abs(cat.total))}
                          </span>
                          <span className="text-[12px] text-[#9a9a98] tabular-nums w-12 text-right">
                            {percent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {expenseCategories.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <div className="w-11 h-11 rounded-[12px] bg-[#faf9f5] flex items-center justify-center">
                        <ArrowDownRight className="w-5 h-5 text-[#9a9a98]" strokeWidth={1.8} />
                      </div>
                      <span className="text-[13px] text-[#9a9a98]">{t.reports.noData}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Income Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-[12px] bg-[#ecfdf5] flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-[#047857]" strokeWidth={1.8} />
                  </div>
                  <span className="text-[#15803d]">{t.reports.totalIncome}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {incomeCategories.map((cat) => {
                    const total = stats?.totalIncome || 1
                    const percent = (cat.total / total) * 100
                    return (
                      <div
                        key={cat.categoryId}
                        className="flex items-center justify-between px-3 py-2.5 rounded-[12px] hover:bg-[#faf9f5] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color || '#047857' }}
                          />
                          <span className="text-[13.5px] font-medium text-[#1f1f1f]">
                            {cat.categoryName}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[13.5px] font-semibold tabular-nums text-[#15803d]">
                            {formatCurrency(cat.total)}
                          </span>
                          <span className="text-[12px] text-[#9a9a98] tabular-nums w-12 text-right">
                            {percent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {incomeCategories.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <div className="w-11 h-11 rounded-[12px] bg-[#faf9f5] flex items-center justify-center">
                        <ArrowUpRight className="w-5 h-5 text-[#9a9a98]" strokeWidth={1.8} />
                      </div>
                      <span className="text-[13px] text-[#9a9a98]">{t.reports.noData}</span>
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
                <div className="w-8 h-8 rounded-[12px] bg-[#eff6ff] flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#2563eb]" strokeWidth={1.8} />
                </div>
                {t.reports.byPaymentMethod}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats?.byPaymentMethod?.map((pm) => (
                  <div
                    key={pm.paymentMethodId}
                    className="p-4 rounded-[16px] border border-[#ebe9e3] bg-[#faf9f5] hover:border-[#e0ddd4] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className={cn(
                        "w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0",
                        pm.total >= 0 ? "bg-[#ecfdf5]" : "bg-[#fef2f2]"
                      )}>
                        <CreditCard className={cn(
                          "w-[17px] h-[17px]",
                          pm.total >= 0 ? "text-[#047857]" : "text-[#be123c]"
                        )} strokeWidth={1.8} />
                      </div>
                      <span className="text-[13px] font-medium text-[#1f1f1f] leading-tight">
                        {pm.paymentMethodName}
                      </span>
                    </div>
                    <p className={cn(
                      "text-[22px] font-bold tracking-[-0.03em] tabular-nums",
                      pm.total >= 0 ? "text-[#15803d]" : "text-[#be123c]"
                    )}>
                      {formatCurrency(pm.total)}
                    </p>
                  </div>
                ))}
                {(!stats?.byPaymentMethod || stats.byPaymentMethod.length === 0) && (
                  <div className="col-span-full flex flex-col items-center justify-center py-10 gap-3">
                    <div className="w-11 h-11 rounded-[12px] bg-[#faf9f5] flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-[#9a9a98]" strokeWidth={1.8} />
                    </div>
                    <span className="text-[13px] text-[#9a9a98]">{t.reports.noData}</span>
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
