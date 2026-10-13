<script setup>
import { RouterLink } from 'vue-router'
import { House, Megaphone, Mail, MessageCircle } from '@lucide/vue'
import { track } from '../lib/analytics'
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/10 bg-white/95 backdrop-blur md:hidden"
    style="padding-bottom: env(safe-area-inset-bottom)"
    aria-label="Menú principal"
  >
    <ul class="mx-auto grid max-w-md grid-cols-4">
      <li>
        <RouterLink
          :to="{ path: '/', hash: '#properties' }"
          class="flex flex-col items-center gap-1 py-2.5 font-sans text-[11px] font-medium text-charcoal/70"
        >
          <House class="h-6 w-6" />
          Propiedades
        </RouterLink>
      </li>
      <li>
        <RouterLink
          to="/publica-con-nosotros"
          class="flex flex-col items-center gap-1 py-2.5 font-sans text-[11px] font-medium text-charcoal/70"
        >
          <Megaphone class="h-6 w-6" />
          Publica
        </RouterLink>
      </li>
      <li>
        <RouterLink
          :to="{ path: '/', hash: '#contact' }"
          class="flex flex-col items-center gap-1 py-2.5 font-sans text-[11px] font-medium text-charcoal/70"
        >
          <Mail class="h-6 w-6" />
          Contacto
        </RouterLink>
      </li>
      <li>
        <a
          href="https://wa.me/573112210714"
          target="_blank"
          rel="noopener noreferrer"
          class="flex flex-col items-center gap-1 py-2.5 font-sans text-[11px] font-medium text-[#1DA851]"
          @click="track('WhatsAppClick')"
        >
          <MessageCircle class="h-6 w-6" />
          WhatsApp
        </a>
      </li>
    </ul>
  </nav>
</template>
