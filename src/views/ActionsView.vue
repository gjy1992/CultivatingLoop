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
          @click="player.handleAction(action)"
          :title="ActionsMap[action].description"
          :disabled="
            action in player.actionsStatus && player.actionsStatus[action].cooldownRemaining > 0
          "
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

// 境界状态
const player = useUserStore()
player.updateActions()
</script>

<style scoped>
.actions-view {
  padding: 20px;
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
</style>
