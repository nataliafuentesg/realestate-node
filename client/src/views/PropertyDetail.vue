<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import api from '../api/axios'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import PropertyGallery from '../components/PropertyGallery.vue'
import PropertyMap from '../components/PropertyMap.vue'
import { useContactModal } from '../composables/useContactModal'

const { openContactModal } = useContactModal()

const route = useRoute()
const property = ref(null)
const loading = ref(true)
const error = ref(null)

const typeLabels = {
  house: 'Casa',
  apartment: 'Apartamento',
  land: 'Lote',
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(price)
}

onMounted(async () => {
  try {
    const res = await api.get(`/properties/${route.params.id}`)
    property.value = res.data
  } catch (err) {
    error.value = 'No se pudo cargar esta propiedad'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-cream">
    <Navbar solid />

    <p v-if="loading" class="py-32 text-center font-sans text-charcoal/50">Cargando propiedad...</p>
    <p v-else-if="error" class="py-32 text-center font-sans text-red-500">{{ error }}</p>

    <template v-else-if="property">
      <div class="relative h-[65vh] min-h-[440px] w-full overflow-hidden bg-charcoal">
        <img
          v-if="property.images?.[0]"
          :src="property.images[0]"
          :alt="property.title"
          class="h-full w-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/20 to-charcoal/50"></div>

        <RouterLink
          to="/"
          data-cursor-hover
          class="absolute left-6 top-28 inline-flex items-center gap-2 font-sans text-xs tracking-widest text-cream/70 transition-colors hover:text-gold-light lg:left-12"
        >
          ← VOLVER A PROPIEDADES
        </RouterLink>

        <div class="absolute inset-x-0 bottom-0 px-6 pb-12 text-center lg:px-12">
          <p class="font-sans text-xs tracking-[0.35em] text-gold-light">
            {{ property.city?.toUpperCase() }} · {{ typeLabels[property.type] || property.type }}
          </p>
          <h1 class="mt-4 font-serif text-4xl text-cream lg:text-5xl">{{ property.title }}</h1>
        </div>
      </div>

      <div class="mx-auto max-w-6xl px-6 py-16 lg:px-12">
        <div class="grid gap-16 lg:grid-cols-3">
          <div class="lg:col-span-2">
            <h2 v-reveal class="font-serif text-2xl text-charcoal">Galería</h2>
            <div class="mt-8">
              <PropertyGallery :images="property.images" />
            </div>

            <h2 v-reveal class="mt-16 font-serif text-2xl text-charcoal">Descripción</h2>
            <p v-reveal class="mt-6 font-sans leading-relaxed text-charcoal/70">
              {{ property.description }}
            </p>

            <template v-if="property.lat && property.lng">
              <h2 v-reveal class="mt-16 font-serif text-2xl text-charcoal">Ubicación</h2>
              <div v-reveal class="mt-8 border border-charcoal/10">
                <PropertyMap :lat="property.lat" :lng="property.lng" :title="property.title" />
              </div>
            </template>
          </div>

          <aside v-reveal class="lg:col-span-1">
            <div class="sticky top-28 border border-charcoal/10 bg-white p-8 shadow-sm">
              <p class="font-sans text-xs tracking-widest text-charcoal/50">PRECIO</p>
              <p class="mt-2 font-serif text-3xl text-gold">{{ formatPrice(property.price) }}</p>

              <ul class="mt-6 space-y-3 border-t border-charcoal/10 pt-6 font-sans text-sm text-charcoal/60">
                <li v-if="property.bedrooms" class="flex justify-between">
                  <span>Habitaciones</span><span class="text-charcoal">{{ property.bedrooms }}</span>
                </li>
                <li v-if="property.bathrooms" class="flex justify-between">
                  <span>Baños</span><span class="text-charcoal">{{ property.bathrooms }}</span>
                </li>
                <li class="flex justify-between">
                  <span>Área</span><span class="text-charcoal">{{ property.areaM2 }} m²</span>
                </li>
                <li class="flex justify-between">
                  <span>Ciudad</span><span class="text-charcoal">{{ property.city }}</span>
                </li>
              </ul>

              <button
                data-cursor-hover
                class="mt-8 w-full rounded-full bg-charcoal px-6 py-4 font-sans text-xs tracking-widest text-cream transition-colors hover:bg-gold hover:text-charcoal"
                @click="openContactModal(property)"
              >
                AGENDAR VISITA
              </button>
            </div>
          </aside>
        </div>
      </div>
    </template>

    <Footer />
  </div>
</template>
