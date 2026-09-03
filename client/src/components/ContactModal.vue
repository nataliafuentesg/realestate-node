<script setup>
import { ref, watch } from 'vue'
import { useContactModal } from '../composables/useContactModal'
import api from '../api/axios'

const { isOpen, property, closeContactModal } = useContactModal()

const form = ref({ name: '', email: '', phone: '', message: '' })
const status = ref('idle')
const errorMessage = ref('')

watch(isOpen, (open) => {
  if (open) {
    status.value = 'idle'
    errorMessage.value = ''
    form.value = {
      name: '',
      email: '',
      phone: '',
      message: property.value ? `Me interesa agendar una visita para: ${property.value.title}` : '',
    }
  }
})

function onKeydown(e) {
  if (e.key === 'Escape' && isOpen.value) closeContactModal()
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', onKeydown)
}

async function submitForm() {
  status.value = 'sending'
  errorMessage.value = ''
  try {
    await api.post('/inquiries', {
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone,
      message: form.value.message,
      property: property.value?.id,
    })
    status.value = 'success'
  } catch (err) {
    status.value = 'error'
    errorMessage.value = 'No se pudo enviar la solicitud. Intenta de nuevo.'
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[200] flex items-center justify-center bg-charcoal/80 px-6 backdrop-blur-sm"
      @click.self="closeContactModal"
    >
      <div class="relative w-full max-w-md bg-cream p-8 shadow-2xl sm:p-10">
        <button
          data-cursor-hover
          class="absolute right-5 top-5 font-sans text-xs tracking-widest text-charcoal/50 transition-colors hover:text-gold"
          @click="closeContactModal"
        >
          CERRAR ✕
        </button>

        <p class="font-sans text-xs tracking-[0.35em] text-gold">VENTAS SABANA</p>
        <h2 class="mt-3 font-serif text-2xl text-charcoal">Agendar una visita</h2>
        <p v-if="property" class="mt-2 font-sans text-sm text-charcoal/60">{{ property.title }}</p>

        <form v-if="status !== 'success'" class="mt-6 space-y-4" @submit.prevent="submitForm">
          <div>
            <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">NOMBRE</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full border-b border-charcoal/20 bg-transparent py-2 font-sans text-charcoal focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">CORREO</label>
            <input
              v-model="form.email"
              type="email"
              required
              class="w-full border-b border-charcoal/20 bg-transparent py-2 font-sans text-charcoal focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">TELÉFONO (OPCIONAL)</label>
            <input
              v-model="form.phone"
              type="tel"
              class="w-full border-b border-charcoal/20 bg-transparent py-2 font-sans text-charcoal focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">MENSAJE</label>
            <textarea
              v-model="form.message"
              required
              rows="3"
              class="w-full resize-none border-b border-charcoal/20 bg-transparent py-2 font-sans text-charcoal focus:border-gold focus:outline-none"
            ></textarea>
          </div>

          <p v-if="status === 'error'" class="font-sans text-sm text-red-500">{{ errorMessage }}</p>

          <button
            type="submit"
            data-cursor-hover
            :disabled="status === 'sending'"
            class="mt-2 w-full rounded-full bg-charcoal px-6 py-4 font-sans text-xs tracking-widest text-cream transition-colors hover:bg-gold hover:text-charcoal disabled:opacity-50"
          >
            {{ status === 'sending' ? 'ENVIANDO...' : 'ENVIAR SOLICITUD' }}
          </button>
        </form>

        <div v-else class="mt-8 text-center">
          <p class="font-serif text-xl text-charcoal">Gracias, {{ form.name }}</p>
          <p class="mt-3 font-sans text-sm text-charcoal/60">
            Recibimos tu solicitud. Un asesor se pondrá en contacto contigo pronto.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
