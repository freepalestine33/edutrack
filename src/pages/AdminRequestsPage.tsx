import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, User, Building2, Calendar, CheckCircle2, XCircle, Clock, Search } from 'lucide-react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function AdminRequestsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')
  const [search, setSearch] = useState('')
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})

  const statusLabels = {
    ALL: t('admin.filterAll', 'الكل'),
    PENDING: t('admin.filterPending', 'معلق'),
    APPROVED: t('admin.filterApproved', 'موافق عليه'),
    REJECTED: t('admin.filterRejected', 'مرفوض'),
  }

  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['subscription-requests'],
    queryFn: api.getSubscriptionRequests,
  })

  const approve = useMutation({
    mutationFn: (id: string) => api.approveSubscriptionRequest(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription-requests'] }),
  })

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.rejectSubscriptionRequest(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription-requests'] }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
        {t('admin.loadError', 'تعذر تحميل الطلبات. تحقق من بيانات المشرف وحاول مرة أخرى.')}
      </div>
    )
  }

  const filteredRequests = requests.filter((r: any) => {
    if (filter !== 'ALL' && r.status !== filter) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const userName = (r.user?.name || '').toLowerCase()
    const userEmail = (r.user?.email || '').toLowerCase()
    const orgName = (r.organization?.name || '').toLowerCase()
    return userName.includes(q) || userEmail.includes(q) || orgName.includes(q)
  })

  const pendingCount = requests.filter((r: any) => r.status === 'PENDING').length

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-md text-white">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{t('admin.requests', 'Subscription Requests')}</h1>
            <p className="text-sm text-muted">{t('admin.requestsDesc', 'إدارة طلبات الترقية والاشتراك المرسلة من المستخدمين والمدرّسين عبر جميع المؤسسات.')}</p>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5" />
            {pendingCount} {pendingCount > 1 ? t('admin.pendingRequests', 'طلبات معلقة') : t('admin.pendingRequest', 'طلب معلق')}
          </div>
        )}
      </header>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.searchPlaceholder', 'ابحث باسم المستخدم أو البريد أو المؤسسة...')}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 bg-surface p-1 rounded-xl border border-border shrink-0">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filter === tab
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {!filteredRequests.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted">{t('admin.noRequests', 'لا توجد طلبات اشتراك تطابق التصفية.')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((r: any) => {
            const isPending = r.status === 'PENDING'
            const isApproved = r.status === 'APPROVED'
            const isRejected = r.status === 'REJECTED'

            const planLabel =
              r.planId === '1year'
                ? t('admin.planLabel.1year')
                : r.planId === '6months'
                ? t('admin.planLabel.6months')
                : r.planId
                ? t('admin.planLabel.default')
                : t('admin.planLabel.default')

            return (
              <Card key={r.id} className="transition-all hover:border-accent/40">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <span>{r.user?.name || t('admin.unknownUser', 'مستخدم غير معروف')}</span>
                      {r.user?.role && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-surface border text-muted">
                          {r.user.role}
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-accent">
                        {r.amount} {r.currency || 'DZD'}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                          isApproved
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : isRejected
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {isRejected && <XCircle className="w-3.5 h-3.5" />}
                        {isPending && <Clock className="w-3.5 h-3.5" />}
                        {statusLabels[r.status] || r.status}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted pt-1 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{r.user?.email || t('admin.noEmail', 'لا بريد إلكتروني متوفر')}</span>
                    </div>
                            <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{r.organization?.name || t('admin.organizationNA', 'المؤسسة غير متاحة')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{new Date(r.createdAt).toLocaleDateString()} ({planLabel})</span>
                    </div>
                  </div>

                  {isRejected && r.reason && (
                    <div className="p-3 rounded-lg bg-surface text-xs text-muted border border-border/60">
                      <span className="font-semibold text-foreground">{t('admin.rejectionReason', 'سبب الرفض:')}</span>
                      {r.reason}
                    </div>
                  )}

                  {isPending && (
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Button
                        disabled={approve.isPending || reject.isPending}
                        onClick={() => approve.mutate(r.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        {approve.isPending ? t('admin.approving', 'جاري الموافقة...') : t('admin.approveActivate', 'الموافقة والتفعيل')}
                      </Button>

                      <div className="flex flex-1 items-center gap-2">
                        <Input
                          placeholder={t('admin.rejectionReasonPlaceholder', 'سبب الرفض (اختياري)')}
                          value={rejectReason[r.id] || ''}
                          onChange={(e) =>
                            setRejectReason({ ...rejectReason, [r.id]: e.target.value })
                          }
                          className="text-xs flex-1"
                        />
                        <Button
                          variant="danger"
                          disabled={approve.isPending || reject.isPending}
                          onClick={() =>
                            reject.mutate({ id: r.id, reason: rejectReason[r.id] })
                          }
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          {t('admin.reject', 'رفض')}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AdminRequestsPage
