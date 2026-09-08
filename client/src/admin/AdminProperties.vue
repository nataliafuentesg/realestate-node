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
  <div>
    <div class="flex items-center justify-between">
      <h1 class="font-serif text-2xl text-charcoal">🏡 Propiedades</h1>
      <RouterLink
        to="/admin/propiedades/nueva"
        class="rounded-full bg-charcoal px-6 py-2.5 font-sans text-xs tracking-widest text-cream transition-colors hover:bg-gold hover:text-charcoal"
      >
        + NUEVA PROPIEDAD
      </RouterLink>
    </div>

    <p v-if="loading" class="mt-10 font-sans text-charcoal/50">Cargando...</p>
    <p v-else-if="error" class="mt-10 font-sans text-red-600">{{ error }}</p>
    <p v-else-if="properties.length === 0" class="mt-10 font-sans text-charcoal/50">
      Todavía no hay propiedades. Crea la primera.
    </p>

    <div v-else class="mt-8 overflow-x-auto rounded-xl border border-charcoal/10 bg-white">
      <table class="w-full text-left font-sans text-sm">
        <thead>
          <tr class="border-b border-charcoal/10 text-xs tracking-widest text-charcoal/40">
            <th class="px-5 py-3 font-normal">PROPIEDAD</th>
            <th class="px-5 py-3 font-normal">CIUDAD</th>
            <th class="px-5 py-3 font-normal">TIPO</th>
            <th class="px-5 py-3 font-normal">PRECIO</th>
            <th class="px-5 py-3 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="property in properties" :key="property.id" class="border-b border-charcoal/5 last:border-0">
            <td class="flex items-center gap-3 px-5 py-3">
              <img
                v-if="property.images?.[0]"
                :src="property.images[0]"
                class="h-10 w-14 rounded object-cover"
                alt=""
              />
              <div v-else class="h-10 w-14 rounded bg-charcoal/5"></div>
              <span class="text-charcoal">{{ property.title }}</span>
            </td>
            <td class="px-5 py-3 text-charcoal/70">{{ property.city }}</td>
            <td class="px-5 py-3 text-charcoal/70">{{ typeLabels[property.type] || property.type }}</td>
            <td class="px-5 py-3 text-charcoal/70">{{ formatPrice(property.price) }}</td>
            <td class="px-5 py-3 text-right">
              <RouterLink
                :to="`/admin/propiedades/${property.id}/editar`"
                class="mr-4 text-gold hover:underline"
              >
                Editar
              </RouterLink>
              <button
                @click="handleDelete(property)"
                :disabled="deletingId === property.id"
                class="text-red-600 hover:underline disabled:opacity-50"
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
