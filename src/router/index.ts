// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import CultivateView from '@/views/CultivateView.vue'
import BattleView from '@/views/BattleView.vue'
import DebugView from '@/views/DebugView.vue'

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
  //调试
  {
    path: '/debug',
    name: 'debug',
    component: DebugView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
