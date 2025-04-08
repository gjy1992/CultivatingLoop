<template>
  <div class="actions-view">
    <h3>行动界面</h3>
    <div class="actions-container">
      <div v-for="action in player.processingActions" class="action-item">
        {{ action }}
        <el-progress
          :percentage="(player.actionsStatus[action].progress / ActionsMap[action].duration) * 100"
          class="progress-bar"
        />
      </div>
    </div>
    <div class="actions-container">
      <div v-for="action in player.actions" class="action-item">
        <el-button
          type="primary"
          @click="handleAction(action)"
          :title="ActionsMap[action].description"
          :disabled="isActionDisabled(action)"
          :class="{ 'is-selected': player.processingActions.includes(action) }"
        >
          {{ action }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '../stores/user' // 假设使用Pinia状态管理
import type { Constitution, ConstitutionData } from '@/Constitution'
import constitutionLists from '@/Constitution'
import { ElButton } from 'element-plus'
import ActionsMap from '@/actions'
import { acceptHMRUpdate } from 'pinia'

// 境界状态
const player = useUserStore()
player.updateActions()

const handleAction = (action: string) => {
  if (player.processingActions.includes(action)) player.cancelAction(action)
  else player.handleAction(action)
}

const isActionDisabled = (action: string) => {
  if (player.processingActions.includes(action)) return false
  return (
    (ActionsMap[action].disable && ActionsMap[action].disable(player)) ||
    (action in player.actionsStatus && player.actionsStatus[action].cooldownRemaining > 0)
  )
}
</script>

<style scoped>
.actions-view {
  background-color: #f0f0f0;
  width: 100%;
  max-width: 100%;
  border-radius: 15px;
}

.header {
  margin-bottom: 20px;
}

.actions-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 2rem;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
}

.is-selected {
  background-color: #d3f9d8;
  border: 1px solid #a3e635;
  color: #065f46;
}
</style>
