<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { MessageCircle, X } from '@lucide/vue'
import { loadGoogleMaps } from '../lib/googleMaps'
import { isRental } from '../lib/listing'
import { track } from '../lib/analytics'

const props = defineProps({
  properties: { type: Array, default: () => [] },
})

const mapEl = ref(null)
const status = ref('loading') // loading | ready | error
const selectedId = ref(null)

const located = computed(() => props.properties.filter((p) => p.lat != null && p.lng != null))
const selected = computed(() => located.value.find((p) => p.id === selectedId.value) || null)

let map = null
let PriceOverlay = null
let overlays = []

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
  const text = millions >= 100 ? Math.round(millions).toLocaleString('es-CO') : millions.toLocaleString('es-CO', { maximumFractionDigits: 1 })
  return `$${text} M${isRental(p) ? '/mes' : ''}`
}

function whatsappHref(p) {
  const message = `Hola, quiero más información sobre: ${p.title}\n${window.location.origin}/propiedad/${p.id}`
  return `https://wa.me/573112210714?text=${encodeURIComponent(message)}`
}

function buildOverlayClass(maps) {
  return class extends maps.OverlayView {
    constructor(position, label, onClick) {
      super()
      this.position = position
      this.label = label
      this.onClick = onClick
      this.el = null
    }
    onAdd() {
      const el = document.createElement('button')
      el.type = 'button'
      el.textContent = this.label
      el.style.cssText =
        'position:absolute;transform:translate(-50%,-50%);cursor:pointer;white-space:nowrap;' +
        'border:2px solid #fff;border-radius:999px;padding:6px 11px;font:600 13px Jost,system-ui,sans-serif;' +
        'color:#fff;background:#dc2626;box-shadow:0 2px 8px rgba(0,0,0,.35);'
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        this.onClick()
      })
      this.el = el
      this.getPanes().overlayMouseTarget.appendChild(el)
    }
    draw() {
      const point = this.getProjection()?.fromLatLngToDivPixel(this.position)
      if (!point || !this.el) return
      this.el.style.left = `${point.x}px`
      this.el.style.top = `${point.y}px`
    }
    onRemove() {
      this.el?.remove()
      this.el = null
    }
    setSelected(on) {
      if (!this.el) return
      this.el.style.background = on ? '#1a1712' : '#dc2626'
      this.el.style.zIndex = on ? '10' : '0'
    }
  }
}

function render() {
  if (!map || !PriceOverlay) return
  overlays.forEach((o) => o.setMap(null))
  overlays = []

  const maps = window.google.maps
  const bounds = new maps.LatLngBounds()

  located.value.forEach((p) => {
    const position = new maps.LatLng(p.lat, p.lng)
    const overlay = new PriceOverlay(position, pinLabel(p), () => {
      selectedId.value = p.id
    })
    overlay.propertyId = p.id
    overlay.setMap(map)
    overlays.push(overlay)
    bounds.extend(position)
  })

  if (located.value.length === 1) {
    map.setCenter(bounds.getCenter())
    map.setZoom(14)
  } else if (located.value.length > 1) {
    map.fitBounds(bounds, 60)
  }
  highlight()
}

function highlight() {
  overlays.forEach((o) => o.setSelected(o.propertyId === selectedId.value))
}

watch(selectedId, highlight)
watch(located, () => {
  selectedId.value = null
  render()
})

onMounted(async () => {
  try {
    const maps = await loadGoogleMaps()
    PriceOverlay = buildOverlayClass(maps)
    map = new maps.Map(mapEl.value, {
      center: { lat: 4.75, lng: -74.05 },
      zoom: 10,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      clickableIcons: false,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    })
    map.addListener('click', () => {
      selectedId.value = null
    })
    status.value = 'ready'
    // El OverlayView necesita que el mapa ya tenga proyeccion antes de dibujar.
    maps.event.addListenerOnce(map, 'idle', render)
  } catch (err) {
    status.value = 'error'
  }
})

onBeforeUnmount(() => {
  overlays.forEach((o) => o.setMap(null))
  overlays = []
  map = null
})
</script>

<template>
  <div class="relative h-[68vh] min-h-[420px] overflow-hidden rounded-2xl border border-charcoal/10 bg-charcoal/5 lg:h-[620px]">
    <div ref="mapEl" class="h-full w-full"></div>

    <div v-if="status === 'loading'" class="absolute inset-0 flex items-center justify-center font-sans text-sm text-charcoal/50">
      Cargando mapa...
    </div>
    <div
      v-else-if="status === 'error'"
      class="absolute inset-0 flex items-center justify-center bg-cream px-6 text-center font-sans text-sm text-charcoal/60"
    >
      No pudimos cargar el mapa. Puedes ver las propiedades en la lista.
    </div>

    <p
      v-if="status === 'ready' && located.length < properties.length"
      class="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 font-sans text-xs text-charcoal/70 shadow-sm"
    >
      {{ properties.length - located.length }} sin ubicación en el mapa
    </p>

    <div
      v-if="selected"
      class="absolute inset-x-3 bottom-3 z-10 flex gap-3 rounded-2xl bg-white p-3 shadow-xl sm:left-auto sm:w-96"
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
