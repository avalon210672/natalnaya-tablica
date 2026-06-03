import { useEffect, useState } from 'react'
import { APP_NAME, pickTagline } from '../data/branding'
import { ApplyTransformationModal } from '../components/ApplyTransformationModal'
import { CreateTransformationModal } from '../components/CreateTransformationModal'
import { TransformationTile } from '../components/TransformationTile'
import { isTauri } from '../lib/platform/env'
import {
  createId,
  deleteTransformation,
  invalidateTransformationsCache,
  listTransformations,
  saveTransformation,
} from '../lib/transformations/storage'
import type { StructureTransformationRecipe, Transformation } from '../types/transformation'

export function Home() {
  const [transformations, setTransformations] = useState<Transformation[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [applyTarget, setApplyTarget] = useState<Transformation | null>(null)
  const [tagline] = useState(() => pickTagline())
  const [loadingList, setLoadingList] = useState(true)

  async function refresh() {
    invalidateTransformationsCache()
    setTransformations(await listTransformations())
    setLoadingList(false)
  }

  useEffect(() => {
    let cancelled = false
    invalidateTransformationsCache()
    void listTransformations().then((list) => {
      if (!cancelled) {
        setTransformations(list)
        setLoadingList(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCreated(name: string, recipe: StructureTransformationRecipe) {
    const t: Transformation = {
      id: createId(),
      name,
      createdAt: new Date().toISOString(),
      recipe,
    }
    await saveTransformation(t)
    await refresh()
  }

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/50 via-slate-900/80 to-slate-950 px-6 py-10 sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent" />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300/80">
            {isTauri() ? 'Локальное приложение' : 'Локально в браузере'}
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-transparent bg-gradient-to-r from-amber-200 via-amber-100 to-violet-200 bg-clip-text sm:text-4xl">
            {APP_NAME}
          </h2>
          <p className="mt-3 max-w-xl text-base text-slate-300">{tagline}</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-500">
            Загрузите исходник и эталон — если структура не совпадает, трансформация не создастся,
            с понятным объяснением. Иначе — плитка и кнопка «Трансформируем».
          </p>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-medium text-slate-200">Ваши трансформации</h3>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-xl border border-violet-500/40 bg-violet-600/20 px-5 py-2.5 text-sm font-medium text-violet-100 transition hover:border-amber-400/50 hover:bg-violet-600/40"
        >
          + Создать трансформацию
        </button>
      </section>

      {loadingList ? (
        <p className="text-sm text-slate-500">Загрузка…</p>
      ) : transformations.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-6 py-14 text-center">
          <p className="text-6xl opacity-30" aria-hidden>
            ✦
          </p>
          <p className="mt-4 text-slate-400">
            Пока пусто — как дом Лунный до первого исходника.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Загрузите пару файлов — если они совместимы, появится плитка.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {transformations.map((t) => (
            <TransformationTile
              key={t.id}
              transformation={t}
              onTransform={() => setApplyTarget(t)}
              onDelete={() => {
                if (window.confirm(`Удалить «${t.name}»?`)) {
                  void deleteTransformation(t.id).then(refresh)
                }
              }}
            />
          ))}
        </div>
      )}

      <CreateTransformationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(name, recipe) => void handleCreated(name, recipe)}
      />
      <ApplyTransformationModal
        transformation={applyTarget}
        onClose={() => setApplyTarget(null)}
      />
    </div>
  )
}
