const API_BASE = 'https://ventas-api.marcapro.co/api'
const SITE_BASE = 'https://ventas.marcapro.co'

export async function onRequestGet() {
  let properties = []
  try {
    // El fetcher de sitemaps de Google es impaciente -- si el backend tarda,
    // preferimos responder rapido con lo estatico en vez de arriesgar que
    // Google marque todo el sitemap como "Couldn't fetch" por una demora.
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(`${API_BASE}/properties`, { signal: controller.signal })
    clearTimeout(timeout)
    if (res.ok) properties = await res.json()
  } catch (err) {
    // Si la API no responde (o tarda mas de 4s), igual devolvemos el
    // sitemap con las paginas estaticas -- mejor un sitemap parcial que
    // uno lento o caido.
  }

  const staticUrls = [{ loc: `${SITE_BASE}/`, changefreq: 'daily', priority: '1.0' }]

  const propertyUrls = properties.map((p) => ({
    loc: `${SITE_BASE}/propiedad/${p.id}`,
    lastmod: (p.updatedAt || p.createdAt || '').slice(0, 10),
    changefreq: 'weekly',
    priority: '0.8',
  }))

  const urls = [...staticUrls, ...propertyUrls]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
