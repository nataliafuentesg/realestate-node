<script setup>
import { computed } from 'vue'

defineProps({
  cities: { type: Array, default: () => [] },
  types: { type: Array, default: () => [] },
})

const filters = defineModel('filters', {
  default: () => ({ operation: '', city: '', type: '', maxPrice: '' }),
})

const typeLabels = { HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Lote' }

const OPERATIONS = [
  { value: '', label: 'Todas' },
  { value: 'SALE', label: 'Venta' },
  { value: 'RENT', label: 'Arriendo' },
]

const SALE_PRICES = [
  { value: '300000000', label: 'Hasta $300 millones' },
  { value: '500000000', label: 'Hasta $500 millones' },
  { value: '1000000000', label: 'Hasta $1.000 millones' },
]
const RENT_PRICES = [
  { value: '2000000', label: 'Hasta $2 millones / mes' },
  { value: '3000000', label: 'Hasta $3 millones / mes' },
  { value: '5000000', label: 'Hasta $5 millones / mes' },
  { value: '8000000', label: 'Hasta $8 millones / mes' },
]

// Los rangos de venta y de arriendo no se pueden mezclar: con "Todas" el
// filtro de precio no aplica.
const priceOptions = computed(() => (filters.value.operation === 'RENT' ? RENT_PRICES : SALE_PRICES))

function setOperation(value) {
  filters.value.operation = value
  filters.value.maxPrice = ''
}

const selectClass =
  'w-full rounded-xl border border-charcoal/15 bg-white px-3 py-2.5 font-sans text-sm text-charcoal focus:border-gold focus:outline-none'
</script>

<template>
  <div class="space-y-3">
    <div class="inline-flex rounded-full bg-charcoal/5 p-1" role="tablist" aria-label="Operación">
      <button
        v-for="op in OPERATIONS"
        :key="op.value"
        type="button"
        role="tab"
        :aria-selected="filters.operation === op.value"
        class="rounded-full px-5 py-2 font-sans text-sm font-medium transition-colors"
        :class="filters.operation === op.value ? 'bg-charcoal text-white shadow-sm' : 'text-charcoal/60'"
        @click="setOperation(op.value)"
      >
        {{ op.label }}
      </button>
    </div>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <select v-model="filters.city" :class="selectClass" aria-label="Ciudad">
        <option value="">Todas las ciudades</option>
        <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
      </select>

      <select v-model="filters.type" :class="selectClass" aria-label="Tipo de propiedad">
        <option value="">Todos los tipos</option>
        <option v-for="type in types" :key="type" :value="type">{{ typeLabels[type] || type }}</option>
      </select>

      <select
        v-if="filters.operation"
        v-model="filters.maxPrice"
        :class="[selectClass, 'col-span-2 sm:col-span-1']"
        aria-label="Precio máximo"
      >
        <option value="">Sin límite de precio</option>
        <option v-for="opt in priceOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>
  </div>
</template>
