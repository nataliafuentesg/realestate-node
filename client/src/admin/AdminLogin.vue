<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/axios'
import { useAdminAuth } from './auth'

const router = useRouter()
const { setToken, isAuthenticated } = useAdminAuth()

onMounted(() => {
  if (isAuthenticated()) router.push('/admin/panel')
})

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const res = await api.post('/auth/login', { email: email.value, password: password.value })
    setToken(res.data.token)
    router.push('/admin/panel')
  } catch (err) {
    error.value =
      err.response?.status === 401 || err.response?.status === 403
        ? 'Correo o contraseña incorrectos.'
        : 'No se pudo conectar con el servidor.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-charcoal px-6">
    <form
      @submit.prevent="handleSubmit"
      class="w-full max-w-sm rounded-2xl bg-cream p-8 shadow-2xl"
    >
      <p class="text-center font-serif text-xl tracking-[0.15em] text-charcoal">
        VENTAS <span class="text-gold">SABANA</span>
      </p>
      <p class="mt-1 text-center font-sans text-xs tracking-widest text-charcoal/50">ADMINISTRACIÓN</p>

      <div class="mt-8 space-y-4">
        <div>
          <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">CORREO</label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="username"
            class="w-full border-b border-charcoal/20 bg-transparent py-2 font-sans text-charcoal focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">CONTRASEÑA</label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full border-b border-charcoal/20 bg-transparent py-2 font-sans text-charcoal focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      <p v-if="error" class="mt-4 font-sans text-sm text-red-600">{{ error }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="mt-8 w-full rounded-full bg-charcoal px-8 py-3 font-sans text-xs tracking-widest text-cream transition-colors hover:bg-gold hover:text-charcoal disabled:opacity-50"
      >
        {{ loading ? 'ENTRANDO...' : 'ENTRAR' }}
      </button>
    </form>
  </div>
</template>
