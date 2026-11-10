import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Bot, CheckCircle2, ChevronRight, CloudUpload, HelpCircle, MessageSquare, Send, SkipForward, Sparkles, User, Zap } from 'lucide-react'
import { Spinner } from '../common/States'
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

  const canUpload = userChatCount >= 3 || hasUploadedFiles || isKg2Active

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
    run(
      () => chat.decision(slug, action),
      (r) => {
        merge(r)
      }
    ).catch(() => {})
  }

  const send = async (e) => {
    e?.preventDefault()
    const msg = text.trim()
    if (!msg) return
    setText('')
    const isAnsweringQuestion = mode === 'answer' && !!activeSnap?.open_question
    if (isAnsweringQuestion) {
      onAnsweringChange?.(true)
    }
    try {
      if (mode === 'ask' && askNode) {
        await run(() => chat.askNode(slug, askNode, msg), merge)
      } else if (isAnsweringQuestion) {
        await run(() => chat.answer(slug, msg), merge)
      } else {
        await run(() => chat.message(slug, msg, askNode), merge)
      }
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
      await run(() => chat.answer(slug, 'skip'), merge)
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
      setHasStartedConversation(sessionStorage.getItem(`afx_conv_started_${slug}`) === 'true')
    } catch {
      setHasStartedConversation(false)
    }
  }, [slug])

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

  // Welcome state on initial screen before user starts a conversation
  if (!hasStartedConversation || !activeSnap.conversation_id) {
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

  const q = activeSnap.open_question
  const isComplete = Boolean(activeSnap.progress?.plan_complete && !q)

  return (
    <div className="flex h-full flex-col bg-surface/90 text-ink">
      {/* Sub-Header: Progress and status */}
      <div className="border-b border-line/70 px-4 py-2.5 bg-surface2/30">
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles size={13} className={isComplete ? 'text-emerald-500' : 'text-brand'} />
            {isComplete ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Domain Discovery Complete
                <span className="ml-1 text-muted font-normal text-[11px]">
                  ({answeredCount} {answeredCount === 1 ? 'question' : 'questions'} explored)
                </span>
              </span>
            ) : activeSnap.awaiting_session_decision ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                Session Check: Continue or Proceed?
              </span>
            ) : q ? (
              <>
                <span className="text-ink">Domain Discovery:</span>
                <span className="text-brand font-semibold">
                  Question #{answeredCount + 1}
                </span>
                <span className="text-muted text-[11px] font-normal">
                  (Context-driven)
                </span>
              </>
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
        <div className="mt-2 h-1.5 w-full rounded-full bg-surface2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isComplete
                ? 'w-full bg-emerald-500'
                : 'bg-gradient-to-r from-brand to-cyan-400'
            }`}
            style={{ width: isComplete ? '100%' : `${Math.min(95, Math.max(20, (answeredCount + 1) * 20))}%` }}
          />
        </div>
      </div>

      {/* Nuances Captured Banner: In the conversation box, the Next button is always for Upload Data */}
      {(canUpload || isKg2Active) ? (
        <div className="mx-3.5 my-2 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/30 px-3.5 py-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#10b981] shrink-0" />
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              Nuances Captured · Baseline Ready
            </span>
          </div>
          {onOpenUpload && (
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white dark:text-black font-bold px-3 py-1.5 text-xs shadow-sm transition active:scale-95 cursor-pointer"
            >
              <span>Next: Upload Data</span>
              <ArrowRight size={13} strokeWidth={2.5} />
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
              ({userChatCount}/3 chats to unlock file upload)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-4 rounded-full transition-colors ${
                userChatCount >= 1 ? 'bg-brand' : 'bg-line dark:bg-surface'
              }`}
            />
            <span
              className={`h-1.5 w-4 rounded-full transition-colors ${
                userChatCount >= 2 ? 'bg-brand' : 'bg-line dark:bg-surface'
              }`}
            />
            <span
              className={`h-1.5 w-4 rounded-full transition-colors ${
                userChatCount >= 3 ? 'bg-brand' : 'bg-line dark:bg-surface'
              }`}
            />
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
            <div key={m.id} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl text-xs font-semibold shadow-2xs ${isUser
                  ? 'bg-brand text-brand-ink shadow-brand/20 font-bold'
                  : 'bg-surface2 text-brand border border-line'
                  }`}
              >
                {isUser ? <User size={14} /> : <Bot size={14} />}
              </span>

              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-2xs ${isUser
                  ? 'bg-brand text-brand-ink font-medium rounded-tr-sm'
                  : isDecisionMsg
                    ? 'border-2 border-brand/50 bg-brand/10 text-ink rounded-tl-sm'
                    : m.kind === 'gap_analysis'
                      ? 'border border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20 text-ink rounded-tl-sm'
                      : m.kind === 'question'
                        ? 'border border-brand/40 bg-brand/5 rounded-tl-sm text-ink'
                        : 'border border-line/70 bg-surface2/70 text-ink rounded-tl-sm'
                  }`}
              >
                {KIND_LABEL[m.kind] && !isUser && (
                  <span className="mb-1 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-brand">
                    <span>
                      {KIND_LABEL[m.kind]}
                      {m.meta?.followup ? ' · Follow-up' : ''}
                    </span>
                    {isProcessing && (
                      <span className="inline-flex items-center gap-1.5 text-brand font-semibold text-[11px] normal-case">
                        <span className="h-3 w-3 rounded-full border-2 border-brand/30 border-t-brand animate-spin shrink-0" />
                        <span>Processing…</span>
                      </span>
                    )}
                  </span>
                )}
                <span className="whitespace-pre-wrap">{m.content}</span>
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

            {/* Session decision quick banner if awaiting decision */}
            {activeSnap.awaiting_session_decision && !isComplete && (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-amber-500/10 border border-amber-500/25 px-3 py-2 text-xs">
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  Ready to proceed, or continue exploring?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDecision('continue')}
                    className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:text-brand transition cursor-pointer disabled:opacity-50"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDecision('proceed')}
                    className="rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-brand-ink hover:bg-[#6ee7b7] transition cursor-pointer shadow-2xs disabled:opacity-50"
                  >
                    Proceed
                  </button>
                </div>
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
