<script setup>
import { ref } from 'vue'
import api from '../api/axios'

const purpose = ref('buyer')
const form = ref({ name: '', email: '', phone: '', message: '' })
const status = ref('idle')
const errorMessage = ref('')

const socials = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/marcapro.agency/',
    path: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm5.25-.75a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61577588754189',
    path: 'M14 9h3V5h-3c-2.21 0-4 1.79-4 4v2H8v4h2v6h4v-6h3l1-4h-4V9c0-.55.45-1 1-1Z',
  },
]

async function submitForm() {
  status.value = 'sending'
  errorMessage.value = ''

  const label =
    purpose.value === 'owner' ? 'Quiere publicar su propiedad con nosotros' : 'Consulta general sobre propiedades'
  const message = `[${label}]\n\n${form.value.message}`

  try {
    await api.post('/inquiries', {
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone,
      message,
    })
    status.value = 'success'
  } catch (err) {
    status.value = 'error'
    errorMessage.value = 'No se pudo enviar tu mensaje. Intenta de nuevo.'
  }
}
</script>

<template>
  <section id="contact" class="relative z-10 bg-charcoal px-6 py-24 text-cream lg:px-12">
    <div class="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2">
      <div v-reveal>
        <p class="font-sans text-xs tracking-[0.4em] text-gold-light">HABLEMOS</p>
        <h2 class="mt-4 font-serif text-3xl lg:text-4xl">Contacto</h2>
        <p class="mt-4 max-w-sm font-sans text-sm leading-relaxed text-cream/60">
          Escríbenos si buscas una propiedad, o si quieres publicar la tuya con nosotros.
        </p>

        <div class="mt-8 space-y-4">
          <a
            href="https://wa.me/573006850097"
            target="_blank"
            rel="noopener"
            data-cursor-hover
            class="inline-flex items-center gap-3 rounded-full border border-cream/20 px-6 py-3 font-sans text-sm text-cream transition-colors hover:border-gold-light hover:text-gold-light"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
              <path
                d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.4A10 10 0 1 0 12 2Zm0 18.2a8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1s-.7.8-.9 1c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.4a.5.5 0 0 0 0-.4c-.1-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4.1c.6.3 1.1.4 1.5.6a3.6 3.6 0 0 0 1.7.1c.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.4-.3Z"
              />
            </svg>
            WhatsApp
          </a>

          <p class="font-sans text-sm text-cream/60">
            <a href="mailto:ventas@marcapro.co" class="transition-colors hover:text-gold-light" data-cursor-hover
              >ventas@marcapro.co</a
            >
          </p>
          <p class="font-sans text-sm text-cream/60">+57 300 685 0097</p>
        </div>

        <div class="mt-8 flex gap-3">
          <a
            v-for="s in socials"
            :key="s.label"
            :href="s.href || undefined"
            :aria-disabled="!s.href"
            target="_blank"
            rel="noopener"
            data-cursor-hover
            class="flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 transition-colors hover:border-gold-light hover:text-gold-light"
            :class="s.href ? '' : 'pointer-events-none opacity-30'"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4">
              <path :d="s.path" />
            </svg>
          </a>
        </div>
      </div>

      <form v-if="status !== 'success'" v-reveal @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label class="mb-1 block font-sans text-xs tracking-widest text-cream/50">ESCRIBO PORQUE...</label>
          <select
            v-model="purpose"
            class="w-full border-b border-cream/20 bg-transparent py-2 font-sans text-cream focus:border-gold-light focus:outline-none [&>option]:text-charcoal"
          >
            <option value="buyer">Busco una propiedad</option>
            <option value="owner">Quiero publicar mi propiedad con ustedes</option>
          </select>
        </div>

        <div>
          <label class="mb-1 block font-sans text-xs tracking-widest text-cream/50">NOMBRE</label>
          <input
            v-model="form.name"
            type="text"
            required
            class="w-full border-b border-cream/20 bg-transparent py-2 font-sans text-cream focus:border-gold-light focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block font-sans text-xs tracking-widest text-cream/50">CORREO</label>
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full border-b border-cream/20 bg-transparent py-2 font-sans text-cream focus:border-gold-light focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block font-sans text-xs tracking-widest text-cream/50">TELÉFONO (OPCIONAL)</label>
          <input
            v-model="form.phone"
            type="tel"
            class="w-full border-b border-cream/20 bg-transparent py-2 font-sans text-cream focus:border-gold-light focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block font-sans text-xs tracking-widest text-cream/50">MENSAJE</label>
          <textarea
            v-model="form.message"
            required
            rows="3"
            class="w-full resize-none border-b border-cream/20 bg-transparent py-2 font-sans text-cream focus:border-gold-light focus:outline-none"
          ></textarea>
        </div>

        <p v-if="status === 'error'" class="font-sans text-sm text-red-400">{{ errorMessage }}</p>

        <button
          type="submit"
          data-cursor-hover
          :disabled="status === 'sending'"
          class="mt-2 w-full rounded-full bg-gold-light px-6 py-4 font-sans text-xs tracking-widest text-charcoal transition-colors hover:bg-cream disabled:opacity-50"
        >
          {{ status === 'sending' ? 'ENVIANDO...' : 'ENVIAR MENSAJE' }}
        </button>
      </form>

      <div v-else class="flex flex-col justify-center">
        <p class="font-serif text-2xl">Gracias, {{ form.name }}</p>
        <p class="mt-3 font-sans text-sm text-cream/60">
          Recibimos tu mensaje. Un asesor de Ventas Sabana se pondrá en contacto contigo pronto.
        </p>
      </div>
    </div>
  </section>
</template>
