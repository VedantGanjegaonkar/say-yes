import { createContext, useContext } from 'react'
import { DEFAULT_CONFIG } from '../lib/defaults.js'

const ConfigContext = createContext(null)

// Deep-merge a (possibly partial / older-version) stored config over the
// defaults so pages can always assume the full shape exists.
export function mergeConfig(cfg) {
  if (!cfg) return DEFAULT_CONFIG
  const content = {}
  for (const key of Object.keys(DEFAULT_CONFIG.content)) {
    content[key] = { ...DEFAULT_CONFIG.content[key], ...(cfg.content?.[key] || {}) }
  }
  return {
    ...DEFAULT_CONFIG,
    ...cfg,
    sticker: { ...DEFAULT_CONFIG.sticker, ...(cfg.sticker || {}) },
    pages: cfg.pages?.length ? cfg.pages : DEFAULT_CONFIG.pages,
    content,
  }
}

// value = { config, formId, slug }
export function ConfigProvider({ value, children }) {
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfig must be used inside a ConfigProvider')
  return ctx
}
