import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, History, Lock, Sparkles, XCircle } from 'lucide-react'
import Layout from '../components/common/Layout'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { EmptyState, ErrorState, Loading } from '../components/common/States'
import ErrorBoundary from '../components/common/ErrorBoundary'
import OntologyGraphCanvas from '../components/graph/OntologyGraphCanvas'
import useAsync from '../components/common/useAsync'
import { domains, graphs } from '../api'
import { cleanMojibake, timeAgo } from '../lib/format'
import { DOMMETA, SLUG_TO_DOM } from '../lib/ontologyData'
import { buildBusinessImpactSummary } from '../lib/businessImpact'
import { useToast } from '../context/ToastContext'

const DOMAIN_NAME_MAP = {
  'management-reporting-gross-to-net': 'Management Reporting and Gross-to-Net',
  'planning-budgeting-forecasting': 'Planning, Budgeting and Forecasting',
  'cost-profitability-management': 'Cost and Profitability Management',
  'working-capital-treasury': 'Working Capital and Treasury',
  'consolidation-close-statutory': 'Consolidation, Close and Statutory Reporting',
  'statement-analysis-valuation': 'Financial Statement Analysis and Valuation',
  'risk-governance-controls': 'Financial Risk, Governance and Controls',
  'epm-platforms-operating-model': 'EPM Platforms and Finance Operating Model',
  'sales-distribution-rtm': '01 Sales & Distribution (RtM)',
  '01-sales-distribution': '01 Sales & Distribution (RtM)',
  'trade-promotions-rgm': '02 Trade, Promotions & RGM',
  'marketing-consumer': '03 Marketing & Consumer',
  'supply-chain-procurement': '04 Supply Chain & Procurement',
  'manufacturing-quality': '05 Manufacturing & Quality',
  'innovation-npd': '06 Innovation & NPD',
  'finance-epm': '07 Finance & EPM',
  'ecommerce-d2c-strategy': '08 E-commerce, D2C & Strategy',
  'data-analytics-foundation': '09 Data & Analytics Foundation',
}

export function formatModelVersion(label) {
  if (!label) return 'Draft'
  const str = String(label).trim()
  if (/^kg0$/i.test(str)) return 'Baseline Model'
  if (/^kg1$/i.test(str)) return 'Baseline Model (v1)'
  if (/^kg2$/i.test(str)) return 'Operational Model (v2)'
  if (/^kg\s*(\d+)$/i.test(str)) {
    return str.replace(/^kg\s*(\d+)$/i, 'Version $1')
  }
  return str.replace(/\bKG(\d+)\b/gi, 'Version $1').replace(/\bKG\b/gi, 'Model')
}

const Stat = ({ label, v, tone }) => (
  <div className="rounded-xl border border-line bg-surface2/30 p-3 text-center">
    <div className={`text-2xl font-bold ${tone || ''}`}>{v}</div>
    <div className="mt-0.5 text-[11px] text-muted">{label}</div>
  </div>
)

const badgeClasses = {
  emerald:
    'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
  amber:
    'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
  slate:
    'bg-slate-500/10 border-slate-500/25 text-slate-700 dark:text-slate-300',
}

function getEntityBusinessNuance(n, impactSummary) {
  const name = typeof n === 'string' ? n : n?.name || n?.key || ''
  const k = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const attrAdded = Array.isArray(n?.attributes_added) ? n.attributes_added : []
  const allAttrs = attrAdded.map((a) => String(a).toLowerCase()).join(' ')

  // 1. Check if impactSummary has matching item
  if (impactSummary && Array.isArray(impactSummary.items)) {
    const matched = impactSummary.items.find((item) => {
      const itId = (item.id || '').toLowerCase()
      const itRef = (item.technical_ref || '').toLowerCase()
      return (
        itId.includes(k) ||
        itRef.includes(k) ||
        (k.length > 3 && (itId.includes(k) || itRef.includes(k)))
      )
    })
    if (matched && matched.impact && !/[\u0980-\u09FF]/.test(matched.impact)) {
      const tone =
        matched.severity === 'high' || matched.severity === 'critical' ? 'emerald' : 'slate'
      const badge =
        k.includes('driver') ||
        k.includes('gross') ||
        allAttrs.includes('discount') ||
        allAttrs.includes('rebate')
          ? 'Gross-to-Net Revenue Protection'
          : matched.title_en || 'Enterprise Operating Rule'
      return {
        badge,
        impact: matched.impact,
        tone,
      }
    }
  }

  // 2. Explicit notes on entity
  const changesNotes = n?.changes?.notes || n?.notes || n?.business_impact
  if (changesNotes && typeof changesNotes === 'string' && changesNotes.length > 5) {
    return {
      badge: n?.badge || 'Enterprise Operating Rule',
      impact: changesNotes,
      tone: 'slate',
    }
  }

  // 3. Gross-to-Net / Pricing / Discounts / Rebates / Promo
  if (
    k.includes('driver') ||
    k.includes('trade') ||
    k.includes('discount') ||
    k.includes('rebate') ||
    k.includes('grosstonet') ||
    k.includes('promoplan') ||
    k.includes('promotional') ||
    k.includes('allowance') ||
    allAttrs.includes('discount') ||
    allAttrs.includes('rebate') ||
    allAttrs.includes('return') ||
    allAttrs.includes('allowance')
  ) {
    return {
      badge: 'Gross-to-Net Revenue Protection',
      impact:
        'Captures off-invoice rebates & promotional trade discounts. Eliminates margin discrepancies between Gross Sales and Net Revenue.',
      tone: 'emerald',
    }
  }

  // 4. Secondary Sales / RtM / Distribution / Outlet / Store
  if (
    k.includes('secondary') ||
    k.includes('sales') ||
    k.includes('outlet') ||
    k.includes('distributor') ||
    k.includes('customer') ||
    k.includes('route') ||
    k.includes('rtm') ||
    allAttrs.includes('outlet') ||
    allAttrs.includes('store')
  ) {
    return {
      badge: 'Route-to-Market Visibility',
      impact:
        'Secures granular distributor-to-retail off-take data. Prevents bullwhip distortions and outlet coverage stockouts.',
      tone: 'emerald',
    }
  }

  // 5. Inventory / Stock / Supply Chain / Warehouse
  if (
    k.includes('inventory') ||
    k.includes('stock') ||
    k.includes('supply') ||
    k.includes('warehouse') ||
    k.includes('transit') ||
    allAttrs.includes('stock')
  ) {
    return {
      badge: 'Working Capital Optimization',
      impact:
        'Tracks transit and warehouse stock levels to reduce working capital lockup and stock expiration risks.',
      tone: 'amber',
    }
  }

  // 6. Revenue Variance / Financial Controls
  if (
    k.includes('revenuevariance') ||
    k.includes('variance') ||
    k.includes('cost') ||
    k.includes('finance')
  ) {
    return {
      badge: 'Financial Governance',
      impact:
        'Enforces automated variance tracking and financial controls across commercial planning cycles.',
      tone: 'emerald',
    }
  }

  // 7. Default Enterprise Operating Rule
  return {
    badge: 'Enterprise Operating Rule',
    impact:
      'Customized client operating constraint calibrated against enterprise finance architecture standards.',
    tone: 'slate',
  }
}

function DiffLists({ d, impactSummary }) {
  const hasNodesAdded = (d?.nodes_added || []).length > 0
  const hasNodesModified = (d?.nodes_modified || []).length > 0
  const hasNodesRemoved = (d?.nodes_removed || []).length > 0
  const hasEdgesAdded = (d?.edges_added || []).length > 0
  const hasEdgesRemoved = (d?.edges_removed || []).length > 0
  const hasEdgesModified = (d?.edges_modified || []).length > 0

  const hasAnyChanges =
    hasNodesAdded ||
    hasNodesModified ||
    hasNodesRemoved ||
    hasEdgesAdded ||
    hasEdgesRemoved ||
    hasEdgesModified

  if (!hasAnyChanges) return <p className="mt-4 text-sm text-muted">No differences.</p>

  return (
    <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
      {/* Left Column: Entities Added, Modified (Business Value & Nuances), Removed */}
      <div className="lg:col-span-8 space-y-5">
        {/* ENTITIES ADDED */}
        {hasNodesAdded && (
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5">
              ENTITIES ADDED
            </h4>
            <div className="space-y-2">
              {d.nodes_added.map((n, idx) => {
                const name = typeof n === 'string' ? n : n?.name || n?.key || `Entity-${idx}`
                const key = typeof n === 'string' ? n : n?.key || name
                const color = typeof n === 'object' ? n?.color || '#f59e0b' : '#f59e0b'
                const origin = typeof n === 'object' ? n?.origin || 'user' : 'user'
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 rounded-xl border border-line/80 bg-surface/60 px-4 py-2.5 text-sm shadow-2xs"
                  >
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
                    <b className="text-ink font-bold">{name}</b>
                    <span className="text-xs text-muted font-normal">({origin})</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ENTITIES MODIFIED (BUSINESS VALUE & NUANCES) */}
        {hasNodesModified && (
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5">
              ENTITIES MODIFIED (BUSINESS VALUE & NUANCES)
            </h4>
            <div className="space-y-3">
              {d.nodes_modified.map((n, idx) => {
                const name = typeof n === 'string' ? n : n?.name || n?.key || `Modified-${idx}`
                const key = typeof n === 'string' ? n : n?.key || name
                const fromName =
                  n?.changes?.name?.from || (typeof n?.changes?.name === 'string' ? n.changes.name : null)
                const attrAdded = Array.isArray(n?.attributes_added) ? n.attributes_added : []
                const attrRem = Array.isArray(n?.attributes_removed) ? n.attributes_removed : []
                const nuance = getEntityBusinessNuance(n, impactSummary)
                const toneClass = badgeClasses[nuance.tone] || badgeClasses.slate

                return (
                  <div
                    key={key}
                    className="rounded-2xl border border-line/80 bg-surface/70 p-4 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <b className="text-sm sm:text-base font-bold text-ink">{name}</b>
                      <span className={`rounded-full px-3 py-0.5 text-xs font-semibold border ${toneClass}`}>
                        {nuance.badge}
                      </span>
                    </div>

                    {fromName && (
                      <div className="text-xs text-muted italic">renamed from “{fromName}”</div>
                    )}

                    {attrAdded.length > 0 && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono leading-relaxed">
                        + {attrAdded.join(', ')}
                      </div>
                    )}

                    {attrRem.length > 0 && (
                      <div className="text-xs text-rose-500 font-mono leading-relaxed">
                        − {attrRem.join(', ')}
                      </div>
                    )}

                    <div className="text-xs text-ink/85 leading-relaxed pt-1">
                      <span className="font-bold text-ink">Business Impact:</span> {nuance.impact}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ENTITIES REMOVED */}
        {hasNodesRemoved && (
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-500 mb-2.5">
              ENTITIES REMOVED
            </h4>
            <div className="space-y-2">
              {d.nodes_removed.map((n, idx) => {
                const name = typeof n === 'string' ? n : n?.name || n?.key || `Removed-${idx}`
                const key = typeof n === 'string' ? n : n?.key || name
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 font-semibold"
                  >
                    − {name}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Relationships Added & Removed */}
      <div className="lg:col-span-4 space-y-5">
        {hasEdgesAdded && (
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5">
              RELATIONSHIPS ADDED
            </h4>
            <div className="space-y-2">
              {d.edges_added.map((e, i) => (
                <div
                  key={`ea-${i}`}
                  className="rounded-xl border border-line/80 bg-surface/60 p-2.5 px-3.5 text-xs font-mono text-ink flex items-center flex-wrap gap-1.5 shadow-2xs"
                >
                  <span className="truncate max-w-[130px]" title={e?.source}>
                    {e?.source}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                    —[{e?.label || 'includes'}]→
                  </span>
                  <span className="truncate max-w-[130px]" title={e?.target}>
                    {e?.target}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasEdgesRemoved && (
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-500 mb-2.5">
              RELATIONSHIPS REMOVED
            </h4>
            <div className="space-y-2">
              {d.edges_removed.map((e, i) => (
                <div
                  key={`er-${i}`}
                  className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-2.5 px-3.5 text-xs font-mono text-rose-600 dark:text-rose-400 flex items-center flex-wrap gap-1.5 shadow-2xs"
                >
                  <span>{e?.source}</span>
                  <span className="font-semibold shrink-0">—[{e?.label || 'removed'}]→</span>
                  <span>{e?.target}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasEdgesModified && (
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5">
              RELATIONSHIPS MODIFIED
            </h4>
            <div className="space-y-2">
              {d.edges_modified.map((e, i) => (
                <div
                  key={`em-${i}`}
                  className="rounded-xl border border-line/80 bg-surface/60 p-2.5 px-3 text-xs font-mono text-ink flex items-center flex-wrap gap-1 shadow-2xs"
                >
                  <span>{e?.source}</span>
                  <span className="text-amber-500 font-semibold shrink-0">→</span>
                  <span>{e?.target}:</span>
                  <span className="text-muted">
                    {e?.from} ⇒ {e?.to}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Finalize() {
  const { slug } = useParams()
  const location = useLocation()
  const toast = useToast()
  const wf = useAsync(() => domains.workflow(slug), [slug])
  const dom = useAsync(() => domains.list(), [])
  const fin = useAsync(() => graphs.finalization(slug), [slug], { immediate: false })
  const [range, setRange] = useState({ from: 0, to: null })
  const [cmp, setCmp] = useState(null)
  const [dlg, setDlg] = useState(null)
  const [ack, setAck] = useState(false)
  const [busy, setBusy] = useState(false)
  const [viewMode, setViewMode] = useState('executive') // 'executive' | 'technical'

  useEffect(() => {
    if (wf.data?.steps?.[3]?.status === 'completed') fin.reload().catch(() => {})
  }, [wf.data]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (fin.data && range.to === null && fin.data.version?.number != null) {
      setRange({ from: 0, to: fin.data.version.number })
    }
  }, [fin.data]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (range.to !== null && range.to !== undefined) {
      graphs.compare(slug, range.from, range.to).then(setCmp, (e) => toast.error(e.message))
    }
  }, [range, slug]) // eslint-disable-line react-hooks/exhaustive-deps

  const d = fin.data

  const impactSummary = useMemo(() => {
    if (!d && !cmp) return null
    try {
      return buildBusinessImpactSummary(
        d?.business_impact || cmp?.business_impact,
        cmp || d?.comparison,
        d?.validation
      )
    } catch (err) {
      console.error('Failed to build business impact summary:', err)
      return null
    }
  }, [d?.business_impact, cmp, d?.comparison, d?.validation])

  if (wf.error) return <Layout wide><ErrorState error={wf.error} onRetry={wf.reload} /></Layout>
  if (wf.loading || !wf.data) return <Layout wide><Loading /></Layout>
  if (!wf.data.started) return <Navigate to={`/fmcg/${slug}`} replace />
  const hasKg1 = Boolean(wf.data?.steps?.[3]?.status === 'completed')
  const finalized = Boolean(wf.data?.finalized_version_number)

  const doFinalize = async () => {
    setBusy(true)
    try {
      await graphs.finalize(slug, { confirm: true, acknowledge_warnings: ack })
      toast.success('Ontology finalised as Digital Twin. Telemetry upload is now unlocked.')
      setDlg(null)
      await Promise.all([wf.reload(), fin.reload()])
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  const doReopen = async () => {
    setBusy(true)
    try {
      await graphs.reopen(slug)
      toast.success('Ontology re-opened.')
      setDlg(null)
      await Promise.all([wf.reload(), fin.reload()])
    } catch (e) {
      toast.error(e.message)
      setDlg(null)
    } finally {
      setBusy(false)
    }
  }

  const prefix = location.pathname.startsWith('/finance') ? '/finance' : '/fmcg'
  const isFinance = prefix === '/finance'
  const cleanSlug = String(slug || '').toLowerCase().trim()
  const domain = dom.data?.domains?.find((item) => item.slug === slug || item.slug === cleanSlug || item.id === slug)

  const rawDomainName =
    domain?.name ||
    DOMAIN_NAME_MAP[cleanSlug] ||
    DOMMETA[SLUG_TO_DOM[cleanSlug]]?.n ||
    d?.domain?.name ||
    wf.data?.domain?.name ||
    cleanSlug
      .replace(/[-_]+/g, ' ')
      .split(' ')
      .map((w) => (['and', 'to', 'of', 'in', 'for', '&'].includes(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)))
      .join(' ')

  const resolvedDomainName = cleanMojibake(rawDomainName)
  const displayTemplateName = DOMAIN_NAME_MAP[cleanSlug] || resolvedDomainName.replace(/^[F0-9]+\s+/, '')
  const domainType = isFinance ? 'Finance' : 'FMCG'

  const backUrl = `${prefix}/${slug}?stage=kg1&view=graph`
  const handleBackToKg1 = () => {
    if (slug) {
      try {
        sessionStorage.removeItem(`afx_is_kg2_${slug}`)
      } catch {}
    }
  }

  return (
    <Layout wide>
      {/* Top Navigation & Header */}
      <div className="mb-4">
        <Link
          to={backUrl}
          onClick={handleBackToKg1}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted hover:text-ink transition font-medium cursor-pointer"
        >
          <ArrowLeft size={14} className="text-brand" />
          <span>Back to Operational Model & Chatbot</span>
        </Link>
        <h1 className="mt-2 text-xl sm:text-2xl font-bold text-ink">Enterprise Template Finalization</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted">
          Step 4: Review, validate and finalize your customized {resolvedDomainName} Digital Twin.
        </p>
      </div>

      {!hasKg1 && (
        <div className="card mt-3">
          <EmptyState
            title="Nothing to finalise yet"
            hint="Answer the chatbot's questions and approve at least one set of changes to create your baseline model."
          >
            <Link className="btn-primary mt-2" to={backUrl}>
              Go to Operational Model
            </Link>
          </EmptyState>
        </div>
      )}

      {hasKg1 && fin.loading && !d && <Loading />}
      {fin.error && <ErrorState error={fin.error} onRetry={fin.reload} />}

      {d && (
        <div className="mt-4 space-y-5">
          {/* Main 2-Column Grid: Left Graph Preview | Right Digital Twin Governance */}
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            {/* Left Card: Graph Preview */}
            <section className="card flex flex-col overflow-hidden p-0 border border-line shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 bg-surface2/20">
                <div className="flex flex-col">
                  <h2 className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-ink">
                    {/* <Sparkles size={16} className="text-emerald-500 fill-emerald-500/20" /> */}
                    <span>Graph Preview · {formatModelVersion(d?.version?.label)}</span>
                  </h2>
                  <span className="text-xs text-muted">
                    {d?.graph?.nodes?.length || 0} entities · {d?.graph?.edges?.length || 0} relationships
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{displayTemplateName} Radial Spine Active</span>
                </div>
              </div>
              <div className="h-[520px] min-h-[420px] w-full relative bg-surface">
                <ErrorBoundary title="Ontology Canvas Rendering Error">
                  <OntologyGraphCanvas
                    nodes={d?.graph?.nodes || []}
                    edges={d?.graph?.edges || []}
                    domainMeta={domain}
                    className="w-full h-full"
                  />
                </ErrorBoundary>
              </div>
            </section>

            {/* Right Card: Digital Twin Governance */}
            <section className="card flex flex-col justify-between p-5 border border-line shadow-card">
              <div className="space-y-4">
                {/* Governance Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-ink">Review and Validation</h2>
                  {(d?.validation?.errors || []).length === 0 ? (
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Ready to Finalize
                    </span>
                  ) : (
                    <span className="rounded-full bg-rose-500/10 border border-rose-500/25 px-3 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                      Warnings to Review
                    </span>
                  )}
                </div>

                {/* Validation Check Box */}
                <div className="rounded-xl border border-line bg-surface2/30 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">Validation Check</span>
                    {(d?.validation?.errors || []).length === 0 ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={14} /> Zero Errors
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-rose-500">
                        <XCircle size={14} /> {(d?.validation?.errors || []).length} Errors
                      </span>
                    )}
                  </div>
                  {(d?.validation?.errors || []).length === 0 ? (
                    <p className="mt-1.5 text-xs text-muted leading-relaxed">
                      Ontology verified against {domainType} domain schema and business rules. Ready for enterprise governance.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1.5 text-xs">
                      {(d?.validation?.errors || []).map((e, i) => (
                        <li key={`err-${i}`} className="flex items-start gap-1.5 text-rose-500">
                          <XCircle size={13} className="mt-0.5 shrink-0" />
                          <span>{e?.message || 'Error'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Entities and Relationships Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-line bg-surface2/40 p-3.5 text-center">
                    <div className="text-2xl font-bold text-ink">{d?.graph?.nodes?.length || 0}</div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">ENTITIES</div>
                  </div>
                  <div className="rounded-xl border border-line bg-surface2/40 p-3.5 text-center">
                    <div className="text-2xl font-bold text-ink">{d?.graph?.edges?.length || 0}</div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">RELATIONSHIPS</div>
                  </div>
                </div>

                {/* Key-Value Summary Details */}
                <div className="rounded-xl border border-line bg-surface2/25 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Ontology Version:</span>
                    <span className="font-bold text-ink">{resolvedDomainName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Domain:</span>
                    <span className="font-bold text-ink">{domainType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Status:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {finalized ? 'Finalized / Enterprise Active' : 'Draft / Candidate'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="mt-5 pt-4 border-t border-line">
                {finalized ? (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-3.5 space-y-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        <Lock size={16} />
                        <span>Governed Enterprise Digital Twin · {formatModelVersion(d?.version?.label || 'Finalized')}</span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        This model is locked and governed. It represents your active {isFinance ? 'financial' : 'operational'} architecture.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`${prefix}/${slug}/telemetry`}
                        className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold"
                      >
                        <span>Explore Digital Twin</span>
                        <ArrowRight size={16} />
                      </Link>
                      <button
                        className="btn-ghost py-2.5 px-3 text-xs text-muted hover:text-ink cursor-pointer"
                        onClick={() => setDlg('reopen')}
                      >
                        Re-open
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="w-full rounded-xl bg-[#10b981] hover:bg-[#059669] text-white py-3.5 px-4 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    disabled={(d?.validation?.errors || []).length > 0}
                    onClick={() => {
                      setAck(false)
                      setDlg('finalize')
                    }}
                  >
                    {/* <Sparkles size={16} /> */}
                    <span>Finalise as Digital Twin</span>
                    {/* <span>🌟</span> */}
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* Bottom Card 1: Compare Versions (Technical Schema & Diffs) */}
          <section className="card p-5 border border-line shadow-card">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <h2 className="text-base font-bold text-ink shrink-0">Compare Versions</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-ink">
                <span className="inline-flex items-center rounded-lg border border-line/70 bg-surface2/60 px-3 py-1.5 text-xs sm:text-[13px] font-semibold text-ink shadow-2xs select-none">
                  Model &ldquo;{displayTemplateName}&rdquo; Template
                </span>

                {/* <ArrowRight size={14} className="text-muted shrink-0" /> */}
                <span>vs</span>

                <span className="inline-flex items-center rounded-lg border border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/30 px-3 py-1.5 text-xs sm:text-[13px] font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs select-none">
                  Current &ldquo;{displayTemplateName}&rdquo; Template
                </span>
              </div>
            </div>

            {(cmp || d?.comparison) ? (
              <>
                {(() => {
                  const activeDiff = cmp || d?.comparison
                  return (
                    <>
                      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                        <Stat
                          label="entities added"
                          v={activeDiff?.counts?.nodes_added || 0}
                          tone="text-emerald-600 dark:text-emerald-400 font-bold text-2xl"
                        />
                        <Stat
                          label="entities modified"
                          v={activeDiff?.counts?.nodes_modified || 0}
                          tone="text-amber-500 font-bold text-2xl"
                        />
                        <Stat
                          label="entities removed"
                          v={activeDiff?.counts?.nodes_removed || 0}
                          tone="text-rose-500 font-bold text-2xl"
                        />
                        <Stat
                          label="links added"
                          v={activeDiff?.counts?.edges_added || 0}
                          tone="text-emerald-600 dark:text-emerald-400 font-bold text-2xl"
                        />
                        <Stat
                          label="links relabelled"
                          v={activeDiff?.counts?.edges_modified || 0}
                          tone="text-slate-600 dark:text-slate-300 font-bold text-2xl"
                        />
                        <Stat
                          label="links removed"
                          v={activeDiff?.counts?.edges_removed || 0}
                          tone="text-rose-500 font-bold text-2xl"
                        />
                      </div>
                      <ErrorBoundary title="Diff Comparison Error">
                        <DiffLists d={activeDiff} impactSummary={impactSummary} />
                      </ErrorBoundary>
                    </>
                  )
                })()}
              </>
            ) : (
              <Loading className="!p-4" />
            )}
          </section>

          {/* Bottom Card 2: Change History */}
          <section className="card p-5 border border-line shadow-card">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <History size={16} />
              <span>Change History</span>
            </h2>
            {(d?.history || []).length === 0 && <p className="mt-3 text-sm text-muted">No change proposals recorded yet.</p>}
            <ul className="mt-3.5 space-y-3">
              {(d?.history || []).map((p, pIdx) => (
                <li key={p?.id || pIdx} className="rounded-xl border border-line bg-surface2/20 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <b className="text-sm text-ink font-semibold">{p?.title || 'Proposed Change'}</b>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md border border-line bg-surface2 px-2 py-0.5 text-[11px] font-semibold text-muted">
                        active — {p?.result_version ? `Version ${p.result_version}` : formatModelVersion(d?.version?.label)}
                      </span>
                      <span className="text-xs text-muted">
                        {p?.source || 'Assistant'} · {timeAgo(p?.created_at)}
                      </span>
                    </div>
                  </div>
                  {(p?.items || []).length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-xs text-muted">
                      {p.items.map((i, k) => (
                        <li key={k} className={i?.status === 'rejected' ? 'line-through' : ''}>
                          {i?.status === 'approved' ? '✓' : i?.status === 'rejected' ? '✗' : '•'} {i?.description}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <ConfirmDialog
        open={dlg === 'finalize'}
        title="Finalise this ontology?"
        confirmLabel="Finalise"
        busy={busy}
        onCancel={() => setDlg(null)}
        onConfirm={doFinalize}
      >
        <p>This locks {formatModelVersion(d?.version?.label) || 'your current version'} as your ontology and unlocks telemetry upload. The chatbot session will be locked until you re-open it.</p>
        {(d?.validation?.warnings || []).length > 0 && (
          <label className="mt-3 flex items-start gap-2 text-ink">
            <input
              type="checkbox"
              className="mt-1 accent-[rgb(var(--brand))]"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
            />
            <span>I have reviewed the {(d?.validation?.warnings || []).length} warning(s) and want to finalise anyway.</span>
          </label>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={dlg === 'reopen'}
        title="Re-open the ontology?"
        confirmLabel="Re-open"
        busy={busy}
        onCancel={() => setDlg(null)}
        onConfirm={doReopen}
      >
        Possible only while no telemetry has been uploaded. Uploads will be locked again until you re-finalise.
      </ConfirmDialog>
    </Layout>
  )
}
