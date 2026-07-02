import { useEffect, useRef } from 'react'
import {
  MemoryRouter,
  Routes,
  Route,
  Outlet,
  useNavigate,
  UNSAFE_LocationContext,
  UNSAFE_RouteContext,
} from 'react-router-dom'
import { ConfigProvider, mergeConfig } from '../context/ConfigContext.jsx'
import { PlanProvider } from '../context/PlanContext.jsx'
import Landing from '../pages/Landing.jsx'
import DatePick from '../pages/DatePick.jsx'
import Wheel from '../pages/Wheel.jsx'
import Budget from '../pages/Budget.jsx'
import Drinks from '../pages/Drinks.jsx'
import Playlist from '../pages/Playlist.jsx'
import Done from '../pages/Done.jsx'

const PATHS = {
  landing: '/f/preview',
  datepick: '/f/preview/datepick',
  wheel: '/f/preview/wheel',
  budget: '/f/preview/budget',
  drinks: '/f/preview/drinks',
  playlist: '/f/preview/playlist',
  done: '/f/preview/done',
}

// Snaps the preview to the page for the current wizard step, but leaves the
// visitor free to click through the flow inside the preview between steps.
function PreviewNavigator({ page }) {
  const navigate = useNavigate()
  const prev = useRef(null)
  useEffect(() => {
    if (prev.current !== page) {
      prev.current = page
      navigate(PATHS[page] || '/f/preview')
    }
  }, [page, navigate])
  return null
}

// Empty route-match context: clears the parent route's pathnameBase so the
// preview's own <Routes> match its MemoryRouter location (/f/preview) from a
// clean base, regardless of which app route (e.g. /build) the builder sits on.
const EMPTY_ROUTE_CONTEXT = { outlet: null, matches: [], isDataRoute: false }

export default function PreviewPane({ config, page }) {
  const merged = mergeConfig(config)
  return (
    // Reset LocationContext so the isolated preview MemoryRouter isn't seen as
    // nested inside the app's BrowserRouter (React Router forbids nested Routers),
    // and reset RouteContext so the inner routes don't inherit /build's base.
    <UNSAFE_LocationContext.Provider value={null}>
      <UNSAFE_RouteContext.Provider value={EMPTY_ROUTE_CONTEXT}>
        <MemoryRouter initialEntries={[PATHS[page] || '/f/preview']}>
          <ConfigProvider value={{ config: merged, formId: 'preview', slug: 'preview', preview: true }}>
            <PlanProvider>
              <Routes>
                <Route path="/f/:slug" element={<Outlet />}>
                  <Route index element={<Landing />} />
                  <Route path="datepick" element={<DatePick />} />
                  <Route path="wheel" element={<Wheel />} />
                  <Route path="budget" element={<Budget />} />
                  <Route path="drinks" element={<Drinks />} />
                  <Route path="playlist" element={<Playlist />} />
                  <Route path="done" element={<Done />} />
                </Route>
              </Routes>
              <PreviewNavigator page={page} />
            </PlanProvider>
          </ConfigProvider>
        </MemoryRouter>
      </UNSAFE_RouteContext.Provider>
    </UNSAFE_LocationContext.Provider>
  )
}
