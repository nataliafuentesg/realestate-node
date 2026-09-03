<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const props = defineProps({
  property: { type: Object, required: true },
  index: { type: Number, required: true },
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

const number = String(props.index + 1).padStart(2, '0')
const reversed = props.index % 2 === 1

const viewportRef = ref(null)
const parallaxRef = ref(null)
const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
let tween

onMounted(() => {
  if (prefersReducedMotion || !parallaxRef.value || !viewportRef.value) return
  tween = gsap.fromTo(
    parallaxRef.value,
    { yPercent: -8 },
    {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: {
        trigger: viewportRef.value,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    },
  )
})

onBeforeUnmount(() => {
  tween?.scrollTrigger?.kill()
  tween?.kill()
})
</script>

<template>
  <article v-reveal class="grid items-center gap-10 border-b border-charcoal/10 py-20 first:pt-0 lg:grid-cols-2 lg:gap-16">
    <RouterLink
      :to="`/propiedad/${property.id}`"
      data-cursor-hover
      class="group relative block overflow-hidden"
      :class="reversed ? 'lg:order-2' : ''"
    >
      <div ref="viewportRef" class="relative h-[380px] w-full overflow-hidden lg:h-[560px]">
        <div v-if="property.images?.[0]" ref="parallaxRef" class="absolute inset-x-0 -top-[15%] h-[130%] w-full">
          <img
            :src="property.images[0]"
            :alt="property.title"
            class="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"
          />
        </div>
        <div v-else class="flex h-full w-full items-center justify-center bg-charcoal/5">
          <span class="font-serif text-sm tracking-widest text-charcoal/30">VENTAS SABANA</span>
        </div>
      </div>
      <span class="absolute left-6 top-6 bg-charcoal/80 px-4 py-1 font-sans text-[11px] tracking-widest text-cream">
        {{ typeLabels[property.type] || property.type }}
      </span>
    </RouterLink>

    <div class="relative px-2 lg:px-8" :class="reversed ? 'lg:order-1' : ''">
      <span
        class="pointer-events-none absolute -top-6 left-0 select-none font-serif text-[110px] leading-none text-charcoal/5 lg:-top-10 lg:text-[160px]"
        aria-hidden="true"
      >
        {{ number }}
      </span>

      <div class="relative">
        <p class="font-sans text-xs tracking-[0.35em] text-gold">{{ property.city?.toUpperCase() }}</p>
        <h3 class="mt-4 font-serif text-3xl leading-tight text-charcoal lg:text-4xl">{{ property.title }}</h3>
        <p class="mt-4 max-w-md font-sans text-sm leading-relaxed text-charcoal/60">
          {{ property.description }}
        </p>

        <div class="mt-8 flex gap-8 font-sans text-sm text-charcoal/50">
          <span v-if="property.bedrooms">{{ property.bedrooms }} habitaciones</span>
          <span v-if="property.bathrooms">{{ property.bathrooms }} baños</span>
          <span>{{ property.areaM2 }} m²</span>
        </div>

        <p class="mt-8 font-serif text-4xl text-gold">{{ formatPrice(property.price) }}</p>

        <RouterLink
          :to="`/propiedad/${property.id}`"
          data-cursor-hover
          class="group mt-8 inline-flex items-center gap-3 border-b border-charcoal/30 pb-1 font-sans text-xs tracking-widest text-charcoal transition-colors hover:border-gold hover:text-gold"
        >
          VER PROPIEDAD
          <span class="transition-transform group-hover:translate-x-1">→</span>
        </RouterLink>
      </div>
    </div>
  </article>
</template>
