import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { coreZh, coreEn } from './core'
import { insZh, insEn } from './insurer'
import { prodZh, prodEn } from './product'
import { coopZh, coopEn } from './coop'
import { apptZh, apptEn } from './compliance'

export type Lang = 'zh' | 'en'

// ─── Merged translation dictionary (one source object per module) ────────────

const zh = { ...coreZh, ...insZh, ...prodZh, ...coopZh, ...apptZh }
const en: typeof zh = { ...coreEn, ...insEn, ...prodEn, ...coopEn, ...apptEn }

const dict: Record<Lang, typeof zh> = { zh, en }

export type T = typeof zh

// ─── Context ──────────────────────────────────────────────────────────────────

const LangContext = createContext<{
  lang: Lang
  t: T
  setLang: (l: Lang) => void
}>({
  lang: 'zh',
  t: dict.zh,
  setLang: () => {},
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem('insure-os-lang') as Lang) ?? 'zh' } catch { return 'zh' }
  })

  useEffect(() => {
    try { localStorage.setItem('insure-os-lang', lang) } catch {}
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, t: dict[lang], setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
