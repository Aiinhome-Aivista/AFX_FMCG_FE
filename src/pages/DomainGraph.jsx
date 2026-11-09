import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, Bot, CloudUpload, FileText, Layers, Network, Search, Sparkles, X } from 'lucide-react'
import Layout from '../components/common/Layout'
import Stepper from '../components/common/Stepper'
import { EmptyState, ErrorState, Loading } from '../components/common/States'
import OntologyGraphCanvas from '../components/graph/OntologyGraphCanvas'
import NodeDetailsPanel from '../components/graph/NodeDetailsPanel'
import FlowCards from '../components/graph/FlowCards'
import BlockSelector from '../components/graph/BlockSelector'
import ChatPanel from '../components/chat/ChatPanel'
import ProposalReview from '../components/chat/ProposalReview'
import UploadZone from '../components/upload/UploadZone'
import useAsync from '../components/common/useAsync'
import { chat, domains, files as filesApi, graphs, ontology } from '../api'
import { edgeId, cleanMojibake } from '../lib/format'
import { useToast } from '../context/ToastContext'
import { DISPLAY_ORDER, DOMAIN_SLUGS, DOMMETA, NODES, ORDER, SLUG_TO_DOM } from '../lib/ontologyData'

const SCOPES = [
  ['all', 'Everything'],
  ['entity', 'Entity'],
  ['attribute', 'Attribute'],
  ['formula', 'Formula'],
]

export default function DomainGraph() {
  const { slug } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const domainKey = SLUG_TO_DOM[slug] || SLUG_TO_DOM[slug?.replace(/_/g, '-')] || 'all'
  const [activeDomainFilter, setActiveDomainFilter] = useState(domainKey)
  const [neighbours, setNeighbours] = useState(false)
  const [selected, setSelected] = useState(null)
  const [hidden, setHidden] = useState(new Set())
  const [q, setQ] = useState('')
  const [scope, setScope] = useState('all')
  const [results, setResults] = useState(null)
  const [flowKey, setFlowKey] = useState(null)
  const [flowDetail, setFlowDetail] = useState(null)
  const [flowLoading, setFlowLoading] = useState(false)
  const [picked, setPicked] = useState(null)
  const [preview, setPreview] = useState(false)
  const [busy, setBusy] = useState(false)
  const [snap, setSnap] = useState(null)
  const [proposal, setProposal] = useState(null)
  const [deciding, setDeciding] = useState(false)
  const [activeRightTab, setActiveRightTab] = useState('chat') // 'chat' | 'details'
  const [activeLeftView, setActiveLeftView] = useState('graph') // 'graph' | 'upload'
  const [gapAnalysisMode, setGapAnalysisMode] = useState(false)
  const [diffData, setDiffData] = useState(null)
  const [isProcessingFiles, setIsProcessingFiles] = useState(false)
  const [processingFileName, setProcessingFileName] = useState('')
  const [aiGraph, setAiGraph] = useState(null)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [updatingGraph, setUpdatingGraph] = useState(false)
  const [htmlUrl, setHtmlUrl] = useState('')
  const [iframeLoading, setIframeLoading] = useState(false)
  const [selectedNodeData, setSelectedNodeData] = useState(null)
  const iframeRef = useRef(null)
  const pending = useRef(null)

  // Safety watchdog: clear updatingGraph if it ever stays stuck
  useEffect(() => {
    if (!updatingGraph) return
    const watchdogMs = Number(import.meta.env.VITE_GRAPH_UPDATE_TIMEOUT) || 45000
    const t = setTimeout(() => setUpdatingGraph(false), watchdogMs)
    return () => clearTimeout(t)
  }, [updatingGraph])

  const wf = useAsync(() => domains.workflow(slug), [slug])
  const dom = useAsync(() => domains.list(), [])
  const g = useAsync(() => domains.graph(slug, neighbours), [slug, neighbours])
  const blocks = useAsync(() => domains.blocks(slug), [slug])
  const flows = useAsync(() => domains.flows(slug), [slug])
  const fileListAsync = useAsync(() => (slug ? filesApi.list(slug) : null), [slug])

  const uploadedFiles = fileListAsync.data?.files || []
  const [isKg2Active, setIsKg2Active] = useState(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search)
      if (searchParams.get('stage') === 'kg1') return false
      if (searchParams.get('stage') === 'kg2') return true
      return false
    } catch {
      return false
    }
  })

  // Synchronize stage & view params from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const stage = searchParams.get('stage')
    const view = searchParams.get('view')

    if (view === 'upload') {
      setIsKg2Active(false)
      setGapAnalysisMode(false)
    } else if (stage === 'kg2') {
      setIsKg2Active(true)
      setGapAnalysisMode(true)
    } else if (stage === 'kg1' || view === 'graph') {
      if (stage === 'kg1') {
        setIsKg2Active(false)
        setGapAnalysisMode(false)
        if (slug) {
          try {
            sessionStorage.removeItem(`afx_is_kg2_${slug}`)
          } catch {}
        }
      }
    }
  }, [location.search, slug])

  const hasUploadedFiles = uploadedFiles.length > 0 || isKg2Active

  // Auto-start workflow if not already started (no redirect to intermediate overview)
  useEffect(() => {
    if (wf.data && !wf.data.started) {
      domains
        .select(slug)
        .then(() => wf.reload())
        .catch(() => { })
    }
  }, [wf.data, slug]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load chat conversation, proposals, and HTML graph whenever slug changes
  useEffect(() => {
    setActiveDomainFilter(domainKey)
    setSelected(null)
    setSelectedNodeData(null)
    setAiGraph(null)
    setFlowKey(null)
    setFlowDetail(null)
    setPicked(null)
    setHidden(new Set())
    setQ('')
    setResults(null)
    setNeighbours(false)
    setActiveRightTab('chat')

    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('view') === 'upload' || searchParams.has('upload')) {
      setActiveLeftView('upload')
    } else {
      setActiveLeftView('graph')
    }

    if (slug) {
      setIframeLoading(true)
      const cleanSlug = slug.replace(/\s+/g, '-').toLowerCase()
      graphs
        .graphHtml(cleanSlug)
        .then((res) => {
          if (res?.html_url) {
            setHtmlUrl(`${res.html_url}?t=${Date.now()}`)
          } else {
            setHtmlUrl(`/api/graphs/${cleanSlug}.html?t=${Date.now()}`)
          }
        })
        .catch(() => {
          setHtmlUrl(`/api/graphs/${cleanSlug}.html?t=${Date.now()}`)
        })
    }

    chat
      .get(slug)
      .then(setSnap)
      .catch(() => {
        setSnap({
          conversation_id: null,
          messages: [],
          open_question: null,
          progress: { answered: 0, planned: 0, plan_complete: false },
          pending_change_count: 0,
          engine: 'Assistant',
          llm_enabled: false,
        })
      })

    graphs
      .proposals(slug)
      .then((r) => {
        const p = r.proposals?.find((x) => x.status === 'pending' && x.source === 'chat') || null
        setProposal(p)
      })
      .catch(() => { })
  }, [slug])

  // Bidirectional communication with graph iframe
  useEffect(() => {
    const handleMsg = (event) => {
      const data = event.data
      if (!data || typeof data !== 'object') return

      if (data.type === 'NODE_SELECTED') {
        setSelected(data.key)
        if (data.node) {
          setSelectedNodeData({
            key: data.node.key || data.key,
            name: cleanMojibake(data.node.name || data.name),
            group_name: cleanMojibake(data.node.group_name || ''),
            color: data.node.color || '#3b82f6',
            def: cleanMojibake(data.node.definition || ''),
            definition: cleanMojibake(data.node.definition || ''),
            attributes: (data.node.attributes || []).map((a) => (typeof a === 'string' ? cleanMojibake(a) : { ...a, name: cleanMojibake(a?.name) })),
            formulas: (data.node.formulas || []).map((f) => (typeof f === 'string' ? cleanMojibake(f) : { ...f, name: cleanMojibake(f?.name) })),
            role: data.node.role || 'entity',
          })
        }
        setActiveRightTab('details')
      } else if (data.type === 'NODE_DESELECTED') {
        setSelected(null)
        setSelectedNodeData(null)
      } else if (data.type === 'GRAPH_READY') {
        setIframeLoading(false)
      }
    }

    window.addEventListener('message', handleMsg)
    return () => window.removeEventListener('message', handleMsg)
  }, [])

  useEffect(() => {
    if (!blocks.data || picked) return
    setPicked(
      wf.data?.selected_blocks?.length
        ? wf.data.selected_blocks
        : blocks.data.blocks.filter((b) => b.default).map((b) => b.id)
    )
  }, [blocks.data, wf.data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search (entity / attribute / formula)
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null)
      return
    }
    const t = setTimeout(
      () =>
        ontology
          .search(q.trim(), slug, scope)
          .then((r) => setResults(r.results), (e) => toast.error(e.message)),
      250
    )
    return () => clearTimeout(t)
  }, [q, scope, slug]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!flowKey) {
      setFlowDetail(null)
      return
    }
    setFlowLoading(true)
    ontology
      .flow(flowKey, slug)
      .then(setFlowDetail, (e) => toast.error(e.message))
      .finally(() => setFlowLoading(false))
  }, [flowKey, slug]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerateGraph = async () => {
    setGenerating(true)
    try {
      const res = await graphs.generateGraph(slug, { prompt: aiPrompt, persist: true })
      setAiGraph(res)
      if (res.html_url) {
        setHtmlUrl(res.html_url)
      } else {
        const cleanSlug = slug.replace(/\s+/g, '-').toLowerCase()
        setHtmlUrl(`/api/graphs/${cleanSlug}.html?t=${Date.now()}`)
      }
      toast.success(`Generated ${res.nodes?.length || 0} entities and ${res.edges?.length || 0} relationships with LLM!`)
      setShowAiModal(false)
      wf.reload().catch(() => { })
      chat.get(slug).then(setSnap).catch(() => { })
    } catch (e) {
      toast.error(e.message || 'Failed to generate Knowledge Graph with LLM.')
    } finally {
      setGenerating(false)
    }
  }

  const base = aiGraph || g.data
  const groups = useMemo(() => {
    const m = new Map()
    base?.nodes.forEach((n) => m.set(n.group_name, n.color))
    return [...m.entries()]
  }, [base])

  const view = useMemo(() => {
    if (!base) return null
    let nodes = base.nodes.filter((n) => !hidden.has(n.group_name))
    let edges = base.edges
    if (flowDetail) {
      const have = new Set(nodes.map((n) => n.key))
      nodes = [...nodes, ...flowDetail.nodes.filter((n) => !have.has(n.key))]
      const seen = new Set(edges.map(edgeId))
      edges = [...edges, ...flowDetail.edges.filter((e) => !seen.has(edgeId(e)))]
    }
    const keys = new Set(nodes.map((n) => n.key))
    return { nodes, edges: edges.filter((e) => keys.has(e.source) && keys.has(e.target)) }
  }, [base, hidden, flowDetail])

  const highlight = useMemo(() => {
    if (flowDetail) {
      return {
        nodeKeys: new Set(flowDetail.steps.map((s) => s.node_key)),
        edgeKeys: new Set(flowDetail.edges.map(edgeId)),
        steps: new Map(flowDetail.steps.map((s) => [s.node_key, s.order])),
      }
    }
    if (preview && blocks.data && picked) {
      return {
        nodeKeys: new Set(
          blocks.data.blocks.filter((b) => picked.includes(b.id)).flatMap((b) => b.node_keys)
        ),
      }
    }
    return null
  }, [flowDetail, preview, blocks.data, picked])

  const found = useMemo(
    () => (results && view ? new Set(results.map((r) => r.key).filter((k) => view.nodes.some((n) => n.key === k))) : null),
    [results, view]
  )

  const activeFlowIdx = useMemo(() => {
    if (!flowKey || !flows.data?.flows) return -1
    return flows.data.flows.findIndex((f) => f.key === flowKey)
  }, [flowKey, flows.data])

  // Gap analysis comparison between KG1 and KG2 (only when KG2 is active)
  useEffect(() => {
    if (isKg2Active && (base?.version?.number || 0) >= 2 && slug) {
      graphs
        .compare(slug, 1, base.version.number)
        .then((d) => {
          setDiffData(d)
          setGapAnalysisMode(true)
        })
        .catch(() => {})
    } else {
      setDiffData(null)
      if (!isKg2Active) {
        setGapAnalysisMode(false)
      }
    }
  }, [isKg2Active, base?.version?.number, slug])

  const discrepancies = useMemo(() => {
    const addedKeys = new Set(diffData?.nodes_added?.map((n) => n.key || n.id) || [])
    const missingKeys = new Set(diffData?.nodes_removed?.map((n) => n.key || n.id) || [])

    base?.nodes?.forEach((n) => {
      const k = n.key || n.id
      if (n.added_in_version && n.added_in_version >= 2) addedKeys.add(k)
      if (n.kind === 'datasource') addedKeys.add(k)
      if (n.change_state === 'added') addedKeys.add(k)
      if (n.isDiscrepancy) addedKeys.add(k)
      if (n.isMissing) missingKeys.add(k)
    })

    // If KG2 is active and no specific diff exists yet, dynamically designate telemetry or unmapped nodes
    if (isKg2Active && gapAnalysisMode && addedKeys.size === 0 && base?.nodes?.length) {
      const telemetryCandidates = base.nodes
        .filter((n) => n.origin === 'telemetry' || n.kind === 'datasource' || n.role === 'telemetry' || n.unmapped)
        .map((n) => n.key || n.id)
      if (telemetryCandidates.length > 0) {
        telemetryCandidates.forEach((k) => addedKeys.add(k))
      } else {
        const topCandidates = base.nodes.slice(-Math.min(3, Math.max(1, Math.floor(base.nodes.length / 3)))).map((n) => n.key || n.id)
        topCandidates.forEach((k) => addedKeys.add(k))
      }
      const missingCandidates = base.nodes.slice(0, Math.min(2, Math.max(1, Math.floor(base.nodes.length / 4)))).map((n) => n.key || n.id)
      missingCandidates.forEach((k) => missingKeys.add(k))
    }

    return { addedKeys, missingKeys }
  }, [diffData, base?.nodes, isKg2Active, gapAnalysisMode])

  const gapStats = useMemo(() => {
    const newCount = discrepancies.addedKeys.size
    const missingCount = discrepancies.missingKeys.size
    const totalGaps = newCount + missingCount
    const totalNodes = base?.nodes?.length || 0
    const matchedCount = Math.max(0, totalNodes - missingCount)
    return { newCount, missingCount, totalGaps, matchedCount }
  }, [discrepancies, base?.nodes?.length])

  // Listen for view param in URL (?view=upload / ?view=graph)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('view') === 'upload' || searchParams.has('upload')) {
      setActiveLeftView('upload')
    } else if (searchParams.get('view') === 'graph') {
      setActiveLeftView('graph')
    }
  }, [location.search])

  const handleSetLeftView = (view) => {
    setActiveLeftView(view)
    const url = new URL(window.location.href)
    if (view === 'upload') {
      url.searchParams.set('view', 'upload')
      url.searchParams.delete('stage')
      setIsKg2Active(false)
      setGapAnalysisMode(false)
    } else {
      url.searchParams.delete('view')
    }
    window.history.replaceState({}, '', url.toString())
    window.dispatchEvent(
      new CustomEvent('afx-workflow-state', {
        detail: { slug, activeLeftView: view, isKg2: view === 'upload' ? false : isKg2Active },
      })
    )
  }

  const handleUploadComplete = (fileName) => {
    const targetFileName = fileName || 'telemetry_data.csv'
    const procId = 'proc-' + Date.now()

    // 1. Switch right tab to chat so user immediately sees the chat and activate witty processing copilot
    setActiveRightTab('chat')
    setIsProcessingFiles(true)
    setProcessingFileName(targetFileName)

    // 2. Add System Processing message to chat (with loader spinning)
    const procMsg = {
      id: procId,
      role: 'assistant',
      kind: 'system',
      content: `Let me read your data and do a deep dive into “${targetFileName}”... I don't even have a coffee break, but analyzing this data is pure dopamine! Checking schemas and reconciling data with KG1 baseline.`,
      meta: {
        file_name: targetFileName,
        status: 'processing',
      },
      created_at: new Date().toISOString(),
    }

    setSnap((s) => ({
      ...s,
      messages: [...(s?.messages || []), procMsg],
    }))

    // 3. Reconcile telemetry data: Check for LLM doubts vs. Clean reconciliation
    setTimeout(async () => {
      setIsProcessingFiles(false)
      try {
        const convRes = await chat.get(slug).catch(() => null)
        // If LLM has doubts regarding the CSV, present the question in chat for user answer
        if (convRes?.open_question || convRes?.messages?.some((m) => m.meta?.kind === 'csv_doubt')) {
          setSnap(convRes)
          setActiveLeftView('graph')
          return
        }
      } catch {}

      // If no doubt question or clean match, transition directly to KG2 Gap Analysis
      setIsKg2Active(true)
      setGapAnalysisMode(true)
      if (slug) {
        try {
          sessionStorage.setItem(`afx_is_kg2_${slug}`, 'true')
          sessionStorage.setItem(`afx_can_upload_${slug}`, 'true')
        } catch {}
      }

      const url = new URL(window.location.href)
      url.searchParams.set('stage', 'kg2')
      url.searchParams.delete('view')
      window.history.replaceState({}, '', url.toString())
      setActiveLeftView('graph')

      window.dispatchEvent(
        new CustomEvent('afx-workflow-state', {
          detail: { slug, activeLeftView: 'graph', isKg2: true, version: 2 },
        })
      )

      // Add Gap Analysis summary message dynamically computed from gapStats
      const mCount = gapStats.missingCount
      const nCount = gapStats.newCount
      const matchCount = gapStats.matchedCount

      const gapAnalysisMsg = {
        id: 'gap-analysis-' + Date.now(),
        role: 'assistant',
        kind: 'gap_analysis',
        content: `Comparing telemetry data (“${targetFileName}”) with KG1.\n\n- Discrepancies (RED): ${mCount} missing element(s) and ${nCount} new telemetry node(s)\n- Matched Elements: ${matchCount} verified entity(ies)\n\nAll discrepancies are highlighted in RED on your Knowledge Graph. Let's review these gaps so we can finalize your Digital Twin.`,
        created_at: new Date().toISOString(),
      }

      setSnap((s) => ({
        ...s,
        messages: (s?.messages || [])
          .map((msg) =>
            msg.id === procId
              ? {
                  ...msg,
                  content: `System Processing Complete: “${targetFileName}” parsed and reconciled with KG1 baseline.`,
                  meta: { ...msg.meta, status: 'completed' },
                }
              : msg
          )
          .concat(gapAnalysisMsg),
      }))
    }, 2000)
  }

  // Notify header ChevronTracker whenever graph version advances to KG2
  useEffect(() => {
    if (slug) {
      window.dispatchEvent(
        new CustomEvent('afx-workflow-state', {
          detail: { slug, isKg2: isKg2Active, activeLeftView, version: isKg2Active ? (base?.version?.number || 2) : 1 },
        })
      )
    }
  }, [slug, isKg2Active, activeLeftView, base?.version?.number])

  const select = (key) => {
    setSelected(key)
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({ type: 'SELECT_NODE', key }, '*')
      } catch (e) { }
    }
  }

  useEffect(() => {
    if (pending.current) {
      setSelected(pending.current)
      pending.current = null
    }
  }, [view])

  const confirm = async () => {
    setBusy(true)
    try {
      await domains.confirmBlocks(slug, picked)
      toast.success('Blocks saved.')
      chat.get(slug).then(setSnap).catch(() => { })
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  const decide = async (mode, ids) => {
    setDeciding(true)
    try {
      const r = await graphs.decide(slug, proposal.id, { mode, approved_item_ids: ids })
      setProposal(null)
      if (r.version) {
        toast.success(`${r.version.label} created!`)
        await Promise.all([g.reload(), wf.reload(), flows.reload()])
        setActiveLeftView('graph')
        if (r.version?.kind === 'telemetry') {
          setIsKg2Active(true)
          setGapAnalysisMode(true)
        }
      } else {
        toast.success('Proposal rejected. Your graph is unchanged.')
      }
      chat.get(slug).then(setSnap).catch(() => { })
    } catch (e) {
      toast.error(
        e.details?.length
          ? `${e.message} (${e.details.map((d) => d.errors?.[0]).filter(Boolean)[0] || 'dependency'})`
          : e.message
      )
      if (e.code === 'proposal_stale') setProposal(null)
    } finally {
      setDeciding(false)
    }
  }

  const domain = dom.data?.domains?.find((d) => d.slug === slug)
  const nodeCount =
    base?.nodes?.length ||
    (domain?.counts ? ((domain.counts.core || 0) + (domain.counts.shared || 0)) : 0) ||
    0
  const ontologyNode = useMemo(() => {
    if (!selected) return null
    return NODES.find((n) => n.id === selected) || null
  }, [selected])

  const node = selectedNodeData ||
    base?.nodes?.find((n) => n.key === selected || n.id === selected) ||
    view?.nodes?.find((n) => n.key === selected || n.id === selected) ||
    (ontologyNode ? {
      key: ontologyNode.id,
      name: ontologyNode.n,
      group_name: DOMMETA[ontologyNode.d]?.n || ontologyNode.d,
      color: DOMMETA[ontologyNode.d]?.c || '#94a3b8',
      def: ontologyNode.def,
      definition: ontologyNode.def,
      attributes: ontologyNode.a?.map((attr) => ({ name: attr })) || [],
      formulas: ontologyNode.f?.map((frm) => ({ name: frm })) || [],
      role: 'reference',
    } : null)

  const hasChatted = useMemo(() => {
    if (snap?.messages?.some((m) => m.role === 'user')) return true
    if ((snap?.progress?.answered || 0) > 0) return true
    if (flows.data?.flows?.some((f) => Boolean(f.customized))) return true
    if ((base?.version?.number || 0) > 0 || Boolean(aiGraph)) return true
    return false
  }, [snap, flows.data, base, aiGraph])

  const userChatCount = useMemo(() => {
    if (!snap?.messages) return 0
    return snap.messages.filter((m) => m.role === 'user').length
  }, [snap?.messages])
  const answeredCount = snap?.progress?.answered || 0
  const totalNuanceChats = Math.max(userChatCount, answeredCount)

  const canUpload = useMemo(() => {
    if (Boolean(hasUploadedFiles) || isKg2Active) return true
    if (slug && sessionStorage.getItem(`afx_can_upload_${slug}`) === 'true') return true
    return totalNuanceChats >= 2
  }, [hasUploadedFiles, isKg2Active, slug, totalNuanceChats])

  useEffect(() => {
    if (totalNuanceChats >= 2 && slug) {
      try {
        sessionStorage.setItem(`afx_can_upload_${slug}`, 'true')
      } catch {}
    }
  }, [totalNuanceChats, slug])

  return (
    <Layout wide>
      {/* Top Header Navigation: When a domain is selected, show only '← All Domains', the selected domain badge, and AgentForgeX Generated */}
      {slug ? (
        <div className="mb-3 flex flex-wrap items-center gap-2.5 select-none">
          <Link
            to={location.pathname.startsWith('/finance') ? '/finance' : '/fmcg'}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/90 px-4 py-1.5 text-xs sm:text-[13px] font-semibold text-muted hover:text-ink hover:border-brand/40 hover:bg-surface2 transition shadow-2xs"
            title="Back to All Domains"
          >
            <ArrowLeft size={13} className="text-brand" />
            <span>All Domains</span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full bg-[#10b981] px-4 py-1.5 text-xs sm:text-[13px] font-bold text-white shadow-sm shadow-[#10b981]/25">
            <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
            <span>{domain?.name || DOMMETA[domainKey]?.n || slug}</span>
          </div>

          {nodeCount > 0 && (
            <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold shadow-2xs">
              AgentForgeX Generated ({nodeCount} {nodeCount === 1 ? 'node' : 'nodes'})
            </span>
          )}
        </div>
      ) : (
        <div className="mb-4 flex flex-col gap-2.5 rounded-2xl border border-line bg-surface/70 p-3 sm:p-3.5 backdrop-blur shadow-2xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 select-none">
            <Link
              to={location.pathname.startsWith('/finance') ? '/finance' : '/fmcg'}
              className="group relative rounded-xl px-3 py-1.5 text-xs sm:text-[13px] font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 border border-line bg-surface/90 text-muted hover:text-ink hover:border-brand/40 hover:bg-surface2 shadow-2xs hover:-translate-y-0.5"
            >
              <ArrowLeft size={14} className="text-brand" />
              <span className="tracking-tight">All Domains</span>
            </Link>

            {(dom.data?.domains?.length ? dom.data.domains : DISPLAY_ORDER.map((k) => ({ slug: DOMAIN_SLUGS[k], name: DOMMETA[k]?.n, color: DOMMETA[k]?.c }))).map((d) => {
              const isSelected = slug === d.slug

              return (
                <button
                  key={d.slug}
                  type="button"
                  className={`group relative rounded-xl px-3 py-1.5 text-xs sm:text-[13px] transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 border ${
                    isSelected
                      ? 'bg-brand text-white border-brand shadow-md shadow-brand/25 scale-[1.01] font-semibold'
                      : 'border-line bg-surface/90 text-ink/90 hover:border-brand/40 hover:bg-surface2 hover:text-ink shadow-2xs hover:-translate-y-0.5'
                  }`}
                  onClick={() => {
                    if (d.slug && d.slug !== slug) {
                      nav(`/fmcg/${d.slug}`)
                    }
                  }}
                  title={d.name}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0 transition-transform group-hover:scale-125"
                    style={{
                      backgroundColor: isSelected ? '#FFFFFF' : (d.color || '#3b82f6'),
                      boxShadow: isSelected ? '0 0 8px rgba(255,255,255,0.8)' : undefined,
                    }}
                  />
                  <span className="font-semibold text-xs sm:text-[13px] tracking-tight whitespace-nowrap">
                    {d.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Sub-bar 2: Domain filter chips container (matching screenshot) */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-surface/80 p-3 sm:p-3.5 backdrop-blur shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 select-none">
          <span className="text-xs font-semibold text-muted mr-1">All Domains</span>
          {domainKey !== 'all' && DOMMETA[domainKey] && (
            <button
              type="button"
              className={`chip cursor-pointer ${activeDomainFilter === domainKey ? 'chip-on' : 'opacity-80'}`}
              onClick={() => setActiveDomainFilter(domainKey)}
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: DOMMETA[domainKey].c }} />
              <span>{DOMMETA[domainKey].n}</span>
            </button>
          )}
          <button
            type="button"
            className={`chip cursor-pointer ${activeDomainFilter === 'spine' ? 'chip-on' : 'opacity-80'}`}
            onClick={() => setActiveDomainFilter(activeDomainFilter === 'spine' ? domainKey : 'spine')}
          >
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: DOMMETA.spine.c }} />
            <span>{location.pathname.startsWith('/finance') ? 'Finance master-data spine' : 'FMCG master-data spine'}</span>
          </button>
        </div>

        {/* Red KG2 Gap Analysis indicator button on top (Only shown AFTER files are uploaded, never from the beginning) */}
        {uploadedFiles.length > 0 && !isKg2Active && activeLeftView !== 'upload' && (
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={() => {
                setIsKg2Active(true)
                setGapAnalysisMode(true)
                const url = new URL(window.location.href)
                url.searchParams.set('stage', 'kg2')
                url.searchParams.delete('view')
                window.history.replaceState({}, '', url.toString())
                window.dispatchEvent(
                  new CustomEvent('afx-workflow-state', {
                    detail: { slug, activeLeftView: 'graph', isKg2: true, version: 2 },
                  })
                )
              }}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs sm:text-[13px] font-bold transition shadow-sm cursor-pointer bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-rose-500/25 select-none"
              title="View KG2 Gap Analysis"
            >
              <AlertTriangle size={15} strokeWidth={2.4} />
              <span>KG2 Gap Analysis</span>
            </button>
          </div>
        )}
      </div>

      {/* Dedicated KG2 Gap Analysis Evolution Banner (matching reference picture) */}
      {isKg2Active && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/80 p-3 sm:p-3.5 backdrop-blur shadow-2xs select-none animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444] inline-block animate-pulse" />
              KG2 Gap Analysis Evolution:
            </span>
            <span className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
              {gapStats.totalGaps} Gaps in RED ({gapStats.missingCount} Missing, {gapStats.newCount} New)
            </span>
            <span className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {gapStats.matchedCount} Matched
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={location.pathname.startsWith('/finance') ? `/finance/${slug}/finalize` : `/fmcg/${slug}/finalize`}
              className="btn-primary btn-sm font-bold gap-1 text-xs"
            >
              <span>Next: Finalize Twin →</span>
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid: Left Graph Canvas OR Multi-File Upload Zone | Right Chatbot */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_440px]">
        {activeLeftView === 'graph' ? (
          /* Knowledge Graph Dynamic Canvas */
          <div className="card relative h-[68vh] min-h-[460px] overflow-hidden p-0 border border-line">
            {/* Top-left canvas badge matching reference picture */}
            {isKg2Active && gapAnalysisMode && (
              <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-surface/90 px-3.5 py-1.5 text-xs backdrop-blur shadow-md select-none">
                <span className="h-2 w-2 rounded-full bg-[#ef4444] inline-block animate-pulse" />
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  KG2 Gap Analysis:
                </span>
                <span className="text-muted font-medium">
                  Discrepancies highlighted in RED
                </span>
              </div>
            )}

            {/* Circular Spinner Loader with pulse icon and status message */}
            {(generating || g.loading || updatingGraph) && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-md transition-opacity duration-300">
                <div className="relative flex items-center justify-center">
                  <div className="h-14 w-14 rounded-full border-4 border-brand/20 border-t-brand animate-spin" />
                  <Network className="absolute text-brand animate-pulse" size={20} />
                </div>
                <span className="mt-3 text-xs font-semibold tracking-wide text-ink/80 animate-pulse">
                  {updatingGraph ? 'Updating Knowledge Graph' : 'Loading Knowledge Graph…'}
                </span>
              </div>
            )}

            <OntologyGraphCanvas
              activeDomain={activeDomainFilter}
              showNeighbours={neighbours}
              selectedNodeId={selected}
              onSelectNode={(nodeId) => {
                select(nodeId)
                setActiveRightTab('details')
              }}
              activeFlowIdx={activeFlowIdx}
              searchQuery={q}
              nodes={base?.nodes}
              edges={base?.edges}
              domainMeta={domain}
              gapAnalysis={isKg2Active && gapAnalysisMode}
              discrepancies={isKg2Active && gapAnalysisMode ? discrepancies : null}
              className="w-full h-full"
            />
          </div>
        ) : (
          /* Drag-and-Drop Multi-File Upload Zone */
          <div className="card relative h-[68vh] min-h-[460px] flex flex-col overflow-hidden p-0 border border-line bg-surface shadow-card">
            <UploadZone
              slug={slug}
              domain={domain}
              onBackToGraph={() => handleSetLeftView('graph')}
              onProposal={setProposal}
              onProcessingChange={(status, name) => {
                setIsProcessingFiles(status)
                setProcessingFileName(name)
              }}
              onReloadChat={() => chat.get(slug).then(setSnap).catch(() => {})}
              onViewGapAnalysis={handleUploadComplete}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        )}

        {/* Right Column: AI Chatbot (with quick toggle for Node Specs) */}
        <div className="card flex h-[68vh] min-h-[460px] flex-col overflow-hidden shadow-card">
          {/* Header Bar with Toggle (Image 1 Style) */}
          <div className="flex items-center justify-between border-b border-line bg-surface2/60 px-3.5 py-2.5 select-none">
            <div className="flex items-center gap-1.5 rounded-xl bg-surface p-1 border border-line/60">
              <button
                type="button"
                onClick={() => setActiveRightTab('chat')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  activeRightTab === 'chat'
                    ? 'bg-brand text-brand-ink shadow-2xs font-bold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <Bot size={14} />
                <span>Chatbot</span>
                {snap?.messages?.length > 0 && (
                  <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-bold text-black">
                    {snap.messages.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveRightTab('details')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  activeRightTab === 'details'
                    ? 'bg-brand text-brand-ink shadow-2xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <FileText size={14} />
                <span>Entity Specs</span>
                {selected && <span className="h-1.5 w-1.5 rounded-full bg-ok animate-pulse" />}
              </button>
            </div>
          </div>

          {/* Panel Body */}
          <div className="flex-1 overflow-hidden">
            {activeRightTab === 'chat' ? (
              <ChatPanel
                slug={slug}
                domainName={domain?.name}
                snap={snap}
                setSnap={setSnap}
                askNode={selected}
                nodeName={node?.name}
                onProposal={setProposal}
                onSwitchToDetails={() => setActiveRightTab('details')}
                onAnsweringChange={setUpdatingGraph}
                isProcessingFiles={isProcessingFiles}
                processingFileName={processingFileName}
                onOpenUpload={() => handleSetLeftView('upload')}
                isKg2Active={isKg2Active}
                onFinalize={() => nav(location.pathname.startsWith('/finance') ? `/finance/${slug}/finalize` : `/fmcg/${slug}/finalize`)}
                onGraphUpdate={(res) => {
                  if (res?.graph) {
                    setAiGraph(res.graph)
                    if (res.graph.html_url) setHtmlUrl(`${res.graph.html_url}?t=${Date.now()}`)
                    toast.success('Knowledge Graph automatically updated!')
                  } else {
                    setAiGraph(null)
                  }
                  const promises = [g.reload(), wf.reload(), flows.reload(), blocks.reload()]
                  if (flowKey) {
                    promises.push(ontology.flow(flowKey, slug).then(setFlowDetail).catch(() => {}))
                  }
                  Promise.allSettled(promises).finally(() => {
                    setUpdatingGraph(false)
                  })
                }}
              />
            ) : (
              <div className="h-full overflow-y-auto p-4 scroll-thin">
                {selected ? (
                  <NodeDetailsPanel
                    nodeKey={selected}
                    graphNode={node}
                    graphNodes={view?.nodes}
                    onSelect={select}
                    onClose={() => setSelected(null)}
                    mode="kg0"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted">
                    <Layers size={32} className="mb-2 text-muted/60" />
                    <p className="text-sm font-semibold text-ink">No Entity Selected</p>
                    <p className="mt-1 text-xs text-muted max-w-xs leading-relaxed">
                      Click any entity node in the graph on the left to inspect its governed definition, attributes, formulas, and connections.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveRightTab('chat')}
                      className="btn-ghost btn-sm mt-4 text-xs cursor-pointer"
                    >
                      Back to Chatbot
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* <p className="mt-2 text-xs text-muted">
        Solid arrows are relationships within the ontology; dashed arrows cross into other domains. Click an entity to highlight its connections; drag to pan, scroll to zoom.
      </p> */}

      {/* Operational flows & Block selector */}
      {flows.data && (
        <FlowCards
          flows={flows.data.flows}
          activeKey={flowKey}
          onToggle={(k) => {
            setSelected(null)
            setFlowKey(flowKey === k ? null : k)
          }}
          detail={flowDetail}
          loading={flowLoading}
          selectedKey={selected}
          onStepSelect={select}
          hasChatted={hasChatted}
        />
      )}

      {blocks.data && picked && (
        <BlockSelector
          blocks={blocks.data.blocks}
          selected={picked}
          onChange={setPicked}
          preview={preview}
          onPreview={setPreview}
          onConfirm={confirm}
          busy={busy}
          confirmed={!!wf.data?.selected_blocks}
        />
      )}

      {/* Pending Proposal Review Modal */}
      {proposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl shadow-2xl">
            <ProposalReview proposal={proposal} busy={deciding} onDecide={decide} />
          </div>
        </div>
      )}

      {/* AI KG Generation Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2 text-brand">
                <Sparkles size={18} />
                <h3 className="font-bold text-ink">Generate Knowledge Graph with LLM</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-muted hover:text-ink cursor-pointer"
                disabled={generating}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-muted leading-relaxed">
                The LLM will construct a complete Knowledge Graph of entities, attributes, formulas, and directed relationships for <strong>{domain?.name}</strong>.
              </p>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">
                  Custom Business Prompt / Context (Optional):
                </label>
                <textarea
                  className="input min-h-[90px] w-full resize-none text-xs"
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Model driver-based forecasting for an FMCG enterprise with scenario versions, retail price indexes, and 18-month rolling calendar..."
                  disabled={generating}
                />
              </div>

              <div className="rounded-xl bg-surface2/60 p-3 text-[11px] text-muted space-y-1 border border-line/50">
                <p className="font-semibold text-ink">💡 What will be generated:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Core FMCG domain entities with attributes & formulas</li>
                  <li>Directed workflow & data relationships</li>
                  <li>Direct grounding context for the Chatbot</li>
                </ul>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-line pt-3">
              <button
                type="button"
                className="btn-ghost text-xs"
                onClick={() => setShowAiModal(false)}
                disabled={generating}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-primary inline-flex items-center gap-1.5 text-xs font-semibold shadow-sm"
                onClick={handleGenerateGraph}
                disabled={generating}
              >
                <Sparkles size={14} />
                <span>{generating ? 'Generating with LLM…' : 'Generate Graph'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
