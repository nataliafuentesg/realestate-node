import { ref } from 'vue'

const isOpen = ref(false)
const property = ref(null)

function openContactModal(propertyContext = null) {
  property.value = propertyContext
  isOpen.value = true
}

function closeContactModal() {
  isOpen.value = false
}

export function useContactModal() {
  return { isOpen, property, openContactModal, closeContactModal }
}
