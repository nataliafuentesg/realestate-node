<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import HeroScene from './HeroScene.vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
// El navbar dinamico de Safari/Chrome moviles dispara resize al mostrarse
// u ocultarse durante el scroll -- sin esto, ScrollTrigger recalcula todo
// en cada uno y se ve un parpadeo/salto en el fondo del hero.
ScrollTrigger.config({ ignoreMobileResize: true })

defineProps({
  cities: { type: Array, default: () => [] },
  types: { type: Array, default: () => [] },
})

const filters = defineModel('filters', {
  default: () => ({ city: '', type: '', maxPrice: '' }),
})

const typeLabels = { HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Lote' }

const heroRef = ref(null)
const bgRef = ref(null)
const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
let st

onMounted(() => {
  if (prefersReducedMotion || !heroRef.value || !bgRef.value) return
  st = ScrollTrigger.create({
    trigger: heroRef.value,
    start: 'top top',
    end: 'bottom top',
    // scrub:true ata el cambio de opacidad/escala 1:1 al evento de scroll,
    // forzando un recalculo sincronico en cada tick -- en movil, compitiendo
    // con el loop de render de Three.js (corre cada frame aparte), eso se
    // sentia como parpadeo. Con un numero, GSAP suaviza/retrasa la
    // actualizacion en vez de forzarla en cada pixel de scroll.
    scrub: 0.4,
    onUpdate(self) {
      gsap.set(bgRef.value, {
        opacity: 1 - self.progress,
        scale: 1 + self.progress * 0.12,
      })
    },
  })
})

onBeforeUnmount(() => {
  st?.kill()
})
</script>

<template>
  <section ref="heroRef" class="relative h-[92dvh] min-h-[600px] bg-charcoal">
    <div ref="bgRef" class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <HeroScene />
      <div class="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/10 to-charcoal/30"></div>
    </div>

    <div class="relative z-10 mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-6 text-center">
      <p class="mb-4 font-sans text-xs tracking-[0.4em] text-gold-light">RESIDENCIAS EXCLUSIVAS</p>
      <h1 class="font-serif text-4xl leading-tight text-cream sm:text-5xl lg:text-6xl">
        Propiedades excepcionales,<br />
        <em class="text-gold-light not-italic">para vidas excepcionales</em>
      </h1>
      <p class="mt-6 max-w-xl font-sans text-base text-cream/70">
        Una selección curada de las residencias más distinguidas del país.
      </p>
    </div>

    <div
      class="absolute inset-x-0 bottom-0 z-20 translate-y-1/2 px-6"
    >
      <div class="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl bg-cream p-6 shadow-2xl sm:flex-row sm:items-end">
        <div class="flex-1">
          <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">CIUDAD</label>
          <select
            v-model="filters.city"
            class="w-full border-b border-charcoal/20 bg-transparent py-2 font-sans text-charcoal focus:border-gold focus:outline-none"
          >
            <option value="">Todas</option>
            <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
          </select>
        </div>

        <div class="flex-1">
          <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">TIPO</label>
          <select
            v-model="filters.type"
            class="w-full border-b border-charcoal/20 bg-transparent py-2 font-sans text-charcoal focus:border-gold focus:outline-none"
          >
            <option value="">Todos</option>
            <option v-for="type in types" :key="type" :value="type">{{ typeLabels[type] || type }}</option>
          </select>
        </div>

        <div class="flex-1">
          <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">PRECIO MÁXIMO</label>
          <select
            v-model="filters.maxPrice"
            class="w-full border-b border-charcoal/20 bg-transparent py-2 font-sans text-charcoal focus:border-gold focus:outline-none"
          >
            <option value="">Sin límite</option>
            <option value="300000000">$300.000.000</option>
            <option value="500000000">$500.000.000</option>
            <option value="1000000000">$1.000.000.000</option>
          </select>
        </div>

        <button
          class="rounded-full bg-charcoal px-8 py-3 font-sans text-xs tracking-widest text-cream transition-colors hover:bg-gold hover:text-charcoal sm:self-end"
        >
          BUSCAR
        </button>
      </div>
    </div>
  </section>
</template>
