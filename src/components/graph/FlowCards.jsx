import React from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  X,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { Loading } from '../common/States'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

/**
 * Formats canonical flow narratives into clean visual operational step chains connected with arrows (→).
 * Cleans delimiters (──conform──▶, ──▶, -->, ->, →, ➔) so non-technical users can easily read the cycle.
 */
export function NarrativeFlow({ text }) {
  if (!text) return null

  // Split by arrow patterns while capturing delimiters (e.g. ──conform──▶, ──▶, -->, ->, →, ➔)
  const tokens = text.split(/(\s*(?:──[a-zA-Z0-9 _-]+──▶|--[a-zA-Z0-9 _-]+-->|──▶|-->|->|→|➔)\s*)/g).filter(Boolean)

  return (
    <p className="mt-2 text-[11px] text-muted/90 leading-relaxed font-sans">
      {tokens.map((token, tokIdx) => {
        const arrowMatch = token.match(/(?:──|--)(([a-zA-Z0-9 _-]+))(?:──|--)[▶>]|(?:──▶|-->|->|→|➔)/)
        const isArrow = Boolean(arrowMatch) || /^(?:──▶|-->|->|→|➔)$/.test(token.trim())

        if (isArrow) {
          const label = arrowMatch && arrowMatch[1] ? arrowMatch[1].trim() : null
          return (
            <span
              key={tokIdx}
              title={label ? `Relation: ${label}` : undefined}
              className="text-muted/60 dark:text-muted/70 font-semibold mx-1 inline-block select-none"
            >
              →
            </span>
          )
        }

        return (
          <span key={tokIdx} className="text-ink/80 dark:text-ink/90 font-normal">
            {token}
          </span>
        )
      })}
    </p>
  )
}

/**
 * Individual Operational Cycle Card matching the reference design in Image 2.
 */
export function FlowCard({
  flow,
  index,
  flowKey,
  isActive,
  onToggle,
  username,
}) {
  const title = flow.title || flow.t || flow.name || `Cycle ${index + 1}`
  const stepCount =
    flow.step_count ??
    (Array.isArray(flow.ids)
      ? flow.ids.length
      : Array.isArray(flow.steps)
      ? flow.steps.length
      : null)
  const narrative = flow.canonical_narrative || flow.narrative || flow.x || ''
  const isCustomized = Boolean(flow.customized)

  return (
    <div
      onClick={() => onToggle(flowKey)}
      className={`group/card relative rounded-xl p-4 border transition cursor-pointer flex flex-col justify-between h-full min-h-[145px] ${
        isActive
          ? 'border-brand bg-brand/5 ring-2 ring-brand/30 shadow-md'
          : 'border-line bg-surface hover:border-brand/40 hover:bg-surface2/40'
      }`}
    >
      <div>
        {/* Card Header: Title on Left, Step count on Right */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <b
            className={`text-xs sm:text-[13px] font-bold leading-snug line-clamp-2 ${
              isActive ? 'text-brand' : 'text-ink'
            }`}
          >
            {title}
          </b>
          {stepCount !== null && (
            <span className="text-[11px] text-muted font-normal shrink-0">
              {stepCount} steps
            </span>
          )}
        </div>

        {/* Tailored Badge if customized */}
        {isCustomized && (
          <div className="mb-1.5">
            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Tailored by {username}
            </span>
          </div>
        )}

        {/* Clean Narrative Flow connected with arrows (→) */}
        <NarrativeFlow text={narrative} />
      </div>

      {/* Card Footer: Click to trace path > */}
      <div className="mt-3.5 pt-1 flex items-center justify-between text-[11px] select-none">
        <span
          className={
            isActive
              ? 'text-brand font-semibold'
              : 'text-muted/80 group-hover/card:text-brand transition-colors'
          }
        >
          {isActive ? '● Tracing path on graph' : 'Click to trace path'}
        </span>
        <ChevronRight
          size={14}
          className={`transition-transform group-hover/card:translate-x-0.5 ${
            isActive ? 'text-brand' : 'text-muted/60 group-hover/card:text-brand'
          }`}
        />
      </div>
    </div>
  )
}

/**
 * Serpentine Flow Grid:
 * Connects operational cycle cards in a continuous snake/serpentine workflow loop
 * with connecting arrows (→, ↓, ←), perfectly matching Image 2 for any number of cycles.
 */
export function SerpentineFlowGrid({ flows, activeKey, onToggle, username }) {
  if (!flows || flows.length === 0) return null

  // Helper to render card with resolved key & active state
  const renderCard = (flow, idx) => {
    if (!flow) return null
    const flowKey = flow.key !== undefined ? flow.key : idx
    const isActive =
      activeKey !== null &&
      activeKey !== undefined &&
      (activeKey === flowKey ||
        activeKey === idx ||
        activeKey === flow.key ||
        String(activeKey) === String(flowKey))

    return (
      <FlowCard
        key={flowKey}
        flow={flow}
        index={idx}
        flowKey={flowKey}
        isActive={isActive}
        onToggle={onToggle}
        username={username}
      />
    )
  }

  // DESKTOP: Chunk into 4-column rows
  const chunkSize = 4
  const desktopRows = []
  for (let i = 0; i < flows.length; i += chunkSize) {
    desktopRows.push(flows.slice(i, i + chunkSize))
  }

  // TABLET: Chunk into 2-column rows
  const tabletChunk = 2
  const tabletRows = []
  for (let i = 0; i < flows.length; i += tabletChunk) {
    tabletRows.push(flows.slice(i, i + tabletChunk))
  }

  return (
    <>
      {/* =========================================================================
          DESKTOP VIEW (lg: 4 columns serpentine matching Image 2)
         ========================================================================= */}
      <div className="hidden lg:flex flex-col gap-2">
        {desktopRows.map((rowItems, rowIdx) => {
          const isEvenRow = rowIdx % 2 === 0
          const isLastRow = rowIdx === desktopRows.length - 1
          const baseIdx = rowIdx * chunkSize

          return (
            <React.Fragment key={rowIdx}>
              {/* Row Cards */}
              <div className="flex items-center gap-2">
                {isEvenRow ? (
                  // Even Row: Left-to-Right (Col 1 → Col 2 → Col 3 → Col 4)
                  [0, 1, 2, 3].map((colIdx) => {
                    const item = rowItems[colIdx]
                    const actualIdx = baseIdx + colIdx
                    const hasNext = colIdx < 3 && colIdx < rowItems.length - 1

                    return (
                      <React.Fragment key={colIdx}>
                        <div className="flex-1 min-w-0 h-full flex flex-col">
                          {item ? renderCard(item, actualIdx) : <div className="h-full" />}
                        </div>
                        {colIdx < 3 && (
                          <div className="w-6 shrink-0 flex items-center justify-center text-muted/60 dark:text-muted/70">
                            {hasNext ? <ArrowRight size={16} strokeWidth={2} /> : null}
                          </div>
                        )}
                      </React.Fragment>
                    )
                  })
                ) : (
                  // Odd Row: Right-to-Left (Col 4 ← Col 3 ← Col 2 ← Col 1)
                  // Col 4 (rightmost, under Col 4 of previous row) = rowItems[0]
                  // Col 3 = rowItems[1]
                  // Col 2 = rowItems[2]
                  // Col 1 (leftmost) = rowItems[3]
                  (() => {
                    const itemCol1 = rowItems[3]
                    const itemCol2 = rowItems[2]
                    const itemCol3 = rowItems[1]
                    const itemCol4 = rowItems[0]

                    const hasArrow1to2 = Boolean(itemCol1 && itemCol2)
                    const hasArrow2to3 = Boolean(itemCol2 && itemCol3)
                    const hasArrow3to4 = Boolean(itemCol3 && itemCol4)

                    return (
                      <>
                        {/* Col 1 */}
                        <div className="flex-1 min-w-0 h-full flex flex-col">
                          {itemCol1 ? renderCard(itemCol1, baseIdx + 3) : <div className="h-full" />}
                        </div>

                        {/* Arrow between Col 1 and Col 2 */}
                        <div className="w-6 shrink-0 flex items-center justify-center text-muted/60 dark:text-muted/70">
                          {hasArrow1to2 ? <ArrowLeft size={16} strokeWidth={2} /> : null}
                        </div>

                        {/* Col 2 */}
                        <div className="flex-1 min-w-0 h-full flex flex-col">
                          {itemCol2 ? renderCard(itemCol2, baseIdx + 2) : <div className="h-full" />}
                        </div>

                        {/* Arrow between Col 2 and Col 3 */}
                        <div className="w-6 shrink-0 flex items-center justify-center text-muted/60 dark:text-muted/70">
                          {hasArrow2to3 ? <ArrowLeft size={16} strokeWidth={2} /> : null}
                        </div>

                        {/* Col 3 */}
                        <div className="flex-1 min-w-0 h-full flex flex-col">
                          {itemCol3 ? renderCard(itemCol3, baseIdx + 1) : <div className="h-full" />}
                        </div>

                        {/* Arrow between Col 3 and Col 4 */}
                        <div className="w-6 shrink-0 flex items-center justify-center text-muted/60 dark:text-muted/70">
                          {hasArrow3to4 ? <ArrowLeft size={16} strokeWidth={2} /> : null}
                        </div>

                        {/* Col 4 */}
                        <div className="flex-1 min-w-0 h-full flex flex-col">
                          {itemCol4 ? renderCard(itemCol4, baseIdx + 0) : <div className="h-full" />}
                        </div>
                      </>
                    )
                  })()
                )}
              </div>

              {/* Vertical Connector Row between rows */}
              {!isLastRow && (
                <div className="flex items-center gap-2 my-1">
                  {isEvenRow ? (
                    // Even row transitions at rightmost column (Col 4)
                    <>
                      <div className="flex-1" />
                      <div className="w-6 shrink-0" />
                      <div className="flex-1" />
                      <div className="w-6 shrink-0" />
                      <div className="flex-1" />
                      <div className="w-6 shrink-0" />
                      <div className="flex-1 flex justify-center">
                        <div className="flex items-center justify-center text-muted/60 dark:text-muted/70 py-1">
                          <ArrowDown size={16} strokeWidth={2} />
                        </div>
                      </div>
                    </>
                  ) : (
                    // Odd row transitions at leftmost column (Col 1)
                    <>
                      <div className="flex-1 flex justify-center">
                        <div className="flex items-center justify-center text-muted/60 dark:text-muted/70 py-1">
                          <ArrowDown size={16} strokeWidth={2} />
                        </div>
                      </div>
                      <div className="w-6 shrink-0" />
                      <div className="flex-1" />
                      <div className="w-6 shrink-0" />
                      <div className="flex-1" />
                      <div className="w-6 shrink-0" />
                      <div className="flex-1" />
                    </>
                  )}
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* =========================================================================
          TABLET VIEW (sm to lg: 2 columns serpentine)
         ========================================================================= */}
      <div className="hidden sm:flex lg:hidden flex-col gap-2">
        {tabletRows.map((tRowItems, tRowIdx) => {
          const isEven = tRowIdx % 2 === 0
          const isLast = tRowIdx === tabletRows.length - 1
          const baseIdx = tRowIdx * tabletChunk

          return (
            <React.Fragment key={tRowIdx}>
              <div className="flex items-center gap-2">
                {isEven ? (
                  // Col 1 → Col 2
                  <>
                    <div className="flex-1 min-w-0 h-full flex flex-col">
                      {tRowItems[0] ? renderCard(tRowItems[0], baseIdx) : <div className="h-full" />}
                    </div>
                    <div className="w-6 shrink-0 flex items-center justify-center text-muted/60 dark:text-muted/70">
                      {tRowItems[1] ? <ArrowRight size={16} strokeWidth={2} /> : null}
                    </div>
                    <div className="flex-1 min-w-0 h-full flex flex-col">
                      {tRowItems[1] ? renderCard(tRowItems[1], baseIdx + 1) : <div className="h-full" />}
                    </div>
                  </>
                ) : (
                  // Col 1 ← Col 2
                  <>
                    <div className="flex-1 min-w-0 h-full flex flex-col">
                      {tRowItems[1] ? renderCard(tRowItems[1], baseIdx + 1) : <div className="h-full" />}
                    </div>
                    <div className="w-6 shrink-0 flex items-center justify-center text-muted/60 dark:text-muted/70">
                      {tRowItems[1] && tRowItems[0] ? <ArrowLeft size={16} strokeWidth={2} /> : null}
                    </div>
                    <div className="flex-1 min-w-0 h-full flex flex-col">
                      {tRowItems[0] ? renderCard(tRowItems[0], baseIdx) : <div className="h-full" />}
                    </div>
                  </>
                )}
              </div>

              {!isLast && (
                <div className="flex items-center gap-2 my-1">
                  {isEven ? (
                    <>
                      <div className="flex-1" />
                      <div className="w-6 shrink-0" />
                      <div className="flex-1 flex justify-center">
                        <div className="flex items-center justify-center text-muted/60 dark:text-muted/70 py-1">
                          <ArrowDown size={16} strokeWidth={2} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 flex justify-center">
                        <div className="flex items-center justify-center text-muted/60 dark:text-muted/70 py-1">
                          <ArrowDown size={16} strokeWidth={2} />
                        </div>
                      </div>
                      <div className="w-6 shrink-0" />
                      <div className="flex-1" />
                    </>
                  )}
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* =========================================================================
          MOBILE VIEW (< sm: 1 column vertical flow)
         ========================================================================= */}
      <div className="flex sm:hidden flex-col gap-2">
        {flows.map((flow, idx) => {
          const isLast = idx === flows.length - 1
          return (
            <React.Fragment key={flow.key !== undefined ? flow.key : idx}>
              <div className="w-full">{renderCard(flow, idx)}</div>
              {!isLast && (
                <div className="flex justify-center text-muted/60 dark:text-muted/70 py-1">
                  <ArrowDown size={16} strokeWidth={2} />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </>
  )
}

/**
 * End-to-End Operational Flow Component for all FMCG Domains and Landing Pages.
 * Displays operational cycles connected with arrows (→, ↓, ←) matching the reference design in Image 2.
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
  const username = user?.display_name || user?.email?.split('@')[0] || 'User'

  // Selected step inside active detail
  const selectedStep = detail?.steps?.find((s) => s.node_key === selectedKey)

  return (
    <details
      className="mt-5 rounded-2xl border border-line bg-surface shadow-card overflow-hidden group"
      open
    >
      {/* =========================================================================
          ACCORDION HEADER: TITLE & PROGRESS COUNTER (MATCHING IMAGE 2)
         ========================================================================= */}
      <summary className="cursor-pointer px-5 py-4 text-sm sm:text-base font-bold text-ink flex items-center justify-between select-none hover:bg-surface2/60 transition list-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block shrink-0 shadow-xs" />
          <span className="text-brand flex items-center gap-2">
            <span>End-to-End Operational Cycles</span>
          </span>
          <span className="text-xs sm:text-sm text-muted font-normal hidden md:inline">
            — Click any cycle to trace and animate its path across the graph
          </span>
        </div>

        {activeKey !== null && activeKey !== undefined && (
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
          OPERATIONAL CYCLE CARDS CONNECTED WITH ARROWS (→, ↓, ←)
         ========================================================================= */}
      <div className="p-4 sm:p-5 pt-1 bg-surface">
        <SerpentineFlowGrid
          flows={flows}
          activeKey={activeKey}
          onToggle={onToggle}
          username={username}
        />
      </div>

      {/* =========================================================================
          ACTIVE FLOW STEP-BY-STEP CONNECTED PIPELINE
         ========================================================================= */}
      {activeKey !== null && activeKey !== undefined && (
        <div className="card m-4 sm:m-5 mt-2 p-4 border border-line bg-surface shadow-md animate-in fade-in duration-200">
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
                  <p className="mt-1 text-xs text-muted leading-relaxed font-sans">
                    {detail.narrative}
                  </p>
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
                    Complete Workflow Pipeline (Connected with →) — Click any step to inspect and focus on graph:
                  </span>
                </div>

                {/* Steps Pipeline with Connected Arrows */}
                <div className="flex flex-wrap items-center gap-y-3 p-1">
                  {detail.steps?.map((s, idx) => {
                    const isSelected = selectedKey === s.node_key
                    const isLastStep = idx === detail.steps.length - 1

                    return (
                      <div key={s.node_key || s.order || idx} className="flex items-center">
                        <button
                          type="button"
                          onClick={() => onStepSelect && onStepSelect(s.node_key)}
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
                            <ArrowRight
                              size={16}
                              strokeWidth={2.5}
                              className="text-brand animate-pulse"
                            />
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
                    {onStepSelect && (
                      <button
                        type="button"
                        onClick={() => onStepSelect(selectedStep.node_key)}
                        className="btn-outline btn-xs shrink-0 flex items-center gap-1 border-brand/40 text-brand hover:bg-brand/10"
                      >
                        Focus on Graph
                      </button>
                    )}
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
