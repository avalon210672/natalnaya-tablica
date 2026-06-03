import type { ReactNode } from 'react'
import { ConstellationBackground } from './ConstellationBackground'
import { APP_NAME } from '../data/branding'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="relative min-h-screen">
      <ConstellationBackground />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_20%_0%,_rgba(139,92,246,0.12),_transparent_50%),radial-gradient(circle_at_80%_100%,_rgba(245,158,11,0.08),_transparent_45%)]" />
      <header className="relative z-10 border-b border-violet-500/20 bg-slate-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-violet-600 text-lg font-bold text-slate-950 shadow-lg shadow-violet-900/40"
            aria-hidden
          >
            ✦
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-amber-100">
              {APP_NAME}
            </h1>
            <p className="text-xs text-slate-500">
              Трансформация Excel по звёздному рецепту · только на вашем компьютере
            </p>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
