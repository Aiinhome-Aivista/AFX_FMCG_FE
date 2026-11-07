import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Moon, Network, Sun } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import ChevronTracker from './ChevronTracker'

export default function Layout({ children, wide }) {
  const { user, logout } = useAuth()
  const { theme, setTheme, toggle } = useTheme()
  const nav = useNavigate()
  const location = useLocation()

  const isFinance = location.pathname.startsWith('/finance') || user?.selected_app === 'finance'
  const subTitle = isFinance ? 'Finance KG' : 'FMCG KG'

  // Ensure Finance interface consistently defaults to dark theme with green and black accents
  useEffect(() => {
    if (isFinance) {
      setTheme?.('dark')
    }
  }, [isFinance, setTheme])

  const initials = (user?.display_name || user?.email || 'User')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex min-h-full flex-col bg-bg text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between gap-3 px-3 sm:px-6">
          {/* Brand Logo & Name */}
          <Link
            to={user?.selected_app ? '/fmcg' : '/apps'}
            className="flex items-center gap-2.5 font-bold shrink-0 hover:opacity-90 transition select-none"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#10b981] text-white shadow-sm">
              <Network size={20} strokeWidth={2.3} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[15px] font-extrabold tracking-tight text-ink">AgentForgeX</span>
              <span className="text-[10px] font-bold tracking-wider text-[#10b981] uppercase mt-0.5">
                {subTitle}
              </span>
            </div>
          </Link>

          {/* Workflow Chevron Tracker */}
          <div className="flex-1 flex justify-center overflow-x-auto py-1 no-scrollbar min-w-0">
            <ChevronTracker />
          </div>

          {/* User Controls & Theme */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="btn-ghost btn-sm rounded-xl p-2 cursor-pointer"
              onClick={toggle}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <div
              className="flex items-center gap-1.5 rounded-xl border border-line bg-surface2/60 px-2.5 py-1 text-xs font-semibold text-ink select-none"
              title={user?.email}
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#10b981]/20 text-[10px] font-bold text-[#10b981]">
                {initials}
              </span>
              <span className="hidden max-w-[110px] truncate sm:inline">
                {user?.display_name || user?.email?.split('@')[0]}
              </span>
            </div>
            <button
              className="btn-ghost btn-sm rounded-xl px-2.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
              onClick={async () => {
                await logout()
                nav('/login')
              }}
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
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
