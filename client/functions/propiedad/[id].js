const API_BASE = 'https://ventas-api.marcapro.co/api'
const SITE_BASE = 'https://ventas.marcapro.co'

const TYPE_LABELS = { HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Lote' }

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
    price,
  )
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function replaceMetaContent(html, attr, attrValue, newContent) {
  const re = new RegExp(`(<meta[^>]*${attr}="${attrValue}"[^>]*content=")[^"]*(")`, 'i')
  return html.replace(re, `$1${escapeAttr(newContent)}$2`)
}

// Solo reescribe las metaetiquetas -- el resto de la pagina (la SPA) se
// sirve intacta y el navegador la hidrata normal. Es unicamente para que
// los crawlers de WhatsApp/Facebook (que no ejecutan JS) vean el titulo,
// descripcion y foto de la propiedad puntual, no los genericos del sitio.
//
// Nota: se hace con reemplazo de texto plano en vez de HTMLRewriter --
// HTMLRewriter difiere la transformacion real al momento de leer el body
// de la respuesta, fuera del try/catch sincronico de esta funcion, y una
// excepcion ahi tumbaba la pagina entera con un 500 (Error 1101) en vez
// de caer al fallback.
export async function onRequestGet(context) {
  const { id } = context.params
  const response = await context.next()

  try {
    let property
    const res = await fetch(`${API_BASE}/properties/${id}`)
    if (res.ok) property = await res.json()
    if (!property) return response

    let html = await response.text()

    const title = `${property.title} | Ventas Sabana`
    const typeLabel = TYPE_LABELS[property.type] || property.type
    const rawDescription = `${typeLabel} en ${property.city} — ${formatPrice(property.price)}. ${
      property.description || ''
    }`
    const description = rawDescription.slice(0, 200)
    const image = property.images?.[0] || `${SITE_BASE}/og-image.png`
    const url = `${SITE_BASE}/propiedad/${id}`

    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttr(title)}</title>`)
    html = html.replace(
      /(<link rel="canonical" href=")[^"]*(")/,
      `$1${escapeAttr(url)}$2`,
    )
    html = replaceMetaContent(html, 'name', 'description', description)
    html = replaceMetaContent(html, 'property', 'og:title', title)
    html = replaceMetaContent(html, 'property', 'og:description', description)
    html = replaceMetaContent(html, 'property', 'og:image', image)
    html = replaceMetaContent(html, 'property', 'og:url', url)
    html = replaceMetaContent(html, 'name', 'twitter:title', title)
    html = replaceMetaContent(html, 'name', 'twitter:description', description)
    html = replaceMetaContent(html, 'name', 'twitter:image', image)

    return new Response(html, {
      status: response.status,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  } catch (err) {
    // Si algo falla (API caida, propiedad rara, etc) nunca debe tumbar
    // la pagina real -- se sirve la version generica sin cortar el sitio.
    return response
  }
}
