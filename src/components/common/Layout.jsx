import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Brain, LogOut, Moon, Sun, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function Layout({ children, wide }) {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const nav = useNavigate()
  const location = useLocation()

  const isFinance = location.pathname.startsWith('/finance') || user?.selected_app === 'finance'
  const subTitle = isFinance ? 'FINANCE KG' : 'FMCG KG'

  return (
    <div className="flex min-h-full flex-col bg-bg text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1800px] items-center gap-3 px-3 sm:px-6">
          <Link to={user?.selected_app ? '/fmcg' : '/apps'} className="flex items-center gap-2.5 font-semibold group select-none">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#10b981] text-black shadow-sm transition-transform duration-150 group-hover:scale-105">
              <Brain size={18} strokeWidth={2.4} className="text-black" />
            </span>
            <div className="flex flex-col text-left leading-none">
              <span className="text-[15px] font-bold tracking-tight text-ink">AgentForgeXFMCG</span>
              <span className="text-[9.5px] font-bold tracking-widest text-[#10b981] uppercase mt-0.5">
                {subTitle}
              </span>
            </div>
          </Link>
          
          <div className="ml-auto flex items-center gap-2">
            <button className="btn-ghost btn-sm" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div
              className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-[#10b981]/30 bg-[#10b981]/10 px-2.5 py-1 text-xs shadow-2xs transition-colors hover:border-[#10b981]/50 hover:bg-[#10b981]/15 select-none"
              title={user?.email}
            >
              <span className="grid h-5 w-5 place-items-center rounded-lg bg-[#10b981] text-black shadow-2xs">
                <User size={12} strokeWidth={2.6} className="text-black" />
              </span>
              <span className="max-w-[140px] truncate font-semibold text-[#10b981] hover:text-[#6ee7b7] transition-colors">
                {user?.display_name || user?.email}
              </span>
            </div>
            <button className="btn-ghost btn-sm" onClick={async () => { await logout(); nav('/login') }}><LogOut size={16} /></button>
          </div>
        </div>
      </header>
      <main className={`mx-auto w-full flex-1 px-3 py-5 sm:px-6 ${wide ? 'max-w-[1800px]' : 'max-w-6xl'}`}>{children}</main>
    </div>
  )
}
