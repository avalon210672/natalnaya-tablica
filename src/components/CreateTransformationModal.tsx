import { useState } from 'react'
import { TransformationPairError } from '../lib/excel/validate'
import { learnTransformationFromPair } from '../lib/excel/learn'
import { pickExcelFile } from '../lib/platform/files'
import type { StructureTransformationRecipe } from '../types/transformation'

interface CreateTransformationModalProps {
  open: boolean
  onClose: () => void
  onCreated: (name: string, recipe: StructureTransformationRecipe) => void
}

export function CreateTransformationModal({
  open,
  onClose,
  onCreated,
}: CreateTransformationModalProps) {
  const [sourceName, setSourceName] = useState<string | null>(null)
  const [targetName, setTargetName] = useState<string | null>(null)
  const [sourceBuffer, setSourceBuffer] = useState<ArrayBuffer | null>(null)
  const [targetBuffer, setTargetBuffer] = useState<ArrayBuffer | null>(null)
  const [name, setName] = useState('')
  const [step, setStep] = useState<'upload' | 'name'>('upload')
  const [recipe, setRecipe] = useState<StructureTransformationRecipe | null>(null)
  const [macroWarning, setMacroWarning] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string[]>([])

  if (!open) return null

  function reset() {
    setSourceName(null)
    setTargetName(null)
    setSourceBuffer(null)
    setTargetBuffer(null)
    setName('')
    setStep('upload')
    setRecipe(null)
    setMacroWarning(null)
    setError(null)
    setErrorDetails([])
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function pickSource() {
    const picked = await pickExcelFile('Исходный файл')
    if (!picked) return
    setSourceName(picked.name)
    setSourceBuffer(picked.buffer)
    setError(null)
    setErrorDetails([])
  }

  async function pickTarget() {
    const picked = await pickExcelFile('Итоговый файл (эталон)')
    if (!picked) return
    setTargetName(picked.name)
    setTargetBuffer(picked.buffer)
    setError(null)
    setErrorDetails([])
  }

  async function handleCreate() {
    if (!sourceBuffer || !targetBuffer) return
    setLoading(true)
    setError(null)
    setErrorDetails([])
    try {
      const result = await learnTransformationFromPair(sourceBuffer, targetBuffer)
      setRecipe(result.recipe)
      setMacroWarning(
        result.warnings.find((w) => w.includes('макрос')) ?? null,
      )
      setStep('name')
      if (!name) setName(`Трансформация ${new Date().toLocaleDateString('ru-RU')}`)
    } catch (e) {
      if (e instanceof TransformationPairError) {
        setError(e.message)
        setErrorDetails(e.reasons)
      } else {
        setError(e instanceof Error ? e.message : 'Не удалось создать трансформацию')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleSave() {
    if (!recipe || !name.trim()) return
    onCreated(name.trim(), recipe)
    handleClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-violet-500/30 bg-slate-900 p-6 shadow-2xl"
      >
        <h2 className="text-xl font-semibold text-amber-100">Новая трансформация</h2>
        <p className="mt-1 text-sm text-slate-400">
          Загрузите исходник и эталон. Если файлы не «бьются» — объясним, почему рецепт не
          создаётся.
        </p>

        {step === 'upload' && (
          <div className="mt-6 space-y-4">
            <FilePickButton label="Исходный файл" fileName={sourceName} onClick={() => void pickSource()} />
            <FilePickButton
              label="Итоговый файл (эталон)"
              fileName={targetName}
              onClick={() => void pickTarget()}
            />
            {error && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
                <p className="font-medium whitespace-pre-line">{error}</p>
                {errorDetails.length > 1 && (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-rose-200/90">
                    {errorDetails.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                disabled={!sourceBuffer || !targetBuffer || loading}
                onClick={() => void handleCreate()}
                className="flex-1 rounded-xl bg-amber-500 py-2.5 font-medium text-slate-950 disabled:opacity-40"
              >
                {loading ? 'Проверяем пару…' : 'Создать трансформацию'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-slate-400"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {step === 'name' && recipe && (
          <div className="mt-6 space-y-4">
            <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Пара файлов совместима — рецепт готов.
            </p>
            {macroWarning && (
              <p className="text-xs text-amber-200/80">⚠ {macroWarning}</p>
            )}
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Название трансформации</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                autoFocus
              />
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 rounded-xl bg-violet-600 py-2.5 font-medium text-white hover:bg-violet-500"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('upload')
                  setRecipe(null)
                }}
                className="rounded-xl border border-slate-700 px-4 text-slate-400"
              >
                Назад
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FilePickButton({
  label,
  fileName,
  onClick,
}: {
  label: string
  fileName: string | null
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-2 rounded-xl border border-dashed border-violet-500/40 bg-slate-950/50 p-4 text-left transition hover:border-amber-400/50"
    >
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <span className="text-xs text-slate-500">
        {fileName ?? 'Нажмите, чтобы выбрать .xls или .xlsx'}
      </span>
    </button>
  )
}
