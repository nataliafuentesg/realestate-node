<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useContactModal } from '../composables/useContactModal'

defineProps({
  solid: { type: Boolean, default: false },
})

const { openContactModal } = useContactModal()

const scrolled = ref(false)
const mobileOpen = ref(false)

function handleScroll() {
  scrolled.value = window.scrollY > 40
}

window.addEventListener('scroll', handleScroll)

function closeMobile() {
  mobileOpen.value = false
}

function handleAgendar() {
  closeMobile()
  openContactModal()
}
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 transition-colors duration-500"
    :class="scrolled || solid || mobileOpen ? 'bg-charcoal/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'"
  >
    <nav class="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-12">
      <RouterLink to="/" data-cursor-hover class="font-serif text-2xl tracking-[0.15em] text-cream" @click="closeMobile">
        VENTAS <span class="text-gold-light">SABANA</span>
      </RouterLink>

      <ul class="hidden items-center gap-10 font-sans text-sm tracking-widest text-cream/80 md:flex">
        <li><a href="/#properties" class="transition-colors hover:text-gold-light">PROPIEDADES</a></li>
        <li><a href="/#about" class="transition-colors hover:text-gold-light">NOSOTROS</a></li>
        <li><a href="/#contact" class="transition-colors hover:text-gold-light">CONTACTO</a></li>
      </ul>

      <button
        data-cursor-hover
        class="hidden rounded-full border border-gold-light/60 px-6 py-2 font-sans text-xs tracking-widest text-cream/80 md:inline-block"
        @click="openContactModal()"
      >
        AGENDAR VISITA
      </button>

      <button
        data-cursor-hover
        class="flex h-8 w-8 flex-col items-center justify-center gap-1.5 md:hidden"
        aria-label="Abrir menú"
        @click="mobileOpen = !mobileOpen"
      >
        <span
          class="block h-px w-6 bg-cream transition-transform duration-300"
          :class="mobileOpen ? 'translate-y-[3.5px] rotate-45' : ''"
        ></span>
        <span
          class="block h-px w-6 bg-cream transition-transform duration-300"
          :class="mobileOpen ? '-translate-y-[3.5px] -rotate-45' : ''"
        ></span>
      </button>
    </nav>

    <div v-show="mobileOpen" class="md:hidden">
      <ul class="flex flex-col gap-1 px-6 pb-6 font-sans text-sm tracking-widest text-cream/80">
        <li>
          <a href="/#properties" class="block py-3" @click="closeMobile">PROPIEDADES</a>
        </li>
        <li>
          <a href="/#about" class="block py-3" @click="closeMobile">NOSOTROS</a>
        </li>
        <li>
          <a href="/#contact" class="block py-3" @click="closeMobile">CONTACTO</a>
        </li>
        <li>
          <button
            class="mt-2 w-full rounded-full border border-gold-light/60 px-6 py-3 text-center text-xs text-cream/80"
            @click="handleAgendar"
          >
            AGENDAR VISITA
          </button>
        </li>
      </ul>
    </div>
  </header>
</template>
