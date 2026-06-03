import type { Transformation } from '../types/transformation'

interface TransformationTileProps {
  transformation: Transformation
  onTransform: () => void
  onDelete: () => void
}

export function TransformationTile({
  transformation,
  onTransform,
  onDelete,
}: TransformationTileProps) {
  const created = new Date(transformation.createdAt).toLocaleDateString('ru-RU')
  const cols = transformation.recipe.columnMappings.length

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-violet-950/40 p-5 shadow-lg shadow-violet-950/20 transition hover:border-amber-400/40 hover:shadow-amber-900/10">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl" />
      <h3 className="text-lg font-semibold text-amber-100">{transformation.name}</h3>
      <p className="mt-1 text-xs text-slate-400">
        Лист «{transformation.recipe.sheetName}» · {cols} колонок · {created}
      </p>
      <p className="mt-2 flex-1 text-sm text-slate-500">
        {transformation.recipe.rowFilter.description}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onTransform}
          className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:from-amber-400 hover:to-amber-300"
        >
          Трансформируем
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl border border-slate-700 px-3 py-2.5 text-sm text-slate-400 transition hover:border-rose-500/50 hover:text-rose-300"
          title="Удалить"
        >
          ✕
        </button>
      </div>
    </article>
  )
}
