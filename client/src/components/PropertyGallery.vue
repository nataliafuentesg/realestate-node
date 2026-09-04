<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  images: { type: Array, default: () => [] },
})

const lightboxIndex = ref(null)

const MAX_THUMBS = 4
const thumbImages = computed(() => props.images.slice(1, 1 + MAX_THUMBS))
const extraCount = computed(() => Math.max(0, props.images.length - 1 - MAX_THUMBS))

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
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div v-if="images.length" class="grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-sm sm:h-[460px]">
    <button
      type="button"
      data-cursor-hover
      class="group relative col-span-4 row-span-2 h-[300px] overflow-hidden sm:col-span-2 sm:h-full"
      @click="openLightbox(0)"
    >
      <img
        :src="images[0]"
        alt="Foto 1"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        draggable="false"
      />
    </button>

    <button
      v-for="(img, i) in thumbImages"
      :key="i"
      type="button"
      data-cursor-hover
      class="group relative col-span-1 row-span-1 hidden overflow-hidden sm:block"
      @click="openLightbox(i + 1)"
    >
      <img
        :src="img"
        :alt="`Foto ${i + 2}`"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        draggable="false"
      />
      <span
        v-if="i === thumbImages.length - 1 && extraCount > 0"
        class="absolute inset-0 flex items-center justify-center bg-charcoal/60 font-sans text-sm tracking-widest text-cream"
      >
        +{{ extraCount }} FOTOS
      </span>
    </button>

    <button
      v-if="images.length > 1"
      type="button"
      data-cursor-hover
      class="col-span-4 flex items-center justify-center gap-2 rounded-full border border-charcoal/15 bg-white px-5 py-3 font-sans text-xs tracking-widest text-charcoal shadow-sm sm:hidden"
      @click="openLightbox(0)"
    >
      VER LAS {{ images.length }} FOTOS
    </button>
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

      <div
        v-if="images.length > 1"
        class="absolute bottom-16 flex max-w-[90vw] gap-2 overflow-x-auto px-4"
      >
        <button
          v-for="(img, i) in images"
          :key="i"
          type="button"
          data-cursor-hover
          class="h-12 w-16 shrink-0 overflow-hidden rounded-sm ring-2 transition-opacity"
          :class="i === lightboxIndex ? 'opacity-100 ring-gold-light' : 'opacity-50 ring-transparent hover:opacity-80'"
          @click="lightboxIndex = i"
        >
          <img :src="img" :alt="`Miniatura ${i + 1}`" class="h-full w-full object-cover" draggable="false" />
        </button>
      </div>
    </div>
  </Teleport>
</template>
