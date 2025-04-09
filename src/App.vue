<template>
  <div id="app">
    <el-header class="head">
      <!-- 动态环境状态栏 -->
      【{{ currentTime }}·{{ lunarPhase }}】灵气浓度
      {{ player.qiSystem.concentrationFactor }}

      <el-tabs v-model="activeTab" type="card" class="action-tabs" @tab-click="onTabClick">
        <el-tab-pane
          v-for="(action, index) in mainActions"
          :key="index"
          :label="action.label"
          :name="action.path || index.toString()"
          :disabled="isActionDisabled(action)"
        />
      </el-tabs>

      <el-dropdown trigger="click">
        <span class="system-menu"> ⚙️ 系统设置 </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="toggleMenu('archive')">📂 轮回日志</el-dropdown-item>
            <el-dropdown-item divided @click="player.Reset()">🔁 重置轮回</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
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

        <el-card v-if="resourceList.length > 0" title="资源" class="character-resource" hoverable>
          <h2>资源</h2>
          <el-divider border-style="dashed" />
          <div v-for="(item, index) in resourceList" :key="index" class="user-resource">
            {{ item.icon }} {{ item.name }} {{ item.value }}
          </div>
        </el-card>
      </el-aside>

      <el-divider direction="vertical" border-style="dashed" />
      <!-- 主操作面板 -->
      <router-view class="game-display" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { useAppStore } from '@/stores/app'
import { useUserStore, combatMgr } from '@/stores/user'
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

    // 响应式菜单状态
    const appStore = useAppStore()
    console.log(appStore.activeTab)
    const activeTab = appStore.activeTab // 默认激活第一个可用标签

    const onTabClick = (tab: any) => {
      const clickedAction = mainActions.find(
        (action) => (action.path || mainActions.indexOf(action).toString()) === tab.paneName,
      )
      if (clickedAction && !isActionDisabled(clickedAction)) {
        handleAction(clickedAction)
      }
    }

    const handleAction = (action: GameAction) => {
      if (action.path && !isActionDisabled(action)) {
        router.push(action.path)
        appStore.activeTab = action.path
      }
    }

    const isActionDisabled = (action: GameAction) => {
      return action.require && !action.require()
    }

    // 响应式菜单状态

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

    const resourceList = computed(() => {
      const { resources } = player
      const warehouseLevel = resources.WarehouseLevel

      return [
        {
          icon: '🪙',
          name: '铜币',
          value: Math.round(resources.money),
          visible: resources.money > 0,
        },
        {
          icon: '💎',
          name: '灵石',
          value: resources.magicStone,
          visible: resources.magicStone > 0,
        },
        {
          icon: '🌿',
          name: '药草',
          value: `${resources.minHerbs}/${warehouseLevel * 1000}`,
          visible: resources.minHerbs > 0,
        },
        {
          icon: '🪻',
          name: '灵草',
          value: `${resources.midHerbs}/${warehouseLevel * 100}`,
          visible: resources.midHerbs > 0,
        },
        {
          icon: '🪷',
          name: '仙草',
          value: `${resources.maxHerbs}/${warehouseLevel * 10}`,
          visible: resources.maxHerbs > 0,
        },
      ].filter((item) => item.visible)
    })

    return {
      currentTime,
      lunarPhase,
      player,
      mainActions,
      realmProgress,
      customColors,
      activeTab,
      onTabClick,
      handleAction,
      isActionDisabled,
      toggleMenu,
      resourceList,
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

.system-menu {
  color: #f0f0f0; /* 改成你想要的颜色，比如白色 */
  cursor: pointer;
  font-weight: bold;
}

.game-zone {
  display: flex;
  height: calc(100vh - 40px);
  width: 100%;
  overflow: hidden;
  background-color: #616161;
}

.game-container {
  margin: 20px;
  border-radius: 15px;
  position: sticky;
  flex: 0 0 20%;
  height: calc(100vh - 40px);
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  background: #0070c0;
  z-index: 1000;
  color: #f0f0f0;
}

.action-tabs {
  margin-top: 6px;
  margin-bottom: 6px;
  background-color: transparent;
  /* 让整体无底色，与蓝背景融合 */
}

.head ::v-deep(.el-tabs__header) {
  margin: 0;
  padding: 0;
  height: auto;
  line-height: normal;
}

.head ::v-deep(.el-tabs__nav) {
  align-items: center;
}

.action-tabs ::v-deep(.el-tabs__item) {
  color: #e3f2fd;
  font-weight: bold;
  transition:
    background-color 0.3s,
    color 0.3s;
  padding: 8px 12px;
}

.action-tabs ::v-deep(.el-tabs__item.is-active) {
  background-color: #f0f0f0;
  color: #0070c0;
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
