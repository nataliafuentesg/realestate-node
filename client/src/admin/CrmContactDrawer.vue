<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { X, Trash2, ExternalLink, Plus, CircleCheck, Circle, Phone, Mail, CalendarDays, Video } from '@lucide/vue'
import api from '../api/axios'
import ConversationSummary from './ConversationSummary.vue'
import { STAGES, PIPELINES, stageOf, formatMoney, formatDate, formatDateTime, todayIso, CHANNEL_ROUTES } from './crm'

const props = defineProps({ contactId: { type: Number, required: true } })
const emit = defineEmits(['close', 'changed', 'deleted'])
const router = useRouter()

const detail = ref(null)
const loading = ref(true)
const error = ref('')
const saving = ref(false)

const form = ref({ name: '', phone: '', email: '', pipeline: 'REAL_ESTATE', estimatedValue: '', assignee: '', tagsText: '' })
const noteText = ref('')
const taskTitle = ref('')
const taskDate = ref(todayIso())

async function load() {
  try {
    const res = await api.get(`/crm/contacts/${props.contactId}`)
    detail.value = res.data
    const c = res.data.contact
    form.value = {
      name: c.name ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      pipeline: c.pipeline,
      estimatedValue: c.estimatedValue ?? '',
      assignee: c.assignee ?? '',
      tagsText: (c.tags ?? []).join(', '),
    }
  } catch (err) {
    error.value = 'No se pudo cargar el contacto.'
  } finally {
    loading.value = false
  }
}

watch(() => props.contactId, () => { loading.value = true; load() }, { immediate: true })

const contact = computed(() => detail.value?.contact)
const stage = computed(() => (contact.value ? stageOf(contact.value.stage) : null))

async function saveInfo() {
  saving.value = true
  error.value = ''
  try {
    await api.put(`/crm/contacts/${props.contactId}`, {
      name: form.value.name,
      phone: form.value.phone,
      email: form.value.email,
      pipeline: form.value.pipeline,
      estimatedValue: form.value.estimatedValue === '' ? null : Number(form.value.estimatedValue),
      assignee: form.value.assignee,
      tags: form.value.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
    })
    await load()
    emit('changed')
  } catch (err) {
    error.value = 'No se pudo guardar.'
  } finally {
    saving.value = false
  }
}

async function changeStage(event) {
  const next = event.target.value
  let lostReason = ''
  if (next === 'LOST') {
    const answer = window.prompt('¿Por qué se perdió? (opcional)')
    if (answer === null) {
      event.target.value = contact.value.stage
      return
    }
    lostReason = answer
  }
  try {
    await api.put(`/crm/contacts/${props.contactId}/stage`, { stage: next, lostReason })
    await load()
    emit('changed')
  } catch (err) {
    error.value = 'No se pudo cambiar la etapa.'
  }
}

async function addNote() {
  if (!noteText.value.trim()) return
  try {
    await api.post(`/crm/contacts/${props.contactId}/notes`, { text: noteText.value })
    noteText.value = ''
    await load()
    emit('changed')
  } catch (err) {
    error.value = 'No se pudo guardar la nota.'
  }
}

async function addTask() {
  if (!taskTitle.value.trim()) return
  try {
    await api.post(`/crm/contacts/${props.contactId}/tasks`, { title: taskTitle.value, dueDate: taskDate.value })
    taskTitle.value = ''
    taskDate.value = todayIso()
    await load()
    emit('changed')
  } catch (err) {
    error.value = 'No se pudo crear el pendiente.'
  }
}

async function toggleTask(task) {
  try {
    await api.put(`/crm/tasks/${task.id}/done`, null, { params: { done: !task.done } })
    await load()
    emit('changed')
  } catch (err) {
    error.value = 'No se pudo actualizar el pendiente.'
  }
}

async function removeTask(task) {
  await api.delete(`/crm/tasks/${task.id}`)
  await load()
  emit('changed')
}

async function removeContact() {
  if (!window.confirm(`¿Eliminar a ${contact.value.displayName} del CRM? Las conversaciones no se borran.`)) return
  await api.delete(`/crm/contacts/${props.contactId}`)
  emit('deleted')
}

function openConversation(conv) {
  router.push({ path: CHANNEL_ROUTES[conv.channel], query: { c: conv.id } })
}

const ACTIVITY_STYLE = {
  NOTE: 'border-mp-primary/50 bg-mp-primary/5',
  STAGE: 'border-yellow-500/40 bg-white/[0.03]',
  MEETING: 'border-purple-500/40 bg-white/[0.03]',
  TASK: 'border-green-500/40 bg-white/[0.03]',
  SYSTEM: 'border-mp-border/20 bg-white/[0.02]',
}

const inputClass = 'w-full rounded-lg border border-mp-border/15 bg-mp-bg px-3 py-2 text-sm text-mp-fg focus:border-mp-primary focus:outline-none'
</script>

<template>
  <div class="fixed inset-0 z-50 flex justify-end bg-black/50" @click.self="emit('close')">
    <aside class="flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-mp-border/10 bg-mp-surface shadow-2xl">
      <div v-if="loading" class="p-6 text-sm text-mp-muted">Cargando…</div>

      <template v-else-if="contact">
        <!-- Encabezado -->
        <div class="flex items-start gap-3 border-b border-mp-border/10 px-5 py-4">
          <div class="min-w-0 flex-1">
            <h2 class="truncate font-[family-name:var(--font-mp-heading)] text-lg font-medium text-mp-fg">{{ contact.displayName }}</h2>
            <p class="mt-0.5 text-xs text-mp-muted">
              {{ contact.sourceLabel }}<span v-if="contact.sourceDetail"> · {{ contact.sourceDetail }}</span>
            </p>
          </div>
          <button class="rounded-lg p-1.5 text-mp-muted hover:bg-white/5 hover:text-mp-fg" @click="emit('close')"><X :size="18" /></button>
        </div>

        <div class="flex-1 space-y-6 overflow-y-auto px-5 py-4 text-sm">
          <p v-if="error" class="rounded-lg bg-red-500/10 px-3 py-2 text-red-400">{{ error }}</p>

          <!-- Etapa -->
          <div class="flex items-center gap-3">
            <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="stage.dot"></span>
            <select :value="contact.stage" :class="inputClass" @change="changeStage">
              <option v-for="s in STAGES" :key="s.key" :value="s.key">{{ s.label }}</option>
            </select>
          </div>
          <p v-if="contact.stage === 'LOST' && contact.lostReason" class="-mt-3 text-xs text-mp-muted">Motivo: {{ contact.lostReason }}</p>

          <!-- Acciones rápidas -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="conv in detail.conversations"
              :key="conv.channel"
              class="inline-flex items-center gap-1.5 rounded-full border border-mp-primary/40 bg-mp-primary/10 px-3 py-1.5 text-xs font-medium text-mp-primary-hover hover:bg-mp-primary/20"
              @click="openConversation(conv)"
            >
              <ExternalLink :size="13" /> Abrir {{ conv.label }}
            </button>
            <a v-if="contact.phone" :href="`tel:+${contact.phone}`" class="inline-flex items-center gap-1.5 rounded-full border border-mp-border/20 px-3 py-1.5 text-xs text-mp-fg hover:bg-white/5">
              <Phone :size="13" /> Llamar
            </a>
            <a v-if="contact.email" :href="`mailto:${contact.email}`" class="inline-flex items-center gap-1.5 rounded-full border border-mp-border/20 px-3 py-1.5 text-xs text-mp-fg hover:bg-white/5">
              <Mail :size="13" /> Correo
            </a>
          </div>

          <!-- Resumen con IA de la conversación (solo cuando hay chat) -->
          <div v-if="detail.conversations.length" class="-mx-5 border-y border-mp-border/10">
            <ConversationSummary
              :key="detail.conversations[0].channel + detail.conversations[0].id"
              :channel="detail.conversations[0].channel"
              :conversation-id="detail.conversations[0].id"
              :version="contact.lastActivityAt"
            />
          </div>

          <!-- Pendientes -->
          <section>
            <h3 class="mb-2 text-xs font-medium tracking-wide text-mp-muted">PENDIENTES</h3>
            <p v-if="!detail.tasks.length" class="mb-2 text-xs text-mp-muted">Nada pendiente con este contacto.</p>
            <ul class="space-y-1.5">
              <li v-for="t in detail.tasks" :key="t.id" class="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
                <button class="shrink-0" :class="t.done ? 'text-green-400' : 'text-mp-muted hover:text-mp-fg'" @click="toggleTask(t)">
                  <CircleCheck v-if="t.done" :size="18" /><Circle v-else :size="18" />
                </button>
                <span class="min-w-0 flex-1" :class="t.done ? 'text-mp-muted line-through' : 'text-mp-fg'">{{ t.title }}</span>
                <span class="shrink-0 text-xs" :class="t.overdue ? 'text-red-400' : 'text-mp-muted'">{{ formatDate(t.dueDate) }}</span>
                <button class="shrink-0 text-mp-muted hover:text-red-400" @click="removeTask(t)"><X :size="14" /></button>
              </li>
            </ul>
            <form class="mt-2 flex gap-2" @submit.prevent="addTask">
              <input v-model="taskTitle" :class="inputClass" placeholder="Ej. Llamar para confirmar" />
              <input v-model="taskDate" type="date" class="w-36 shrink-0 rounded-lg border border-mp-border/15 bg-mp-bg px-2 py-2 text-sm text-mp-fg" />
              <button type="submit" class="shrink-0 rounded-lg bg-mp-primary px-3 text-white hover:bg-mp-primary-hover"><Plus :size="16" /></button>
            </form>
          </section>

          <!-- Reuniones -->
          <section v-if="detail.meetings.length">
            <h3 class="mb-2 text-xs font-medium tracking-wide text-mp-muted">REUNIONES VIRTUALES</h3>
            <ul class="space-y-1.5">
              <li v-for="(m, i) in detail.meetings" :key="i" class="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2" :class="m.status === 'CANCELLED' ? 'opacity-50' : ''">
                <CalendarDays :size="15" class="shrink-0 text-purple-300" />
                <span class="min-w-0 flex-1 text-mp-fg" :class="m.status === 'CANCELLED' ? 'line-through' : ''">{{ m.whenText }}</span>
                <a v-if="m.meetUrl && m.status !== 'CANCELLED'" :href="m.meetUrl" target="_blank" rel="noopener" class="inline-flex items-center gap-1 text-xs text-mp-primary-hover hover:underline">
                  <Video :size="13" /> Meet
                </a>
              </li>
            </ul>
          </section>

          <!-- Datos del contacto -->
          <section>
            <h3 class="mb-2 text-xs font-medium tracking-wide text-mp-muted">DATOS</h3>
            <div class="grid gap-2 sm:grid-cols-2">
              <input v-model="form.name" :class="inputClass" placeholder="Nombre" />
              <input v-model="form.phone" :class="inputClass" placeholder="Teléfono" />
              <input v-model="form.email" :class="inputClass" placeholder="Correo" />
              <select v-model="form.pipeline" :class="inputClass">
                <option v-for="p in PIPELINES" :key="p.key" :value="p.key">Embudo: {{ p.label }}</option>
              </select>
              <input v-model="form.estimatedValue" type="number" min="0" :class="inputClass" placeholder="Valor estimado (COP)" />
              <input v-model="form.assignee" :class="inputClass" placeholder="Responsable" />
              <input v-model="form.tagsText" :class="[inputClass, 'sm:col-span-2']" placeholder="Etiquetas separadas por coma (ej. lote, inversionista)" />
            </div>
            <button :disabled="saving" class="mt-2 rounded-full bg-mp-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-mp-primary-hover disabled:opacity-60" @click="saveInfo">
              {{ saving ? 'Guardando…' : 'Guardar datos' }}
            </button>
            <p v-if="contact.estimatedValue" class="mt-1 text-xs text-mp-muted">Valor estimado: {{ formatMoney(contact.estimatedValue) }}</p>
          </section>

          <!-- Notas e historial -->
          <section>
            <h3 class="mb-2 text-xs font-medium tracking-wide text-mp-muted">NOTAS E HISTORIAL</h3>
            <form class="flex gap-2" @submit.prevent="addNote">
              <textarea v-model="noteText" rows="2" :class="[inputClass, 'resize-none']" placeholder="Escribe una nota…"></textarea>
              <button type="submit" :disabled="!noteText.trim()" class="shrink-0 self-end rounded-lg bg-mp-primary px-3 py-2 text-xs font-medium text-white hover:bg-mp-primary-hover disabled:opacity-40">Guardar</button>
            </form>
            <ul class="mt-3 space-y-2">
              <li v-for="a in detail.activities" :key="a.id" class="rounded-lg border-l-2 px-3 py-2" :class="ACTIVITY_STYLE[a.type]">
                <p class="whitespace-pre-wrap text-mp-fg/90">{{ a.text }}</p>
                <p class="mt-0.5 text-[11px] text-mp-muted">{{ formatDateTime(a.createdAt) }}<span v-if="a.author"> · {{ a.author }}</span></p>
              </li>
            </ul>
          </section>

          <button class="inline-flex items-center gap-1.5 text-xs text-mp-muted hover:text-red-400" @click="removeContact">
            <Trash2 :size="13" /> Eliminar contacto del CRM
          </button>
        </div>
      </template>

      <p v-else class="p-6 text-sm text-red-400">{{ error || 'No se encontró el contacto.' }}</p>
    </aside>
  </div>
</template>
