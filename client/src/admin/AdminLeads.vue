<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/axios'

const inquiries = ref([])
const loading = ref(true)
const error = ref('')
const updatingId = ref(null)
const expandedId = ref(null)

const statusLabels = { NEW: 'Nuevo', CONTACTED: 'Contactado', CLOSED: 'Cerrado' }
const statusStyles = {
  NEW: 'bg-gold-light/20 text-gold',
  CONTACTED: 'bg-blue-100 text-blue-700',
  CLOSED: 'bg-charcoal/10 text-charcoal/50',
}

function formatDate(value) {
  return new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

async function loadInquiries() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/inquiries')
    inquiries.value = res.data
  } catch (err) {
    error.value = 'No se pudieron cargar los leads.'
  } finally {
    loading.value = false
  }
}

async function handleStatusChange(inquiry, status) {
  updatingId.value = inquiry.id
  try {
    const res = await api.patch(`/inquiries/${inquiry.id}/status`, { status })
    const idx = inquiries.value.findIndex((i) => i.id === inquiry.id)
    inquiries.value[idx] = res.data
  } catch (err) {
    alert('No se pudo actualizar el estado.')
  } finally {
    updatingId.value = null
  }
}

async function handleDelete(inquiry) {
  if (!confirm(`¿Eliminar el lead de "${inquiry.name}"?`)) return
  try {
    await api.delete(`/inquiries/${inquiry.id}`)
    inquiries.value = inquiries.value.filter((i) => i.id !== inquiry.id)
  } catch (err) {
    alert('No se pudo eliminar el lead.')
  }
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

onMounted(loadInquiries)
</script>

<template>
  <div>
    <h1 class="font-serif text-2xl text-charcoal">Leads</h1>

    <p v-if="loading" class="mt-10 font-sans text-charcoal/50">Cargando...</p>
    <p v-else-if="error" class="mt-10 font-sans text-red-600">{{ error }}</p>
    <p v-else-if="inquiries.length === 0" class="mt-10 font-sans text-charcoal/50">
      Todavía no hay consultas recibidas.
    </p>

    <div v-else class="mt-8 space-y-3">
      <div
        v-for="inquiry in inquiries"
        :key="inquiry.id"
        class="rounded-xl border border-charcoal/10 bg-white p-5"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="font-sans text-charcoal">
              <span class="font-medium">{{ inquiry.name }}</span>
              <span class="ml-2 text-sm text-charcoal/50">{{ inquiry.email }}</span>
            </p>
            <p v-if="inquiry.phone" class="mt-0.5 font-sans text-sm text-charcoal/50">{{ inquiry.phone }}</p>
            <p v-if="inquiry.propertyTitle" class="mt-1 font-sans text-sm text-gold">
              Sobre: {{ inquiry.propertyTitle }}
            </p>
            <p class="mt-1 font-sans text-xs text-charcoal/40">{{ formatDate(inquiry.createdAt) }}</p>
          </div>

          <div class="flex items-center gap-2">
            <span :class="['rounded-full px-3 py-1 font-sans text-xs', statusStyles[inquiry.status]]">
              {{ statusLabels[inquiry.status] }}
            </span>
            <select
              :value="inquiry.status"
              @change="handleStatusChange(inquiry, $event.target.value)"
              :disabled="updatingId === inquiry.id"
              class="rounded-lg border border-charcoal/15 bg-white px-2 py-1 font-sans text-sm text-charcoal focus:border-gold focus:outline-none"
            >
              <option value="NEW">Nuevo</option>
              <option value="CONTACTED">Contactado</option>
              <option value="CLOSED">Cerrado</option>
            </select>
          </div>
        </div>

        <button
          @click="toggleExpand(inquiry.id)"
          class="mt-3 font-sans text-sm text-charcoal/50 hover:text-charcoal"
        >
          {{ expandedId === inquiry.id ? 'Ocultar mensaje' : 'Ver mensaje' }}
        </button>
        <p
          v-if="expandedId === inquiry.id"
          class="mt-2 whitespace-pre-wrap rounded-lg bg-charcoal/5 p-4 font-sans text-sm text-charcoal/80"
        >
          {{ inquiry.message }}
        </p>

        <button @click="handleDelete(inquiry)" class="mt-3 font-sans text-sm text-red-600 hover:underline">
          Eliminar
        </button>
      </div>
    </div>
  </div>
</template>
