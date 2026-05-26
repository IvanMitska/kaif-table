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
  type NomenclatureData,
  type WaiterDetailedAnalytics,
} from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  DollarSign,
  Loader2,
  List,
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

const COLORS = ['#6d28d9', '#2563eb', '#047857', '#b45309', '#be123c', '#0891b2', '#7c3aed', '#b8d92e', '#db2777', '#475569']

export function IikoSettingsPage() {
  const { t, language } = useLanguage()
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

  // Nomenclature
  const [showNomenclature, setShowNomenclature] = useState(false)
  const { data: nomenclatureData, isLoading: nomenclatureLoading, refetch: refetchNomenclature } = useQuery<NomenclatureData>({
    queryKey: ['iiko-nomenclature'],
    queryFn: iikoApi.getNomenclature,
    enabled: false, // manual fetch only
  })

  // Detailed waiter analytics
  const { data: waiterDetailedData, isLoading: waiterDetailedLoading, error: waiterDetailedErrorObj } = useQuery<WaiterDetailedAnalytics>({
    queryKey: ['iiko-waiters-detailed', syncDateFrom, syncDateTo],
    queryFn: () => iikoApi.getWaiterDetailedAnalytics(syncDateFrom, syncDateTo),
    enabled: !!settings?.isActive,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  // Expanded waiter details
  const [expandedWaiter, setExpandedWaiter] = useState<string | null>(null)

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
      queryClient.invalidateQueries({ queryKey: ['iiko-waiters-detailed'] })
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
        <div className="w-8 h-8 spinner" />
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">{t.iiko.title}</h1>
          <p className="page-subtitle">{t.iiko.subtitle}</p>
        </div>
        {settings?.isActive !== undefined && (
          <div className={`pill ${settings.isActive ? 'bg-[#ecfdf5] text-[#15803d] border-[#d1fae5]' : 'bg-[#fef2f2] text-[#be123c] border-[#fee2e2]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${settings.isActive ? 'bg-[#15803d] pulse-dot' : 'bg-[#be123c]'}`} />
            {settings.isActive
              ? (language === 'ru' ? 'Подключено' : 'เชื่อมต่อแล้ว')
              : (language === 'ru' ? 'Не подключено' : 'ไม่ได้เชื่อมต่อ')}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sync Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="icon-soft w-8 h-8 bg-[#f3effc] text-[#6d28d9]">
                <RefreshCw strokeWidth={1.8} className="w-4 h-4" />
              </div>
              {t.iiko.sync}
            </CardTitle>
            <CardDescription>{t.iiko.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick period buttons — segmented control */}
            <div className="bg-[#faf9f5] border border-[#ebe9e3] rounded-full p-1">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const today = format(new Date(), 'yyyy-MM-dd')
                    setSyncDateFrom(today)
                    setSyncDateTo(today)
                    setActivePeriod('today')
                  }}
                  className={`h-9 px-3 text-[13px] font-medium rounded-full transition-colors ${
                    activePeriod === 'today'
                      ? 'bg-[#0a0a0a] text-white'
                      : 'text-[#6b6b6b] hover:text-[#0a0a0a]'
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
                  className={`h-9 px-3 text-[13px] font-medium rounded-full transition-colors ${
                    activePeriod === 'yesterday'
                      ? 'bg-[#0a0a0a] text-white'
                      : 'text-[#6b6b6b] hover:text-[#0a0a0a]'
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
                  className={`h-9 px-3 text-[13px] font-medium rounded-full transition-colors ${
                    activePeriod === '7days'
                      ? 'bg-[#0a0a0a] text-white'
                      : 'text-[#6b6b6b] hover:text-[#0a0a0a]'
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
                  className={`h-9 px-3 text-[13px] font-medium rounded-full transition-colors ${
                    activePeriod === '30days'
                      ? 'bg-[#0a0a0a] text-white'
                      : 'text-[#6b6b6b] hover:text-[#0a0a0a]'
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
                  className={`h-9 px-3 text-[13px] font-medium rounded-full transition-colors ${
                    activePeriod === 'month'
                      ? 'bg-[#0a0a0a] text-white'
                      : 'text-[#6b6b6b] hover:text-[#0a0a0a]'
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
                className={`flex items-center gap-2 p-3 rounded-[12px] border text-[13.5px] ${
                  syncResult.success
                    ? 'bg-[#ecfdf5] text-[#15803d] border-[#d1fae5]'
                    : 'bg-[#fef2f2] text-[#be123c] border-[#fee2e2]'
                }`}
              >
                {syncResult.success ? (
                  <CheckCircle2 strokeWidth={1.8} className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle strokeWidth={1.8} className="h-4 w-4 shrink-0" />
                )}
                <span>
                  {syncResult.success
                    ? `${t.iiko.syncSuccess}: ${syncResult.itemsImported} ${t.iiko.itemsImported}`
                    : (syncResult.message || t.iiko.syncFailed)}
                </span>
              </div>
            )}

            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || !settings?.isActive}
              className="w-full"
            >
              {syncMutation.isPending && <Loader2 strokeWidth={1.8} className="mr-2 h-4 w-4 animate-spin" />}
              {syncMutation.isPending ? t.iiko.syncing : t.iiko.syncData}
            </Button>

            {!settings?.isActive && (
              <p className="text-[13px] text-[#9a9a98] text-center">{t.iiko.notConfigured}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Stats */}
      {settings?.isActive && (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-animation">
            <Card className="card-hover">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-4">
                  <div className="icon-soft w-10 h-10 bg-[#ecfdf5] text-[#047857] shrink-0">
                    <DollarSign strokeWidth={1.8} className="w-[18px] h-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="eyebrow truncate">{t.iiko.totalRevenue}</p>
                    <p className="text-[22px] font-bold text-[#0a0a0a] tabular-nums leading-tight mt-0.5">
                      {revenueLoading ? <span className="shimmer-line inline-block w-24 h-6 rounded" /> : formatCurrency(revenueData?.totalRevenue || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-4">
                  <div className="icon-soft w-10 h-10 bg-[#eff6ff] text-[#2563eb] shrink-0">
                    <ShoppingCart strokeWidth={1.8} className="w-[18px] h-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="eyebrow truncate">{t.iiko.orderCount}</p>
                    <p className="text-[22px] font-bold text-[#0a0a0a] tabular-nums leading-tight mt-0.5">
                      {revenueLoading ? <span className="shimmer-line inline-block w-16 h-6 rounded" /> : revenueData?.orderCount || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-4">
                  <div className="icon-soft w-10 h-10 bg-[#f3effc] text-[#6d28d9] shrink-0">
                    <TrendingUp strokeWidth={1.8} className="w-[18px] h-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="eyebrow truncate">{t.iiko.averageCheck}</p>
                    <p className="text-[22px] font-bold text-[#0a0a0a] tabular-nums leading-tight mt-0.5">
                      {revenueLoading ? <span className="shimmer-line inline-block w-24 h-6 rounded" /> : formatCurrency(revenueData?.averageCheck || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-4">
                  <div className="icon-soft w-10 h-10 bg-[#fffbeb] text-[#b45309] shrink-0">
                    <BarChart3 strokeWidth={1.8} className="w-[18px] h-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="eyebrow truncate">{t.iiko.itemsSold}</p>
                    <p className="text-[22px] font-bold text-[#0a0a0a] tabular-nums leading-tight mt-0.5">
                      {revenueLoading ? <span className="shimmer-line inline-block w-16 h-6 rounded" /> : revenueData?.totalQuantity || 0}
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
                <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                  <div className="icon-soft w-7 h-7 bg-[#f3effc] text-[#6d28d9]">
                    <BarChart3 strokeWidth={1.8} className="w-[15px] h-[15px]" />
                  </div>
                  {t.iiko.byCategory}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 spinner" />
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
                          contentStyle={{ borderRadius: '12px', border: '1px solid #ebe9e3', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      {revenueData.byCategory.map((item, index) => (
                        <div key={item.category} className="flex items-center gap-1 text-xs">
                          <div
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-[#6b6b6b]">{item.category}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <div className="icon-soft w-10 h-10 bg-[#faf9f5] text-[#9a9a98]">
                      <BarChart3 strokeWidth={1.8} className="w-5 h-5" />
                    </div>
                    <span className="text-[13.5px] text-[#9a9a98]">{t.dashboard.noData}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue by Day */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                  <div className="icon-soft w-7 h-7 bg-[#eff6ff] text-[#2563eb]">
                    <Clock strokeWidth={1.8} className="w-[15px] h-[15px]" />
                  </div>
                  {t.iiko.byDay}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 spinner" />
                  </div>
                ) : revenueData?.byDay && revenueData.byDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData.byDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ebe9e3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => format(new Date(value), 'dd.MM')}
                        stroke="#9a9a98"
                        fontSize={11}
                      />
                      <YAxis
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        stroke="#9a9a98"
                        fontSize={11}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value) || 0)}
                        labelFormatter={(label) => format(new Date(label), 'dd.MM.yyyy')}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #ebe9e3', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '12px' }}
                      />
                      <Bar dataKey="amount" fill="#6d28d9" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <div className="icon-soft w-10 h-10 bg-[#faf9f5] text-[#9a9a98]">
                      <Clock strokeWidth={1.8} className="w-5 h-5" />
                    </div>
                    <span className="text-[13.5px] text-[#9a9a98]">{t.dashboard.noData}</span>
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
                <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                  <div className="icon-soft w-7 h-7 bg-[#fffbeb] text-[#b45309]">
                    <Clock strokeWidth={1.8} className="w-[15px] h-[15px]" />
                  </div>
                  {t.iiko.revenueByHour}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 spinner" />
                  </div>
                ) : revenueData?.byHour && revenueData.byHour.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData.byHour}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ebe9e3" />
                      <XAxis
                        dataKey="hour"
                        tickFormatter={(value) => `${value}:00`}
                        stroke="#9a9a98"
                        fontSize={11}
                      />
                      <YAxis
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        stroke="#9a9a98"
                        fontSize={11}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value) || 0)}
                        labelFormatter={(label) => `${label}:00 - ${Number(label) + 1}:00`}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #ebe9e3', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '12px' }}
                      />
                      <Bar dataKey="amount" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <div className="icon-soft w-10 h-10 bg-[#faf9f5] text-[#9a9a98]">
                      <Clock strokeWidth={1.8} className="w-5 h-5" />
                    </div>
                    <span className="text-[13.5px] text-[#9a9a98]">{t.dashboard.noData}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue by Category Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                  <div className="icon-soft w-7 h-7 bg-[#ecfdf5] text-[#047857]">
                    <BarChart3 strokeWidth={1.8} className="w-[15px] h-[15px]" />
                  </div>
                  {t.iiko.revenueByCategory}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 spinner" />
                  </div>
                ) : revenueData?.byCategory && revenueData.byCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={revenueData.byCategory.filter(c => c.amount > 0).slice(0, 10)}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ebe9e3" />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        stroke="#9a9a98"
                        fontSize={11}
                      />
                      <YAxis
                        type="category"
                        dataKey="category"
                        width={120}
                        tick={{ fontSize: 11 }}
                        stroke="#9a9a98"
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value) || 0)}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #ebe9e3', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '12px' }}
                      />
                      <Bar dataKey="amount" fill="#047857" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <div className="icon-soft w-10 h-10 bg-[#faf9f5] text-[#9a9a98]">
                      <BarChart3 strokeWidth={1.8} className="w-5 h-5" />
                    </div>
                    <span className="text-[13.5px] text-[#9a9a98]">{t.dashboard.noData}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Average Check by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                <div className="icon-soft w-7 h-7 bg-[#f3effc] text-[#6d28d9]">
                  <TrendingUp strokeWidth={1.8} className="w-[15px] h-[15px]" />
                </div>
                {t.iiko.avgCheckByCategory}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 spinner" />
                </div>
              ) : revenueData?.byCategory && revenueData.byCategory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#ebe9e3]">
                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.direction}</th>
                        <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.revenue}</th>
                        <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">%</th>
                        <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.orders}</th>
                        <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.avgCheck}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueData.byCategory
                        .filter((item) => item.amount > 0)
                        .map((item) => (
                          <tr key={item.category} className="border-b border-[#ebe9e3] last:border-0 hover:bg-[#faf9f5] transition-colors">
                            <td className="py-3 px-4 text-[13.5px] font-medium text-[#1f1f1f]">{item.category || '(без категории)'}</td>
                            <td className="py-3 px-4 text-right text-[13.5px] tabular-nums">{formatCurrency(item.amount)}</td>
                            <td className="py-3 px-4 text-right text-[13.5px] tabular-nums text-[#6b6b6b]">
                              {((item.amount / revenueData.totalRevenue) * 100).toFixed(1)}%
                            </td>
                            <td className="py-3 px-4 text-right text-[13.5px] tabular-nums">{item.orderCount}</td>
                            <td className="py-3 px-4 text-right text-[13.5px] tabular-nums font-semibold text-[#0a0a0a]">
                              {formatCurrency(item.averageCheck)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 gap-3">
                  <div className="icon-soft w-10 h-10 bg-[#faf9f5] text-[#9a9a98]">
                    <TrendingUp strokeWidth={1.8} className="w-5 h-5" />
                  </div>
                  <span className="text-[13.5px] text-[#9a9a98]">{t.dashboard.noData}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                <div className="icon-soft w-7 h-7 bg-[#fffbeb] text-[#b45309]">
                  <TrendingUp strokeWidth={1.8} className="w-[15px] h-[15px]" />
                </div>
                {t.iiko.topItems}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topItemsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 spinner" />
                </div>
              ) : topItems && topItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#ebe9e3]">
                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">#</th>
                        <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.position}</th>
                        <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.qty}</th>
                        <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.avgPrice}</th>
                        <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.amount}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topItems.map((item, index) => (
                        <tr key={item.dishId} className="border-b border-[#ebe9e3] last:border-0 hover:bg-[#faf9f5] transition-colors">
                          <td className="py-3 px-4 text-[13.5px] tabular-nums text-[#9a9a98]">{index + 1}</td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-[13.5px] font-medium text-[#1f1f1f]">{item.dishName}</p>
                              <p className="text-[12px] text-[#9a9a98]">{item.category}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-[13.5px] tabular-nums">{item.quantity}</td>
                          <td className="py-3 px-4 text-right text-[13.5px] tabular-nums text-[#6b6b6b]">
                            {formatCurrency(item.quantity > 0 ? item.amount / item.quantity : 0)}
                          </td>
                          <td className="py-3 px-4 text-right text-[13.5px] tabular-nums font-semibold text-[#0a0a0a]">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 gap-3">
                  <div className="icon-soft w-10 h-10 bg-[#faf9f5] text-[#9a9a98]">
                    <TrendingUp strokeWidth={1.8} className="w-5 h-5" />
                  </div>
                  <span className="text-[13.5px] text-[#9a9a98]">{t.dashboard.noData}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Waiter Analytics - Full Width */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                <div className="icon-soft w-7 h-7 bg-[#f3effc] text-[#6d28d9]">
                  <Users strokeWidth={1.8} className="w-[15px] h-[15px]" />
                </div>
                {t.iiko.waiterDetailed || 'Детальная аналитика по официантам'}
              </CardTitle>
              {waiterDetailedData?.summary && (
                <CardDescription>
                  {t.iiko.waiterDetailed || 'Официантов'}: {waiterDetailedData.summary.totalWaiters} | {t.iiko.orders}: {waiterDetailedData.summary.totalOrders} | {t.iiko.revenue}: {formatCurrency(waiterDetailedData.summary.totalRevenue)}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {waiterDetailedLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 spinner" />
                </div>
              ) : waiterDetailedErrorObj ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 px-4">
                  <div className="flex items-center gap-2 text-[#be123c]">
                    <AlertCircle strokeWidth={1.8} className="h-4 w-4" />
                    <span className="text-[13.5px] font-semibold">{t.common.error}</span>
                  </div>
                  <span className="text-[12px] text-[#9a9a98] text-center">
                    {(waiterDetailedErrorObj as any)?.response?.data?.message
                      || (waiterDetailedErrorObj as any)?.response?.status
                      || (waiterDetailedErrorObj as Error)?.message
                      || 'Unknown error'}
                  </span>
                </div>
              ) : waiterDetailedData?.waiters && waiterDetailedData.waiters.length > 0 ? (
                <div className="space-y-3">
                  {waiterDetailedData.waiters.map((waiter) => {
                    const isExpanded = expandedWaiter === waiter.waiterId
                    const revenuePercent = waiterDetailedData.summary.totalRevenue > 0
                      ? (waiter.revenue / waiterDetailedData.summary.totalRevenue * 100)
                      : 0
                    return (
                      <div key={waiter.waiterId || waiter.waiterName} className="border border-[#ebe9e3] rounded-[16px] overflow-hidden">
                        {/* Waiter summary row */}
                        <button
                          type="button"
                          onClick={() => setExpandedWaiter(isExpanded ? null : waiter.waiterId)}
                          className="w-full text-left p-4 hover:bg-[#faf9f5] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="icon-soft w-10 h-10 bg-[#f3effc] text-[#6d28d9]">
                                <User strokeWidth={1.8} className="h-[18px] w-[18px]" />
                              </div>
                              <div>
                                <p className="font-semibold text-[13.5px] text-[#1f1f1f]">{waiter.waiterName}</p>
                                <p className="text-[12px] text-[#9a9a98]">
                                  {waiter.daysWorked} {t.iiko.daysWorked || 'дн.'} | {waiter.shiftCount} {t.iiko.shifts || 'смен'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right hidden sm:block">
                                <p className="text-[11px] text-[#9a9a98]">{t.iiko.orders}</p>
                                <p className="font-semibold text-[13.5px] tabular-nums text-[#1f1f1f]">{waiter.orderCount}</p>
                              </div>
                              <div className="text-right hidden sm:block">
                                <p className="text-[11px] text-[#9a9a98]">{t.iiko.avgCheck}</p>
                                <p className="font-semibold text-[13.5px] tabular-nums text-[#1f1f1f]">{formatCurrency(waiter.averageCheck)}</p>
                              </div>
                              <div className="text-right hidden sm:block">
                                <p className="text-[11px] text-[#9a9a98]">{t.iiko.guests}</p>
                                <p className="font-semibold text-[13.5px] tabular-nums text-[#1f1f1f]">{waiter.guestCount}</p>
                              </div>
                              {waiter.avgServiceMinutes > 0 && (
                                <div className="text-right hidden md:block">
                                  <p className="text-[11px] text-[#9a9a98]">{t.iiko.avgServiceTime2 || 'Ср. время'}</p>
                                  <p className="font-semibold text-[13.5px] tabular-nums text-[#1f1f1f]">{Math.round(waiter.avgServiceMinutes)} {t.iiko.minutes}</p>
                                </div>
                              )}
                              <div className="text-right">
                                <p className="text-[11px] text-[#9a9a98]">{t.iiko.revenue}</p>
                                <p className="font-bold text-[13.5px] tabular-nums text-[#0a0a0a]">{formatCurrency(waiter.revenue)}</p>
                                <p className="text-[11px] text-[#9a9a98] tabular-nums">{revenuePercent.toFixed(1)}%</p>
                              </div>
                              {isExpanded
                                ? <ChevronUp strokeWidth={1.8} className="h-4 w-4 text-[#9a9a98]" />
                                : <ChevronDown strokeWidth={1.8} className="h-4 w-4 text-[#9a9a98]" />
                              }
                            </div>
                          </div>
                          {/* Revenue bar */}
                          <div className="mt-2.5 w-full bg-[#ebe9e3] rounded-full h-1.5">
                            <div
                              className="bg-[#6d28d9] h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(revenuePercent, 100)}%` }}
                            />
                          </div>
                        </button>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="border-t border-[#ebe9e3] bg-[#faf9f5] p-4 space-y-4">
                            {/* Mobile stats */}
                            <div className="grid grid-cols-2 gap-3 sm:hidden">
                              <div className="bg-white border border-[#ebe9e3] rounded-[12px] p-3">
                                <p className="text-[11px] text-[#9a9a98]">{t.iiko.orders}</p>
                                <p className="font-bold text-[#0a0a0a] tabular-nums">{waiter.orderCount}</p>
                              </div>
                              <div className="bg-white border border-[#ebe9e3] rounded-[12px] p-3">
                                <p className="text-[11px] text-[#9a9a98]">{t.iiko.avgCheck}</p>
                                <p className="font-bold text-[#0a0a0a] tabular-nums">{formatCurrency(waiter.averageCheck)}</p>
                              </div>
                              <div className="bg-white border border-[#ebe9e3] rounded-[12px] p-3">
                                <p className="text-[11px] text-[#9a9a98]">{t.iiko.guests}</p>
                                <p className="font-bold text-[#0a0a0a] tabular-nums">{waiter.guestCount}</p>
                              </div>
                              {waiter.avgServiceMinutes > 0 && (
                                <div className="bg-white border border-[#ebe9e3] rounded-[12px] p-3">
                                  <p className="text-[11px] text-[#9a9a98]">{t.iiko.avgServiceTime2 || 'Ср. время'}</p>
                                  <p className="font-bold text-[#0a0a0a] tabular-nums">{Math.round(waiter.avgServiceMinutes)} {t.iiko.minutes}</p>
                                </div>
                              )}
                            </div>

                            {/* By Day */}
                            {waiter.byDay.length > 0 && (
                              <div>
                                <h4 className="text-[13px] font-semibold text-[#1f1f1f] mb-2 flex items-center gap-1.5">
                                  <Calendar strokeWidth={1.8} className="h-3.5 w-3.5 text-[#6b6b6b]" /> {t.iiko.byDayBreakdown || 'По дням'}
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-[13px]">
                                    <thead>
                                      <tr className="border-b border-[#ebe9e3]">
                                        <th className="text-left py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.byDay || 'Дата'}</th>
                                        <th className="text-right py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.orders}</th>
                                        <th className="text-right py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.guests}</th>
                                        <th className="text-right py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.avgCheck}</th>
                                        <th className="text-right py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.revenue}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {waiter.byDay.map((d) => (
                                        <tr key={d.date} className="border-b border-[#ebe9e3] last:border-0 hover:bg-white transition-colors">
                                          <td className="py-2 px-2 text-[#1f1f1f]">{new Date(d.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', weekday: 'short' })}</td>
                                          <td className="py-2 px-2 text-right tabular-nums">{d.orderCount}</td>
                                          <td className="py-2 px-2 text-right tabular-nums">{d.guestCount}</td>
                                          <td className="py-2 px-2 text-right tabular-nums">{formatCurrency(d.averageCheck)}</td>
                                          <td className="py-2 px-2 text-right font-semibold tabular-nums text-[#0a0a0a]">{formatCurrency(d.revenue)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* By Category */}
                            {waiter.byCategory.length > 0 && (
                              <div>
                                <h4 className="text-[13px] font-semibold text-[#1f1f1f] mb-2 flex items-center gap-1.5">
                                  <BarChart3 strokeWidth={1.8} className="h-3.5 w-3.5 text-[#6b6b6b]" /> {t.iiko.byCategoryBreakdown || 'По категориям'}
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {waiter.byCategory.map((cat) => (
                                    <div key={cat.category} className="bg-white rounded-[12px] p-2.5 border border-[#ebe9e3]">
                                      <p className="text-[11px] text-[#9a9a98] truncate">{cat.category}</p>
                                      <p className="font-semibold text-[13.5px] tabular-nums text-[#0a0a0a]">{formatCurrency(cat.revenue)}</p>
                                      <p className="text-[11px] text-[#9a9a98] tabular-nums">{cat.quantity} шт.</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Shifts */}
                            {waiter.shifts.length > 0 && (
                              <div>
                                <h4 className="text-[13px] font-semibold text-[#1f1f1f] mb-2 flex items-center gap-1.5">
                                  <Clock strokeWidth={1.8} className="h-3.5 w-3.5 text-[#6b6b6b]" /> {t.iiko.shifts || 'Смены'} ({waiter.shifts.length})
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-[13px]">
                                    <thead>
                                      <tr className="border-b border-[#ebe9e3]">
                                        <th className="text-left py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.shift || 'Смена'}</th>
                                        <th className="text-right py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.orders}</th>
                                        <th className="text-right py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.duration || 'Длит.'}</th>
                                        <th className="text-right py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.revenue}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {waiter.shifts.map((shift) => (
                                        <tr key={shift.sessionNum} className="border-b border-[#ebe9e3] last:border-0 hover:bg-white transition-colors">
                                          <td className="py-2 px-2">
                                            <span className="font-medium text-[#1f1f1f]">#{shift.sessionNum}</span>
                                            <span className="text-[11px] text-[#9a9a98] ml-1">
                                              {new Date(shift.firstOrder).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                                            </span>
                                          </td>
                                          <td className="py-2 px-2 text-right tabular-nums">{shift.orderCount}</td>
                                          <td className="py-2 px-2 text-right tabular-nums">{shift.durationHours.toFixed(1)} {t.iiko.hours || 'ч'}</td>
                                          <td className="py-2 px-2 text-right font-semibold tabular-nums text-[#0a0a0a]">{formatCurrency(shift.revenue)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 gap-3">
                  <div className="icon-soft w-10 h-10 bg-[#faf9f5] text-[#9a9a98]">
                    <Users strokeWidth={1.8} className="w-5 h-5" />
                  </div>
                  <span className="text-[13.5px] text-[#9a9a98]">{t.dashboard.noData}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extended Analytics Section */}
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Waiters Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                  <div className="icon-soft w-7 h-7 bg-[#f3effc] text-[#6d28d9]">
                    <User strokeWidth={1.8} className="w-[15px] h-[15px]" />
                  </div>
                  {t.iiko.byWaiter || 'По официантам'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {waiterLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 spinner" />
                  </div>
                ) : waiterData?.byWaiter && waiterData.byWaiter.length > 0 ? (
                  <div className="overflow-x-auto scroll-refined">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#ebe9e3]">
                          <th className="text-left py-2 px-2 font-semibold uppercase tracking-[0.06em] text-[#9a9a98] text-[11px]">{t.iiko.waiter || 'Официант'}</th>
                          <th className="text-right py-2 px-2 font-semibold uppercase tracking-[0.06em] text-[#9a9a98] text-[11px]">{t.iiko.revenue || 'Выручка'}</th>
                          <th className="text-right py-2 px-2 font-semibold uppercase tracking-[0.06em] text-[#9a9a98] text-[11px]">{t.iiko.orders || 'Заказы'}</th>
                          <th className="text-right py-2 px-2 font-semibold uppercase tracking-[0.06em] text-[#9a9a98] text-[11px]">{t.iiko.avgCheck || 'Ср. чек'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {waiterData.byWaiter.slice(0, 10).map((item) => (
                          <tr key={item.waiterId || item.waiterName} className="border-b border-[#ebe9e3] last:border-0 hover:bg-[#faf9f5] transition-colors">
                            <td className="py-2.5 px-2 font-medium text-[13px] text-[#0a0a0a]">{item.waiterName}</td>
                            <td className="py-2.5 px-2 text-right text-[13px] tabular-nums text-[#1f1f1f]">{formatCurrency(item.revenue)}</td>
                            <td className="py-2.5 px-2 text-right text-[13px] tabular-nums text-[#1f1f1f]">{item.orderCount}</td>
                            <td className="py-2.5 px-2 text-right text-[13px] tabular-nums text-[#6d28d9] font-medium">{formatCurrency(item.averageCheck)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 gap-2">
                    <div className="icon-soft w-10 h-10 bg-[#faf9f5] text-[#9a9a98]">
                      <User strokeWidth={1.8} className="w-[18px] h-[18px]" />
                    </div>
                    <p className="text-[13.5px] text-[#9a9a98]">{t.dashboard.noData}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Types Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                  <div className="icon-soft w-7 h-7 bg-[#ecfdf5] text-[#047857]">
                    <CreditCard strokeWidth={1.8} className="w-[15px] h-[15px]" />
                  </div>
                  {t.iiko.byPaymentType || 'По типам оплаты'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 spinner" />
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
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value) || 0)}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #ebe9e3', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      {paymentData.byPaymentType.map((item, index) => (
                        <div key={item.paymentType} className="flex items-center gap-1 text-xs">
                          <div
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-[#6b6b6b]">{item.paymentType}: {formatCurrency(item.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 gap-3">
                    <div className="icon-soft w-10 h-10 bg-[#faf9f5] text-[#9a9a98]">
                      <CreditCard strokeWidth={1.8} className="w-5 h-5" />
                    </div>
                    <span className="text-[13.5px] text-[#9a9a98]">{t.dashboard.noData}</span>
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
                <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                  <div className="icon-soft w-7 h-7 bg-[#f3effc] text-[#6d28d9]">
                    <Users strokeWidth={1.8} className="w-[15px] h-[15px]" />
                  </div>
                  {t.iiko.byGuests || 'По гостям'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {guestLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 spinner" />
                  </div>
                ) : guestData?.summary?.hasGuestData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#faf9f5] border border-[#ebe9e3] rounded-[12px] p-3">
                        <p className="eyebrow mb-1">{t.iiko.totalGuests || 'Всего гостей'}</p>
                        <p className="text-[22px] font-bold text-[#0a0a0a] tabular-nums">{guestData.summary.totalGuests}</p>
                      </div>
                      <div className="bg-[#faf9f5] border border-[#ebe9e3] rounded-[12px] p-3">
                        <p className="eyebrow mb-1">{t.iiko.avgCheckPerGuest || 'Ср. чек на гостя'}</p>
                        <p className="text-[22px] font-bold text-[#0a0a0a] tabular-nums">{formatCurrency(guestData.summary.avgCheckPerGuest)}</p>
                      </div>
                    </div>
                    {guestData.byGuestCount && guestData.byGuestCount.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-[#ebe9e3]">
                              <th className="text-left py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.guestCount || 'Гостей'}</th>
                              <th className="text-right py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.orders || 'Заказы'}</th>
                              <th className="text-right py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.avgCheck || 'Ср. чек'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {guestData.byGuestCount.map((item) => (
                              <tr key={item.label} className="border-b border-[#ebe9e3] last:border-0 hover:bg-[#faf9f5] transition-colors">
                                <td className="py-2 px-2 text-[13.5px] font-medium text-[#1f1f1f]">{item.label}</td>
                                <td className="py-2 px-2 text-right text-[13.5px] tabular-nums">{item.orderCount}</td>
                                <td className="py-2 px-2 text-right text-[13.5px] tabular-nums font-semibold text-[#0a0a0a]">{formatCurrency(item.avgCheck)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 gap-3">
                    <div className="icon-soft w-10 h-10 bg-[#faf9f5] text-[#9a9a98]">
                      <Users strokeWidth={1.8} className="w-5 h-5" />
                    </div>
                    <span className="text-[13.5px] text-[#9a9a98]">{t.iiko.noGuestData || 'Нет данных о гостях'}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Speed Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                  <div className="icon-soft w-7 h-7 bg-[#fffbeb] text-[#b45309]">
                    <Timer strokeWidth={1.8} className="w-[15px] h-[15px]" />
                  </div>
                  {t.iiko.serviceSpeed || 'Скорость обслуживания'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {serviceSpeedLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 spinner" />
                  </div>
                ) : (serviceSpeedData?.summary?.totalOrders ?? 0) > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#faf9f5] border border-[#ebe9e3] rounded-[12px] p-3">
                        <p className="eyebrow mb-1">{t.iiko.avgServiceTime || 'Среднее время'}</p>
                        <p className="text-[22px] font-bold text-[#0a0a0a] tabular-nums">{Math.round(serviceSpeedData?.summary?.avgServiceMinutes ?? 0)} <span className="text-[14px] font-medium text-[#6b6b6b]">{t.iiko.minutes || 'мин'}</span></p>
                      </div>
                      <div className="bg-[#faf9f5] border border-[#ebe9e3] rounded-[12px] p-3">
                        <p className="eyebrow mb-1">{t.iiko.medianServiceTime || 'Медиана'}</p>
                        <p className="text-[22px] font-bold text-[#0a0a0a] tabular-nums">{Math.round(serviceSpeedData?.summary?.medianServiceMinutes ?? 0)} <span className="text-[14px] font-medium text-[#6b6b6b]">{t.iiko.minutes || 'мин'}</span></p>
                      </div>
                    </div>
                    {serviceSpeedData?.byHour && serviceSpeedData.byHour.length > 0 && (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={serviceSpeedData?.byHour}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ebe9e3" />
                          <XAxis
                            dataKey="hour"
                            tickFormatter={(value) => `${value}:00`}
                            tick={{ fontSize: 11 }}
                            stroke="#9a9a98"
                          />
                          <YAxis tickFormatter={(value) => `${Math.round(value)}`} tick={{ fontSize: 11 }} stroke="#9a9a98" />
                          <Tooltip
                            formatter={(value) => [`${Math.round(Number(value))} мин`, 'Среднее время']}
                            labelFormatter={(label) => `${label}:00 - ${Number(label) + 1}:00`}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #ebe9e3', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '12px' }}
                          />
                          <Bar dataKey="avgMinutes" fill="#b45309" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 gap-3">
                    <div className="icon-soft w-10 h-10 bg-[#faf9f5] text-[#9a9a98]">
                      <Timer strokeWidth={1.8} className="w-5 h-5" />
                    </div>
                    <span className="text-[13.5px] text-[#9a9a98]">{t.dashboard.noData}</span>
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
                <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                  <div className="icon-soft w-7 h-7 bg-[#eff6ff] text-[#2563eb]">
                    <Table2 strokeWidth={1.8} className="w-[15px] h-[15px]" />
                  </div>
                  {t.iiko.byTables || 'По столам'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tableLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 spinner" />
                  </div>
                ) : tableData?.byTable && tableData.byTable.length > 0 ? (
                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-[#ebe9e3]">
                          <th className="text-left py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.table || 'Стол'}</th>
                          <th className="text-right py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.revenue || 'Выручка'}</th>
                          <th className="text-right py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.orders || 'Заказы'}</th>
                          <th className="text-right py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.guests || 'Гости'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.byTable.map((item) => (
                          <tr key={item.tableNum} className="border-b border-[#ebe9e3] last:border-0 hover:bg-[#faf9f5] transition-colors">
                            <td className="py-2 px-2 text-[13.5px] font-medium text-[#1f1f1f]">#{item.tableNum}</td>
                            <td className="py-2 px-2 text-right text-[13.5px] tabular-nums">{formatCurrency(item.revenue)}</td>
                            <td className="py-2 px-2 text-right text-[13.5px] tabular-nums">{item.orderCount}</td>
                            <td className="py-2 px-2 text-right text-[13.5px] tabular-nums font-semibold text-[#0a0a0a]">{item.guestCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 gap-3">
                    <div className="icon-soft w-10 h-10 bg-[#faf9f5] text-[#9a9a98]">
                      <Table2 strokeWidth={1.8} className="w-5 h-5" />
                    </div>
                    <span className="text-[13.5px] text-[#9a9a98]">{t.dashboard.noData}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discounts Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                  <div className="icon-soft w-7 h-7 bg-[#fef2f2] text-[#be123c]">
                    <Percent strokeWidth={1.8} className="w-[15px] h-[15px]" />
                  </div>
                  {t.iiko.byDiscounts || 'По скидкам'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {discountLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 spinner" />
                  </div>
                ) : discountData?.summary ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#fef2f2] border border-[#fee2e2] rounded-[12px] p-3">
                        <p className="eyebrow mb-1 text-[#be123c]">{t.iiko.totalDiscount || 'Всего скидок'}</p>
                        <p className="text-[22px] font-bold text-[#be123c] tabular-nums">{formatCurrency(discountData.summary.totalDiscount)}</p>
                      </div>
                      <div className="bg-[#faf9f5] border border-[#ebe9e3] rounded-[12px] p-3">
                        <p className="eyebrow mb-1">{t.iiko.discountPercent || '% от выручки'}</p>
                        <p className="text-[22px] font-bold text-[#0a0a0a] tabular-nums">{discountData.summary.discountPercentage.toFixed(1)}%</p>
                      </div>
                    </div>
                    {discountData.byDiscountType && discountData.byDiscountType.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-[#ebe9e3]">
                              <th className="text-left py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.discountType || 'Тип скидки'}</th>
                              <th className="text-right py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.amount || 'Сумма'}</th>
                              <th className="text-right py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">%</th>
                            </tr>
                          </thead>
                          <tbody>
                            {discountData.byDiscountType.map((item) => (
                              <tr key={item.discountType} className="border-b border-[#ebe9e3] last:border-0 hover:bg-[#faf9f5] transition-colors">
                                <td className="py-2 px-2 text-[13.5px] font-medium text-[#1f1f1f]">{item.discountType}</td>
                                <td className="py-2 px-2 text-right text-[13.5px] tabular-nums text-[#be123c]">{formatCurrency(item.totalDiscount)}</td>
                                <td className="py-2 px-2 text-right text-[13.5px] tabular-nums text-[#6b6b6b]">{item.percentage.toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 gap-3">
                    <div className="icon-soft w-10 h-10 bg-[#faf9f5] text-[#9a9a98]">
                      <Percent strokeWidth={1.8} className="w-5 h-5" />
                    </div>
                    <span className="text-[13.5px] text-[#9a9a98]">{t.dashboard.noData}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cooking Places Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                <div className="icon-soft w-7 h-7 bg-[#fffbeb] text-[#b45309]">
                  <ChefHat strokeWidth={1.8} className="w-[15px] h-[15px]" />
                </div>
                {t.iiko.byCookingPlace || 'По местам приготовления'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cookingPlaceLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 spinner" />
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
                        <Tooltip
                          formatter={(value) => formatCurrency(Number(value) || 0)}
                          contentStyle={{ borderRadius: '12px', border: '1px solid #ebe9e3', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#ebe9e3]">
                          <th className="text-left py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.place || 'Место'}</th>
                          <th className="text-right py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.revenue || 'Выручка'}</th>
                          <th className="text-right py-2 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cookingPlaceData.byCookingPlace.map((item, index) => (
                          <tr key={item.cookingPlace} className="border-b border-[#ebe9e3] last:border-0 hover:bg-[#faf9f5] transition-colors">
                            <td className="py-2 px-2 text-[13.5px] font-medium text-[#1f1f1f] flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-sm shrink-0"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              {item.cookingPlace}
                            </td>
                            <td className="py-2 px-2 text-right text-[13.5px] tabular-nums">{formatCurrency(item.revenue)}</td>
                            <td className="py-2 px-2 text-right text-[13.5px] tabular-nums font-semibold text-[#0a0a0a]">{item.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 gap-3">
                  <div className="icon-soft w-10 h-10 bg-[#faf9f5] text-[#9a9a98]">
                    <ChefHat strokeWidth={1.8} className="w-5 h-5" />
                  </div>
                  <span className="text-[13.5px] text-[#9a9a98]">{t.dashboard.noData}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Nomenclature Section */}
      {settings?.isActive && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
                  <div className="icon-soft w-7 h-7 bg-[#eff6ff] text-[#2563eb]">
                    <List strokeWidth={1.8} className="w-[15px] h-[15px]" />
                  </div>
                  {t.iiko.nomenclature || 'Номенклатура'}
                </CardTitle>
                <CardDescription>{t.iiko.nomenclatureSubtitle || 'Актуальное меню из iiko'}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNomenclature(true)
                  refetchNomenclature()
                }}
                disabled={nomenclatureLoading}
              >
                {nomenclatureLoading && <Loader2 strokeWidth={1.8} className="mr-2 h-4 w-4 animate-spin" />}
                {nomenclatureLoading ? (t.iiko.loadingNomenclature || 'Загрузка...') : (t.iiko.loadNomenclature || 'Загрузить меню')}
              </Button>
            </div>
          </CardHeader>
          {showNomenclature && (
            <CardContent>
              {nomenclatureLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 spinner" />
                </div>
              ) : nomenclatureData ? (
                <div className="space-y-5">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#f3effc] border border-[#e9e3f8] rounded-[16px] p-4 text-center">
                      <p className="text-[26px] font-bold text-[#6d28d9] tabular-nums">{nomenclatureData.totalItems}</p>
                      <p className="eyebrow mt-1">{t.iiko.totalItems || 'Позиций'}</p>
                    </div>
                    <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-[16px] p-4 text-center">
                      <p className="text-[26px] font-bold text-[#2563eb] tabular-nums">{nomenclatureData.totalGroups}</p>
                      <p className="eyebrow mt-1">{t.iiko.totalGroups || 'Групп'}</p>
                    </div>
                    <div className="bg-[#ecfdf5] border border-[#d1fae5] rounded-[16px] p-4 text-center">
                      <p className="text-[26px] font-bold text-[#047857] tabular-nums">{nomenclatureData.totalCategories}</p>
                      <p className="eyebrow mt-1">{t.iiko.byCategory || 'Категорий'}</p>
                    </div>
                  </div>

                  {/* Categories list */}
                  {nomenclatureData.categories.length > 0 && (
                    <div>
                      <h4 className="text-[13px] font-semibold text-[#1f1f1f] mb-2">{t.iiko.byCategory || 'Категории'}</h4>
                      <div className="flex flex-wrap gap-2">
                        {nomenclatureData.categories.map((cat) => (
                          <span key={cat.id} className="px-3 py-1 bg-[#faf9f5] border border-[#ebe9e3] rounded-full text-[13px] text-[#6b6b6b]">
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Groups with items */}
                  <div className="space-y-2">
                    {nomenclatureData.byGroup.map((group) => (
                      <details key={group.group} className="border border-[#ebe9e3] rounded-[16px] overflow-hidden">
                        <summary className="px-4 py-3 cursor-pointer hover:bg-[#faf9f5] transition-colors flex items-center justify-between list-none">
                          <span className="font-medium text-[13.5px] text-[#1f1f1f]">{group.group}</span>
                          <span className="text-[11px] font-semibold text-[#6b6b6b] bg-[#faf9f5] border border-[#ebe9e3] px-2 py-0.5 rounded-full tabular-nums">{group.itemCount}</span>
                        </summary>
                        <div className="border-t border-[#ebe9e3] bg-[#faf9f5] px-4 py-2">
                          <table className="w-full text-[13px]">
                            <thead>
                              <tr className="border-b border-[#ebe9e3]">
                                <th className="text-left py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.position || 'Позиция'}</th>
                                <th className="text-left py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.code || 'Код'}</th>
                                <th className="text-right py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9a9a98]">{t.iiko.price || 'Цена'}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map((item) => (
                                <tr key={item.id} className="border-b border-[#ebe9e3] last:border-0 hover:bg-white transition-colors">
                                  <td className="py-2 text-[#1f1f1f]">
                                    <span>{item.name}</span>
                                    {item.categoryName && (
                                      <span className="text-[11px] text-[#9a9a98] ml-2">{item.categoryName}</span>
                                    )}
                                  </td>
                                  <td className="py-2 text-[#9a9a98]">{item.code || '—'}</td>
                                  <td className="py-2 text-right font-semibold tabular-nums text-[#0a0a0a]">
                                    {item.price ? formatCurrency(item.price) : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 gap-3">
                  <div className="icon-soft w-10 h-10 bg-[#faf9f5] text-[#9a9a98]">
                    <List strokeWidth={1.8} className="w-5 h-5" />
                  </div>
                  <span className="text-[13.5px] text-[#9a9a98]">{t.dashboard.noData}</span>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Settings Card - at the bottom */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[15px] font-semibold">
            <div className="icon-soft w-7 h-7 bg-[#faf9f5] text-[#6b6b6b] border border-[#ebe9e3]">
              <Settings strokeWidth={1.8} className="w-[15px] h-[15px]" />
            </div>
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
                <Server strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a9a98]" />
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
                className={`flex items-center gap-2 p-3 rounded-[12px] border text-[13.5px] ${
                  testResult.success
                    ? 'bg-[#ecfdf5] text-[#15803d] border-[#d1fae5]'
                    : 'bg-[#fef2f2] text-[#be123c] border-[#fee2e2]'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 strokeWidth={1.8} className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle strokeWidth={1.8} className="h-4 w-4 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Save result */}
            {saveSettingsMutation.isSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-[12px] bg-[#ecfdf5] border border-[#d1fae5] text-[#15803d] text-[13.5px]">
                <CheckCircle2 strokeWidth={1.8} className="h-4 w-4 shrink-0" />
                <span>{t.iiko.settingsSaved}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" disabled={saveSettingsMutation.isPending} className="w-full sm:w-auto">
                {saveSettingsMutation.isPending && <Loader2 strokeWidth={1.8} className="mr-2 h-4 w-4 animate-spin" />}
                {saveSettingsMutation.isPending ? t.iiko.saving : t.iiko.saveSettings}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending || !settings}
                className="w-full sm:w-auto"
              >
                {testConnectionMutation.isPending && <Loader2 strokeWidth={1.8} className="mr-2 h-4 w-4 animate-spin" />}
                {testConnectionMutation.isPending ? t.iiko.testing : t.iiko.testConnection}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
