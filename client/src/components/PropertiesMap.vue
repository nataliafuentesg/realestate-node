<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { MessageCircle, X } from '@lucide/vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { isRental } from '../lib/listing'
import { track } from '../lib/analytics'

const props = defineProps({
  properties: { type: Array, default: () => [] },
})

const mapEl = ref(null)
const selectedId = ref(null)

const located = computed(() => props.properties.filter((p) => p.lat != null && p.lng != null))
const selected = computed(() => located.value.find((p) => p.id === selectedId.value) || null)

let map = null
let markers = []

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(price)
}

// $3.021 M, $3 M/mes -- los precios completos no caben en un pin.
function pinLabel(p) {
  const millions = p.price / 1_000_000
  const text =
    millions >= 100
      ? Math.round(millions).toLocaleString('es-CO')
      : millions.toLocaleString('es-CO', { maximumFractionDigits: 1 })
  return `$${text} M${isRental(p) ? '/mes' : ''}`
}

function whatsappHref(p) {
  const message = `Hola, quiero más información sobre: ${p.title}\n${window.location.origin}/propiedad/${p.id}`
  return `https://wa.me/573112210714?text=${encodeURIComponent(message)}`
}

function render() {
  if (!map) return
  markers.forEach((m) => m.remove())
  markers = []

  located.value.forEach((p) => {
    const marker = L.marker([p.lat, p.lng], {
      icon: L.divIcon({
        className: 'price-pin',
        html: `<span>${pinLabel(p)}</span>`,
        iconSize: [0, 0],
      }),
      keyboard: false,
    })
    marker.propertyId = p.id
    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e)
      selectedId.value = p.id
    })
    marker.addTo(map)
    markers.push(marker)
  })

  if (located.value.length === 1) {
    map.setView([located.value[0].lat, located.value[0].lng], 14)
  } else if (located.value.length > 1) {
    map.fitBounds(L.latLngBounds(located.value.map((p) => [p.lat, p.lng])), { padding: [60, 60], maxZoom: 15 })
  }
  highlight()
}

function highlight() {
  markers.forEach((m) => {
    m.getElement()?.classList.toggle('is-selected', m.propertyId === selectedId.value)
    m.setZIndexOffset(m.propertyId === selectedId.value ? 1000 : 0)
  })
}

watch(selectedId, highlight)
watch(located, () => {
  selectedId.value = null
  render()
})

onMounted(async () => {
  map = L.map(mapEl.value, { zoomControl: true, attributionControl: true }).setView([4.75, -74.05], 10)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)
  map.on('click', () => {
    selectedId.value = null
  })
  await nextTick()
  map.invalidateSize()
  render()
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
  markers = []
})
</script>

<template>
  <div class="relative isolate h-[68vh] min-h-[420px] overflow-hidden rounded-2xl border border-charcoal/10 bg-charcoal/5 lg:h-[620px]">
    <div ref="mapEl" class="h-full w-full"></div>

    <p
      v-if="located.length < properties.length"
      class="absolute right-3 top-3 z-[500] rounded-full bg-white/95 px-3 py-1.5 font-sans text-xs text-charcoal/70 shadow-sm"
    >
      {{ properties.length - located.length }} sin ubicación en el mapa
    </p>

    <div
      v-if="selected"
      class="absolute inset-x-3 bottom-3 z-[500] flex gap-3 rounded-2xl bg-white p-3 shadow-xl sm:left-auto sm:w-96"
    >
      <button
        type="button"
        class="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-charcoal/60"
        aria-label="Cerrar"
        @click="selectedId = null"
      >
        <X class="h-4 w-4" />
      </button>

      <RouterLink :to="`/propiedad/${selected.id}`" class="block h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-charcoal/5">
        <img v-if="selected.images?.[0]" :src="selected.images[0]" :alt="selected.title" class="h-full w-full object-cover" />
      </RouterLink>

      <div class="flex min-w-0 flex-1 flex-col">
        <p class="font-serif text-lg leading-tight text-gold">
          {{ formatPrice(selected.price) }}
          <span v-if="isRental(selected)" class="font-sans text-xs text-charcoal/50">/ mes</span>
        </p>
        <p class="mt-0.5 line-clamp-2 pr-5 font-sans text-sm font-medium leading-snug text-charcoal">{{ selected.title }}</p>
        <div class="mt-auto grid grid-cols-2 gap-2 pt-2">
          <RouterLink
            :to="`/propiedad/${selected.id}`"
            class="rounded-full border border-gold px-2 py-1.5 text-center font-sans text-xs font-medium text-gold"
          >
            Ver detalles
          </RouterLink>
          <a
            :href="whatsappHref(selected)"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-1 rounded-full bg-[#25D366] px-2 py-1.5 font-sans text-xs font-medium text-white"
            @click="track('WhatsAppClick', { propertyId: selected.id })"
          >
            <MessageCircle class="h-3.5 w-3.5" /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  </div>
</template>


<style>
.price-pin {
  background: none;
  border: none;
}
.price-pin span {
  position: absolute;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  cursor: pointer;
  border: 2px solid #fff;
  border-radius: 999px;
  padding: 6px 11px;
  font: 600 13px Jost, system-ui, sans-serif;
  color: #fff;
  background: #dc2626;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}
.price-pin.is-selected span {
  background: #1a1712;
}
</style>
