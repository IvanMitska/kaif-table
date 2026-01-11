import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dropdown } from '@/components/ui/dropdown'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { useLanguage } from '@/context/LanguageContext'
import { categoriesApi, paymentMethodsApi } from '@/lib/api'
import type { Translations } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Category, PaymentMethod } from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Edit2, FolderOpen, Plus, Trash2, Wallet } from 'lucide-react'
import { useState, useEffect } from 'react'

export function CategoriesPage() {
  const { t } = useLanguage()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'categories' | 'payment-methods'>('categories')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null)
  const [newCategoryType, setNewCategoryType] = useState<'expense' | 'income'>('expense')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  })

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: paymentMethodsApi.getAll,
  })

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setIsModalOpen(false)
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setIsModalOpen(false)
      setEditingCategory(null)
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  // Payment Method mutations
  const createPaymentMethodMutation = useMutation({
    mutationFn: paymentMethodsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      setIsModalOpen(false)
    },
  })

  const updatePaymentMethodMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PaymentMethod> }) =>
      paymentMethodsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      setIsModalOpen(false)
      setEditingPaymentMethod(null)
    },
  })

  const deletePaymentMethodMutation = useMutation({
    mutationFn: paymentMethodsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
  })

  const expenseCategories = categories.filter(c => c.type === 'expense')
  const incomeCategories = categories.filter(c => c.type === 'income')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{t.categories.title}</h2>
        <p className="text-slate-500 mt-1">{t.categories.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all",
            activeTab === 'categories'
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
          onClick={() => setActiveTab('categories')}
        >
          <FolderOpen className="h-4 w-4" />
          {t.categories.categoriesTab}
          <Badge variant="secondary" className="ml-1">{categories.length}</Badge>
        </button>
        <button
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all",
            activeTab === 'payment-methods'
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
          onClick={() => setActiveTab('payment-methods')}
        >
          <CreditCard className="h-4 w-4" />
          {t.categories.paymentMethodsTab}
          <Badge variant="secondary" className="ml-1">{paymentMethods.length}</Badge>
        </button>
      </div>

      {activeTab === 'categories' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Expense Categories */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-full pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <FolderOpen className="h-4 w-4 text-red-600" />
                </div>
                {t.categories.expenseCategories}
                <Badge variant="destructive" className="ml-2">{expenseCategories.length}</Badge>
              </CardTitle>
              <Button
                size="sm"
                className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                onClick={() => { setEditingCategory(null); setNewCategoryType('expense'); setIsModalOpen(true) }}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t.categories.add}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expenseCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full ring-2 ring-white shadow-sm"
                        style={{ backgroundColor: category.color || '#ef4444' }}
                      />
                      <span className="font-medium text-slate-700">{category.name}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setEditingCategory(category); setIsModalOpen(true) }}
                      >
                        <Edit2 className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (confirm(t.categories.deleteCategory)) {
                            deleteCategoryMutation.mutate(category.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
                {expenseCategories.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    {t.categories.noExpenseCategories}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Income Categories */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FolderOpen className="h-4 w-4 text-emerald-600" />
                </div>
                {t.categories.incomeCategories}
                <Badge variant="success" className="ml-2">{incomeCategories.length}</Badge>
              </CardTitle>
              <Button
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                onClick={() => { setEditingCategory(null); setNewCategoryType('income'); setIsModalOpen(true) }}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t.categories.add}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {incomeCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full ring-2 ring-white shadow-sm"
                        style={{ backgroundColor: category.color || '#10b981' }}
                      />
                      <span className="font-medium text-slate-700">{category.name}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => { setEditingCategory(category); setIsModalOpen(true) }}
                      >
                        <Edit2 className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          if (confirm(t.categories.deleteCategory)) {
                            deleteCategoryMutation.mutate(category.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
                {incomeCategories.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    {t.categories.noIncomeCategories}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-full pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <span className="block">{t.categories.paymentMethods}</span>
                <span className="text-sm font-normal text-slate-500">{t.categories.paymentMethodsSubtitle}</span>
              </div>
            </CardTitle>
            <Button
              className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
              onClick={() => { setEditingPaymentMethod(null); setIsModalOpen(true) }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t.categories.addMethod}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-100 hover:border-violet-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-violet-600" />
                    </div>
                    <span className="font-medium text-slate-700">{pm.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => { setEditingPaymentMethod(pm); setIsModalOpen(true) }}
                    >
                      <Edit2 className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        if (confirm(t.categories.deletePaymentMethod)) {
                          deletePaymentMethodMutation.mutate(pm.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              {paymentMethods.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400">
                  {t.categories.noPaymentMethods}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Modal */}
      {activeTab === 'categories' && (
        <CategoryModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingCategory(null) }}
          category={editingCategory}
          defaultType={newCategoryType}
          onSubmit={(data) => {
            if (editingCategory) {
              updateCategoryMutation.mutate({ id: editingCategory.id, data })
            } else {
              createCategoryMutation.mutate(data as Omit<Category, 'id'>)
            }
          }}
          isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
          t={t}
        />
      )}

      {/* Payment Method Modal */}
      {activeTab === 'payment-methods' && (
        <PaymentMethodModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingPaymentMethod(null) }}
          paymentMethod={editingPaymentMethod}
          onSubmit={(data) => {
            if (editingPaymentMethod) {
              updatePaymentMethodMutation.mutate({ id: editingPaymentMethod.id, data })
            } else {
              createPaymentMethodMutation.mutate(data as Omit<PaymentMethod, 'id'>)
            }
          }}
          isLoading={createPaymentMethodMutation.isPending || updatePaymentMethodMutation.isPending}
          t={t}
        />
      )}
    </div>
  )
}

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category: Category | null
  defaultType: 'expense' | 'income'
  onSubmit: (data: Partial<Category>) => void
  isLoading: boolean
  t: Translations
}

function CategoryModal({ isOpen, onClose, category, defaultType, onSubmit, isLoading, t }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: defaultType as 'income' | 'expense',
    color: defaultType === 'expense' ? '#ef4444' : '#10b981',
  })

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        type: category.type,
        color: category.color || '#3b82f6',
      })
    } else {
      setFormData({
        name: '',
        type: defaultType,
        color: defaultType === 'expense' ? '#ef4444' : '#10b981',
      })
    }
  }, [category, defaultType, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const presetColors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16',
    '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e',
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? t.categoryModal.editTitle : t.categoryModal.addTitle}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.categoryModal.name}</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t.categoryModal.namePlaceholder}
            className="bg-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.categoryModal.type}</label>
          <Dropdown
            value={formData.type}
            onChange={(value) => setFormData({ ...formData, type: value as 'income' | 'expense' })}
            options={[
              { value: 'expense', label: t.categoryModal.expense },
              { value: 'income', label: t.categoryModal.income },
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">{t.categoryModal.color}</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  "w-8 h-8 rounded-lg transition-all",
                  formData.color === color
                    ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                    : "hover:scale-110"
                )}
                style={{ backgroundColor: color }}
                onClick={() => setFormData({ ...formData, color })}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="h-10 w-14 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="flex-1 bg-white font-mono text-sm"
              placeholder="#000000"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            {t.categoryModal.cancel}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t.categoryModal.saving}
              </div>
            ) : t.categoryModal.save}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

interface PaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  paymentMethod: PaymentMethod | null
  onSubmit: (data: Partial<PaymentMethod>) => void
  isLoading: boolean
  t: Translations
}

function PaymentMethodModal({ isOpen, onClose, paymentMethod, onSubmit, isLoading, t }: PaymentMethodModalProps) {
  const [name, setName] = useState('')

  useEffect(() => {
    setName(paymentMethod?.name || '')
  }, [paymentMethod, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={paymentMethod ? t.paymentMethodModal.editTitle : t.paymentMethodModal.addTitle}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t.paymentMethodModal.name}</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.paymentMethodModal.namePlaceholder}
            className="bg-white"
            required
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            {t.paymentMethodModal.cancel}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t.paymentMethodModal.saving}
              </div>
            ) : t.paymentMethodModal.save}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
