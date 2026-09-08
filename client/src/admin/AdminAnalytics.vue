<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '../api/axios'

const site = ref('INMOBILIARIA')
const rangeDays = ref(30)
const loading = ref(true)
const error = ref('')
const summary = ref(null)

const EVENT_LABELS = {
  PageView: 'Vistas de página',
  PropertyView: 'Vistas de propiedad',
  WhatsAppClick: 'Clics a WhatsApp',
  EmailClick: 'Clics a correo',
  ScheduleVisit: 'Visitas agendadas',
  ContactFormBuyer: 'Formulario — busca propiedad',
  ContactFormOwner: 'Formulario — publicar propiedad',
  ContactForm: 'Formulario de contacto',
}

const EVENT_COLORS = {
  PageView: '#8a8072',
  PropertyView: '#b28a4c',
  WhatsAppClick: '#25D366',
  EmailClick: '#4285F4',
  ScheduleVisit: '#d4b483',
  ContactFormBuyer: '#1a1712',
  ContactFormOwner: '#a5673f',
  ContactForm: '#1a1712',
}

function label(eventName) {
  return EVENT_LABELS[eventName] || eventName
}

function color(eventName) {
  return EVENT_COLORS[eventName] || '#b28a4c'
}

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

const maxFunnelCount = computed(() => {
  if (!summary.value?.funnel?.length) return 1
  return Math.max(...summary.value.funnel.map((f) => f.count))
})

const maxTrendTotal = computed(() => {
  if (!summary.value?.trend?.length) return 1
  return Math.max(...summary.value.trend.map((t) => Object.values(t.byEvent).reduce((a, b) => a + b, 0)), 1)
})

function trendTotal(point) {
  return Object.values(point.byEvent).reduce((a, b) => a + b, 0)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - rangeDays.value)
    const fmt = (d) => d.toISOString().slice(0, 10)

    const res = await api.get('/analytics/summary', {
      params: { site: site.value, from: fmt(from), to: fmt(to) },
    })
    summary.value = res.data
  } catch (err) {
    error.value = 'No se pudo cargar la analítica.'
  } finally {
    loading.value = false
  }
}

watch([site, rangeDays], load)
onMounted(load)
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="font-serif text-2xl text-charcoal">📊 Analítica</h1>

      <div class="flex gap-2">
        <select
          v-model="site"
          class="rounded-lg border border-charcoal/15 bg-white px-4 py-2 font-sans text-sm text-charcoal focus:border-gold focus:outline-none"
        >
          <option value="INMOBILIARIA">Ventas Sabana</option>
          <option value="AGENCIA">Marcapro (agencia)</option>
        </select>
        <select
          v-model.number="rangeDays"
          class="rounded-lg border border-charcoal/15 bg-white px-4 py-2 font-sans text-sm text-charcoal focus:border-gold focus:outline-none"
        >
          <option :value="7">Últimos 7 días</option>
          <option :value="30">Últimos 30 días</option>
          <option :value="90">Últimos 90 días</option>
        </select>
      </div>
    </div>

    <p v-if="loading" class="mt-10 font-sans text-charcoal/50">Cargando...</p>
    <p v-else-if="error" class="mt-10 font-sans text-red-600">{{ error }}</p>

    <template v-else-if="summary">
      <p class="mt-2 font-sans text-sm text-charcoal/50">{{ summary.totalEvents }} eventos en el período</p>

      <!-- Embudo -->
      <div class="mt-8 rounded-xl border border-charcoal/10 bg-white p-6">
        <h2 class="font-serif text-lg text-charcoal">Embudo</h2>
        <p v-if="!summary.funnel.length" class="mt-4 font-sans text-sm text-charcoal/40">
          Todavía no hay eventos en este período.
        </p>
        <div v-else class="mt-6 space-y-3">
          <div v-for="f in summary.funnel" :key="f.eventName">
            <div class="mb-1 flex items-center justify-between font-sans text-sm">
              <span class="text-charcoal">{{ label(f.eventName) }}</span>
              <span class="font-medium text-charcoal">{{ f.count }}</span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-charcoal/5">
              <div
                class="h-full rounded-full transition-all"
                :style="{
                  width: `${(f.count / maxFunnelCount) * 100}%`,
                  backgroundColor: color(f.eventName),
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tendencia -->
      <div class="mt-6 rounded-xl border border-charcoal/10 bg-white p-6">
        <h2 class="font-serif text-lg text-charcoal">Tendencia diaria</h2>
        <p v-if="!summary.trend.length" class="mt-4 font-sans text-sm text-charcoal/40">Sin datos todavía.</p>
        <div v-else class="mt-6 flex h-40 items-end gap-1 overflow-x-auto">
          <div
            v-for="point in summary.trend"
            :key="point.date"
            class="group relative flex min-w-[20px] flex-1 flex-col-reverse"
            :style="{ height: '100%' }"
          >
            <div
              v-for="[eventName, count] in Object.entries(point.byEvent)"
              :key="eventName"
              :style="{
                height: `${(count / maxTrendTotal) * 100}%`,
                backgroundColor: color(eventName),
              }"
              class="w-full first:rounded-t-sm"
            ></div>
            <div
              class="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-charcoal px-2 py-1 font-sans text-[10px] text-cream group-hover:block"
            >
              {{ formatDate(point.date) }} · {{ trendTotal(point) }}
            </div>
          </div>
        </div>
        <div class="mt-2 flex justify-between font-sans text-[10px] text-charcoal/40">
          <span>{{ summary.trend[0] ? formatDate(summary.trend[0].date) : '' }}</span>
          <span>{{ summary.trend.at(-1) ? formatDate(summary.trend.at(-1).date) : '' }}</span>
        </div>
        <div class="mt-4 flex flex-wrap gap-3">
          <div v-for="f in summary.funnel" :key="f.eventName" class="flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: color(f.eventName) }"></span>
            <span class="font-sans text-[11px] text-charcoal/60">{{ label(f.eventName) }}</span>
          </div>
        </div>
      </div>

      <!-- Campañas -->
      <div class="mt-6 rounded-xl border border-charcoal/10 bg-white p-6">
        <h2 class="font-serif text-lg text-charcoal">Por campaña</h2>
        <p v-if="!summary.campaigns.length" class="mt-4 font-sans text-sm text-charcoal/40">
          Todavía no hay tráfico con UTMs en este período.
        </p>
        <div v-else class="mt-4 overflow-x-auto">
          <table class="w-full text-left font-sans text-sm">
            <thead>
              <tr class="border-b border-charcoal/10 text-xs tracking-widest text-charcoal/40">
                <th class="py-2 pr-4 font-normal">CAMPAÑA</th>
                <th class="py-2 pr-4 font-normal">ORIGEN</th>
                <th class="py-2 pr-4 font-normal">MEDIO</th>
                <th class="py-2 pr-4 font-normal">EVENTOS</th>
                <th class="py-2 font-normal">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in summary.campaigns" :key="c.campaign" class="border-b border-charcoal/5 last:border-0">
                <td class="py-3 pr-4 text-charcoal">{{ c.campaign }}</td>
                <td class="py-3 pr-4 text-charcoal/60">{{ c.source || '—' }}</td>
                <td class="py-3 pr-4 text-charcoal/60">{{ c.medium || '—' }}</td>
                <td class="py-3 pr-4 text-charcoal/60">
                  <span v-for="(count, name) in c.byEvent" :key="name" class="mr-3 whitespace-nowrap">
                    {{ label(name) }}: {{ count }}
                  </span>
                </td>
                <td class="py-3 font-medium text-charcoal">{{ c.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
