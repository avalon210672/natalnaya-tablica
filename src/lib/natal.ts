import type { BirthData, NatalChart, PlanetPosition } from '../types/natal'

/**
 * TODO: подключить астрономическую библиотеку (например swisseph / astronomy-engine)
 * для расчёта реальных эфемерид по дате, времени, координатам и часовому поясу.
 */
export function calculateNatalChart(birthData: BirthData): NatalChart {
  const demoPositions: PlanetPosition[] = [
    { planet: 'sun', sign: 'aries', degree: 12.34, house: 10, retrograde: false },
    { planet: 'moon', sign: 'cancer', degree: 5.5, house: 1, retrograde: false },
    { planet: 'mercury', sign: 'pisces', degree: 28.1, house: 9, retrograde: true },
    { planet: 'venus', sign: 'taurus', degree: 18.0, house: 11, retrograde: false },
    { planet: 'mars', sign: 'gemini', degree: 3.75, house: 12, retrograde: false },
    { planet: 'jupiter', sign: 'leo', degree: 22.2, house: 2, retrograde: false },
    { planet: 'saturn', sign: 'capricorn', degree: 14.9, house: 7, retrograde: false },
    { planet: 'uranus', sign: 'aquarius', degree: 7.3, house: 8, retrograde: false },
    { planet: 'neptune', sign: 'pisces', degree: 19.8, house: 9, retrograde: false },
    { planet: 'pluto', sign: 'scorpio', degree: 11.0, house: 5, retrograde: true },
    { planet: 'north_node', sign: 'libra', degree: 6.4, house: 4, retrograde: true },
    { planet: 'south_node', sign: 'aries', degree: 6.4, house: 10, retrograde: true },
    { planet: 'chiron', sign: 'virgo', degree: 9.15, house: 3, retrograde: false },
  ]

  return {
    birth: birthData,
    positions: demoPositions,
    calculatedAt: new Date().toISOString(),
  }
}
