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

  const [lastUploadedName, setLastUploadedName] = useState(() => {
    try {
      return (slug && typeof sessionStorage !== 'undefined' && sessionStorage.getItem(`afx_last_uploaded_${slug}`)) || ''
    } catch {
      return ''
    }
  })

  const [isFinalizedState, setIsFinalizedState] = useState(() => {
    try {
      return slug && typeof sessionStorage !== 'undefined' && sessionStorage.getItem(`afx_finalized_${slug}`) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const handleWorkflowState = (e) => {
      if (e?.detail?.slug === slug && typeof e.detail.isFinalized === 'boolean') {
        setIsFinalizedState(e.detail.isFinalized)
      }
    }
    window.addEventListener('afx-workflow-state', handleWorkflowState)
    return () => window.removeEventListener('afx-workflow-state', handleWorkflowState)
  }, [slug])

  const isFinalized = Boolean(wf.data?.finalized_version_number || isFinalizedState)

  // Synchronize stage & view params from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const stage = searchParams.get('stage')
    const view = searchParams.get('view')

    if (stage === 'kg2') {
      setIsKg2Active(true)
      setGapAnalysisMode(true)
    } else {
      setIsKg2Active(false)
      setGapAnalysisMode(false)
      if (slug && stage === 'kg1') {
        try {
          sessionStorage.removeItem(`afx_is_kg2_${slug}`)
        } catch {}
      }
    }
  }, [location.search, slug])

  const hasUploadedFiles = Boolean(
    (Array.isArray(uploadedFiles) && uploadedFiles.length > 0) ||
    lastUploadedName ||
    (slug && typeof sessionStorage !== 'undefined' && sessionStorage.getItem(`afx_last_uploaded_${slug}`))
  )

  const userChatCount = useMemo(() => {
    if (!snap?.messages) return 0
    return snap.messages.filter((m) => m.role === 'user').length
  }, [snap?.messages])
  const answeredCount = snap?.progress?.answered || 0
  const totalNuanceChats = Math.max(userChatCount, answeredCount)

  const canUpload = useMemo(() => {
    if (Boolean(hasUploadedFiles) || isKg2Active) return true
    return totalNuanceChats >= 3
  }, [hasUploadedFiles, isKg2Active, totalNuanceChats])

  useEffect(() => {
    if (slug) {
      try {
        if (canUpload) {
          sessionStorage.setItem(`afx_can_upload_${slug}`, 'true')
        } else {
          sessionStorage.removeItem(`afx_can_upload_${slug}`)
        }
      } catch {}
    }
  }, [canUpload, slug])

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

  const rawBase = aiGraph || g.data

  // Separate baseline template nodes from client-specific / chat nuances nodes
  const { templateNodes, chatNewNodes } = useMemo(() => {
    const tNodes = []
    const cNodes = []
    const rawList = rawBase?.nodes || []

    rawList.forEach((n) => {
      const isClientOrNew =
        n.role === 'client' ||
        n.group_key === 'client' ||
        n.group_name === 'Client-specific entities' ||
        n.origin === 'user' ||
        (n.added_in_version && n.added_in_version >= 2) ||
        n.change_state === 'added' ||
        String(n.id || n.key).startsWith('client-')

      if (isClientOrNew) {
        cNodes.push({
          ...n,
          isDiscrepancy: true,
          role: 'client',
        })
      } else {
        tNodes.push(n)
      }
    })

    return { templateNodes: tNodes, chatNewNodes: cNodes }
  }, [rawBase?.nodes])

  // When in Gap Analysis (KG2), dynamically generate newly introduced node(s) ONLY if file was uploaded
  const uploadedTelemetryNodes = useMemo(() => {
    if (!isKg2Active || !gapAnalysisMode) return []

    // ONLY if file was actually uploaded (either present in uploaded files list or uploaded in current session)
    const fileItems = uploadedFiles.length > 0
      ? uploadedFiles
      : lastUploadedName
        ? [{ id: 'telemetry-uploaded', name: lastUploadedName }]
        : []

    // If no file was uploaded, do NOT show any extra telemetry node or discrepancy!
    if (fileItems.length === 0) return []

    const existingNodes = [...templateNodes, ...chatNewNodes]
    const avgX = existingNodes.length > 0
      ? existingNodes.reduce((acc, n) => acc + (n.x || 450), 0) / existingNodes.length
      : 450
    const maxY = existingNodes.length > 0
      ? existingNodes.reduce((acc, n) => Math.max(acc, (n.y || 250)), 250)
      : 250

    return fileItems.map((f, idx) => {
      const cleanId = `data-file-${f.id || String(f.name || 'stream').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`
      const fName = f.name || f.original_name || 'Business_Telemetry.csv'
      const displayName = fName.startsWith('Data:') ? fName : `Data: ${fName}`

      return {
        id: cleanId,
        key: cleanId,
        name: displayName,
        kind: 'datasource',
        origin: 'telemetry',
        role: 'telemetry',
        change_state: 'added',
        isDiscrepancy: true,
        added_in_version: 2,
        group_name: 'Business Telemetry',
        group_key: 'telemetry',
        color: '#EF4444',
        attributes: f.metadata?.columns || f.metadata?.fields || [
          'ingested_records',
          'variance_delta',
          'batch_id',
          'timestamp',
        ],
        definition: `Refined business telemetry ingested from uploaded file “${fName}”. Discrepancy node newly introduced in KG2.`,
        x: avgX + (idx % 2 === 0 ? 110 : -110),
        y: maxY + 95 + idx * 55,
      }
    })
  }, [isKg2Active, gapAnalysisMode, uploadedFiles, lastUploadedName, templateNodes, chatNewNodes])

  // Edges connecting newly introduced telemetry nodes to matching baseline nodes
  const uploadedTelemetryEdges = useMemo(() => {
    if (!isKg2Active || !gapAnalysisMode || !uploadedTelemetryNodes.length || !templateNodes.length) return []

    return uploadedTelemetryNodes.map((tNode, idx) => {
      const targetNode = templateNodes[idx % templateNodes.length] || templateNodes[0]
      const tgtId = targetNode.key || targetNode.id
      return {
        id: `edge-${tNode.id}-${tgtId}`,
        source: tNode.id,
        target: tgtId,
        srcId: tNode.id,
        tgtId: tgtId,
        label: 'supplies telemetry',
        isDiscrepancy: true,
        kind: 'telemetry',
      }
    })
  }, [isKg2Active, gapAnalysisMode, uploadedTelemetryNodes, templateNodes])

  // Graph state:
  // - In KG1 (Discovery / Core Nuances chat): Baseline model template ONLY. Client-specific new entities are hidden.
  // - In KG2 (Business Telemetry / Gap Analysis): Merged graph showing baseline template + client entities from chat nuances + uploaded telemetry
  const base = useMemo(() => {
    if (!rawBase) return null
    if (!isKg2Active || !gapAnalysisMode) {
      const tKeys = new Set(templateNodes.map((n) => n.key || n.id))
      return {
        ...rawBase,
        version: { number: 1, label: 'KG1' },
        nodes: templateNodes,
        edges: (rawBase.edges || []).filter((e) => tKeys.has(e.source) && tKeys.has(e.target)),
      }
    }

    return {
      ...rawBase,
      version: { number: 2, label: 'KG2' },
      nodes: [...templateNodes, ...chatNewNodes, ...uploadedTelemetryNodes],
      edges: [...(rawBase.edges || []), ...uploadedTelemetryEdges],
    }
  }, [rawBase, isKg2Active, gapAnalysisMode, templateNodes, chatNewNodes, uploadedTelemetryNodes, uploadedTelemetryEdges])

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
    if (!isKg2Active || !gapAnalysisMode) {
      return { addedKeys: new Set(), missingKeys: new Set() }
    }

    const addedKeys = new Set(diffData?.nodes_added?.map((n) => n.key || n.id) || [])
    const missingKeys = new Set(diffData?.nodes_removed?.map((n) => n.key || n.id) || [])

    // 1. Newly introduced entities from KG1 chat nuances are discrepancies outside template (highlighted in RED)
    chatNewNodes.forEach((n) => {
      addedKeys.add(n.id)
      addedKeys.add(n.key)
    })

    // 2. Newly introduced node(s) from uploaded telemetry are discrepancies (highlighted in RED)
    uploadedTelemetryNodes.forEach((n) => {
      addedKeys.add(n.id)
      addedKeys.add(n.key)
    })

    base?.nodes?.forEach((n) => {
      const k = n.key || n.id
      if (
        n.kind === 'datasource' ||
        n.origin === 'telemetry' ||
        n.role === 'client' ||
        n.origin === 'user' ||
        n.group_key === 'client' ||
        n.group_name === 'Client-specific entities' ||
        n.isDiscrepancy
      ) {
        addedKeys.add(k)
      }
      if (n.isMissing) {
        missingKeys.add(k)
      }
    })

    // Protection: All standard template nodes remain NEUTRAL matching elements (never in addedKeys)
    templateNodes.forEach((n) => {
      const k = n.key || n.id
      addedKeys.delete(k)
    })

    return { addedKeys, missingKeys }
  }, [isKg2Active, gapAnalysisMode, diffData, chatNewNodes, uploadedTelemetryNodes, base?.nodes, templateNodes])

  const gapStats = useMemo(() => {
    const newCount = discrepancies.addedKeys.size
    const missingCount = discrepancies.missingKeys.size
    const totalGaps = newCount + missingCount
    const totalNodes = base?.nodes?.length || 0
    const matchedCount = Math.max(0, totalNodes - newCount - missingCount)
    return { newCount, missingCount, totalGaps, matchedCount }
  }, [discrepancies, base?.nodes?.length])

  // Persist reconciled graph with telemetry & discrepancy nodes to sessionStorage for Review and Digital Twin
  useEffect(() => {
    if (!slug || !base?.nodes?.length) return
    try {
      sessionStorage.setItem(
        `afx_reconciled_graph_${slug}`,
        JSON.stringify({
          nodes: base.nodes,
          edges: base.edges,
          discrepancyAddedKeys: Array.from(discrepancies.addedKeys || []),
          discrepancyMissingKeys: Array.from(discrepancies.missingKeys || []),
        })
      )
    } catch (err) {
      console.warn('Failed to persist reconciled graph to sessionStorage', err)
    }
  }, [slug, base, discrepancies])

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
      if (isKg2Active) {
        url.searchParams.set('stage', 'kg2')
      } else {
        url.searchParams.set('stage', 'kg1')
      }
    } else {
      url.searchParams.delete('view')
      if (isKg2Active) {
        url.searchParams.set('stage', 'kg2')
      } else {
        url.searchParams.set('stage', 'kg1')
      }
    }
    nav(`${location.pathname}?${url.searchParams.toString()}`, { replace: true })
    window.dispatchEvent(
      new CustomEvent('afx-workflow-state', {
        detail: { slug, activeLeftView: view, isKg2: isKg2Active },
      })
    )
  }

  const handleUploadComplete = async (fileName) => {
    const targetFileName = fileName || uploadedFiles[0]?.name
    if (!targetFileName) return
    const procId = 'proc-' + Date.now()

    setLastUploadedName(targetFileName)
    if (slug) {
      try {
        sessionStorage.setItem(`afx_last_uploaded_${slug}`, targetFileName)
      } catch {}
    }
    fileListAsync.reload().catch(() => {})

    // 1. Switch right tab to chat so user immediately sees the chat and activate witty processing copilot
    setActiveRightTab('chat')
    setIsProcessingFiles(true)
    setProcessingFileName(targetFileName)

    // 2. Add System Processing message to chat (with loader spinning)
    const procMsg = {
      id: procId,
      role: 'assistant',
      kind: 'system',
      content: `Reading and reconciling “${targetFileName}” against your operational template... Parsing columns, verifying data types, and checking mapping confidence.`,
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

      let fileDetail = null
      try {
        const fileListRes = await filesApi.list(slug).catch(() => null)
        const targetFile =
          fileListRes?.files?.find((f) => f.name === targetFileName || f.original_name === targetFileName) ||
          fileListRes?.files?.[0]
        if (targetFile?.id) {
          fileDetail = await filesApi.get(targetFile.id).catch(() => null)
        }
      } catch {}

      const unmatchedTerms = fileDetail?.mapping?.unmatched || []
      const convRes = await chat.get(slug).catch(() => null)
      const hasDoubt = Boolean(
        convRes?.open_question ||
        convRes?.messages?.some((m) => m.meta?.kind === 'csv_doubt') ||
        unmatchedTerms.length > 0
      )

      // Advance to KG2 (Gap Analysis stage)
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
      nav(`${location.pathname}?${url.searchParams.toString()}`, { replace: true })
      setActiveLeftView('graph')

      window.dispatchEvent(
        new CustomEvent('afx-workflow-state', {
          detail: { slug, activeLeftView: 'graph', isKg2: true, version: 2 },
        })
      )

      // Add Gap Analysis summary message dynamically computed from gapStats
      const mCount = gapStats.missingCount
      const nCount = Math.max(1, gapStats.newCount)
      const matchCount = Math.max(1, gapStats.matchedCount)

      if (hasDoubt) {
        // If LLM has doubts regarding unmapped columns / terms, ask clarification question in chat
        const unmappedList =
          unmatchedTerms.length > 0
            ? unmatchedTerms.slice(0, 3)
            : ['unmapped_telemetry_variance', 'custom_data_field']
        const doubtQuestionText = `I analyzed “${targetFileName}” and reconciled baseline entities into KG2. However, I have doubts regarding some unmapped telemetry fields:\n\n• ${unmappedList.join(
          ', '
        )}\n\nHow does your organization categorize these fields in your workflow? You can type your answer below to refine the mapping, or click 'Upload Extra Data' to upload an additional reference sheet.`

        const doubtMsg = {
          id: 'doubt-' + Date.now(),
          role: 'assistant',
          kind: 'question',
          content: doubtQuestionText,
          meta: {
            kind: 'file_doubt',
            file_name: targetFileName,
            unmapped: unmappedList,
          },
          created_at: new Date().toISOString(),
        }

        setSnap((s) => ({
          ...s,
          open_question: {
            text: `How does your organization categorize these unmapped fields from “${targetFileName}”? (${unmappedList.join(
              ', '
            )})`,
            kind: 'file_doubt',
            field_names: unmappedList,
          },
          messages: (s?.messages || [])
            .map((msg) =>
              msg.id === procId
                ? {
                    ...msg,
                    content: `System Processing Complete: “${targetFileName}” parsed. Discrepancies identified in Gap Analysis (KG2).`,
                    meta: { ...msg.meta, status: 'completed' },
                  }
                : msg
            )
            .concat(doubtMsg),
        }))
      } else {
        const gapAnalysisMsg = {
          id: 'gap-analysis-' + Date.now(),
          role: 'assistant',
          kind: 'gap_analysis',
          content: `Comparing uploaded data (“${targetFileName}”) with your operational conversation baseline (KG1).\n\n- Discrepancy (RED): ${nCount} newly introduced telemetry node(s) outside your template\n${
            mCount > 0 ? `- Missing Items (RED): ${mCount} missing element(s)\n` : ''
          }- Matched Elements (NEUTRAL): ${matchCount} verified entity(ies) from your chat\n\nThe extra node from your uploaded file is highlighted in RED on the graph, while all matching elements remain neutral. You can answer questions or click 'Upload Extra Data' anytime to add more files.`,
          created_at: new Date().toISOString(),
        }

        setSnap((s) => ({
          ...s,
          open_question: null,
          messages: (s?.messages || [])
            .map((msg) =>
              msg.id === procId
                ? {
                    ...msg,
                    content: `System Processing Complete: “${targetFileName}” parsed and reconciled with operational baseline.`,
                    meta: { ...msg.meta, status: 'completed' },
                  }
                : msg
            )
            .concat(gapAnalysisMsg),
        }))
      }
    }, 2000)
  }

  // Notify header ChevronTracker whenever graph version advances to KG2 or workflow state changes
  useEffect(() => {
    if (slug) {
      window.dispatchEvent(
        new CustomEvent('afx-workflow-state', {
          detail: {
            slug,
            isKg2: isKg2Active,
            activeLeftView,
            version: isKg2Active ? (base?.version?.number || 2) : 1,
            canUpload: Boolean(canUpload),
            hasUploadedFiles: Boolean(hasUploadedFiles),
            totalNuanceChats,
          },
        })
      )
    }
  }, [slug, isKg2Active, activeLeftView, base?.version?.number, canUpload, hasUploadedFiles, totalNuanceChats])

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

  return (
    <Layout wide>
      {/* Top Header Navigation: When a domain is selected */}
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

          {/* Sub-Domain section */}
          <button
            type="button"
            onClick={() => setActiveDomainFilter(domainKey)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-[13px] font-bold transition shadow-sm cursor-pointer ${
              activeDomainFilter === domainKey
                ? 'bg-[#10b981] text-white shadow-[#10b981]/25 ring-2 ring-[#10b981]/40'
                : 'border border-line bg-surface/90 text-ink/80 hover:bg-surface2 hover:border-brand/40'
            }`}
            title={`Focus on ${domain?.name || DOMMETA[domainKey]?.n || slug}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                activeDomainFilter === domainKey ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]' : 'bg-[#10b981]'
              }`}
            />
            <span>{domain?.name || DOMMETA[domainKey]?.n || slug}</span>
          </button>

          {/* FMCG Master-Data Spine: To the right of Sub-Domain section, left of AgentForgeX Generated */}
          <button
            type="button"
            onClick={() => setActiveDomainFilter(activeDomainFilter === 'spine' ? domainKey : 'spine')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-[13px] font-bold transition shadow-sm cursor-pointer ${
              activeDomainFilter === 'spine'
                ? 'bg-indigo-600 text-white shadow-indigo-600/25 ring-2 ring-indigo-600/40'
                : 'border border-line bg-surface/90 text-ink/80 hover:bg-surface2 hover:border-brand/40'
            }`}
            title="Toggle focus on Master-Data Spine"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                activeDomainFilter === 'spine' ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]' : 'bg-indigo-500'
              }`}
            />
            <span>{location.pathname.startsWith('/finance') ? 'Finance master-data spine' : 'FMCG master-data spine'}</span>
          </button>

          {/* AgentForgeX Generated badge */}
          {nodeCount > 0 && (
            <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold shadow-2xs">
              AgentForgeX Generated ({nodeCount} {nodeCount === 1 ? 'node' : 'nodes'})
            </span>
          )}

          {/* Red Gap Analysis button at the very end of the line - ONLY visible once a CSV or data file has been uploaded */}
          {hasUploadedFiles && (
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={() => {
                  setIsKg2Active(true)
                  setGapAnalysisMode(true)
                  setActiveLeftView('graph')
                  if (slug) {
                    try {
                      sessionStorage.setItem(`afx_is_kg2_${slug}`, 'true')
                    } catch {}
                  }
                  const url = new URL(window.location.href)
                  url.searchParams.set('stage', 'kg2')
                  url.searchParams.delete('view')
                  nav(`${location.pathname}?${url.searchParams.toString()}`, { replace: true })
                  window.dispatchEvent(
                    new CustomEvent('afx-workflow-state', {
                      detail: { slug, activeLeftView: 'graph', isKg2: true, version: 2 },
                    })
                  )
                }}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-1.5 text-xs sm:text-[13px] font-bold transition-all shadow-sm select-none ${
                  isKg2Active
                    ? 'bg-[#ef4444] text-white ring-2 ring-rose-400/50 shadow-rose-500/30'
                    : 'bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-rose-500/25 cursor-pointer active:scale-95'
                }`}
                title={isKg2Active ? 'Gap Analysis Active (KG2)' : 'Go to Gap Analysis (KG2)'}
              >
                <AlertTriangle size={15} strokeWidth={2.4} />
                <span>{isKg2Active ? 'Gap Analysis Active' : 'Gap Analysis'}</span>
              </button>
            </div>
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

      {/* Dedicated Data Gap Analysis Evolution Banner */}
      {isKg2Active && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface/80 p-3 sm:p-3.5 backdrop-blur shadow-2xs select-none animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444] inline-block animate-pulse" />
              Data Gap Analysis Evolution:
            </span>
            <span className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
              {gapStats.totalGaps} Gaps in RED ({gapStats.missingCount} Missing, {gapStats.newCount} New)
            </span>
            <span className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {gapStats.matchedCount} Matched
            </span>
          </div>
        </div>
      )}

      {/* Main Grid: Left Graph Canvas OR Multi-File Upload Zone | Right Chatbot */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_440px]">
        {activeLeftView === 'graph' ? (
          /* Knowledge Graph Dynamic Canvas */
          <div className="card relative h-[68vh] min-h-[460px] overflow-hidden p-0 border border-line">
            {/* Top-left canvas badge matching reference picture */}
            

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
                  <span className="rounded-full bg-white/25 dark:bg-black/20 px-1.5 py-0.2 text-[10px] font-bold text-white dark:text-black">
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
                isFinalized={isFinalized}
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
