<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { BedDouble, Bath, Car, Ruler, MapPin, MessageCircle } from '@lucide/vue'
import { isRental } from '../lib/listing'
import { track } from '../lib/analytics'

const props = defineProps({
  property: { type: Object, required: true },
})

const typeLabels = {
  HOUSE: 'Casa',
  APARTMENT: 'Apartamento',
  LAND: 'Lote',
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(price)
}

const rental = computed(() => isRental(props.property))
const detailPath = computed(() => `/propiedad/${props.property.id}`)

const whatsappHref = computed(() => {
  const message = `Hola, quiero más información sobre: ${props.property.title}\n${window.location.origin}${detailPath.value}`
  return `https://wa.me/573112210714?text=${encodeURIComponent(message)}`
})

function trackWhatsApp() {
  track('WhatsAppClick', { propertyId: props.property.id })
}
</script>

<template>
  <article class="flex flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm">
    <RouterLink :to="detailPath" class="relative block aspect-[4/3] overflow-hidden bg-charcoal/5">
      <img
        v-if="property.images?.[0]"
        :src="property.images[0]"
        :alt="property.title"
        class="h-full w-full object-cover"
      />
      <div v-else class="flex h-full w-full items-center justify-center">
        <span class="font-serif text-sm tracking-widest text-charcoal/30">VENTAS SABANA</span>
      </div>
      <span
        class="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 font-sans text-xs font-medium text-charcoal shadow-sm"
      >
        {{ rental ? 'Arriendo · ' : '' }}{{ typeLabels[property.type] || property.type }}
      </span>
    </RouterLink>

    <div class="flex flex-1 flex-col p-4">
      <p class="font-serif text-2xl text-charcoal">
        {{ formatPrice(property.price) }}
        <span v-if="rental" class="font-sans text-sm text-charcoal/50">/ mes</span>
      </p>
      <p v-if="rental && property.administrationIncluded" class="font-sans text-xs text-charcoal/50">
        Administración incluida
      </p>

      <RouterLink :to="detailPath">
        <h3 class="mt-2 line-clamp-2 font-sans text-base font-medium leading-snug text-charcoal">
          {{ property.title }}
        </h3>
      </RouterLink>
      <p class="mt-1 flex items-center gap-1 font-sans text-sm text-charcoal/55">
        <MapPin class="h-3.5 w-3.5 shrink-0" />
        {{ property.neighborhood ? property.neighborhood + ', ' : '' }}{{ property.city }}
      </p>

      <ul class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 font-sans text-sm text-charcoal/70">
        <li v-if="property.bedrooms" class="flex items-center gap-1.5">
          <BedDouble class="h-4 w-4" /> {{ property.bedrooms }}
        </li>
        <li v-if="property.bathrooms" class="flex items-center gap-1.5">
          <Bath class="h-4 w-4" /> {{ property.bathrooms }}
        </li>
        <li v-if="property.parking" class="flex items-center gap-1.5">
          <Car class="h-4 w-4" /> {{ property.parking }}
        </li>
        <li class="flex items-center gap-1.5"><Ruler class="h-4 w-4" /> {{ property.areaM2 }} m²</li>
      </ul>

      <div class="mt-auto grid grid-cols-2 gap-2 pt-4">
        <RouterLink
          :to="detailPath"
          class="rounded-full border border-charcoal/20 px-4 py-2.5 text-center font-sans text-sm font-medium text-charcoal transition-colors hover:border-charcoal"
        >
          Ver detalles
        </RouterLink>
        <a
          :href="whatsappHref"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2.5 font-sans text-sm font-medium text-white transition-colors hover:bg-[#1DA851]"
          @click="trackWhatsApp"
        >
          <MessageCircle class="h-4 w-4" />
          WhatsApp
        </a>
      </div>
    </div>
  </article>
</template>
