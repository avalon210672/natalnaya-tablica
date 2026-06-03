import { PLANET_LABELS, PLANET_ORDER } from '../data/planets'
import { formatDegree, formatSign } from '../lib/format'
import type { NatalChart } from '../types/natal'

interface NatalTableProps {
  chart: NatalChart
}

export function NatalTable({ chart }: NatalTableProps) {
  const byPlanet = new Map(chart.positions.map((p) => [p.planet, p]))

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead className="bg-slate-900 text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Планета</th>
            <th className="px-4 py-3 font-medium">Знак</th>
            <th className="px-4 py-3 font-medium">Градус</th>
            <th className="px-4 py-3 font-medium">Дом</th>
            <th className="px-4 py-3 font-medium">Ретроград</th>
          </tr>
        </thead>
        <tbody>
          {PLANET_ORDER.map((planetId) => {
            const row = byPlanet.get(planetId)
            if (!row) return null
            return (
              <tr key={planetId} className="border-t border-slate-800 even:bg-slate-900/40">
                <td className="px-4 py-3 font-medium text-slate-100">
                  {PLANET_LABELS[planetId]}
                </td>
                <td className="px-4 py-3">{formatSign(row.sign)}</td>
                <td className="px-4 py-3 tabular-nums">{formatDegree(row.degree)}</td>
                <td className="px-4 py-3 tabular-nums">{row.house}</td>
                <td className="px-4 py-3">{row.retrograde ? 'Да' : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="border-t border-slate-800 px-4 py-2 text-xs text-slate-500">
        Демо-данные. Расчёт: {new Date(chart.calculatedAt).toLocaleString('ru-RU')}
      </p>
    </div>
  )
}
