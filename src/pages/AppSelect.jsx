import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react'
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

  const choose = async (key) => {
    setBusy(key)
    try {
      await apps.select(key)
      await refreshUser()
      nav('/fmcg')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  const appList = data?.apps?.length
    ? data.apps.map((a) => ({
        ...a,
        name: a.name.replace(/Finance/gi, 'FMCG'),
        description: a.description.replace(/Finance/gi, 'FMCG'),
      }))
    : [
        {
          key: 'fmcg',
          name: 'FMCG Knowledge Graph',
          description:
            'End-to-end Fast-Moving Consumer Goods enterprise ontology spanning 9 domains: RtM, Trade & Promotions, Marketing, Supply Chain, Manufacturing, NPD, Finance, E-commerce, and Data Foundation.',
        },
      ]

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Choose an application</h1>
        <p className="text-sm text-muted">
          Step 1 of the workflow — select the FMCG enterprise sector to explore and customize your knowledge graph.
        </p>
      </div>
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      <div className="grid gap-4 sm:grid-cols-2">
        {appList.map((a) => (
          <button
            key={a.key}
            onClick={() => choose(a.key)}
            disabled={!!busy}
            className="card group p-6 text-left transition hover:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand text-brand-ink">
                <ShoppingBag />
              </span>
              <div>
                <div className="flex items-center gap-2 text-lg font-semibold">
                  {a.name}
                  <span className="badge bg-ok/15 text-ok">
                    <Sparkles size={11} className="mr-1" />
                    FMCG
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {user?.selected_app === a.key ? 'Currently selected' : 'Full Value-Chain Model'}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">{a.description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">
              {busy === a.key ? 'Opening…' : user?.selected_app === a.key ? 'Continue' : 'Select FMCG'}
              <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </span>
          </button>
        ))}
      </div>
    </Layout>
  )
}
