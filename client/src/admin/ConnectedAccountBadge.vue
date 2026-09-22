<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/axios'

// Muestra que cuenta/pagina esta conectada -- antes el panel solo mostraba
// publicaciones/mensajes sin dejar claro de que cuenta eran. Tambien sirve
// como evidencia clara para la revision de apps de Meta.
const props = defineProps({
  platform: { type: String, required: true }, // 'instagram' | 'facebook'
})

const profile = ref(null)

onMounted(async () => {
  try {
    const res = await api.get(`/${props.platform}/profile`)
    profile.value = res.data
  } catch (err) {
    profile.value = null
  }
})

const label = props.platform === 'instagram' ? 'Cuenta de Instagram conectada' : 'Página de Facebook conectada'
const fallbackEmoji = props.platform === 'instagram' ? '📸' : '📘'
</script>

<template>
  <div
    v-if="profile && (profile.username || profile.name)"
    class="mb-6 flex items-center gap-3 rounded-xl border border-mp-border/10 bg-mp-surface px-4 py-3"
  >
    <img
      v-if="profile.profile_picture_url || profile.picture?.data?.url"
      :src="profile.profile_picture_url || profile.picture.data.url"
      class="h-10 w-10 rounded-full object-cover"
      alt=""
    />
    <div v-else class="flex h-10 w-10 items-center justify-center rounded-full bg-mp-primary/10 text-lg">
      {{ fallbackEmoji }}
    </div>
    <div>
      <p class="text-[10px] uppercase tracking-widest text-mp-muted/60">{{ label }}</p>
      <p class="text-sm font-medium text-mp-fg">
        {{ platform === 'instagram' ? '@' + profile.username : profile.name }}
      </p>
    </div>
  </div>
</template>
