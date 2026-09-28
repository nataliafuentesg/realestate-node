<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/axios'

const accounts = ref([])
const loading = ref(true)
const error = ref('')
const savingId = ref(null)
const savedId = ref(null)

const showForm = ref(false)
const editingId = ref(null)
const form = ref(emptyForm())

function emptyForm() {
  return {
    businessName: '',
    igUserId: '',
    accessToken: '',
    keywordsCsv: '',
    commentReplyMessage: '',
    dmMessage: '',
    active: true,
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/instagram-accounts')
    accounts.value = res.data
  } catch (err) {
    error.value = 'No se pudieron cargar las cuentas.'
  } finally {
    loading.value = false
  }
}

function openNew() {
  editingId.value = null
  form.value = emptyForm()
  showForm.value = true
}

function openEdit(account) {
  editingId.value = account.id
  form.value = {
    businessName: account.businessName,
    igUserId: account.igUserId,
    accessToken: '',
    keywordsCsv: account.keywordsCsv,
    commentReplyMessage: account.commentReplyMessage,
    dmMessage: account.dmMessage ?? '',
    active: account.active,
  }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
}

async function save() {
  savingId.value = editingId.value ?? 'new'
  error.value = ''
  try {
    const payload = { ...form.value, dmMessage: form.value.dmMessage || null }
    if (editingId.value) {
      await api.put(`/instagram-accounts/${editingId.value}`, payload)
    } else {
      await api.post('/instagram-accounts', payload)
    }
    await load()
    closeForm()
  } catch (err) {
    error.value = err?.response?.data?.message || 'No se pudo guardar. Revisa los campos obligatorios.'
  } finally {
    savingId.value = null
  }
}

async function toggleActive(account) {
  savingId.value = account.id
  try {
    await api.put(`/instagram-accounts/${account.id}`, {
      businessName: account.businessName,
      igUserId: account.igUserId,
      accessToken: '',
      keywordsCsv: account.keywordsCsv,
      commentReplyMessage: account.commentReplyMessage,
      dmMessage: account.dmMessage,
      active: !account.active,
    })
    await load()
  } catch (err) {
    error.value = 'No se pudo cambiar el estado.'
  } finally {
    savingId.value = null
  }
}

async function remove(account) {
  if (!confirm(`¿Eliminar la cuenta de ${account.businessName}? Deja de responder comentarios de inmediato.`)) return
  savingId.value = account.id
  try {
    await api.delete(`/instagram-accounts/${account.id}`)
    await load()
  } catch (err) {
    error.value = 'No se pudo eliminar.'
  } finally {
    savingId.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="font-[family-name:var(--font-mp-body)]">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-[family-name:var(--font-mp-heading)] text-2xl font-medium text-mp-fg">
          📸 Otros negocios en Instagram
        </h1>
        <p class="mt-1 max-w-xl text-sm text-mp-muted">
          Cuentas de Instagram de otros negocios de la agencia. Cuando alguien comenta una palabra
          clave, se responde el comentario (y opcionalmente un DM) de forma automática.
        </p>
      </div>
      <button
        @click="openNew"
        class="shrink-0 rounded-full bg-mp-primary px-5 py-2 text-xs tracking-widest text-white hover:bg-mp-primary-hover"
      >
        + AGREGAR CUENTA
      </button>
    </div>

    <p v-if="error" class="mt-4 text-sm text-red-400">{{ error }}</p>
    <p v-if="loading" class="mt-10 text-mp-muted">Cargando…</p>

    <div v-else class="mt-8 space-y-3">
      <div
        v-for="account in accounts"
        :key="account.id"
        class="rounded-xl border border-mp-border/10 bg-mp-surface p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-mp-fg">{{ account.businessName }}</span>
              <span
                class="rounded-full px-2 py-0.5 text-[10px] tracking-wide"
                :class="account.active ? 'bg-green-500/15 text-green-400' : 'bg-mp-border/15 text-mp-muted'"
              >
                {{ account.active ? 'ACTIVA' : 'PAUSADA' }}
              </span>
              <span v-if="!account.hasToken" class="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] text-red-400">
                SIN TOKEN
              </span>
            </div>
            <p class="mt-1 text-xs text-mp-muted">ID de Instagram: {{ account.igUserId }}</p>
            <p class="mt-2 text-sm text-mp-fg">
              <span class="text-mp-muted">Palabras clave: </span>{{ account.keywordsCsv }}
            </p>
            <p class="mt-1 text-sm text-mp-fg">
              <span class="text-mp-muted">Respuesta: </span>{{ account.commentReplyMessage }}
            </p>
            <p v-if="account.dmMessage" class="mt-1 text-sm text-mp-fg">
              <span class="text-mp-muted">DM: </span>{{ account.dmMessage }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-3 text-sm">
            <button @click="openEdit(account)" class="text-mp-muted hover:text-mp-fg">Editar</button>
            <button
              @click="toggleActive(account)"
              :disabled="savingId === account.id"
              class="text-mp-muted hover:text-mp-fg disabled:opacity-50"
            >
              {{ account.active ? 'Pausar' : 'Activar' }}
            </button>
            <button
              @click="remove(account)"
              :disabled="savingId === account.id"
              class="text-mp-muted/70 hover:text-red-400 disabled:opacity-50"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <p v-if="!accounts.length" class="text-mp-muted">Todavía no has conectado ninguna cuenta.</p>
    </div>

    <!-- Modal simple de crear/editar -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div class="w-full max-w-lg rounded-xl border border-mp-border/15 bg-mp-surface p-5">
        <h2 class="font-[family-name:var(--font-mp-heading)] text-lg font-medium text-mp-fg">
          {{ editingId ? 'Editar cuenta' : 'Nueva cuenta' }}
        </h2>

        <div class="mt-4 space-y-3">
          <div>
            <label class="mb-1 block text-xs text-mp-muted">Nombre del negocio</label>
            <input
              v-model="form.businessName"
              type="text"
              placeholder="Ej: Pintxo"
              class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-mp-muted">ID de la cuenta de Instagram</label>
            <input
              v-model="form.igUserId"
              type="text"
              placeholder="Ej: 17841400000000000"
              class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-mp-muted">
              Token de acceso {{ editingId ? '(déjalo vacío para no cambiarlo)' : '' }}
            </label>
            <input
              v-model="form.accessToken"
              type="password"
              placeholder="IGAA..."
              class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-mp-muted">Palabras clave (separadas por coma)</label>
            <input
              v-model="form.keywordsCsv"
              type="text"
              placeholder="info, precio"
              class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-mp-muted">Respuesta pública al comentario</label>
            <textarea
              v-model="form.commentReplyMessage"
              rows="2"
              class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
            ></textarea>
          </div>
          <div>
            <label class="mb-1 block text-xs text-mp-muted">DM adicional (opcional)</label>
            <textarea
              v-model="form.dmMessage"
              rows="3"
              placeholder="Si lo dejas vacío, solo se responde el comentario."
              class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
            ></textarea>
          </div>
          <label class="flex items-center gap-2 text-sm text-mp-fg">
            <input type="checkbox" v-model="form.active" class="accent-mp-primary" />
            Activa
          </label>
        </div>

        <div class="mt-5 flex items-center gap-3">
          <button
            @click="save"
            :disabled="savingId !== null"
            class="rounded-full bg-mp-primary px-5 py-1.5 text-xs tracking-widest text-white hover:bg-mp-primary-hover disabled:opacity-50"
          >
            {{ savingId !== null ? 'GUARDANDO…' : 'GUARDAR' }}
          </button>
          <button @click="closeForm" class="text-sm text-mp-muted hover:text-mp-fg">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>
