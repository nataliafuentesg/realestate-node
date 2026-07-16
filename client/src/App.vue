<script setup>
import { RouterView } from 'vue-router'
import CustomCursor from './components/CustomCursor.vue'
import ScrollProgress from './components/ScrollProgress.vue'
import ContactModal from './components/ContactModal.vue'
</script>

<template>
  <ScrollProgress />
  <CustomCursor />
  <ContactModal />
  <RouterView />
</template>
