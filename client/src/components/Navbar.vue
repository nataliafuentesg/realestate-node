<script setup>
import { RouterLink } from 'vue-router'
import { track } from '../lib/analytics'
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-t-4 border-charcoal/10 border-t-gold bg-white/95 backdrop-blur">
    <nav class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-8">
      <RouterLink to="/" class="font-serif text-xl tracking-[0.12em] text-charcoal">
        VENTAS <span class="text-gold">SABANA</span>
      </RouterLink>

      <ul class="hidden items-center gap-8 font-sans text-sm text-charcoal/70 md:flex">
        <li>
          <RouterLink :to="{ path: '/', hash: '#properties' }" class="transition-colors hover:text-gold">
            Propiedades
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/publica-con-nosotros" class="transition-colors hover:text-gold">
            Publica con nosotros
          </RouterLink>
        </li>
        <li>
          <RouterLink :to="{ path: '/', hash: '#about' }" class="transition-colors hover:text-gold">
            Nosotros
          </RouterLink>
        </li>
        <li>
          <RouterLink :to="{ path: '/', hash: '#contact' }" class="transition-colors hover:text-gold">
            Contacto
          </RouterLink>
        </li>
      </ul>

      <a
        href="https://wa.me/573112210714"
        target="_blank"
        rel="noopener noreferrer"
        class="rounded-full bg-[#25D366] px-5 py-2 font-sans text-sm font-medium text-white transition-colors hover:bg-[#1DA851]"
        @click="track('WhatsAppClick')"
      >
        WhatsApp
      </a>
    </nav>
  </header>
</template>
