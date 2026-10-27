// Hace que el panel de admin se pueda instalar como app ("Agregar a pantalla
// de inicio"). Las etiquetas se agregan solo al entrar a /admin para que el
// sitio publico no ofrezca instalar nada. En iPhone las notificaciones push
// solo funcionan si el panel esta instalado asi.
export function installAdminPwaTags() {
  if (document.querySelector('link[rel="manifest"]')) return

  const add = (tag, attrs) => {
    const el = document.createElement(tag)
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value))
    document.head.appendChild(el)
  }

  add('link', { rel: 'manifest', href: '/admin-manifest.webmanifest' })
  add('link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' })
  add('meta', { name: 'theme-color', content: '#0a0a0c' })
  add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' })
  add('meta', { name: 'mobile-web-app-capable', content: 'yes' })
  add('meta', { name: 'apple-mobile-web-app-title', content: 'Marcapro' })
  add('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' })
}
