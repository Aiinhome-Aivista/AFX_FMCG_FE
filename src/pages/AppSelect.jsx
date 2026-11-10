import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BrainCircuit,
  ChevronUp,
  Layers,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import Layout from '../components/common/Layout'
import { Loading, ErrorState } from '../components/common/States'
import useAsync from '../components/common/useAsync'
import { apps } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function AppSelect() {
  const { data, loading, error, reload } = useAsync(() => apps.list(), [])
  const { user, refreshUser } = useAuth()
  const nav = useNavigate()
  const toast = useToast()
  const [busy, setBusy] = useState(null)
  const [showDomains, setShowDomains] = useState(true)

  const handleSelectFmcg = async () => {
    setBusy('fmcg')
    try {
      await apps.select('fmcg')
      await refreshUser()
      nav('/fmcg')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  const handleSelectFinance = async () => {
    setBusy('finance')
    try {
      try {
        await apps.select('finance')
      } catch {
        await apps.select('fmcg')
      }
      await refreshUser()
      nav('/fmcg')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  const handleExploreExtensions = () => {
    toast.success('AgentForge Extensions: Retail, Telco, & Healthcare models are ready for deployment!')
  }

  return (
    <Layout>
      {/* Page Title & Subtitle */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
          <Sparkles size={13} className="text-[#10b981]" />
          <span>Product Catalog & Industry Identification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
          AgentForgeX Enterprise Catalog
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1 max-w-3xl">
          Select the enterprise application to inspect conformed ontology dimensions, operational flows, and interactive AI digital twins.
        </p>
      </div>

      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {/* Main AgentForge Platform Card */}
      <div className="rounded-3xl border border-[#10b981]/50 dark:border-[#10b981]/60 bg-white dark:bg-surface p-6 sm:p-8 shadow-sm dark:shadow-[0_0_25px_rgba(16,185,129,0.12)] transition-all">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#10b981] to-emerald-600 text-white shadow-md shadow-[#10b981]/25 shrink-0">
              <BrainCircuit className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink">
                  AgentForge
                </h2>
                <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-0.5 text-xs font-bold">
                  Sole Primary Platform
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                Unified enterprise multi-domain ontology engine with governed digital twins
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDomains(!showDomains)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface/80 hover:bg-surface2 px-3.5 py-1.5 text-xs font-bold text-ink transition shadow-2xs self-start sm:self-center cursor-pointer"
          >
            <span>{showDomains ? 'Hide Domains' : 'Show Domains'}</span>
            <ChevronUp size={14} className={`transition-transform duration-200 ${showDomains ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* Platform Overview Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-line/50 pt-4">
          AgentForge orchestrates enterprise-scale digital twins across value chains. Pick a target domain below to explore industry reference models, capture your core operational nuances, and ground real-world data with gap analysis.
        </p>

        {/* Domain Choices Section */}
        {showDomains && (
          <div className="mt-6 pt-5 border-t border-line/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3.5">
              Domain Choices (Unified Architecture)
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Domain 1: Finance & EPM */}
              <div
                onClick={handleSelectFinance}
                className="group relative rounded-2xl border border-line bg-surface/90 dark:bg-surface p-5 transition-all duration-200 hover:border-emerald-500/70 hover:shadow-md hover:dark:shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp size={20} strokeWidth={2.2} />
                    </span>
                    <span className="rounded-md bg-black text-white dark:bg-slate-800 dark:text-slate-200 px-2.5 py-0.5 text-[11px] font-bold">
                      Dark Theme
                    </span>
                  </div>
                  <h4 className="mt-3.5 text-base font-bold text-ink group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Finance & EPM
                  </h4>
                  <p className="mt-1.5 text-xs text-muted leading-relaxed">
                    FP&A, gross-to-net waterfalls, activity-based costing, working capital, and enterprise governance.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/40 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                    {busy === 'finance' ? 'Loading…' : 'Open Finance Workspace'}
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>

              {/* Domain 2: FMCG Value Chain (Primary Highlighted Card) */}
              <div
                onClick={handleSelectFmcg}
                className="group relative rounded-2xl border-2 border-emerald-500/80 dark:border-emerald-500 bg-emerald-50/25 dark:bg-emerald-950/20 p-5 transition-all duration-200 shadow-md shadow-emerald-500/10 dark:shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:scale-[1.01] cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-100 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400">
                      <ShoppingBag size={20} strokeWidth={2.2} />
                    </span>
                    <span className="rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 px-2.5 py-0.5 text-[11px] font-bold">
                      9 Domains
                    </span>
                  </div>
                  <h4 className="mt-3.5 text-base font-bold text-ink text-emerald-800 dark:text-emerald-300">
                    FMCG Value Chain
                  </h4>
                  <p className="mt-1.5 text-xs text-muted leading-relaxed">
                    RtM execution, trade spend, brand marketing, supply chain, manufacturing, NPD, and conformed master spine.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                    {busy === 'fmcg' ? 'Opening FMCG…' : 'Open FMCG Workspace'}
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>

              {/* Domain 3: Others (Extensible) */}
              <div
                onClick={handleExploreExtensions}
                className="group relative rounded-2xl border border-line bg-surface/90 dark:bg-surface p-5 transition-all duration-200 hover:border-purple-500/70 hover:shadow-md hover:dark:shadow-[0_0_20px_rgba(168,85,247,0.2)] cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400">
                      <Layers size={20} strokeWidth={2.2} />
                    </span>
                    <span className="rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 px-2.5 py-0.5 text-[11px] font-bold">
                      Extensible
                    </span>
                  </div>
                  <h4 className="mt-3.5 text-base font-bold text-ink group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Others (Extensible)
                  </h4>
                  <p className="mt-1.5 text-xs text-muted leading-relaxed">
                    Extend AgentForge to Retail, Telecommunications, Healthcare, or Custom Enterprise Verticals.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-line/40 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform">
                    Explore Extensions
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
