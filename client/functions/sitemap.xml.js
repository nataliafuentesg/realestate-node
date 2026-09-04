const API_BASE = 'https://ventas-api.marcapro.co/api'
const SITE_BASE = 'https://ventas.marcapro.co'

export async function onRequestGet() {
  let properties = []
  try {
    const res = await fetch(`${API_BASE}/properties`)
    if (res.ok) properties = await res.json()
  } catch (err) {
    // Si la API no responde, igual devolvemos el sitemap con las paginas
    // estaticas -- mejor un sitemap parcial que un 500.
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
