// Utilidades de la agenda de reuniones virtuales (horarios en hora de Colombia).

export const KINDS = {
  PROPERTY_OWNER: {
    param: 'propiedad',
    title: 'Quiero publicar mi propiedad',
    subtitle: 'Vender o arrendar con Ventas Sabana',
  },
  AGENCY: {
    param: 'agencia',
    title: 'Quiero servicios de Marcapro',
    subtitle: 'Páginas web, redes, automatización y más',
  },
}

export function kindFromParam(param) {
  return Object.keys(KINDS).find((key) => KINDS[key].param === param) || null
}

// "15:30" -> "3:30 p. m."
export function formatSlot(time) {
  const [h, m] = time.split(':').map(Number)
  const period = h < 12 ? 'a. m.' : 'p. m.'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

// "2026-11-03" -> fecha local (sin pasar por UTC, que correria el dia).
export function parseDay(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDayShort(iso) {
  return parseDay(iso).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '')
}

export function formatDayLong(iso) {
  const text = parseDay(iso).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}
