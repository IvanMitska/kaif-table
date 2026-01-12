import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/context/LanguageContext'
import { iikoApi, type IikoRevenue, type IikoSettings, type IikoTopItem } from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  RefreshCw,
  Server,
  Settings,
  ShoppingCart,
  TrendingUp,
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
        {/* Settings Card */}
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

              <div className="flex gap-2">
                <Button type="submit" disabled={saveSettingsMutation.isPending}>
                  {saveSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saveSettingsMutation.isPending ? t.iiko.saving : t.iiko.saveSettings}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => testConnectionMutation.mutate()}
                  disabled={testConnectionMutation.isPending || !settings}
                >
                  {testConnectionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {testConnectionMutation.isPending ? t.iiko.testing : t.iiko.testConnection}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.iiko.dateFrom}</Label>
                <Input
                  type="date"
                  value={syncDateFrom}
                  onChange={(e) => setSyncDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.iiko.dateTo}</Label>
                <Input
                  type="date"
                  value={syncDateTo}
                  onChange={(e) => setSyncDateTo(e.target.value)}
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
              className="w-full"
            >
              {syncMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                        <th className="text-left py-3 px-4 font-medium text-slate-500">
                          {t.reports.category}
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-slate-500">
                          {t.iiko.quantity}
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-slate-500">
                          {t.iiko.amount}
                        </th>
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
                          <td className="py-3 px-4">{item.quantity}</td>
                          <td className="py-3 px-4 text-right font-medium">
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
        </>
      )}
    </div>
  )
}
