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
  <div class="mp-dotgrid min-h-screen bg-mp-bg lg:flex">
    <aside class="flex flex-col justify-between border-r border-mp-border/10 bg-mp-surface/60 px-5 py-8 backdrop-blur lg:w-64 lg:shrink-0">
      <div>
        <div class="flex items-center gap-2.5 px-1">
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mp-primary font-[family-name:var(--font-mp-heading)] text-sm font-bold text-white"
          >
            M
          </span>
          <div>
            <p class="font-[family-name:var(--font-mp-heading)] text-base font-medium leading-tight text-mp-fg">
              Marca<span class="text-mp-primary-hover">pro</span>
            </p>
            <p class="font-[family-name:var(--font-mp-body)] text-[10px] tracking-widest text-mp-muted">
              VENTAS SABANA · ADMIN
            </p>
          </div>
        </div>

        <nav class="mt-10 flex flex-col gap-5 font-[family-name:var(--font-mp-body)] text-sm">
          <div v-for="(group, i) in navGroups" :key="i">
            <p
              v-if="group.label"
              class="mb-1.5 px-4 text-[10px] font-medium tracking-widest text-mp-muted/60"
            >
              {{ group.label.toUpperCase() }}
            </p>
            <div class="flex flex-col gap-0.5">
              <RouterLink
                v-for="item in group.items"
                :key="item.to"
                :to="item.to"
                class="flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-mp-muted transition-colors hover:bg-white/5 hover:text-mp-fg"
                active-class="!bg-mp-primary/15 !text-mp-primary-hover"
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
        class="flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-left font-[family-name:var(--font-mp-body)] text-sm text-mp-muted transition-colors hover:bg-white/5 hover:text-mp-fg"
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
