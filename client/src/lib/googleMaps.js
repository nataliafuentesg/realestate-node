// La llave de Maps JavaScript API se configura como variable de entorno en
// Cloudflare Pages (VITE_GOOGLE_MAPS_KEY) y esta restringida por dominio desde
// Google Cloud. No se escribe en el codigo.
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

let loading = null

export function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps)
  if (loading) return loading

  if (!API_KEY) return Promise.reject(new Error('missing_google_maps_key'))

  loading = new Promise((resolve, reject) => {
    // Google llama a esta funcion global si la llave, la facturacion o la API
    // no estan bien configuradas.
    window.gm_authFailure = () => reject(new Error('gm_authFailure'))
    window.__initGoogleMaps = () => resolve(window.google.maps)

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=__initGoogleMaps&loading=async&language=es&region=CO`
    script.async = true
    script.onerror = () => reject(new Error('script_load_failed'))
    document.head.appendChild(script)
  }).catch((err) => {
    loading = null
    throw err
  })

  return loading
}
