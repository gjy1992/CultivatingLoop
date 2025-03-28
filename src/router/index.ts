// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import CultivateView from '@/views/CultivateView.vue'
import HomeView from '@/views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView  // 关键配置项[1](@ref)
  },
  {
    path: '/cultivate',
    name: 'cultivate',
    component: CultivateView,
    meta: {
      requiresSpirit: 1000  // 修炼所需灵气值
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})


export default router