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
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="page-title">{t.categories.title}</h2>
          <p className="page-subtitle">{t.categories.subtitle}</p>
        </div>
        {activeTab === 'categories' ? (
          <Button
            onClick={() => {
              setEditingCategory(null)
              setNewCategoryType('expense')
              setIsModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" strokeWidth={1.8} />
            {t.categories.add}
          </Button>
        ) : (
          <Button
            onClick={() => {
              setEditingPaymentMethod(null)
              setIsModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" strokeWidth={1.8} />
            {t.categories.addMethod}
          </Button>
        )}
      </div>

      {/* Segmented control tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#faf9f5] border border-[#ebe9e3] rounded-full w-fit">
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all",
            activeTab === 'categories'
              ? "bg-[#0a0a0a] text-white"
              : "text-[#6b6b6b] hover:text-[#1f1f1f]"
          )}
          onClick={() => setActiveTab('categories')}
        >
          <FolderOpen className="h-[15px] w-[15px]" strokeWidth={1.8} />
          {t.categories.categoriesTab}
          <Badge variant="secondary" className="ml-0.5">{categories.length}</Badge>
        </button>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all",
            activeTab === 'payment-methods'
              ? "bg-[#0a0a0a] text-white"
              : "text-[#6b6b6b] hover:text-[#1f1f1f]"
          )}
          onClick={() => setActiveTab('payment-methods')}
        >
          <CreditCard className="h-[15px] w-[15px]" strokeWidth={1.8} />
          {t.categories.paymentMethodsTab}
          <Badge variant="secondary" className="ml-0.5">{paymentMethods.length}</Badge>
        </button>
      </div>

      {activeTab === 'categories' ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Expense Categories */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[12px] bg-[#fef2f2] flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="h-[15px] w-[15px] text-[#be123c]" strokeWidth={1.8} />
                </div>
                <span>{t.categories.expenseCategories}</span>
                <Badge variant="destructive" className="ml-1">{expenseCategories.length}</Badge>
              </CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingCategory(null)
                  setNewCategoryType('expense')
                  setIsModalOpen(true)
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1" strokeWidth={1.8} />
                {t.categories.add}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {expenseCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-[12px] bg-[#faf9f5] hover:bg-[#f1f0ea] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-[8px] flex-shrink-0"
                        style={{ backgroundColor: category.color || '#ef4444', opacity: 0.85 }}
                      />
                      <span className="text-[13.5px] font-medium text-[#0a0a0a]">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#6b6b6b] hover:bg-white hover:text-[#0a0a0a] transition-colors"
                        onClick={() => {
                          setEditingCategory(category)
                          setIsModalOpen(true)
                        }}
                      >
                        <Edit2 className="h-[15px] w-[15px]" strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#6b6b6b] hover:bg-[#fef2f2] hover:text-[#be123c] transition-colors"
                        onClick={() => {
                          if (confirm(t.categories.deleteCategory)) {
                            deleteCategoryMutation.mutate(category.id)
                          }
                        }}
                      >
                        <Trash2 className="h-[15px] w-[15px]" strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                ))}
                {expenseCategories.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="w-10 h-10 rounded-[12px] bg-[#fef2f2] flex items-center justify-center">
                      <FolderOpen className="h-5 w-5 text-[#be123c]" strokeWidth={1.8} />
                    </div>
                    <p className="text-[13px] text-[#9a9a98]">{t.categories.noExpenseCategories}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Income Categories */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[12px] bg-[#ecfdf5] flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="h-[15px] w-[15px] text-[#047857]" strokeWidth={1.8} />
                </div>
                <span>{t.categories.incomeCategories}</span>
                <Badge variant="success" className="ml-1">{incomeCategories.length}</Badge>
              </CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setEditingCategory(null)
                  setNewCategoryType('income')
                  setIsModalOpen(true)
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1" strokeWidth={1.8} />
                {t.categories.add}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {incomeCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-[12px] bg-[#faf9f5] hover:bg-[#f1f0ea] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-[8px] flex-shrink-0"
                        style={{ backgroundColor: category.color || '#10b981', opacity: 0.85 }}
                      />
                      <span className="text-[13.5px] font-medium text-[#0a0a0a]">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#6b6b6b] hover:bg-white hover:text-[#0a0a0a] transition-colors"
                        onClick={() => {
                          setEditingCategory(category)
                          setIsModalOpen(true)
                        }}
                      >
                        <Edit2 className="h-[15px] w-[15px]" strokeWidth={1.8} />
                      </button>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#6b6b6b] hover:bg-[#fef2f2] hover:text-[#be123c] transition-colors"
                        onClick={() => {
                          if (confirm(t.categories.deleteCategory)) {
                            deleteCategoryMutation.mutate(category.id)
                          }
                        }}
                      >
                        <Trash2 className="h-[15px] w-[15px]" strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                ))}
                {incomeCategories.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="w-10 h-10 rounded-[12px] bg-[#ecfdf5] flex items-center justify-center">
                      <FolderOpen className="h-5 w-5 text-[#047857]" strokeWidth={1.8} />
                    </div>
                    <p className="text-[13px] text-[#9a9a98]">{t.categories.noIncomeCategories}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[12px] bg-[#f3effc] flex items-center justify-center flex-shrink-0">
                <Wallet className="h-[17px] w-[17px] text-[#6d28d9]" strokeWidth={1.8} />
              </div>
              <div>
                <span className="block text-[15px] font-semibold text-[#0a0a0a]">
                  {t.categories.paymentMethods}
                </span>
                <span className="block text-[12.5px] font-normal text-[#9a9a98]">
                  {t.categories.paymentMethodsSubtitle}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between p-3.5 bg-[#faf9f5] rounded-[14px] border border-[#ebe9e3] hover:border-[#e0ddd4] hover:bg-[#f1f0ea] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[10px] bg-[#f3effc] flex items-center justify-center flex-shrink-0">
                      <CreditCard className="h-[15px] w-[15px] text-[#6d28d9]" strokeWidth={1.8} />
                    </div>
                    <span className="text-[13.5px] font-medium text-[#0a0a0a]">{pm.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#6b6b6b] hover:bg-white hover:text-[#0a0a0a] transition-colors"
                      onClick={() => {
                        setEditingPaymentMethod(pm)
                        setIsModalOpen(true)
                      }}
                    >
                      <Edit2 className="h-[15px] w-[15px]" strokeWidth={1.8} />
                    </button>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[#6b6b6b] hover:bg-[#fef2f2] hover:text-[#be123c] transition-colors"
                      onClick={() => {
                        if (confirm(t.categories.deletePaymentMethod)) {
                          deletePaymentMethodMutation.mutate(pm.id)
                        }
                      }}
                    >
                      <Trash2 className="h-[15px] w-[15px]" strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              ))}
              {paymentMethods.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-[#f3effc] flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-[#6d28d9]" strokeWidth={1.8} />
                  </div>
                  <p className="text-[13px] text-[#9a9a98]">{t.categories.noPaymentMethods}</p>
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
          <label className="block text-[12.5px] font-medium text-[#6b6b6b] mb-1.5">
            {t.categoryModal.name}
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t.categoryModal.namePlaceholder}
            required
          />
        </div>
        <div>
          <label className="block text-[12.5px] font-medium text-[#6b6b6b] mb-1.5">
            {t.categoryModal.type}
          </label>
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
          <label className="block text-[12.5px] font-medium text-[#6b6b6b] mb-2">
            {t.categoryModal.color}
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  "w-7 h-7 rounded-[8px] transition-all hover:scale-105",
                  formData.color === color
                    ? "ring-2 ring-[#0a0a0a] ring-offset-2"
                    : "ring-1 ring-[#ebe9e3]"
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
              className="flex-1 font-mono text-sm"
              placeholder="#000000"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2.5 pt-4 border-t border-[#ebe9e3]">
          <Button type="button" variant="outline" onClick={onClose}>
            {t.categoryModal.cancel}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 spinner" />
                {t.categoryModal.saving}
              </span>
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
          <label className="block text-[12.5px] font-medium text-[#6b6b6b] mb-1.5">
            {t.paymentMethodModal.name}
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.paymentMethodModal.namePlaceholder}
            required
          />
        </div>
        <div className="flex justify-end gap-2.5 pt-4 border-t border-[#ebe9e3]">
          <Button type="button" variant="outline" onClick={onClose}>
            {t.paymentMethodModal.cancel}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 spinner" />
                {t.paymentMethodModal.saving}
              </span>
            ) : t.paymentMethodModal.save}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
