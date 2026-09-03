<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useContactModal } from '../composables/useContactModal'

defineProps({
  solid: { type: Boolean, default: false },
})

const { openContactModal } = useContactModal()

const scrolled = ref(false)

function handleScroll() {
  scrolled.value = window.scrollY > 40
}

window.addEventListener('scroll', handleScroll)
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 transition-colors duration-500"
    :class="scrolled || solid ? 'bg-charcoal/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'"
  >
    <nav class="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-12">
      <RouterLink to="/" data-cursor-hover class="font-serif text-2xl tracking-[0.15em] text-cream">
        VENTAS <span class="text-gold-light">SABANA</span>
      </RouterLink>

      <ul class="hidden items-center gap-10 font-sans text-sm tracking-widest text-cream/80 md:flex">
        <li><a href="/#properties" class="transition-colors hover:text-gold-light">PROPIEDADES</a></li>
        <li><a href="/#about" class="transition-colors hover:text-gold-light">NOSOTROS</a></li>
        <li><a href="/#contact" class="transition-colors hover:text-gold-light">CONTACTO</a></li>
      </ul>

      <button
        data-cursor-hover
        class="hidden rounded-full border border-gold-light/60 px-6 py-2 font-sans text-xs tracking-widest text-gold-light transition-colors hover:bg-gold-light hover:text-charcoal md:inline-block"
        @click="openContactModal()"
      >
        AGENDAR VISITA
      </button>
    </nav>
  </header>
</template>
