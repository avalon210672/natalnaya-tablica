import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <h1 className="text-2xl font-semibold tracking-tight text-amber-200">
            Натальная таблица
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Положения планет в знаках зодиака — табличный вид натальной карты
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
