<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import api from '../api/axios'

const conversations = ref([])
const loadingConversations = ref(true)
const selectedSenderId = ref(null)
const messages = ref([])
const loadingThread = ref(false)
const replyText = ref('')
const sending = ref(false)
const error = ref('')

const threadRef = ref(null)
let pollTimer = null

function formatTime(value) {
  return new Date(value).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}

const selectedConversation = computed(() => conversations.value.find((c) => c.senderId === selectedSenderId.value))

async function loadConversations() {
  try {
    const res = await api.get('/instagram/conversations')
    conversations.value = res.data
  } catch (err) {
    error.value = 'No se pudieron cargar las conversaciones.'
  } finally {
    loadingConversations.value = false
  }
}

async function selectConversation(senderId) {
  selectedSenderId.value = senderId
  loadingThread.value = true
  try {
    const res = await api.get(`/instagram/conversations/${senderId}`)
    messages.value = res.data
    await nextTick()
    scrollToBottom()
  } catch (err) {
    error.value = 'No se pudo cargar la conversación.'
  } finally {
    loadingThread.value = false
  }
}

function scrollToBottom() {
  if (threadRef.value) threadRef.value.scrollTop = threadRef.value.scrollHeight
}

async function sendReply() {
  if (!replyText.value.trim() || !selectedSenderId.value) return
  sending.value = true
  try {
    await api.post(`/instagram/conversations/${selectedSenderId.value}/reply`, { body: replyText.value })
    replyText.value = ''
    await selectConversation(selectedSenderId.value)
    await loadConversations()
  } catch (err) {
    error.value = 'No se pudo enviar el mensaje.'
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  loadConversations()
  // Refresco simple por polling -- no hay websocket, pero alcanza para que
  // no toque recargar la pagina para ver mensajes nuevos.
  pollTimer = setInterval(() => {
    loadConversations()
    if (selectedSenderId.value) selectConversation(selectedSenderId.value)
  }, 8000)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="flex h-[calc(100vh-5rem)] flex-col font-[family-name:var(--font-mp-body)] lg:h-[calc(100vh-6rem)]">
    <h1 class="font-[family-name:var(--font-mp-heading)] text-2xl font-medium text-mp-fg">📸 Instagram DMs</h1>
    <p v-if="error" class="mt-2 text-sm text-red-400">{{ error }}</p>

    <div class="mt-6 flex min-h-0 flex-1 gap-6">
      <div class="w-full max-w-xs shrink-0 overflow-y-auto rounded-xl border border-mp-border/10 bg-mp-surface">
        <p v-if="loadingConversations" class="p-5 text-sm text-mp-muted">Cargando...</p>
        <p v-else-if="conversations.length === 0" class="p-5 text-sm text-mp-muted">
          Todavía no hay conversaciones.
        </p>
        <button
          v-for="c in conversations"
          :key="c.senderId"
          @click="selectConversation(c.senderId)"
          class="block w-full border-b border-mp-border/5 px-4 py-3 text-left transition-colors last:border-0 hover:bg-white/5"
          :class="selectedSenderId === c.senderId ? 'bg-mp-primary/10' : ''"
        >
          <p class="text-sm font-medium text-mp-fg">Usuario {{ c.senderId.slice(-6) }}</p>
          <p class="mt-1 truncate text-xs text-mp-muted">
            {{ c.lastDirection === 'OUTBOUND' ? 'Tú: ' : '' }}{{ c.lastMessage }}
          </p>
          <p class="mt-1 text-[10px] text-mp-muted/50">{{ formatTime(c.lastMessageAt) }}</p>
        </button>
      </div>

      <div class="flex min-w-0 flex-1 flex-col rounded-xl border border-mp-border/10 bg-mp-surface">
        <template v-if="selectedSenderId">
          <div class="border-b border-mp-border/10 px-5 py-3">
            <p class="text-sm font-medium text-mp-fg">Usuario {{ selectedSenderId.slice(-6) }}</p>
          </div>

          <div ref="threadRef" class="flex-1 space-y-3 overflow-y-auto p-5">
            <p v-if="loadingThread" class="text-sm text-mp-muted">Cargando...</p>
            <div
              v-for="m in messages"
              :key="m.id"
              class="flex"
              :class="m.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm"
                :class="
                  m.direction === 'OUTBOUND'
                    ? 'rounded-br-sm bg-mp-primary text-white'
                    : 'rounded-bl-sm bg-white/5 text-mp-fg'
                "
              >
                {{ m.body }}
                <p
                  class="mt-1 text-[10px]"
                  :class="m.direction === 'OUTBOUND' ? 'text-white/70' : 'text-mp-muted'"
                >
                  {{ formatTime(m.createdAt) }}
                </p>
              </div>
            </div>
          </div>

          <form @submit.prevent="sendReply" class="flex gap-2 border-t border-mp-border/10 p-4">
            <input
              v-model="replyText"
              type="text"
              placeholder="Escribe una respuesta..."
              class="flex-1 rounded-full border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
            />
            <button
              type="submit"
              :disabled="sending || !replyText.trim()"
              class="rounded-full bg-mp-primary px-6 py-2.5 text-xs tracking-widest text-white hover:bg-mp-primary-hover disabled:opacity-50"
            >
              {{ sending ? '...' : 'ENVIAR' }}
            </button>
          </form>
          <p class="px-4 pb-3 text-[11px] text-mp-muted/60">
            Solo puedes escribir texto libre si el cliente escribió en las últimas 24h. Fuera de ese plazo, la API lo
            rechaza.
          </p>
        </template>

        <div v-else class="flex flex-1 items-center justify-center">
          <p class="text-sm text-mp-muted/60">Selecciona una conversación</p>
        </div>
      </div>
    </div>
  </div>
</template>
