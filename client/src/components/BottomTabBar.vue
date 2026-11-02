<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { House, Megaphone, Mail, MessageCircle } from '@lucide/vue'
import { track } from '../lib/analytics'

const route = useRoute()

// En el home, la pestaña activa depende de la seccion que se este viendo.
const section = ref('properties')

function updateSection() {
  if (route.path !== '/') return
  const contact = document.getElementById('contact')
  const about = document.getElementById('about')
  const line = window.innerHeight * 0.5
  if (contact && contact.getBoundingClientRect().top < line) section.value = 'contact'
  else if (about && about.getBoundingClientRect().top < line) section.value = 'about'
  else section.value = 'properties'
}

onMounted(() => {
  updateSection()
  window.addEventListener('scroll', updateSection, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', updateSection))

const active = computed(() => {
  if (route.path === '/publica-con-nosotros') return 'publish'
  if (route.path === '/') return section.value === 'contact' ? 'contact' : 'properties'
  return ''
})

// Si ya estas en el home, el router no vuelve a hacer scroll al tocar la misma
// seccion otra vez (la URL no cambia): se hace a mano.
function goToSection(event, id) {
  if (route.path !== '/') return
  const el = document.getElementById(id)
  if (!el) return
  event.preventDefault()
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  history.replaceState(history.state, '', `/#${id}`)
}

const itemClass = (key) => [
  'flex flex-col items-center gap-1 px-1 py-2.5 font-sans text-xs font-medium transition-colors',
  active.value === key ? 'text-gold' : 'text-charcoal/55',
]
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
          :class="itemClass('properties')"
          :aria-current="active === 'properties' ? 'page' : undefined"
          @click="goToSection($event, 'properties')"
        >
          <House class="h-6 w-6" :stroke-width="active === 'properties' ? 2.4 : 1.8" />
          Propiedades
        </RouterLink>
      </li>
      <li>
        <RouterLink
          to="/publica-con-nosotros"
          :class="itemClass('publish')"
          :aria-current="active === 'publish' ? 'page' : undefined"
        >
          <Megaphone class="h-6 w-6" :stroke-width="active === 'publish' ? 2.4 : 1.8" />
          Publica
        </RouterLink>
      </li>
      <li>
        <RouterLink
          :to="{ path: '/', hash: '#contact' }"
          :class="itemClass('contact')"
          :aria-current="active === 'contact' ? 'page' : undefined"
          @click="goToSection($event, 'contact')"
        >
          <Mail class="h-6 w-6" :stroke-width="active === 'contact' ? 2.4 : 1.8" />
          Contacto
        </RouterLink>
      </li>
      <li>
        <a
          href="https://wa.me/573112210714"
          target="_blank"
          rel="noopener noreferrer"
          class="flex flex-col items-center gap-1 px-1 py-2.5 font-sans text-xs font-medium text-[#1DA851]"
          @click="track('WhatsAppClick')"
        >
          <MessageCircle class="h-6 w-6" :stroke-width="1.8" />
          WhatsApp
        </a>
      </li>
    </ul>
  </nav>
</template>
