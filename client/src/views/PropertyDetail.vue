<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import api from '../api/axios'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import PropertyGallery from '../components/PropertyGallery.vue'
import PropertyMap from '../components/PropertyMap.vue'
import { useContactModal } from '../composables/useContactModal'
import { track } from '../lib/analytics'
import { isRental } from '../lib/listing'

const { openContactModal } = useContactModal()

const route = useRoute()
const property = ref(null)
const loading = ref(true)
const error = ref(null)

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

const whatsappHref = computed(() => {
  if (!property.value) return ''
  const message = `Hola, quiero más información sobre: ${property.value.title}\n${window.location.href}`
  return `https://wa.me/573112210714?text=${encodeURIComponent(message)}`
})

function trackWhatsApp() {
  track('WhatsAppClick', { propertyId: property.value?.id })
}

onMounted(async () => {
  try {
    const res = await api.get(`/properties/${route.params.id}`)
    property.value = res.data
    track('PropertyView', { propertyId: property.value.id })
  } catch (err) {
    error.value = 'No se pudo cargar esta propiedad'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-cream">
    <Navbar />

    <template v-if="loading">
      <div class="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <div class="h-8 w-2/3 animate-pulse rounded bg-charcoal/10"></div>
        <div class="mt-4 h-10 w-1/3 animate-pulse rounded bg-charcoal/10"></div>
        <div class="mt-6 h-[300px] animate-pulse rounded-2xl bg-charcoal/10 sm:h-[460px]"></div>
      </div>
    </template>
    <p v-else-if="error" class="py-32 text-center font-sans text-red-500">{{ error }}</p>

    <template v-else-if="property">
      <div class="mx-auto max-w-6xl px-4 pt-5 lg:px-8">
        <RouterLink
          :to="{ path: '/', hash: '#properties' }"
          class="inline-flex items-center gap-1 font-sans text-sm text-charcoal/60 transition-colors hover:text-gold"
        >
          ← Volver a propiedades
        </RouterLink>

        <p class="mt-4 font-sans text-sm text-charcoal/55">
          {{ isRental(property) ? 'Arriendo · ' : '' }}{{ typeLabels[property.type] || property.type }}
        </p>
        <h1 class="mt-1 font-serif text-2xl leading-tight text-charcoal sm:text-3xl lg:text-4xl">{{ property.title }}</h1>
        <p class="mt-1 font-sans text-sm text-charcoal/60">
          {{ property.neighborhood ? property.neighborhood + ', ' : '' }}{{ property.city }}
        </p>

        <p class="mt-4 font-serif text-3xl text-gold lg:text-4xl">
          {{ formatPrice(property.price) }}
          <span v-if="isRental(property)" class="font-sans text-base text-charcoal/50">/ mes</span>
        </p>
        <p
          v-if="isRental(property) && property.administrationIncluded"
          class="mt-1 font-sans text-sm text-charcoal/55"
        >
          Administración incluida
        </p>

        <ul class="mt-4 flex flex-wrap gap-2 font-sans text-sm text-charcoal/75">
          <li v-if="property.bedrooms" class="rounded-full bg-gold/10 px-3 py-1.5">{{ property.bedrooms }} hab.</li>
          <li v-if="property.bathrooms" class="rounded-full bg-gold/10 px-3 py-1.5">
            {{ property.bathrooms }} {{ property.bathrooms === 1 ? 'baño' : 'baños' }}
          </li>
          <li v-if="property.parking" class="rounded-full bg-gold/10 px-3 py-1.5">
            {{ property.parking }} {{ property.parking === 1 ? 'parqueadero' : 'parqueaderos' }}
          </li>
          <li class="rounded-full bg-gold/10 px-3 py-1.5">{{ property.areaM2 }} m²</li>
        </ul>
      </div>

      <div class="mx-auto max-w-6xl px-4 pb-10 pt-6 lg:px-8">
        <div class="grid gap-10 lg:grid-cols-3 lg:gap-12">
          <div class="order-1 lg:col-span-2">
            <PropertyGallery :images="property.images" />

            <h2 class="mt-10 font-serif text-2xl text-charcoal">Descripción</h2>
            <p class="mt-4 whitespace-pre-line font-sans leading-relaxed text-charcoal/70">
              {{ property.description }}
            </p>

            <template v-if="property.features?.length">
              <h2 v-reveal class="mt-16 font-serif text-2xl text-charcoal">Características</h2>
              <ul v-reveal class="mt-6 grid gap-3 sm:grid-cols-2">
                <li
                  v-for="feature in property.features"
                  :key="feature"
                  class="flex items-start gap-2.5 font-sans text-charcoal/70"
                >
                  <span class="mt-0.5 text-gold">✓</span>
                  <span>{{ feature }}</span>
                </li>
              </ul>
            </template>

            <template
              v-if="property.propertyRegistration || property.cadastralCode || property.legalStatus || property.zoning || property.address"
            >
              <h2 v-reveal class="mt-16 font-serif text-2xl text-charcoal">Información legal y técnica</h2>
              <dl v-reveal class="mt-6 grid gap-4 sm:grid-cols-2">
                <div v-if="property.address">
                  <dt class="font-sans text-xs tracking-widest text-charcoal/40">DIRECCIÓN</dt>
                  <dd class="mt-1 font-sans text-charcoal/70">{{ property.address }}</dd>
                </div>
                <div v-if="property.zoning">
                  <dt class="font-sans text-xs tracking-widest text-charcoal/40">USO DE SUELO</dt>
                  <dd class="mt-1 font-sans text-charcoal/70">{{ property.zoning }}</dd>
                </div>
                <div v-if="property.propertyRegistration">
                  <dt class="font-sans text-xs tracking-widest text-charcoal/40">MATRÍCULA INMOBILIARIA</dt>
                  <dd class="mt-1 font-sans text-charcoal/70">{{ property.propertyRegistration }}</dd>
                </div>
                <div v-if="property.cadastralCode">
                  <dt class="font-sans text-xs tracking-widest text-charcoal/40">CÓDIGO CATASTRAL</dt>
                  <dd class="mt-1 font-sans text-charcoal/70">{{ property.cadastralCode }}</dd>
                </div>
                <div v-if="property.legalStatus">
                  <dt class="font-sans text-xs tracking-widest text-charcoal/40">ESTADO LEGAL</dt>
                  <dd class="mt-1 font-sans text-charcoal/70">{{ property.legalStatus }}</dd>
                </div>
              </dl>
            </template>

            <template v-if="property.lat && property.lng">
              <h2 v-reveal class="mt-16 font-serif text-2xl text-charcoal">Ubicación</h2>
              <div v-reveal class="mt-8 border border-charcoal/10">
                <PropertyMap :lat="property.lat" :lng="property.lng" :title="property.title" />
              </div>
              <div v-reveal class="mt-4 flex flex-wrap gap-3">
                <a
                  :href="`https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`"
                  target="_blank"
                  rel="noopener"
                  data-cursor-hover
                  class="flex items-center gap-2 rounded-full border border-charcoal/15 bg-white px-5 py-2.5 font-sans text-sm text-charcoal shadow-sm transition-colors hover:border-gold hover:text-gold"
                >
                  <svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0">
                    <path
                      fill="#4285F4"
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z"
                    />
                    <circle cx="12" cy="9" r="2.5" fill="#fff" />
                  </svg>
                  Google Maps
                </a>
                <a
                  :href="`https://maps.apple.com/?ll=${property.lat},${property.lng}&q=${encodeURIComponent(property.title)}`"
                  target="_blank"
                  rel="noopener"
                  data-cursor-hover
                  class="flex items-center gap-2 rounded-full border border-charcoal/15 bg-white px-5 py-2.5 font-sans text-sm text-charcoal shadow-sm transition-colors hover:border-gold hover:text-gold"
                >
                  <svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0">
                    <path
                      fill="#1a1a1a"
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z"
                    />
                    <circle cx="12" cy="9" r="2.5" fill="#fff" />
                  </svg>
                  Apple Maps
                </a>
                <a
                  :href="`https://waze.com/ul?ll=${property.lat},${property.lng}&navigate=yes`"
                  target="_blank"
                  rel="noopener"
                  data-cursor-hover
                  class="flex items-center gap-2 rounded-full border border-charcoal/15 bg-white px-5 py-2.5 font-sans text-sm text-charcoal shadow-sm transition-colors hover:border-gold hover:text-gold"
                >
                  <svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0">
                    <circle cx="12" cy="12" r="10" fill="#05C8F7" />
                    <path fill="#fff" d="M12 6.5 17 12l-5 5.5L7 12Z" />
                  </svg>
                  Waze
                </a>
              </div>
            </template>
          </div>

          <aside class="order-2 lg:col-span-1">
            <div class="lg:sticky lg:top-28 border border-charcoal/10 bg-white p-8 shadow-sm">
              <p class="font-sans text-xs tracking-widest text-charcoal/50">
                {{ isRental(property) ? 'CANON MENSUAL' : 'PRECIO' }}
              </p>
              <p class="mt-2 font-serif text-3xl text-gold">
                {{ formatPrice(property.price) }}
                <span v-if="isRental(property)" class="font-sans text-sm text-charcoal/50">/ mes</span>
              </p>
              <p
                v-if="isRental(property) && property.administrationIncluded"
                class="mt-1 font-sans text-xs tracking-widest text-charcoal/50"
              >
                ADMINISTRACIÓN INCLUIDA
              </p>

              <ul class="mt-6 space-y-3 border-t border-charcoal/10 pt-6 font-sans text-sm text-charcoal/60">
                <li v-if="property.bedrooms" class="flex justify-between">
                  <span>Habitaciones</span><span class="text-charcoal">{{ property.bedrooms }}</span>
                </li>
                <li v-if="property.bathrooms" class="flex justify-between">
                  <span>Baños</span><span class="text-charcoal">{{ property.bathrooms }}</span>
                </li>
                <li v-if="property.parking" class="flex justify-between">
                  <span>Parqueaderos</span><span class="text-charcoal">{{ property.parking }}</span>
                </li>
                <li class="flex justify-between">
                  <span>{{ property.type === 'LAND' ? 'Área del lote' : 'Área' }}</span><span class="text-charcoal">{{ property.areaM2 }} m²</span>
                </li>
                <li v-if="property.areaBuiltM2" class="flex justify-between">
                  <span>Área construida</span><span class="text-charcoal">{{ property.areaBuiltM2 }} m²</span>
                </li>
                <li v-if="property.stratum" class="flex justify-between">
                  <span>Estrato</span><span class="text-charcoal">{{ property.stratum }}</span>
                </li>
                <li v-if="property.neighborhood" class="flex justify-between">
                  <span>Vereda / Barrio</span><span class="text-charcoal">{{ property.neighborhood }}</span>
                </li>
                <li class="flex justify-between">
                  <span>Ciudad</span><span class="text-charcoal">{{ property.city }}</span>
                </li>
              </ul>

              <button
                data-cursor-hover
                class="mt-8 w-full rounded-full bg-gold px-6 py-4 font-sans text-xs tracking-widest text-white transition-colors hover:bg-red-700"
                @click="openContactModal(property)"
              >
                AGENDAR VISITA
              </button>

              <a
                :href="whatsappHref"
                target="_blank"
                rel="noopener"
                data-cursor-hover
                @click="trackWhatsApp"
                class="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-4 font-sans text-xs tracking-widest text-white shadow-sm transition-colors hover:bg-[#1DA851]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
                  <path
                    d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.4A10 10 0 1 0 12 2Zm0 18.2a8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1s-.7.8-.9 1c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.4a.5.5 0 0 0 0-.4c-.1-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4.1c.6.3 1.1.4 1.5.6a3.6 3.6 0 0 0 1.7.1c.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.4-.3Z"
                  />
                </svg>
                PREGUNTAR POR WHATSAPP
              </a>
            </div>
          </aside>
        </div>
      </div>

      <div class="pb-20 lg:hidden"></div>

      <div
        class="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-charcoal/10 bg-cream/95 px-4 py-3 backdrop-blur-sm lg:hidden"
        style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))"
      >
        <button
          data-cursor-hover
          class="flex-1 rounded-full bg-gold px-4 py-3 font-sans text-xs tracking-widest text-white"
          @click="openContactModal(property)"
        >
          AGENDAR VISITA
        </button>
        <a
          :href="whatsappHref"
          target="_blank"
          rel="noopener"
          data-cursor-hover
          @click="trackWhatsApp"
          class="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 font-sans text-xs tracking-widest text-white"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4 shrink-0">
            <path
              d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.4A10 10 0 1 0 12 2Zm0 18.2a8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1s-.7.8-.9 1c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.4a.5.5 0 0 0 0-.4c-.1-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4.1c.6.3 1.1.4 1.5.6a3.6 3.6 0 0 0 1.7.1c.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.4-.3Z"
            />
          </svg>
          WHATSAPP
        </a>
      </div>
    </template>

    <Footer />
  </div>
</template>
