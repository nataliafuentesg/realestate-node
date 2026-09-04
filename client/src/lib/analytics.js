import api from '../api/axios'

const SITE = 'INMOBILIARIA'
// El Pixel ID no es secreto -- aparece en el HTML de cualquier pagina que
// lo use, por eso va directo en el codigo en vez de una env var. El token
// de CAPI si es secreto y vive solo en el backend, nunca aqui.
const PIXEL_ID = '2151354445799783'

// Traduce nuestros nombres de evento a los estandar de Meta (mejor
// emparejamiento con las optimizaciones de campana) -- el panel interno
// sigue usando el nombre original, mas especifico.
const META_EVENT_MAP = {
  WhatsAppClick: 'Contact',
  ScheduleVisit: 'Schedule',
  ContactFormBuyer: 'Lead',
  ContactFormOwner: 'Lead',
  PropertyView: 'ViewContent',
  PageView: 'PageView',
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

// Las UTM solo vienen en la URL de la primera pagina que visita la
// persona -- se guardan en sessionStorage para que un evento mas
// adelante (ej. agendar visita 3 paginas despues) las siga teniendo.
function getUtm(param) {
  const key = 'utm_' + param
  const fromUrl = new URLSearchParams(window.location.search).get(param)
  if (fromUrl) sessionStorage.setItem(key, fromUrl)
  return fromUrl || sessionStorage.getItem(key)
}

function getFbclid() {
  const fromUrl = new URLSearchParams(window.location.search).get('fbclid')
  if (fromUrl) sessionStorage.setItem('fbclid', fromUrl)
  return fromUrl || sessionStorage.getItem('fbclid')
}

let pixelReady = false

export function initPixel() {
  if (!PIXEL_ID || pixelReady) return
  pixelReady = true

  /* eslint-disable */
  ;(function (f, b, e, v, n, t, s) {
    if (f.fbq) return
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    }
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    t = b.createElement(e)
    t.async = true
    t.src = v
    s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
  /* eslint-enable */

  window.fbq('init', PIXEL_ID)
  window.fbq('track', 'PageView')
}

// Dispara el evento en dos frentes con el mismo eventId: el pixel del
// navegador (rapido, lo bloquean ad-blockers/Safari) y nuestro backend,
// que lo guarda para el panel interno y lo reenvia a la API de
// Conversiones de Meta desde el servidor (confiable, eventId igual =
// Meta deduplica el par en vez de contarlo doble).
export function track(eventName, extra = {}) {
  const eventId = crypto.randomUUID()
  const metaEventName = META_EVENT_MAP[eventName] || eventName

  if (window.fbq) {
    window.fbq('track', metaEventName, {}, { eventID: eventId })
  }

  api
    .post('/analytics/events', {
      site: SITE,
      eventName,
      eventId,
      pageUrl: window.location.href,
      referrer: document.referrer || null,
      utmSource: getUtm('source'),
      utmMedium: getUtm('medium'),
      utmCampaign: getUtm('campaign'),
      utmContent: getUtm('content'),
      utmTerm: getUtm('term'),
      fbclid: getFbclid(),
      fbp: getCookie('_fbp'),
      fbc: getCookie('_fbc'),
      ...extra,
    })
    .catch(() => {})
}
