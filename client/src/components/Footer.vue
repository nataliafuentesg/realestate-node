<template>
  <footer id="contact" class="relative z-10 bg-charcoal px-6 py-16 text-cream">
    <div class="mx-auto max-w-7xl">
      <div class="grid gap-10 sm:grid-cols-3">
        <div>
          <p class="font-serif text-xl tracking-[0.15em]">
            MERIDIAN <span class="text-gold-light">ESTATES</span>
          </p>
          <p class="mt-4 max-w-xs font-sans text-sm text-cream/60">
            Residencias exclusivas seleccionadas para clientes exigentes.
          </p>
        </div>

        <div>
          <p class="font-sans text-xs tracking-widest text-gold-light">CONTACTO</p>
          <p class="mt-4 font-sans text-sm text-cream/60">contacto@meridianestates.com</p>
          <p class="font-sans text-sm text-cream/60">+57 300 000 0000</p>
        </div>

        <div>
          <p class="font-sans text-xs tracking-widest text-gold-light">PROYECTO</p>
          <p class="mt-4 max-w-xs font-sans text-sm text-cream/60">
            Demo de portafolio construida con Vue 3, Express, MongoDB y JWT.
          </p>
        </div>
      </div>

      <div class="mt-12 border-t border-cream/10 pt-6 font-sans text-xs text-cream/40">
        © {{ new Date().getFullYear() }} Meridian Estates. Proyecto demo de portafolio.
      </div>
    </div>
  </footer>
</template>
