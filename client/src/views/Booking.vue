<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CalendarDays, Clock, Video } from '@lucide/vue'
import api from '../api/axios'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import BottomTabBar from '../components/BottomTabBar.vue'
import { track } from '../lib/analytics'
import { KINDS, kindFromParam, formatSlot, formatDayShort, formatDayLong } from '../lib/booking'

const route = useRoute()
const router = useRouter()

const kind = ref(kindFromParam(String(route.query.tipo || '')))
const days = ref([])
const loading = ref(true)
const loadError = ref('')
const selectedDay = ref('')
const selectedSlot = ref('')
const showAllDays = ref(false)

const form = ref({ name: '', email: '', phone: '', notes: '' })
const submitting = ref(false)
const submitError = ref('')

const VISIBLE_DAYS = 10
const visibleDays = computed(() => (showAllDays.value ? days.value : days.value.slice(0, VISIBLE_DAYS)))
const slotsOfSelectedDay = computed(() => days.value.find((d) => d.date === selectedDay.value)?.slots ?? [])

async function loadAvailability() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await api.get('/booking/availability')
    days.value = res.data
    // Si el horario que tenia elegido ya no existe (alguien lo tomo), se limpia.
    if (!days.value.some((d) => d.date === selectedDay.value && d.slots.includes(selectedSlot.value))) {
      selectedSlot.value = ''
    }
    if (!days.value.some((d) => d.date === selectedDay.value)) selectedDay.value = days.value[0]?.date ?? ''
  } catch (err) {
    loadError.value = 'No pudimos cargar los horarios. Intenta de nuevo en un momento.'
  } finally {
    loading.value = false
  }
}

function chooseKind(key) {
  kind.value = key
  router.replace({ query: { ...route.query, tipo: KINDS[key].param } })
}

function chooseDay(date) {
  selectedDay.value = date
  selectedSlot.value = ''
}

const canSubmit = computed(
  () =>
    kind.value &&
    selectedDay.value &&
    selectedSlot.value &&
    form.value.name.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(form.value.email.trim()) &&
    form.value.phone.replace(/\D/g, '').length >= 7,
)

async function submit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  submitError.value = ''
  try {
    const res = await api.post('/booking/appointments', {
      kind: kind.value,
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone,
      notes: form.value.notes,
      startAt: `${selectedDay.value}T${selectedSlot.value}:00`,
    })
    track(kind.value === 'AGENCY' ? 'ContactFormBuyer' : 'ContactFormOwner', { source: 'booking' })
    router.push({ path: `/cita/${res.data.token}`, query: { nueva: '1' } })
  } catch (err) {
    submitError.value = err.response?.data?.message || err.response?.data?.error || 'No pudimos agendar. Intenta de nuevo.'
    if (err.response?.status === 409) await loadAvailability()
  } finally {
    submitting.value = false
  }
}

onMounted(loadAvailability)

const inputClass =
  'w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 font-sans text-base text-charcoal placeholder:text-charcoal/35 focus:border-gold focus:outline-none'
</script>

<template>
  <div class="min-h-screen bg-cream">
    <Navbar />

    <main class="mx-auto max-w-2xl px-4 pb-24 pt-8 md:pb-14 lg:pt-12">
      <p class="font-sans text-sm font-medium text-gold">REUNIÓN VIRTUAL</p>
      <h1 class="mt-2 font-serif text-3xl leading-tight text-charcoal sm:text-4xl">Agenda tu reunión</h1>
      <p class="mt-3 font-sans text-base leading-relaxed text-charcoal/65">
        Una videollamada de 30 minutos, de lunes a viernes entre las 3:00 y las 6:00 p. m. (hora de Colombia). Te
        enviamos el enlace por correo.
      </p>

      <!-- 1. Tipo de reunión -->
      <section class="mt-8">
        <h2 class="font-sans text-sm font-semibold tracking-wide text-charcoal">1 · ¿De qué quieres hablar?</h2>
        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <button
            v-for="(info, key) in KINDS"
            :key="key"
            type="button"
            class="rounded-2xl border p-4 text-left transition-colors"
            :class="kind === key ? 'border-gold bg-gold/5 ring-1 ring-gold' : 'border-charcoal/15 bg-white hover:border-charcoal/40'"
            @click="chooseKind(key)"
          >
            <p class="font-sans text-base font-medium text-charcoal">{{ info.title }}</p>
            <p class="mt-1 font-sans text-sm text-charcoal/60">{{ info.subtitle }}</p>
          </button>
        </div>
      </section>

      <!-- 2. Día y hora -->
      <section class="mt-8">
        <h2 class="font-sans text-sm font-semibold tracking-wide text-charcoal">2 · Elige el día y la hora</h2>

        <div v-if="loading" class="mt-3 h-24 animate-pulse rounded-2xl bg-charcoal/5"></div>
        <p v-else-if="loadError" class="mt-3 font-sans text-sm text-red-500">{{ loadError }}</p>
        <p v-else-if="days.length === 0" class="mt-3 font-sans text-sm text-charcoal/60">
          Por ahora no hay horarios disponibles. Escríbenos por WhatsApp y coordinamos contigo.
        </p>

        <template v-else>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="day in visibleDays"
              :key="day.date"
              type="button"
              class="rounded-xl border px-3.5 py-2 font-sans text-sm capitalize transition-colors"
              :class="selectedDay === day.date ? 'border-gold bg-gold text-white' : 'border-charcoal/15 bg-white text-charcoal hover:border-charcoal/40'"
              @click="chooseDay(day.date)"
            >
              {{ formatDayShort(day.date) }}
            </button>
            <button
              v-if="!showAllDays && days.length > VISIBLE_DAYS"
              type="button"
              class="rounded-xl px-3.5 py-2 font-sans text-sm text-gold underline"
              @click="showAllDays = true"
            >
              Ver más días
            </button>
          </div>

          <div v-if="selectedDay" class="mt-5">
            <p class="font-sans text-sm text-charcoal/60">{{ formatDayLong(selectedDay) }}</p>
            <div class="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              <button
                v-for="slot in slotsOfSelectedDay"
                :key="slot"
                type="button"
                class="rounded-xl border px-2 py-2.5 font-sans text-sm transition-colors"
                :class="selectedSlot === slot ? 'border-gold bg-gold text-white' : 'border-charcoal/15 bg-white text-charcoal hover:border-charcoal/40'"
                @click="selectedSlot = slot"
              >
                {{ formatSlot(slot) }}
              </button>
            </div>
          </div>
        </template>
      </section>

      <!-- 3. Datos -->
      <section class="mt-8">
        <h2 class="font-sans text-sm font-semibold tracking-wide text-charcoal">3 · Tus datos</h2>
        <form class="mt-3 space-y-3" @submit.prevent="submit">
          <input v-model="form.name" type="text" autocomplete="name" placeholder="Nombre" :class="inputClass" />
          <input v-model="form.email" type="email" autocomplete="email" placeholder="Correo" :class="inputClass" />
          <input v-model="form.phone" type="tel" autocomplete="tel" placeholder="Teléfono (WhatsApp)" :class="inputClass" />
          <textarea
            v-model="form.notes"
            rows="2"
            placeholder="¿Algo que quieras contarnos antes? (opcional)"
            :class="[inputClass, 'resize-none']"
          ></textarea>

          <div
            v-if="selectedDay && selectedSlot"
            class="flex items-center gap-2 rounded-xl bg-charcoal/5 px-4 py-3 font-sans text-sm text-charcoal"
          >
            <CalendarDays class="h-4 w-4 shrink-0 text-gold" />
            {{ formatDayLong(selectedDay) }}, {{ formatSlot(selectedSlot) }}
          </div>

          <p v-if="submitError" class="font-sans text-sm text-red-500">{{ submitError }}</p>

          <button
            type="submit"
            :disabled="!canSubmit || submitting"
            class="w-full rounded-full bg-gold px-6 py-3.5 font-sans text-base font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {{ submitting ? 'Agendando...' : 'Confirmar reunión' }}
          </button>
          <p class="flex items-center justify-center gap-1.5 font-sans text-xs text-charcoal/50">
            <Video class="h-3.5 w-3.5" /> Videollamada por Google Meet
            <Clock class="ml-2 h-3.5 w-3.5" /> 30 minutos
          </p>
        </form>
      </section>
    </main>

    <Footer />
    <BottomTabBar />
  </div>
</template>
