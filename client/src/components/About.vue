<template>
  <section id="about" class="relative z-10 bg-cream px-6 py-24 lg:px-12">
    <div class="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2">
      <div v-reveal>
        <p class="font-sans text-xs tracking-[0.4em] text-gold">SOBRE NOSOTROS</p>
        <h2 class="mt-4 font-serif text-3xl text-charcoal lg:text-4xl">Ventas Sabana</h2>
        <p class="mt-6 max-w-lg font-sans text-base leading-relaxed text-charcoal/60">
          Somos la división inmobiliaria de <strong class="text-charcoal">Marcapro</strong>, agencia de marketing
          y publicidad. Eso cambia cómo vendemos: cada propiedad se promociona con las mismas herramientas que
          usamos para impulsar marcas — fotografía cuidada, pauta segmentada en redes sociales y una estrategia
          de difusión pensada para llegar al comprador correcto, no solo a publicar y esperar.
        </p>

        <a
          href="https://marcapro.co"
          target="_blank"
          rel="noopener"
          data-cursor-hover
          class="mt-8 inline-flex items-center gap-3 border-b border-charcoal/30 pb-1 font-sans text-xs tracking-widest text-charcoal transition-colors hover:border-gold hover:text-gold"
        >
          CONOCE MARCAPRO
          <span class="transition-transform group-hover:translate-x-1">→</span>
        </a>
      </div>

      <div v-reveal class="grid grid-cols-2 gap-6">
        <div class="rounded-2xl border border-charcoal/10 p-6">
          <p class="font-serif text-3xl text-gold">360°</p>
          <p class="mt-2 font-sans text-sm text-charcoal/60">Fotografía, pauta y estrategia digital para cada propiedad.</p>
        </div>
        <div class="rounded-2xl border border-charcoal/10 p-6">
          <p class="font-serif text-3xl text-gold">Redes</p>
          <p class="mt-2 font-sans text-sm text-charcoal/60">Campañas segmentadas en Instagram y Facebook.</p>
        </div>
        <div class="col-span-2 rounded-2xl border border-charcoal/10 p-6">
          <p class="font-serif text-3xl text-gold">Un solo equipo</p>
          <p class="mt-2 font-sans text-sm text-charcoal/60">
            Marketing y bienes raíces bajo un mismo techo — sin intermediarios entre tu propiedad y el comprador.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
