<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import CustomCursor from './components/CustomCursor.vue'
import ScrollProgress from './components/ScrollProgress.vue'
import ContactModal from './components/ContactModal.vue'
import { initPixel, track } from './lib/analytics'

const route = useRoute()
const isAdmin = computed(() => route.path.startsWith('/admin'))

watchEffect(() => {
  document.body.classList.toggle('cursor-none', !isAdmin.value)
})

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
  <template v-if="!isAdmin">
    <ScrollProgress />
    <CustomCursor />
    <ContactModal />
  </template>
  <RouterView />
</template>
