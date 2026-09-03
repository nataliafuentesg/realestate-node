<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import api from '../api/axios'
import Navbar from '../components/Navbar.vue'
import Hero from '../components/Hero.vue'
import PropertyShowcase from '../components/PropertyShowcase.vue'
import StatsStrip from '../components/StatsStrip.vue'
import Divider from '../components/Divider.vue'
import Footer from '../components/Footer.vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const properties = ref([])
const loading = ref(true)
const error = ref(null)
const propertiesSectionRef = ref(null)

const filters = ref({ city: '', type: '', maxPrice: '' })
const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
let bgTween

onMounted(async () => {
  try {
    const res = await api.get('/properties')
    properties.value = res.data
  } catch (err) {
    error.value = 'No se pudo conectar con la API'
  } finally {
    loading.value = false
  }

  if (!prefersReducedMotion && propertiesSectionRef.value) {
    bgTween = gsap.fromTo(
      propertiesSectionRef.value,
      { backgroundColor: '#1a1712' },
      {
        backgroundColor: '#faf6f0',
        ease: 'none',
        scrollTrigger: {
          trigger: propertiesSectionRef.value,
          start: 'top bottom',
          end: 'top 40%',
          scrub: true,
        },
      },
    )
  }
})

onBeforeUnmount(() => {
  bgTween?.scrollTrigger?.kill()
  bgTween?.kill()
})

const cities = computed(() => [...new Set(properties.value.map((p) => p.city))])
const types = computed(() => [...new Set(properties.value.map((p) => p.type))])

const filteredProperties = computed(() => {
  return properties.value.filter((p) => {
    if (filters.value.city && p.city !== filters.value.city) return false
    if (filters.value.type && p.type !== filters.value.type) return false
    if (filters.value.maxPrice && p.price > Number(filters.value.maxPrice)) return false
    return true
  })
})
</script>

<template>
  <div class="bg-cream">
    <Navbar />
    <Hero v-model:filters="filters" :cities="cities" :types="types" />

    <StatsStrip :properties-count="properties.length" :cities-count="cities.length" />

    <section
      id="properties"
      ref="propertiesSectionRef"
      class="relative z-10 bg-cream px-6 pb-8 pt-24 lg:px-12"
    >
      <div class="mx-auto max-w-6xl">
        <div v-reveal class="mb-4 text-center">
          <p class="font-sans text-xs tracking-[0.4em] text-gold">COLECCIÓN</p>
          <h2 class="mt-3 font-serif text-4xl text-charcoal">Propiedades destacadas</h2>
        </div>

        <Divider />

        <p v-if="loading" class="py-16 text-center font-sans text-charcoal/50">Cargando propiedades...</p>
        <p v-else-if="error" class="py-16 text-center font-sans text-red-500">{{ error }}</p>
        <p v-else-if="filteredProperties.length === 0" class="py-16 text-center font-sans text-charcoal/50">
          No hay propiedades que coincidan con tu búsqueda.
        </p>

        <div v-else>
          <PropertyShowcase
            v-for="(property, i) in filteredProperties"
            :key="property.id"
            :property="property"
            :index="i"
          />
        </div>
      </div>
    </section>

    <Footer />
  </div>
</template>
