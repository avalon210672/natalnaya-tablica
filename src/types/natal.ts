export type PlanetId =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'
  | 'north_node'
  | 'south_node'
  | 'chiron'

export type ZodiacSignId =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces'

export interface BirthData {
  date: string
  time: string
  place: string
  timezone: string
}

export interface PlanetPosition {
  planet: PlanetId
  sign: ZodiacSignId
  degree: number
  house: number
  retrograde: boolean
}

export interface NatalChart {
  birth: BirthData
  positions: PlanetPosition[]
  calculatedAt: string
}
