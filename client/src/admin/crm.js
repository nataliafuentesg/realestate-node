// Datos compartidos del CRM: etapas, colores, origenes y utilidades de formato.

export const STAGES = [
  { key: 'NEW', label: 'Nuevo', dot: 'bg-sky-400', chip: 'bg-sky-500/15 text-sky-300' },
  { key: 'CONTACTED', label: 'En conversación', dot: 'bg-yellow-400', chip: 'bg-yellow-500/15 text-yellow-300' },
  { key: 'MEETING', label: 'Reunión agendada', dot: 'bg-purple-400', chip: 'bg-purple-500/15 text-purple-300' },
  { key: 'PROPOSAL', label: 'Propuesta / negociación', dot: 'bg-orange-400', chip: 'bg-orange-500/15 text-orange-300' },
  { key: 'WON', label: 'Ganado', dot: 'bg-green-400', chip: 'bg-green-500/15 text-green-300' },
  { key: 'LOST', label: 'Perdido', dot: 'bg-zinc-500', chip: 'bg-zinc-500/20 text-zinc-300' },
]

export const PIPELINES = [
  { key: 'REAL_ESTATE', label: 'Inmobiliaria' },
  { key: 'AGENCY', label: 'Agencia' },
]

export const stageOf = (key) => STAGES.find((s) => s.key === key) ?? STAGES[0]

export function timeAgo(value) {
  if (!value) return ''
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 30) return `hace ${days} d`
  return new Date(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

export function formatMoney(value) {
  if (!value) return ''
  if (value >= 1_000_000) return '$' + (value / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M'
  return '$' + Math.round(value).toLocaleString('es-CO')
}

export function formatDate(value) {
  if (!value) return ''
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

export function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Ruta de la bandeja de cada canal para abrir la conversacion de un contacto.
export const CHANNEL_ROUTES = {
  whatsapp: '/admin/whatsapp',
  instagram: '/admin/instagram/dms',
  facebook: '/admin/facebook/dms',
}
