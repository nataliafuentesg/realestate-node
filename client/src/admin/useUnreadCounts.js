import { ref } from 'vue'
import api from '../api/axios'

// Estado compartido a nivel de modulo (no por componente) para que el
// contador de "sin responder" en el menu y las bandejas de WhatsApp/
// Instagram usen siempre los mismos datos, sin duplicar el polling.
//
// "Sin leer" (WhatsApp: ver campo unread del servidor). Para IG/FB: la ULTIMA fila de esa conversacion es INBOUND (el
// cliente escribio y todavia nadie del equipo le contesto). No hay un
// campo "leido" en la base de datos -- en cuanto alguien responde desde
// el panel (o el bot), lastDirection pasa a OUTBOUND y esa conversacion
// deja de contar como pendiente sola.
const whatsappConversations = ref([])
const instagramConversations = ref([])
const facebookConversations = ref([])
let started = false
let pollTimer = null

async function refresh() {
  try {
    const [waRes, igRes, fbRes] = await Promise.all([
      api.get('/whatsapp/conversations'),
      api.get('/instagram/conversations'),
      api.get('/facebook/conversations'),
    ])
    whatsappConversations.value = waRes.data ?? []
    instagramConversations.value = igRes.data ?? []
    facebookConversations.value = fbRes.data ?? []
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

  return { whatsappConversations, instagramConversations, facebookConversations, refresh }
}

export function countUnread(conversations) {
  // WhatsApp trae `unread` desde el servidor (ya descuenta lo que se abrio en el panel);
  // Instagram y Facebook todavia usan "el ultimo mensaje es del cliente".
  return conversations.filter((c) => c.unread ?? c.lastDirection === 'INBOUND').length
}
