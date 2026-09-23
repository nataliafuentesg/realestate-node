<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { ArrowLeft, Check, CheckCheck, Clock, AlertCircle, Pin, Search, Bot, UserRound, Trash2, Paperclip, X, FileText, Video } from '@lucide/vue'
import api from '../api/axios'

const conversations = ref([])
const loadingConversations = ref(true)
const selectedWaId = ref(null)
const messages = ref([])
const loadingThread = ref(false)
const replyText = ref('')
const sending = ref(false)
const error = ref('')
const search = ref('')
const takeoverBusy = ref(false)
const attachError = ref('')
const attachProgress = ref('')
const pendingFiles = ref([])

const threadRef = ref(null)
const replyRef = ref(null)
const fileInputRef = ref(null)

function autoGrow() {
  const el = replyRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}
let pollTimer = null
const now = ref(Date.now())
let clockTimer = null

function formatPhone(waId) {
  // waId viene como "573124965755" (indicativo + numero, sin +).
  const match = waId.match(/^(\d{1,3})(\d{3})(\d{3})(\d{4})$/)
  return match ? `+${match[1]} ${match[2]} ${match[3]} ${match[4]}` : `+${waId}`
}

function formatTime(value) {
  return new Date(value).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}

function isUnread(c) {
  return c.lastDirection === 'INBOUND'
}

function initials(c) {
  if (c.contactName) {
    return c.contactName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
  }
  return c.waId.slice(-2)
}

const filteredConversations = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return conversations.value
  return conversations.value.filter(
    (c) => (c.contactName || '').toLowerCase().includes(q) || c.waId.includes(q.replace(/\D/g, '')),
  )
})

// Mismo lenguaje visual que WhatsApp: un check (enviado), doble check gris
// (entregado), doble check azul (leido). "read" solo llega si la persona
// tiene los recibos de lectura activados -- si no, se queda en "delivered".
const STATUS_ICONS = {
  sent: { icon: Check, class: 'text-white/60' },
  delivered: { icon: CheckCheck, class: 'text-white/60' },
  read: { icon: CheckCheck, class: 'text-sky-300' },
  failed: { icon: AlertCircle, class: 'text-red-300' },
}

function statusIcon(status) {
  return STATUS_ICONS[status] ?? { icon: Clock, class: 'text-white/40' }
}

const selectedConversation = computed(() => conversations.value.find((c) => c.waId === selectedWaId.value))

// WhatsApp solo deja mandar texto libre dentro de las 24h desde el ultimo
// mensaje del cliente -- fuera de eso, la API lo rechaza y toca usar una
// plantilla aprobada. Se calcula en vivo en vez de mostrar un aviso fijo.
const windowInfo = computed(() => {
  const lastInbound = [...messages.value].reverse().find((m) => m.direction === 'INBOUND')
  if (!lastInbound) return { open: true, label: 'Sin mensajes del cliente aún' }
  const deadline = new Date(lastInbound.createdAt).getTime() + 24 * 60 * 60 * 1000
  const remainingMs = deadline - now.value
  if (remainingMs <= 0) return { open: false, label: 'Ventana cerrada — solo plantillas aprobadas' }
  const hours = Math.floor(remainingMs / (60 * 60 * 1000))
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
  const urgent = hours < 2
  return {
    open: true,
    urgent,
    label: hours > 0 ? `Quedan ${hours}h ${minutes}min para escribir libre` : `Quedan ${minutes}min para escribir libre`,
  }
})

async function toggleTakeover() {
  if (!selectedConversation.value) return
  takeoverBusy.value = true
  try {
    if (selectedConversation.value.humanHandling) {
      await api.delete(`/whatsapp/conversations/${selectedWaId.value}/takeover`)
    } else {
      await api.put(`/whatsapp/conversations/${selectedWaId.value}/takeover`)
    }
    selectedConversation.value.humanHandling = !selectedConversation.value.humanHandling
  } catch (err) {
    error.value = 'No se pudo cambiar el control de la conversación.'
  } finally {
    takeoverBusy.value = false
  }
}

async function loadConversations() {
  try {
    const res = await api.get('/whatsapp/conversations')
    conversations.value = res.data
  } catch (err) {
    error.value = 'No se pudieron cargar las conversaciones.'
  } finally {
    loadingConversations.value = false
  }
}

// El polling (cada 8s) llamaba esto igual que abrir un chat nuevo, y
// scrollToBottom() te sacaba de donde estuvieras leyendo/copiando un
// mensaje viejo. isPoll=true evita eso: solo baja el scroll solo si ya
// estabas cerca del final (o si es la primera vez que abres ese chat).
async function selectConversation(waId, { isPoll = false } = {}) {
  const isSameConversationRefresh = isPoll && selectedWaId.value === waId
  const wasNearBottom =
    !isSameConversationRefresh ||
    !threadRef.value ||
    threadRef.value.scrollHeight - threadRef.value.scrollTop - threadRef.value.clientHeight < 100

  selectedWaId.value = waId
  if (!isSameConversationRefresh) loadingThread.value = true
  try {
    const res = await api.get(`/whatsapp/conversations/${waId}`)
    messages.value = res.data
    if (wasNearBottom) {
      await nextTick()
      scrollToBottom()
    }
  } catch (err) {
    error.value = 'No se pudo cargar la conversación.'
  } finally {
    loadingThread.value = false
  }
}

function scrollToBottom() {
  if (threadRef.value) threadRef.value.scrollTop = threadRef.value.scrollHeight
}

async function togglePin(c) {
  try {
    if (c.pinned) {
      await api.delete(`/whatsapp/conversations/${c.waId}/pin`)
    } else {
      await api.put(`/whatsapp/conversations/${c.waId}/pin`)
    }
    c.pinned = !c.pinned
    await loadConversations()
  } catch (err) {
    error.value = 'No se pudo actualizar el pin.'
  }
}

async function deleteConversation(c) {
  const label = c.contactName || formatPhone(c.waId)
  if (!confirm(`¿Borrar toda la conversación con ${label}? Esto no se puede deshacer.`)) return
  try {
    await api.delete(`/whatsapp/conversations/${c.waId}`)
    if (selectedWaId.value === c.waId) selectedWaId.value = null
    await loadConversations()
  } catch (err) {
    error.value = 'No se pudo borrar la conversación.'
  }
}

async function sendReply() {
  if (!selectedWaId.value) return
  if (pendingFiles.value.length > 0) {
    await sendPendingFiles()
    return
  }
  if (!replyText.value.trim()) return
  sending.value = true
  try {
    await api.post(`/whatsapp/conversations/${selectedWaId.value}/reply`, { body: replyText.value })
    replyText.value = ''
    await nextTick()
    autoGrow()
    if (selectedConversation.value) selectedConversation.value.humanHandling = true
    await selectConversation(selectedWaId.value)
    await loadConversations()
  } catch (err) {
    error.value = 'No se pudo enviar el mensaje.'
  } finally {
    sending.value = false
  }
}

function mediaTypeFor(file) {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'document'
}

/** Solo agrega los archivos a la vista previa -- el envío real pasa por
 * sendReply(), para que el usuario pueda revisar/quitar antes de mandar. */
function handleAttach(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  for (const file of files) {
    const type = mediaTypeFor(file)
    pendingFiles.value.push({
      file,
      type,
      previewUrl: type === 'image' ? URL.createObjectURL(file) : null,
    })
  }
  nextTick(() => replyRef.value?.focus())
}

function removePendingFile(index) {
  const [removed] = pendingFiles.value.splice(index, 1)
  if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl)
}

function clearPendingFiles() {
  for (const p of pendingFiles.value) {
    if (p.previewUrl) URL.revokeObjectURL(p.previewUrl)
  }
  pendingFiles.value = []
}

async function sendPendingFiles() {
  attachError.value = ''
  sending.value = true
  const caption = replyText.value.trim()
  const files = pendingFiles.value
  try {
    for (let i = 0; i < files.length; i++) {
      const { file } = files[i]
      attachProgress.value = files.length > 1 ? `Enviando ${i + 1} de ${files.length}...` : 'Enviando archivo...'
      const data = new FormData()
      data.append('file', file)
      const uploadRes = await api.post('/uploads', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // WhatsApp no agrupa varias fotos en un solo mensaje -- salen como
      // burbujas separadas, igual que si las mandaras a mano desde el
      // celular. El texto escrito solo va de caption en la primera, para
      // no repetirlo en cada foto.
      await api.post(`/whatsapp/conversations/${selectedWaId.value}/media`, {
        mediaUrl: uploadRes.data.url,
        mediaType: mediaTypeFor(file),
        filename: file.name,
        caption: i === 0 ? (caption || undefined) : undefined,
      })
    }
    clearPendingFiles()
    replyText.value = ''
    await nextTick()
    autoGrow()
    if (selectedConversation.value) selectedConversation.value.humanHandling = true
    await selectConversation(selectedWaId.value)
    await loadConversations()
  } catch (err) {
    attachError.value = 'No se pudo enviar uno de los archivos. Revisa que sean imágenes, video o documentos permitidos.'
  } finally {
    sending.value = false
    attachProgress.value = ''
  }
}

onMounted(() => {
  loadConversations()
  // Refresco simple por polling -- no hay websocket, pero alcanza para que
  // no toque recargar la pagina para ver mensajes nuevos.
  pollTimer = setInterval(() => {
    loadConversations()
    if (selectedWaId.value) selectConversation(selectedWaId.value, { isPoll: true })
  }, 8000)
  // Para que el contador de la ventana de 24h avance solo, sin esperar al polling.
  clockTimer = setInterval(() => {
    now.value = Date.now()
  }, 30000)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (clockTimer) clearInterval(clockTimer)
})
</script>

<template>
  <div class="flex h-[calc(100vh-6.5rem)] flex-col font-[family-name:var(--font-mp-body)] lg:h-[calc(100vh-6rem)]">
    <h1 class="font-[family-name:var(--font-mp-heading)] text-2xl font-medium text-mp-fg">💬 WhatsApp</h1>
    <p v-if="error" class="mt-2 text-sm text-red-400">{{ error }}</p>

    <div class="mt-4 flex min-h-0 flex-1 gap-6 lg:mt-6">
      <!-- Lista de conversaciones: en movil ocupa toda la pantalla y se oculta al abrir un chat -->
      <div
        class="w-full shrink-0 flex-col overflow-hidden rounded-xl border border-mp-border/10 bg-mp-surface lg:flex lg:max-w-xs"
        :class="selectedWaId ? 'hidden' : 'flex'"
      >
        <div class="border-b border-mp-border/10 p-3">
          <div class="relative">
            <Search :size="15" :stroke-width="1.75" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mp-muted/50" />
            <input
              v-model="search"
              type="text"
              placeholder="Buscar contacto..."
              class="w-full rounded-full border border-mp-border/15 bg-mp-bg py-2 pl-9 pr-3 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
            />
          </div>
        </div>
        <div class="flex-1 overflow-y-auto">
          <p v-if="loadingConversations" class="p-5 text-sm text-mp-muted">Cargando...</p>
          <p v-else-if="filteredConversations.length === 0" class="p-5 text-sm text-mp-muted">
            {{ conversations.length === 0 ? 'Todavía no hay conversaciones.' : 'Sin resultados.' }}
          </p>
          <div
            v-for="c in filteredConversations"
            :key="c.waId"
            class="group relative flex w-full items-start gap-2.5 border-b border-mp-border/5 px-3 py-3 text-left transition-colors last:border-0 hover:bg-white/5"
            :class="selectedWaId === c.waId ? 'bg-mp-primary/10' : ''"
          >
            <button class="flex min-w-0 flex-1 items-start gap-2.5 text-left" @click="selectConversation(c.waId)">
              <span
                class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mp-primary/20 text-xs font-semibold text-mp-primary-hover"
              >
                {{ initials(c) }}
              </span>
              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-1">
                  <span
                    class="h-1.5 w-1.5 shrink-0 rounded-full"
                    :class="isUnread(c) ? 'bg-mp-primary' : 'bg-transparent'"
                  ></span>
                  <p class="truncate text-sm" :class="isUnread(c) ? 'font-semibold text-mp-fg' : 'font-medium text-mp-fg'">
                    {{ c.contactName || formatPhone(c.waId) }}
                  </p>
                </span>
                <p v-if="c.contactName" class="text-xs text-mp-muted/60">{{ formatPhone(c.waId) }}</p>
                <p v-if="c.adReferralHeadline" class="mt-0.5 truncate text-[10px] text-mp-primary-hover">
                  📣 {{ c.adReferralHeadline }}
                </p>
                <p class="mt-1 truncate text-xs" :class="isUnread(c) ? 'text-mp-fg/80' : 'text-mp-muted'">
                  {{ c.lastDirection === 'OUTBOUND' ? 'Tú: ' : '' }}{{ c.lastMessage }}
                </p>
                <p class="mt-1 text-[10px] text-mp-muted/50">{{ formatTime(c.lastMessageAt) }}</p>
              </span>
            </button>
            <div class="flex shrink-0 flex-col items-center gap-1">
              <button
                type="button"
                title="Marcar como cliente potencial"
                @click="togglePin(c)"
                class="rounded-lg p-1 transition-colors"
                :class="c.pinned ? 'text-mp-primary' : 'text-mp-muted/30 opacity-0 group-hover:opacity-100 hover:text-mp-muted'"
              >
                <Pin :size="15" :stroke-width="2" :fill="c.pinned ? 'currentColor' : 'none'" />
              </button>
              <button
                type="button"
                title="Borrar conversación"
                @click="deleteConversation(c)"
                class="rounded-lg p-1 text-mp-muted/30 opacity-0 transition-colors hover:text-red-400 group-hover:opacity-100"
              >
                <Trash2 :size="15" :stroke-width="2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Hilo del chat: en movil ocupa toda la pantalla solo cuando hay uno seleccionado -->
      <div
        class="min-w-0 flex-1 flex-col rounded-xl border border-mp-border/10 bg-mp-surface lg:flex"
        :class="selectedWaId ? 'flex' : 'hidden'"
      >
        <template v-if="selectedWaId">
          <div class="flex items-center gap-2 border-b border-mp-border/10 px-3 py-3 lg:px-5">
            <button
              @click="selectedWaId = null"
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-mp-muted hover:bg-white/5 hover:text-mp-fg lg:hidden"
            >
              <ArrowLeft :size="18" :stroke-width="1.75" />
            </button>
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mp-primary/20 text-xs font-semibold text-mp-primary-hover">
              {{ selectedConversation ? initials(selectedConversation) : '' }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-mp-fg">
                {{ selectedConversation?.contactName || formatPhone(selectedWaId) }}
              </p>
              <p v-if="selectedConversation?.contactName" class="text-xs text-mp-muted/60">
                {{ formatPhone(selectedWaId) }}
              </p>
            </div>

            <!-- Toggle visible de quien lleva la conversacion: bot automatico o tu al mando. -->
            <button
              type="button"
              @click="toggleTakeover"
              :disabled="takeoverBusy"
              class="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
              :class="
                selectedConversation?.humanHandling
                  ? 'border-mp-primary/40 bg-mp-primary/15 text-mp-primary-hover'
                  : 'border-mp-border/15 bg-mp-bg text-mp-muted hover:text-mp-fg'
              "
              :title="selectedConversation?.humanHandling ? 'El bot está en silencio, tú respondes' : 'El bot puede responder solo'"
            >
              <UserRound v-if="selectedConversation?.humanHandling" :size="13" :stroke-width="2" />
              <Bot v-else :size="13" :stroke-width="2" />
              <span class="hidden sm:inline">{{ selectedConversation?.humanHandling ? 'Tú al mando' : 'Bot activo' }}</span>
            </button>
          </div>

          <div ref="threadRef" class="flex-1 space-y-3 overflow-y-auto p-4 lg:p-5">
            <p v-if="loadingThread" class="text-sm text-mp-muted">Cargando...</p>
            <div
              v-for="m in messages"
              :key="m.id"
              class="flex"
              :class="m.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm sm:max-w-[75%]"
                :class="
                  m.direction === 'OUTBOUND'
                    ? 'rounded-br-sm bg-mp-primary text-white'
                    : 'rounded-bl-sm bg-white/5 text-mp-fg'
                "
              >
                {{ m.body }}
                <p
                  class="mt-1 flex items-center gap-1 text-[10px]"
                  :class="m.direction === 'OUTBOUND' ? 'text-white/70' : 'text-mp-muted'"
                >
                  {{ formatTime(m.createdAt) }}
                  <component
                    v-if="m.direction === 'OUTBOUND'"
                    :is="statusIcon(m.status).icon"
                    :size="12"
                    :stroke-width="2"
                    :class="statusIcon(m.status).class"
                  />
                </p>
              </div>
            </div>
          </div>

          <div v-if="pendingFiles.length" class="flex gap-2 overflow-x-auto border-t border-mp-border/10 px-3 pt-3 lg:px-4">
            <div v-for="(p, idx) in pendingFiles" :key="idx" class="relative shrink-0">
              <img
                v-if="p.type === 'image'"
                :src="p.previewUrl"
                class="h-16 w-16 rounded-lg border border-mp-border/15 object-cover"
              />
              <div
                v-else
                class="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-mp-border/15 bg-mp-bg px-1 text-center"
              >
                <component :is="p.type === 'video' ? Video : FileText" :size="18" :stroke-width="1.5" class="text-mp-muted" />
                <span class="w-full truncate text-[9px] text-mp-muted">{{ p.file.name }}</span>
              </div>
              <button
                type="button"
                :disabled="sending"
                title="Quitar"
                class="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-mp-primary text-white disabled:opacity-50"
                @click="removePendingFile(idx)"
              >
                <X :size="12" :stroke-width="2.5" />
              </button>
            </div>
          </div>

          <form @submit.prevent="sendReply" class="flex items-end gap-2 border-t border-mp-border/10 p-3 lg:p-4" :class="{ 'border-t-0': pendingFiles.length }">
            <input
              ref="fileInputRef"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/3gpp,application/pdf,.doc,.docx,.xls,.xlsx"
              class="hidden"
              @change="handleAttach"
            />
            <button
              type="button"
              :disabled="sending"
              title="Adjuntar imagen, video o documento"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-mp-border/15 text-mp-muted hover:border-mp-primary hover:text-mp-primary disabled:opacity-50"
              @click="fileInputRef?.click()"
            >
              <Paperclip :size="18" :stroke-width="2" />
            </button>
            <textarea
              ref="replyRef"
              v-model="replyText"
              rows="1"
              :placeholder="pendingFiles.length ? 'Añade un mensaje (opcional)...' : 'Escribe una respuesta... (Shift+Enter para salto de línea)'"
              class="max-h-32 flex-1 resize-none overflow-y-auto rounded-2xl border border-mp-border/15 bg-mp-bg px-4 py-2.5 text-sm text-mp-fg focus:border-mp-primary focus:outline-none"
              @input="autoGrow"
              @keydown.enter.exact.prevent="sendReply"
            ></textarea>
            <button
              type="submit"
              :disabled="sending || (!replyText.trim() && pendingFiles.length === 0)"
              class="shrink-0 rounded-full bg-mp-primary px-6 py-2.5 text-xs tracking-widest text-white hover:bg-mp-primary-hover disabled:opacity-50"
            >
              {{ sending ? '...' : 'ENVIAR' }}
            </button>
          </form>
          <p v-if="attachProgress" class="px-4 pb-1 text-[11px] text-mp-muted/60">{{ attachProgress }}</p>
          <p v-if="attachError" class="px-4 pb-1 text-[11px] text-red-400">{{ attachError }}</p>
          <p
            class="flex items-center gap-1.5 px-4 pb-3 text-[11px]"
            :class="!windowInfo.open ? 'text-red-400' : windowInfo.urgent ? 'text-amber-400' : 'text-mp-muted/60'"
          >
            <Clock :size="12" :stroke-width="2" class="shrink-0" />
            {{ windowInfo.label }}
          </p>
        </template>

        <div v-else class="hidden flex-1 items-center justify-center lg:flex">
          <p class="text-sm text-mp-muted/60">Selecciona una conversación</p>
        </div>
      </div>

      <!-- Panel de detalles del contacto: solo en pantallas grandes, con una conversacion abierta. -->
      <div
        v-if="selectedWaId && selectedConversation"
        class="hidden w-64 shrink-0 overflow-y-auto rounded-xl border border-mp-border/10 bg-mp-surface p-5 xl:block"
      >
        <div class="flex flex-col items-center text-center">
          <span class="flex h-16 w-16 items-center justify-center rounded-full bg-mp-primary/20 text-lg font-semibold text-mp-primary-hover">
            {{ initials(selectedConversation) }}
          </span>
          <p class="mt-3 text-sm font-medium text-mp-fg">
            {{ selectedConversation.contactName || formatPhone(selectedWaId) }}
          </p>
          <p class="text-xs text-mp-muted/60">{{ formatPhone(selectedWaId) }}</p>
        </div>

        <button
          type="button"
          @click="togglePin(selectedConversation)"
          class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors"
          :class="selectedConversation.pinned ? 'border-mp-primary/40 bg-mp-primary/15 text-mp-primary-hover' : 'border-mp-border/15 text-mp-muted hover:text-mp-fg'"
        >
          <Pin :size="14" :stroke-width="2" :fill="selectedConversation.pinned ? 'currentColor' : 'none'" />
          {{ selectedConversation.pinned ? 'Cliente potencial' : 'Marcar cliente potencial' }}
        </button>

        <div class="mt-5 space-y-4 border-t border-mp-border/10 pt-4 text-xs">
          <div v-if="selectedConversation.adReferralHeadline">
            <p class="font-medium tracking-widest text-mp-muted/50">ORIGEN</p>
            <p class="mt-1 text-mp-fg">📣 {{ selectedConversation.adReferralHeadline }}</p>
          </div>

          <div>
            <p class="font-medium tracking-widest text-mp-muted/50">VENTANA DE RESPUESTA</p>
            <p class="mt-1" :class="!windowInfo.open ? 'text-red-400' : windowInfo.urgent ? 'text-amber-400' : 'text-mp-fg'">
              {{ windowInfo.label }}
            </p>
          </div>

          <div>
            <p class="font-medium tracking-widest text-mp-muted/50">CONVERSACIÓN</p>
            <p class="mt-1 text-mp-fg">
              {{ selectedConversation.humanHandling ? '🧑 En manos tuyas' : '🤖 Bot automático' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
