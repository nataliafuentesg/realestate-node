<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api/axios'
import { isRental } from '../lib/listing'
import Navbar from '../components/Navbar.vue'
import PropertyFilters from '../components/PropertyFilters.vue'
import PropertyCard from '../components/PropertyCard.vue'
import BottomTabBar from '../components/BottomTabBar.vue'
import About from '../components/About.vue'
import Contact from '../components/Contact.vue'
import Footer from '../components/Footer.vue'

const properties = ref([])
const loading = ref(true)
const error = ref(null)

const route = useRoute()
// Enlaces como /?operacion=arriendo (los usan los bots de Instagram y Facebook)
// llegan con el filtro de operacion ya puesto.
const OPERATION_FROM_QUERY = { arriendo: 'RENT', venta: 'SALE' }
const filters = ref({
  operation: OPERATION_FROM_QUERY[String(route.query.operacion || '').toLowerCase()] || '',
  city: '',
  type: '',
  maxPrice: '',
})

onMounted(async () => {
  try {
    const res = await api.get('/properties')
    properties.value = res.data
  } catch (err) {
    error.value = 'No se pudo conectar con la API'
  } finally {
    loading.value = false
  }
})

const cities = computed(() => [...new Set(properties.value.map((p) => p.city))])
const types = computed(() => [...new Set(properties.value.map((p) => p.type))])

const filteredProperties = computed(() => {
  return properties.value.filter((p) => {
    if (filters.value.operation === 'RENT' && !isRental(p)) return false
    if (filters.value.operation === 'SALE' && isRental(p)) return false
    if (filters.value.city && p.city !== filters.value.city) return false
    if (filters.value.type && p.type !== filters.value.type) return false
    if (filters.value.maxPrice && p.price > Number(filters.value.maxPrice)) return false
    return true
  })
})
</script>

<template>
  <div class="min-h-screen bg-cream">
    <Navbar />

    <main>
      <section id="properties" class="mx-auto max-w-6xl px-4 pb-14 pt-6 lg:px-8 lg:pt-10">
        <h1 class="font-serif text-2xl text-charcoal sm:text-3xl">Propiedades en venta y arriendo</h1>
        <p class="mt-1 font-sans text-sm text-charcoal/60">
          Lotes, casas y apartamentos en la Sabana y Bogotá. Escríbenos por WhatsApp y te respondemos de una.
        </p>

        <div class="mt-5">
          <PropertyFilters v-model:filters="filters" :cities="cities" :types="types" />
        </div>

        <div v-if="loading" class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="i in 3" :key="i" class="h-96 animate-pulse rounded-2xl bg-charcoal/5"></div>
        </div>
        <p v-else-if="error" class="py-16 text-center font-sans text-red-500">{{ error }}</p>
        <p v-else-if="filteredProperties.length === 0" class="py-16 text-center font-sans text-charcoal/50">
          No hay propiedades que coincidan con tu búsqueda.
        </p>

        <template v-else>
          <p class="mt-5 font-sans text-sm text-charcoal/50">
            {{ filteredProperties.length }}
            {{ filteredProperties.length === 1 ? 'propiedad' : 'propiedades' }}
          </p>
          <div class="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <PropertyCard v-for="property in filteredProperties" :key="property.id" :property="property" />
          </div>
        </template>
      </section>

      <About />
      <Contact />
    </main>

    <Footer />
    <BottomTabBar />
  </div>
</template>
