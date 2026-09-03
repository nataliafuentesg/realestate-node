<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import CustomCursor from './components/CustomCursor.vue'
import ScrollProgress from './components/ScrollProgress.vue'
import ContactModal from './components/ContactModal.vue'

const route = useRoute()
const isAdmin = computed(() => route.path.startsWith('/admin'))

watchEffect(() => {
  document.body.classList.toggle('cursor-none', !isAdmin.value)
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
