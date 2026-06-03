import { useState, type FormEvent } from 'react'
import type { BirthData } from '../types/natal'

interface BirthFormProps {
  onSubmit: (data: BirthData) => void
  initial?: BirthData
}

const defaultBirth: BirthData = {
  date: '1990-04-15',
  time: '14:30',
  place: 'Москва',
  timezone: 'Europe/Moscow',
}

export function BirthForm({ onSubmit, initial }: BirthFormProps) {
  const [form, setForm] = useState<BirthData>(initial ?? defaultBirth)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5 sm:grid-cols-2"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-400">Дата рождения</span>
        <input
          type="date"
          required
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-400">Время</span>
        <input
          type="time"
          required
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="text-slate-400">Место (город)</span>
        <input
          type="text"
          required
          value={form.place}
          onChange={(e) => setForm({ ...form, place: e.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          placeholder="Город рождения"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="text-slate-400">Часовой пояс (IANA)</span>
        <input
          type="text"
          required
          value={form.timezone}
          onChange={(e) => setForm({ ...form, timezone: e.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          placeholder="Europe/Moscow"
        />
      </label>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-slate-950 hover:bg-amber-400"
        >
          Рассчитать таблицу
        </button>
      </div>
    </form>
  )
}
