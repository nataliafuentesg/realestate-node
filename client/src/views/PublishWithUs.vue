<script setup>
import { Video, Camera, Megaphone, MessageCircle, Handshake } from '@lucide/vue'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import BottomTabBar from '../components/BottomTabBar.vue'
import { useContactModal } from '../composables/useContactModal'
import { track } from '../lib/analytics'

const { openOwnerMeetingModal } = useContactModal()

const steps = [
  {
    icon: Video,
    title: 'Reunión virtual',
    text: 'Hablamos 30 minutos por videollamada: nos cuentas de tu propiedad, el precio que esperas y si quieres venderla o arrendarla.',
  },
  {
    icon: Camera,
    title: 'Preparamos tu publicación',
    text: 'Armamos la ficha con fotos, descripción y datos clave, y la publicamos en Ventas Sabana.',
  },
  {
    icon: Megaphone,
    title: 'La promocionamos',
    text: 'Hacemos pauta segmentada en Instagram y Facebook para llegar a personas que sí están buscando algo como lo tuyo.',
  },
  {
    icon: MessageCircle,
    title: 'Atendemos a los interesados',
    text: 'Respondemos por WhatsApp a todos los que escriban, resolvemos sus preguntas y filtramos para que solo te lleguen los serios.',
  },
  {
    icon: Handshake,
    title: 'Coordinamos visitas y cierre',
    text: 'Agendamos las visitas y te acompañamos en la negociación hasta cerrar el negocio.',
  },
]

const whatsappHref =
  'https://wa.me/573112210714?text=' +
  encodeURIComponent('Hola, quiero publicar mi propiedad con Ventas Sabana.')

function openMeeting() {
  track('ContactFormOwner', { source: 'publish_page_click' })
  openOwnerMeetingModal()
}
</script>

<template>
  <div class="min-h-screen bg-cream">
    <Navbar />

    <main class="mx-auto max-w-3xl px-4 pb-14 pt-8 lg:px-8 lg:pt-12">
      <p class="font-sans text-sm font-medium text-gold">PARA PROPIETARIOS</p>
      <h1 class="mt-2 font-serif text-3xl leading-tight text-charcoal sm:text-4xl">
        Publica tu propiedad con nosotros
      </h1>
      <p class="mt-3 font-sans text-base leading-relaxed text-charcoal/65">
        ¿Quieres vender o arrendar? Somos la inmobiliaria de Marcapro, una agencia de marketing: promocionamos tu
        propiedad como se promociona una marca, no solo la publicamos y esperamos.
      </p>

      <div class="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          class="rounded-full bg-charcoal px-6 py-3.5 font-sans text-sm font-medium text-white transition-colors hover:bg-gold"
          @click="openMeeting"
        >
          Agendar reunión virtual
        </button>
        <a
          :href="whatsappHref"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 font-sans text-sm font-medium text-white transition-colors hover:bg-[#1DA851]"
          @click="track('WhatsAppClick', { source: 'publish_page' })"
        >
          <MessageCircle class="h-4 w-4" />
          Escribir por WhatsApp
        </a>
      </div>

      <h2 class="mt-12 font-serif text-2xl text-charcoal">Cómo funciona</h2>
      <ol class="mt-5 space-y-4">
        <li
          v-for="(step, i) in steps"
          :key="step.title"
          class="flex gap-4 rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm"
        >
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
            <component :is="step.icon" class="h-5 w-5" />
          </span>
          <div>
            <p class="font-sans text-base font-medium text-charcoal">{{ i + 1 }}. {{ step.title }}</p>
            <p class="mt-1 font-sans text-sm leading-relaxed text-charcoal/65">{{ step.text }}</p>
          </div>
        </li>
      </ol>

      <div class="mt-10 rounded-2xl bg-charcoal p-6 text-cream">
        <h2 class="font-serif text-xl">¿Empezamos?</h2>
        <p class="mt-2 font-sans text-sm leading-relaxed text-cream/70">
          Agenda una reunión virtual y en ella te explicamos las condiciones del servicio y cómo trabajaríamos tu
          propiedad.
        </p>
        <button
          type="button"
          class="mt-4 rounded-full bg-white px-6 py-3 font-sans text-sm font-medium text-charcoal transition-colors hover:bg-cream"
          @click="openMeeting"
        >
          Agendar reunión virtual
        </button>
      </div>
    </main>

    <Footer />
    <BottomTabBar />
  </div>
</template>
