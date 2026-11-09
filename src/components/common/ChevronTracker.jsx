import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

/**
 * 4-Stage Workflow (Default when no files uploaded yet):
 * 1. Industry Identification
 * 2. Domain Prompts
 * 3. Core Nuances (KG1 Discovery)
 * 4. Review (Digital Twin)
 *
 * 5-Stage Workflow (Dynamic when files uploaded / KG2 Gap Analysis active):
 * 1. Industry Identification
 * 2. Domain Prompts
 * 3. Core Nuances (KG1 Discovery)
 * 4. Business Telemetry (KG2 Gap Analysis)
 * 5. Review (Digital Twin)
 */

export default function ChevronTracker() {
  const location = useLocation()
  const { user } = useAuth()
  const path = location.pathname

  // Determine app prefix: /finance if current path uses finance, else /fmcg
  const prefix = path.startsWith('/finance') ? '/finance' : '/fmcg'

  // Extract slug from /[fmcg|finance]/:slug/...
  const slug = useMemo(() => {
    const parts = path.split('/').filter(Boolean)
    const firstPart = parts[0]?.toLowerCase()

    if (
      ['fmcg', 'finance'].includes(firstPart) &&
      parts[1] &&
      !['overview', 'customize', 'finalize', 'telemetry'].includes(parts[1])
    ) {
      return parts[1]
    }
    return null
  }, [path])

  // Retain last selected domain slug for seamless forward navigation
  const effectiveSlug = useMemo(() => {
    if (slug) {
      try {
        localStorage.setItem('afx_last_domain_slug', slug)
      } catch {}
      return slug
    }
    try {
      const stored = localStorage.getItem('afx_last_domain_slug')
      if (stored) return stored
    } catch {}
    return '01-sales-distribution'
  }, [slug])

  // Track live workflow state (e.g. when file upload starts, KG2 is active, etc.)
  const [workflowDetail, setWorkflowDetail] = useState(() => {
    if (!slug) return { isKg2: false }
    try {
      const stored = sessionStorage.getItem(`afx_is_kg2_${slug}`) === 'true'
      return { isKg2: stored }
    } catch {
      return { isKg2: false }
    }
  })

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.slug === slug || !e.detail?.slug) {
        setWorkflowDetail(e.detail)
      }
    }
    window.addEventListener('afx-workflow-state', handler)
    return () => window.removeEventListener('afx-workflow-state', handler)
  }, [slug])

  // Determine workflow states
  const isIndustryStep = path.startsWith('/apps')
  const isDomainSelected = Boolean(slug)
  const isFinalize = path.includes('/finalize') || path.includes('/telemetry')

  // Check if user has transitioned to KG2 (via View Gap Analysis button click)
  const isUploadOrKg2 = Boolean(
    workflowDetail?.isKg2 ||
    (slug && sessionStorage.getItem(`afx_is_kg2_${slug}`) === 'true')
  )

  // Dynamically select 4 or 5 stages:
  // When files are NOT uploaded: Stage 4 (KG2) is HIDDEN.
  // When files ARE uploaded: Stage 4 (KG2 Gap Analysis) is REVEALED.
  const stages = useMemo(() => {
    if (!isUploadOrKg2) {
      return [
        {
          id: 1,
          title: 'Industry',
          subtitle: 'Identification',
          route: () => '/apps',
        },
        {
          id: 2,
          title: 'Domain',
          subtitle: 'Prompts',
          route: () => prefix,
        },
        {
          id: 3,
          title: 'Core Nuances',
          subtitle: 'KG1 Discovery',
          route: (s, p, eff) => `${p}/${s || eff}?view=graph`,
        },
        {
          id: 4,
          title: 'Review',
          subtitle: 'Digital Twin',
          route: (s, p, eff) => `${p}/${s || eff}/finalize`,
        },
      ]
    }

    return [
      {
        id: 1,
        title: 'Industry',
        subtitle: 'Identification',
        route: () => '/apps',
      },
      {
        id: 2,
        title: 'Domain',
        subtitle: 'Prompts',
        route: () => prefix,
      },
      {
        id: 3,
        title: 'Core Nuances',
        subtitle: 'KG1 Discovery',
        route: (s, p, eff) => `${p}/${s || eff}?view=graph`,
      },
      {
        id: 4,
        title: 'Business Telemetry',
        subtitle: 'KG2 Gap Analysis',
        route: (s, p, eff) => `${p}/${s || eff}?view=upload`,
      },
      {
        id: 5,
        title: 'Review',
        subtitle: 'Digital Twin',
        route: (s, p, eff) => `${p}/${s || eff}/finalize`,
      },
    ]
  }, [isUploadOrKg2, prefix])

  // Calculate status for each stage based on 4-stage or 5-stage mode
  const getStageStatus = (stageId, totalStages) => {
    if (totalStages === 4) {
      // 4-Stage Mode
      if (stageId === 1) {
        if (isIndustryStep) return { isCompleted: false, isActive: true }
        return { isCompleted: true, isActive: false }
      }
      if (stageId === 2) {
        if (isIndustryStep) return { isCompleted: false, isActive: false }
        if (!isDomainSelected) return { isCompleted: false, isActive: true }
        return { isCompleted: true, isActive: false }
      }
      if (stageId === 3) {
        if (isIndustryStep || !isDomainSelected) return { isCompleted: false, isActive: false }
        if (isFinalize) return { isCompleted: true, isActive: false }
        return { isCompleted: false, isActive: true }
      }
      if (stageId === 4) {
        if (isFinalize) return { isCompleted: false, isActive: true }
        return { isCompleted: false, isActive: false }
      }
    } else {
      // 5-Stage Mode (with KG2 Gap Analysis)
      if (stageId === 1) {
        if (isIndustryStep) return { isCompleted: false, isActive: true }
        return { isCompleted: true, isActive: false }
      }
      if (stageId === 2) {
        if (isIndustryStep) return { isCompleted: false, isActive: false }
        if (!isDomainSelected) return { isCompleted: false, isActive: true }
        return { isCompleted: true, isActive: false }
      }
      if (stageId === 3) {
        if (isIndustryStep || !isDomainSelected) return { isCompleted: false, isActive: false }
        if (isFinalize || isUploadOrKg2) return { isCompleted: true, isActive: false }
        return { isCompleted: false, isActive: true }
      }
      if (stageId === 4) {
        if (isIndustryStep || !isDomainSelected) return { isCompleted: false, isActive: false }
        if (isFinalize) return { isCompleted: true, isActive: false }
        if (isUploadOrKg2) return { isCompleted: false, isActive: true }
        return { isCompleted: false, isActive: false }
      }
      if (stageId === 5) {
        if (isFinalize) return { isCompleted: false, isActive: true }
        return { isCompleted: false, isActive: false }
      }
    }

    return { isCompleted: false, isActive: false }
  }

  return (
    <nav
      aria-label="Workflow Stages"
      className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 no-scrollbar max-w-full"
    >
      {stages.map((stage) => {
        const { isCompleted, isActive } = getStageStatus(stage.id, stages.length)

        // Colors tailored to match the design in both Light Mode and Dark Mode:
        // 🟢 Completed: Solid Emerald Green (#10b981), dark checkmark circle, bold dark text
        // 🔵 Active: Highlighted glowing border (Emerald-Cyan gradient), dark surface in dark mode, stark white/emerald text
        // ⚪ Inactive / Upcoming: Subtle border outline, dark surface in dark mode, clean typography
        let outerBg = 'bg-slate-200/90 dark:bg-slate-800/80 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
        let innerBg = 'bg-white dark:bg-[#0c1322] group-hover:bg-slate-50 dark:group-hover:bg-[#141f35]'
        let textColor = 'text-slate-600 dark:text-slate-400 font-semibold group-hover:dark:text-white'
        let subColor = 'text-slate-400 dark:text-slate-500'
        let iconColor = 'text-slate-400 dark:text-slate-500'

        if (isCompleted) {
          outerBg = 'bg-[#10b981]'
          innerBg = 'bg-[#10b981]' // Solid Primary Green
          textColor = 'text-slate-950 font-extrabold'
          subColor = 'text-slate-900/90 font-semibold'
          iconColor = 'text-slate-950'
        } else if (isActive) {
          outerBg =
            'bg-gradient-to-r from-[#10b981] via-[#06b6d4] to-[#10b981] dark:from-[#10b981] dark:via-[#22d3ee] dark:to-[#10b981]'
          innerBg =
            'bg-gradient-to-r from-emerald-50/90 via-cyan-50/70 to-emerald-50/90 dark:!bg-none dark:bg-[#0c1322]'
          textColor = 'text-emerald-950 dark:text-white font-extrabold'
          subColor = 'text-emerald-700 dark:text-[#34d399] font-bold'
          iconColor = 'text-[#10b981]'
        }

        const targetRoute = stage.route(slug, prefix, effectiveSlug)
        const isFirst = stage.id === 1
        const arrowClass = isFirst ? 'chevron-arrow-start' : 'chevron-arrow'

        return (
          <Link
            key={stage.id}
            to={targetRoute}
            className={`group chevron-tracker-step ${arrowClass} inline-block cursor-pointer outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 border-0 border-none transition-transform duration-200 hover:scale-[1.02] active:scale-95`}
            title={`${stage.title} - ${stage.subtitle} (Click to navigate)`}
          >
            <div
              className={`${arrowClass} relative p-[2px] transition-all duration-300 ${outerBg} ${
                isActive
                  ? 'shadow-[0_2px_14px_rgba(16,185,129,0.35)] dark:shadow-[0_0_20px_rgba(16,185,129,0.65),0_0_10px_rgba(34,211,238,0.45)]'
                  : ''
              }`}
            >
              <div
                className={`${arrowClass} ${innerBg} px-2.5 sm:px-3.5 py-1.5 flex items-center gap-1.5 sm:gap-2 select-none min-w-[95px] sm:min-w-[122px] h-[34px] sm:h-[36px] transition-colors`}
              >
                {/* Status Indicator Icon */}
                <span className="flex items-center justify-center shrink-0">
                  {isCompleted ? (
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-black/15 text-black">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  ) : isActive ? (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-90" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981] shadow-[0_0_8px_#10b981]" />
                    </span>
                  ) : (
                    <span className={`text-[11px] font-mono font-medium ${iconColor}`}>
                      {stage.id}
                    </span>
                  )}
                </span>

                {/* Step Title & Subtitle */}
                <div className="flex flex-col min-w-0 leading-tight">
                  <span className={`text-[10px] sm:text-[11.5px] truncate font-bold ${textColor}`}>
                    {stage.title}
                  </span>
                  <span className={`text-[8.5px] sm:text-[9.5px] truncate ${subColor}`}>
                    {stage.subtitle}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}
