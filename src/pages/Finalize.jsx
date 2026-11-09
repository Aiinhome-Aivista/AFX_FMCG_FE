import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, History, Lock, Sparkles, XCircle } from 'lucide-react'
import Layout from '../components/common/Layout'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { EmptyState, ErrorState, Loading } from '../components/common/States'
import OntologyGraphCanvas from '../components/graph/OntologyGraphCanvas'
import useAsync from '../components/common/useAsync'
import { domains, graphs } from '../api'
import { cleanMojibake, timeAgo } from '../lib/format'
import { DOMMETA, SLUG_TO_DOM } from '../lib/ontologyData'
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

const Stat = ({ label, v, tone }) => (
  <div className="rounded-xl border border-line bg-surface2/30 p-3 text-center">
    <div className={`text-2xl font-bold ${tone || ''}`}>{v}</div>
    <div className="mt-0.5 text-[11px] text-muted">{label}</div>
  </div>
)

function DiffLists({ d }) {
  const none = !Object.entries(d.counts || {}).some(([k, v]) => /added|removed|modified/.test(k) && v)
  if (none) return <p className="mt-3 text-sm text-muted">No differences.</p>
  return (
    <div className="mt-4 space-y-4">
      {d.nodes_added?.length > 0 && (
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
            Entities Added
          </h4>
          <ul className="space-y-1.5 text-sm">
            {d.nodes_added.map((n) => (
              <li key={n.key} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: n.color || '#10b981' }} />
                <b className="text-ink">{n.name}</b>
                <span className="text-xs text-muted">({n.origin || 'Custom'})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {d.nodes_modified?.length > 0 && (
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-500 mb-2">
            ENTITIES MODIFIED
          </h4>
          <ul className="space-y-3 text-sm">
            {d.nodes_modified.map((n) => (
              <li key={n.key} className="rounded-lg border border-line bg-surface2/20 p-3">
                <b className="text-ink font-semibold">{n.name}</b>
                {n.changes?.name && (
                  <div className="text-xs text-muted italic">renamed from “{n.changes.name.from}”</div>
                )}
                {n.attributes_added?.length > 0 && (
                  <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed font-mono">
                    + {n.attributes_added.join(', ')}
                  </div>
                )}
                {n.attributes_removed?.length > 0 && (
                  <div className="mt-1 text-xs text-rose-500 leading-relaxed font-mono">
                    − {n.attributes_removed.join(', ')}
                  </div>
                )}
                {n.changes?.notes && <div className="mt-1 text-xs text-muted">business-rule note added</div>}
                {n.changes?.formulas && <div className="mt-1 text-xs text-muted">formulas changed</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {d.nodes_removed?.length > 0 && (
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-500 mb-2">
            Entities Removed
          </h4>
          <ul className="space-y-1 text-sm">
            {d.nodes_removed.map((n) => (
              <li key={n.key} className="text-rose-500 font-semibold">{n.name}</li>
            ))}
          </ul>
        </div>
      )}

      {(d.edges_added?.length > 0 || d.edges_removed?.length > 0 || d.edges_modified?.length > 0) && (
        <div className="pt-2 border-t border-line">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
            Relationship Changes
          </h4>
          <ul className="space-y-1 text-xs text-muted">
            {d.edges_added?.map((e, i) => (
              <li key={`ea-${i}`} className="text-emerald-600 dark:text-emerald-400">
                + {e.source} —{e.label}→ {e.target}
              </li>
            ))}
            {d.edges_removed?.map((e, i) => (
              <li key={`er-${i}`} className="text-rose-500">
                − {e.source} —{e.label}→ {e.target}
              </li>
            ))}
            {d.edges_modified?.map((e, i) => (
              <li key={`em-${i}`}>
                {e.source} → {e.target}: {e.from} ⇒ {e.to}
              </li>
            ))}
          </ul>
        </div>
      )}
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

  useEffect(() => {
    if (wf.data?.steps?.[3]?.status === 'completed') fin.reload().catch(() => {})
  }, [wf.data]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (fin.data && range.to === null) setRange({ from: 0, to: fin.data.version.number })
  }, [fin.data]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (range.to !== null) {
      graphs.compare(slug, range.from, range.to).then(setCmp, (e) => toast.error(e.message))
    }
  }, [range, slug]) // eslint-disable-line react-hooks/exhaustive-deps

  if (wf.data && !wf.data.started) return <Navigate to={`/fmcg/${slug}`} replace />
  if (wf.loading && !wf.data) return <Layout wide><Loading /></Layout>
  if (wf.error) return <Layout wide><ErrorState error={wf.error} onRetry={wf.reload} /></Layout>
  const hasKg1 = wf.data.steps[3].status === 'completed'
  const finalized = !!wf.data.finalized_version_number
  const d = fin.data

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
          <span>Back to Knowledge Graph & Chatbot</span>
        </Link>
        <h1 className="mt-2 text-xl sm:text-2xl font-bold text-ink">Enterprise Digital Twin Finalization</h1>
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
              Go to Knowledge Graph
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
            {/* Left Card: Digital Twin Graph Preview */}
            <section className="card flex flex-col overflow-hidden p-0 border border-line shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 bg-surface2/20">
                <div className="flex flex-col">
                  <h2 className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-ink">
                    <Sparkles size={16} className="text-emerald-500 fill-emerald-500/20" />
                    <span>Digital Twin Graph Preview · {d.version.label}</span>
                  </h2>
                  <span className="text-xs text-muted">
                    {d.graph.nodes.length} entities · {d.graph.edges.length} relationships
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{displayTemplateName} Radial Spine Active</span>
                </div>
              </div>
              <div className="h-[520px] min-h-[420px] w-full relative bg-surface">
                <OntologyGraphCanvas
                  nodes={d.graph.nodes}
                  edges={d.graph.edges}
                  domainMeta={domain}
                  className="w-full h-full"
                />
              </div>
            </section>

            {/* Right Card: Digital Twin Governance */}
            <section className="card flex flex-col justify-between p-5 border border-line shadow-card">
              <div className="space-y-4">
                {/* Governance Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-ink">Digital Twin Governance</h2>
                  {d.validation.errors.length === 0 ? (
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
                    {d.validation.errors.length === 0 ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={14} /> Zero Errors
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-rose-500">
                        <XCircle size={14} /> {d.validation.errors.length} Errors
                      </span>
                    )}
                  </div>
                  {d.validation.errors.length === 0 && d.validation.warnings.length === 0 ? (
                    <p className="mt-1.5 text-xs text-muted leading-relaxed">
                      Ontology verified against {resolvedDomainName} domain schema and business rules. Ready for enterprise governance.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1.5 text-xs">
                      {d.validation.errors.map((e, i) => (
                        <li key={`err-${i}`} className="flex items-start gap-1.5 text-rose-500">
                          <XCircle size={13} className="mt-0.5 shrink-0" />
                          <span>{e.message}</span>
                        </li>
                      ))}
                      {d.validation.warnings.map((w, i) => (
                        <li key={`warn-${i}`} className="flex items-start gap-1.5 text-amber-500">
                          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                          <span>{w.message}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Entities and Relationships Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-line bg-surface2/40 p-3.5 text-center">
                    <div className="text-2xl font-bold text-ink">{d.graph.nodes.length}</div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">ENTITIES</div>
                  </div>
                  <div className="rounded-xl border border-line bg-surface2/40 p-3.5 text-center">
                    <div className="text-2xl font-bold text-ink">{d.graph.edges.length}</div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">RELATIONSHIPS</div>
                  </div>
                </div>

                {/* Key-Value Summary Details */}
                <div className="rounded-xl border border-line bg-surface2/25 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Ontology Version:</span>
                    <span className="font-bold text-ink">{d.version.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Domain:</span>
                    <span className="font-bold text-ink">{resolvedDomainName}</span>
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
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      <Lock size={16} />
                      <span>Finalised as Digital Twin ({d.version.label})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`${prefix}/${slug}/telemetry`}
                        className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm"
                      >
                        <span>Continue to telemetry</span>
                        <ArrowRight size={16} />
                      </Link>
                      <button
                        className="btn-ghost py-2.5 text-xs text-muted hover:text-ink cursor-pointer"
                        onClick={() => setDlg('reopen')}
                      >
                        Re-open ontology
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="w-full rounded-xl bg-[#10b981] hover:bg-[#059669] text-white py-3.5 px-4 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    disabled={d.validation.errors.length > 0}
                    onClick={() => {
                      setAck(false)
                      setDlg('finalize')
                    }}
                  >
                    <Sparkles size={16} />
                    <span>Finalise as Digital Twin</span>
                    <span>🌟</span>
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* Bottom Card 1: Compare Versions */}
          <section className="card p-5 border border-line shadow-card">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <h2 className="text-base font-bold text-ink shrink-0">Compare Versions</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-ink">
                <div className="relative inline-flex items-center">
                  <select
                    className="cursor-pointer rounded-lg border border-line/60 bg-surface2/50 hover:bg-surface2 px-2.5 py-1 text-xs sm:text-sm font-semibold text-ink focus:outline-none focus:border-brand transition shadow-2xs"
                    value={range.from}
                    onChange={(e) => setRange({ ...range, from: Number(e.target.value) })}
                    aria-label="From version"
                  >
                    <option value={0}>Model &ldquo;{displayTemplateName}&rdquo; Template</option>
                    {d.versions.map((v) => (
                      <option key={v.number} value={v.number}>
                         Model &ldquo;{displayTemplateName}&rdquo;
                      </option>
                    ))}
                  </select>
                </div>

                <ArrowRight size={14} className="text-muted shrink-0" />

                <div className="relative inline-flex items-center">
                  <select
                    className="cursor-pointer rounded-lg border border-line/60 bg-surface2/50 hover:bg-surface2 px-2.5 py-1 text-xs sm:text-sm font-semibold text-ink focus:outline-none focus:border-brand transition shadow-2xs"
                    value={range.to ?? ''}
                    onChange={(e) => setRange({ ...range, to: Number(e.target.value) })}
                    aria-label="To version"
                  >
                    {d.versions.map((v) => (
                      <option key={v.number} value={v.number}>
                        {v.number === d.version.number
                          ? `Current "${displayTemplateName}" Template`
                          : `"${displayTemplateName}" Template`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {cmp ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                  <Stat
                    label="entities added"
                    v={cmp.counts?.nodes_added || 0}
                    tone="text-emerald-600 dark:text-emerald-400 font-bold text-2xl"
                  />
                  <Stat
                    label="entities modified"
                    v={cmp.counts?.nodes_modified || 0}
                    tone="text-amber-500 font-bold text-2xl"
                  />
                  <Stat
                    label="entities removed"
                    v={cmp.counts?.nodes_removed || 0}
                    tone="text-rose-500 font-bold text-2xl"
                  />
                  <Stat
                    label="links added"
                    v={cmp.counts?.edges_added || 0}
                    tone="text-emerald-600 dark:text-emerald-400 font-bold text-2xl"
                  />
                  <Stat
                    label="links relabelled"
                    v={cmp.counts?.edges_modified || 0}
                    tone="text-slate-600 dark:text-slate-300 font-bold text-2xl"
                  />
                  <Stat
                    label="links removed"
                    v={cmp.counts?.edges_removed || 0}
                    tone="text-rose-500 font-bold text-2xl"
                  />
                </div>
                <DiffLists d={cmp} />
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
            {d.history.length === 0 && <p className="mt-3 text-sm text-muted">No change proposals recorded yet.</p>}
            <ul className="mt-3.5 space-y-3">
              {d.history.map((p) => (
                <li key={p.id} className="rounded-xl border border-line bg-surface2/20 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <b className="text-sm text-ink font-semibold">{p.title}</b>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md border border-line bg-surface2 px-2 py-0.5 text-[11px] font-semibold text-muted">
                        active — {p.result_version ? `v${p.result_version}` : (d.version.label || '').replace(/KG/g, 'v')}
                      </span>
                      <span className="text-xs text-muted">
                        {p.source} · {timeAgo(p.created_at)}
                      </span>
                    </div>
                  </div>
                  {p.items?.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-xs text-muted">
                      {p.items.map((i, k) => (
                        <li key={k} className={i.status === 'rejected' ? 'line-through' : ''}>
                          {i.status === 'approved' ? '✓' : i.status === 'rejected' ? '✗' : '•'} {i.description}
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
        <p>This locks {d?.version.label} as your ontology and unlocks telemetry upload. The chatbot session will be locked until you re-open it.</p>
        {d?.validation.warnings.length > 0 && (
          <label className="mt-3 flex items-start gap-2 text-ink">
            <input
              type="checkbox"
              className="mt-1 accent-[rgb(var(--brand))]"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
            />
            <span>I have reviewed the {d.validation.warnings.length} warning(s) and want to finalise anyway.</span>
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
