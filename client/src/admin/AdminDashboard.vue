<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Building2, ClipboardList, MessageCircle, Camera, ArrowRight } from '@lucide/vue'
import api from '../api/axios'

const loading = ref(true)
const error = ref('')

const properties = ref([])
const inquiries = ref([])
const whatsappConversations = ref([])
const instagramConversations = ref([])

function isToday(dateString) {
  if (!dateString) return false
  const d = new Date(dateString)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

const leadsToday = computed(() => inquiries.value.filter((i) => isToday(i.createdAt)).length)
const pendingLeads = computed(() => inquiries.value.filter((i) => i.status === 'NEW').length)

const stats = computed(() => [
  {
    label: 'Propiedades activas',
    value: properties.value.length,
    icon: Building2,
    emoji: '🏡',
    to: '/admin/propiedades',
  },
  {
    label: 'Leads nuevos hoy',
    value: leadsToday.value,
    sub: `${pendingLeads.value} sin contactar en total`,
    icon: ClipboardList,
    emoji: '📋',
    to: '/admin/leads',
  },
  {
    label: 'Conversaciones WhatsApp',
    value: whatsappConversations.value.length,
    icon: MessageCircle,
    emoji: '💬',
    to: '/admin/whatsapp',
  },
  {
    label: 'Conversaciones Instagram',
    value: instagramConversations.value.length,
    icon: Camera,
    emoji: '📸',
    to: '/admin/instagram/dms',
  },
])

const quickLinks = [
  { to: '/admin/propiedades/nueva', label: 'Agregar propiedad', emoji: '➕' },
  { to: '/admin/instagram', label: 'Configurar respuestas de Instagram', emoji: '⚙️' },
  { to: '/admin/analytics', label: 'Ver analítica', emoji: '📊' },
]

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const [propsRes, inquiriesRes, waRes, igRes] = await Promise.all([
      api.get('/properties'),
      api.get('/inquiries'),
      api.get('/whatsapp/conversations'),
      api.get('/instagram/conversations'),
    ])
    properties.value = propsRes.data ?? []
    inquiries.value = inquiriesRes.data ?? []
    whatsappConversations.value = waRes.data ?? []
    instagramConversations.value = igRes.data ?? []
  } catch (err) {
    error.value = 'No se pudo cargar toda la información del panel.'
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>

<template>
  <div>
    <h1 class="font-serif text-2xl text-charcoal">Panel</h1>
    <p class="mt-1 font-sans text-sm text-charcoal/50">Un vistazo rápido a Ventas Sabana ahora mismo.</p>

    <p v-if="error" class="mt-4 font-sans text-sm text-red-600">{{ error }}</p>

    <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RouterLink
        v-for="stat in stats"
        :key="stat.label"
        :to="stat.to"
        class="group rounded-2xl border border-charcoal/10 bg-white p-6 transition-shadow hover:shadow-lg"
      >
        <div class="flex items-center justify-between">
          <span
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-light/10 text-gold"
          >
            <component :is="stat.icon" :size="20" :stroke-width="1.75" />
          </span>
          <span class="text-lg">{{ stat.emoji }}</span>
        </div>
        <p class="mt-5 font-serif text-3xl text-charcoal">
          <span v-if="loading" class="inline-block h-8 w-12 animate-pulse rounded bg-charcoal/10"></span>
          <span v-else>{{ stat.value }}</span>
        </p>
        <p class="mt-1 font-sans text-sm text-charcoal/60">{{ stat.label }}</p>
        <p v-if="stat.sub" class="mt-0.5 font-sans text-xs text-charcoal/40">{{ stat.sub }}</p>
      </RouterLink>
    </div>

    <div class="mt-10">
      <p class="font-sans text-xs font-medium tracking-widest text-charcoal/40">ACCESOS RÁPIDOS</p>
      <div class="mt-3 flex flex-wrap gap-3">
        <RouterLink
          v-for="link in quickLinks"
          :key="link.to"
          :to="link.to"
          class="group flex items-center gap-2 rounded-full border border-charcoal/15 bg-white px-5 py-2.5 font-sans text-sm text-charcoal transition-colors hover:border-gold hover:text-gold"
        >
          <span>{{ link.emoji }}</span>
          {{ link.label }}
          <ArrowRight :size="14" :stroke-width="2" class="opacity-0 transition-opacity group-hover:opacity-100" />
        </RouterLink>
      </div>
    </div>
  </div>
</template>
