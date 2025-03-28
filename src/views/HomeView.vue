// HomeView.vue
<template>
  <!-- 主界面容器 -->
  <div class="game-container">
    <!-- 动态环境状态栏 -->
    <div class="status-bar">
      【{{ gameState.currentTime }}·{{ gameState.lunarPhase }}】灵气浓度 {{ gameState.spiritualLevel }} 五行：{{ gameState.activeElement }}
    </div>

    <!-- 角色状态面板 -->
    <section class="character-panel">
      <h2>≡ {{ player.name }} 修炼日志 ≡</h2>
      <div class="progress">
        境界：[{{ realmProgress }}] {{ player.realm }}境{{ player.stage }}重
      </div>
      <div class="attributes">
        <p>气血：{{ player.hp }}/{{ player.maxHp }} 真气：{{ player.mp }}/{{ player.maxMp }}</p>
        <p>修为：{{ player.cultivation }}  灵石：{{ player.spiritStone }}</p>
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
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { useAppStore } from '../stores/app'

// 类型定义
type GameAction = {
  label: string
  path?: string
  require?: string
  cost?: number
}

// 菜单状态类型定义
type MenuType = 'settings' | 'archive' | 'none'

export default defineComponent({
  name: 'HomeView',
  
  setup() {
    const router = useRouter()
    const updateInterval = 1000 * 60 // 每分钟更新环境状态

    // 响应式游戏状态[2,5](@ref)
    const gameState = reactive({
      currentTime: dayjs().format('HH:mm'),
      lunarPhase: '月缺',
      spiritualLevel: '■■■□□',
      activeElement: '金→木'
    })

    // 玩家状态[6](@ref)
    const player = reactive({
      name: '无名修士',
      realm: '筑基',
      stage: 3,
      hp: 4200,
      maxHp: 5000,
      mp: 380,
      maxMp: 600,
      cultivation: 8920,
      spiritStone: 150
    })

    // 主操作列表[4,9](@ref)
    const mainActions: GameAction[] = [
      { label: '闭关修炼', path: '/cultivate', cost: 50 },
      { label: '秘境探索', path: '/adventure', require: '金丹境' },
      { label: '炼丹制药', path: '/alchemy' },
      { label: '功法参悟', path: '/comprehend' }
    ]

    // 计算属性[2,5](@ref)
    const realmProgress = computed(() => {
      const progress = Math.round((player.stage / 9) * 100)
      return '■'.repeat(progress/10) + '□'.repeat(10 - progress/10)
    })

    // 生命周期钩子[6](@ref)
    let timer: number
    onMounted(() => {
      timer = setInterval(updateEnvironment, updateInterval)
    })

    onUnmounted(() => {
      clearInterval(timer)
    })

    // 方法定义
    const updateEnvironment = () => {
      gameState.currentTime = dayjs().format('HH:mm')
      // 此处可添加月相算法逻辑
    }

    const handleAction = (action: GameAction) => {
      if (action.path && !isActionDisabled(action)) {
        router.push(action.path)
      }
    }

    const isActionDisabled = (action: GameAction) => {
      return action.require && !player.realm.includes(action.require)
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
      gameState,
      player,
      mainActions,
      realmProgress,
      handleAction,
      isActionDisabled,
      toggleMenu
    }
  }
})
</script>

<style scoped>
.game-container {
  font-family: 'Consolas', monospace;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
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
  background: rgba(255,255,255,0.1);
}

.disabled {
  color: #616161;
  cursor: not-allowed;
}
</style>