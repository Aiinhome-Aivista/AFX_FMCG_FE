import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Moon, Network, Sun, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import ChevronTracker, { HeaderNextButton } from './ChevronTracker'

export default function Layout({ children, wide }) {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const nav = useNavigate()
  const location = useLocation()

  const isFinance = location.pathname.startsWith('/finance') || user?.selected_app === 'finance'
  const subTitle = 'FMCG KG'

  return (
    <div className="flex min-h-full flex-col bg-bg text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between gap-3 px-3 sm:px-6">
          {/* Left Side: Brand Logo & Name + Workflow Arrow Steps beside it */}
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            {/* Brand Logo & Name */}
            <Link
              to={user?.selected_app ? '/fmcg' : '/apps'}
              className="flex items-center gap-2.5 font-bold shrink-0 hover:opacity-90 transition select-none"
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#10b981] text-white shadow-sm">
                <Network size={20} strokeWidth={2.3} />
              </div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[15px] font-extrabold tracking-tight text-ink">AgentForgeX</span>
                <span className="text-[13px] font-bold text-[#10b981]">
                  {subTitle}
                </span>
              </div>
            </Link>

            {/* Workflow Chevron Steps beside Logo */}
            <div className="flex items-center overflow-x-auto py-1 no-scrollbar min-w-0">
              <ChevronTracker />
            </div>
          </div>

          {/* Right Side: Next Action Button + User Controls & Theme Icons */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 select-none">
            {/* Dynamic "Next:" Action Button placed beside the icons */}
            <HeaderNextButton />

            {/* Theme Toggle Button */}
            <button
              className="grid h-9 w-9 place-items-center rounded-2xl border border-line/60 bg-surface2/80 text-ink hover:bg-surface2 hover:border-brand/40 transition-all cursor-pointer shadow-2xs"
              onClick={toggle}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} strokeWidth={2.2} /> : <Moon size={16} strokeWidth={2.2} />}
            </button>

            {/* Profile Pill (Green User Icon + Name) */}
            <div
              className="flex items-center gap-2 rounded-2xl border border-line/60 bg-surface2/80 px-3.5 py-1.5 text-xs sm:text-[13px] font-bold text-ink shadow-2xs"
              title={user?.email}
            >
              <User size={15} className="text-[#10b981]" strokeWidth={2.5} />
              <span className="max-w-[130px] truncate text-ink font-bold">
                {user?.display_name || user?.email?.split('@')[0] || 'User'}
              </span>
            </div>

            {/* Sign Out (Icon Only) */}
            <button
              className="grid h-9 w-9 place-items-center rounded-2xl border border-line/60 bg-surface2/80 text-ink hover:text-rose-500 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all cursor-pointer shadow-2xs"
              onClick={async () => {
                await logout()
                nav('/login')
              }}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={16} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </header>
      <main className={`mx-auto w-full flex-1 px-3 py-5 sm:px-6 ${wide ? 'max-w-[1800px]' : 'max-w-6xl'}`}>
        {children}
      </main>
    </div>
  )
}
