import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import PropertyDetail from '../views/PropertyDetail.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/propiedad/:id', name: 'property-detail', component: PropertyDetail },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
