import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Code2,
  ExternalLink,
  HelpCircle,
  Info,
  Lightbulb,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

export default function ExecutiveImpactGuide({
  impactData,
  backUrl,
  domainName = 'FMCG Domain',
  viewMode = 'executive',
  onToggleViewMode,
}) {
  const [lang, setLang] = useState('bn') // 'bn' | 'en'
  const [filterSeverity, setFilterSeverity] = useState('all') // 'all' | 'high' | 'medium' | 'low'
  const [acknowledgedItems, setAcknowledgedItems] = useState({})
  const [expandedTech, setExpandedTech] = useState({})

  const items = impactData?.items || []
  const counts = impactData?.counts || { critical: 0, high: 0, medium: 0, low: 0, total: 0 }

  const filteredItems = useMemo(() => {
    if (filterSeverity === 'all') return items
    if (filterSeverity === 'high') return items.filter((i) => i.severity === 'high' || i.severity === 'critical')
    return items.filter((i) => i.severity === filterSeverity)
  }, [items, filterSeverity])

  const toggleAck = (id) => {
    setAcknowledgedItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleTech = (id) => {
    setExpandedTech((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const isBn = lang === 'bn'

  const severityBadge = (severity) => {
    if (severity === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
          <ShieldAlert size={12} />
          <span>{isBn ? 'বাধ্যতামূলক সংশোধন' : 'Critical Fix'}</span>
        </span>
      )
    }
    if (severity === 'high') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
          <AlertCircle size={12} />
          <span>{isBn ? 'উচ্চ ব্যবসায়িক ঝুঁকি' : 'High Business Impact'}</span>
        </span>
      )
    }
    if (severity === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
          <AlertTriangle size={12} />
          <span>{isBn ? 'মাঝারি পর্যবেক্ষণ' : 'Medium Impact'}</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
        <Info size={12} />
        <span>{isBn ? 'সাধারণ অভিযোজন' : 'Informational / Note'}</span>
      </span>
    )
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-card space-y-5">
      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              👔
            </span>
            <h2 className="text-base sm:text-lg font-bold text-ink">
              {isBn ? 'এক্সিকিউটিভ বিজনেস ইমপ্যাক্ট ও ডিসিশন গাইড' : 'Executive Business Impact & Decision Guide'}
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted max-w-2xl leading-relaxed">
            {isBn
              ? 'নন-টেকনিক্যাল ক্লায়েন্ট ও ম্যানেজমেন্টের জন্য সহজ বাংলায় মডেলের ফাঁকফোকর ও ব্যবসায়িক প্রভাব বিশ্লেষণ।'
              : 'Plain-language explanation of model gaps, missing telemetry, and financial/operational risks for business stakeholders.'}
          </p>
        </div>

        {/* View Mode & Language Controls */}
        <div className="flex flex-wrap items-center gap-2 select-none shrink-0">
          {/* Language Switcher */}
          <div className="inline-flex items-center rounded-xl border border-line bg-surface2/50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setLang('bn')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                lang === 'bn' ? 'bg-brand text-brand-ink shadow-2xs' : 'text-muted hover:text-ink'
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                lang === 'en' ? 'bg-brand text-brand-ink shadow-2xs' : 'text-muted hover:text-ink'
              }`}
            >
              English
            </button>
          </div>

          {/* View Mode Toggle Button */}
          {onToggleViewMode && (
            <button
              type="button"
              onClick={onToggleViewMode}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line hover:border-brand/40 bg-surface2/40 hover:bg-surface2 px-3 py-1.5 text-xs font-semibold text-ink transition cursor-pointer"
            >
              <Code2 size={13} className="text-brand" />
              <span>{viewMode === 'executive' ? (isBn ? 'টেকনিক্যাল ভিউ দেখুন' : 'Show Technical Diff') : (isBn ? 'বিজনেস ভিউ দেখুন' : 'Show Executive View')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Readiness Verdict Box */}
      <div
        className={`rounded-xl border p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          impactData?.status === 'blocked'
            ? 'bg-rose-500/10 border-rose-500/25 text-rose-950 dark:text-rose-100'
            : impactData?.status === 'review_needed'
            ? 'bg-amber-500/10 border-amber-500/25 text-amber-950 dark:text-amber-100'
            : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-950 dark:text-emerald-100'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {impactData?.status === 'ready' ? (
              <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400" />
            ) : impactData?.status === 'blocked' ? (
              <AlertCircle size={24} className="text-rose-600 dark:text-rose-400" />
            ) : (
              <AlertTriangle size={24} className="text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-75">
              {isBn ? 'মডেল রেডিনেস মূল্যায়ন' : 'Enterprise Readiness Verdict'}
            </div>
            <div className="mt-0.5 text-sm sm:text-base font-bold text-ink">
              {isBn ? impactData?.verdict_bn : impactData?.verdict_en}
            </div>
          </div>
        </div>

        {/* Quick Stat Badges */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setFilterSeverity('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition border ${
              filterSeverity === 'all'
                ? 'bg-ink text-surface border-ink'
                : 'bg-surface/80 border-line text-muted hover:text-ink'
            }`}
          >
            {isBn ? 'সবগুলো' : 'All'} ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('high')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition border ${
              filterSeverity === 'high'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-surface/80 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            {isBn ? 'উচ্চ ঝুঁকি' : 'High Risk'} ({counts.critical + counts.high})
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('medium')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition border ${
              filterSeverity === 'medium'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-surface/80 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            }`}
          >
            {isBn ? 'মাঝারি' : 'Medium'} ({counts.medium})
          </button>
        </div>
      </div>

      {/* Impact Item Cards List */}
      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface2/20 p-8 text-center text-muted">
          <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-80" />
          <p className="text-sm font-semibold text-ink">
            {isBn ? 'এই ক্যাটাগরিতে কোনো অমিল বা ঝুঁকি নেই।' : 'No gaps found in this filter category.'}
          </p>
          <p className="text-xs mt-1">
            {isBn
              ? 'আপনার মডেলটি নির্বাচিত বিষয়ের সাথে সম্পূর্ণ সামঞ্জস্যপূর্ণ।'
              : 'Your model matches requirements in this section.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, idx) => {
            const isAck = acknowledgedItems[item.id]
            const showTech = expandedTech[item.id]

            return (
              <div
                key={item.id || idx}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isAck
                    ? 'border-emerald-500/30 bg-emerald-500/5 opacity-85'
                    : item.severity === 'critical' || item.severity === 'high'
                    ? 'border-line hover:border-rose-500/40 bg-surface'
                    : 'border-line hover:border-amber-500/40 bg-surface'
                }`}
              >
                {/* Item Card Header */}
                <div className="p-4 sm:p-5 pb-3 border-b border-line/60 bg-surface2/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {severityBadge(item.severity)}
                    <h3 className="text-sm sm:text-base font-bold text-ink">
                      {isBn ? item.title_bn : item.title_en}
                    </h3>
                  </div>

                  {/* Acknowledged Badge */}
                  {isAck && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 self-start sm:self-auto shrink-0">
                      <Check size={13} />
                      <span>{isBn ? 'ক্লায়েন্ট সম্মতি দিয়েছে' : 'Acknowledged by Client'}</span>
                    </span>
                  )}
                </div>

                {/* Item Card Body */}
                <div className="p-4 sm:p-5 space-y-3.5 text-xs sm:text-sm">
                  {/* 1. Plain Everyday Explanation */}
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1 flex items-center gap-1">
                      <HelpCircle size={12} />
                      <span>{isBn ? 'সহজ ভাষায় ব্যাখ্যা' : 'Plain Explanation'}</span>
                    </div>
                    <p className="text-ink/90 leading-relaxed text-xs sm:text-[13px]">
                      {item.explanation_bn}
                    </p>
                  </div>

                  {/* 2. Business Impact & Financial Risk */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 p-3.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                      <Lightbulb size={13} />
                      <span>{isBn ? 'ব্যবসায়ে কী প্রভাব পড়বে (Business Impact & Risk)' : 'Business Impact & Risk'}</span>
                    </div>
                    <p className="text-amber-950 dark:text-amber-200 leading-relaxed text-xs sm:text-[13px]">
                      {isBn ? item.impact_bn : (item.impact_en || item.impact_bn)}
                    </p>
                  </div>

                  {/* 3. Recommended Client Decision & Action */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/5 p-3.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                      <Sparkles size={13} />
                      <span>{isBn ? 'ক্লায়েন্টের করণীয় সিদ্ধান্ত (Recommended Action)' : 'Recommended Client Action'}</span>
                    </div>
                    <p className="text-emerald-950 dark:text-emerald-200 leading-relaxed text-xs sm:text-[13px]">
                      {item.action_bn}
                    </p>

                    {/* Action Buttons */}
                    <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex flex-wrap items-center gap-2">
                      <Link
                        to={backUrl}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 text-xs shadow-sm transition active:scale-95"
                      >
                        <ArrowLeft size={13} />
                        <span>{isBn ? 'চ্যাটবটে ফিরে গিয়ে এটি ঠিক করুন' : 'Fix in Chatbot'}</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => toggleAck(item.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition active:scale-95 cursor-pointer ${
                          isAck
                            ? 'bg-surface2 text-muted border-line'
                            : 'bg-surface border-line hover:border-emerald-400 text-ink'
                        }`}
                      >
                        <Check size={13} className={isAck ? 'text-emerald-500' : 'text-muted'} />
                        <span>
                          {isAck
                            ? (isBn ? 'সম্মতি বাতিল করুন' : 'Undo Acknowledgment')
                            : (isBn ? 'আমাদের ব্যবসায়ে প্রযোজ্য নয় (ইগনোর করুন)' : 'Not Applicable for our Business (Ignore)')}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Technical Reference (Collapsible) */}
                  <div className="pt-2 border-t border-line/60">
                    <button
                      type="button"
                      onClick={() => toggleTech(item.id)}
                      className="inline-flex items-center gap-1.5 text-[11px] text-muted hover:text-ink font-mono transition cursor-pointer"
                    >
                      <span>{showTech ? (isBn ? 'টেকনিক্যাল কোড লুকান' : 'Hide Technical Code') : (isBn ? 'টেকনিক্যাল কোড ও স্কিমা দেখুন' : 'Show Technical Details')}</span>
                      {showTech ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {showTech && (
                      <div className="mt-2 rounded-lg bg-surface2/60 border border-line p-2.5 text-[11px] font-mono text-muted break-all">
                        {item.technical_ref}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
