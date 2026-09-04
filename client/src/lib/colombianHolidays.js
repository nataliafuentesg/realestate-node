// Calcula los festivos de Colombia por ano (Ley Emiliani: varios festivos
// se trasladan al lunes siguiente si no caen en lunes).

function getEasterSunday(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function moveToNextMonday(date) {
  const result = new Date(date)
  while (result.getDay() !== 1) {
    result.setDate(result.getDate() + 1)
  }
  return result
}

// OJO: NO usar toISOString() aca -- convierte a UTC, y con Colombia en
// UTC-5 cualquier hora local despues de las 7pm se corre al dia
// siguiente. Se arma el string a mano con los componentes locales.
function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getColombianHolidays(year) {
  const easter = getEasterSunday(year)

  const fixed = [
    new Date(year, 0, 1), // Ano Nuevo
    new Date(year, 4, 1), // Dia del Trabajo
    new Date(year, 6, 20), // Independencia
    new Date(year, 7, 7), // Batalla de Boyaca
    new Date(year, 11, 8), // Inmaculada Concepcion
    new Date(year, 11, 25), // Navidad
    addDays(easter, -3), // Jueves Santo
    addDays(easter, -2), // Viernes Santo
  ]

  const movedToMonday = [
    new Date(year, 0, 6), // Reyes Magos
    new Date(year, 2, 19), // San Jose
    addDays(easter, 39), // Ascension del Senor
    addDays(easter, 60), // Corpus Christi
    addDays(easter, 68), // Sagrado Corazon
    new Date(year, 5, 29), // San Pedro y San Pablo
    new Date(year, 7, 15), // Asuncion de la Virgen
    new Date(year, 9, 12), // Dia de la Raza
    new Date(year, 10, 1), // Todos los Santos
    new Date(year, 10, 11), // Independencia de Cartagena
  ].map(moveToNextMonday)

  return [...fixed, ...movedToMonday].map(toISODate)
}

// Primer dia habil para agendar: hoy + minDaysAhead, sin caer domingo ni
// festivo (si cae en uno, se corre al siguiente dia valido).
export function getMinVisitDate(minDaysAhead = 2) {
  let date = addDays(new Date(), minDaysAhead)
  const holidays = new Set([...getColombianHolidays(date.getFullYear()), ...getColombianHolidays(date.getFullYear() + 1)])

  while (date.getDay() === 0 || holidays.has(toISODate(date))) {
    date = addDays(date, 1)
  }
  return toISODate(date)
}

export function isValidVisitDate(isoDate, minDaysAhead = 2) {
  if (!isoDate) return false
  const date = new Date(isoDate + 'T00:00:00')
  const minDate = new Date(getMinVisitDate(minDaysAhead) + 'T00:00:00')

  if (date < minDate) return false
  if (date.getDay() === 0) return false

  const holidays = getColombianHolidays(date.getFullYear())
  if (holidays.includes(isoDate)) return false

  return true
}
