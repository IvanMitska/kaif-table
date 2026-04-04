import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/context/LanguageContext'
import {
  iikoApi,
  type IikoRevenue,
  type IikoSettings,
  type IikoTopItem,
  type WaiterAnalytics,
  type PaymentAnalytics,
  type GuestAnalytics,
  type ServiceSpeedAnalytics,
  type TableAnalytics,
  type DiscountAnalytics,
  type CookingPlaceAnalytics,
} from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChefHat,
  Clock,
  CreditCard,
  DollarSign,
  Loader2,
  Percent,
  RefreshCw,
  Server,
  Settings,
  ShoppingCart,
  Table2,
  Timer,
  TrendingUp,
  User,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308']

export function IikoSettingsPage() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()

  // Form state
  const [serverUrl, setServerUrl] = useState('')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')

  // Sync date range
  const [syncDateFrom, setSyncDateFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [syncDateTo, setSyncDateTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [activePeriod, setActivePeriod] = useState<string>('7days')

  // Connection test result
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Sync result
  const [syncResult, setSyncResult] = useState<{ success: boolean; itemsImported: number; message?: string } | null>(null)

  // Get settings
  const { data: settings, isLoading: settingsLoading } = useQuery<IikoSettings | null>({
    queryKey: ['iiko-settings'],
    queryFn: iikoApi.getSettings,
  })

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setServerUrl(settings.serverUrl)
      setLogin(settings.login)
    }
  }, [settings])

  // Get revenue data
  const { data: revenueData, isLoading: revenueLoading } = useQuery<IikoRevenue>({
    queryKey: ['iiko-revenue', syncDateFrom, syncDateTo],
    queryFn: () => iikoApi.getRevenue(syncDateFrom, syncDateTo),
    enabled: !!settings?.isActive,
  })

  // Get top items
  const { data: topItems, isLoading: topItemsLoading } = useQuery<IikoTopItem[]>({
    queryKey: ['iiko-top-items', syncDateFrom, syncDateTo],
    queryFn: () => iikoApi.getTopItems(syncDateFrom, syncDateTo, 10),
    enabled: !!settings?.isActive,
  })

  // Extended Analytics
  const { data: waiterData, isLoading: waiterLoading } = useQuery<WaiterAnalytics>({
    queryKey: ['iiko-waiters', syncDateFrom, syncDateTo],
    queryFn: () => iikoApi.getWaiterAnalytics(syncDateFrom, syncDateTo),
    enabled: !!settings?.isActive,
  })

  const { data: paymentData, isLoading: paymentLoading } = useQuery<PaymentAnalytics>({
    queryKey: ['iiko-payments', syncDateFrom, syncDateTo],
    queryFn: () => iikoApi.getPaymentAnalytics(syncDateFrom, syncDateTo),
    enabled: !!settings?.isActive,
  })

  const { data: guestData, isLoading: guestLoading } = useQuery<GuestAnalytics>({
    queryKey: ['iiko-guests', syncDateFrom, syncDateTo],
    queryFn: () => iikoApi.getGuestAnalytics(syncDateFrom, syncDateTo),
    enabled: !!settings?.isActive,
  })

  const { data: serviceSpeedData, isLoading: serviceSpeedLoading } = useQuery<ServiceSpeedAnalytics>({
    queryKey: ['iiko-service-speed', syncDateFrom, syncDateTo],
    queryFn: () => iikoApi.getServiceSpeedAnalytics(syncDateFrom, syncDateTo),
    enabled: !!settings?.isActive,
  })

  const { data: tableData, isLoading: tableLoading } = useQuery<TableAnalytics>({
    queryKey: ['iiko-tables', syncDateFrom, syncDateTo],
    queryFn: () => iikoApi.getTableAnalytics(syncDateFrom, syncDateTo),
    enabled: !!settings?.isActive,
  })

  const { data: discountData, isLoading: discountLoading } = useQuery<DiscountAnalytics>({
    queryKey: ['iiko-discounts', syncDateFrom, syncDateTo],
    queryFn: () => iikoApi.getDiscountAnalytics(syncDateFrom, syncDateTo),
    enabled: !!settings?.isActive,
  })

  const { data: cookingPlaceData, isLoading: cookingPlaceLoading } = useQuery<CookingPlaceAnalytics>({
    queryKey: ['iiko-cooking-places', syncDateFrom, syncDateTo],
    queryFn: () => iikoApi.getCookingPlaceAnalytics(syncDateFrom, syncDateTo),
    enabled: !!settings?.isActive,
  })

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: () => iikoApi.saveSettings({ serverUrl, login, password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iiko-settings'] })
      setPassword('')
    },
  })

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: iikoApi.testConnection,
    onSuccess: (result) => {
      setTestResult(result)
    },
    onError: () => {
      setTestResult({ success: false, message: t.iiko.connectionFailed })
    },
  })

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: () => iikoApi.sync(syncDateFrom, syncDateTo),
    onSuccess: (result) => {
      setSyncResult({ success: result.success, itemsImported: result.itemsImported, message: '' })
      queryClient.invalidateQueries({ queryKey: ['iiko-settings'] })
      queryClient.invalidateQueries({ queryKey: ['iiko-revenue'] })
      queryClient.invalidateQueries({ queryKey: ['iiko-top-items'] })
      queryClient.invalidateQueries({ queryKey: ['iiko-waiters'] })
      queryClient.invalidateQueries({ queryKey: ['iiko-payments'] })
      queryClient.invalidateQueries({ queryKey: ['iiko-guests'] })
      queryClient.invalidateQueries({ queryKey: ['iiko-service-speed'] })
      queryClient.invalidateQueries({ queryKey: ['iiko-tables'] })
      queryClient.invalidateQueries({ queryKey: ['iiko-discounts'] })
      queryClient.invalidateQueries({ queryKey: ['iiko-cooking-places'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || t.iiko.syncFailed
      setSyncResult({ success: false, itemsImported: 0, message })
    },
  })

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    setTestResult(null)
    saveSettingsMutation.mutate()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value)
  }

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.iiko.title}</h1>
        <p className="text-slate-500 mt-1">{t.iiko.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sync Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              {t.iiko.sync}
            </CardTitle>
            <CardDescription>{t.iiko.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick period buttons */}
            <div className="bg-slate-100 p-1.5 rounded-2xl">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const today = format(new Date(), 'yyyy-MM-dd')
                    setSyncDateFrom(today)
                    setSyncDateTo(today)
                    setActivePeriod('today')
                  }}
                  className={`h-11 sm:h-10 px-3 text-sm font-medium rounded-xl transition-none ${
                    activePeriod === 'today'
                      ? 'bg-white text-violet-600 shadow-sm'
                      : 'text-slate-600 active:bg-white/50'
                  }`}
                >
                  {t.iiko.today}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')
                    setSyncDateFrom(yesterday)
                    setSyncDateTo(yesterday)
                    setActivePeriod('yesterday')
                  }}
                  className={`h-11 sm:h-10 px-3 text-sm font-medium rounded-xl transition-none ${
                    activePeriod === 'yesterday'
                      ? 'bg-white text-violet-600 shadow-sm'
                      : 'text-slate-600 active:bg-white/50'
                  }`}
                >
                  {t.iiko.yesterday}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSyncDateFrom(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
                    setSyncDateTo(format(new Date(), 'yyyy-MM-dd'))
                    setActivePeriod('7days')
                  }}
                  className={`h-11 sm:h-10 px-3 text-sm font-medium rounded-xl transition-none ${
                    activePeriod === '7days'
                      ? 'bg-white text-violet-600 shadow-sm'
                      : 'text-slate-600 active:bg-white/50'
                  }`}
                >
                  {t.iiko.days7}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSyncDateFrom(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
                    setSyncDateTo(format(new Date(), 'yyyy-MM-dd'))
                    setActivePeriod('30days')
                  }}
                  className={`h-11 sm:h-10 px-3 text-sm font-medium rounded-xl transition-none ${
                    activePeriod === '30days'
                      ? 'bg-white text-violet-600 shadow-sm'
                      : 'text-slate-600 active:bg-white/50'
                  }`}
                >
                  {t.iiko.days30}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date()
                    setSyncDateFrom(format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd'))
                    setSyncDateTo(format(new Date(), 'yyyy-MM-dd'))
                    setActivePeriod('month')
                  }}
                  className={`h-11 sm:h-10 px-3 text-sm font-medium rounded-xl transition-none ${
                    activePeriod === 'month'
                      ? 'bg-white text-violet-600 shadow-sm'
                      : 'text-slate-600 active:bg-white/50'
                  }`}
                >
                  {t.iiko.thisMonth}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 min-w-0">
                <Label>{t.iiko.dateFrom}</Label>
                <Input
                  type="date"
                  value={syncDateFrom}
                  onChange={(e) => {
                    setSyncDateFrom(e.target.value)
                    setActivePeriod('custom')
                  }}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2 min-w-0">
                <Label>{t.iiko.dateTo}</Label>
                <Input
                  type="date"
                  value={syncDateTo}
                  onChange={(e) => {
                    setSyncDateTo(e.target.value)
                    setActivePeriod('custom')
                  }}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Sync result */}
            {syncResult && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  syncResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {syncResult.success ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="text-sm">
                  {syncResult.success
                    ? `${t.iiko.syncSuccess}: ${syncResult.itemsImported} ${t.iiko.itemsImported}`
                    : (syncResult.message || t.iiko.syncFailed)}
                </span>
              </div>
            )}

            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || !settings?.isActive}
              className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 border-0 shadow-lg shadow-purple-500/25"
            >
              {syncMutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {syncMutation.isPending ? t.iiko.syncing : t.iiko.syncData}
            </Button>

            {!settings?.isActive && (
              <p className="text-sm text-slate-500 text-center">{t.iiko.notConfigured}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Stats */}
      {settings?.isActive && (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t.iiko.totalRevenue}</p>
                    <p className="text-2xl font-bold">
                      {revenueLoading ? '...' : formatCurrency(revenueData?.totalRevenue || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t.iiko.orderCount}</p>
                    <p className="text-2xl font-bold">
                      {revenueLoading ? '...' : revenueData?.orderCount || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t.iiko.averageCheck}</p>
                    <p className="text-2xl font-bold">
                      {revenueLoading ? '...' : formatCurrency(revenueData?.averageCheck || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t.iiko.itemsSold}</p>
                    <p className="text-2xl font-bold">
                      {revenueLoading ? '...' : revenueData?.totalQuantity || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t.iiko.byCategory}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : revenueData?.byCategory && revenueData.byCategory.length > 0 ? (
                  <div className="flex flex-col">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={revenueData.byCategory}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ percent }) =>
                            (percent || 0) >= 0.05 ? `${((percent || 0) * 100).toFixed(0)}%` : ''
                          }
                          labelLine={false}
                        >
                          {revenueData.byCategory.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value) || 0)}
                          labelFormatter={(label) => label}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      {revenueData.byCategory.map((item, index) => (
                        <div key={item.category} className="flex items-center gap-1 text-xs">
                          <div
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-slate-600">{item.category}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-500">
                    {t.dashboard.noData}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue by Day */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t.iiko.byDay}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : revenueData?.byDay && revenueData.byDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData.byDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => format(new Date(value), 'dd.MM')}
                      />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value) || 0)}
                        labelFormatter={(label) => format(new Date(label), 'dd.MM.yyyy')}
                      />
                      <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-500">
                    {t.dashboard.noData}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Hour and Category Bar Chart */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue by Hour */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t.iiko.revenueByHour}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : revenueData?.byHour && revenueData.byHour.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData.byHour}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="hour"
                        tickFormatter={(value) => `${value}:00`}
                      />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value) || 0)}
                        labelFormatter={(label) => `${label}:00 - ${Number(label) + 1}:00`}
                      />
                      <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-500">
                    {t.dashboard.noData}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue by Category Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t.iiko.revenueByCategory}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : revenueData?.byCategory && revenueData.byCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={revenueData.byCategory.filter(c => c.amount > 0).slice(0, 10)}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                      <YAxis
                        type="category"
                        dataKey="category"
                        width={120}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(value) => formatCurrency(Number(value) || 0)} />
                      <Bar dataKey="amount" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-500">
                    {t.dashboard.noData}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Average Check by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t.iiko.avgCheckByCategory}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : revenueData?.byCategory && revenueData.byCategory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-slate-500">{t.iiko.direction}</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-500">{t.iiko.revenue}</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-500">%</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-500">{t.iiko.orders}</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-500">{t.iiko.avgCheck}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueData.byCategory
                        .filter((item) => item.amount > 0)
                        .map((item) => (
                          <tr key={item.category} className="border-b last:border-0 hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium">{item.category || '(без категории)'}</td>
                            <td className="py-3 px-4 text-right">{formatCurrency(item.amount)}</td>
                            <td className="py-3 px-4 text-right text-slate-500">
                              {((item.amount / revenueData.totalRevenue) * 100).toFixed(1)}%
                            </td>
                            <td className="py-3 px-4 text-right">{item.orderCount}</td>
                            <td className="py-3 px-4 text-right font-medium text-primary">
                              {formatCurrency(item.averageCheck)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-slate-500">
                  {t.dashboard.noData}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t.iiko.topItems}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topItemsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : topItems && topItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-slate-500">#</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-500">{t.iiko.position}</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-500">{t.iiko.qty}</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-500">{t.iiko.avgPrice}</th>
                        <th className="text-right py-3 px-4 font-medium text-slate-500">{t.iiko.amount}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topItems.map((item, index) => (
                        <tr key={item.dishId} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-500">{index + 1}</td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{item.dishName}</p>
                              <p className="text-sm text-slate-500">{item.category}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">{item.quantity}</td>
                          <td className="py-3 px-4 text-right text-slate-600">
                            {formatCurrency(item.quantity > 0 ? item.amount / item.quantity : 0)}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-primary">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-slate-500">
                  {t.dashboard.noData}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extended Analytics Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Waiters Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t.iiko.byWaiter || 'По официантам'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {waiterLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : waiterData?.byWaiter && waiterData.byWaiter.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 font-medium text-slate-500 text-sm">{t.iiko.waiter || 'Официант'}</th>
                          <th className="text-right py-2 px-2 font-medium text-slate-500 text-sm">{t.iiko.revenue || 'Выручка'}</th>
                          <th className="text-right py-2 px-2 font-medium text-slate-500 text-sm">{t.iiko.orders || 'Заказы'}</th>
                          <th className="text-right py-2 px-2 font-medium text-slate-500 text-sm">{t.iiko.avgCheck || 'Ср. чек'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {waiterData.byWaiter.slice(0, 10).map((item) => (
                          <tr key={item.waiterId || item.waiterName} className="border-b last:border-0 hover:bg-slate-50">
                            <td className="py-2 px-2 font-medium text-sm">{item.waiterName}</td>
                            <td className="py-2 px-2 text-right text-sm">{formatCurrency(item.revenue)}</td>
                            <td className="py-2 px-2 text-right text-sm">{item.orderCount}</td>
                            <td className="py-2 px-2 text-right text-sm text-primary font-medium">{formatCurrency(item.averageCheck)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-500">
                    {t.dashboard.noData}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Types Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t.iiko.byPaymentType || 'По типам оплаты'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : paymentData?.byPaymentType && paymentData.byPaymentType.length > 0 ? (
                  <div className="flex flex-col">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={paymentData.byPaymentType}
                          dataKey="revenue"
                          nameKey="paymentType"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ percent }) =>
                            (percent || 0) >= 0.05 ? `${((percent || 0) * 100).toFixed(0)}%` : ''
                          }
                          labelLine={false}
                        >
                          {paymentData.byPaymentType.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value) || 0)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      {paymentData.byPaymentType.map((item, index) => (
                        <div key={item.paymentType} className="flex items-center gap-1 text-xs">
                          <div
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-slate-600">{item.paymentType}: {formatCurrency(item.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-500">
                    {t.dashboard.noData}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Guest Analytics and Service Speed */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Guest Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t.iiko.byGuests || 'По гостям'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {guestLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : guestData?.summary?.hasGuestData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-500">{t.iiko.totalGuests || 'Всего гостей'}</p>
                        <p className="text-xl font-bold">{guestData.summary.totalGuests}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-500">{t.iiko.avgCheckPerGuest || 'Ср. чек на гостя'}</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(guestData.summary.avgCheckPerGuest)}</p>
                      </div>
                    </div>
                    {guestData.byGuestCount && guestData.byGuestCount.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-2 font-medium text-slate-500 text-sm">{t.iiko.guestCount || 'Гостей'}</th>
                              <th className="text-right py-2 px-2 font-medium text-slate-500 text-sm">{t.iiko.orders || 'Заказы'}</th>
                              <th className="text-right py-2 px-2 font-medium text-slate-500 text-sm">{t.iiko.avgCheck || 'Ср. чек'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {guestData.byGuestCount.map((item) => (
                              <tr key={item.label} className="border-b last:border-0 hover:bg-slate-50">
                                <td className="py-2 px-2 font-medium text-sm">{item.label}</td>
                                <td className="py-2 px-2 text-right text-sm">{item.orderCount}</td>
                                <td className="py-2 px-2 text-right text-sm text-primary font-medium">{formatCurrency(item.avgCheck)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-500">
                    {t.iiko.noGuestData || 'Нет данных о гостях'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Speed Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  {t.iiko.serviceSpeed || 'Скорость обслуживания'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {serviceSpeedLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (serviceSpeedData?.summary?.totalOrders ?? 0) > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-500">{t.iiko.avgServiceTime || 'Среднее время'}</p>
                        <p className="text-xl font-bold">{Math.round(serviceSpeedData?.summary?.avgServiceMinutes ?? 0)} {t.iiko.minutes || 'мин'}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-500">{t.iiko.medianServiceTime || 'Медиана'}</p>
                        <p className="text-xl font-bold text-primary">{Math.round(serviceSpeedData?.summary?.medianServiceMinutes ?? 0)} {t.iiko.minutes || 'мин'}</p>
                      </div>
                    </div>
                    {serviceSpeedData?.byHour && serviceSpeedData.byHour.length > 0 && (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={serviceSpeedData?.byHour}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="hour"
                            tickFormatter={(value) => `${value}:00`}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis tickFormatter={(value) => `${Math.round(value)}`} tick={{ fontSize: 11 }} />
                          <Tooltip
                            formatter={(value) => [`${Math.round(Number(value))} мин`, 'Среднее время']}
                            labelFormatter={(label) => `${label}:00 - ${Number(label) + 1}:00`}
                          />
                          <Bar dataKey="avgMinutes" fill="#f97316" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-500">
                    {t.dashboard.noData}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tables and Discounts Analytics */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Tables Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table2 className="h-5 w-5" />
                  {t.iiko.byTables || 'По столам'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tableLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : tableData?.byTable && tableData.byTable.length > 0 ? (
                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 font-medium text-slate-500 text-sm">{t.iiko.table || 'Стол'}</th>
                          <th className="text-right py-2 px-2 font-medium text-slate-500 text-sm">{t.iiko.revenue || 'Выручка'}</th>
                          <th className="text-right py-2 px-2 font-medium text-slate-500 text-sm">{t.iiko.orders || 'Заказы'}</th>
                          <th className="text-right py-2 px-2 font-medium text-slate-500 text-sm">{t.iiko.guests || 'Гости'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.byTable.map((item) => (
                          <tr key={item.tableNum} className="border-b last:border-0 hover:bg-slate-50">
                            <td className="py-2 px-2 font-medium text-sm">#{item.tableNum}</td>
                            <td className="py-2 px-2 text-right text-sm">{formatCurrency(item.revenue)}</td>
                            <td className="py-2 px-2 text-right text-sm">{item.orderCount}</td>
                            <td className="py-2 px-2 text-right text-sm text-primary">{item.guestCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-500">
                    {t.dashboard.noData}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discounts Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  {t.iiko.byDiscounts || 'По скидкам'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {discountLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : discountData?.summary ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-500">{t.iiko.totalDiscount || 'Всего скидок'}</p>
                        <p className="text-xl font-bold text-red-500">{formatCurrency(discountData.summary.totalDiscount)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-500">{t.iiko.discountPercent || '% от выручки'}</p>
                        <p className="text-xl font-bold">{discountData.summary.discountPercentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    {discountData.byDiscountType && discountData.byDiscountType.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-2 font-medium text-slate-500 text-sm">{t.iiko.discountType || 'Тип скидки'}</th>
                              <th className="text-right py-2 px-2 font-medium text-slate-500 text-sm">{t.iiko.amount || 'Сумма'}</th>
                              <th className="text-right py-2 px-2 font-medium text-slate-500 text-sm">%</th>
                            </tr>
                          </thead>
                          <tbody>
                            {discountData.byDiscountType.map((item) => (
                              <tr key={item.discountType} className="border-b last:border-0 hover:bg-slate-50">
                                <td className="py-2 px-2 font-medium text-sm">{item.discountType}</td>
                                <td className="py-2 px-2 text-right text-sm text-red-500">{formatCurrency(item.totalDiscount)}</td>
                                <td className="py-2 px-2 text-right text-sm">{item.percentage.toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-500">
                    {t.dashboard.noData}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cooking Places Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                {t.iiko.byCookingPlace || 'По местам приготовления'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cookingPlaceLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : cookingPlaceData?.byCookingPlace && cookingPlaceData.byCookingPlace.length > 0 ? (
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={cookingPlaceData.byCookingPlace}
                          dataKey="revenue"
                          nameKey="cookingPlace"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ percent }) =>
                            (percent || 0) >= 0.05 ? `${((percent || 0) * 100).toFixed(0)}%` : ''
                          }
                          labelLine={false}
                        >
                          {cookingPlaceData.byCookingPlace.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value) || 0)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 font-medium text-slate-500 text-sm">{t.iiko.place || 'Место'}</th>
                          <th className="text-right py-2 px-2 font-medium text-slate-500 text-sm">{t.iiko.revenue || 'Выручка'}</th>
                          <th className="text-right py-2 px-2 font-medium text-slate-500 text-sm">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cookingPlaceData.byCookingPlace.map((item, index) => (
                          <tr key={item.cookingPlace} className="border-b last:border-0 hover:bg-slate-50">
                            <td className="py-2 px-2 font-medium text-sm flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-sm"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              {item.cookingPlace}
                            </td>
                            <td className="py-2 px-2 text-right text-sm">{formatCurrency(item.revenue)}</td>
                            <td className="py-2 px-2 text-right text-sm text-primary">{item.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-slate-500">
                  {t.dashboard.noData}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Settings Card - at the bottom */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t.iiko.settings}
          </CardTitle>
          <CardDescription>
            {settings?.lastSyncAt
              ? `${t.iiko.lastSync}: ${format(new Date(settings.lastSyncAt), 'dd.MM.yyyy HH:mm')}`
              : `${t.iiko.lastSync}: ${t.iiko.never}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serverUrl">{t.iiko.serverUrl}</Label>
              <div className="relative">
                <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="serverUrl"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder={t.iiko.serverUrlPlaceholder}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login">{t.iiko.login}</Label>
              <Input
                id="login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder={t.iiko.loginPlaceholder}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t.iiko.password}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.iiko.passwordPlaceholder}
                required={!settings}
              />
            </div>

            {/* Test result */}
            {testResult && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}

            {/* Save result */}
            {saveSettingsMutation.isSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm">{t.iiko.settingsSaved}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" disabled={saveSettingsMutation.isPending} className="w-full sm:w-auto">
                {saveSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saveSettingsMutation.isPending ? t.iiko.saving : t.iiko.saveSettings}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending || !settings}
                className="w-full sm:w-auto"
              >
                {testConnectionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {testConnectionMutation.isPending ? t.iiko.testing : t.iiko.testConnection}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
