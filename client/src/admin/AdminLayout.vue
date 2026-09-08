<script setup>
import { useRouter, RouterLink, RouterView } from 'vue-router'
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  MessageCircle,
  Camera,
  Send,
  BarChart3,
  LogOut,
} from '@lucide/vue'
import { useAdminAuth } from './auth'

const router = useRouter()
const { logout } = useAdminAuth()

function handleLogout() {
  logout()
  router.push('/admin')
}

const navGroups = [
  {
    label: null,
    items: [{ to: '/admin/panel', label: 'Panel', icon: LayoutDashboard }],
  },
  {
    label: 'Inmobiliaria',
    items: [
      { to: '/admin/propiedades', label: 'Propiedades', icon: Building2 },
      { to: '/admin/leads', label: 'Leads', icon: ClipboardList },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { to: '/admin/whatsapp', label: 'WhatsApp', icon: MessageCircle },
      { to: '/admin/instagram', label: 'Instagram', icon: Camera },
      { to: '/admin/instagram/dms', label: 'IG DMs', icon: Send },
      { to: '/admin/analytics', label: 'Analítica', icon: BarChart3 },
    ],
  },
]
</script>

<template>
  <div class="min-h-screen bg-cream lg:flex">
    <aside class="flex flex-col justify-between bg-charcoal px-5 py-8 lg:w-64 lg:shrink-0">
      <div>
        <div class="flex items-center gap-2.5 px-1">
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold font-serif text-sm font-bold text-cream"
          >
            M
          </span>
          <div>
            <p class="font-serif text-base leading-tight tracking-[0.1em] text-cream">
              VENTAS <span class="text-gold-light">SABANA</span>
            </p>
            <p class="font-sans text-[10px] tracking-widest text-cream/40">ADMINISTRACIÓN</p>
          </div>
        </div>

        <nav class="mt-10 flex flex-col gap-5 font-sans text-sm">
          <div v-for="(group, i) in navGroups" :key="i">
            <p
              v-if="group.label"
              class="mb-1.5 px-4 font-sans text-[10px] font-medium tracking-widest text-cream/30"
            >
              {{ group.label.toUpperCase() }}
            </p>
            <div class="flex flex-col gap-0.5">
              <RouterLink
                v-for="item in group.items"
                :key="item.to"
                :to="item.to"
                class="flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-cream/70 transition-colors hover:bg-cream/5 hover:text-cream"
                active-class="!bg-gold-light/10 !text-gold-light"
              >
                <component :is="item.icon" :size="16" :stroke-width="1.75" class="shrink-0" />
                {{ item.label }}
              </RouterLink>
            </div>
          </div>
        </nav>
      </div>

      <button
        @click="handleLogout"
        class="flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-left font-sans text-sm text-cream/50 transition-colors hover:bg-cream/5 hover:text-cream"
      >
        <LogOut :size="16" :stroke-width="1.75" />
        Cerrar sesión
      </button>
    </aside>

    <main class="min-w-0 flex-1 p-6 lg:p-10">
      <RouterView />
    </main>
  </div>
</template>
