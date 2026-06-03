import { useState } from 'react'
import { applyTransformation, defaultOutputExtension } from '../lib/excel/apply'
import { pickExcelFile, saveExcelFile } from '../lib/platform/files'
import type { Transformation } from '../types/transformation'

interface ApplyTransformationModalProps {
  transformation: Transformation | null
  onClose: () => void
}

export function ApplyTransformationModal({
  transformation,
  onClose,
}: ApplyTransformationModalProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!transformation) return null

  function handleClose() {
    setFileName(null)
    setFileBuffer(null)
    setError(null)
    onClose()
  }

  async function pickSource() {
    const picked = await pickExcelFile('Исходный файл для трансформации')
    if (!picked) return
    setFileName(picked.name)
    setFileBuffer(picked.buffer)
    setError(null)
  }

  async function handleTransform() {
    if (!fileBuffer || !transformation) return
    const ext = defaultOutputExtension(transformation.recipe)
    const base = (fileName ?? 'отчет').replace(/\.(xls|xlsx)$/i, '')
    const defaultName = `${base}_итог.${ext}`

    setLoading(true)
    setError(null)
    try {
      const buffer = await applyTransformation(fileBuffer, transformation.recipe)
      const saved = await saveExcelFile(buffer, defaultName)
      if (saved) handleClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка трансформации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/25 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-amber-100">{transformation.name}</h2>
        <p className="mt-1 text-sm text-slate-400">Выберите исходник — итог сохранится через диалог.</p>

        <button
          type="button"
          onClick={() => void pickSource()}
          className="mt-6 flex w-full flex-col gap-2 rounded-xl border border-dashed border-amber-500/40 bg-slate-950/50 p-4 text-left"
        >
          <span className="text-sm text-slate-300">Исходный файл</span>
          <span className="text-xs text-slate-500">{fileName ?? 'Не выбран'}</span>
        </button>

        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={!fileBuffer || loading}
            onClick={() => void handleTransform()}
            className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 py-2.5 font-semibold text-slate-950 disabled:opacity-40"
          >
            {loading ? 'Трансформируем…' : 'Трансформируем'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-700 px-4 text-slate-400"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}
