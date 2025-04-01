// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import CultivateView from '@/views/CultivateView.vue'
import BattleView from '@/views/BattleView.vue'

const routes = [
  {
    path: '/',
    name: 'cultivate',
    component: CultivateView,
  },
  {
    path: '/battle',
    name: 'battle',
    component: BattleView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
