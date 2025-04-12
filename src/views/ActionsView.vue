<template>
  <div class="action-page">
    <div class="card-section">
      <div class="card-container">
        <el-card
          v-for="(state, key) in unlockedActions"
          :key="key"
          class="action-card"
          :class="{ active: currentCategory === key }"
          @click="selectCategory(key as string)"
          shadow="hover"
        >
          <div class="card-head">
            <h3 style="text-align: center">{{ key }}</h3>
            <h5 style="text-align: center">{{ state.description }}</h5>
            <el-divider class="custom-divider" border-style="dashed" />
          </div>

          <div class="card-content">
            <p class="sub-action">{{ state.currentSubAction?.name || '无' }}</p>
            <p class="description">{{ state.currentSubAction?.description || '无描述' }}</p>
          </div>

          <div class="card-foot">
            <el-progress
              class="card-progress"
              :percentage="getProgressPercent(key as string)"
              :text-inside="true"
              :stroke-width="18"
              status="success"
            />
            <p class="description" style="text-align: center">
              {{ state.autoUnlocked ? '当前可自动进行' : '当前不可自动进行' }}
            </p>
          </div>
        </el-card>
      </div>
    </div>

    <div class="button-section">
      <el-button type="primary" @click="handleAction" class="button-do">
        <div>执行行动(空格)</div>
      </el-button>
    </div>

    <div class="log-section">
      <div class="log-content">
        <p v-for="(log, index) in logStore.logs" :key="index">
          {{ log }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useLogStore } from '@/stores/log'

const userStore = useUserStore()
const logStore = useLogStore()
const route = useRoute()

// 当前选中的行动分类
const currentCategory = computed(() => userStore.currentActionCategory)

// 所有已解锁的行动
const unlockedActions = computed(() =>
  Object.fromEntries(
    Object.entries(userStore.actionStateMap).filter(([_, state]) => state.unlocked),
  ),
)

// 当前进度百分比（默认为最大10）
const getProgressPercent = (key: string) => {
  const current = userStore.tickProgressMap[key] ?? 0
  const max = userStore.actionStateMap[key]?.progress ?? 10
  return Math.min(100, Math.floor((current / max) * 100))
}

// 选择某个主行动
const selectCategory = (key: string) => {
  userStore.currentActionCategory = key
}

// 执行行动
const handleAction = () => {
  userStore.handleAction()
}

// 监听空格键触发行动（仅当前路由是 action 页时生效）
const handleKeyPress = (e: KeyboardEvent) => {
  if (route.name === 'action') {
    if (e.code === 'Space') {
      e.preventDefault()
      handleAction()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyPress)
})
</script>

<style scoped>
.action-page {
  background-color: #f0f0f0;
  border-radius: 15px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.card-section {
  flex: 5;
  padding: 10px;
  overflow: hidden;
}

.card-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
}

.action-card {
  flex: 0 0 calc(19%);
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: all 0.3s ease;
}
::v-deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.action-card.active {
  background-color: #f0f9ff;
}

.card-head {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-content {
  flex: 2;
  display: flex;
  flex-direction: column;
}
.card-foot{
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.sub-action {
  font-weight: bold;
  font-size: 16px;
  text-align: center;
}

.description {
  font-size: 14px;
  color: #666;
  margin: 0;
}


.button-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
.button-do {
  display: flex;
  flex-direction: column; /* 垂直排列 */
  justify-content: center; /* 垂直居中 */
  align-items: center; /* 水平居中 */
  height: 100%; /* 确保按钮高度足够 */
  padding: 10px 20px; /* 给按钮一些内边距 */
}

.log-section {
  flex: 4;
  background-color: #f9f9f9;
  overflow-y: auto;
  margin: 10px;
}

.log-content {
  font-size: 14px;
  color: #333;
}

/* 响应式优化（保持原样或微调） */
@media (max-width: 1200px) {
  .action-card {
    flex: 0 0 25%;
  }
}
@media (max-width: 900px) {
  .action-card {
    flex: 0 0 33.33%;
  }
}
@media (max-width: 600px) {
  .action-card {
    flex: 0 0 50%;
  }
}
@media (max-width: 400px) {
  .action-card {
    flex: 0 0 100%;
  }
}
</style>
