import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { MoneyStat, StatCard } from '@/components/StatCard'
import { PageHeader, LoadingState } from '@/components/PageHeader'
import { formatCurrency } from '@/lib/utils'

export function FinancePage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [showExpense, setShowExpense] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    category: '',
    amount: 0,
    description: '',
    recurring: false,
  })
  const [paymentForm, setPaymentForm] = useState<{
    studentId: string
    studentName?: string
    planId: string
    amount: number
    currency: string
    method: string
    type: string
  }>({
    studentId: '',
    studentName: '',
    planId: '',
    amount: 0,
    currency: 'DZD',
    method: 'CASH',
    type: 'SUBSCRIPTION',
  })

  const { data, isLoading } = useQuery({ queryKey: ['finance'], queryFn: api.getFinance })
  const { data: students } = useQuery({ queryKey: ['students'], queryFn: api.getStudents })
  const { data: plans } = useQuery({ queryKey: ['plans'], queryFn: api.getSubscriptionPlans })

  const createExpense = useMutation({
    mutationFn: api.createExpense,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setShowExpense(false)
      setExpenseForm({ category: '', amount: 0, description: '', recurring: false })
    },
  })

  const createPayment = useMutation({
    mutationFn: api.createPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setShowPayment(false)
      setPaymentForm({ studentId: '', planId: '', amount: 0, currency: 'DZD', method: 'CASH', type: 'SUBSCRIPTION' })
    },
  })

  if (isLoading) return <LoadingState />

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('finance.title')}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setShowPayment(!showPayment)}>
              <Plus className="w-4 h-4" />
              {t('finance.recordPayment')}
            </Button>
            <Button onClick={() => setShowExpense(!showExpense)}>
              <Plus className="w-4 h-4" />
              {t('finance.addExpense')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MoneyStat label={t('finance.revenue')} amount={data?.totalRevenue ?? 0} icon={TrendingUp} />
        <MoneyStat label={t('finance.expenses')} amount={data?.totalExpenses ?? 0} icon={TrendingDown} />
        <StatCard
          label={t('finance.profit')}
          value={formatCurrency(data?.profit ?? 0)}
          icon={Wallet}
          variant={(data?.profit ?? 0) >= 0 ? 'success' : 'danger'}
        />
      </div>

      {showExpense && (
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t('finance.category')}</Label>
                <Input value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} />
              </div>
              <div>
                <Label>{t('finance.amount')}</Label>
                <Input type="number" value={expenseForm.amount || ''} onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2">
                <Label>{t('finance.description')}</Label>
                <Input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
              </div>
            </div>
            <Button className="mt-4" disabled={!expenseForm.category || !expenseForm.amount || createExpense.isPending} onClick={() => createExpense.mutate(expenseForm)}>
              {t('common.save')}
            </Button>
          </CardContent>
        </Card>
      )}

      {showPayment && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>{t('finance.recordPayment')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>{t('finance.paymentStudent')}</Label>
                <Input
                  list="students-list"
                  value={paymentForm.studentName || ''}
                  onChange={(e) => {
                    const name = e.target.value
                    const match = students?.find((s) => `${s.firstName} ${s.lastName}`.toLowerCase() === name.toLowerCase())
                    setPaymentForm({ ...paymentForm, studentName: name, studentId: match ? match.id : '' })
                  }}
                  placeholder={t('finance.selectStudent')}
                />
                <datalist id="students-list">
                  {students?.map((student) => (
                    <option key={student.id} value={`${student.firstName} ${student.lastName}`} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>{t('finance.amount')}</Label>
                <Input type="number" value={paymentForm.amount || ''} onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })} />
              </div>
              <div>
                <Label>{t('finance.paymentCurrency')}</Label>
                <Select value={paymentForm.currency} onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}>
                  <option value="DZD">DZD</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </Select>
              </div>
              <div>
                <Label>{t('finance.paymentMethod')}</Label>
                <Select value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}>
                  <option value="CASH">{t('finance.methodCash')}</option>
                  <option value="BANK_TRANSFER">{t('finance.methodBankTransfer')}</option>
                  <option value="CCP">CCP</option>
                  <option value="OTHER">{t('finance.methodOther')}</option>
                </Select>
              </div>
              <div>
                <Label>{t('finance.plan')}</Label>
                <Select
                  value={paymentForm.planId}
                  onChange={(e) => {
                    const planId = e.target.value
                    const plan = plans?.find((item) => item.id === planId)
                    setPaymentForm({
                      ...paymentForm,
                      planId,
                      amount: plan ? plan.price : paymentForm.amount,
                    })
                  }}
                >
                  <option value="">{t('finance.selectPlan')}</option>
                  {plans?.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} • {formatCurrency(plan.price)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <Button
              className="mt-4"
              disabled={!paymentForm.studentId || !paymentForm.planId || !paymentForm.amount || createPayment.isPending}
              onClick={() => createPayment.mutate(paymentForm)}
            >
              {t('common.save')}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('finance.recentPayments')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data?.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {p.student.firstName} {p.student.lastName}
                    </p>
                    <p className="text-xs text-muted">
                      {p.type} · {p.method} · {new Date(p.paidAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {p.receiptUrl ? (
                        <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                          {t('finance.viewReceipt')}
                        </a>
                      ) : (
                        t('finance.noReceipt')
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('finance.expenses')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data?.expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">{e.category}</p>
                    <p className="text-xs text-muted">
                      {e.description} {e.recurring && '· ↻'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    -{formatCurrency(e.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
