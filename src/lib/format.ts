import type { ZodiacSignId } from '../types/natal'
import { ZODIAC_LABELS } from '../data/planets'

export function formatDegree(degree: number): string {
  const normalized = ((degree % 30) + 30) % 30
  const deg = Math.floor(normalized)
  const min = Math.floor((normalized - deg) * 60)
  return `${deg}°${String(min).padStart(2, '0')}'`
}

export function formatSign(sign: ZodiacSignId): string {
  return ZODIAC_LABELS[sign]
}
