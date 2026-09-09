import { ref } from 'vue'
import api from '../api/axios'

// Estado compartido a nivel de modulo (no por componente) para que el
// contador de "sin responder" en el menu y las bandejas de WhatsApp/
// Instagram usen siempre los mismos datos, sin duplicar el polling.
//
// "Sin responder" = la ULTIMA fila de esa conversacion es INBOUND (el
// cliente escribio y todavia nadie del equipo le contesto). No hay un
// campo "leido" en la base de datos -- en cuanto alguien responde desde
// el panel (o el bot), lastDirection pasa a OUTBOUND y esa conversacion
// deja de contar como pendiente sola.
const whatsappConversations = ref([])
const instagramConversations = ref([])
let started = false
let pollTimer = null

async function refresh() {
  try {
    const [waRes, igRes] = await Promise.all([
      api.get('/whatsapp/conversations'),
      api.get('/instagram/conversations'),
    ])
    whatsappConversations.value = waRes.data ?? []
    instagramConversations.value = igRes.data ?? []
  } catch (err) {
    // silencioso -- esto es solo para el contador del menu, no es critico
  }
}

export function useUnreadCounts() {
  if (!started) {
    started = true
    refresh()
    pollTimer = setInterval(refresh, 15000)
  }

  return { whatsappConversations, instagramConversations, refresh }
}

export function countUnread(conversations) {
  return conversations.filter((c) => c.lastDirection === 'INBOUND').length
}
