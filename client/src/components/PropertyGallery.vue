<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  images: { type: Array, default: () => [] },
})

const containerRef = ref(null)
const revealed = ref(false)
const hoveredIndex = ref(null)
const lightboxIndex = ref(null)
let observer

function cardStyle(i) {
  const n = props.images.length
  const mid = (n - 1) / 2
  const offset = i - mid
  const isHovered = hoveredIndex.value === i

  let rotation = revealed.value ? offset * 9 : 0
  let translateX = revealed.value ? offset * 78 : 0
  let translateY = revealed.value ? Math.abs(offset) * 16 : 70
  const scale = isHovered ? 1.07 : 1

  if (isHovered) {
    rotation = 0
    translateY -= 30
  }

  return {
    transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${scale})`,
    transitionDelay: revealed.value && !isHovered ? `${i * 100}ms` : '0ms',
    zIndex: isHovered ? 50 : 10 + i,
  }
}

function openLightbox(i) {
  lightboxIndex.value = i
}

function closeLightbox() {
  lightboxIndex.value = null
}

function nextImage() {
  lightboxIndex.value = (lightboxIndex.value + 1) % props.images.length
}

function prevImage() {
  lightboxIndex.value = (lightboxIndex.value - 1 + props.images.length) % props.images.length
}

function onKeydown(e) {
  if (lightboxIndex.value === null) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowRight') nextImage()
  if (e.key === 'ArrowLeft') prevImage()
}

let touchStartX = 0

function onTouchStart(e) {
  touchStartX = e.changedTouches[0].clientX
}

function onTouchEnd(e) {
  const delta = e.changedTouches[0].clientX - touchStartX
  if (Math.abs(delta) < 40) return
  if (delta < 0) nextImage()
  else prevImage()
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        revealed.value = true
        observer.disconnect()
      }
    },
    { threshold: 0.2 },
  )
  if (containerRef.value) observer.observe(containerRef.value)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="containerRef" class="relative flex h-[380px] items-center justify-center sm:h-[460px]">
    <div
      v-for="(img, i) in images"
      :key="i"
      data-cursor-hover
      class="absolute h-[300px] w-[220px] cursor-pointer overflow-hidden rounded-sm shadow-2xl ring-1 ring-charcoal/10 transition-transform duration-700 ease-out sm:h-[380px] sm:w-[280px]"
      :style="cardStyle(i)"
      @mouseenter="hoveredIndex = i"
      @mouseleave="hoveredIndex = null"
      @click="openLightbox(i)"
    >
      <img :src="img" :alt="`Foto ${i + 1}`" class="h-full w-full object-cover" draggable="false" />
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="lightboxIndex !== null"
      class="fixed inset-0 z-[200] flex items-center justify-center bg-charcoal/95 backdrop-blur-sm"
      @click.self="closeLightbox"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <button
        data-cursor-hover
        class="absolute right-6 top-6 font-sans text-xs tracking-widest text-cream/70 transition-colors hover:text-gold-light"
        @click="closeLightbox"
      >
        CERRAR ✕
      </button>

      <button
        v-if="images.length > 1"
        data-cursor-hover
        class="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream/10 font-serif text-2xl text-cream transition-colors hover:bg-gold-light hover:text-charcoal sm:left-8 sm:h-12 sm:w-12"
        @click="prevImage"
      >
        ‹
      </button>

      <img
        :src="images[lightboxIndex]"
        :alt="`Foto ${lightboxIndex + 1}`"
        class="max-h-[85vh] max-w-[88vw] touch-pan-y object-contain shadow-2xl"
      />

      <button
        v-if="images.length > 1"
        data-cursor-hover
        class="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream/10 font-serif text-2xl text-cream transition-colors hover:bg-gold-light hover:text-charcoal sm:right-8 sm:h-12 sm:w-12"
        @click="nextImage"
      >
        ›
      </button>

      <p class="absolute bottom-6 font-sans text-xs tracking-widest text-cream/50">
        {{ lightboxIndex + 1 }} / {{ images.length }}
      </p>
    </div>
  </Teleport>
</template>
