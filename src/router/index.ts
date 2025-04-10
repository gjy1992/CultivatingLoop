// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import CultivateView from '@/views/CultivateView.vue'
import BattleView from '@/views/BattleView.vue'
import DebugView from '@/views/DebugView.vue'
import ActionsView from '@/views/ActionsView.vue'
import MapView from '@/views/MapView.vue'
import 花园 from '@/views/花园.vue'
import Shop from '@/views/Shop.vue'
import component from 'element-plus/es/components/tree-select/src/tree-select-option.mjs'

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
    path: '/garden',
    name: '花园',
    component: 花园,
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
  {
    path: '/shop',
    name: 'shop',
    component: Shop,
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
