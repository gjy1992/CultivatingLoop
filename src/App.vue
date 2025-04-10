<template>
  <div id="app">
    <el-header class="head">
      <!-- 动态环境状态栏 -->
      【{{ currentTime }}·{{ lunarPhase }}】灵气浓度
      {{ player.qiSystem.concentrationFactor }}

      <el-tabs v-model="activeTab" type="card" class="action-tabs" @tab-click="onTabClick">
        <el-tab-pane v-for="(action, index) in mainActions" :key="index" :label="action.label"
          :name="action.path || index.toString()" :disabled="isActionDisabled(action)" />
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
        <el-card title="信息" class="card-type" hoverable>
          <!-- 头像和姓名 -->
          <div class="character-head">
            <el-avatar :size="25" />
            {{ player.name }}
          </div>
          <br />
          <div class="realms-status">
            <p class="card-type">{{ player.majorRealmsName() }}境 {{ player.minorRealmsName() }}</p>
            <el-progress :show-text="false" :stroke-width="20" striped striped-flow :duration="10"
              :percentage="realmProgress" :color="customColors"></el-progress>
          </div>
        </el-card>

        <el-card v-if="player.processingActions.length > 0" title="行动" class="card-type" hoverable>
          <div class="character-head">行动</div>
          <el-divider class="custom-divider"  border-style="dashed"/>
          <div v-for="(action, index) in player.processingActions" :key="index" class="character-info">
            {{ action }}中...
          </div>
        </el-card>

        <el-card v-if="resourceList.length > 0" title="资源" class="card-type" hoverable>
          <div class="character-head">资源</div>
          <el-divider class="custom-divider"  border-style="dashed"/>
          <div v-for="(item, index) in resourceList" :key="index" class="character-info">
            {{ item.icon }} {{ item.name }} {{ item.value }}
          </div>
        </el-card>



        <el-button class="bag-button" @click="showBag = true">🎒 背包</el-button>


      </el-aside>

      <Backpack :visible="showBag" @close="showBag = false" />

      <el-divider direction="vertical" />
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
import type { UserStoreType } from '@/stores/user'
import Backpack from '@/views/Backpack.vue'

// 类型定义
type GameAction = {
  label: string
  path?: string
  show?: (user: UserStoreType) => boolean
  enable?: (user: UserStoreType) => boolean
  cost?: number
}

// 菜单状态类型定义
type MenuType = 'settings' | 'archive' | 'none'

export default defineComponent({
  name: 'HomeView',
  components: {
    Backpack,
  },

  setup() {
    const router = useRouter()

    const player = useUserStore()

    combatMgr.initPlayer(player)

    let currentTime = ref(dayjs().format('HH:mm'))
    let lunarPhase = '新月' // 月相状态
    // 这里可以添加月相算法逻辑

    // 主操作列表[4,9](@ref)
    const mainActions: GameAction[] = reactive([
      { label: '闭关修炼', path: '/' },
      { label: '日常修行', path: '/action' },
      { label: '花园', path: '/garden', show: (user) => user.realmStatus.majorRealm > 1 },
      { label: '秘境探索', path: '/map' },
      { label: '炼丹制药', path: '/alchemy', enable: () => false },
      { label: '功法参悟', path: '/comprehend', enable: () => false },
      { label: '商店', path: '/shop' },
      //调试
      { label: '调试', path: '/debug' },
    ])

    let showBag = ref(false)


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

      // 判断玩家名字是否为空
      if (player.name === null || player.name === '') {
        import('element-plus').then(({ ElMessageBox }) => {
          ElMessageBox.prompt('请输入您的名字', '起名', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            inputValidator: (value) => {
              return value.trim() !== '' ? true : '名字不能为空'
            },
          })
            .then(({ value }) => {
              // 用户点击确定，设置玩家名字
              player.name = value
            })
            .catch(() => {
              // 用户点击取消，可根据需求处理
              console.log('用户取消了起名操作')
            })
        })
      }
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

    const isActionShown = (action: GameAction) => {
      return !action.show || action.show(player)
    }

    const isActionDisabled = (action: GameAction) => {
      return action.enable && !action.enable(player)
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
          name: '下品灵石',
          value: resources.magicStoneLow,
          visible: resources.magicStoneLow > 0,
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
      showBag,
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
  color: #f0f0f0;
  /* 改成你想要的颜色，比如白色 */
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

.card-type {
  border-radius: 12px;
  border: 1px;
  padding: 1rem;
  margin-bottom: 0.5rem;
}

.character-info {
  /* 将 text-size 替换为 font-size */
  font-size: 15px;
  margin-bottom: 0.5rem;
  margin-bottom: 0.5rem;
}

.character-head {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.custom-divider {
  height: 1px !important;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bag-button {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  z-index: 1000;
  border: none;
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

.backpack-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 99999 !important;
  /* 强制比任何 Element UI 层都高 */
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
}
</style>
