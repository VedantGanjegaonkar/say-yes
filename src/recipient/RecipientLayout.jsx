import { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { ConfigProvider, mergeConfig } from '../context/ConfigContext.jsx'
import { PlanProvider } from '../context/PlanContext.jsx'
import NotFound from '../pages/NotFound.jsx'
import '../pages/shared.css'

export default function RecipientLayout() {
  const { slug } = useParams()
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data, error } = await supabase.rpc('get_form_by_slug', { p_slug: slug })
      if (!alive) return
      if (error) {
        setState({ status: 'error', message: error.message })
        return
      }
      const row = data && data[0]
      if (!row) {
        setState({ status: 'notfound' })
        return
      }
      setState({ status: 'ready', config: mergeConfig(row.config), formId: row.id })
    })()
    return () => {
      alive = false
    }
  }, [slug])

  if (state.status === 'loading') {
    return (
      <main className="page">
        <div className="card">
          <div className="emoji">🐸</div>
          <p className="subtitle">Loading…</p>
        </div>
      </main>
    )
  }

  if (state.status === 'notfound') return <NotFound />

  if (state.status === 'error') {
    return (
      <main className="page">
        <div className="card">
          <div className="emoji">😵</div>
          <h1 className="title">Something went wrong</h1>
          <p className="subtitle">{state.message}</p>
        </div>
      </main>
    )
  }

  return (
    <ConfigProvider value={{ config: state.config, formId: state.formId, slug }}>
      <PlanProvider>
        <Outlet />
      </PlanProvider>
    </ConfigProvider>
  )
}
