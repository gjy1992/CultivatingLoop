<!-- src/views/CultivateView.vue -->
<template>
  <div class="cultivate-container">
    <!-- 境界状态 -->
    <div class="realm-status">
      <h2>当前境界：{{ player.majorRealmsName() }}境 {{ player.minorRealmsName() }}</h2>
      <div class="progress">境界：[{{ realmProgress }}]</div>
    </div>

    <!-- 灵气操作 -->
    <div class="spirit-control">
      <p>灵气浓度：{{ Math.round(player.qiSystem.concentrationFactor * 100) }}%</p>
      <p>当前灵气：{{ Math.round(player.qiSystem.currentQi) }}</p>
      <p>突破需要：{{ player.realmStatus.requiredQi }}</p>
      <button @click="absorbQi">吸收灵气</button>
      <button
        @click="player.LevelUp()"
        :disabled="!player.CanLevelUp() || player.realmStatus.minorRealm == 9"
        class="breakthrough-btn"
      >
        突破小境界
      </button>
      <button
        @click="player.LevelUp()"
        :disabled="!player.CanLevelUp() || player.realmStatus.minorRealm < 9"
        class="breakthrough-btn"
      >
        突破大境界
      </button>
    </div>

    <!-- 五行灵根显示 -->
    <div class="elements-panel">
      <div v-for="(val, key) in player.element" :key="key" class="element-item" :class="key">
        {{ elementNames[key] }}：{{ val }}
        <!-- 分配按钮 -->
        <button
          @click="player.DistributePoints(key)"
          v-if="player.element.unusedPoints > 0 && key != 'unusedPoints'"
        >
          分配
        </button>
      </div>
    </div>

    <!-- 添加一个返回按钮 -->
    <div class="back-button" @click="$router.back()">
      <button>返回</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '../stores/user' // 假设使用Pinia状态管理

// 境界状态
const player = useUserStore()

// 计算属性[2,5](@ref)
const realmProgress = computed(() => {
  const progress = player.realmStatus.minorRealm
  return '■'.repeat(progress) + '□'.repeat(9 - progress)
})

// 突破境界方法
const startBreakThrough = () => {
  if (player.realmStatus.minorRealm >= 9) {
    // Logic for breaking through the realm
    console.log('Breaking through the realm...')
    player.realmStatus.minorRealm = 0 // Example logic
    player.realmStatus.majorRealm += 1
  }
}

// 五行显示名称
const elementNames = {
  firePoints: '火',
  waterPoints: '水',
  woodPoints: '木',
  metalPoints: '金',
  earthPoints: '土',
  unusedPoints: '未使用',
}

const updateInterval = 1000 * 1 // 每秒钟更新环境状态

// 手动吸收灵气方法
const absorbQi = () => {
  player.qiSystem.currentQi += player.qiSystem.concentrationFactor * 10 // Example logic
}

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
  // 此处可添加月相算法逻辑
  player.qiSystem.currentQi += player.qiSystem.autoGainPerSec * player.qiSystem.concentrationFactor
  player.qiSystem.lastUpdateTime += updateInterval
}
</script>

<style scoped>
.cultivate-container {
  width: 600px;
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
  border: 1px dashed #616161;
}

.breakthrough-btn {
  padding: 8px 20px;
  background: #7cb342;
  border: none;
  cursor: pointer;
  transition: opacity 0.3s;
}

.breakthrough-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.realm-status {
  width: 100%;
  margin-bottom: 1rem;
}

.elements-panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
}

.element-item {
  width: 100%;
  padding: 1rem;
  padding: 8px;
  border: 1px solid #7cb342;
}

.火 {
  color: #ff6b6b;
}
</style>
