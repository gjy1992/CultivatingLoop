<template>
  <div id="app">
    <!-- 主界面容器 -->
    <div class="game-container">
      <!-- 动态环境状态栏 -->
      <div class="status-bar">
        【{{ currentTime }}·{{ lunarPhase }}】灵气浓度
        {{ player.qiSystem.concentrationFactor }}
      </div>

      <!-- 角色状态面板 -->
      <section class="character-panel">
        <h2>≡ {{ player.name }} 修炼日志 ≡</h2>
        <div class="progress">
          境界：[{{ realmProgress }}]
          <br />
          {{ player.majorRealmsName() }}境 {{ player.minorRealmsName() }}
        </div>
        <div class="attributes">
          <p>
            气血：{{ player.combat.health.current }}/{{ player.combat.health.max }}
            <br />
            真气：{{ player.combat.mp.current }}/{{ player.combat.mp.max }}
          </p>
        </div>
      </section>

      <!-- 主操作面板 -->
      <nav class="action-menu">
        <div
          v-for="(action, index) in mainActions"
          :key="index"
          class="menu-item"
          @click="handleAction(action)"
          :class="{ disabled: isActionDisabled(action) }"
        >
          ▶ {{ action.label }}
        </div>
      </nav>

      <!-- 系统功能入口 -->
      <div class="system-menu">
        <span @click="toggleMenu('settings')">⚙️ 系统设置</span>
        <span @click="toggleMenu('archive')">📂 轮回日志</span>
        <button @click="player.Reset()">重置</button>
      </div>
    </div>
    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

// 类型定义
type GameAction = {
  label: string
  path?: string
  require?: () => boolean
  cost?: number
}

// 菜单状态类型定义
type MenuType = 'settings' | 'archive' | 'none'

export default defineComponent({
  name: 'HomeView',

  setup() {
    const router = useRouter()
    const updateInterval = 1000 * 1 // 每秒钟更新环境状态

    const player = useUserStore()

    let currentTime = dayjs().format('HH:mm')
    let lunarPhase = '新月' // 月相状态
    // 这里可以添加月相算法逻辑

    // 主操作列表[4,9](@ref)
    const mainActions: GameAction[] = [
      { label: '闭关修炼', path: '/' },
      { label: '秘境探索', path: '/battle' },
      { label: '炼丹制药', path: '/alchemy', require: () => false },
      { label: '功法参悟', path: '/comprehend', require: () => false },
    ]

    // 计算属性[2,5](@ref)
    const realmProgress = computed(() => {
      const progress = player.realmStatus.minorRealm
      return '■'.repeat(progress) + '□'.repeat(9 - progress)
    })

    // 生命周期钩子[6](@ref)
    let timer: number
    onMounted(() => {
      timer = setInterval(updateEnvironment, updateInterval)
      player.startUpdate()
    })

    onUnmounted(() => {
      clearInterval(timer)
    })

    // 方法定义
    const updateEnvironment = () => {
      currentTime = dayjs().format('HH:mm')
    }

    const handleAction = (action: GameAction) => {
      if (action.path && !isActionDisabled(action)) {
        router.push(action.path)
      }
    }

    const isActionDisabled = (action: GameAction) => {
      return action.require && !action.require()
    }

    // 响应式菜单状态
    const appStore = useAppStore()
    const activeMenu = ref<MenuType>('none')

    const toggleMenu = (menuType: MenuType) => {
      if (activeMenu.value === menuType) {
        activeMenu.value = 'none'
        appStore.closeSidebar() // 调用网页4中的Pinia action
      } else {
        activeMenu.value = menuType
        appStore.toggleSidebar() // 调用网页4中的Pinia action
      }
      // Add your menu toggle logic here
    }

    return {
      currentTime,
      lunarPhase,
      player,
      mainActions,
      realmProgress,
      handleAction,
      isActionDisabled,
      toggleMenu,
    }
  },
})
</script>

<style scoped>
#app {
  width: 100vw;
  display: flex;
  flex-direction: row;
}
.game-container {
  font-family: 'Consolas', monospace;
  margin: 0;
  padding: 5px;
  width: 300px;
  min-width: 300px;
  max-width: 300px;
}

.status-bar {
  color: #7cb342;
  margin-bottom: 1rem;
}

.character-panel {
  border: 1px dashed #616161;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.menu-item {
  cursor: pointer;
  padding: 8px;
  transition: background 0.3s;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.disabled {
  color: #616161;
  cursor: not-allowed;
}
</style>
