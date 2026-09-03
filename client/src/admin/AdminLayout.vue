<script setup>
import { useRouter, RouterLink, RouterView } from 'vue-router'
import { useAdminAuth } from './auth'

const router = useRouter()
const { logout } = useAdminAuth()

function handleLogout() {
  logout()
  router.push('/admin')
}
</script>

<template>
  <div class="min-h-screen bg-cream lg:flex">
    <aside class="flex flex-col justify-between bg-charcoal px-6 py-8 lg:w-64 lg:shrink-0">
      <div>
        <p class="font-serif text-lg tracking-[0.15em] text-cream">
          VENTAS <span class="text-gold-light">SABANA</span>
        </p>
        <p class="mt-1 font-sans text-[10px] tracking-widest text-cream/40">ADMINISTRACIÓN</p>

        <nav class="mt-10 flex flex-col gap-1 font-sans text-sm">
          <RouterLink
            to="/admin/propiedades"
            class="rounded-lg px-4 py-2.5 text-cream/70 transition-colors hover:bg-cream/5 hover:text-cream"
            active-class="!bg-gold-light/10 !text-gold-light"
          >
            Propiedades
          </RouterLink>
          <RouterLink
            to="/admin/leads"
            class="rounded-lg px-4 py-2.5 text-cream/70 transition-colors hover:bg-cream/5 hover:text-cream"
            active-class="!bg-gold-light/10 !text-gold-light"
          >
            Leads
          </RouterLink>
        </nav>
      </div>

      <button
        @click="handleLogout"
        class="rounded-lg px-4 py-2.5 text-left font-sans text-sm text-cream/50 transition-colors hover:bg-cream/5 hover:text-cream"
      >
        Cerrar sesión
      </button>
    </aside>

    <main class="min-w-0 flex-1 p-6 lg:p-10">
      <RouterView />
    </main>
  </div>
</template>
