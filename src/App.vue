<template>
  <div id="app">
    <el-header class="head">
      <!-- 动态环境状态栏 -->
      【{{ currentTime }}·{{ lunarPhase }}】灵气浓度
      {{ player.qiSystem.concentrationFactor }}
    </el-header>
    <!-- 主界面容器 -->
    <div class="game-zone">
      <el-aside class="game-container">
        <!-- 角色状态面板 -->
        <el-card title="信息" class="character-panel" hoverable>
          <!-- 头像和姓名 -->
          <div class="user-info">
            <el-avatar :size="25" />
            {{ player.name }}
          </div>

          <br />

          <div class="realms-status">
            <p>{{ player.majorRealmsName() }}境 {{ player.minorRealmsName() }}</p>
            <el-progress
              :show-text="false"
              :stroke-width="20"
              striped
              striped-flow
              :duration="10"
              :percentage="realmProgress"
              :color="customColors"
            ></el-progress>
          </div>
        </el-card>

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
      </el-aside>
      <router-view class="game-display" />
    </div>
    <!-- 系统功能入口 -->
    <el-footer class="foot">
      <span @click="toggleMenu('settings')">⚙️ 系统设置</span>
      <span @click="toggleMenu('archive')">📂 轮回日志</span>
      <el-button @click="player.Reset()">重置</el-button>
    </el-footer>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { useAppStore } from '@/stores/app'
import { useUserStore, combatMgr } from '@/stores/user'
import { ElHeader, ElFooter, ElAside, ElAvatar, ElButton, ElProgress, ElCard } from 'element-plus'

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

    const player = useUserStore()

    let currentTime = ref(dayjs().format('HH:mm'))
    let lunarPhase = '新月' // 月相状态
    // 这里可以添加月相算法逻辑

    // 主操作列表[4,9](@ref)
    const mainActions: GameAction[] = [
      { label: '闭关修炼', path: '/' },
      { label: '日常修行', path: '/action' },
      { label: '秘境探索', path: '/battle' },
      { label: '炼丹制药', path: '/alchemy', require: () => false },
      { label: '功法参悟', path: '/comprehend', require: () => false },
      //调试
      { label: '调试', path: '/debug' },
    ]

    const customColors = [
      { color: '#f56c6c', percentage: 20 },
      { color: '#e6a23c', percentage: 40 },
      { color: '#5cb87a', percentage: 60 },
      { color: '#1989fa', percentage: 80 },
      { color: '#6f7ad3', percentage: 100 },
    ]

    // 计算属性[2,5](@ref)
    const realmProgress = computed(() => {
      // 确保除数不为零，避免出现 NaN
      if (player.realmStatus.requiredQi === 0) {
        return 0
      }
      return Math.round((player.qiSystem.currentQi / player.realmStatus.requiredQi) * 100)
    })

    // 生命周期钩子[6](@ref)
    onMounted(() => {
      player.timer = setInterval(updateEnvironment, player.updateInterval)
      combatMgr.battleTimer = setInterval(() => {
        combatMgr.battleUpdate()
      }, combatMgr.battleInterval)
    })

    onUnmounted(() => {
      clearInterval(player.timer)
      clearInterval(combatMgr.battleTimer)
      combatMgr.stopBattle()
    })

    // 方法定义
    const updateEnvironment = () => {
      currentTime.value = dayjs().format('HH:mm')
      player.updateTick()
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
      customColors,
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
  flex-direction: column;
}

.game-zone {
  display: flex;
  height: calc(100vh - 80px);
  width: 100%;
  overflow: hidden;
  background-color: #616161;
}

.game-container {
  border-radius: 25px;
  position: sticky;
  flex: 0 0 20%;
  height: calc(100vh - 80px);
  font-family: 'Consolas', monospace;
  background-color: #f0f0f0;
}

.game-display {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
}

router-view {
  background-color: #f0f0f0;
  flex: 1;
}

.head {
  height: 40px;
  background: #0070c0;
  z-index: 1000;
  color: #f0f0f0;
}

.foot {
  height: 40px;
  width: 100%;
  background: #0070c0;
  justify-content: space-around;
}

.game-container {
  font-family: 'Consolas', monospace;
  margin: 0;
  padding: 40px 40px 40px 40px;
  width: 100%;
  min-width: auto;
  max-width: none;
}

.character-panel {
  border: 1px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
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
