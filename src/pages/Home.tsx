import { useMemo, useState } from 'react'
import { BirthForm } from '../components/BirthForm'
import { NatalTable } from '../components/NatalTable'
import type { BirthData, NatalChart } from '../types/natal'
import { calculateNatalChart } from '../lib/natal'

export function Home() {
  const [birth, setBirth] = useState<BirthData | null>(null)

  const chart: NatalChart | null = useMemo(() => {
    if (!birth) return null
    return calculateNatalChart(birth)
  }, [birth])

  return (
    <div className="space-y-8">
      <BirthForm onSubmit={setBirth} initial={birth ?? undefined} />
      {chart ? (
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-slate-200">Натальная таблица</h2>
          <NatalTable chart={chart} />
        </section>
      ) : (
        <p className="text-sm text-slate-500">
          Укажите данные рождения и нажмите «Рассчитать таблицу».
        </p>
      )}
    </div>
  )
}
