<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { MessageCircle, Camera, MessageSquare, CalendarDays, ClipboardList, PenLine, Search, Plus, ListTodo, AlertTriangle, Download } from '@lucide/vue'
import api from '../api/axios'
import CrmContactDrawer from './CrmContactDrawer.vue'
import { STAGES, PIPELINES, stageOf, timeAgo, formatMoney } from './crm'

const SOURCE_ICONS = {
  WHATSAPP: MessageCircle,
  INSTAGRAM: Camera,
  FACEBOOK: MessageSquare,
  BOOKING: CalendarDays,
  WEB: ClipboardList,
  MANUAL: PenLine,
}

const pipeline = ref(localStorage.getItem('mp-crm-pipeline') || 'REAL_ESTATE')
const contacts = ref([])
const stats = ref(null)
const search = ref('')
const loading = ref(true)
const error = ref('')
const info = ref('')
const openId = ref(null)
const showNew = ref(false)
const newForm = ref({ name: '', phone: '', email: '' })
const dragId = ref(null)
const dragOver = ref('')
const importing = ref(false)

async function load() {
  try {
    const [board, st] = await Promise.all([
      api.get('/crm/board', { params: { pipeline: pipeline.value } }),
      api.get('/crm/stats', { params: { pipeline: pipeline.value } }),
    ])
    contacts.value = board.data
    stats.value = st.data
    error.value = ''
  } catch (err) {
    error.value = 'No se pudo cargar el CRM.'
  } finally {
    loading.value = false
  }
}

watch(pipeline, (value) => {
  localStorage.setItem('mp-crm-pipeline', value)
  loading.value = true
  load()
})

onMounted(load)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return contacts.value
  const digits = q.replace(/\D/g, '')
  return contacts.value.filter(
    (c) =>
      c.displayName.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      (digits.length >= 4 && (c.phone || '').includes(digits)),
  )
})

const columns = computed(() =>
  STAGES.map((stage) => ({ ...stage, items: filtered.value.filter((c) => c.stage === stage.key) })),
)

// --- Arrastrar tarjetas entre etapas ---
function onDragStart(event, contact) {
  dragId.value = contact.id
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(contact.id))
}

async function onDrop(stageKey) {
  const id = dragId.value
  dragId.value = null
  dragOver.value = ''
  const contact = contacts.value.find((c) => c.id === id)
  if (!contact || contact.stage === stageKey) return
  let lostReason = ''
  if (stageKey === 'LOST') {
    const answer = window.prompt('¿Por qué se perdió? (opcional)')
    if (answer === null) return
    lostReason = answer
  }
  const previous = contact.stage
  contact.stage = stageKey // optimista
  try {
    await api.put(`/crm/contacts/${id}/stage`, { stage: stageKey, lostReason })
    await load()
  } catch (err) {
    contact.stage = previous
    error.value = 'No se pudo mover el contacto.'
  }
}

async function createContact() {
  const f = newForm.value
  if (!f.name.trim() && !f.phone.trim() && !f.email.trim()) return
  try {
    const res = await api.post('/crm/contacts', { ...f, pipeline: pipeline.value })
    showNew.value = false
    newForm.value = { name: '', phone: '', email: '' }
    await load()
    openId.value = res.data.id
  } catch (err) {
    error.value = 'No se pudo crear el contacto.'
  }
}

async function importExisting() {
  importing.value = true
  info.value = ''
  try {
    const res = await api.post('/crm/import')
    const d = res.data
    const total = Object.values(d).reduce((a, b) => a + b, 0)
    info.value = total
      ? `Se importaron ${total} contactos (WhatsApp ${d.whatsapp}, Instagram ${d.instagram}, Facebook ${d.facebook}, sitio web ${d.web}, reuniones ${d.reuniones}).`
      : 'No había nada nuevo por importar: todo ya está en el CRM.'
    await load()
  } catch (err) {
    error.value = 'No se pudo importar.'
  } finally {
    importing.value = false
  }
}

const inputClass = 'rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2 text-sm text-mp-fg focus:border-mp-primary focus:outline-none'
</script>

<template>
  <div class="flex h-[calc(100dvh-6.5rem)] flex-col font-[family-name:var(--font-mp-body)] lg:h-[calc(100vh-6rem)]">
    <!-- Encabezado -->
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="font-[family-name:var(--font-mp-heading)] text-2xl font-medium text-mp-fg">👥 CRM</h1>
      <div class="inline-flex rounded-full bg-white/5 p-1">
        <button
          v-for="p in PIPELINES"
          :key="p.key"
          class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
          :class="pipeline === p.key ? 'bg-mp-primary text-white' : 'text-mp-muted hover:text-mp-fg'"
          @click="pipeline = p.key"
        >
          {{ p.label }}
        </button>
      </div>
      <div class="relative ml-auto min-w-44 flex-1 sm:max-w-xs sm:flex-none">
        <Search :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mp-muted/60" />
        <input v-model="search" :class="[inputClass, 'w-full pl-9']" placeholder="Buscar nombre, teléfono, etiqueta…" />
      </div>
      <button
        :disabled="importing"
        class="inline-flex items-center gap-1.5 rounded-full border border-mp-border/20 px-3.5 py-2 text-sm text-mp-fg hover:bg-white/5 disabled:opacity-60"
        title="Trae al CRM las conversaciones, solicitudes y reuniones que ya existían (no duplica)"
        @click="importExisting"
      >
        <Download :size="15" /> {{ importing ? 'Importando…' : 'Importar' }}
      </button>
      <button class="inline-flex items-center gap-1.5 rounded-full bg-mp-primary px-4 py-2 text-sm font-medium text-white hover:bg-mp-primary-hover" @click="showNew = true">
        <Plus :size="15" /> Nuevo
      </button>
    </div>

    <!-- Indicadores -->
    <div v-if="stats" class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div class="rounded-xl border border-mp-border/10 bg-mp-surface px-4 py-2.5">
        <p class="text-[11px] tracking-wide text-mp-muted">NUEVOS ESTA SEMANA</p>
        <p class="text-lg font-medium text-mp-fg">{{ stats.newThisWeek }}</p>
      </div>
      <div class="rounded-xl border border-mp-border/10 bg-mp-surface px-4 py-2.5">
        <p class="text-[11px] tracking-wide text-mp-muted">GANADOS ESTE MES</p>
        <p class="text-lg font-medium text-green-400">{{ stats.wonThisMonth }}</p>
      </div>
      <div class="rounded-xl border border-mp-border/10 bg-mp-surface px-4 py-2.5">
        <p class="text-[11px] tracking-wide text-mp-muted">CONVERSIÓN</p>
        <p class="text-lg font-medium text-mp-fg">{{ stats.conversion == null ? '—' : stats.conversion + '%' }}</p>
      </div>
      <div class="rounded-xl border border-mp-border/10 bg-mp-surface px-4 py-2.5">
        <p class="text-[11px] tracking-wide text-mp-muted">VALOR EN JUEGO</p>
        <p class="text-lg font-medium text-mp-fg">{{ stats.openValue ? formatMoney(stats.openValue) : '—' }}</p>
      </div>
    </div>

    <p v-if="info" class="mt-3 rounded-lg bg-green-500/10 px-4 py-2.5 text-sm text-green-400">{{ info }}</p>
    <p v-if="error" class="mt-3 rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{{ error }}</p>

    <!-- Vacío: ofrecer importar -->
    <div v-if="!loading && !contacts.length && !search" class="mt-8 rounded-2xl border border-dashed border-mp-border/20 p-8 text-center">
      <p class="text-mp-fg">Todavía no hay contactos en este embudo.</p>
      <p class="mt-1 text-sm text-mp-muted">
        Desde ahora cada persona que escriba por WhatsApp, Instagram o Facebook, agende una reunión o llene un formulario aparece aquí sola.
        Puedes traer también lo que ya tenías.
      </p>
      <button :disabled="importing" class="mt-4 inline-flex items-center gap-2 rounded-full bg-mp-primary px-5 py-2 text-sm font-medium text-white hover:bg-mp-primary-hover disabled:opacity-60" @click="importExisting">
        <Download :size="15" /> {{ importing ? 'Importando…' : 'Importar conversaciones, solicitudes y reuniones existentes' }}
      </button>
    </div>

    <!-- Tablero -->
    <div v-else class="mt-4 flex min-h-0 flex-1 snap-x gap-3 overflow-x-auto pb-2">
      <section
        v-for="col in columns"
        :key="col.key"
        class="flex w-72 shrink-0 snap-start flex-col rounded-xl border bg-mp-surface/60 transition-colors"
        :class="dragOver === col.key ? 'border-mp-primary/60 bg-mp-primary/5' : 'border-mp-border/10'"
        @dragover.prevent="dragOver = col.key"
        @dragleave="dragOver === col.key && (dragOver = '')"
        @drop.prevent="onDrop(col.key)"
      >
        <header class="flex items-center gap-2 px-3 py-2.5">
          <span class="h-2 w-2 rounded-full" :class="col.dot"></span>
          <h2 class="flex-1 truncate text-sm font-medium text-mp-fg">{{ col.label }}</h2>
          <span class="rounded-full bg-white/5 px-2 py-0.5 text-xs text-mp-muted">{{ col.items.length }}</span>
        </header>

        <div class="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
          <article
            v-for="c in col.items"
            :key="c.id"
            draggable="true"
            class="cursor-pointer rounded-lg border border-mp-border/10 bg-mp-bg p-3 transition-colors hover:border-mp-primary/40"
            :class="dragId === c.id ? 'opacity-40' : ''"
            @dragstart="onDragStart($event, c)"
            @dragend="dragId = null; dragOver = ''"
            @click="openId = c.id"
          >
            <div class="flex items-start gap-2">
              <p class="min-w-0 flex-1 truncate text-sm font-medium text-mp-fg">{{ c.displayName }}</p>
              <component :is="SOURCE_ICONS[c.source]" :size="14" class="mt-0.5 shrink-0 text-mp-muted" :title="c.sourceLabel" />
            </div>
            <p v-if="c.lastMessage" class="mt-1 line-clamp-2 text-xs text-mp-muted">{{ c.lastMessage }}</p>
            <p v-else-if="c.sourceDetail" class="mt-1 line-clamp-2 text-xs text-mp-muted">{{ c.sourceDetail }}</p>

            <div v-if="c.tags.length" class="mt-2 flex flex-wrap gap-1">
              <span v-for="t in c.tags.slice(0, 3)" :key="t" class="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-mp-fg/80">{{ t }}</span>
            </div>

            <div class="mt-2 flex items-center gap-2 text-[11px] text-mp-muted">
              <span>{{ timeAgo(c.lastActivityAt) }}</span>
              <span v-if="c.estimatedValue" class="text-mp-fg/80">· {{ formatMoney(c.estimatedValue) }}</span>
              <span v-if="c.openTasks" class="ml-auto inline-flex items-center gap-1 rounded-full px-1.5 py-0.5" :class="c.overdueTasks ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-mp-fg/80'">
                <AlertTriangle v-if="c.overdueTasks" :size="11" /><ListTodo v-else :size="11" /> {{ c.openTasks }}
              </span>
            </div>
          </article>
          <p v-if="!col.items.length" class="px-2 py-6 text-center text-xs text-mp-muted/60">Arrastra contactos aquí</p>
        </div>
      </section>
    </div>

    <!-- Contacto -->
    <CrmContactDrawer
      v-if="openId"
      :contact-id="openId"
      @close="openId = null"
      @changed="load"
      @deleted="openId = null; load()"
    />

    <!-- Nuevo contacto -->
    <div v-if="showNew" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showNew = false">
      <form class="w-full max-w-sm space-y-3 rounded-2xl border border-mp-border/10 bg-mp-surface p-5" @submit.prevent="createContact">
        <h2 class="font-[family-name:var(--font-mp-heading)] text-lg text-mp-fg">Nuevo contacto</h2>
        <input v-model="newForm.name" :class="[inputClass, 'w-full']" placeholder="Nombre" />
        <input v-model="newForm.phone" :class="[inputClass, 'w-full']" placeholder="Teléfono (con indicativo si no es de Colombia)" />
        <input v-model="newForm.email" :class="[inputClass, 'w-full']" placeholder="Correo" />
        <p class="text-xs text-mp-muted">Se crea en el embudo de {{ stageOf('NEW') && PIPELINES.find((p) => p.key === pipeline).label }}, en la etapa Nuevo.</p>
        <div class="flex justify-end gap-2 pt-1">
          <button type="button" class="rounded-full px-4 py-2 text-sm text-mp-muted hover:text-mp-fg" @click="showNew = false">Cancelar</button>
          <button type="submit" class="rounded-full bg-mp-primary px-5 py-2 text-sm font-medium text-white hover:bg-mp-primary-hover">Crear</button>
        </div>
      </form>
    </div>
  </div>
</template>
