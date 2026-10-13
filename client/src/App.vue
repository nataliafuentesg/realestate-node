<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import ContactModal from './components/ContactModal.vue'
import { initPixel, track } from './lib/analytics'

const route = useRoute()
const isAdmin = computed(() => route.path.startsWith('/admin'))

watchEffect(() => {
  route.fullPath // dependencia reactiva: re-ejecuta en cada navegacion
  if (isAdmin.value) return
  initPixel()
  track('PageView')

  // Google Analytics: al ser una SPA (no recarga al navegar), hay que
  // reenviar el page_view a mano en cada cambio de ruta -- el gtag('config')
  // del <head> solo cubre la carga inicial.
  if (window.gtag) window.gtag('event', 'page_view', { page_path: route.fullPath })
})
</script>

<template>
  <ContactModal v-if="!isAdmin" />
  <RouterView />
</template>
