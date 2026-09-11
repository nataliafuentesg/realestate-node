<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/axios'

const posts = ref([])
const postReplies = ref({}) // postId -> reply config
const properties = ref([])
const loading = ref(true)
const error = ref('')
const savingId = ref(null)
const savedId = ref(null)

// Estado local del formulario por publicacion: 'generic' | 'property' | 'custom'
const modeByPost = ref({})
const propertyIdByPost = ref({})
const customTextByPost = ref({})

function truncate(text, max = 90) {
  if (!text) return '(sin texto)'
  return text.length > max ? text.slice(0, max) + '…' : text
}

function initFormState(post) {
  const existing = postReplies.value[post.id]
  if (existing?.propertyId) {
    modeByPost.value[post.id] = 'property'
    propertyIdByPost.value[post.id] = existing.propertyId
  } else if (existing?.customMessage) {
    modeByPost.value[post.id] = 'custom'
    customTextByPost.value[post.id] = existing.customMessage
  } else {
    modeByPost.value[post.id] = 'generic'
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [postsRes, repliesRes, propertiesRes] = await Promise.all([
      api.get('/facebook/media'),
      api.get('/facebook/post-replies'),
      api.get('/properties'),
    ])
    posts.value = postsRes.data?.data ?? []
    postReplies.value = Object.fromEntries((repliesRes.data ?? []).map((r) => [r.postId, r]))
    properties.value = propertiesRes.data ?? []
    posts.value.forEach(initFormState)
  } catch (err) {
    error.value = 'No se pudieron cargar las publicaciones de Facebook. Revisa que el token siga activo.'
  } finally {
    loading.value = false
  }
}

async function save(post) {
  savingId.value = post.id
  savedId.value = null
  try {
    const mode = modeByPost.value[post.id]
    const payload = {
      propertyId: mode === 'property' ? propertyIdByPost.value[post.id] ?? null : null,
      customMessage: mode === 'custom' ? customTextByPost.value[post.id] ?? '' : null,
      caption: post.message ?? '',
      permalink: post.permalink_url ?? '',
      thumbnailUrl: post.full_picture ?? '',
    }
    const res = await api.put(`/facebook/post-replies/${post.id}`, payload)
    postReplies.value[post.id] = res.data
    savedId.value = post.id
    setTimeout(() => {
      if (savedId.value === post.id) savedId.value = null
    }, 2000)
  } catch (err) {
    error.value = 'No se pudo guardar. Intenta de nuevo.'
  } finally {
    savingId.value = null
  }
}

async function clearAssignment(post) {
  modeByPost.value[post.id] = 'generic'
  await save(post)
}

onMounted(load)
</script>

<template>
  <div class="font-[family-name:var(--font-mp-body)]">
    <h1 class="font-[family-name:var(--font-mp-heading)] text-2xl font-medium text-mp-fg">📘 Respuestas por publicación</h1>
    <p class="mt-1 max-w-xl text-sm text-mp-muted">
      Cuando alguien comenta "info" en una publicación de Facebook, elige qué le llega por
      Messenger: la info de un lote específico, un texto personalizado, o el mensaje genérico si
      no asignas nada.
    </p>

    <p v-if="error" class="mt-4 text-sm text-red-400">{{ error }}</p>
    <p v-if="loading" class="mt-10 text-mp-muted">Cargando publicaciones…</p>

    <div v-else class="mt-8 space-y-4">
      <div
        v-for="post in posts"
        :key="post.id"
        class="flex gap-4 rounded-xl border border-mp-border/10 bg-mp-surface p-4"
      >
        <img
          v-if="post.full_picture"
          :src="post.full_picture"
          class="h-24 w-24 shrink-0 rounded-lg object-cover"
          alt=""
        />
        <div class="min-w-0 flex-1">
          <a
            :href="post.permalink_url"
            target="_blank"
            rel="noopener"
            class="text-sm font-medium text-mp-fg hover:text-mp-primary-hover"
          >
            {{ truncate(post.message) }}
          </a>

          <div class="mt-3 flex flex-wrap items-center gap-4 text-sm text-mp-muted">
            <label class="flex items-center gap-1.5">
              <input type="radio" :name="`mode-${post.id}`" value="generic" v-model="modeByPost[post.id]" class="accent-mp-primary" />
              Genérico
            </label>
            <label class="flex items-center gap-1.5">
              <input type="radio" :name="`mode-${post.id}`" value="property" v-model="modeByPost[post.id]" class="accent-mp-primary" />
              Propiedad específica
            </label>
            <label class="flex items-center gap-1.5">
              <input type="radio" :name="`mode-${post.id}`" value="custom" v-model="modeByPost[post.id]" class="accent-mp-primary" />
              Texto personalizado
            </label>
          </div>

          <div v-if="modeByPost[post.id] === 'property'" class="mt-2">
            <select
              v-model="propertyIdByPost[post.id]"
              class="w-full max-w-sm rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-1.5 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
            >
              <option :value="null">Elige una propiedad…</option>
              <option v-for="p in properties" :key="p.id" :value="p.id">{{ p.title }}</option>
            </select>
          </div>

          <div v-if="modeByPost[post.id] === 'custom'" class="mt-2">
            <textarea
              v-model="customTextByPost[post.id]"
              rows="3"
              class="w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
              placeholder="Ej: ¡Genial! Agenda tu auditoría gratis aquí: https://marcapro.co/#contacto"
            ></textarea>
          </div>

          <div class="mt-3 flex items-center gap-4">
            <button
              @click="save(post)"
              :disabled="savingId === post.id"
              class="rounded-full bg-mp-primary px-5 py-1.5 text-xs tracking-widest text-white hover:bg-mp-primary-hover disabled:opacity-50"
            >
              {{ savingId === post.id ? 'GUARDANDO…' : 'GUARDAR' }}
            </button>
            <button
              v-if="postReplies[post.id]"
              @click="clearAssignment(post)"
              class="text-sm text-mp-muted/70 hover:text-red-400"
            >
              Quitar asignación
            </button>
            <span v-if="savedId === post.id" class="text-sm text-green-400">Guardado ✓</span>
          </div>
        </div>
      </div>

      <p v-if="!posts.length" class="text-mp-muted">
        No se encontraron publicaciones recientes.
      </p>
    </div>
  </div>
</template>
