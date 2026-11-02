<script setup>
import { ref, watch, computed } from 'vue'
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, Target } from '@lucide/vue'
import api from '../api/axios'

// Resumen con IA de la conversacion abierta: que quiere la persona, que esta
// pendiente y el siguiente paso, para no tener que leerla toda al retomarla.
// Generarlo cuesta (IA), asi que NUNCA se genera solo: al abrir la conversacion
// solo se muestra el que ya esta guardado (gratis), avisando si llegaron mensajes
// nuevos desde entonces; el boton lo genera o lo actualiza cuando tu quieras.
const props = defineProps({
  channel: { type: String, required: true }, // whatsapp | instagram | facebook
  conversationId: { type: String, required: true },
  version: { type: [Number, String], default: 0 },
})

const summary = ref(null)
const loading = ref(false)
const generating = ref(false)
const failed = ref(false)
const generateError = ref('')
const collapsed = ref(localStorage.getItem('mp-summary-collapsed') === '1')

let requestSeq = 0

// refresh=false: solo lo guardado (sin IA). refresh=true: genera uno nuevo si hace falta.
async function load(refresh = false) {
  const seq = ++requestSeq
  if (refresh) {
    generating.value = true
    generateError.value = ''
  } else {
    loading.value = true
  }
  failed.value = false
  try {
    const res = await api.get(
      `/${props.channel}/conversations/${encodeURIComponent(props.conversationId)}/summary`,
      { params: refresh ? { refresh: true } : {} },
    )
    if (seq !== requestSeq) return
    const data = res.status === 204 || !res.data ? null : res.data
    if (refresh && !data) generateError.value = 'No se pudo generar el resumen. Intenta de nuevo.'
    if (data || !refresh) summary.value = data
  } catch (err) {
    if (seq !== requestSeq) return
    if (refresh) generateError.value = 'No se pudo generar el resumen. Intenta de nuevo.'
    else failed.value = true
  } finally {
    if (seq === requestSeq) {
      loading.value = false
      generating.value = false
    }
  }
}

function generate() {
  load(true)
}

const updatedLabel = computed(() => {
  if (!summary.value?.updatedAt) return ''
  return new Date(summary.value.updatedAt).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
})

watch(
  () => [props.channel, props.conversationId, props.version],
  (current, previous) => {
    // otra conversacion: no mostrar el resumen de la anterior
    if (previous && current[1] !== previous[1]) summary.value = null
    load(false)
  },
  { immediate: true },
)

function toggle() {
  collapsed.value = !collapsed.value
  localStorage.setItem('mp-summary-collapsed', collapsed.value ? '1' : '0')
}

const INTEREST = {
  alto: { label: 'Interés alto', class: 'bg-green-500/15 text-green-400' },
  medio: { label: 'Interés medio', class: 'bg-yellow-500/15 text-yellow-400' },
  bajo: { label: 'Interés bajo', class: 'bg-white/10 text-mp-muted' },
}
const interest = computed(() => INTEREST[summary.value?.interes] ?? null)

const DATA_LABELS = { nombre: 'Nombre', correo: 'Correo', telefono: 'Teléfono', tema: 'Tema', reunion: 'Reunión' }
const dataEntries = computed(() =>
  Object.entries(summary.value?.datos ?? {})
    .filter(([key]) => DATA_LABELS[key])
    .map(([key, value]) => ({ label: DATA_LABELS[key], value })),
)

const hasPending = computed(() => summary.value && !/^nada pendiente/i.test(summary.value.pendiente || ''))
</script>

<template>
  <!-- Cargando lo guardado (gratis) -->
  <div v-if="loading && !summary" class="shrink-0 border-b border-mp-border/10 bg-mp-surface px-4 py-2 text-xs text-mp-muted">
    <Sparkles :size="13" class="mr-1 inline animate-pulse text-mp-primary-hover" /> Buscando resumen…
  </div>

  <!-- Todavia no hay resumen: se ofrece generarlo (cuesta una llamada a la IA) -->
  <div v-else-if="!summary && !failed" class="flex shrink-0 items-center gap-3 border-b border-mp-border/10 bg-mp-surface px-4 py-2">
    <Sparkles :size="14" class="shrink-0 text-mp-muted" />
    <span class="flex-1 text-xs text-mp-muted">{{ generateError || 'Resumen con IA de esta conversación' }}</span>
    <button
      :disabled="generating"
      class="shrink-0 rounded-full border border-mp-primary/40 bg-mp-primary/10 px-3 py-1 text-xs font-medium text-mp-primary-hover hover:bg-mp-primary/20 disabled:opacity-60"
      @click="generate"
    >
      {{ generating ? 'Generando…' : 'Generar resumen' }}
    </button>
  </div>

  <div v-else-if="summary && !failed" class="shrink-0 border-b border-mp-border/10 bg-mp-surface">
    <button class="flex w-full items-center gap-2 px-4 py-2 text-left" @click="toggle">
      <Sparkles :size="14" class="shrink-0 text-mp-primary-hover" />
      <span class="text-xs font-medium tracking-wide text-mp-muted">RESUMEN</span>
      <span v-if="summary.urgente" class="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] text-red-400">
        <AlertTriangle :size="11" /> Urgente
      </span>
      <span v-if="interest" class="hidden rounded-full px-2 py-0.5 text-[11px] sm:inline" :class="interest.class">{{ interest.label }}</span>
      <span v-if="summary.stale" class="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[11px] text-yellow-400">Desactualizado</span>
      <span v-if="collapsed" class="min-w-0 flex-1 truncate text-xs" :class="hasPending ? 'text-mp-fg' : 'text-mp-muted'">
        {{ summary.pendiente }}
      </span>
      <span v-else class="flex-1"></span>
      <component :is="collapsed ? ChevronDown : ChevronUp" :size="15" class="shrink-0 text-mp-muted" />
    </button>

    <div v-if="!collapsed" class="max-h-56 space-y-2.5 overflow-y-auto px-4 pb-3 text-sm">
      <p class="leading-relaxed text-mp-fg/90">{{ summary.resumen }}</p>

      <div class="rounded-lg px-3 py-2" :class="hasPending ? 'bg-mp-primary/10' : 'bg-white/5'">
        <p class="text-[11px] font-medium tracking-wide" :class="hasPending ? 'text-mp-primary-hover' : 'text-mp-muted'">PENDIENTE</p>
        <p class="mt-0.5 text-mp-fg">{{ summary.pendiente }}</p>
      </div>

      <p v-if="summary.siguientePaso" class="flex items-start gap-2 text-mp-fg/90">
        <Target :size="14" class="mt-0.5 shrink-0 text-mp-muted" />
        <span><span class="text-mp-muted">Siguiente paso:</span> {{ summary.siguientePaso }}</span>
      </p>

      <div v-if="dataEntries.length || interest" class="flex flex-wrap gap-1.5 pt-0.5">
        <span v-if="interest" class="rounded-full px-2.5 py-1 text-xs sm:hidden" :class="interest.class">{{ interest.label }}</span>
        <span v-for="d in dataEntries" :key="d.label" class="rounded-full bg-white/5 px-2.5 py-1 text-xs text-mp-fg/85">
          <span class="text-mp-muted">{{ d.label }}:</span> {{ d.value }}
        </span>
      </div>

      <!-- Actualizar: solo cuando tu lo pides (cuesta una llamada a la IA) -->
      <div class="flex flex-wrap items-center gap-2 border-t border-mp-border/10 pt-2 text-xs">
        <span :class="summary.stale ? 'text-yellow-400' : 'text-mp-muted'">
          {{ summary.stale ? 'Hay mensajes nuevos desde este resumen' : 'Actualizado ' + updatedLabel }}
        </span>
        <button
          v-if="summary.stale"
          :disabled="generating"
          class="rounded-full border border-mp-primary/40 bg-mp-primary/10 px-3 py-1 font-medium text-mp-primary-hover hover:bg-mp-primary/20 disabled:opacity-60"
          @click="generate"
        >
          {{ generating ? 'Actualizando…' : 'Actualizar resumen' }}
        </button>
        <span v-if="generateError" class="text-red-400">{{ generateError }}</span>
      </div>
    </div>
  </div>
</template>
