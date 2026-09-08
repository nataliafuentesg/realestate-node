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
  <div class="mp-dotgrid flex min-h-screen items-center justify-center bg-mp-bg px-6">
    <form
      @submit.prevent="handleSubmit"
      class="w-full max-w-sm rounded-2xl border border-mp-border/10 bg-mp-surface p-8 shadow-2xl"
    >
      <div class="flex items-center justify-center gap-2.5">
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mp-primary font-[family-name:var(--font-mp-heading)] text-sm font-bold text-white"
        >
          M
        </span>
        <p class="font-[family-name:var(--font-mp-heading)] text-lg font-medium text-mp-fg">
          Marca<span class="text-mp-primary-hover">pro</span>
        </p>
      </div>
      <p class="mt-1 text-center font-[family-name:var(--font-mp-body)] text-xs tracking-widest text-mp-muted">
        VENTAS SABANA · ADMINISTRACIÓN
      </p>

      <div class="mt-8 space-y-4 font-[family-name:var(--font-mp-body)]">
        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">CORREO</label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="username"
            class="w-full border-b border-mp-border/15 bg-transparent py-2 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">CONTRASEÑA</label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full border-b border-mp-border/15 bg-transparent py-2 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>
      </div>

      <p v-if="error" class="mt-4 font-[family-name:var(--font-mp-body)] text-sm text-red-400">{{ error }}</p>

      <button
        type="submit"
        :disabled="loading"
        class="mt-8 w-full rounded-full bg-mp-primary px-8 py-3 font-[family-name:var(--font-mp-body)] text-xs tracking-widest text-white transition-colors hover:bg-mp-primary-hover disabled:opacity-50"
      >
        {{ loading ? 'ENTRANDO...' : 'ENTRAR' }}
      </button>
    </form>
  </div>
</template>
