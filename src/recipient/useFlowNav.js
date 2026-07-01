import { useNavigate, useParams } from 'react-router-dom'
import { useConfig } from '../context/ConfigContext.jsx'

// Slug-aware navigation that respects which pages are enabled and their order.
// `currentId` is one of: 'landing' | <page id> | 'done'.
export function useFlowNav(currentId) {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { config } = useConfig()

  const enabled = config.pages.filter((p) => p.enabled).map((p) => p.id)
  const flow = ['landing', ...enabled, 'done']

  const pathFor = (id) => (id === 'landing' ? `/f/${slug}` : `/f/${slug}/${id}`)

  const idx = flow.indexOf(currentId)
  const nextId = idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : 'done'

  return {
    next: () => navigate(pathFor(nextId)),
    goTo: (id) => navigate(pathFor(id)),
    restart: () => navigate(`/f/${slug}`),
    nextId,
    // Step X of Y among the enabled middle pages (0 for landing/done).
    step: enabled.indexOf(currentId) + 1,
    total: enabled.length,
  }
}
