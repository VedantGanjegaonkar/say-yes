import { createContext, useContext, useState } from 'react'

const PlanContext = createContext(null)

export function PlanProvider({ children }) {
  const [plan, setPlan] = useState({
    date: '',
    venue: '',
    fancy: '',
    drink: '',
    songs: [],
  })
  const update = (patch) => setPlan((p) => ({ ...p, ...patch }))
  return (
    <PlanContext.Provider value={{ plan, update }}>
      {children}
    </PlanContext.Provider>
  )
}

export function usePlan() {
  return useContext(PlanContext)
}
