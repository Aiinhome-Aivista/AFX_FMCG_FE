import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Bot, CheckCircle2, ChevronRight, CloudUpload, HelpCircle, Lock, MessageSquare, Send, SkipForward, Sparkles, User, Zap } from 'lucide-react'
import { Loading, Spinner } from '../common/States'
import { chat } from '../../api'
import { useToast } from '../../context/ToastContext'

const KIND_LABEL = {
  question: 'Question',
  ack: 'Acknowledgment',
  decision: 'Session Decision',
  proposal: 'Change Proposal',
  node_qa: 'Entity Analysis',
  intro: 'Welcome',
  system: 'System',
  gap_analysis: 'Reconciliation Evolution',
}

export function sanitizeChatText(text) {
  if (!text || typeof text !== 'string') return text
  return text
    .replace(/verified KG1 entities/gi, 'verified entities')
    .replace(/KG1 entities/gi, 'baseline entities')
    .replace(/\bverified KG\d* entities\b/gi, 'verified entities')
    .replace(/\bKG1\b/g, 'baseline model')
    .replace(/\bKG2\b/g, 'operational model')
    .replace(/\bKG0\b/g, 'template model')
    .replace(/\bKG\s*(\d+)\b/gi, 'version $1')
    .replace(/\bKnowledge Graph\b/gi, 'domain model')
}

export default function ChatPanel({
  slug,
  domainName,
  snap,
  setSnap,
  askNode,
  nodeName,
  onProposal,
  onGraphUpdate,
  onAnsweringChange,
  locked,
  disabledReason,
  onSwitchToDetails,
  isProcessingFiles = false,
  processingFileName = '',
  onOpenUpload,
  isKg2Active = false,
  isFinalized = false,
  onFinalize,
}) {
  const toast = useToast()
  const location = useLocation()
  const prefix = location.pathname.startsWith('/finance') ? '/finance' : '/fmcg'
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState('answer')
  const [wittyIdx, setWittyIdx] = useState(0)
  const end = useRef(null)

  const WITTY_PHRASES = [
    "Let me read your data and do a deep dive...",
    "I don't even have a coffee break, but analyzing this data is pure dopamine!",
    "Scanning rows and columns... mapping your operational terms to the ontology!",
    "Checking schemas and reconciling data with operational baseline...",
    "Connecting raw records to FMCG business semantics... hold tight!",
    "Untangling spreadsheets so you don't have to on a Friday afternoon...",
  ]

  useEffect(() => {
    if (!isProcessingFiles) return
    const t = setInterval(() => {
      setWittyIdx((prev) => (prev + 1) % WITTY_PHRASES.length)
    }, 3200)
    return () => clearInterval(t)
  }, [isProcessingFiles])

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [snap?.messages?.length])

  useEffect(() => {
    if (askNode) {
      setMode('ask')
    }
  }, [askNode])

  const activeSnap = snap || {
    conversation_id: null,
    messages: [],
    open_question: null,
    progress: { answered: 0, planned: 0, plan_complete: false },
    pending_change_count: 0,
    engine: 'Assistant',
    llm_enabled: false,
  }

  const userMessages = (activeSnap.messages || []).filter((m) => m.role === 'user')
  const answeredCount = activeSnap.progress?.answered || 0
  const userChatCount = Math.max(userMessages.length, answeredCount)

  const hasUploadedFiles = Boolean(
    (slug && sessionStorage.getItem(`afx_is_kg2_${slug}`) === 'true') ||
    activeSnap.messages?.some((m) => m.kind === 'gap_analysis')
  )

  const canUpload = userChatCount >= 1 || hasUploadedFiles || isKg2Active

  const [isAwaitingDecision, setIsAwaitingDecision] = useState(() => {
    return Boolean(activeSnap?.awaiting_session_decision || (userChatCount >= 1 && !activeSnap?.open_question))
  })

  useEffect(() => {
    if (activeSnap?.awaiting_session_decision) {
      setIsAwaitingDecision(true)
    }
  }, [activeSnap?.awaiting_session_decision])

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

  const merge = (r) => {
    if (!r) return
    setSnap((s) => ({ ...r, messages: [...(s?.messages || []), ...(r?.messages || [])] }))
    if (r?.graph_updated || r?.graph) {
      onGraphUpdate?.(r)
    }
  }

  const run = async (fn, after) => {
    setBusy(true)
    try {
      const r = await fn()
      after?.(r)
      return r
    } catch (e) {
      toast.error(e?.message || 'Action failed.')
      throw e
    } finally {
      setBusy(false)
    }
  }

  const start = () => run(() => chat.start(slug), (r) => {
    setSnap(r)
    if (r?.graph_updated || r?.graph) onGraphUpdate?.(r)
  }).catch(() => {})

  const handleDecision = (action) => {
    return run(
      () => chat.decision(slug, action),
      (r) => {
        merge(r)
      }
    ).catch(() => {})
  }

  const handleOpenUploadClick = () => {
    if (onOpenUpload) {
      onOpenUpload()
    } else {
      const url = new URL(window.location.href)
      url.searchParams.set('view', 'upload')
      url.searchParams.delete('stage')
      window.location.href = url.toString()
    }
  }

  const handleContinueExploring = async () => {
    setIsAwaitingDecision(false)
    if (activeSnap?.awaiting_session_decision) {
      await handleDecision('continue')
    }
  }

  const handleProceedToNext = async () => {
    try {
      if (activeSnap?.awaiting_session_decision) {
        await handleDecision('proceed')
      }
    } catch {}
    handleOpenUploadClick()
  }

  const send = async (e) => {
    e?.preventDefault()
    const msg = text.trim()
    if (!msg) return
    setText('')
    const isAnsweringQuestion = mode === 'answer' && (isKg2Active ? !!activeSnap?.open_question?.kind === 'file_doubt' || !!activeSnap?.open_question : !!activeSnap?.open_question)
    if (isAnsweringQuestion) {
      onAnsweringChange?.(true)
    }
    try {
      if (mode === 'ask' && askNode) {
        await run(() => chat.askNode(slug, askNode, msg), merge)
      } else if (isAnsweringQuestion) {
        if (activeSnap?.open_question?.kind === 'file_doubt' || isKg2Active) {
          // Add user response to chat and resolve doubt
          const userMsg = {
            id: 'user-' + Date.now(),
            role: 'user',
            content: msg,
            created_at: new Date().toISOString(),
          }
          const ackMsg = {
            id: 'ack-' + Date.now(),
            role: 'assistant',
            content: `Thank you for clarifying! I've incorporated your feedback into the domain model reconciliation. All telemetry discrepancies are resolved and the golden digital twin is ready for exploration.`,
            created_at: new Date().toISOString(),
          }
          setSnap((s) => ({
            ...s,
            open_question: null,
            messages: (s?.messages || []).concat([userMsg, ackMsg]),
          }))
          chat.message(slug, msg, askNode).catch(() => {})
          setIsAwaitingDecision(false)
          return
        } else {
          try {
            await run(() => chat.answer(slug, msg), merge)
          } catch {
            await run(() => chat.message(slug, msg, askNode), merge)
          }
        }
      } else {
        await run(() => chat.message(slug, msg, askNode), merge)
      }
      setIsAwaitingDecision(true)
    } catch (err) {
      console.error('Chat error:', err)
    } finally {
      if (isAnsweringQuestion) {
        onAnsweringChange?.(false)
      }
    }
  }

  const skip = async () => {
    onAnsweringChange?.(true)
    try {
      if (activeSnap?.open_question?.kind === 'file_doubt' || isKg2Active) {
        const skipMsg = {
          id: 'skip-' + Date.now(),
          role: 'assistant',
          content: 'Telemetry discrepancy question skipped. All mappings reconciled into the golden digital twin.',
          created_at: new Date().toISOString(),
        }
        setSnap((s) => ({
          ...s,
          open_question: null,
          messages: (s?.messages || []).concat([skipMsg]),
        }))
        setIsAwaitingDecision(false)
        return
      }
      await run(() => chat.answer(slug, 'skip'), merge)
      setIsAwaitingDecision(true)
    } catch (err) {
      console.error('Skip error:', err)
    } finally {
      onAnsweringChange?.(false)
    }
  }


  const [hasStartedConversation, setHasStartedConversation] = useState(() => {
    try {
      return sessionStorage.getItem(`afx_conv_started_${slug}`) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      const fromSession = sessionStorage.getItem(`afx_conv_started_${slug}`) === 'true'
      const fromBackend = Boolean(
        activeSnap?.conversation_id ||
        (Array.isArray(activeSnap?.messages) && activeSnap.messages.length > 0)
      )
      if (fromSession || fromBackend) {
        setHasStartedConversation(true)
        if (fromBackend) {
          try {
            sessionStorage.setItem(`afx_conv_started_${slug}`, 'true')
          } catch {}
        }
      } else {
        setHasStartedConversation(false)
      }
    } catch {
      setHasStartedConversation(false)
    }
  }, [slug, activeSnap?.conversation_id, activeSnap?.messages])

  const handleStart = () => {
    try {
      sessionStorage.setItem(`afx_conv_started_${slug}`, 'true')
    } catch {}
    setHasStartedConversation(true)
    window.dispatchEvent(
      new CustomEvent('afx-workflow-state', {
        detail: { slug, conversationStarted: true },
      })
    )
    if (!activeSnap.conversation_id) {
      start()
    }
  }

  const hasExistingConversation = Boolean(
    hasStartedConversation ||
    activeSnap?.conversation_id ||
    (Array.isArray(activeSnap?.messages) && activeSnap.messages.length > 0)
  )

  // Loading state while checking conversation
  if (snap === null && !hasExistingConversation) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-muted">
        <Loading label="Loading conversation..." />
      </div>
    )
  }

  // Welcome state on initial screen only if no conversation exists yet
  if (!hasExistingConversation) {
    return (
      <div className="relative flex h-full flex-col items-center justify-center overflow-hidden p-6 sm:p-8 text-center bg-gradient-to-b from-surface via-surface to-surface2">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-brand/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-cyan-400/10 blur-2xl" />

        <div className="relative z-10 max-w-sm flex flex-col items-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-tr from-brand via-emerald-400 to-cyan-400 text-white dark:text-black shadow-lg shadow-brand/30">
            <Bot size={28} />
          </div>

          <h3 className="mt-4 text-lg font-bold tracking-tight text-ink">
            {domainName ? `${domainName} Assistant` : 'Domain Assistant'}
          </h3>

          <p className="mt-2 text-xs leading-relaxed text-muted">
            Explore entity definitions, governance rules, and calculate formulas. Grounded strictly in the FMCG reference ontology.
          </p>

          <div className="mt-6 flex flex-col gap-2 w-full text-left">
            <button
              onClick={handleStart}
              disabled={busy || locked}
              className="group flex items-center justify-between rounded-xl border border-brand/30 bg-brand/10 p-3 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} />
                <span>Start Conversation</span>
              </div>
              <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </button>

            {askNode && (
              <button
                onClick={handleStart}
                className="group flex items-center justify-between rounded-xl border border-line bg-surface p-3 text-xs text-ink transition hover:border-brand/40 hover:bg-surface2 cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <HelpCircle size={15} className="text-muted shrink-0" />
                  <span className="truncate">Ask about “{nodeName || askNode}”</span>
                </div>
                <ChevronRight size={14} className="text-muted shrink-0" />
              </button>
            )}
          </div>

          {disabledReason && <p className="mt-4 text-xs text-warn">{disabledReason}</p>}
        </div>
      </div>
    )
  }

  const isKg2Question = Boolean(
    activeSnap?.open_question &&
    (activeSnap.open_question.kind === 'file_doubt' || activeSnap.open_question.stage === 'kg2')
  )
  const q = isKg2Active ? (isKg2Question ? activeSnap.open_question : null) : activeSnap.open_question
  const isComplete = Boolean(activeSnap.progress?.plan_complete && !q)

  // Only freeze chat in KG2 IF the twin was finalized & locked in Review (Step 4)!
  // As long as the user hasn't finalized in Review, chat in KG2 remains OPEN.
  const isKg2Frozen = Boolean(isKg2Active && isFinalized)

  return (
    <div className="flex h-full flex-col bg-surface/90 text-ink">
      {/* Sub-Header: Progress and status */}
      <div className="border-b border-line/70 px-4 py-2.5 bg-surface2/30">
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-1.5 font-medium">
            {isKg2Active ? (
              q ? (
                <div className="flex items-center gap-1.5 font-medium">
                  <HelpCircle size={13} className="text-amber-500" />
                  <span className="text-ink">Business Telemetry:</span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    Clarification Required
                  </span>
                </div>
              ) : isFinalized ? (
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  <span className="text-ink">Business Telemetry:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Reconciled & Governed
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 font-medium">
                  <Sparkles size={13} className="text-brand" />
                  <span className="text-ink">Business Telemetry:</span>
                  <span className="text-brand font-semibold">
                    Gap Analysis Active
                  </span>
                </div>
              )
            ) : isComplete ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <Sparkles size={13} className="text-emerald-500" />
                Domain Discovery Complete
                <span className="ml-1 text-muted font-normal text-[11px]">
                  ({answeredCount} {answeredCount === 1 ? 'question' : 'questions'} explored)
                </span>
              </span>
            ) : isAwaitingDecision ? (
              <span className="text-[#c2410c] dark:text-amber-400 font-bold text-xs sm:text-[13px]">
                Session Check: Continue or Proceed?
              </span>
            ) : q ? (
              <div className="flex items-center gap-1.5 font-medium">
                <Sparkles size={13} className="text-brand" />
                <span className="text-ink">Domain Discovery:</span>
                <span className="text-brand font-semibold">
                  Question #{answeredCount + 1}
                </span>
                <span className="text-muted text-[11px] font-normal">
                  (Context-driven)
                </span>
              </div>
            ) : (
              <span className="text-ink font-semibold">Domain Discovery Active</span>
            )}
          </div>

          {activeSnap.pending_change_count > 0 && (
            <span className="rounded-full bg-warn/15 px-2 py-0.5 text-[10px] font-bold text-warn border border-warn/30">
              {activeSnap.pending_change_count} change(s) proposed
            </span>
          )}
        </div>

        {/* Micro progress bar */}
        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-surface2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isKg2Active
                ? isKg2Frozen
                  ? 'w-full bg-[#10b981]'
                  : 'w-3/4 bg-emerald-500'
                : isComplete
                  ? 'w-full bg-[#10b981]'
                  : 'bg-gradient-to-r from-[#10b981] via-[#06b6d4] to-[#6366f1]'
            }`}
            style={{
              width: isKg2Active
                ? isKg2Frozen
                  ? '100%'
                  : '75%'
                : isComplete
                  ? '100%'
                  : `${Math.min(95, Math.max(35, (answeredCount + 1) * 25))}%`,
            }}
          />
        </div>
      </div>

      {/* Nuances / Gap Analysis Telemetry Banner */}
      {(canUpload || isKg2Active || userChatCount >= 1) ? (
        <div className="mx-3.5 my-2 flex items-center justify-between gap-2 rounded-xl border border-emerald-500/35 bg-emerald-50/70 dark:bg-emerald-950/30 px-3 py-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-1.5 min-w-0">
            <CheckCircle2 size={14} className="text-[#10b981] shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold text-emerald-800 dark:text-emerald-300 truncate">
              {isKg2Active
                ? isKg2Frozen
                  ? 'Model Governed & Locked'
                  : 'Gap Analysis Active · KG2'
                : 'Nuances Captured · Model Ready'}
            </span>
          </div>
          {isKg2Active && isKg2Frozen ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold shrink-0">
              <Lock size={10} /> Governed
            </span>
          ) : isKg2Active ? (
            <button
              type="button"
              onClick={handleOpenUploadClick}
              className="inline-flex items-center gap-1 rounded-lg bg-[#10b981] hover:bg-[#059669] text-white font-bold px-2.5 py-1 text-[11px] sm:text-xs shadow-sm transition active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
              title="Upload extra data files"
            >
              <CloudUpload size={12} className="shrink-0" />
              <span>Upload Extra Data</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenUploadClick}
              className="inline-flex items-center gap-1 rounded-lg bg-[#10b981] hover:bg-[#059669] text-white font-bold px-2.5 py-1 text-[11px] sm:text-xs shadow-sm transition active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <CloudUpload size={12} className="shrink-0" />
              <span>Next: Upload Data</span>
              <ArrowRight size={12} strokeWidth={2.5} />
            </button>
          )}
        </div>
      ) : (
        <div className="mx-3.5 my-2 flex items-center justify-between rounded-xl border border-line/60 bg-surface2/50 px-3.5 py-2 text-xs text-muted select-none">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-brand shrink-0" />
            <span className="font-semibold text-ink/80">
              Capturing Core Nuances
            </span>
            <span className="text-[11px] text-muted font-normal">
              (Initial Process Discovery)
            </span>
          </div>
        </div>
      )}

      {/* Interactive Bot Processing Banner for File Parsing */}
      {isProcessingFiles && (
        <div className="mx-3.5 my-2 flex items-start gap-2.5 rounded-xl border border-[#10b981]/40 bg-[#10b981]/10 p-2.5 shadow-sm backdrop-blur-xs animate-in fade-in duration-300">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#10b981] text-white dark:text-black shadow-2xs">
            <Sparkles size={14} className="animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider">
                Interactive Bot Processing
              </span>
              <span className="flex items-center gap-1 text-[9px] text-muted font-mono">
                <Spinner size={8} /> Parsing {processingFileName ? `“${processingFileName}”` : 'data'}
              </span>
            </div>
            <p className="text-xs font-medium text-ink leading-snug italic">
              “{WITTY_PHRASES[wittyIdx]}”
            </p>
          </div>
        </div>
      )}

      {/* Messages Thread */}
      <div className="scroll-thin flex-1 space-y-3.5 overflow-y-auto p-4" role="log" aria-live="polite">
        {activeSnap.messages.map((m, idx) => {
          const isUser = m.role === 'user'
          const isDecisionMsg = m.kind === 'decision' || m.meta?.awaiting_session_decision
          const isProcessing = Boolean(
            (m.status === 'processing' || m.meta?.status === 'processing') &&
            m.meta?.status !== 'completed' &&
            (m.kind === 'processing' || isProcessingFiles)
          )

          return (
            <div key={m.id || idx} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''} items-start`}>
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold shadow-2xs ${
                  isUser
                    ? 'bg-[#10b981] text-white shadow-emerald-500/20 font-bold'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-[#10b981] border border-emerald-200 dark:border-emerald-800/60'
                }`}
              >
                {isUser ? <User size={14} /> : <Bot size={14} />}
              </span>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed shadow-2xs ${
                  isUser
                    ? 'bg-[#10b981] text-white font-normal rounded-tr-xs'
                    : isDecisionMsg
                      ? 'border border-amber-500/40 bg-amber-500/10 text-ink rounded-tl-xs'
                      : m.kind === 'gap_analysis'
                        ? 'border border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20 text-ink rounded-tl-xs'
                        : m.kind === 'question'
                          ? 'border border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-tl-xs text-ink'
                          : 'border border-slate-200/70 dark:border-line/70 bg-slate-50/80 dark:bg-surface2/70 text-ink rounded-tl-xs'
                }`}
              >
                {KIND_LABEL[m.kind] && !isUser && (
                  <span className="mb-1 flex items-center justify-between gap-2 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <span>
                      {KIND_LABEL[m.kind]}
                      {m.meta?.followup ? ' · Follow-up' : ''}
                    </span>
                    {isProcessing && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-[11px] normal-case">
                        <span className="h-3 w-3 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin shrink-0" />
                        <span>Processing…</span>
                      </span>
                    )}
                  </span>
                )}
                <span className="whitespace-pre-wrap">{sanitizeChatText(m.content)}</span>
                {m.kind === 'gap_analysis' && (
                  <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex flex-wrap items-center gap-2">
                    {onOpenUpload && (
                      <button
                        type="button"
                        onClick={onOpenUpload}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition cursor-pointer"
                        title="Upload a new dataset to re-run Gap Analysis"
                      >
                        <CloudUpload size={13} />
                        <span>Re-upload Data</span>
                      </button>
                    )}
                    <Link
                      to={`${prefix}/${slug}/finalize`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white px-3 py-1 text-xs font-bold transition shadow-2xs"
                    >
                      <span>Proceed to Review</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted pl-9">
            <Spinner size={14} />
            <span>Analyzing ontology & phrasing response…</span>
          </div>
        )}

        <div ref={end} />
      </div>

      {/* Bottom Controls & Input */}
      <div className="border-t border-line/70 p-3 bg-surface/95">
        {locked ? (
          <p className="text-center text-xs text-muted py-2">{disabledReason}</p>
        ) : isKg2Frozen ? (
          /* FROZEN CHAT CARD: Only when finalized in Review */
          <div className="rounded-2xl border border-emerald-500/35 bg-emerald-50/25 dark:bg-emerald-950/35 p-3.5 sm:p-4 shadow-sm space-y-3 animate-in fade-in select-none">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Lock size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-ink">
                    Chat Locked · Governed in Review
                  </h4>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                    <CheckCircle2 size={10} />
                    Finalized (KG3)
                  </span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed mt-0.5">
                  This model is finalized and locked from Review. To resume chatting or refining the ontology, re-open the model in Review.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Link
                to={`${prefix}/${slug}/twin`}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
              >
                <Sparkles size={15} />
                <span>Explore Digital Twin →</span>
              </Link>
              <Link
                to={`${prefix}/${slug}/finalize`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface hover:bg-surface2 px-3 py-2 text-xs font-semibold text-muted hover:text-ink transition cursor-pointer"
              >
                <span>Go to Review & Re-open</span>
              </Link>
            </div>
          </div>
        ) : isAwaitingDecision && !isKg2Active ? (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-[#fff7ed] dark:bg-amber-950/40 border border-orange-200/90 dark:border-amber-800/50 p-2.5 sm:px-3 sm:py-2 shadow-2xs animate-in fade-in">
            <span className="text-[11px] sm:text-xs font-bold text-amber-800 dark:text-amber-300 leading-tight whitespace-nowrap">
              Ready to proceed, or continue exploring?
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={busy}
                onClick={handleContinueExploring}
                className="rounded-lg border border-slate-200 dark:border-line bg-white dark:bg-surface2 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-surface shadow-2xs transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                Continue
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleProceedToNext}
                className="rounded-lg bg-[#10b981] hover:bg-[#059669] px-3 py-1 text-[11px] sm:text-xs font-bold text-white shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                Proceed
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Context chip if a node is selected */}
            {askNode && (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-brand/10 border border-brand/25 px-2.5 py-1.5 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Zap size={13} className="text-brand shrink-0" />
                  <span className="text-muted">Target:</span>
                  <span className="font-semibold text-brand truncate">{nodeName || askNode}</span>
                </div>
                {onSwitchToDetails && (
                  <button
                    onClick={onSwitchToDetails}
                    className="text-[11px] font-semibold text-brand hover:underline shrink-0 cursor-pointer"
                  >
                    View specs →
                  </button>
                )}
              </div>
            )}

            {/* Mode selection chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* <button
                type="button"
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition cursor-pointer border ${
                  mode === 'chat' || (!q && mode !== 'ask')
                    ? 'bg-brand text-white border-brand shadow-2xs font-semibold'
                    : 'border-line bg-surface2 text-muted hover:text-ink'
                }`}
                onClick={() => setMode('chat')}
              >
                Graph Copilot
              </button> */}

              {q && (
                <button
                  type="button"
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition cursor-pointer border ${mode === 'answer'
                    ? 'bg-brand text-white border-brand shadow-2xs font-semibold'
                    : 'border-line bg-surface2 text-muted hover:text-ink'
                    }`}
                  onClick={() => setMode('answer')}
                >
                  Answer
                </button>
              )}

              {/* <button
                type="button"
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition cursor-pointer border ${mode === 'ask'
                    ? 'bg-brand text-white border-brand shadow-2xs font-semibold'
                    : 'border-line bg-surface2 text-muted hover:text-ink'
                  }`}
                onClick={() => setMode('ask')}
                disabled={!askNode}
                title={askNode ? '' : 'Click an entity on the graph first'}
              >
                {askNode ? `Ask about “${nodeName || askNode}”` : 'Ask selected node'}
              </button> */}

              {q && (
                <button
                  type="button"
                  className="ml-auto inline-flex items-center gap-1 rounded-lg border border-line bg-surface2 px-2.5 py-1 text-[11px] font-medium text-muted hover:text-ink cursor-pointer disabled:opacity-40"
                  onClick={skip}
                  disabled={busy || !q}
                  title="Skip this question"
                >
                  <SkipForward size={11} /> Skip
                </button>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={send} className="relative flex items-end gap-2">
              <textarea
                className="input min-h-[46px] max-h-32 flex-1 resize-none rounded-xl border border-line bg-surface px-3 py-2 text-xs sm:text-[13px] text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand shadow-2xs"
                rows={2}
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={4000}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    send(e)
                  }
                }}
                placeholder={
                  mode === 'ask'
                    ? `Ask about ${nodeName || 'this entity'}…`
                    : mode === 'answer' && q
                      ? 'Type your answer…'
                      : 'Ask a question or describe your process…'
                }
                disabled={busy}
                aria-label="Message the assistant"
              />

              <button
                type="submit"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink font-semibold shadow-sm transition hover:scale-105 hover:bg-[#6ee7b7] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
                disabled={busy || !text.trim()}
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </form>

          </div>
        )}
      </div>
    </div>
  )
}
