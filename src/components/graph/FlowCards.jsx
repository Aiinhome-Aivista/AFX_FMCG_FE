import React from 'react'
import { ArrowDown, ArrowRight, Route, X, Sparkles, CheckCircle2 } from 'lucide-react'
import { Loading } from '../common/States'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

/**
 * Formats canonical flow narratives into clean visual operational step chains with bold arrows (→).
 * Handles relationship labels (e.g. ──conform──▶, ──computes──▶) and delimiters (──▶, -->, ->, →, ;)
 */
export function NarrativeFlow({ text }) {
  if (!text) return null

  // Split by semicolons for multi-loop structures (e.g. primary cycle ; sub-loop ; feedback loop)
  const loops = text.split(/;\s*/).filter(Boolean)

  return (
    <div className="space-y-1.5 mt-2">
      {loops.map((loop, loopIdx) => {
        // Regex splits on arrow tokens while capturing delimiter with edge label if present
        const tokens = loop.split(/(\s*(?:──[a-zA-Z0-9 _-]+──▶|--[a-zA-Z0-9 _-]+-->|──▶|-->|->|→)\s*)/g).filter(Boolean)

        return (
          <div key={loopIdx} className="flex flex-wrap items-center gap-1 text-[11px] leading-relaxed">
            {loops.length > 1 && (
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-surface3/80 text-muted font-semibold mr-0.5">
                L{loopIdx + 1}
              </span>
            )}
            {tokens.map((token, tokIdx) => {
              // Check if token is an arrow delimiter
              const arrowMatch = token.match(/(?:──|--)(([a-zA-Z0-9 _-]+))(?:──|--)[▶>]|(?:──▶|-->|->|→)/)
              const isArrow = Boolean(arrowMatch) || /^(?:──▶|-->|->|→)$/.test(token.trim())

              if (isArrow) {
                const label = arrowMatch && arrowMatch[1] ? arrowMatch[1].trim() : null
                return (
                  <span key={tokIdx} className="inline-flex items-center gap-0.5 text-brand font-bold select-none shrink-0 mx-0.5">
                    {label && (
                      <span className="text-[9px] font-normal text-muted/80 italic font-mono">
                        ({label})
                      </span>
                    )}
                    <span>→</span>
                  </span>
                )
              }

              // Step token
              return (
                <span
                  key={tokIdx}
                  className="font-mono text-[11px] text-ink/85 font-medium px-1 py-0.2 rounded bg-surface2/60 border border-line/40 max-w-full truncate"
                  title={token.trim()}
                >
                  {token.trim()}
                </span>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

/**
 * End-to-End Operational Flow Component for all FMCG Domains.
 * Displays operational steps and cycles connected with arrows (→) to clearly represent the complete enterprise workflow.
 */
export default function FlowCards({
  flows = [],
  activeKey,
  onToggle,
  detail,
  loading,
  selectedKey,
  onStepSelect,
  hasChatted = false,
}) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const isDark = theme === 'dark'
  const username = user?.display_name || user?.email?.split('@')[0] || 'User'

  // Identify currently selected step in the active flow detail
  const selectedStep = detail?.steps?.find((s) => s.node_key === selectedKey)

  return (
    <details className="mt-5 rounded-2xl border border-line bg-surface shadow-card overflow-hidden group" open>
      {/* =========================================================================
          ACCORDION HEADER: TITLE, SUBTITLE & PROGRESS COUNTER
         ========================================================================= */}
      <summary className="cursor-pointer px-5 py-4 text-sm sm:text-base font-bold text-ink flex items-center justify-between select-none hover:bg-surface2 transition">
        <div className="flex items-center gap-2.5">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-brand/10 text-brand text-xs font-bold transition-transform group-open:rotate-90">
            ▸
          </span>
          <span className="text-brand flex items-center gap-2">
            <span>End-to-End Operational Cycles (§3 of the FMCG Canon)</span>
            <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-brand/10 border border-brand/20 px-2 py-0.5 text-[10px] font-bold text-brand font-mono">
              8 Connected Cycles (01 → 08)
            </span>
          </span>
          <span className="text-xs text-muted font-normal hidden lg:inline">
            — Click any cycle to trace and animate its complete sequential workflow across the graph
          </span>
        </div>

        {activeKey && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggle(activeKey)
            }}
            className="text-xs font-semibold text-brand hover:underline px-2.5 py-1 rounded-md hover:bg-brand/10"
          >
            Clear Selection
          </button>
        )}
      </summary>

      {/* =========================================================================
          OPERATIONAL CYCLE CARDS CONNECTED WITH ARROWS (→)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-5 pt-0 bg-surface relative">
        {flows.map((f, i) => {
          const isActive = activeKey === f.key
          const isRow1End = i === 3
          const isLast = i === flows.length - 1

          return (
            <React.Fragment key={f.key}>
              <div
                onClick={() => onToggle(f.key)}
                className={`relative rounded-xl p-3.5 border transition cursor-pointer flex flex-col justify-between group/card ${
                  isActive
                    ? 'border-brand bg-brand/10 shadow-md ring-2 ring-brand/30'
                    : 'border-line bg-surface2/40 hover:border-brand/40 hover:bg-surface2'
                }`}
              >
                <div>
                  {/* Card Header: Phase index, Title, and Step count */}
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border ${
                          isActive
                            ? 'bg-brand text-brand-ink border-brand'
                            : 'bg-brand/10 text-brand border-brand/20'
                        }`}
                      >
                        Phase {String(i + 1).padStart(2, '0')}
                      </span>
                      <b className={`text-xs font-bold truncate max-w-[140px] sm:max-w-[170px] ${isActive ? 'text-brand' : 'text-ink'}`}>
                        {f.title}
                      </b>
                    </div>
                    <span className="text-[10px] text-muted font-mono shrink-0">
                      {f.step_count} steps
                    </span>
                  </div>

                  {/* Badges: Tailored & Domain Relevance */}
                  <div className="flex items-center gap-1.5 flex-wrap my-1">
                    {Boolean(f.customized) && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 dark:bg-emerald-500/25 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Tailored by {username}
                      </span>
                    )}
                    {f.relevant ? (
                      <span className="badge bg-brand/15 text-brand border border-brand/25 text-[10px] py-0">
                        this domain
                      </span>
                    ) : f.touches_domain ? (
                      <span className="badge bg-surface2 text-muted text-[10px] py-0">
                        touches
                      </span>
                    ) : null}
                  </div>

                  {/* Parsed Operational Step Flow with bold arrows (→) */}
                  <NarrativeFlow text={f.canonical_narrative || f.narrative} />
                </div>

                {/* Card Footer */}
                <div className="mt-3 pt-2.5 border-t border-line/50 flex items-center justify-between text-[11px]">
                  <span className={isActive ? 'text-brand font-semibold' : 'text-muted'}>
                    {isActive ? '● Tracing path on graph' : 'Click to trace on graph'}
                  </span>
                  <ArrowRight size={12} className={isActive ? 'text-brand' : 'text-muted'} />
                </div>

                {/* =========================================================================
                    CONNECTING ARROWS (→) BETWEEN CARDS
                   ========================================================================= */}
                {/* Desktop Connecting Arrows (lg: 4 columns) */}
                {(i === 0 || i === 1 || i === 2 || i === 4 || i === 5 || i === 6) && (
                  <div className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 items-center justify-center rounded-full bg-surface border border-line shadow-sm pointer-events-none group-hover/card:scale-110 transition-transform">
                    <ArrowRight size={13} className="text-brand" strokeWidth={2.5} />
                  </div>
                )}
                {/* Desktop Row 1 to Row 2 wrap indicator (at Card 4) */}
                {i === 3 && (
                  <div className="hidden lg:flex absolute -bottom-3.5 right-6 z-20 h-7 w-7 items-center justify-center rounded-full bg-surface border border-line shadow-sm pointer-events-none group-hover/card:scale-110 transition-transform">
                    <ArrowDown size={13} className="text-brand" strokeWidth={2.5} />
                  </div>
                )}

                {/* Tablet Connecting Arrows (sm to lg: 2 columns) */}
                {(i === 0 || i === 2 || i === 4 || i === 6) && (
                  <div className="hidden sm:flex lg:hidden absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 items-center justify-center rounded-full bg-surface border border-line shadow-sm pointer-events-none">
                    <ArrowRight size={13} className="text-brand" strokeWidth={2.5} />
                  </div>
                )}
                {(i === 1 || i === 3 || i === 5) && (
                  <div className="hidden sm:flex lg:hidden absolute -bottom-3.5 right-6 z-20 h-7 w-7 items-center justify-center rounded-full bg-surface border border-line shadow-sm pointer-events-none">
                    <ArrowDown size={13} className="text-brand" strokeWidth={2.5} />
                  </div>
                )}

                {/* Mobile Connecting Arrows (single column) */}
                {!isLast && (
                  <div className="flex sm:hidden absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-20 h-7 w-7 items-center justify-center rounded-full bg-surface border border-line shadow-sm pointer-events-none">
                    <ArrowDown size={13} className="text-brand" strokeWidth={2.5} />
                  </div>
                )}
              </div>

              {/* Operational Hand-off Bridge spanning all 4 columns between Row 1 and Row 2 */}
              {isRow1End && (
                <div className="hidden lg:flex col-span-4 items-center justify-center py-2 px-4 gap-3 my-0.5 select-none">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand/30 to-brand/40" />
                  <div className="flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-4 py-1 text-[11px] font-semibold text-brand shadow-xs">
                    <span>Demand & Commercial Execution Loops (01–04)</span>
                    <span className="font-bold text-brand">──▶</span>
                    <span>Supply Chain & Financial Value Realization (05–08)</span>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-brand/40 via-brand/30 to-transparent" />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* =========================================================================
          ACTIVE FLOW STEP-BY-STEP CONNECTED PIPELINE
         ========================================================================= */}
      {activeKey && (
        <div className="card m-4 sm:m-5 mt-0 p-4 border border-line bg-surface shadow-md animate-in fade-in duration-200">
          {loading || !detail ? (
            <Loading label="Loading operational steps…" className="!p-4" />
          ) : (
            <>
              {/* Active Flow Header */}
              <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-brand text-brand-ink text-xs font-bold font-mono">
                      Active Operational Cycle
                    </span>
                    <h3 className="text-base font-bold text-ink">{detail.title}</h3>
                    <span className="text-xs text-muted font-mono">
                      ({detail.steps?.length || 0} sequential operational steps)
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted leading-relaxed font-sans">{detail.narrative}</p>
                </div>
                <button
                  className="btn-ghost btn-sm shrink-0 flex items-center gap-1 text-xs"
                  onClick={() => onToggle(activeKey)}
                >
                  <X size={14} /> Clear Selection
                </button>
              </div>

              {/* Connected Operational Steps Pipeline */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
                    Complete Workflow Pipeline (Connected with →) — Click any step to inspect and focus on Knowledge Graph:
                  </span>
                </div>

                {/* Steps Pipeline with Connected Arrows */}
                <div className="flex flex-wrap items-center gap-y-3 p-1">
                  {detail.steps?.map((s, idx) => {
                    const isSelected = selectedKey === s.node_key
                    const isLastStep = idx === detail.steps.length - 1

                    return (
                      <div key={s.order || idx} className="flex items-center">
                        <button
                          type="button"
                          onClick={() => onStepSelect(s.node_key)}
                          className={`group relative flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition shadow-xs cursor-pointer ${
                            isSelected
                              ? 'border-brand bg-brand/15 ring-2 ring-brand/40 shadow-sm'
                              : 'border-line bg-surface2/60 hover:border-brand/40 hover:bg-surface2'
                          }`}
                        >
                          <span
                            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold transition ${
                              isSelected
                                ? 'bg-brand text-brand-ink'
                                : 'bg-brand/10 text-brand border border-brand/20 group-hover:bg-brand group-hover:text-brand-ink'
                            }`}
                          >
                            {s.order}
                          </span>
                          <div className="min-w-0 pr-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-ink group-hover:text-brand truncate max-w-[140px] sm:max-w-[190px]">
                                {s.name}
                              </span>
                              {s.change_state === 'modified' && (
                                <span className="rounded bg-amber-500/15 px-1 py-0.2 text-[9px] font-semibold text-amber-500 border border-amber-500/30">
                                  Modified
                                </span>
                              )}
                              {s.change_state === 'added' && (
                                <span className="rounded bg-emerald-500/15 px-1 py-0.2 text-[9px] font-semibold text-emerald-500 border border-emerald-500/30">
                                  Added
                                </span>
                              )}
                            </div>
                            <span className="block text-[10px] text-muted truncate max-w-[140px]">
                              {s.group_name}
                            </span>
                          </div>
                        </button>

                        {/* Connected Arrow to next operational step */}
                        {!isLastStep && (
                          <div className="flex items-center justify-center px-2 text-brand shrink-0 select-none">
                            <ArrowRight size={16} strokeWidth={2.5} className="text-brand animate-pulse" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Active Step Details & Business Definition Card */}
                {selectedStep && (
                  <div className="mt-4 rounded-xl border border-brand/30 bg-brand/5 p-4 flex items-start justify-between gap-3 animate-in fade-in duration-150">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-brand text-brand-ink text-[11px] font-bold font-mono">
                          Step {selectedStep.order} of {detail.steps.length}
                        </span>
                        <span className="text-sm font-bold text-ink">{selectedStep.name}</span>
                        <span className="text-xs text-muted">({selectedStep.group_name})</span>
                        {selectedStep.change_state && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-brand/10 text-brand">
                            {selectedStep.change_state.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {selectedStep.definition && (
                        <p className="mt-2 text-xs text-ink/90 leading-relaxed font-sans">
                          {selectedStep.definition}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onStepSelect(selectedStep.node_key)}
                      className="btn-outline btn-xs shrink-0 flex items-center gap-1 border-brand/40 text-brand hover:bg-brand/10"
                    >
                      Focus on Graph
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </details>
  )
}
