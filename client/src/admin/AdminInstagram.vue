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
  <div>
    <h1 class="font-serif text-2xl text-charcoal">📸 Respuestas por publicación</h1>
    <p class="mt-1 max-w-xl font-sans text-sm text-charcoal/50">
      Cuando alguien comenta "info" en una publicación, elige qué le llega por DM: la info de un
      lote específico, un texto personalizado (ej. la auditoría gratis), o el mensaje genérico si
      no asignas nada.
    </p>

    <p v-if="error" class="mt-4 font-sans text-sm text-red-600">{{ error }}</p>
    <p v-if="loading" class="mt-10 font-sans text-charcoal/50">Cargando publicaciones…</p>

    <div v-else class="mt-8 space-y-4">
      <div
        v-for="media in posts"
        :key="media.id"
        class="flex gap-4 rounded-xl border border-charcoal/10 bg-white p-4"
      >
        <img
          v-if="media.thumbnail_url || media.media_url"
          :src="media.thumbnail_url || media.media_url"
          class="h-24 w-24 shrink-0 rounded-lg object-cover"
          alt=""
        />
        <div class="min-w-0 flex-1">
          <a
            :href="media.permalink"
            target="_blank"
            rel="noopener"
            class="font-sans text-sm font-medium text-charcoal hover:text-gold"
          >
            {{ truncate(media.caption) }}
          </a>

          <div class="mt-3 flex flex-wrap items-center gap-4 font-sans text-sm text-charcoal/70">
            <label class="flex items-center gap-1.5">
              <input type="radio" :name="`mode-${media.id}`" value="generic" v-model="modeByMedia[media.id]" class="accent-gold" />
              Genérico
            </label>
            <label class="flex items-center gap-1.5">
              <input type="radio" :name="`mode-${media.id}`" value="property" v-model="modeByMedia[media.id]" class="accent-gold" />
              Propiedad específica
            </label>
            <label class="flex items-center gap-1.5">
              <input type="radio" :name="`mode-${media.id}`" value="custom" v-model="modeByMedia[media.id]" class="accent-gold" />
              Texto personalizado
            </label>
          </div>

          <div v-if="modeByMedia[media.id] === 'property'" class="mt-2">
            <select
              v-model="propertyIdByMedia[media.id]"
              class="w-full max-w-sm rounded-lg border border-charcoal/15 bg-white px-3 py-1.5 font-sans text-sm text-charcoal focus:border-gold focus:outline-none"
            >
              <option :value="null">Elige una propiedad…</option>
              <option v-for="p in properties" :key="p.id" :value="p.id">{{ p.title }}</option>
            </select>
          </div>

          <div v-if="modeByMedia[media.id] === 'custom'" class="mt-2">
            <textarea
              v-model="customTextByMedia[media.id]"
              rows="3"
              class="w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-gold focus:outline-none"
              placeholder="Ej: ¡Genial! Agenda tu auditoría gratis aquí: https://marcapro.co/#contacto"
            ></textarea>
          </div>

          <div class="mt-3 flex items-center gap-4">
            <button
              @click="save(media)"
              :disabled="savingId === media.id"
              class="rounded-full bg-charcoal px-5 py-1.5 font-sans text-xs tracking-widest text-cream hover:bg-gold hover:text-charcoal disabled:opacity-50"
            >
              {{ savingId === media.id ? 'GUARDANDO…' : 'GUARDAR' }}
            </button>
            <button
              v-if="postReplies[media.id]"
              @click="clearAssignment(media)"
              class="font-sans text-sm text-charcoal/40 hover:text-red-600"
            >
              Quitar asignación
            </button>
            <span v-if="savedId === media.id" class="font-sans text-sm text-green-600">Guardado ✓</span>
          </div>
        </div>
      </div>

      <p v-if="!posts.length" class="font-sans text-charcoal/50">
        No se encontraron publicaciones recientes.
      </p>
    </div>
  </div>
</template>
