<script setup>
import { computed } from 'vue'

const props = defineProps({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  title: { type: String, default: '' },
})

// Embed clasico de Google Maps por URL -- sin API key ni facturacion,
// a diferencia del Maps JavaScript API. No es la forma "oficial"
// documentada, pero es estable y la usan miles de sitios para exactamente
// este caso (un pin fijo, sin necesitar controles interactivos propios).
const embedSrc = computed(() => `https://maps.google.com/maps?q=${props.lat},${props.lng}&z=15&output=embed`)
</script>

<template>
  <iframe
    class="h-[380px] w-full border-0"
    :src="embedSrc"
    loading="lazy"
    referrerpolicy="no-referrer-when-downgrade"
    :title="`Mapa de ${title}`"
  ></iframe>
</template>
