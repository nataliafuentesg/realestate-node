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
  <div class="flex h-[calc(100vh-5rem)] flex-col lg:h-[calc(100vh-6rem)]">
    <h1 class="font-serif text-2xl text-charcoal">📸 Instagram DMs</h1>
    <p v-if="error" class="mt-2 font-sans text-sm text-red-600">{{ error }}</p>

    <div class="mt-6 flex min-h-0 flex-1 gap-6">
      <div class="w-full max-w-xs shrink-0 overflow-y-auto rounded-xl border border-charcoal/10 bg-white">
        <p v-if="loadingConversations" class="p-5 font-sans text-sm text-charcoal/50">Cargando...</p>
        <p v-else-if="conversations.length === 0" class="p-5 font-sans text-sm text-charcoal/50">
          Todavía no hay conversaciones.
        </p>
        <button
          v-for="c in conversations"
          :key="c.senderId"
          @click="selectConversation(c.senderId)"
          class="block w-full border-b border-charcoal/5 px-4 py-3 text-left transition-colors last:border-0 hover:bg-charcoal/5"
          :class="selectedSenderId === c.senderId ? 'bg-gold-light/10' : ''"
        >
          <p class="font-sans text-sm font-medium text-charcoal">Usuario {{ c.senderId.slice(-6) }}</p>
          <p class="mt-1 truncate font-sans text-xs text-charcoal/50">
            {{ c.lastDirection === 'OUTBOUND' ? 'Tú: ' : '' }}{{ c.lastMessage }}
          </p>
          <p class="mt-1 font-sans text-[10px] text-charcoal/30">{{ formatTime(c.lastMessageAt) }}</p>
        </button>
      </div>

      <div class="flex min-w-0 flex-1 flex-col rounded-xl border border-charcoal/10 bg-white">
        <template v-if="selectedSenderId">
          <div class="border-b border-charcoal/10 px-5 py-3">
            <p class="font-sans text-sm font-medium text-charcoal">Usuario {{ selectedSenderId.slice(-6) }}</p>
          </div>

          <div ref="threadRef" class="flex-1 space-y-3 overflow-y-auto p-5">
            <p v-if="loadingThread" class="font-sans text-sm text-charcoal/50">Cargando...</p>
            <div
              v-for="m in messages"
              :key="m.id"
              class="flex"
              :class="m.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 font-sans text-sm"
                :class="
                  m.direction === 'OUTBOUND'
                    ? 'rounded-br-sm bg-charcoal text-cream'
                    : 'rounded-bl-sm bg-charcoal/5 text-charcoal'
                "
              >
                {{ m.body }}
                <p
                  class="mt-1 text-[10px]"
                  :class="m.direction === 'OUTBOUND' ? 'text-cream/50' : 'text-charcoal/40'"
                >
                  {{ formatTime(m.createdAt) }}
                </p>
              </div>
            </div>
          </div>

          <form @submit.prevent="sendReply" class="flex gap-2 border-t border-charcoal/10 p-4">
            <input
              v-model="replyText"
              type="text"
              placeholder="Escribe una respuesta..."
              class="flex-1 rounded-full border border-charcoal/15 bg-white px-4 py-2.5 font-sans text-sm text-charcoal focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              :disabled="sending || !replyText.trim()"
              class="rounded-full bg-charcoal px-6 py-2.5 font-sans text-xs tracking-widest text-cream hover:bg-gold hover:text-charcoal disabled:opacity-50"
            >
              {{ sending ? '...' : 'ENVIAR' }}
            </button>
          </form>
          <p class="px-4 pb-3 font-sans text-[11px] text-charcoal/40">
            Solo puedes escribir texto libre si el cliente escribió en las últimas 24h. Fuera de ese plazo, la API lo
            rechaza.
          </p>
        </template>

        <div v-else class="flex flex-1 items-center justify-center">
          <p class="font-sans text-sm text-charcoal/40">Selecciona una conversación</p>
        </div>
      </div>
    </div>
  </div>
</template>
