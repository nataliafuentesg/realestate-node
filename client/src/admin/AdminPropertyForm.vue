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
  neighborhood: '',
  address: '',
  type: 'HOUSE',
  bedrooms: null,
  bathrooms: null,
  parking: null,
  stratum: null,
  areaM2: null,
  areaBuiltM2: null,
  zoning: '',
  propertyRegistration: '',
  cadastralCode: '',
  legalStatus: '',
  lat: null,
  lng: null,
  agentName: '',
  agentPhone: '',
  images: [],
  videoUrl: '',
  features: [],
})

const coordsPaste = ref('')

function parseCoordsPaste() {
  const match = coordsPaste.value.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/)
  if (!match) return
  form.value.lat = parseFloat(match[1])
  form.value.lng = parseFloat(match[2])
  coordsPaste.value = ''
}

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

const dragIndex = ref(null)

function handleDragStart(index) {
  dragIndex.value = index
}

function handleDrop(index) {
  if (dragIndex.value === null || dragIndex.value === index) return
  const images = form.value.images
  const [moved] = images.splice(dragIndex.value, 1)
  images.splice(index, 0, moved)
  dragIndex.value = null
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
  <div class="max-w-3xl font-[family-name:var(--font-mp-body)]">
    <h1 class="font-[family-name:var(--font-mp-heading)] text-2xl font-medium text-mp-fg">{{ isEdit ? 'Editar propiedad' : 'Nueva propiedad' }}</h1>

    <p v-if="loading" class="mt-10 text-mp-muted">Cargando...</p>

    <form v-else @submit.prevent="handleSubmit" class="mt-8 space-y-8">
      <div class="grid gap-5 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">TÍTULO</label>
          <input
            v-model="form.title"
            required
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div class="sm:col-span-2">
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">DESCRIPCIÓN</label>
          <p class="mb-2 text-xs text-mp-muted/60">
            Puedes usar saltos de línea, viñetas (- o •) y emojis: se muestran tal cual en la página.
          </p>
          <textarea
            v-model="form.description"
            required
            rows="6"
            placeholder="Ej: Amplio lote en zona consolidada de Chía.&#10;- 🚗 Fácil acceso vial&#10;- 💧 Todos los servicios&#10;- 🌳 Zona verde y arbolada"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          ></textarea>
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">CIUDAD</label>
          <input
            v-model="form.city"
            required
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">VEREDA / BARRIO</label>
          <input
            v-model="form.neighborhood"
            placeholder="Ej: Vereda Fonqueta"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div class="sm:col-span-2">
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">DIRECCIÓN</label>
          <input
            v-model="form.address"
            placeholder="Ej: Sin dirección (predio rural) o Calle 10 # 12-51"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">TIPO</label>
          <select
            v-model="form.type"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          >
            <option value="HOUSE">Casa</option>
            <option value="APARTMENT">Apartamento</option>
            <option value="LAND">Lote</option>
          </select>
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">PRECIO (COP)</label>
          <input
            v-model.number="form.price"
            type="number"
            min="0"
            required
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">ÁREA DEL LOTE (M²)</label>
          <input
            v-model.number="form.areaM2"
            type="number"
            min="0"
            required
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">ÁREA CONSTRUIDA (M²)</label>
          <input
            v-model.number="form.areaBuiltM2"
            type="number"
            min="0"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">HABITACIONES</label>
          <input
            v-model.number="form.bedrooms"
            type="number"
            min="0"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">BAÑOS</label>
          <input
            v-model.number="form.bathrooms"
            type="number"
            min="0"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">PARQUEADEROS</label>
          <input
            v-model.number="form.parking"
            type="number"
            min="0"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">ESTRATO</label>
          <input
            v-model.number="form.stratum"
            type="number"
            min="0"
            max="6"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div class="sm:col-span-2">
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">
            UBICACIÓN (pega coordenadas de Google Maps)
          </label>
          <p class="mb-2 text-xs text-mp-muted/60">
            En Google Maps, clic derecho sobre el punto exacto → clic en las coordenadas para copiarlas → pégalas
            aquí.
          </p>
          <div class="flex gap-2">
            <input
              v-model="coordsPaste"
              @keydown.enter.prevent="parseCoordsPaste"
              placeholder="Ej: 4.8617, -74.0319"
              class="flex-1 rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
            />
            <button
              type="button"
              @click="parseCoordsPaste"
              class="rounded-lg border border-mp-border/15 px-4 py-2.5 text-sm text-mp-fg hover:bg-white/5"
            >
              Usar
            </button>
          </div>
          <p v-if="form.lat && form.lng" class="mt-2 text-xs text-mp-muted">
            Guardado: {{ form.lat }}, {{ form.lng }}
          </p>
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">LATITUD</label>
          <input
            v-model.number="form.lat"
            type="number"
            step="any"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">LONGITUD</label>
          <input
            v-model.number="form.lng"
            type="number"
            step="any"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div class="sm:col-span-2 mt-2 border-t border-mp-border/10 pt-6">
          <p class="text-xs tracking-widest text-mp-muted">INFORMACIÓN LEGAL Y TÉCNICA (opcional)</p>
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">MATRÍCULA INMOBILIARIA</label>
          <input
            v-model="form.propertyRegistration"
            placeholder="Ej: 50N-369851"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">CÓDIGO CATASTRAL</label>
          <input
            v-model="form.cadastralCode"
            placeholder="Ej: 25-175-00-00-0008-0751"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">ESTADO LEGAL</label>
          <input
            v-model="form.legalStatus"
            placeholder="Ej: Libre de gravamen"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">USO DE SUELO / ZONIFICACIÓN</label>
          <input
            v-model="form.zoning"
            placeholder="Ej: Residencial - Centro Poblado Rural"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">AGENTE</label>
          <input
            v-model="form.agentName"
            placeholder="Ventas Sabana"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>

        <div>
          <label class="mb-1 block text-xs tracking-widest text-mp-muted">TELÉFONO AGENTE</label>
          <input
            v-model="form.agentPhone"
            placeholder="+57 311 221 0714"
            class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label class="mb-2 block text-xs tracking-widest text-mp-muted">FOTOS</label>
        <p v-if="form.images.length > 1" class="mb-2 text-xs text-mp-muted/60">
          Arrastra para reordenar. La primera es la portada.
        </p>
        <div v-if="form.images.length" class="mb-3 flex flex-wrap gap-3">
          <div
            v-for="(url, i) in form.images"
            :key="url"
            class="group relative cursor-move"
            draggable="true"
            @dragstart="handleDragStart(i)"
            @dragover.prevent
            @drop="handleDrop(i)"
          >
            <img :src="url" class="h-24 w-32 rounded-lg object-cover" alt="" />
            <span
              v-if="i === 0"
              class="absolute bottom-1 left-1 rounded bg-mp-bg/80 px-2 py-0.5 text-[10px] tracking-wide text-white"
            >
              PORTADA
            </span>
            <button
              type="button"
              @click="removeImage(i)"
              class="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-mp-primary text-xs text-white shadow"
            >
              ×
            </button>
          </div>
        </div>
        <input type="file" accept="image/*" multiple @change="handleFileChange" class="text-sm text-mp-fg" />
        <p v-if="uploading" class="mt-2 text-sm text-mp-muted">Subiendo...</p>
        <p v-if="uploadError" class="mt-2 text-sm text-red-400">{{ uploadError }}</p>
      </div>

      <div>
        <label class="mb-1 block text-xs tracking-widest text-mp-muted">VIDEO (OPCIONAL)</label>
        <p class="mb-2 text-xs text-mp-muted/60">
          Link de YouTube/Vimeo, o un .mp4 directo (ese sí se manda como video reproducible por WhatsApp).
        </p>
        <input
          v-model="form.videoUrl"
          type="url"
          placeholder="https://..."
          class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-mp-fg focus:border-mp-primary focus:outline-none"
        />
      </div>

      <div>
        <label class="mb-2 block text-xs tracking-widest text-mp-muted">CARACTERÍSTICAS</label>
        <p class="mb-2 text-xs text-mp-muted/60">
          Se muestran como viñetas en la página. Puedes agregar un emoji al inicio, ej: "🏊 Piscina".
        </p>
        <div v-if="form.features.length" class="mb-3 flex flex-wrap gap-2">
          <span
            v-for="(feature, i) in form.features"
            :key="feature"
            class="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-sm text-mp-fg"
          >
            {{ feature }}
            <button type="button" @click="removeFeature(i)" class="text-mp-muted hover:text-mp-fg">×</button>
          </span>
        </div>
        <div class="flex gap-2">
          <input
            v-model="newFeature"
            @keydown.enter.prevent="addFeature"
            placeholder="Ej: Piscina"
            class="flex-1 rounded-lg border border-mp-border/15 bg-mp-bg px-4 py-2 text-mp-fg focus:border-mp-primary focus:outline-none"
          />
          <button
            type="button"
            @click="addFeature"
            class="rounded-lg border border-mp-border/15 px-4 py-2 text-sm text-mp-fg hover:bg-white/5"
          >
            Agregar
          </button>
        </div>
      </div>

      <p v-if="saveError" class="text-sm text-red-400">{{ saveError }}</p>

      <div class="flex gap-3">
        <button
          type="submit"
          :disabled="saving || uploading"
          class="rounded-full bg-mp-primary px-8 py-3 text-xs tracking-widest text-white transition-colors hover:bg-mp-primary-hover disabled:opacity-50"
        >
          {{ saving ? 'GUARDANDO...' : 'GUARDAR' }}
        </button>
        <RouterLink
          to="/admin/propiedades"
          class="rounded-full border border-mp-border/20 px-8 py-3 text-xs tracking-widest text-mp-fg hover:bg-white/5"
        >
          CANCELAR
        </RouterLink>
      </div>
    </form>
  </div>
</template>
