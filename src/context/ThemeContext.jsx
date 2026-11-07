import { createContext, useContext, useEffect, useState } from 'react'

const Ctx = createContext({ theme: 'dark', toggle: () => {} })
export const useTheme = () => useContext(Ctx)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('fkg-theme')
      if (saved) return saved
      return 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('fkg-theme', theme)
      if (theme === 'dark') {
        localStorage.setItem('fkg-user-chose-dark', 'true')
      } else {
        localStorage.setItem('fkg-user-chose-dark', 'false')
      }
    } catch { /* private mode */ }
  }, [theme])

  return (
    <Ctx.Provider value={{ theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), setTheme }}>
      {children}
    </Ctx.Provider>
  )
}
