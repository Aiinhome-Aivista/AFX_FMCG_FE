import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  FileSpreadsheet,
  FileText,
  FileUp,
  Layers,
  Network,
  RefreshCw,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { EmptyState, ErrorState, Loading, Spinner } from '../common/States'
import useAsync from '../common/useAsync'
import { files as filesApi } from '../../api'
import { bytes, timeAgo } from '../../lib/format'
import { useToast } from '../../context/ToastContext'

const ALLOWED = ['csv', 'xlsx', 'pdf', 'txt', 'docx', 'sql']
const MAX_MB = 25
const STATUS = {
  uploaded: ['Queued', 'bg-surface2 text-muted border-line'],
  processing: ['Processing', 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'],
  processed: ['Processed', 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'],
  failed: ['Failed', 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'],
}

function FilePreviewModal({ id, onClose }) {
  const { data: f, error, loading } = useAsync(() => filesApi.get(id), [id])
  const p = f?.preview

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="File preview"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl shadow-2xl border border-line bg-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-surface2/60 px-4 py-3 select-none">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={18} className="text-[#10b981] shrink-0" />
            <span className="truncate text-sm font-bold text-ink">{f?.name || 'File Preview'}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:text-ink hover:bg-surface transition cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="scroll-thin overflow-y-auto p-4 sm:p-6 text-xs sm:text-sm">
          {loading && <Loading />}
          {error && <ErrorState error={error} />}

          {f && (
            <div className="space-y-4">
              {f.status === 'failed' && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-600 dark:text-rose-400">
                  {f.error}
                </div>
              )}

              {/* Metadata chips */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl border border-line bg-surface2/50 p-2.5">
                  <span className="block text-[11px] text-muted">Format</span>
                  <span className="font-bold text-ink uppercase">{f.ext}</span>
                </div>
                <div className="rounded-xl border border-line bg-surface2/50 p-2.5">
                  <span className="block text-[11px] text-muted">File Size</span>
                  <span className="font-bold text-ink">{bytes(f.size_bytes)}</span>
                </div>
                <div className="rounded-xl border border-line bg-surface2/50 p-2.5">
                  <span className="block text-[11px] text-muted">Graph Version</span>
                  <span className="font-bold text-ink">{f.graph_version || 'KG1'}</span>
                </div>
                <div className="rounded-xl border border-line bg-surface2/50 p-2.5">
                  <span className="block text-[11px] text-muted">Status</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize">{f.status}</span>
                </div>
              </div>

              {/* Table Preview */}
              {p?.type === 'table' && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                    Tabular Data Extract ({p.rows?.length || 0} sample rows)
                  </h4>
                  <div className="scroll-thin max-h-72 overflow-x-auto rounded-xl border border-line">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface2 text-muted uppercase font-semibold">
                        <tr>
                          {p.columns?.map((c) => (
                            <th key={c} className="whitespace-nowrap px-3 py-2 border-b border-line">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {p.rows?.map((row, i) => (
                          <tr key={i} className="hover:bg-surface2/40 transition">
                            {row.map((cell, j) => (
                              <td key={j} className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-ink/90">
                                {cell ?? '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Text / Document Preview */}
              {p?.type === 'text' && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Parsed Document Text</h4>
                  <pre className="scroll-thin max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-line bg-surface2/60 p-3 text-xs font-mono leading-relaxed text-ink/90">
                    {p.text}
                  </pre>
                </div>
              )}

              {/* SQL Schema Preview */}
              {p?.type === 'sql' && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">SQL DDL & Schema Extract</h4>
                  {p.tables && (
                    <div className="mb-3 space-y-1.5">
                      {Object.entries(p.tables).map(([t, cols]) => (
                        <div key={t} className="rounded-lg border border-line bg-surface2/40 px-3 py-1.5 text-xs">
                          <b className="text-brand">{t}</b>: <span className="font-mono text-muted">{cols.join(', ') || '—'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <pre className="scroll-thin max-h-56 overflow-y-auto rounded-xl border border-line bg-surface2/60 p-3 text-xs font-mono text-ink/90">
                    {p.text}
                  </pre>
                </div>
              )}

              {/* Ontology Entity Mapping */}
              {f.mapping && (
                <div className="rounded-xl border border-[#10b981]/30 bg-[#10b981]/5 p-4">
                  <h4 className="text-xs font-bold text-[#10b981] mb-1">
                    Ontology Mapping ({f.mapping.stats?.matched_terms || 0}/{f.mapping.stats?.terms || 0} fields matched · {f.mapping.stats?.entities_touched || 0} entities grounded)
                  </h4>
                  {f.mapping.matches?.length > 0 && (
                    <ul className="scroll-thin max-h-48 overflow-y-auto space-y-1 text-xs mt-2 divide-y divide-line/40">
                      {f.mapping.matches.slice(0, 30).map((m, i) => (
                        <li key={i} className="pt-1 flex items-center justify-between gap-2">
                          <div>
                            <span className="font-mono text-ink font-semibold">{m.term}</span>
                            <span className="text-muted mx-1.5">→</span>
                            <b className="text-[#10b981]">{m.node_name}</b>
                            {m.attribute && <span className="text-muted ml-1">({m.attribute})</span>}
                          </div>
                          <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-muted border border-line">
                            {Math.round((m.confidence || 0) * 100)}% match
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function UploadZone({
  slug,
  domain,
  onBackToGraph,
  onProposal,
  onProcessingChange,
  onReloadChat,
  onUploadComplete,
  onViewGapAnalysis,
}) {
  const toast = useToast()
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)
  const [queue, setQueue] = useState([]) // in-flight: { id, name, pct, error }
  const [viewId, setViewId] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [lastUploadedName, setLastUploadedName] = useState('')

  // Fetch list of uploaded files for current domain
  const { data, loading, error, reload } = useAsync(() => filesApi.list(slug), [slug])

  const files = data?.files || []
  const isProcessing = queue.length > 0 || files.some((f) => f.status === 'uploaded' || f.status === 'processing')
  const processingFileName = queue[0]?.name || files.find((f) => f.status === 'processing')?.name || ''

  useEffect(() => {
    onProcessingChange?.(isProcessing, processingFileName)
  }, [isProcessing, processingFileName, onProcessingChange])

  // Polling while server is processing any file
  useEffect(() => {
    if (!isProcessing) return
    const t = setInterval(() => {
      reload().catch(() => {})
      onReloadChat?.()
    }, 1500)
    return () => clearInterval(t)
  }, [isProcessing, reload, onReloadChat])

  const hasFilesToAnalyze = files.length > 0 || Boolean(lastUploadedName)

  const handleTriggerGapAnalysis = () => {
    const targetFile = lastUploadedName || files[0]?.name || 'business_telemetry.pdf'
    if (onViewGapAnalysis) {
      onViewGapAnalysis(targetFile)
    } else if (onUploadComplete) {
      onUploadComplete(targetFile)
    }
  }

  const handleUpload = (fileList) => {
    const arr = Array.from(fileList || [])
    if (!arr.length) return

    arr.forEach(async (file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      const id = Math.random().toString(36).slice(2)

      if (!ALLOWED.includes(ext)) {
        toast.error(`${file.name}: unsupported format. Allowed: ${ALLOWED.join(', ').toUpperCase()}`)
        return
      }
      if (file.size > MAX_MB * 1048576) {
        toast.error(`${file.name}: exceeds maximum size limit of ${MAX_MB} MB.`)
        return
      }
      if (file.size === 0) {
        toast.error(`${file.name}: file is empty.`)
        return
      }

      setQueue((q) => [...q, { id, name: file.name, pct: 0 }])

      try {
        await filesApi.upload(slug, file, (pct) => {
          setQueue((q) => q.map((item) => (item.id === id ? { ...item, pct } : item)))
        })
        setQueue((q) => q.filter((item) => item.id !== id))
        setLastUploadedName(file.name)
        toast.success(`${file.name} uploaded! Click 'View Gap Analysis (KG2)' below to proceed.`)
        reload()
        onReloadChat?.()
      } catch (e) {
        setQueue((q) => q.map((item) => (item.id === id ? { ...item, error: e.message } : item)))
        toast.error(`Upload failed: ${e.message}`)
      }
    })
  }

  const handleDelete = async (file) => {
    try {
      await filesApi.remove(file.id)
      toast.success(`${file.name} deleted.`)
      reload()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleGenerateTelemetry = async () => {
    setGenerating(true)
    try {
      const res = await filesApi.generate(slug)
      if (res?.proposal) {
        onProposal?.(res.proposal)
        toast.success('Telemetry proposal generated from uploaded files!')
      }
      if (res?.files_unmapped?.length) {
        toast.push(`${res.files_unmapped.length} file(s) had no ontology matches.`)
      }
    } catch (e) {
      toast.error(e.message || 'Failed to generate telemetry graph.')
    } finally {
      setGenerating(false)
    }
  }

  const processedCount = files.filter((f) => f.status === 'processed').length

  return (
    <div className="flex h-full flex-col bg-surface overflow-hidden">
      {/* Top Banner / Navigation */}
      <div className="flex items-center justify-between border-b border-line bg-surface2/60 px-4 py-2.5 select-none shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToGraph}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:text-brand hover:border-brand/40 transition cursor-pointer shadow-2xs"
            title="Return to Knowledge Graph view"
          >
            <ArrowLeft size={13} />
            <span>Knowledge Graph</span>
          </button>
          <span className="text-muted text-xs">/</span>
          <span className="text-xs font-bold text-ink">Multi-File Upload Zone</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => reload()}
            className="rounded-lg p-1.5 text-muted hover:text-ink hover:bg-surface transition cursor-pointer"
            title="Refresh uploaded files"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Scrollable Body */}
      <div className="scroll-thin flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDrag(true)
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDrag(false)
            handleUpload(e.dataTransfer.files)
          }}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-200 ${
            drag
              ? 'border-[#10b981] bg-emerald-50/20 dark:bg-emerald-950/20 scale-[0.99]'
              : 'border-line/80 hover:border-[#10b981]/60 bg-surface2/30 hover:bg-surface2/60'
          }`}
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#10b981]/15 text-[#10b981] shadow-2xs mb-2">
            <UploadCloud size={24} strokeWidth={2.2} />
          </div>

          <h3 className="text-sm font-bold text-ink">Drag & drop files to enrich your Knowledge Graph</h3>
          <p className="mt-1 text-xs text-muted max-w-md">
            Upload CSV/XLSX spreadsheets, policy PDFs, text docs, or SQL dumps to discover data nuances and map telemetry onto KG1.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-black font-bold px-4 py-2 text-xs shadow-sm transition active:scale-95 cursor-pointer"
            >
              <FileUp size={15} />
              <span>Browse Files</span>
            </button>
          </div>

          <p className="mt-2 text-[11px] text-muted font-mono">
            Accepted: {ALLOWED.map((e) => `.${e}`).join(', ')} · Max {MAX_MB} MB each
          </p>

          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            accept={ALLOWED.map((e) => `.${e}`).join(',')}
            onChange={(e) => {
              handleUpload(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        {/* View Gap Analysis (KG2) Button - Placed under the Upload Area (Image & User Request) */}
        <div className="flex flex-col items-center justify-center pt-2 pb-2 gap-1.5 select-none">
          <button
            type="button"
            disabled={!hasFilesToAnalyze}
            onClick={handleTriggerGapAnalysis}
            className={`inline-flex items-center gap-2.5 rounded-full px-7 py-3 text-xs sm:text-sm font-extrabold shadow-lg transition-all duration-200 cursor-pointer ${
              hasFilesToAnalyze
                ? 'bg-[#10b981] hover:bg-[#059669] text-black shadow-[#10b981]/30 hover:scale-[1.02] active:scale-95'
                : 'bg-surface2 text-muted border border-line cursor-not-allowed opacity-50'
            }`}
            title={hasFilesToAnalyze ? 'View Gap Analysis and transition to KG2' : 'Upload telemetry files first to view Gap Analysis'}
          >
            <span>View Gap Analysis (KG2)</span>
            <ArrowRight size={16} strokeWidth={2.6} />
          </button>
          <span className="text-[11px] text-muted">
            {hasFilesToAnalyze
              ? 'Click to merge uploaded data and view KG2 Gap Analysis'
              : 'Upload telemetry files above to view Gap Analysis'}
          </span>
        </div>

        {/* Upload Queue Progress */}
        {queue.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Uploading ({queue.length})</h4>
            <div className="space-y-2">
              {queue.map((item) => (
                <div key={item.id} className="rounded-xl border border-line bg-surface p-3 text-xs shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold truncate max-w-[70%] text-ink">{item.name}</span>
                    {item.error ? (
                      <button
                        onClick={() => setQueue((q) => q.filter((x) => x.id !== item.id))}
                        className="text-rose-500 font-semibold underline text-[11px] cursor-pointer"
                      >
                        Dismiss
                      </button>
                    ) : (
                      <span className="font-mono text-muted text-[11px]">{item.pct}%</span>
                    )}
                  </div>

                  {item.error ? (
                    <p className="text-rose-500 text-[11px]">{item.error}</p>
                  ) : (
                    <div className="h-1.5 w-full rounded-full bg-surface2 overflow-hidden">
                      <div
                        className="h-full bg-[#10b981] transition-all duration-300"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Files Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Uploaded Files ({files.length})
              </h4>
              {processedCount > 0 && (
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {processedCount} Processed
                </span>
              )}
            </div>

            {processedCount > 0 && (
              <button
                type="button"
                disabled={generating}
                onClick={handleGenerateTelemetry}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#10b981] to-teal-600 text-black font-bold px-3 py-1.5 text-xs shadow-sm transition hover:opacity-95 active:scale-95 cursor-pointer disabled:opacity-50"
                title="Synthesize telemetry mappings to create KG2"
              >
                {generating ? <Spinner size={13} /> : <Sparkles size={13} />}
                <span>Generate Telemetry Graph (KG2)</span>
              </button>
            )}
          </div>

          {loading && !files.length && <Loading />}
          {error && <ErrorState error={error} />}

          {!loading && !files.length && (
            <div className="rounded-2xl border border-line bg-surface2/20 p-6 text-center">
              <p className="text-xs text-muted">No files uploaded yet. Drag and drop your telemetry files above.</p>
            </div>
          )}

          {files.length > 0 && (
            <div className="divide-y divide-line rounded-2xl border border-line bg-surface overflow-hidden shadow-2xs">
              {files.map((f) => {
                const statusMeta = STATUS[f.status] || STATUS.uploaded
                const isSpreadsheet = ['csv', 'xlsx'].includes(f.ext)
                const isSql = f.ext === 'sql'

                return (
                  <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 hover:bg-surface2/40 transition">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface2 text-muted border border-line">
                        {isSpreadsheet ? (
                          <FileSpreadsheet size={18} className="text-emerald-600 dark:text-emerald-400" />
                        ) : isSql ? (
                          <Database size={18} className="text-indigo-500" />
                        ) : (
                          <FileText size={18} className="text-blue-500" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-xs sm:text-[13px] font-bold text-ink" title={f.name}>
                          {f.name}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
                          <span className="uppercase font-semibold text-ink/80">{f.ext}</span>
                          <span>•</span>
                          <span>{bytes(f.size_bytes)}</span>
                          <span>•</span>
                          <span>{timeAgo(f.created_at)}</span>
                          {f.mapping?.stats?.entities_touched > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-[#10b981] font-semibold">
                                {f.mapping.stats.entities_touched} entities mapped
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusMeta[1]}`}>
                        {f.status === 'processing' && <Spinner size={10} />}
                        {f.status === 'processed' && <CheckCircle2 size={10} />}
                        <span>{statusMeta[0]}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setViewId(f.id)}
                        className="rounded-lg p-1.5 text-muted hover:text-ink hover:bg-surface2 transition cursor-pointer"
                        title="Preview file extract and mapping"
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(f)}
                        className="rounded-lg p-1.5 text-muted hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* File Preview Modal */}
      {viewId && <FilePreviewModal id={viewId} onClose={() => setViewId(null)} />}
    </div>
  )
}
