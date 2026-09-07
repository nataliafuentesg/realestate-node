import { createRouter, createWebHistory } from 'vue-router'
import { useAdminAuth } from '../admin/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/Home.vue') },
    {
      path: '/propiedad/:id',
      name: 'property-detail',
      component: () => import('../views/PropertyDetail.vue'),
    },
    { path: '/admin', name: 'admin-login', component: () => import('../admin/AdminLogin.vue') },
    {
      path: '/admin',
      component: () => import('../admin/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: 'propiedades', name: 'admin-properties', component: () => import('../admin/AdminProperties.vue') },
        {
          path: 'propiedades/nueva',
          name: 'admin-property-new',
          component: () => import('../admin/AdminPropertyForm.vue'),
        },
        {
          path: 'propiedades/:id/editar',
          name: 'admin-property-edit',
          component: () => import('../admin/AdminPropertyForm.vue'),
        },
        { path: 'leads', name: 'admin-leads', component: () => import('../admin/AdminLeads.vue') },
        { path: 'whatsapp', name: 'admin-whatsapp', component: () => import('../admin/AdminWhatsApp.vue') },
        { path: 'analytics', name: 'admin-analytics', component: () => import('../admin/AdminAnalytics.vue') },
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !useAdminAuth().isAuthenticated()) {
    return { name: 'admin-login' }
  }
})

export default router
