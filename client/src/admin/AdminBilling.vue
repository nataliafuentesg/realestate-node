<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../api/axios'

const clients = ref([])
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const saveError = ref('')
const deletingId = ref(null)

const emptyForm = () => ({
  name: '',
  whatsappNumber: '',
  amount: null,
  currency: 'COP',
  paymentLink: '',
  billingDaysOfMonth: '',
  checkInDaysAfterDue: 3,
  active: true,
})

const form = ref(emptyForm())
const editingId = ref(null)
const showForm = ref(false)

function formatAmount(amount, currency) {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
  }
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)
}

async function loadClients() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/billing/clients')
    clients.value = res.data
  } catch (err) {
    error.value = 'No se pudieron cargar los clientes de cobro.'
  } finally {
    loading.value = false
  }
}

function openNewForm() {
  editingId.value = null
  form.value = emptyForm()
  saveError.value = ''
  showForm.value = true
}

function openEditForm(client) {
  editingId.value = client.id
  form.value = {
    name: client.name,
    whatsappNumber: client.whatsappNumber,
    amount: client.amount,
    currency: client.currency,
    paymentLink: client.paymentLink,
    billingDaysOfMonth: (client.billingDaysOfMonth || []).join(', '),
    checkInDaysAfterDue: client.checkInDaysAfterDue,
    active: client.active,
  }
  saveError.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
}

async function submitForm() {
  saving.value = true
  saveError.value = ''
  try {
    const days = form.value.billingDaysOfMonth
      .split(',')
      .map((d) => parseInt(d.trim(), 10))
      .filter((d) => !isNaN(d) && d >= 1 && d <= 31)

    if (days.length === 0) {
      saveError.value = 'Ingresa al menos un día de cobro válido (1-31).'
      saving.value = false
      return
    }

    const payload = { ...form.value, billingDaysOfMonth: days }

    if (editingId.value) {
      await api.put(`/billing/clients/${editingId.value}`, payload)
    } else {
      await api.post('/billing/clients', payload)
    }
    closeForm()
    await loadClients()
  } catch (err) {
    saveError.value = 'No se pudo guardar. Revisa los campos.'
  } finally {
    saving.value = false
  }
}

async function handleDelete(client) {
  if (!confirm(`¿Eliminar "${client.name}" de los cobros recurrentes? Esto no se puede deshacer.`)) return
  deletingId.value = client.id
  try {
    await api.delete(`/billing/clients/${client.id}`)
    clients.value = clients.value.filter((c) => c.id !== client.id)
  } catch (err) {
    alert('No se pudo eliminar.')
  } finally {
    deletingId.value = null
  }
}

const formTitle = computed(() => (editingId.value ? 'Editar cliente' : 'Nuevo cliente de cobro'))

onMounted(loadClients)
</script>

<template>
  <div class="font-[family-name:var(--font-mp-body)]">
    <div class="flex items-center justify-between">
      <h1 class="font-[family-name:var(--font-mp-heading)] text-2xl font-medium text-mp-fg">💰 Cobros recurrentes</h1>
      <button
        @click="openNewForm"
        class="rounded-full bg-mp-primary px-6 py-2.5 text-xs tracking-widest text-white transition-colors hover:bg-mp-primary-hover"
      >
        + NUEVO CLIENTE
      </button>
    </div>

    <p class="mt-2 text-sm text-mp-muted/70">
      Cada día de cobro configurado, se le manda al cliente el link de pago por WhatsApp automáticamente. Si pasan los
      días configurados sin marcarlo como pagado, te preguntamos a ti por WhatsApp si ya llegó el pago.
    </p>

    <p v-if="loading" class="mt-10 text-mp-muted">Cargando...</p>
    <p v-else-if="error" class="mt-10 text-red-400">{{ error }}</p>
    <p v-else-if="clients.length === 0" class="mt-10 text-mp-muted">
      Todavía no hay clientes de cobro. Crea el primero.
    </p>

    <div v-else class="mt-8 overflow-x-auto rounded-xl border border-mp-border/10 bg-mp-surface">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-mp-border/10 text-xs tracking-widest text-mp-muted/60">
            <th class="px-5 py-3 font-normal">CLIENTE</th>
            <th class="px-5 py-3 font-normal">MONTO</th>
            <th class="px-5 py-3 font-normal">DÍAS DE COBRO</th>
            <th class="px-5 py-3 font-normal">ESTADO CICLO ACTUAL</th>
            <th class="px-5 py-3 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="client in clients" :key="client.id" class="border-b border-mp-border/5 last:border-0">
            <td class="px-5 py-3">
              <span class="text-mp-fg">{{ client.name }}</span>
              <span class="block text-xs text-mp-muted/60">{{ client.whatsappNumber }}</span>
              <span v-if="!client.active" class="text-xs text-amber-400">Inactivo</span>
            </td>
            <td class="px-5 py-3 text-mp-muted">{{ formatAmount(client.amount, client.currency) }}</td>
            <td class="px-5 py-3 text-mp-muted">{{ (client.billingDaysOfMonth || []).join(', ') }}</td>
            <td class="px-5 py-3 text-mp-muted">
              <span v-if="!client.lastReminderSentDate" class="text-xs">Sin recordatorio enviado aún</span>
              <span v-else-if="client.paidThisCycle" class="text-xs text-green-400">✓ Pagado</span>
              <span v-else class="text-xs text-amber-400">
                Pendiente (recordatorio: {{ client.lastReminderSentDate }})
              </span>
            </td>
            <td class="px-5 py-3 text-right whitespace-nowrap">
              <button @click="openEditForm(client)" class="mr-4 text-mp-primary-hover hover:underline">Editar</button>
              <button
                @click="handleDelete(client)"
                :disabled="deletingId === client.id"
                class="text-red-400 hover:underline disabled:opacity-50"
              >
                {{ deletingId === client.id ? 'Eliminando...' : 'Eliminar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de crear/editar -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="closeForm">
      <div class="w-full max-w-lg rounded-xl border border-mp-border/10 bg-mp-surface p-6">
        <h2 class="font-[family-name:var(--font-mp-heading)] text-lg font-medium text-mp-fg">{{ formTitle }}</h2>

        <form @submit.prevent="submitForm" class="mt-5 space-y-4">
          <div>
            <label class="mb-1 block text-xs tracking-widest text-mp-muted">NOMBRE</label>
            <input
              v-model="form.name"
              required
              placeholder="Ej. Pintxo Pincho"
              class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs tracking-widest text-mp-muted">WHATSAPP DEL CLIENTE (con indicativo, solo números)</label>
            <input
              v-model="form.whatsappNumber"
              required
              placeholder="573001234567"
              class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-xs tracking-widest text-mp-muted">MONTO</label>
              <input
                v-model.number="form.amount"
                type="number"
                min="0"
                required
                class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs tracking-widest text-mp-muted">MONEDA</label>
              <select
                v-model="form.currency"
                class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
              >
                <option value="COP">COP</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs tracking-widest text-mp-muted">LINK DE PAGO (Bold, etc.)</label>
            <input
              v-model="form.paymentLink"
              required
              placeholder="https://checkout.bold.co/..."
              class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs tracking-widest text-mp-muted">
              DÍAS DE COBRO EN EL MES (separados por coma, ej. "15" o "1, 15")
            </label>
            <input
              v-model="form.billingDaysOfMonth"
              required
              placeholder="15"
              class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs tracking-widest text-mp-muted">
              PREGUNTARTE SI YA PAGÓ, A LOS CUÁNTOS DÍAS DE VENCIDO
            </label>
            <input
              v-model.number="form.checkInDaysAfterDue"
              type="number"
              min="1"
              required
              class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
            />
          </div>

          <label class="flex items-center gap-2 text-sm text-mp-fg">
            <input v-model="form.active" type="checkbox" class="rounded border-mp-border/30" />
            Activo (si lo desactivas, no se le manda nada)
          </label>

          <p v-if="saveError" class="text-sm text-red-400">{{ saveError }}</p>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" @click="closeForm" class="text-sm text-mp-muted hover:text-mp-fg">Cancelar</button>
            <button
              type="submit"
              :disabled="saving"
              class="rounded-full bg-mp-primary px-6 py-2.5 text-xs tracking-widest text-white transition-colors hover:bg-mp-primary-hover disabled:opacity-50"
            >
              {{ saving ? 'GUARDANDO...' : 'GUARDAR' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
