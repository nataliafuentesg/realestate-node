<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  title: { type: String, default: '' },
})

const mapContainer = ref(null)
let map

const goldPin = L.divIcon({
  className: '',
  html: `<div style="
    width: 28px;
    height: 28px;
    background: #b28a4c;
    border: 3px solid #faf6f0;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 12px rgba(26,23,18,0.45);
  "></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -34],
})

onMounted(() => {
  map = L.map(mapContainer.value, {
    center: [props.lat, props.lng],
    zoom: 14,
    scrollWheelZoom: false,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  L.marker([props.lat, props.lng], { icon: goldPin }).addTo(map).bindPopup(props.title)
})

onBeforeUnmount(() => {
  map?.remove()
})
</script>

<template>
  <div ref="mapContainer" class="h-[380px] w-full"></div>
</template>
