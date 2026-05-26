import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/datepicker'
import { Dropdown } from '@/components/ui/dropdown'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  FileText,
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
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="page-title">{t.transactions.title}</h1>
          <p className="page-subtitle">{t.transactions.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download strokeWidth={1.8} className="h-4 w-4 mr-1.5" />
            Excel
          </Button>
          <Button
            onClick={() => { setEditingTransaction(null); setIsModalOpen(true) }}
          >
            <Plus strokeWidth={1.8} className="h-4 w-4 mr-1.5" />
            {t.transactions.addTransaction}
          </Button>
        </div>
      </div>

      {/* Search + filter toggle bar */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search
            strokeWidth={1.8}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-[17px] w-[17px] text-[#9a9a98]"
          />
          <Input
            placeholder={t.transactions.search}
            className="pl-9"
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'btn-press inline-flex items-center gap-2 h-10 px-3.5 rounded-[12px] text-[13.5px] font-medium border transition-colors',
            activeFiltersCount > 0
              ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
              : 'bg-white text-[#1f1f1f] border-[#ebe9e3] hover:bg-[#faf9f5]'
          )}
        >
          <Filter strokeWidth={1.8} className="h-[16px] w-[16px]" />
          {t.common.filter}
          {activeFiltersCount > 0 && (
            <span className="ml-0.5 w-[18px] h-[18px] rounded-full bg-white/20 text-white text-[11px] font-semibold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="animate-fadeIn">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col gap-3">
              {/* Date Range */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] text-[#6b6b6b]">{t.transactions.from}</span>
                <DatePicker
                  value={filters.dateFrom || ''}
                  onChange={(value) => setFilters({ ...filters, dateFrom: value, page: 1 })}
                  className="w-40"
                />
                <span className="text-[13px] text-[#6b6b6b]">{t.transactions.to}</span>
                <DatePicker
                  value={filters.dateTo || ''}
                  onChange={(value) => setFilters({ ...filters, dateTo: value, page: 1 })}
                  className="w-40"
                />
              </div>
              {/* Category & Payment Method */}
              <div className="flex flex-wrap items-center gap-2">
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
                  <button
                    type="button"
                    onClick={() => setFilters({ page: 1, limit: 20 })}
                    className="btn-press inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[13px] text-[#6b6b6b] border border-[#ebe9e3] bg-white hover:bg-[#faf9f5] transition-colors"
                  >
                    <X strokeWidth={1.8} className="h-[14px] w-[14px]" />
                    {t.common.reset}
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions table card */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-[#ebe9e3] px-5 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[15px] font-semibold text-[#0a0a0a] flex items-center gap-2">
              {t.transactions.title}
              <Badge variant="secondary" className="font-normal tabular-nums">{total}</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 spinner" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-12 h-12 rounded-[12px] bg-[#faf9f5] border border-[#ebe9e3] flex items-center justify-center">
                <FileText strokeWidth={1.8} className="h-[22px] w-[22px] text-[#9a9a98]" />
              </div>
              <p className="text-[13.5px] text-[#9a9a98]">{t.transactions.noTransactions}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] uppercase tracking-[0.06em] text-[#9a9a98] font-semibold">
                      {t.transactions.table.date}
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-[0.06em] text-[#9a9a98] font-semibold">
                      {t.transactions.table.amount}
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-[0.06em] text-[#9a9a98] font-semibold">
                      {t.transactions.table.category}
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-[0.06em] text-[#9a9a98] font-semibold">
                      {t.transactions.table.description}
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-[0.06em] text-[#9a9a98] font-semibold">
                      {t.transactions.table.paymentMethod}
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-[0.06em] text-[#9a9a98] font-semibold text-center">
                      {t.transactionModal.hasReceipt}
                    </TableHead>
                    <TableHead className="text-[11px] uppercase tracking-[0.06em] text-[#9a9a98] font-semibold text-center">
                      iiko
                    </TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction, index) => (
                    <TableRow
                      key={transaction.id}
                      className="group border-b border-[#ebe9e3] hover:bg-[#faf9f5] transition-colors"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell className="text-[13.5px] font-medium text-[#1f1f1f]">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          'tabular-nums text-[13.5px] font-semibold',
                          transaction.amount >= 0 ? 'text-[#15803d]' : 'text-[#be123c]'
                        )}>
                          {formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-normal text-[12px]"
                          style={{
                            borderColor: transaction.category?.color || '#ebe9e3',
                            backgroundColor: `${transaction.category?.color}15` || 'transparent'
                          }}
                        >
                          {transaction.category?.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <div className="truncate text-[13.5px] text-[#1f1f1f]">{transaction.service}</div>
                        {transaction.comment && (
                          <div className="text-[12px] text-[#9a9a98] truncate mt-0.5">{transaction.comment}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-[13.5px] text-[#6b6b6b]">
                        {transaction.paymentMethod?.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {transaction.hasReceipt ? (
                          <span className="pill bg-[#ecfdf5] text-[#15803d] border-[#d1fae5] mx-auto">
                            <Check strokeWidth={2} className="h-3 w-3" />
                          </span>
                        ) : (
                          <span className="pill bg-[#faf9f5] text-[#9a9a98] border-[#ebe9e3] mx-auto">
                            <X strokeWidth={2} className="h-3 w-3" />
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {transaction.enteredInIiko ? (
                          <span className="pill bg-[#ecfdf5] text-[#15803d] border-[#d1fae5] mx-auto">
                            <Check strokeWidth={2} className="h-3 w-3" />
                          </span>
                        ) : (
                          <span className="pill bg-[#faf9f5] text-[#9a9a98] border-[#ebe9e3] mx-auto">
                            <X strokeWidth={2} className="h-3 w-3" />
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            className="btn-press w-8 h-8 rounded-[10px] flex items-center justify-center text-[#6b6b6b] hover:bg-[#faf9f5] hover:text-[#1f1f1f] transition-colors"
                            onClick={() => { setEditingTransaction(transaction); setIsModalOpen(true) }}
                          >
                            <Edit2 strokeWidth={1.8} className="h-[15px] w-[15px]" />
                          </button>
                          <button
                            type="button"
                            className="btn-press w-8 h-8 rounded-[10px] flex items-center justify-center text-[#6b6b6b] hover:bg-[#fef2f2] hover:text-[#be123c] transition-colors"
                            onClick={() => {
                              if (confirm(t.transactions.deleteConfirm)) {
                                deleteMutation.mutate(transaction.id)
                              }
                            }}
                          >
                            <Trash2 strokeWidth={1.8} className="h-[15px] w-[15px]" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#ebe9e3] bg-[#faf9f5]">
                <p className="text-[13px] text-[#9a9a98] tabular-nums">
                  {t.transactions.showing} {(page - 1) * limit + 1} — {Math.min(page * limit, total)} {t.transactions.of} {total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setFilters({ ...filters, page: page - 1 })}
                    className="btn-press w-8 h-8 rounded-full flex items-center justify-center border border-[#ebe9e3] bg-white text-[#6b6b6b] hover:bg-[#faf9f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft strokeWidth={1.8} className="h-4 w-4" />
                  </button>
                  <span className="px-3 text-[13px] font-medium text-[#1f1f1f] tabular-nums">
                    {page} / {totalPages || 1}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setFilters({ ...filters, page: page + 1 })}
                    className="btn-press w-8 h-8 rounded-full flex items-center justify-center border border-[#ebe9e3] bg-white text-[#6b6b6b] hover:bg-[#faf9f5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight strokeWidth={1.8} className="h-4 w-4" />
                  </button>
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
          <div className="space-y-1.5">
            <Label>{t.transactionModal.date}</Label>
            <DatePicker
              value={formData.date}
              onChange={(value) => setFormData({ ...formData, date: value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.transactionModal.amount} (THB)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t.transactionModal.category}</Label>
            <Dropdown
              value={formData.categoryId.toString()}
              onChange={(value) => setFormData({ ...formData, categoryId: parseInt(value) })}
              options={categories.map((cat) => ({ value: cat.id.toString(), label: cat.name }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.transactionModal.paymentMethod}</Label>
            <Dropdown
              value={formData.paymentMethodId.toString()}
              onChange={(value) => setFormData({ ...formData, paymentMethodId: parseInt(value) })}
              options={paymentMethods.map((pm) => ({ value: pm.id.toString(), label: pm.name }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t.transactionModal.description}</Label>
          <Input
            value={formData.service}
            onChange={(e) => setFormData({ ...formData, service: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t.transactionModal.supplier}</Label>
            <Input
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.transactionModal.comment}</Label>
            <Input
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
              className="h-4 w-4 rounded border-[#ebe9e3] accent-[#0a0a0a]"
            />
            <span className="text-[13.5px] text-[#6b6b6b]">{t.transactionModal.hasReceipt}</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enteredInIiko}
              onChange={(e) => setFormData({ ...formData, enteredInIiko: e.target.checked })}
              className="h-4 w-4 rounded border-[#ebe9e3] accent-[#0a0a0a]"
            />
            <span className="text-[13.5px] text-[#6b6b6b]">{t.transactionModal.enteredInIiko}</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#ebe9e3]">
          <Button type="button" variant="outline" onClick={onClose}>
            {t.transactionModal.cancel}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 spinner" />
                {t.transactionModal.saving}
              </span>
            ) : t.transactionModal.save}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
