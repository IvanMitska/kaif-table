import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/datepicker'
import { Dropdown } from '@/components/ui/dropdown'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLanguage } from '@/context/LanguageContext'
import { categoriesApi, paymentMethodsApi, transactionsApi, exportApi } from '@/lib/api'
import type { Translations } from '@/lib/i18n'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import type { Category, PaymentMethod, Transaction, TransactionFilters } from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  Filter,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'

export function TransactionsPage() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<TransactionFilters & { page?: number; limit?: number }>({
    page: 1,
    limit: 20,
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Queries
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionsApi.getAll(filters),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: paymentMethodsApi.getAll,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: transactionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setIsModalOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Transaction> }) =>
      transactionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setIsModalOpen(false)
      setEditingTransaction(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  const handleExportExcel = async () => {
    const blob = await exportApi.toExcel(filters)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    a.click()
  }

  const transactions = transactionsData?.data || []
  const total = transactionsData?.total || 0
  const page = filters.page || 1
  const limit = filters.limit || 20
  const totalPages = Math.ceil(total / limit)

  const activeFiltersCount = [filters.dateFrom, filters.dateTo, filters.categoryId, filters.paymentMethodId].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Header with search and actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t.transactions.search}
            className="pl-10 bg-white border-slate-200 focus:border-primary"
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(activeFiltersCount > 0 && "border-primary text-primary")}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t.common.filter}
            {activeFiltersCount > 0 && (
              <span className="ml-2 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={() => { setEditingTransaction(null); setIsModalOpen(true) }} className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25">
            <Plus className="h-4 w-4 mr-2" />
            {t.transactions.addTransaction}
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="animate-fadeIn border-slate-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex flex-col gap-3">
              {/* Date Range */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">{t.transactions.from}</span>
                  <DatePicker
                    value={filters.dateFrom || ''}
                    onChange={(value) => setFilters({ ...filters, dateFrom: value, page: 1 })}
                    className="flex-1 sm:w-40"
                  />
                  <span className="text-sm text-slate-500">{t.transactions.to}</span>
                  <DatePicker
                    value={filters.dateTo || ''}
                    onChange={(value) => setFilters({ ...filters, dateTo: value, page: 1 })}
                    className="flex-1 sm:w-40"
                  />
                </div>
              </div>
              {/* Category & Payment Method */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Dropdown
                  className="w-full sm:w-48"
                  value={filters.categoryId?.toString() || ''}
                  onChange={(value) => setFilters({ ...filters, categoryId: Number(value) || undefined, page: 1 })}
                  placeholder={t.transactions.allCategories}
                  options={[
                    { value: '', label: t.transactions.allCategories },
                    ...categories.map((cat) => ({ value: cat.id.toString(), label: cat.name }))
                  ]}
                />
                <Dropdown
                  className="w-full sm:w-44"
                  value={filters.paymentMethodId?.toString() || ''}
                  onChange={(value) => setFilters({ ...filters, paymentMethodId: Number(value) || undefined, page: 1 })}
                  placeholder={t.transactions.allPaymentMethods}
                  options={[
                    { value: '', label: t.transactions.allPaymentMethods },
                    ...paymentMethods.map((pm) => ({ value: pm.id.toString(), label: pm.name }))
                  ]}
                />
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ page: 1, limit: 20 })}
                    className="text-slate-500 hover:text-slate-700 self-start sm:self-auto"
                  >
                    <X className="h-4 w-4 mr-1" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              {t.transactions.title}
              <Badge variant="secondary" className="font-normal">{total}</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <FileIcon className="h-12 w-12 mb-3 text-slate-300" />
              <p className="font-medium">{t.transactions.noTransactions}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                    <TableHead className="font-semibold text-slate-600">{t.transactions.table.date}</TableHead>
                    <TableHead className="font-semibold text-slate-600">{t.transactions.table.amount}</TableHead>
                    <TableHead className="font-semibold text-slate-600">{t.transactions.table.category}</TableHead>
                    <TableHead className="font-semibold text-slate-600">{t.transactions.table.description}</TableHead>
                    <TableHead className="font-semibold text-slate-600">{t.transactions.table.paymentMethod}</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-center">{t.transactionModal.hasReceipt}</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-center">iiko</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction, index) => (
                    <TableRow
                      key={transaction.id}
                      className="group hover:bg-slate-50/50"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell className="font-medium text-slate-700">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "font-semibold",
                          transaction.amount >= 0 ? "text-emerald-600" : "text-red-600"
                        )}>
                          {formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-normal"
                          style={{
                            borderColor: transaction.category?.color || '#e2e8f0',
                            backgroundColor: `${transaction.category?.color}15` || 'transparent'
                          }}
                        >
                          {transaction.category?.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <div className="truncate text-slate-700">{transaction.service}</div>
                        {transaction.comment && (
                          <div className="text-xs text-slate-400 truncate">{transaction.comment}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">{transaction.paymentMethod?.name}</TableCell>
                      <TableCell className="text-center">
                        {transaction.hasReceipt ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                            <X className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {transaction.enteredInIiko ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                            <X className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-slate-100"
                            onClick={() => { setEditingTransaction(transaction); setIsModalOpen(true) }}
                          >
                            <Edit2 className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(t.transactions.deleteConfirm)) {
                                deleteMutation.mutate(transaction.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/30">
                <p className="text-sm text-slate-500">
                  Показано {(page - 1) * limit + 1} — {Math.min(page * limit, total)} из {total}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setFilters({ ...filters, page: page - 1 })}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 text-sm font-medium text-slate-600">
                    {page} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setFilters({ ...filters, page: page + 1 })}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTransaction(null) }}
        transaction={editingTransaction}
        categories={categories}
        paymentMethods={paymentMethods}
        onSubmit={(data) => {
          if (editingTransaction) {
            updateMutation.mutate({ id: editingTransaction.id, data })
          } else {
            createMutation.mutate(data as Parameters<typeof createMutation.mutate>[0])
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
        t={t}
      />
    </div>
  )
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  categories: Category[]
  paymentMethods: PaymentMethod[]
  onSubmit: (data: Partial<Transaction>) => void
  isLoading: boolean
  t: Translations
}

function TransactionModal({
  isOpen,
  onClose,
  transaction,
  categories,
  paymentMethods,
  onSubmit,
  isLoading,
  t,
}: TransactionModalProps) {
  const [formData, setFormData] = useState({
    date: transaction?.date ? format(new Date(transaction.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    amount: transaction?.amount || 0,
    categoryId: transaction?.categoryId || categories[0]?.id || 0,
    paymentMethodId: transaction?.paymentMethodId || paymentMethods[0]?.id || 0,
    service: transaction?.service || '',
    supplier: transaction?.supplier || '',
    comment: transaction?.comment || '',
    hasReceipt: transaction?.hasReceipt ?? false,
    enteredInIiko: transaction?.enteredInIiko ?? false,
  })

  // Reset form when modal opens
  useState(() => {
    if (isOpen) {
      setFormData({
        date: transaction?.date ? format(new Date(transaction.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        amount: transaction?.amount || 0,
        categoryId: transaction?.categoryId || categories[0]?.id || 0,
        paymentMethodId: transaction?.paymentMethodId || paymentMethods[0]?.id || 0,
        service: transaction?.service || '',
        supplier: transaction?.supplier || '',
        comment: transaction?.comment || '',
        hasReceipt: transaction?.hasReceipt ?? false,
        enteredInIiko: transaction?.enteredInIiko ?? false,
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? t.transactionModal.editTitle : t.transactionModal.addTitle}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.transactionModal.date}</label>
            <DatePicker
              value={formData.date}
              onChange={(value) => setFormData({ ...formData, date: value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.transactionModal.amount} (THB)</label>
            <Input
              type="number"
              step="0.01"
              className="bg-white"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.transactionModal.category}</label>
            <Dropdown
              value={formData.categoryId.toString()}
              onChange={(value) => setFormData({ ...formData, categoryId: parseInt(value) })}
              options={categories.map((cat) => ({ value: cat.id.toString(), label: cat.name }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.transactionModal.paymentMethod}</label>
            <Dropdown
              value={formData.paymentMethodId.toString()}
              onChange={(value) => setFormData({ ...formData, paymentMethodId: parseInt(value) })}
              options={paymentMethods.map((pm) => ({ value: pm.id.toString(), label: pm.name }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.transactionModal.description}</label>
          <Input
            className="bg-white"
            value={formData.service}
            onChange={(e) => setFormData({ ...formData, service: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.transactionModal.supplier}</label>
            <Input
              className="bg-white"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.transactionModal.comment}</label>
            <Input
              className="bg-white"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-6 py-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasReceipt}
              onChange={(e) => setFormData({ ...formData, hasReceipt: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-slate-700">{t.transactionModal.hasReceipt}</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enteredInIiko}
              onChange={(e) => setFormData({ ...formData, enteredInIiko: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-slate-700">{t.transactionModal.enteredInIiko}</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            {t.transactionModal.cancel}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90"
          >
            {isLoading ? t.transactionModal.saving : t.transactionModal.save}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
