import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Builder from './builder/Builder.jsx'
import RecipientLayout from './recipient/RecipientLayout.jsx'
import Landing from './pages/Landing.jsx'
import DatePick from './pages/DatePick.jsx'
import Wheel from './pages/Wheel.jsx'
import Budget from './pages/Budget.jsx'
import Drinks from './pages/Drinks.jsx'
import Playlist from './pages/Playlist.jsx'
import Done from './pages/Done.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      {/* marketing landing page */}
      <Route path="/" element={<Home />} />

      {/* view1 — the builder (trailing /* so the builder's descendant
          <Routes> preview pane doesn't trip React Router's warning) */}
      <Route path="/build/*" element={<Builder />} />

      {/* view2 — the recipient flow, driven by the saved config for :slug */}
      <Route path="/f/:slug" element={<RecipientLayout />}>
        <Route index element={<Landing />} />
        <Route path="datepick" element={<DatePick />} />
        <Route path="wheel" element={<Wheel />} />
        <Route path="budget" element={<Budget />} />
        <Route path="drinks" element={<Drinks />} />
        <Route path="playlist" element={<Playlist />} />
        <Route path="done" element={<Done />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
