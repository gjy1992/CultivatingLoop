// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import CultivateView from '@/views/CultivateView.vue'
import BattleView from '@/views/BattleView.vue'
import DebugView from '@/views/DebugView.vue'
import ActionsView from '@/views/ActionsView.vue'
import MapView from '@/views/MapView.vue'

const routes = [
  {
    path: '/',
    name: 'cultivate',
    component: CultivateView,
  },
  {
    path: '/action',
    name: 'action',
    component: ActionsView,
  },
  {
    path: '/map',
    name: 'map',
    component: MapView,
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
