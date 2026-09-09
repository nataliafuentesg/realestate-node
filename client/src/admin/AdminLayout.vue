<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute, RouterLink, RouterView } from 'vue-router'
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  MessageCircle,
  Camera,
  Send,
  BarChart3,
  LogOut,
  Menu,
  X,
} from '@lucide/vue'
import { useAdminAuth } from './auth'
import { useUnreadCounts, countUnread } from './useUnreadCounts'

const router = useRouter()
const route = useRoute()
const { logout } = useAdminAuth()
const { whatsappConversations, instagramConversations } = useUnreadCounts()

const waUnread = computed(() => countUnread(whatsappConversations.value))
const igUnread = computed(() => countUnread(instagramConversations.value))

function handleLogout() {
  logout()
  router.push('/admin')
}

const mobileMenuOpen = ref(false)
watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false
})

const navGroups = computed(() => [
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
      { to: '/admin/whatsapp', label: 'WhatsApp', icon: MessageCircle, badge: waUnread.value },
      { to: '/admin/instagram', label: 'Instagram', icon: Camera },
      { to: '/admin/instagram/dms', label: 'IG DMs', icon: Send, badge: igUnread.value },
      { to: '/admin/analytics', label: 'Analítica', icon: BarChart3 },
    ],
  },
])
</script>

<template>
  <div class="mp-dotgrid min-h-screen bg-mp-bg lg:flex">
    <!-- Barra superior movil -->
    <header class="flex items-center justify-between border-b border-mp-border/10 bg-mp-surface/60 px-4 py-3 backdrop-blur lg:hidden">
      <div class="flex items-center gap-2">
        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-mp-primary font-[family-name:var(--font-mp-heading)] text-xs font-bold text-white">
          M
        </span>
        <p class="font-[family-name:var(--font-mp-heading)] text-sm font-medium text-mp-fg">
          Marca<span class="text-mp-primary-hover">pro</span>
        </p>
      </div>
      <button
        @click="mobileMenuOpen = true"
        class="relative flex h-9 w-9 items-center justify-center rounded-lg text-mp-fg hover:bg-white/5"
      >
        <Menu :size="20" :stroke-width="1.75" />
        <span
          v-if="waUnread + igUnread > 0"
          class="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-mp-primary text-[9px] font-medium text-white"
        >
          {{ waUnread + igUnread }}
        </span>
      </button>
    </header>

    <!-- Fondo oscuro al abrir el menu en movil -->
    <div
      v-if="mobileMenuOpen"
      @click="mobileMenuOpen = false"
      class="fixed inset-0 z-40 bg-black/60 lg:hidden"
    ></div>

    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col justify-between border-r border-mp-border/10 bg-mp-surface px-5 py-8 transition-transform duration-200 lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:translate-x-0 lg:bg-mp-surface/60 lg:backdrop-blur"
      :class="mobileMenuOpen ? 'translate-x-0' : ''"
    >
      <div>
        <div class="flex items-center justify-between px-1">
          <div class="flex items-center gap-2.5">
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
          <button
            @click="mobileMenuOpen = false"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-mp-muted hover:bg-white/5 hover:text-mp-fg lg:hidden"
          >
            <X :size="18" :stroke-width="1.75" />
          </button>
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
                <span class="flex-1">{{ item.label }}</span>
                <span
                  v-if="item.badge"
                  class="flex h-5 min-w-5 items-center justify-center rounded-full bg-mp-primary px-1.5 text-[10px] font-medium text-white"
                >
                  {{ item.badge }}
                </span>
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

    <main class="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">
      <RouterView />
    </main>
  </div>
</template>
