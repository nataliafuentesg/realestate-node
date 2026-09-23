<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api/axios'

const route = useRoute()
const billingClientId = route.params.id

const loading = ref(true)
const loadError = ref('')
const clientInfo = ref(null)
const acceptanceInfo = ref(null)

const form = ref({
  cardNumber: '',
  expMonth: '',
  expYear: '',
  cvc: '',
  cardHolder: '',
  email: '',
})

const submitting = ref(false)
const submitError = ref('')
const success = ref(false)

function formatAmount(amount, currency) {
  if (!amount) return ''
  const locale = currency === 'USD' ? 'en-US' : 'es-CO'
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

// La llave publica trae el ambiente adentro del prefijo (pub_test_ o
// pub_prod_) -- asi el navegador sabe a que dominio de Wompi tokenizar sin
// que el backend tenga que exponer esa info aparte.
const wompiBaseUrl = computed(() => {
  const key = acceptanceInfo.value?.data?.public_key || ''
  return key.startsWith('pub_prod_') ? 'https://production.wompi.co/v1' : 'https://sandbox.wompi.co/v1'
})

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [clientRes, acceptanceRes] = await Promise.all([
      api.get(`/wompi/billing-client/${billingClientId}`),
      api.get('/wompi/acceptance-info'),
    ])
    clientInfo.value = clientRes.data
    acceptanceInfo.value = acceptanceRes.data
    if (!acceptanceInfo.value?.data?.public_key) {
      loadError.value = 'La pasarela de pagos no está disponible en este momento. Intenta más tarde.'
    }
  } catch (err) {
    loadError.value = 'No pudimos cargar la información. Verifica el link o intenta más tarde.'
  } finally {
    loading.value = false
  }
}

async function submit() {
  submitting.value = true
  submitError.value = ''
  try {
    const publicKey = acceptanceInfo.value.data.public_key
    const acceptanceToken = acceptanceInfo.value.data.presigned_acceptance.acceptance_token
    const personalDataToken = acceptanceInfo.value.data.presigned_personal_data_auth.acceptance_token

    // Esto va DIRECTO al navegador de Wompi -- el numero de tarjeta nunca
    // pasa por nuestro servidor.
    const tokenRes = await fetch(`${wompiBaseUrl.value}/tokens/cards`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${publicKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: form.value.cardNumber.replace(/\s+/g, ''),
        cvc: form.value.cvc,
        exp_month: form.value.expMonth,
        exp_year: form.value.expYear,
        card_holder: form.value.cardHolder,
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenRes.ok || !tokenData?.data?.id) {
      submitError.value = 'No pudimos validar la tarjeta. Revisa los datos e intenta de nuevo.'
      submitting.value = false
      return
    }

    await api.post(`/wompi/authorize/${billingClientId}`, {
      cardToken: tokenData.data.id,
      customerEmail: form.value.email,
      acceptanceToken,
      personalDataAuthToken: personalDataToken,
    })

    success.value = true
  } catch (err) {
    submitError.value = 'Algo salió mal autorizando el cobro. Intenta de nuevo o contáctanos.'
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto min-h-screen max-w-md bg-mp-bg px-5 py-12 font-[family-name:var(--font-mp-body)] text-mp-fg">
    <h1 class="font-[family-name:var(--font-mp-heading)] text-xl font-medium">Autorizar cobro automático</h1>

    <p v-if="loading" class="mt-6 text-mp-muted">Cargando...</p>
    <p v-else-if="loadError" class="mt-6 text-red-400">{{ loadError }}</p>

    <template v-else-if="success">
      <div class="mt-8 rounded-xl border border-green-400/30 bg-green-400/10 p-5 text-center">
        <p class="text-lg">✅ ¡Listo!</p>
        <p class="mt-2 text-sm text-mp-muted">
          Tu tarjeta quedó autorizada. A partir de ahora el cobro de {{ clientInfo.concept }} se hará automáticamente
          cada mes, sin que tengas que hacer nada.
        </p>
      </div>
    </template>

    <template v-else-if="clientInfo?.alreadyAuthorized">
      <div class="mt-8 rounded-xl border border-mp-border/15 bg-mp-surface p-5 text-center">
        <p class="text-sm text-mp-muted">Ya tienes una tarjeta autorizada para el cobro automático de este servicio.</p>
      </div>
    </template>

    <template v-else>
      <div class="mt-6 rounded-xl border border-mp-border/15 bg-mp-surface p-5">
        <p class="text-sm text-mp-muted">Estás autorizando el débito automático mensual para:</p>
        <p class="mt-1 text-lg font-medium">{{ clientInfo.name }}</p>
        <p class="text-sm text-mp-muted">{{ clientInfo.concept }} · {{ formatAmount(clientInfo.amount, clientInfo.currency) }}/mes</p>
      </div>

      <form @submit.prevent="submit" class="mt-6 space-y-4">
        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">NOMBRE DEL TITULAR</label>
          <input
            v-model="form.cardHolder"
            required
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2.5 text-sm focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">CORREO</label>
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2.5 text-sm focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">NÚMERO DE TARJETA</label>
          <input
            v-model="form.cardNumber"
            required
            inputmode="numeric"
            placeholder="4242 4242 4242 4242"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2.5 text-sm focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="mb-1 block text-xs tracking-widest text-mp-muted">MES</label>
            <input
              v-model="form.expMonth"
              required
              placeholder="08"
              maxlength="2"
              class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2.5 text-sm focus:border-mp-primary focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs tracking-widest text-mp-muted">AÑO</label>
            <input
              v-model="form.expYear"
              required
              placeholder="28"
              maxlength="2"
              class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2.5 text-sm focus:border-mp-primary focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs tracking-widest text-mp-muted">CVC</label>
            <input
              v-model="form.cvc"
              required
              maxlength="4"
              class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2.5 text-sm focus:border-mp-primary focus:outline-none"
            />
          </div>
        </div>

        <p v-if="submitError" class="text-sm text-red-400">{{ submitError }}</p>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full rounded-full bg-mp-primary px-6 py-3 text-sm font-medium tracking-widest text-white transition-colors hover:bg-mp-primary-hover disabled:opacity-50"
        >
          {{ submitting ? 'AUTORIZANDO...' : 'AUTORIZAR COBRO AUTOMÁTICO' }}
        </button>

        <p class="text-center text-[11px] text-mp-muted/60">
          🔒 Tu tarjeta se procesa de forma segura con Wompi. Nunca almacenamos tu número de tarjeta.
        </p>
      </form>
    </template>
  </div>
</template>
