<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '../api/axios'

const properties = ref([])
const loading = ref(true)
const error = ref('')
const deletingId = ref(null)

const typeLabels = { HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Lote' }

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
    price,
  )
}

async function loadProperties() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/properties')
    properties.value = res.data
  } catch (err) {
    error.value = 'No se pudieron cargar las propiedades.'
  } finally {
    loading.value = false
  }
}

async function handleDelete(property) {
  if (!confirm(`¿Eliminar "${property.title}"? Esta acción no se puede deshacer.`)) return
  deletingId.value = property.id
  try {
    await api.delete(`/properties/${property.id}`)
    properties.value = properties.value.filter((p) => p.id !== property.id)
  } catch (err) {
    alert('No se pudo eliminar la propiedad.')
  } finally {
    deletingId.value = null
  }
}

onMounted(loadProperties)
</script>

<template>
  <div class="font-[family-name:var(--font-mp-body)]">
    <div class="flex items-center justify-between">
      <h1 class="font-[family-name:var(--font-mp-heading)] text-2xl font-medium text-mp-fg">🏡 Propiedades</h1>
      <RouterLink
        to="/admin/propiedades/nueva"
        class="rounded-full bg-mp-primary px-6 py-2.5 text-xs tracking-widest text-white transition-colors hover:bg-mp-primary-hover"
      >
        + NUEVA PROPIEDAD
      </RouterLink>
    </div>

    <p v-if="loading" class="mt-10 text-mp-muted">Cargando...</p>
    <p v-else-if="error" class="mt-10 text-red-400">{{ error }}</p>
    <p v-else-if="properties.length === 0" class="mt-10 text-mp-muted">
      Todavía no hay propiedades. Crea la primera.
    </p>

    <div v-else class="mt-8 overflow-x-auto rounded-xl border border-mp-border/10 bg-mp-surface">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-mp-border/10 text-xs tracking-widest text-mp-muted/60">
            <th class="px-5 py-3 font-normal">PROPIEDAD</th>
            <th class="px-5 py-3 font-normal">CIUDAD</th>
            <th class="px-5 py-3 font-normal">TIPO</th>
            <th class="px-5 py-3 font-normal">PRECIO</th>
            <th class="px-5 py-3 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="property in properties" :key="property.id" class="border-b border-mp-border/5 last:border-0">
            <td class="flex items-center gap-3 px-5 py-3">
              <img
                v-if="property.images?.[0]"
                :src="property.images[0]"
                class="h-10 w-14 rounded object-cover"
                alt=""
              />
              <div v-else class="h-10 w-14 rounded bg-white/5"></div>
              <span class="text-mp-fg">{{ property.title }}</span>
            </td>
            <td class="px-5 py-3 text-mp-muted">{{ property.city }}</td>
            <td class="px-5 py-3 text-mp-muted">{{ typeLabels[property.type] || property.type }}</td>
            <td class="px-5 py-3 text-mp-muted">{{ formatPrice(property.price) }}</td>
            <td class="px-5 py-3 text-right">
              <RouterLink
                :to="`/admin/propiedades/${property.id}/editar`"
                class="mr-4 text-mp-primary-hover hover:underline"
              >
                Editar
              </RouterLink>
              <button
                @click="handleDelete(property)"
                :disabled="deletingId === property.id"
                class="text-red-400 hover:underline disabled:opacity-50"
              >
                {{ deletingId === property.id ? 'Eliminando...' : 'Eliminar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
