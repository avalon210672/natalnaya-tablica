export const APP_NAME = 'Натальная Таблица'

export const TAGLINES = [
  'Судьба вашего Excel предрешена — колонками управляете вы',
  'Рождены под знаком «Исходник» — восходите в «Итог»',
  'Аспект Меркурия благоприятен для слияния ячеек',
  'Дом седьмой пуст, зато в восьмом — штатная должность',
  'Ретроградный макрос не помеха чистой трансформации',
] as const

export function pickTagline(seed = Date.now()): string {
  return TAGLINES[seed % TAGLINES.length]
}
