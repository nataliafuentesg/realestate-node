<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/axios'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const form = ref({
  title: '',
  description: '',
  price: null,
  city: '',
  type: 'HOUSE',
  bedrooms: null,
  bathrooms: null,
  areaM2: null,
  lat: null,
  lng: null,
  agentName: '',
  agentPhone: '',
  images: [],
  features: [],
})

const newFeature = ref('')
const uploading = ref(false)
const uploadError = ref('')
const saving = ref(false)
const saveError = ref('')
const loading = ref(isEdit.value)

async function loadProperty() {
  try {
    const res = await api.get(`/properties/${route.params.id}`)
    form.value = { ...form.value, ...res.data }
  } catch (err) {
    saveError.value = 'No se pudo cargar la propiedad.'
  } finally {
    loading.value = false
  }
}

async function handleFileChange(event) {
  const files = Array.from(event.target.files || [])
  if (files.length === 0) return
  uploadError.value = ''
  uploading.value = true
  try {
    for (const file of files) {
      const data = new FormData()
      data.append('file', file)
      const res = await api.post('/uploads', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      form.value.images.push(res.data.url)
    }
  } catch (err) {
    uploadError.value = 'No se pudo subir una de las imágenes.'
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

function removeImage(index) {
  form.value.images.splice(index, 1)
}

function addFeature() {
  const value = newFeature.value.trim()
  if (!value) return
  form.value.features.push(value)
  newFeature.value = ''
}

function removeFeature(index) {
  form.value.features.splice(index, 1)
}

async function handleSubmit() {
  saveError.value = ''
  saving.value = true
  try {
    const payload = { ...form.value }
    if (isEdit.value) {
      await api.put(`/properties/${route.params.id}`, payload)
    } else {
      await api.post('/properties', payload)
    }
    router.push('/admin/propiedades')
  } catch (err) {
    saveError.value = 'No se pudo guardar la propiedad. Revisa los campos obligatorios.'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (isEdit.value) loadProperty()
})
</script>

<template>
  <div class="max-w-3xl">
    <h1 class="font-serif text-2xl text-charcoal">{{ isEdit ? 'Editar propiedad' : 'Nueva propiedad' }}</h1>

    <p v-if="loading" class="mt-10 font-sans text-charcoal/50">Cargando...</p>

    <form v-else @submit.prevent="handleSubmit" class="mt-8 space-y-8">
      <div class="grid gap-5 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">TÍTULO</label>
          <input
            v-model="form.title"
            required
            class="w-full rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 font-sans text-charcoal focus:border-gold focus:outline-none"
          />
        </div>

        <div class="sm:col-span-2">
          <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">DESCRIPCIÓN</label>
          <textarea
            v-model="form.description"
            required
            rows="4"
            class="w-full rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 font-sans text-charcoal focus:border-gold focus:outline-none"
          ></textarea>
        </div>

        <div>
          <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">CIUDAD</label>
          <input
            v-model="form.city"
            required
            class="w-full rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 font-sans text-charcoal focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">TIPO</label>
          <select
            v-model="form.type"
            class="w-full rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 font-sans text-charcoal focus:border-gold focus:outline-none"
          >
            <option value="HOUSE">Casa</option>
            <option value="APARTMENT">Apartamento</option>
            <option value="LAND">Lote</option>
          </select>
        </div>

        <div>
          <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">PRECIO (COP)</label>
          <input
            v-model.number="form.price"
            type="number"
            min="0"
            required
            class="w-full rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 font-sans text-charcoal focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">ÁREA (M²)</label>
          <input
            v-model.number="form.areaM2"
            type="number"
            min="0"
            required
            class="w-full rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 font-sans text-charcoal focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">HABITACIONES</label>
          <input
            v-model.number="form.bedrooms"
            type="number"
            min="0"
            class="w-full rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 font-sans text-charcoal focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">BAÑOS</label>
          <input
            v-model.number="form.bathrooms"
            type="number"
            min="0"
            class="w-full rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 font-sans text-charcoal focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">LATITUD</label>
          <input
            v-model.number="form.lat"
            type="number"
            step="any"
            class="w-full rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 font-sans text-charcoal focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">LONGITUD</label>
          <input
            v-model.number="form.lng"
            type="number"
            step="any"
            class="w-full rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 font-sans text-charcoal focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">AGENTE</label>
          <input
            v-model="form.agentName"
            placeholder="Ventas Sabana"
            class="w-full rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 font-sans text-charcoal focus:border-gold focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block font-sans text-xs tracking-widest text-charcoal/50">TELÉFONO AGENTE</label>
          <input
            v-model="form.agentPhone"
            placeholder="+57 300 685 0097"
            class="w-full rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 font-sans text-charcoal focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label class="mb-2 block font-sans text-xs tracking-widest text-charcoal/50">FOTOS</label>
        <div v-if="form.images.length" class="mb-3 flex flex-wrap gap-3">
          <div v-for="(url, i) in form.images" :key="url" class="group relative">
            <img :src="url" class="h-24 w-32 rounded-lg object-cover" alt="" />
            <button
              type="button"
              @click="removeImage(i)"
              class="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-charcoal text-xs text-cream shadow"
            >
              ×
            </button>
          </div>
        </div>
        <input type="file" accept="image/*" multiple @change="handleFileChange" class="font-sans text-sm" />
        <p v-if="uploading" class="mt-2 font-sans text-sm text-charcoal/50">Subiendo...</p>
        <p v-if="uploadError" class="mt-2 font-sans text-sm text-red-600">{{ uploadError }}</p>
      </div>

      <div>
        <label class="mb-2 block font-sans text-xs tracking-widest text-charcoal/50">CARACTERÍSTICAS</label>
        <div v-if="form.features.length" class="mb-3 flex flex-wrap gap-2">
          <span
            v-for="(feature, i) in form.features"
            :key="feature"
            class="flex items-center gap-2 rounded-full bg-charcoal/5 px-3 py-1 font-sans text-sm text-charcoal"
          >
            {{ feature }}
            <button type="button" @click="removeFeature(i)" class="text-charcoal/40 hover:text-charcoal">×</button>
          </span>
        </div>
        <div class="flex gap-2">
          <input
            v-model="newFeature"
            @keydown.enter.prevent="addFeature"
            placeholder="Ej: Piscina"
            class="flex-1 rounded-lg border border-charcoal/15 bg-white px-4 py-2 font-sans text-charcoal focus:border-gold focus:outline-none"
          />
          <button
            type="button"
            @click="addFeature"
            class="rounded-lg border border-charcoal/15 px-4 py-2 font-sans text-sm text-charcoal hover:bg-charcoal/5"
          >
            Agregar
          </button>
        </div>
      </div>

      <p v-if="saveError" class="font-sans text-sm text-red-600">{{ saveError }}</p>

      <div class="flex gap-3">
        <button
          type="submit"
          :disabled="saving || uploading"
          class="rounded-full bg-charcoal px-8 py-3 font-sans text-xs tracking-widest text-cream transition-colors hover:bg-gold hover:text-charcoal disabled:opacity-50"
        >
          {{ saving ? 'GUARDANDO...' : 'GUARDAR' }}
        </button>
        <RouterLink
          to="/admin/propiedades"
          class="rounded-full border border-charcoal/20 px-8 py-3 font-sans text-xs tracking-widest text-charcoal hover:bg-charcoal/5"
        >
          CANCELAR
        </RouterLink>
      </div>
    </form>
  </div>
</template>
