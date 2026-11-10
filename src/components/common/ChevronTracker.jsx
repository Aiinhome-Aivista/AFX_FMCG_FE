import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

/**
 * 4-Stage Workflow (matching user screenshot):
 * 1. Industry Identification
 * 2. Domain Prompts & Overview
 * 3. Core Nuances (Process Discovery)
 * 4. Review (Digital Twin)
 */

export function useChevronTrackerState() {
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
    if (!slug) return { isKg2: false, canUpload: false }
    try {
      const searchParams = new URLSearchParams(window.location.search)
      const isKg2 = searchParams.get('stage') === 'kg2'
      const isUpload = searchParams.get('view') === 'upload'
      const canUploadStored = sessionStorage.getItem(`afx_can_upload_${slug}`) === 'true'
      return { isKg2, canUpload: isKg2 || isUpload || canUploadStored }
    } catch {
      return { isKg2: false, canUpload: false }
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

  const searchParams = new URLSearchParams(location.search)
  const isExplicitKg1 = searchParams.get('stage') === 'kg1'
  const isExplicitKg2 = searchParams.get('stage') === 'kg2'
  const currentSlug = slug || effectiveSlug
  const isSessionKg2 = currentSlug
    ? (typeof sessionStorage !== 'undefined' && (
        sessionStorage.getItem(`afx_is_kg2_${currentSlug}`) === 'true' ||
        sessionStorage.getItem(`afx_is_kg2_${slug}`) === 'true'
      ))
    : false

  const isConversationStarted = Boolean(
    workflowDetail?.conversationStarted ||
    (currentSlug && typeof sessionStorage !== 'undefined' && (
      sessionStorage.getItem(`afx_conv_started_${currentSlug}`) === 'true' ||
      sessionStorage.getItem(`afx_conv_started_${slug}`) === 'true'
    ))
  )

  const isKg2Active = Boolean(
    !isExplicitKg1 && (
      isExplicitKg2 ||
      workflowDetail?.isKg2 === true ||
      (workflowDetail?.version && workflowDetail.version >= 2) ||
      isSessionKg2
    )
  )

  const isUploadView = searchParams.get('view') === 'upload' || workflowDetail?.activeLeftView === 'upload'

  // Check if user has transitioned to KG2 (via Proceed to Gap Analysis button click) or is in Upload view
  const isUploadOrKg2 = Boolean(
    !isExplicitKg1 && (
      isKg2Active ||
      isUploadView
    )
  )

  // Calculate dynamic next step action button right to Review chevron for new users
  const nextStepInfo = useMemo(() => {
    if (isIndustryStep) {
      return {
        label: 'Next: Select Domain',
        route: prefix || '/fmcg',
      }
    }

    if (isFinalize) {
      return null // Already on final review step
    }

    // If user has NOT selected a sub-domain yet (on domain overview/landing page)
    if (!isDomainSelected) {
      return null
    }

    if (!currentSlug) return null

    if (isKg2Active) {
      // In KG2 stage: next step is Finalize Twin (navigates to review / finalize page)
      return {
        label: 'Next: Finalize Twin',
        route: `${prefix}/${currentSlug}/finalize`,
      }
    }

    if (isUploadView) {
      // In Upload stage: next step is Gap Analysis
      return {
        label: 'Next: Gap Analysis',
        route: `${prefix}/${currentSlug}?stage=kg2&view=graph`,
      }
    }

    // Do not show "Next: Upload Data" in the navigation bar
    return null
  }, [isIndustryStep, isFinalize, isDomainSelected, isKg2Active, isUploadView, workflowDetail, prefix, currentSlug, effectiveSlug])

  return {
    path,
    prefix,
    slug,
    effectiveSlug,
    currentSlug,
    isIndustryStep,
    isDomainSelected,
    isFinalize,
    isKg2Active,
    isUploadView,
    isUploadOrKg2,
    isConversationStarted,
    workflowDetail,
    nextStepInfo,
  }
}

/**
 * Dedicated Header "Next:" Action Button
 * Placed on the right side of the navbar beside the icons
 */
export function HeaderNextButton({ className = '' }) {
  const { nextStepInfo } = useChevronTrackerState()
  if (!nextStepInfo) return null

  return (
    <Link
      to={nextStepInfo.route}
      className={`inline-flex items-center gap-1.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold px-3.5 sm:px-4 py-1.5 text-xs sm:text-[13px] shadow-sm hover:shadow transition-all duration-200 active:scale-95 shrink-0 select-none cursor-pointer border border-emerald-400/40 ${className}`}
      title={nextStepInfo.label}
    >
      <span>{nextStepInfo.label}</span>
      <ArrowRight size={13} strokeWidth={2.5} />
    </Link>
  )
}

/**
 * Workflow Steps Chevron Arrow Navigation
 * Positioned on the left side beside AgentForgeX FMCG logo
 */
export default function ChevronTracker({ showNextButton = false }) {
  const {
    prefix,
    slug,
    effectiveSlug,
    isIndustryStep,
    isDomainSelected,
    isFinalize,
    isUploadOrKg2,
    isConversationStarted,
    workflowDetail,
    nextStepInfo,
  } = useChevronTrackerState()

  // Hide workflow steps in the header on the All Domain page (and when no domain is selected)
  if (!isDomainSelected) {
    return null
  }

  // Stages matching screenshot when navigating domain workflow:
  // 1: Domain (Prompts & Overview)
  // 2: Core Nuances (Process Discovery)
  // 3: Business Telemetry (Data Gap Analysis)
  // 4: Review (Digital Twin)
  const stages = useMemo(() => {
    if (isIndustryStep) {
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
          subtitle: 'Prompts & Overview',
          route: () => prefix,
        },
        {
          id: 3,
          title: 'Core Nuances',
          subtitle: 'Process Discovery',
          route: (s, p, eff) => `${p}/${s || eff}?stage=kg1&view=graph`,
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
        title: 'Domain',
        subtitle: 'Prompts & Overview',
        route: () => prefix,
      },
      {
        id: 2,
        title: 'Core Nuances',
        subtitle: 'Process Discovery',
        route: (s, p, eff) => `${p}/${s || eff}?stage=kg1&view=graph`,
      },
      {
        id: 3,
        title: 'Business Telemetry',
        subtitle: 'Data Gap Analysis',
        route: (s, p, eff) => {
          if (workflowDetail?.isKg2) return `${p}/${s || eff}?stage=kg2&view=graph`
          if (workflowDetail?.canUpload || workflowDetail?.hasUploadedFiles) {
            return `${p}/${s || eff}?stage=kg1&view=upload`
          }
          return `${p}/${s || eff}?stage=kg1&view=graph`
        },
      },
      {
        id: 4,
        title: 'Review',
        subtitle: 'Digital Twin',
        route: (s, p, eff) => `${p}/${s || eff}/finalize`,
      },
    ]
  }, [isIndustryStep, prefix, workflowDetail])

  // Calculate status for each stage
  const getStageStatus = (stageId) => {
    if (isIndustryStep) {
      if (stageId === 1) return { isCompleted: false, isActive: true }
      return { isCompleted: false, isActive: false }
    }

    // 4-Stage Domain Workflow (matching user screenshot)
    if (stageId === 1) {
      // Step 1: Domain (Prompts & Overview) - Completed once domain is selected
      return { isCompleted: true, isActive: false }
    }
    if (stageId === 2) {
      // Step 2: Core Nuances (Process Discovery) - Active on domain page until upload / kg2
      if (isFinalize || isUploadOrKg2) return { isCompleted: true, isActive: false }
      return { isCompleted: false, isActive: true }
    }
    if (stageId === 3) {
      // Step 3: Business Telemetry - Active during file upload / KG2 gap analysis
      if (isFinalize) return { isCompleted: true, isActive: false }
      if (isUploadOrKg2) return { isCompleted: false, isActive: true }
      return { isCompleted: false, isActive: false }
    }
    if (stageId === 4) {
      // Step 4: Review - Active on finalize / review page
      if (isFinalize) return { isCompleted: false, isActive: true }
      return { isCompleted: false, isActive: false }
    }

    return { isCompleted: false, isActive: false }
  }

  return (
    <nav
      aria-label="Workflow Stages"
      className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1 no-scrollbar max-w-full select-none"
    >
      {stages.map((stage) => {
        const { isCompleted, isActive } = getStageStatus(stage.id)

        // Colors tailored to match the design in both Light Mode and Dark Mode:
        // 🟢 Completed: Solid Emerald Green (#10b981), dark checkmark circle, bold dark text
        // 🔵 Active: Highlighted glowing border (Emerald-Cyan gradient), dark surface in dark mode, stark white/emerald text
        // ⚪ Inactive / Upcoming: Subtle border outline, dark surface in dark mode, clean typography
        let outerBg = 'bg-slate-200/90 dark:bg-slate-700/60 group-hover:bg-slate-300 dark:group-hover:bg-slate-600/70'
        let innerBg = 'bg-white dark:bg-[#192027] group-hover:bg-slate-50 dark:group-hover:bg-[#222a33]'
        let textColor = 'text-slate-600 dark:text-slate-300 font-semibold group-hover:dark:text-white'
        let subColor = 'text-slate-400 dark:text-slate-400'
        let iconColor = 'text-slate-400 dark:text-slate-400'

        if (isCompleted) {
          outerBg = 'bg-[#10b981]'
          innerBg = 'bg-[#10b981]' // Solid Primary Green
          textColor = 'text-white font-extrabold'
          subColor = 'text-white/90 font-medium'
          iconColor = 'text-white'
        } else if (isActive) {
          outerBg =
            'bg-gradient-to-r from-[#10b981] via-[#06b6d4] to-[#10b981] dark:from-[#10b981] dark:via-[#22d3ee] dark:to-[#10b981]'
          innerBg =
            'bg-gradient-to-r from-emerald-100/95 via-cyan-50/90 to-emerald-100/95 dark:!bg-none dark:bg-[#132822]'
          textColor = 'text-emerald-950 dark:text-emerald-200 font-extrabold'
          subColor = 'text-emerald-800 dark:text-[#34d399] font-bold'
          iconColor = 'text-[#10b981]'
        }

        const targetUrl =
          (typeof stage.route === 'function' ? stage.route(slug, prefix, effectiveSlug) : null) || prefix || '/fmcg'

        return (
          <Link
            key={stage.id}
            to={targetUrl}
            className={`group relative flex items-center transition-all duration-300 cursor-pointer ${
              isActive ? 'scale-[1.02] z-10' : 'hover:scale-[1.01]'
            }`}
          >
            {/* Outer Chevron Clip Path (Border layer) */}
            <div
              className={`p-[1.5px] transition-colors duration-200 ${outerBg} ${
                isActive ? 'shadow-[0_0_12px_rgba(16,185,129,0.35)]' : ''
              }`}
              style={{
                clipPath:
                  'polygon(0% 0%, calc(100% - 13px) 0%, 100% 50%, calc(100% - 13px) 100%, 0% 100%, 13px 50%)',
              }}
            >
              {/* Inner Content Container */}
              <div
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 pl-4 sm:pl-5 py-1.5 transition-colors duration-200 ${innerBg}`}
                style={{
                  clipPath:
                    'polygon(0% 0%, calc(100% - 13px) 0%, 100% 50%, calc(100% - 13px) 100%, 0% 100%, 13px 50%)',
                }}
              >
                {/* Step Circle: Checkmark if completed, blinking dot badge if active, empty circle if upcoming */}
                <span className="flex h-4 w-4 items-center justify-center shrink-0">
                  {isCompleted ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-slate-950 text-[#10b981] dark:text-emerald-400 shrink-0 shadow-xs">
                      <Check size={11} strokeWidth={3.5} />
                    </span>
                  ) : isActive ? (
                    <span className="relative flex h-4 w-4 items-center justify-center shrink-0">
                      <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-[#10b981]/25 dark:bg-[#10b981]/35 border border-[#10b981]/50 dot-blink">
                        <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                      </span>
                    </span>
                  ) : (
                    <span className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border-2 border-slate-300 dark:border-slate-600 bg-transparent shrink-0" />
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

      {/* Optional In-line Button if enabled */}
      {showNextButton && nextStepInfo && (
        <HeaderNextButton className="ml-4 sm:ml-7" />
      )}
    </nav>
  )
}
