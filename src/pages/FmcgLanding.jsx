import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Database,
  ExternalLink,
  Layers,
  Network,
  RotateCcw,
  Sparkles,
  Workflow,
  FileText,
  Sliders,
  Compass,
  X,
} from 'lucide-react'
import Layout from '../components/common/Layout'
import { ErrorState, Loading } from '../components/common/States'
import useAsync from '../components/common/useAsync'
import { useTheme } from '../context/ThemeContext'
import { domains, ontology } from '../api'
import OntologyGraphCanvas from '../components/graph/OntologyGraphCanvas'
import { NarrativeFlow } from '../components/graph/FlowCards'
import {
  DOMMETA,
  ORDER,
  DISPLAY_ORDER,
  DOMAIN_SLUGS,
  SLUG_TO_DOM,
} from '../lib/ontologyData'

export default function FmcgLanding() {
  const nav = useNavigate()
  const canvasRef = useRef(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // State
  const [selectedDomain, setSelectedDomain] = useState('all') // 'all' or domain key
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [activeFlowIdx, setActiveFlowIdx] = useState(-1)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNeighbours, setShowNeighbours] = useState(true)
  const [canonModalOpen, setCanonModalOpen] = useState(false)

  // Fetch dynamic ontology graph & domain workflow states from backend if available
  const { data, loading, error, reload } = useAsync(() => ontology.overviewGraph(), [])
  const progress = data?.progress || {}

  // Dynamic nodes ONLY from backend API (strictly no hardcoded fallback)
  const activeNodes = useMemo(() => {
    return Array.isArray(data?.nodes) ? data.nodes : []
  }, [data])

  // Dynamic edges ONLY from backend API (strictly no hardcoded fallback)
  const activeEdges = useMemo(() => {
    return Array.isArray(data?.edges) ? data.edges : []
  }, [data])

  // Dynamic flows ONLY from backend API (strictly no hardcoded fallback)
  const activeFlows = useMemo(() => {
    const list = Array.isArray(data?.flows) ? data.flows : []
    return list.map((f) => ({
      ...f,
      t: f.t || f.title || f.key,
      title: f.title || f.t || f.key,
      ids: f.ids || f.steps || [],
      steps: f.steps || f.ids || [],
      x: f.x || f.narrative || '',
      narrative: f.narrative || f.x || '',
    }))
  }, [data])

  // Map API domain objects by code
  const apiDomainMap = useMemo(() => {
    const m = {}
    data?.domains?.forEach((d) => {
      m[d.code.toUpperCase()] = d
    })
    return m
  }, [data])

  // Lookup node by id (supports both id and key)
  const nodesById = useMemo(() => {
    const m = {}
    activeNodes.forEach((n) => {
      const id = n.id || n.key
      m[id] = n
      if (n.key && n.key !== id) m[n.key] = n
    })
    return m
  }, [activeNodes])

  // Selected node details
  const selectedNode = selectedNodeId ? nodesById[selectedNodeId] : null

  // Relationships & Joins for selected node
  const nodeRelationships = useMemo(() => {
    if (!selectedNodeId) return { all: [], joins: [] }
    const out = []
    const inc = []
    const joins = new Set()

    activeEdges.forEach((e) => {
      const src = Array.isArray(e) ? e[0] : (e.source || e.srcId || e.from)
      const tgt = Array.isArray(e) ? e[1] : (e.target || e.tgtId || e.to)
      const label = Array.isArray(e) ? e[2] : (e.label || '')

      if (src === selectedNodeId) {
        out.push({ otherId: tgt, otherName: nodesById[tgt]?.n || nodesById[tgt]?.name || tgt, label, dir: 'out' })
        joins.add(tgt)
      } else if (tgt === selectedNodeId) {
        inc.push({ otherId: src, otherName: nodesById[src]?.n || nodesById[src]?.name || src, label, dir: 'in' })
        joins.add(src)
      }
    })

    return {
      all: [...out, ...inc],
      joins: Array.from(joins).map((id) => ({ id, name: nodesById[id]?.n || nodesById[id]?.name || id })),
    }
  }, [selectedNodeId, activeEdges, nodesById])

  // Domain selection handler - navigate directly to domain copilot & workflow page (like Finance project)
  const handleDomainSelect = (dKey) => {
    if (dKey === 'all') {
      setSelectedDomain('all')
      setSelectedNodeId(null)
      setActiveFlowIdx(-1)
      return
    }
    const targetSlug = DOMAIN_SLUGS[dKey]
    if (targetSlug) {
      nav(`/fmcg/${targetSlug}`)
    }
  }

  // Open full domain workflow page
  const handleOpenDomainWorkflow = (dKey) => {
    const targetSlug = DOMAIN_SLUGS[dKey]
    if (targetSlug) {
      nav(`/fmcg/${targetSlug}`)
    }
  }

  // Toggle flow highlight handler
  const handleFlowToggle = (idx) => {
    setActiveFlowIdx((prev) => (prev === idx ? -1 : idx))
    setSelectedNodeId(null)
  }

  // Node selection & camera focus
  const handleSelectNode = (nodeId) => {
    setSelectedNodeId(nodeId)
    if (nodeId && canvasRef.current) {
      canvasRef.current.focusNode(nodeId)
    }
  }

  // Workflow progress helper
  const getDomainProgress = (dKey) => {
    const slug = DOMAIN_SLUGS[dKey]
    return slug ? progress[slug] : null
  }

  return (
    <Layout wide>
      {/* =========================================================================
          HERO & EXECUTIVE INTRO
         ========================================================================= */}
      <div className="relative mb-5 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface via-surface to-surface2 p-6 sm:p-8 shadow-card">
        {/* Ambient subtle glow background */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative z-10 max-w-5xl">


          {/* Main Title with high-contrast gradient */}
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-4xl">
            <span className="text-ink">FMCG </span>
            <span className="bg-gradient-to-r from-brand via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Ontology Knowledge Graph
            </span>
          </h1>

          {/* Subtext crafted to inspire and explain value clearly */}
          <p className="mt-2.5 text-xs sm:text-[14px] leading-relaxed text-muted max-w-4xl">
            An interactive multi-dimensional ontology mapping core FMCG operations across sales & distribution, trade promotions, marketing & consumer insights, supply chain, manufacturing, finance, and e-commerce to a unified master-data framework. Explore interconnected business entities, trace end-to-end value chains, understand typed relationships, or use the interactive assistant to customize your enterprise knowledge graph.
          </p>


        </div>
      </div>

      {/* =========================================================================
          DOMAIN TABS & TOOLBAR CONTROLS
         ========================================================================= */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-line bg-surface/70 p-3 sm:p-4 backdrop-blur shadow-2xs">
        {/* Domain Tabs Navigation */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 select-none">
          {/* All Domains Master Tab */}
          <button
            id="tab-all"
            type="button"
            className={`group relative rounded-xl px-3.5 py-2 text-xs sm:text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 border ${selectedDomain === 'all'
                ? 'bg-brand text-brand-ink border-brand shadow-md shadow-brand/25 scale-[1.01]'
                : 'border-line bg-surface/90 text-muted hover:text-ink hover:border-brand/40 hover:bg-surface2 shadow-2xs hover:-translate-y-0.5'
              }`}
            onClick={() => handleDomainSelect('all')}
          >
            <Compass size={15} className={selectedDomain === 'all' ? 'text-brand-ink' : 'text-brand'} />
            <span className="tracking-tight">All Domains</span>
          </button>

          {/* 9 Specific Domain Tabs with Colored Dots & Full Title */}
          {DISPLAY_ORDER.map((dKey) => {
            const meta = DOMMETA[dKey]
            const isSelected = selectedDomain === dKey

            return (
              <button
                id={`tab-${dKey}`}
                key={dKey}
                type="button"
                className={`group relative rounded-xl px-3.5 py-2 text-xs sm:text-[13px] transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 border ${isSelected
                    ? 'bg-brand text-brand-ink border-brand shadow-md shadow-brand/25 scale-[1.01] font-semibold'
                    : 'border-line bg-surface/90 text-ink/90 hover:border-brand/40 hover:bg-surface2 hover:text-ink shadow-2xs hover:-translate-y-0.5'
                  }`}
                onClick={() => handleDomainSelect(dKey)}
                title={meta.n}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0 transition-transform group-hover:scale-125"
                  style={{
                    backgroundColor: isSelected ? '#000000' : meta.c,
                    boxShadow: isSelected ? '0 0 6px rgba(0,0,0,0.5)' : undefined,
                  }}
                />
                <span className="font-semibold text-xs sm:text-[13px] tracking-tight whitespace-nowrap">
                  {meta.n.replace(/ \(.*/, '')}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* =========================================================================
          MAIN INTERACTIVE CANVAS (SVG ONTOLOGY GRAPH) & DETAILS PANEL
         ========================================================================= */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        {/* Left: SVG Canvas / Loader / Error */}
        <div className="flex-1 min-w-0 rounded-2xl border border-line bg-surface overflow-hidden relative min-h-[550px] h-[74vh] flex flex-col justify-center items-center shadow-card">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 p-8">
              <div className="relative flex items-center justify-center">
                <div className="h-14 w-14 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
                <Network className="absolute text-brand animate-pulse" size={20} />
              </div>
              <div className="text-center mt-2">
                <p className="text-sm font-semibold text-ink">Fetching FMCG Knowledge Graph...</p>
                <p className="text-xs text-muted mt-1">ontology nodes, edges and governance definitions</p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center gap-3 p-8 max-w-lg text-center">
              <div className="h-12 w-12 rounded-2xl bg-bad/10 text-bad flex items-center justify-center mb-1">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-base font-bold text-ink">Failed to Load Knowledge Graph</h3>
              <p className="text-xs text-muted leading-relaxed">
                {error?.message || String(error) || 'Could not connect to the backend database server.'}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={reload}
                  className="btn-primary btn-sm flex items-center gap-1.5 px-4 py-2 text-xs font-semibold shadow-sm"
                >
                  <RotateCcw size={13} />
                  <span>Retry Connection</span>
                </button>
              </div>
            </div>
          )}

          {!loading && !error && activeNodes.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-muted">
              <Database size={28} className="text-muted/60 mb-1" />
              <p className="text-sm font-semibold text-ink">No Graph Data Found</p>
              <p className="text-xs max-w-md">The backend did not return any ontology nodes or edges from the database.</p>
              <button onClick={reload} className="mt-2 btn-ghost btn-sm">Refresh</button>
            </div>
          )}

          {!loading && !error && activeNodes.length > 0 && (
            <OntologyGraphCanvas
              ref={canvasRef}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              activeDomain={selectedDomain}
              showNeighbours={showNeighbours}
              activeFlowIdx={activeFlowIdx}
              searchQuery={searchQuery}
              nodes={activeNodes}
              edges={activeEdges}
              flows={activeFlows}
              className="w-full h-full"
            />
          )}
        </div>

        {/* Right: Modern Side Details Panel */}
        <aside className="w-full lg:w-[380px] lg:flex-none rounded-2xl border border-line bg-surface p-5 shadow-card h-[74vh] min-h-[550px] overflow-y-auto scroll-thin flex flex-col">
          {!selectedNode ? (
            /* Empty State: Platform Overview & Value Chain Directory */
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 text-brand font-bold text-sm">
                <Network size={16} />
                <span>FMCG Architecture Overview</span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted">
                Click any entity on the graph to inspect its governed definition, verbatim attributes from client corpora,
                and typed cross-domain relationships.
              </p>

              <div className="mt-4 rounded-xl border border-line bg-surface2/60 p-3 text-xs leading-relaxed text-muted">
                <b className="text-ink">Central Master-Data Spine:</b>
                <p className="mt-1">
                  The 5 conformed dimensions sitting at the center: Product / SKU, CustomerOutlet, GeographyNode / Territory, TimePeriod, and OrganizationNode.
                </p>
              </div>

              {/* Domains List with Quick Filter / Direct Launch */}
              <div className="mt-5 pt-4 border-t border-line flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-3 flex items-center justify-between">
                  <span>FMCG Domains</span>
                  <span className="text-[10px] text-brand font-semibold">9 Domains</span>
                </div>

                <div className="space-y-2">
                  {DISPLAY_ORDER.map((dKey) => {
                    const meta = DOMMETA[dKey]
                    const slug = DOMAIN_SLUGS[dKey]
                    const isCurrent = selectedDomain === dKey

                    return (
                      <div
                        key={dKey}
                        className={`flex items-center justify-between rounded-xl p-2.5 text-xs transition border cursor-pointer ${isCurrent
                            ? 'border-brand bg-brand/5 shadow-sm'
                            : 'border-transparent hover:border-line hover:bg-surface2'
                          }`}
                        onClick={() => handleDomainSelect(dKey)}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: meta.c }}
                          />
                          <div className="truncate">
                            <span className="font-semibold text-ink truncate block">
                              {meta.n}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenDomainWorkflow(dKey)
                          }}
                          className="text-muted hover:text-brand p-1 rounded-md hover:bg-surface2 transition shrink-0"
                          title="Open domain copilot"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Selected Node State: Comprehensive Governed Entity Card */
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold leading-tight text-ink">
                    {selectedNode.n}
                  </h2>
                  <div
                    className="mt-1.5 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${DOMMETA[selectedNode.d]?.c}18`,
                      color: DOMMETA[selectedNode.d]?.c,
                      border: `1px solid ${DOMMETA[selectedNode.d]?.c}30`,
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: DOMMETA[selectedNode.d]?.c }}
                    />
                    <span>{DOMMETA[selectedNode.d]?.n}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="text-muted hover:text-ink shrink-0 p-1 rounded-lg hover:bg-surface2 transition"
                  title="Close panel"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Definition */}
              <div className="mt-3.5 text-xs leading-relaxed text-ink bg-surface2/50 border border-line rounded-xl p-3">
                {selectedNode.def}
              </div>

              {/* Direct Workflow Launch Button */}
              {selectedNode.d !== 'spine' && DOMAIN_SLUGS[selectedNode.d] && (
                <div className="mt-3.5">
                  <Link
                    to={`/fmcg/${DOMAIN_SLUGS[selectedNode.d]}`}
                    className="btn-primary btn-sm w-full flex items-center justify-center gap-2 text-xs font-semibold shadow-sm py-2"
                  >
                    <span>
                      Open {DOMMETA[selectedNode.d]?.short || DOMMETA[selectedNode.d]?.code} Domain
                    </span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              )}

              {/* Governed Attributes */}
              {selectedNode.a && selectedNode.a.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2 flex items-center justify-between">
                    <span>Governed Attributes</span>
                    <span className="font-mono text-[10px] text-brand">{selectedNode.a.length} fields</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNode.a.map((attr, i) => (
                      <span
                        key={i}
                        className="font-mono text-[11px] bg-surface2 border border-line rounded-lg px-2 py-0.5 text-ink leading-tight shadow-2xs"
                      >
                        {attr}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Semantic Relationships */}
              {nodeRelationships.all.length > 0 && (
                <div className="mt-4 pt-3 border-t border-line">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
                    Semantic Relationships ({nodeRelationships.all.length})
                  </h3>
                  <ul className="space-y-1.5 text-xs text-muted">
                    {nodeRelationships.all.map((rel, i) => (
                      <li
                        key={i}
                        className="rounded-lg p-2 bg-surface2/50 border border-line leading-relaxed flex flex-wrap items-center gap-1.5"
                      >
                        {rel.dir === 'out' ? (
                          <>
                            <b className="text-ink font-semibold">{selectedNode.n}</b>
                            <span className="text-[11px] font-semibold text-brand bg-brand/10 px-1.5 py-0.2 rounded border border-brand/20">
                              {rel.label}
                            </span>
                            <span className="text-muted">──▶</span>
                            <button
                              onClick={() => handleSelectNode(rel.otherId)}
                              className="text-brand hover:underline font-semibold"
                            >
                              {rel.otherName}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSelectNode(rel.otherId)}
                              className="text-brand hover:underline font-semibold"
                            >
                              {rel.otherName}
                            </button>
                            <span className="text-[11px] font-semibold text-brand bg-brand/10 px-1.5 py-0.2 rounded border border-brand/20">
                              {rel.label}
                            </span>
                            <span className="text-muted">──▶</span>
                            <b className="text-ink font-semibold">{selectedNode.n}</b>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Conformed Joins */}
              {nodeRelationships.joins.length > 0 && (
                <div className="mt-4 pt-3 border-t border-line">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
                    Conformed Joins ({nodeRelationships.joins.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {nodeRelationships.joins.map((jn) => (
                      <button
                        key={jn.id}
                        onClick={() => handleSelectNode(jn.id)}
                        className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-medium text-brand hover:border-brand hover:bg-brand/5 transition shadow-2xs"
                      >
                        {jn.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence & Corpus Citations */}
              {selectedNode.ev && (
                <div className="mt-4 pt-3 border-t border-line">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                    Corpus Evidence &amp; Governance
                  </h3>
                  <p className="text-[11.5px] italic text-muted leading-relaxed bg-surface2/40 p-2.5 rounded-xl border border-line">
                    “{selectedNode.ev}”
                  </p>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* =========================================================================
          END-TO-END OPERATIONAL CYCLES (BOTTOM SECTION)
         ========================================================================= */}
      {activeFlows.length > 0 && (
        <details className="mt-5 rounded-2xl border border-line bg-surface shadow-card overflow-hidden group" open>
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
            {activeFlowIdx >= 0 && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setActiveFlowIdx(-1)
                  setSelectedNodeId(null)
                }}
                className="text-xs font-semibold text-brand hover:underline px-2.5 py-1 rounded-md hover:bg-brand/10"
              >
                Clear Selection
              </button>
            )}
          </summary>

          {/* Operational Cycle Cards Connected with Arrows (→) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 sm:p-5 pt-0 bg-surface relative">
            {activeFlows.map((flow, idx) => {
              const isSelected = activeFlowIdx === idx
              const isRow1End = idx === 3
              const isLast = idx === activeFlows.length - 1

              return (
                <div key={idx} className="contents">
                  <div
                    onClick={() => handleFlowToggle(idx)}
                    className={`relative rounded-xl p-3.5 border transition cursor-pointer flex flex-col justify-between group/card ${
                      isSelected
                        ? 'border-brand bg-brand/10 shadow-md ring-2 ring-brand/30'
                        : 'border-line bg-surface2/40 hover:border-brand/40 hover:bg-surface2'
                    }`}
                  >
                    <div>
                      {/* Phase & Title Header */}
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border ${
                              isSelected
                                ? 'bg-brand text-brand-ink border-brand'
                                : 'bg-brand/10 text-brand border-brand/20'
                            }`}
                          >
                            Phase {String(idx + 1).padStart(2, '0')}
                          </span>
                          <b className={`text-xs font-bold truncate max-w-[140px] sm:max-w-[170px] ${isSelected ? 'text-brand' : 'text-ink'}`}>
                            {flow.t}
                          </b>
                        </div>
                        <span className="text-[10px] text-muted font-mono shrink-0">
                          {(flow.ids || []).length} steps
                        </span>
                      </div>

                      {/* Operational Narrative with highlighted bold arrows (→) */}
                      <NarrativeFlow text={flow.x || flow.narrative} />
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-line/50 flex items-center justify-between text-[11px]">
                      <span className={isSelected ? 'text-brand font-semibold' : 'text-muted'}>
                        {isSelected ? '● Highlighting path' : 'Click to trace on graph'}
                      </span>
                      <ArrowRight size={12} className={isSelected ? 'text-brand' : 'text-muted'} />
                    </div>

                    {/* Connecting Arrows between cards */}
                    {(idx === 0 || idx === 1 || idx === 2 || idx === 4 || idx === 5 || idx === 6) && (
                      <div className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 items-center justify-center rounded-full bg-surface border border-line shadow-sm pointer-events-none group-hover/card:scale-110 transition-transform">
                        <ArrowRight size={13} className="text-brand" strokeWidth={2.5} />
                      </div>
                    )}
                    {idx === 3 && (
                      <div className="hidden lg:flex absolute -bottom-3.5 right-6 z-20 h-7 w-7 items-center justify-center rounded-full bg-surface border border-line shadow-sm pointer-events-none group-hover/card:scale-110 transition-transform">
                        <ArrowDown size={13} className="text-brand" strokeWidth={2.5} />
                      </div>
                    )}

                    {/* Tablet Connecting Arrows */}
                    {(idx === 0 || idx === 2 || idx === 4 || idx === 6) && (
                      <div className="hidden sm:flex lg:hidden absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 items-center justify-center rounded-full bg-surface border border-line shadow-sm pointer-events-none">
                        <ArrowRight size={13} className="text-brand" strokeWidth={2.5} />
                      </div>
                    )}
                    {(idx === 1 || idx === 3 || idx === 5) && (
                      <div className="hidden sm:flex lg:hidden absolute -bottom-3.5 right-6 z-20 h-7 w-7 items-center justify-center rounded-full bg-surface border border-line shadow-sm pointer-events-none">
                        <ArrowDown size={13} className="text-brand" strokeWidth={2.5} />
                      </div>
                    )}

                    {/* Mobile Connecting Arrows */}
                    {!isLast && (
                      <div className="flex sm:hidden absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-20 h-7 w-7 items-center justify-center rounded-full bg-surface border border-line shadow-sm pointer-events-none">
                        <ArrowDown size={13} className="text-brand" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>

                  {/* Row 1 to Row 2 Transition Bridge */}
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
                </div>
              )
            })}
          </div>

          {/* Active Flow Connected Step Pipeline */}
          {activeFlowIdx >= 0 && activeFlows[activeFlowIdx] && (
            <div className="card m-4 sm:m-5 mt-0 p-4 border border-line bg-surface shadow-md animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-brand text-brand-ink text-xs font-bold font-mono">
                      Active Operational Cycle
                    </span>
                    <h3 className="text-base font-bold text-ink">{activeFlows[activeFlowIdx].t}</h3>
                    <span className="text-xs text-muted font-mono">
                      ({activeFlows[activeFlowIdx].ids?.length || 0} sequential operational steps)
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted leading-relaxed font-sans">
                    {activeFlows[activeFlowIdx].x || activeFlows[activeFlowIdx].narrative}
                  </p>
                </div>
                <button
                  className="btn-ghost btn-sm shrink-0 flex items-center gap-1 text-xs"
                  onClick={() => {
                    setActiveFlowIdx(-1)
                    setSelectedNodeId(null)
                  }}
                >
                  <X size={14} /> Clear Selection
                </button>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
                    Complete Workflow Pipeline (Connected with →) — Click any step to inspect and focus on canvas:
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-3 p-1">
                  {activeFlows[activeFlowIdx].ids?.map((nodeId, sIdx) => {
                    const node = nodesById[nodeId]
                    const isSelected = selectedNodeId === nodeId
                    const isLastStep = sIdx === activeFlows[activeFlowIdx].ids.length - 1

                    return (
                      <div key={nodeId || sIdx} className="flex items-center">
                        <button
                          type="button"
                          onClick={() => handleSelectNode(nodeId)}
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
                            {sIdx + 1}
                          </span>
                          <div className="min-w-0 pr-1">
                            <span className="block text-xs font-semibold text-ink group-hover:text-brand truncate max-w-[140px] sm:max-w-[190px]">
                              {node?.name || node?.label || nodeId}
                            </span>
                            <span className="block text-[10px] text-muted truncate max-w-[140px]">
                              {node?.d || node?.domain || 'Master Spine'}
                            </span>
                          </div>
                        </button>

                        {!isLastStep && (
                          <div className="flex items-center justify-center px-2 text-brand shrink-0 select-none">
                            <ArrowRight size={16} strokeWidth={2.5} className="text-brand animate-pulse" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </details>
      )}

      {/* =========================================================================
          REFERENCE CANON MODAL
         ========================================================================= */}
      {canonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-2xl">
            <button
              onClick={() => setCanonModalOpen(false)}
              className="absolute right-5 top-5 text-muted hover:text-ink p-1 rounded-lg hover:bg-surface2"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-2.5 text-brand font-bold text-lg mb-2">
              <FileText size={22} />
              <h2>FMCG Industry Reference Canon — ONTOLOGY.md</h2>
            </div>
            <p className="text-xs text-muted mb-5 leading-relaxed">
              Every entity class and typed relationship from FMCG ONTOLOGY.md v1.0, mined from the 3,609-document engagement corpus.
              It models the full Fast-Moving Consumer Goods enterprise across commercial, supply chain, manufacturing, innovation, and financial operations.
            </p>

            <div className="space-y-3.5 text-xs leading-relaxed text-ink">
              <div className="rounded-2xl border border-line p-4 bg-surface2/60">
                <b className="text-brand text-sm flex items-center gap-1.5">
                  <Database size={15} />
                  <span>The Master-Data Spine</span>
                </b>
                <p className="text-muted mt-1.5">
                  The central conformed dimensions that every domain keys on: Product / SKU (item roll-ups &amp; BOMs), CustomerOutlet (multi-layer trade counterparties),
                  GeographyNode / Territory (commercial geography &amp; beat hierarchies), TimePeriod (dual calendar &amp; campaign cycles), and OrganizationNode (roles, BUs &amp; responsibility centers).
                </p>
              </div>

              <div className="rounded-2xl border border-line p-4 bg-surface2/60">
                <b className="text-brand text-sm flex items-center gap-1.5">
                  <Layers size={15} />
                  <span>Nine Core Value Chain Domains</span>
                </b>
                <p className="text-muted mt-1.5">
                  Covering 01 Sales &amp; Distribution (RtM), 02 Trade, Promotions &amp; RGM, 03 Marketing &amp; Consumer,
                  04 Supply Chain &amp; Procurement, 05 Manufacturing &amp; Quality, 06 Innovation &amp; NPD, 07 Finance &amp; EPM,
                  08 E-commerce, D2C &amp; Strategy, and 09 Data &amp; Analytics Foundation.
                </p>
              </div>

              <div className="rounded-2xl border border-line p-4 bg-surface2/60">
                <b className="text-brand text-sm flex items-center gap-1.5">
                  <Workflow size={15} />
                  <span>Closed-Loop Operational Feedback</span>
                </b>
                <p className="text-muted mt-1.5">
                  Connects the field sales execution loop, trade promotion deduction &amp; claim settlement, econometric lift learning loops,
                  integrated S&amp;OP plan-make-move execution, stage-gate NPD rollouts, and gross-to-net financial reporting.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setCanonModalOpen(false)}
                className="btn-primary btn-sm px-5 py-2 font-semibold"
              >
                Close &amp; Return to Graph
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
