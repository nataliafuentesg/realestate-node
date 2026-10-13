import { ref } from 'vue'

const isOpen = ref(false)
const property = ref(null)
// 'visit': comprador que quiere visitar una propiedad.
// 'owner': propietario que quiere publicar con nosotros (reunion virtual).
const mode = ref('visit')

function openContactModal(propertyContext = null) {
  property.value = propertyContext
  mode.value = 'visit'
  isOpen.value = true
}

function openOwnerMeetingModal() {
  property.value = null
  mode.value = 'owner'
  isOpen.value = true
}

function closeContactModal() {
  isOpen.value = false
}

export function useContactModal() {
  return { isOpen, property, mode, openContactModal, openOwnerMeetingModal, closeContactModal }
}
