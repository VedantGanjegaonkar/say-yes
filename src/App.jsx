import { Routes, Route } from 'react-router-dom'
import { PlanProvider } from './context/PlanContext.jsx'
import Landing from './pages/Landing.jsx'
import DatePick from './pages/DatePick.jsx'
import Wheel from './pages/Wheel.jsx'
import Budget from './pages/Budget.jsx'
import Drinks from './pages/Drinks.jsx'
import Playlist from './pages/Playlist.jsx'
import Done from './pages/Done.jsx'

export default function App() {
  return (
    <PlanProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/page-1" element={<DatePick />} />
        <Route path="/page-2" element={<Wheel />} />
        <Route path="/page-3" element={<Budget />} />
        <Route path="/page-4" element={<Drinks />} />
        <Route path="/page-5" element={<Playlist />} />
        <Route path="/done" element={<Done />} />
      </Routes>
    </PlanProvider>
  )
}
