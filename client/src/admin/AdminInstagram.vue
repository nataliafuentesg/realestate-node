<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../api/axios'

const posts = ref([])
const postReplies = ref({}) // mediaId -> reply config
const properties = ref([])
const loading = ref(true)
const error = ref('')
const savingId = ref(null)
const savedId = ref(null)

// Estado local del formulario por publicacion: 'generic' | 'property' | 'custom'
const modeByMedia = ref({})
const propertyIdByMedia = ref({})
const customTextByMedia = ref({})

function truncate(text, max = 90) {
  if (!text) return '(sin texto)'
  return text.length > max ? text.slice(0, max) + '…' : text
}

function initFormState(media) {
  const existing = postReplies.value[media.id]
  if (existing?.propertyId) {
    modeByMedia.value[media.id] = 'property'
    propertyIdByMedia.value[media.id] = existing.propertyId
  } else if (existing?.customMessage) {
    modeByMedia.value[media.id] = 'custom'
    customTextByMedia.value[media.id] = existing.customMessage
  } else {
    modeByMedia.value[media.id] = 'generic'
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [mediaRes, repliesRes, propertiesRes] = await Promise.all([
      api.get('/instagram/media'),
      api.get('/instagram/post-replies'),
      api.get('/properties'),
    ])
    posts.value = mediaRes.data?.data ?? []
    postReplies.value = Object.fromEntries((repliesRes.data ?? []).map((r) => [r.mediaId, r]))
    properties.value = propertiesRes.data ?? []
    posts.value.forEach(initFormState)
  } catch (err) {
    error.value = 'No se pudieron cargar las publicaciones de Instagram. Revisa que el token siga activo.'
  } finally {
    loading.value = false
  }
}

async function save(media) {
  savingId.value = media.id
  savedId.value = null
  try {
    const mode = modeByMedia.value[media.id]
    const payload = {
      propertyId: mode === 'property' ? propertyIdByMedia.value[media.id] ?? null : null,
      customMessage: mode === 'custom' ? customTextByMedia.value[media.id] ?? '' : null,
      caption: media.caption ?? '',
      permalink: media.permalink ?? '',
      thumbnailUrl: media.thumbnail_url ?? media.media_url ?? '',
    }
    const res = await api.put(`/instagram/post-replies/${media.id}`, payload)
    postReplies.value[media.id] = res.data
    savedId.value = media.id
    setTimeout(() => {
      if (savedId.value === media.id) savedId.value = null
    }, 2000)
  } catch (err) {
    error.value = 'No se pudo guardar. Intenta de nuevo.'
  } finally {
    savingId.value = null
  }
}

async function clearAssignment(media) {
  modeByMedia.value[media.id] = 'generic'
  await save(media)
}

onMounted(load)
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <h1 class="text-2xl font-semibold mb-1">Respuestas de Instagram por publicación</h1>
    <p class="text-sm text-gray-500 mb-6">
      Cuando alguien comenta "info" en una publicación, elige qué le llega por DM: la info de un
      lote específico, un texto personalizado (ej. la auditoría gratis), o el mensaje genérico si
      no asignas nada.
    </p>

    <div v-if="error" class="mb-4 rounded bg-red-50 text-red-700 px-4 py-3 text-sm">{{ error }}</div>
    <div v-if="loading" class="text-gray-500">Cargando publicaciones…</div>

    <div v-else class="space-y-4">
      <div
        v-for="media in posts"
        :key="media.id"
        class="border rounded-lg p-4 flex gap-4 bg-white"
      >
        <img
          v-if="media.thumbnail_url || media.media_url"
          :src="media.thumbnail_url || media.media_url"
          class="w-24 h-24 object-cover rounded flex-shrink-0"
          alt=""
        />
        <div class="flex-1 min-w-0">
          <a
            :href="media.permalink"
            target="_blank"
            rel="noopener"
            class="text-sm font-medium text-gray-800 hover:underline"
          >
            {{ truncate(media.caption) }}
          </a>

          <div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <label class="flex items-center gap-1">
              <input type="radio" :name="`mode-${media.id}`" value="generic" v-model="modeByMedia[media.id]" />
              Genérico
            </label>
            <label class="flex items-center gap-1">
              <input type="radio" :name="`mode-${media.id}`" value="property" v-model="modeByMedia[media.id]" />
              Propiedad específica
            </label>
            <label class="flex items-center gap-1">
              <input type="radio" :name="`mode-${media.id}`" value="custom" v-model="modeByMedia[media.id]" />
              Texto personalizado
            </label>
          </div>

          <div v-if="modeByMedia[media.id] === 'property'" class="mt-2">
            <select v-model="propertyIdByMedia[media.id]" class="border rounded px-2 py-1 text-sm w-full max-w-sm">
              <option :value="null">Elige una propiedad…</option>
              <option v-for="p in properties" :key="p.id" :value="p.id">{{ p.title }}</option>
            </select>
          </div>

          <div v-if="modeByMedia[media.id] === 'custom'" class="mt-2">
            <textarea
              v-model="customTextByMedia[media.id]"
              rows="3"
              class="border rounded px-2 py-1 text-sm w-full"
              placeholder="Ej: ¡Genial! Agenda tu auditoría gratis aquí: https://marcapro.co/#contacto"
            ></textarea>
          </div>

          <div class="mt-3 flex items-center gap-3">
            <button
              @click="save(media)"
              :disabled="savingId === media.id"
              class="bg-gray-900 text-white text-sm px-3 py-1.5 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              {{ savingId === media.id ? 'Guardando…' : 'Guardar' }}
            </button>
            <button
              v-if="postReplies[media.id]"
              @click="clearAssignment(media)"
              class="text-sm text-gray-500 hover:text-red-600"
            >
              Quitar asignación
            </button>
            <span v-if="savedId === media.id" class="text-sm text-green-600">Guardado ✓</span>
          </div>
        </div>
      </div>

      <p v-if="!posts.length" class="text-gray-500">No se encontraron publicaciones recientes.</p>
    </div>
  </div>
</template>
