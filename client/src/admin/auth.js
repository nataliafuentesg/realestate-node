import { ref } from 'vue'

const token = ref(localStorage.getItem('admin_token'))

export function useAdminAuth() {
  function setToken(value) {
    token.value = value
    localStorage.setItem('admin_token', value)
  }

  function logout() {
    token.value = null
    localStorage.removeItem('admin_token')
  }

  function isAuthenticated() {
    return !!token.value
  }

  return { token, setToken, logout, isAuthenticated }
}
