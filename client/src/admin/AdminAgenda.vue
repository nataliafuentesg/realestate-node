<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Video, Trash2, CalendarX, Link2 } from '@lucide/vue'
import api from '../api/axios'

const route = useRoute()
const appointments = ref([])
const blocks = ref([])
const google = ref({ configured: false, connected: false, account: '' })
const loading = ref(true)
const error = ref('')
const info = ref('')
const busyId = ref(null)

const blockForm = ref({ date: '', allDay: true, from: '15:00', to: '18:00', reason: '' })

const KIND_STYLES = {
  PROPERTY_OWNER: 'bg-mp-primary/15 text-mp-primary-hover',
  AGENCY: 'bg-blue-500/15 text-blue-400',
}

const upcoming = computed(() => appointments.value.filter((a) => a.status === 'CONFIRMED'))
const cancelledList = computed(() => appointments.value.filter((a) => a.status === 'CANCELLED').slice(-5))

const groups = computed(() => {
  const map = new Map()
  for (const a of upcoming.value) {
    const day = a.startAt.slice(0, 10)
    if (!map.has(day)) map.set(day, [])
    map.get(day).push(a)
  }
  return [...map.entries()].map(([day, items]) => ({ day, items }))
})

function dayLabel(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const text = new Date(y, m - 1, d).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function timeLabel(iso) {
  const [h, min] = iso.slice(11, 16).split(':').map(Number)
  return `${h % 12 === 0 ? 12 : h % 12}:${String(min).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`
}

function blockLabel(b) {
  const start = b.startAt.slice(0, 10)
  const same = start === b.endAt.slice(0, 10)
  return same ? `${dayLabel(start)}, ${timeLabel(b.startAt)} a ${timeLabel(b.endAt)}` : `${dayLabel(start)} a ${dayLabel(b.endAt.slice(0, 10))}`
}

function whatsappLink(phone) {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits.length === 10 ? '57' + digits : digits}`
}

async function load() {
  error.value = ''
  try {
    const [a, b, g] = await Promise.all([
      api.get('/admin/appointments'),
      api.get('/admin/availability-blocks'),
      api.get('/admin/google/status'),
    ])
    appointments.value = a.data
    blocks.value = b.data
    google.value = g.data
  } catch (err) {
    error.value = 'No se pudo cargar la agenda.'
  } finally {
    loading.value = false
  }
}

async function cancel(a) {
  if (!confirm(`¿Cancelar la cita de ${a.name}? Se le avisará por correo si estaba en Google Calendar.`)) return
  busyId.value = a.id
  try {
    await api.post(`/admin/appointments/${a.id}/cancel`)
    await load()
  } catch (err) {
    error.value = 'No se pudo cancelar la cita.'
  } finally {
    busyId.value = null
  }
}

async function addBlock() {
  const f = blockForm.value
  if (!f.date) {
    error.value = 'Elige el día que quieres bloquear.'
    return
  }
  error.value = ''
  try {
    await api.post('/admin/availability-blocks', {
      startAt: `${f.date}T${f.allDay ? '00:00' : f.from}:00`,
      endAt: f.allDay ? `${f.date}T23:59:00` : `${f.date}T${f.to}:00`,
      reason: f.reason,
    })
    blockForm.value = { date: '', allDay: true, from: '15:00', to: '18:00', reason: '' }
    await load()
  } catch (err) {
    error.value = err.response?.data?.message || 'No se pudo bloquear ese horario.'
  }
}

async function removeBlock(b) {
  try {
    await api.delete(`/admin/availability-blocks/${b.id}`)
    await load()
  } catch (err) {
    error.value = 'No se pudo quitar el bloqueo.'
  }
}

async function connectGoogle() {
  try {
    const res = await api.get('/admin/google/connect-url')
    window.location.href = res.data.url
  } catch (err) {
    error.value = err.response?.data?.message || 'No se pudo iniciar la conexión con Google.'
  }
}

async function disconnectGoogle() {
  if (!confirm('¿Desconectar Google Calendar? Las nuevas citas quedarán sin enlace de Meet.')) return
  await api.delete('/admin/google/connection')
  await load()
}

onMounted(() => {
  const result = route.query.google
  if (result === 'connected') info.value = '✅ Google Calendar quedó conectado. Las nuevas citas llevarán su propio enlace de Meet.'
  else if (result === 'denied') error.value = 'No se dio el permiso en Google.'
  else if (result === 'error') error.value = 'Google rechazó la conexión. Intenta de nuevo.'
  load()
})

const inputClass =
  'rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2 text-sm text-mp-fg focus:border-mp-primary focus:outline-none'
</script>

<template>
  <div class="font-[family-name:var(--font-mp-body)]">
    <h1 class="font-[family-name:var(--font-mp-heading)] text-2xl font-medium text-mp-fg">📅 Agenda</h1>
    <p class="mt-1 text-sm text-mp-muted">Reuniones virtuales de 30 minutos, lunes a viernes de 3:00 a 6:00 p. m. (sin festivos).</p>

    <p v-if="info" class="mt-4 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">{{ info }}</p>
    <p v-if="error" class="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{{ error }}</p>

    <!-- Google Calendar -->
    <div class="mt-6 rounded-xl border border-mp-border/10 bg-mp-surface p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <Video :size="18" class="text-mp-primary-hover" />
          <div>
            <p class="text-sm font-medium text-mp-fg">Google Calendar y Meet</p>
            <p class="text-xs text-mp-muted">
              <template v-if="google.connected">Conectado{{ google.account ? ' con ' + google.account : '' }}. Cada cita crea su propio enlace de Meet.</template>
              <template v-else-if="google.configured">Sin conectar: las citas se guardan pero sin enlace de Meet.</template>
              <template v-else>Falta configurar las credenciales de Google en el servidor.</template>
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            v-if="google.configured && !google.connected"
            class="rounded-full bg-mp-primary px-4 py-2 text-xs font-medium text-white hover:bg-mp-primary-hover"
            @click="connectGoogle"
          >
            <Link2 :size="13" class="mr-1 inline" /> Conectar Google
          </button>
          <button v-if="google.connected" class="text-xs text-mp-muted underline hover:text-mp-fg" @click="disconnectGoogle">Desconectar</button>
        </div>
      </div>
    </div>

    <!-- Citas -->
    <h2 class="mt-8 text-lg font-medium text-mp-fg">Próximas citas</h2>
    <p v-if="loading" class="mt-3 text-sm text-mp-muted">Cargando...</p>
    <p v-else-if="groups.length === 0" class="mt-3 text-sm text-mp-muted">No hay citas agendadas por ahora.</p>

    <div v-for="group in groups" :key="group.day" class="mt-4">
      <p class="text-xs font-semibold tracking-wide text-mp-muted">{{ dayLabel(group.day).toUpperCase() }}</p>
      <div class="mt-2 space-y-2">
        <div v-for="a in group.items" :key="a.id" class="rounded-xl border border-mp-border/10 bg-mp-surface p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-base font-medium text-mp-fg">{{ timeLabel(a.startAt) }} · {{ a.name }}</p>
              <span class="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px]" :class="KIND_STYLES[a.kind]">{{ a.kindLabel }}</span>
              <p class="mt-2 text-sm text-mp-muted">
                {{ a.email }} ·
                <a :href="whatsappLink(a.phone)" target="_blank" rel="noopener" class="text-mp-primary-hover hover:underline">{{ a.phone }}</a>
              </p>
              <p v-if="a.notes" class="mt-1 text-sm text-mp-fg/80">📝 {{ a.notes }}</p>
            </div>
            <div class="flex items-center gap-2">
              <a
                v-if="a.meetUrl"
                :href="a.meetUrl"
                target="_blank"
                rel="noopener"
                class="rounded-full bg-mp-primary px-3.5 py-1.5 text-xs font-medium text-white hover:bg-mp-primary-hover"
              >
                Abrir Meet
              </a>
              <span v-else class="text-xs text-mp-muted">Sin enlace de Meet</span>
              <button
                :disabled="busyId === a.id"
                class="rounded-full border border-mp-border/20 p-2 text-mp-muted hover:text-red-400 disabled:opacity-50"
                title="Cancelar cita"
                @click="cancel(a)"
              >
                <CalendarX :size="15" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bloqueos -->
    <h2 class="mt-10 text-lg font-medium text-mp-fg">Bloquear horarios</h2>
    <p class="mt-1 text-sm text-mp-muted">Para días o rangos en los que no puedes atender: dejan de aparecer como disponibles.</p>
    <form class="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-mp-border/10 bg-mp-surface p-4" @submit.prevent="addBlock">
      <label class="text-xs text-mp-muted">Día<br /><input v-model="blockForm.date" type="date" :class="inputClass" /></label>
      <label class="flex items-center gap-2 pb-2 text-sm text-mp-fg">
        <input v-model="blockForm.allDay" type="checkbox" class="h-4 w-4 accent-mp-primary" /> Todo el día
      </label>
      <template v-if="!blockForm.allDay">
        <label class="text-xs text-mp-muted">Desde<br /><input v-model="blockForm.from" type="time" step="1800" :class="inputClass" /></label>
        <label class="text-xs text-mp-muted">Hasta<br /><input v-model="blockForm.to" type="time" step="1800" :class="inputClass" /></label>
      </template>
      <label class="min-w-40 flex-1 text-xs text-mp-muted">Motivo (opcional)<br /><input v-model="blockForm.reason" type="text" :class="[inputClass, 'w-full']" /></label>
      <button type="submit" class="rounded-full bg-mp-primary px-4 py-2 text-sm font-medium text-white hover:bg-mp-primary-hover">Bloquear</button>
    </form>

    <div v-if="blocks.length" class="mt-3 space-y-2">
      <div v-for="b in blocks" :key="b.id" class="flex items-center justify-between rounded-lg border border-mp-border/10 bg-mp-surface px-4 py-2.5 text-sm">
        <span class="text-mp-fg">{{ blockLabel(b) }}<span v-if="b.reason" class="text-mp-muted"> · {{ b.reason }}</span></span>
        <button class="text-mp-muted hover:text-red-400" title="Quitar bloqueo" @click="removeBlock(b)"><Trash2 :size="15" /></button>
      </div>
    </div>

    <template v-if="cancelledList.length">
      <h2 class="mt-10 text-sm font-medium text-mp-muted">Canceladas recientemente</h2>
      <p v-for="a in cancelledList" :key="a.id" class="mt-1 text-xs text-mp-muted line-through">{{ a.whenText }} · {{ a.name }}</p>
    </template>
  </div>
</template>
