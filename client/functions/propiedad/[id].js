const API_BASE = 'https://ventas-api.marcapro.co/api'
const SITE_BASE = 'https://ventas.marcapro.co'

const TYPE_LABELS = { HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Lote' }

function formatPrice(price) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
    price,
  )
}

class SetText {
  constructor(text) {
    this.text = text
  }
  element(element) {
    element.setInnerContent(this.text)
  }
}

class SetAttr {
  constructor(attr, value) {
    this.attr = attr
    this.value = value
  }
  element(element) {
    element.setAttribute(this.attr, this.value)
  }
}

// Solo reescribe las metaetiquetas -- el resto de la pagina (la SPA) se
// sirve intacta y el navegador la hidrata normal. Esto es unicamente para
// que los crawlers de WhatsApp/Facebook (que no ejecutan JS) vean el
// titulo, descripcion y foto de la propiedad puntual, no los genericos
// del sitio.
export async function onRequestGet(context) {
  const { id } = context.params
  const response = await context.next()

  let property
  try {
    const res = await fetch(`${API_BASE}/properties/${id}`)
    if (res.ok) property = await res.json()
  } catch (err) {
    // sin datos, se sirve la pagina con las metaetiquetas genericas
  }

  if (!property) return response

  const title = `${property.title} | Ventas Sabana`
  const typeLabel = TYPE_LABELS[property.type] || property.type
  const description = `${typeLabel} en ${property.city} — ${formatPrice(property.price)}. ${property.description || ''}`.slice(
    0,
    200,
  )
  const image = property.images?.[0] || `${SITE_BASE}/og-image.png`
  const url = `${SITE_BASE}/propiedad/${id}`

  return new HTMLRewriter()
    .on('title', new SetText(title))
    .on('meta[name="description"]', new SetAttr('content', description))
    .on('link[rel="canonical"]', new SetAttr('href', url))
    .on('meta[property="og:title"]', new SetAttr('content', title))
    .on('meta[property="og:description"]', new SetAttr('content', description))
    .on('meta[property="og:image"]', new SetAttr('content', image))
    .on('meta[property="og:url"]', new SetAttr('content', url))
    .on('meta[property="og:type"]', new SetAttr('content', 'og:product'))
    .on('meta[name="twitter:title"]', new SetAttr('content', title))
    .on('meta[name="twitter:description"]', new SetAttr('content', description))
    .on('meta[name="twitter:image"]', new SetAttr('content', image))
    .transform(response)
}
