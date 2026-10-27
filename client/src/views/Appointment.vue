<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { CalendarCheck, Video, CalendarPlus, Download, XCircle } from '@lucide/vue'
import api from '../api/axios'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import BottomTabBar from '../components/BottomTabBar.vue'

const route = useRoute()
const appointment = ref(null)
const loading = ref(true)
const error = ref('')
const cancelling = ref(false)
const confirmingCancel = ref(false)

const isNew = computed(() => route.query.nueva === '1')
const cancelled = computed(() => appointment.value?.status === 'CANCELLED')
const icsHref = computed(() => `${api.defaults.baseURL}${appointment.value.icsUrl.replace(/^\/api/, '')}`)

onMounted(async () => {
  try {
    const res = await api.get(`/booking/appointments/${route.params.token}`)
    appointment.value = res.data
  } catch (err) {
    error.value = 'No encontramos esa cita. Revisa el enlace que te enviamos.'
  } finally {
    loading.value = false
  }
})

async function cancel() {
  cancelling.value = true
  try {
    const res = await api.post(`/booking/appointments/${route.params.token}/cancel`)
    appointment.value = res.data
    confirmingCancel.value = false
  } catch (err) {
    error.value = 'No se pudo cancelar. Escríbenos por WhatsApp y lo hacemos por ti.'
  } finally {
    cancelling.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-cream">
    <Navbar />

    <main class="mx-auto max-w-xl px-4 pb-24 pt-8 md:pb-14 lg:pt-12">
      <div v-if="loading" class="h-64 animate-pulse rounded-2xl bg-charcoal/5"></div>
      <p v-else-if="error && !appointment" class="py-16 text-center font-sans text-red-500">{{ error }}</p>

      <template v-else-if="appointment">
        <div class="flex items-center gap-3">
          <span
            class="flex h-12 w-12 items-center justify-center rounded-full"
            :class="cancelled ? 'bg-charcoal/10 text-charcoal/50' : 'bg-gold/10 text-gold'"
          >
            <XCircle v-if="cancelled" class="h-6 w-6" />
            <CalendarCheck v-else class="h-6 w-6" />
          </span>
          <div>
            <h1 class="font-serif text-2xl text-charcoal sm:text-3xl">
              {{ cancelled ? 'Cita cancelada' : isNew ? '¡Listo, quedó agendada!' : 'Tu reunión virtual' }}
            </h1>
            <p class="font-sans text-sm text-charcoal/60">{{ appointment.kindLabel }}</p>
          </div>
        </div>

        <div class="mt-6 rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm" :class="cancelled ? 'opacity-60' : ''">
          <p class="font-sans text-xs tracking-widest text-charcoal/50">CUÁNDO</p>
          <p class="mt-1 font-serif text-2xl text-charcoal">{{ appointment.whenText }}</p>
          <p class="font-sans text-sm text-charcoal/55">Hora de Colombia · 30 minutos</p>

          <div v-if="!cancelled" class="mt-5 border-t border-charcoal/10 pt-5">
            <p class="font-sans text-xs tracking-widest text-charcoal/50">VIDEOLLAMADA</p>
            <a
              v-if="appointment.meetUrl"
              :href="appointment.meetUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-2 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 font-sans text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              <Video class="h-4 w-4" /> Unirme con Google Meet
            </a>
            <p v-else class="mt-1 font-sans text-sm text-charcoal/65">
              Te enviaremos el enlace de la videollamada por correo antes de la reunión.
            </p>
          </div>
        </div>

        <template v-if="!cancelled">
          <p v-if="isNew" class="mt-4 font-sans text-sm text-charcoal/65">
            Te enviamos la confirmación a tu correo. Agrégala a tu calendario para no olvidarla:
          </p>
          <div class="mt-3 grid gap-2 sm:grid-cols-2">
            <a
              :href="appointment.googleCalendarUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-center gap-2 rounded-full border border-gold px-5 py-3 font-sans text-sm font-medium text-gold transition-colors hover:bg-gold hover:text-white"
            >
              <CalendarPlus class="h-4 w-4" /> Google Calendar
            </a>
            <a
              :href="icsHref"
              class="flex items-center justify-center gap-2 rounded-full border border-charcoal/20 px-5 py-3 font-sans text-sm font-medium text-charcoal transition-colors hover:border-charcoal"
            >
              <Download class="h-4 w-4" /> Apple / Outlook (.ics)
            </a>
          </div>

          <div class="mt-8 border-t border-charcoal/10 pt-5">
            <p class="font-sans text-sm text-charcoal/60">¿No puedes ese día?</p>
            <div v-if="!confirmingCancel" class="mt-2 flex flex-wrap gap-4">
              <button class="font-sans text-sm text-red-600 underline" @click="confirmingCancel = true">Cancelar la cita</button>
              <RouterLink to="/agendar" class="font-sans text-sm text-gold underline">Agendar otra</RouterLink>
            </div>
            <div v-else class="mt-2 flex flex-wrap items-center gap-3">
              <span class="font-sans text-sm text-charcoal">¿Seguro que quieres cancelarla?</span>
              <button
                :disabled="cancelling"
                class="rounded-full bg-red-600 px-4 py-2 font-sans text-sm text-white disabled:opacity-50"
                @click="cancel"
              >
                Sí, cancelar
              </button>
              <button class="font-sans text-sm text-charcoal/60 underline" @click="confirmingCancel = false">No</button>
            </div>
            <p v-if="error" class="mt-2 font-sans text-sm text-red-500">{{ error }}</p>
          </div>
        </template>

        <RouterLink v-else to="/agendar" class="mt-6 inline-block font-sans text-sm text-gold underline">Agendar una nueva reunión</RouterLink>
      </template>
    </main>

    <Footer />
    <BottomTabBar />
  </div>
</template>
