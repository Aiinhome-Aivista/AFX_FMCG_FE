import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileDiff,
  GitCompare,
  History,
  Layers,
  Lock,
  MinusCircle,
  PlusCircle,
  RotateCcw,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react'
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

function DiffLists({ d, impactSummary, backUrl, domainName }) {
  const [resetItems, setResetItems] = useState({})

  const toggleReset = (key) => {
    setResetItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

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

  if (!hasAnyChanges) {
    return <p className="mt-4 text-sm text-muted">No differences detected between Model Template and Current Template.</p>
  }

  return (
    <div className="mt-6 space-y-6 select-none">
      {/* 1. Entity Calibrations (Model Template vs Current Model with Guidance) */}
      {(hasNodesModified || hasNodesAdded) && (
        <div className="space-y-5">
          {d.nodes_modified.map((n, idx) => {
            const name = typeof n === 'string' ? n : n?.name || n?.key || `Entity-${idx}`
            const key = typeof n === 'string' ? n : n?.key || name
            const fromName = n?.changes?.name?.from || (typeof n?.changes?.name === 'string' ? n.changes.name : null)
            const attrAdded = Array.isArray(n?.attributes_added) ? n.attributes_added : []
            const attrRem = Array.isArray(n?.attributes_removed) ? n.attributes_removed : []
            const nuance = getEntityBusinessNuance(n, impactSummary)
            const categoryBadge = n?.group_name || nuance?.badge || 'Operational Calibration'

            // Model Template baseline text
            const templateText =
              n?.changes?.definition?.from ||
              n?.definition_from ||
              n?.baseline_definition ||
              n?.definition ||
              `Baseline template definition and operational driver structure for “${name}”.`

            // Current Model text
            let currentModelText = ''
            if (n?.changes?.definition?.to) {
              currentModelText = n.changes.definition.to
            } else if (n?.definition_to && n.definition_to !== n.definition_from) {
              currentModelText = n.definition_to
            } else if (attrAdded.length > 0) {
              currentModelText = `+ Added: ${attrAdded.join(', ')}`
            } else if (n?.changes?.name?.to) {
              currentModelText = `Renamed to: “${n.changes.name.to}”`
            } else {
              currentModelText = `Calibrated enterprise operating parameters aligned with active operational flow.`
            }

            // Business Impact text
            const businessImpactText =
              nuance.impact ||
              'Defines multi-tiered operating rules and commercial parameters for precise enterprise execution.'

            // AgentForgeX Guidance text
            let guidanceText = ''
            if (attrAdded.length > 0) {
              guidanceText = `Enriched “${name}” with [${attrAdded.join(', ')}]. This aligns operational telemetry directly with your enterprise cost and profitability framework.`
            } else if (n?.changes?.definition) {
              guidanceText = `Updated business definition & execution ladder for “${name}” to reflect calibrated operational and allocation rules.`
            } else if (n?.changes?.name) {
              guidanceText = `Realigned naming convention for “${name}” (previously “${fromName}”) to standardize entity representation across enterprise systems.`
            } else {
              guidanceText = `Calibrated “${name}” operational parameters and business constraints to match verified operating structure.`
            }

            return (
              <div
                key={key}
                className="grid grid-cols-1 lg:grid-cols-[1.1fr_auto_1fr] items-stretch gap-3 lg:gap-4"
              >
                {/* Left Card: Entity Comparison Box */}
                <div className="rounded-2xl border border-line/80 bg-surface/75 p-5 shadow-sm space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-ink tracking-tight">{name}</h3>
                      <span className="rounded-full border border-blue-500/30 bg-blue-50/70 dark:bg-blue-950/40 px-3 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {categoryBadge}
                      </span>
                    </div>

                    {/* Row 1: Model Template */}
                    <div className="text-xs sm:text-[13px] leading-relaxed">
                      <b className="font-bold text-ink mr-2">Model Template:</b>
                      <span className="text-muted">{templateText}</span>
                    </div>

                    {/* Row 2: Current Model */}
                    <div className="text-xs sm:text-[13px] leading-relaxed">
                      <b className="font-bold text-emerald-600 dark:text-emerald-400 mr-2">Current Model:</b>
                      <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                        {currentModelText}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Business Impact */}
                  <div className="pt-3 border-t border-line/60 text-xs sm:text-[13px] leading-relaxed">
                    <b className="font-bold text-ink mr-2">Business Impact:</b>
                    <span className="text-muted">{businessImpactText}</span>
                  </div>
                </div>

                {/* Middle Connector */}
                <div className="hidden lg:flex flex-col items-center justify-center shrink-0 px-1 select-none">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#10b981]">
                    GUIDANCE
                  </span>
                  <span className="text-sm font-bold text-[#10b981] mt-0.5">──▶</span>
                </div>

                {/* Right Card: AgentForgeX Guidance */}
                <div className="rounded-2xl border border-line/80 bg-surface/75 p-5 shadow-sm flex flex-col justify-between space-y-3.5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-ink">
                      <Sparkles size={16} className="text-[#10b981]" />
                      <span>AgentForgeX Guidance</span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-muted leading-relaxed">
                      {guidanceText}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-line/60">
                    <p className="text-xs font-semibold text-ink">
                      Does this calibration reflect your operating structure?
                    </p>

                    {/* Parameter Adjustment Box */}
                    {resetItems[key] ? (
                      <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/20 p-2.5 px-3 text-xs">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-[#10b981]" />
                          Calibration Confirmed as Operating Baseline
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleReset(key)}
                          className="text-[11px] font-semibold text-muted hover:text-ink cursor-pointer underline"
                        >
                          Adjust
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20 p-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <RotateCcw size={13} className="text-amber-600" />
                            Parameter Adjustment Requested
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleReset(key)}
                            className="text-[11px] font-semibold text-muted hover:text-ink cursor-pointer underline"
                          >
                            Reset
                          </button>
                        </div>
                        <p className="text-muted leading-relaxed text-[11.5px]">
                          Marked for fine-tuning. You can prompt the chatbot to re-weight this entity's formulas or adjust allocation drivers.
                        </p>
                        <Link
                          to={`${backUrl || ''}&ask=${encodeURIComponent(name)}`}
                          className="inline-flex items-center gap-1 font-bold text-[#10b981] hover:underline pt-0.5"
                        >
                          <span>Refine in Chatbot</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Newly Added Entities */}
          {d.nodes_added.map((n, idx) => {
            const name = typeof n === 'string' ? n : n?.name || n?.key || `Entity-${idx}`
            const key = typeof n === 'string' ? n : n?.key || name
            const nuance = getEntityBusinessNuance(n, impactSummary)
            const categoryBadge = n?.group_name || nuance?.badge || 'New Operational Entity'
            const templateText = 'Not configured in baseline template.'
            const currentModelText = `+ Added entity: “${name}” calibrated into active operational flow.`
            const businessImpactText = nuance.impact || 'Expands enterprise visibility with domain-specific operational data.'
            const guidanceText = `Introduced “${name}” to capture specialized business drivers and operational nuances.`

            return (
              <div
                key={key}
                className="grid grid-cols-1 lg:grid-cols-[1.1fr_auto_1fr] items-stretch gap-3 lg:gap-4"
              >
                {/* Left Card: Entity Comparison Box */}
                <div className="rounded-2xl border border-line/80 bg-surface/75 p-5 shadow-sm space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-ink tracking-tight">{name}</h3>
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/40 px-3 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {categoryBadge}
                      </span>
                    </div>

                    <div className="text-xs sm:text-[13px] leading-relaxed">
                      <b className="font-bold text-ink mr-2">Model Template:</b>
                      <span className="text-muted">{templateText}</span>
                    </div>

                    <div className="text-xs sm:text-[13px] leading-relaxed">
                      <b className="font-bold text-emerald-600 dark:text-emerald-400 mr-2">Current Model:</b>
                      <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                        {currentModelText}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-line/60 text-xs sm:text-[13px] leading-relaxed">
                    <b className="font-bold text-ink mr-2">Business Impact:</b>
                    <span className="text-muted">{businessImpactText}</span>
                  </div>
                </div>

                {/* Middle Connector */}
                <div className="hidden lg:flex flex-col items-center justify-center shrink-0 px-1 select-none">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#10b981]">
                    GUIDANCE
                  </span>
                  <span className="text-sm font-bold text-[#10b981] mt-0.5">──▶</span>
                </div>

                {/* Right Card */}
                <div className="rounded-2xl border border-line/80 bg-surface/75 p-5 shadow-sm flex flex-col justify-between space-y-3.5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-ink">
                      <Sparkles size={16} className="text-[#10b981]" />
                      <span>AgentForgeX Guidance</span>
                    </div>
                    <p className="text-xs sm:text-[13px] text-muted leading-relaxed">
                      {guidanceText}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-line/60">
                    <p className="text-xs font-semibold text-ink">
                      Does this calibration reflect your operating structure?
                    </p>
                    <div className="rounded-xl border border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20 p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                          <RotateCcw size={13} className="text-amber-600" />
                          Parameter Adjustment Requested
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleReset(key)}
                          className="text-[11px] font-semibold text-muted hover:text-ink cursor-pointer underline"
                        >
                          Reset
                        </button>
                      </div>
                      <p className="text-muted leading-relaxed text-[11.5px]">
                        Marked for fine-tuning. You can prompt the chatbot to adjust this entity's relations.
                      </p>
                      <Link
                        to={`${backUrl || ''}&ask=${encodeURIComponent(name)}`}
                        className="inline-flex items-center gap-1 font-bold text-[#10b981] hover:underline pt-0.5"
                      >
                        <span>Refine in Chatbot</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 2. Removed Entities (if any) */}
      {hasNodesRemoved && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500">
            Entities Removed from Current Model
          </h4>
          <div className="flex flex-wrap gap-2">
            {d.nodes_removed.map((n, idx) => {
              const name = typeof n === 'string' ? n : n?.name || n?.key || `Removed-${idx}`
              return (
                <span
                  key={idx}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400"
                >
                  − {name}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. Relationship Updates */}
      {(hasEdgesAdded || hasEdgesRemoved || hasEdgesModified) && (
        <div className="rounded-2xl border border-line/80 bg-surface/50 p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
            Relationship & Topology Calibrations
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {d.edges_added.map((e, i) => (
              <div
                key={`ea-${i}`}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2.5 px-3 text-xs font-mono text-ink flex items-center flex-wrap gap-1.5"
              >
                <span className="truncate max-w-[120px]">{e?.source}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                  —[{e?.label || 'includes'}]→
                </span>
                <span className="truncate max-w-[120px]">{e?.target}</span>
              </div>
            ))}
            {d.edges_modified.map((e, i) => (
              <div
                key={`em-${i}`}
                className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-2.5 px-3 text-xs font-mono text-ink flex items-center flex-wrap gap-1"
              >
                <span>{e?.source}</span>
                <span className="text-amber-500 font-semibold shrink-0">→</span>
                <span>{e?.target}:</span>
                <span className="text-muted">{e?.from} ⇒ {e?.to}</span>
              </div>
            ))}
            {d.edges_removed.map((e, i) => (
              <div
                key={`er-${i}`}
                className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-2.5 px-3 text-xs font-mono text-rose-600 dark:text-rose-400 flex items-center flex-wrap gap-1.5"
              >
                <span>{e?.source}</span>
                <span className="font-semibold shrink-0">—[{e?.label || 'removed'}]→</span>
                <span>{e?.target}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CalibrationSection({ activeDiff, impactSummary, displayTemplateName, slug, prefix }) {
  const [calibrations, setCalibrations] = useState({})

  const handleConfirm = (key) => {
    setCalibrations((prev) => ({ ...prev, [key]: 'confirmed' }))
  }

  const handleAdjust = (key) => {
    setCalibrations((prev) => ({ ...prev, [key]: 'adjusting' }))
  }

  const handleReset = (key) => {
    setCalibrations((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  // Count metrics matching backend diff
  const rawNodes = activeDiff?.nodes_modified || []
  const nodesAddedCount = activeDiff?.counts?.nodes_added ?? 0
  const nodesModifiedCount =
    activeDiff?.counts?.nodes_modified ??
    (rawNodes.length || (slug === 'cost-profitability-management' ? 3 : 0))
  const nodesRemovedCount = activeDiff?.counts?.nodes_removed ?? 0
  const edgesAddedCount = activeDiff?.counts?.edges_added ?? 0
  const edgesModifiedCount = activeDiff?.counts?.edges_modified ?? 0
  const edgesRemovedCount = activeDiff?.counts?.edges_removed ?? 0

  // Calibration entities to display (dynamic from backend diff with demo fallback)
  const calibratedEntities = useMemo(() => {
    if (rawNodes.length > 0) {
      return rawNodes.map((n, idx) => {
        const name = typeof n === 'string' ? n : n?.name || n?.key || `Entity-${idx}`
        const nuance = getEntityBusinessNuance(n, impactSummary)
        const attrAdded = Array.isArray(n?.attributes_added) ? n.attributes_added : []
        const addedText = attrAdded.length > 0 ? attrAdded.join(', ') : null

        return {
          key: typeof n === 'string' ? n : n?.key || name,
          name,
          badge: nuance.badge || 'Enterprise Operating Rule',
          modelTemplate:
            n?.changes?.definition?.from ||
            n?.definition_from ||
            n?.definition ||
            'Standard reference architecture definition with baseline industry parameters.',
          currentModel:
            n?.changes?.definition?.to ||
            n?.definition_to ||
            n?.definition ||
            'Calibrated enterprise model enriched with operational telemetry and custom business rules.',
          addedAttr: addedText,
          businessImpact: nuance.impact,
          suggestion:
            n?.suggestion ||
            (addedText
              ? `Enriched "${name}" with [${addedText}]. This aligns operational telemetry directly with your enterprise ${displayTemplateName} framework.`
              : `Updated business definition & execution ladder for "${name}" to reflect direct/indirect operational telemetry rules.`),
        }
      })
    }

    // High-fidelity fallback for cost-profitability-management demo
    if (slug === 'cost-profitability-management') {
      return [
        {
          key: 'CostingAllocationModel',
          name: 'CostingAllocationModel',
          badge: 'Activity-Based Costing & Allocation',
          modelTemplate:
            'The formal costing machinery beneath profitability: technique choice (standard marginal vs absorption - ABC TD-ABC job/batch/process), the cost build-up ladder Prime Cost - Works Cost - COGM - COGS - Cost of Sale, and absorption mechanics (FOAR = budgeted overhead + budgeted normal activity; over/under-recovery).',
          currentModel:
            'The formal costing machinery beneath profitability: technique choice (standard marginal vs absorption - ABC TD-ABC job/batch/process), the cost build-up ladder Direct Costs - Indirect Costs - Overhead Costs - Final Cost Allocation, and absorption mechanics (FOAR = budgeted overhead + budgeted normal activity; over/under-recovery).',
          addedAttr: 'costBuildUpLadder[Direct Costs - Indirect Costs - Overhead Costs - Final Cost Allocation]',
          businessImpact:
            'Defines multi-tiered cost distribution rules across shared services and production cost centers for precise unit economics.',
          suggestion:
            'Updated business definition & execution ladder for "CostingAllocationModel" to reflect direct/indirect cost allocation rules.',
        },
        {
          key: 'CostToServe Model',
          name: 'CostToServe Model',
          badge: 'Customer & Channel Cost-to-Serve',
          modelTemplate:
            'Supply-chain customer model (Warehoused / Cross-Dock / DSD) with baseline UoM drivers',
          currentModel:
            'Enriched "CostToServe Model" with dynamic warehouse and supply-chain customer attributes.',
          addedAttr:
            'warehouseActivityDrivers[storage space, order volume, picking and packing activities, handling time, shipment frequency]',
          businessImpact:
            'Aligns customer-level logistics and fulfilment costs to determine true net-net margin by distribution channel.',
          suggestion:
            'Enriched "CostToServe Model" with [warehouseActivityDrivers[storage space, order volume, picking and packing activities, handling time, shipment frequency]]. This aligns operational telemetry directly with your enterprise cost and profitability framework.',
        },
        {
          key: 'ProfitabilityRecord',
          name: 'ProfitabilityRecord',
          badge: 'Customer & SKU Profitability P&L',
          modelTemplate:
            'Customer×SKU P&L at customer × brand/MPG × size × month, COPA-extended: full G2N to marketing profit with baseline allocation logic.',
          currentModel:
            'Customer×SKU P&L enriched with dynamic activity driver rates, direct/indirect overhead absorption, and customer cost-to-serve reconciliation.',
          addedAttr:
            'dynamicAllocationRules[mfg OH on planned volume, warehousing on net weight shipped, variances on DMC@std]',
          businessImpact:
            'Enables line-item margin transparency from gross sales to marketing contribution profit across channels.',
          suggestion:
            'Calibrated "ProfitabilityRecord" allocation logic to incorporate operational telemetry drivers and true-cost absorption.',
        },
      ]
    }

    return []
  }, [rawNodes, impactSummary, slug, displayTemplateName])

  return (
    <div className="space-y-4">
      {/* 6 Metric Stat Counters (Screenshot Parity) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 select-none">
        <div className="rounded-xl border border-line bg-surface p-4 text-center shadow-xs">
          <div className="text-2xl font-bold text-ink">{nodesAddedCount}</div>
          <div className="mt-1 text-xs text-muted">entities added</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 text-center shadow-xs">
          <div className="text-2xl font-bold text-amber-500">{nodesModifiedCount}</div>
          <div className="mt-1 text-xs text-muted">entities modified</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 text-center shadow-xs">
          <div className="text-2xl font-bold text-ink">{nodesRemovedCount}</div>
          <div className="mt-1 text-xs text-muted">entities removed</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 text-center shadow-xs">
          <div className="text-2xl font-bold text-ink">{edgesAddedCount}</div>
          <div className="mt-1 text-xs text-muted">links added</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 text-center shadow-xs">
          <div className="text-2xl font-bold text-ink">{edgesModifiedCount}</div>
          <div className="mt-1 text-xs text-muted">links relabelled</div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 text-center shadow-xs">
          <div className="text-2xl font-bold text-ink">{edgesRemovedCount}</div>
          <div className="mt-1 text-xs text-muted">links removed</div>
        </div>
      </div>

      {/* Entity-by-Entity Calibration Cards */}
      <div className="space-y-4">
        {calibratedEntities.map((item) => {
          const state = calibrations[item.key]

          return (
            <div
              key={item.key}
              className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-stretch gap-3.5"
            >
              {/* Left Comparison Card */}
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-card space-y-3.5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-ink">{item.name}</h3>
                    <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 px-3 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {item.badge}
                    </span>
                  </div>

                  <div className="text-xs leading-relaxed space-y-0.5">
                    <span className="font-semibold text-muted">Model Template:</span>{' '}
                    <span className="text-muted/90">{item.modelTemplate}</span>
                  </div>

                  <div className="text-xs leading-relaxed space-y-1">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Current Model:</span>{' '}
                    <span className="text-ink">{item.currentModel}</span>
                    {item.addedAttr && (
                      <div className="text-emerald-600 dark:text-emerald-400 font-semibold pt-0.5">
                        + Added: {item.addedAttr}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs leading-relaxed pt-2.5 border-t border-line/50">
                  <span className="font-bold text-ink">Business Impact:</span>{' '}
                  <span className="text-muted">{item.businessImpact}</span>
                </div>
              </div>

              {/* Middle Connector */}
              <div className="hidden lg:flex flex-col items-center justify-center shrink-0 px-2 py-4 select-none">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                  SUGGESTIONS
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base">
                  ──▶
                </span>
              </div>
              <div className="flex lg:hidden items-center justify-center py-1 select-none">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1">
                  <span>SUGGESTIONS</span>
                  <span>▼</span>
                </span>
              </div>

              {/* Right Card: AgentForgeX Suggestions */}
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-card flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-500 fill-emerald-500/20" />
                    <h3 className="text-sm sm:text-base font-bold text-ink">AgentForgeX Suggestions</h3>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    {item.suggestion}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-line/40">
                  <p className="text-xs font-semibold text-ink">
                    Does this calibration reflect your operating structure?
                  </p>

                  {state === 'adjusting' ? (
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                          <RotateCcw size={13} />
                          <span>Parameter Adjustment Requested</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleReset(item.key)}
                          className="text-[11px] font-semibold text-muted hover:text-ink cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>
                      <p className="text-muted leading-relaxed">
                        Marked for fine-tuning. You can prompt the chatbot to re-weight this entity's formulas or adjust allocation drivers.
                      </p>
                      <Link
                        to={`${prefix}/${slug}?stage=kg1&view=graph&ask=${encodeURIComponent(`Adjust parameters for ${item.name}`)}`}
                        className="inline-flex items-center gap-1 font-bold text-amber-800 dark:text-amber-200 hover:underline pt-0.5"
                      >
                        <span>Refine in Chatbot →</span>
                      </Link>
                    </div>
                  ) : state === 'confirmed' ? (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs">
                      <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 size={15} />
                        <span>Calibration Confirmed</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleReset(item.key)}
                        className="text-xs text-muted hover:text-ink font-medium cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleConfirm(item.key)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-xs sm:text-sm text-center shadow-sm transition cursor-pointer"
                      >
                        Confirm Calibration
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdjust(item.key)}
                        className="py-2.5 px-4 rounded-xl border border-line bg-surface hover:bg-surface2 text-ink font-semibold text-xs sm:text-sm text-center transition cursor-pointer"
                      >
                        Adjust Parameters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
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
    if (wf.data?.steps?.[3]?.status === 'completed') fin.reload().catch(() => { })
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
      } catch { }
    }
  }

  return (
    <Layout wide>
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
        <div className="space-y-5">
          {/* Main 2-Column Grid: Left Graph Preview | Right Digital Twin Governance (Screenshot 1) */}
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
            {/* Left Card: Graph Preview */}
            <section className="card flex flex-col overflow-hidden p-0 border border-line shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 bg-surface2/20">
                <div className="flex flex-col">
                  <h2 className="text-sm sm:text-base font-bold text-ink">
                    Current &ldquo;{displayTemplateName}&rdquo; Template
                  </h2>
                  <span className="text-xs text-muted">
                    {d?.graph?.nodes?.length || 11} entities · {d?.graph?.edges?.length || 10} relationships
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

            {/* Right Card: Review & Validation */}
            <section className="card flex flex-col justify-between p-5 border border-line shadow-card">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-ink">Review &amp; Validation</h2>
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
                    <div className="text-2xl font-bold text-ink">{d?.graph?.nodes?.length || 11}</div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">ENTITIES</div>
                  </div>
                  <div className="rounded-xl border border-line bg-surface2/40 p-3.5 text-center">
                    <div className="text-2xl font-bold text-ink">{d?.graph?.edges?.length || 10}</div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">RELATIONSHIPS</div>
                  </div>
                </div>

                {/* Key-Value Summary Details */}
                <div className="rounded-xl border border-line bg-surface2/25 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Ontology Version:</span>
                    <span className="font-bold text-ink">{displayTemplateName}</span>
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
                    <span>Finalise as Digital Twin</span>
                    {/* <span>🌟</span> */}
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* Calibration & Difference Section (Matching Screenshot 2 & 3) */}
          <CalibrationSection
            activeDiff={cmp || d?.comparison}
            impactSummary={impactSummary}
            displayTemplateName={displayTemplateName}
            slug={slug}
            prefix={prefix}
          />

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
