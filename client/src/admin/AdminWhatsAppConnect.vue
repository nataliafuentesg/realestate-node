<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { Smartphone, CheckCircle2, AlertTriangle, ArrowLeft, PlugZap } from '@lucide/vue'
import api from '../api/axios'

// Conecta un numero de WhatsApp Business con COEXISTENCIA (el mismo numero en el celular y en la API)
// usando el flujo oficial de Meta (Embedded Signup). La ventana de Meta la abre su SDK; al terminar nos
// devuelve un "code" y, por mensaje del navegador, el id de la cuenta y del numero.
const config = ref(null)
const loading = ref(true)
const error = ref('')
const info = ref('')
const connecting = ref(false)
let sessionInfo = null
let sdkReady = null

async function loadConfig() {
  try {
    config.value = (await api.get('/whatsapp/onboarding/config')).data
  } catch (err) {
    error.value = 'No se pudo cargar el estado de la conexión.'
  } finally {
    loading.value = false
  }
}

function loadSdk(appId, version) {
  if (sdkReady) return sdkReady
  sdkReady = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB.init({ appId, autoLogAppEvents: true, xfbml: true, version })
      resolve(window.FB)
    }
    const script = document.createElement('script')
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    script.onerror = () => {
      sdkReady = null
      reject(new Error('No se pudo cargar el SDK de Facebook'))
    }
    document.body.appendChild(script)
  })
  return sdkReady
}

function onMessage(event) {
  if (!['https://www.facebook.com', 'https://web.facebook.com'].includes(event.origin)) return
  try {
    const data = JSON.parse(event.data)
    if (data.type !== 'WA_EMBEDDED_SIGNUP') return
    if (data.event === 'CANCEL') {
      error.value = 'Se cerró la ventana de Meta antes de terminar.'
    } else if (data.data?.phone_number_id || data.data?.waba_id) {
      sessionInfo = data.data
    }
  } catch (err) {
    // mensajes que no son JSON: se ignoran
  }
}

onMounted(() => {
  window.addEventListener('message', onMessage)
  loadConfig()
})
onBeforeUnmount(() => window.removeEventListener('message', onMessage))

const connected = computed(() => config.value?.connection)

async function connect() {
  error.value = ''
  info.value = ''
  sessionInfo = null
  connecting.value = true
  try {
    const FB = await loadSdk(config.value.appId, config.value.graphVersion)
    const response = await new Promise((resolve) => {
      FB.login(resolve, {
        config_id: config.value.configId,
        response_type: 'code',
        override_default_response_type: true,
        // Embedded Signup v4 (las versiones 2 y 3 ya fueron retiradas por Meta).
        extras: { setup: {}, featureType: 'whatsapp_business_app_onboarding' },
      })
    })
    const code = response?.authResponse?.code
    if (!code) {
      error.value = 'No se completó la conexión con Meta.'
      return
    }
    // El mensaje con los ids puede llegar un instante despues de que cierra la ventana.
    for (let i = 0; i < 20 && !(sessionInfo?.waba_id && sessionInfo?.phone_number_id); i++) {
      await new Promise((r) => setTimeout(r, 500))
    }
    if (!sessionInfo?.waba_id || !sessionInfo?.phone_number_id) {
      error.value = 'Meta no devolvió la cuenta ni el número. Intenta de nuevo.'
      return
    }
    const res = await api.post('/whatsapp/onboarding/complete', {
      code,
      wabaId: sessionInfo.waba_id,
      phoneNumberId: sessionInfo.phone_number_id,
    })
    config.value = res.data
    info.value = res.data.connection?.coexistence
      ? '✅ Número conectado con coexistencia. Ya puedes seguir usando la app del celular.'
      : '✅ Número conectado a la API.'
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'No se pudo completar la conexión.'
  } finally {
    connecting.value = false
  }
}

async function disconnect() {
  if (!window.confirm('¿Volver al número configurado en el servidor? No se desconecta nada en Meta.')) return
  try {
    await api.delete('/whatsapp/onboarding/connection')
    await loadConfig()
    info.value = 'Se volvió al número configurado en el servidor.'
  } catch (err) {
    error.value = 'No se pudo desconectar.'
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl font-[family-name:var(--font-mp-body)]">
    <RouterLink to="/admin/whatsapp" class="inline-flex items-center gap-1.5 text-sm text-mp-muted hover:text-mp-fg">
      <ArrowLeft :size="15" /> Volver a WhatsApp
    </RouterLink>
    <h1 class="mt-3 font-[family-name:var(--font-mp-heading)] text-2xl font-medium text-mp-fg">📱 Conectar número de WhatsApp</h1>
    <p class="mt-1 text-sm text-mp-muted">
      Con <strong class="text-mp-fg">coexistencia</strong> usas el mismo número en la app de WhatsApp Business del celular y en el sistema (IA, CRM y agenda) a la vez.
    </p>

    <p v-if="info" class="mt-4 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">{{ info }}</p>
    <p v-if="error" class="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{{ error }}</p>
    <p v-if="loading" class="mt-6 text-sm text-mp-muted">Cargando…</p>

    <template v-else-if="config">
      <!-- Estado actual -->
      <div class="mt-6 rounded-xl border border-mp-border/10 bg-mp-surface p-4">
        <div v-if="connected" class="flex items-start gap-3">
          <CheckCircle2 :size="20" class="mt-0.5 shrink-0 text-green-400" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-mp-fg">{{ connected.displayPhone || 'Número conectado' }}</p>
            <p class="text-xs text-mp-muted">
              {{ connected.coexistence ? 'Coexistencia con la app del celular activa' : 'Solo en la API (sin app del celular)' }}
            </p>
            <p v-if="connected.tokenSource === 'FLOW'" class="mt-1 text-xs text-yellow-400">
              Este número usa el token del flujo de Meta, que puede vencer a los 60 días. Conviene asignar la cuenta al usuario del sistema para usar un token sin vencimiento.
            </p>
          </div>
          <button class="text-xs text-mp-muted underline hover:text-mp-fg" @click="disconnect">Volver al número del servidor</button>
        </div>
        <div v-else class="flex items-start gap-3">
          <Smartphone :size="20" class="mt-0.5 shrink-0 text-mp-muted" />
          <p class="text-sm text-mp-fg">
            Hoy se usa el número configurado en el servidor (solo API, sin app del celular).
          </p>
        </div>
      </div>

      <!-- Falta configuración en Meta / servidor -->
      <div v-if="!config.configured" class="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm">
        <p class="flex items-center gap-2 font-medium text-yellow-300"><AlertTriangle :size="16" /> Falta configurar la conexión con Meta</p>
        <p class="mt-1 text-mp-fg/80">
          En el servidor faltan: <strong>{{ config.missing.join(', ') }}</strong>. Se crean en Meta (la app debe ser Proveedor de Tecnología y tener una
          configuración de Embedded Signup); no se conecta nada hasta tenerlas.
        </p>
      </div>

      <!-- Antes de conectar -->
      <div class="mt-4 rounded-xl border border-mp-border/10 bg-mp-surface p-4 text-sm text-mp-fg/90">
        <p class="font-medium text-mp-fg">Antes de conectar</p>
        <ul class="mt-2 list-disc space-y-1.5 pl-5">
          <li>El número debe estar <strong>activo en la app de WhatsApp Business</strong> del celular, actualizada (versión 2.24.17 o más) y con uso reciente.</li>
          <li>Ten el celular a la mano: Meta muestra un código QR que se escanea desde la app de WhatsApp Business.</li>
          <li>Lo que escribas desde el celular se verá en el panel, y la IA se callará sola en ese chat.</li>
          <li>Según Meta, con coexistencia se desactivan las listas de difusión y funciones como los mensajes temporales, "ver una vez" y la ubicación en vivo; los grupos y las llamadas no pasan por el sistema. El sistema atiende hasta 20 mensajes por segundo.</li>
        </ul>
      </div>

      <button
        :disabled="!config.configured || connecting"
        class="mt-5 inline-flex items-center gap-2 rounded-full bg-mp-primary px-6 py-3 text-sm font-medium text-white hover:bg-mp-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        @click="connect"
      >
        <PlugZap :size="16" /> {{ connecting ? 'Conectando…' : connected ? 'Conectar otro número' : 'Conectar mi número de WhatsApp Business' }}
      </button>
    </template>
  </div>
</template>
