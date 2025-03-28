<!-- src/views/CultivateView.vue -->
<template>
    <div class="cultivate-container">
      <!-- 境界状态 -->
      <div class="realm-status">
        <h2>当前境界：{{ realm }}境 {{ stage }}重</h2>
        <div class="progress-bar">
          [{{ progressBar }}] {{ cultivationProgress }}%
        </div>
      </div>
  
      <!-- 灵气操作 -->
      <div class="spirit-control">
        <p>灵气浓度：{{ spiritualLevel }}</p>
        <button 
          @click="startCultivation"
          :disabled="!canBreakthrough"
          class="breakthrough-btn"
        >
          {{ breakthroughText }}
        </button>
      </div>
  
      <!-- 五行灵根显示 -->
      <div class="elements-panel">
        <div 
          v-for="(val, key) in elements" 
          :key="key"
          class="element-item"
          :class="key"
        >
          {{ key }}：{{ val }}
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useSpiritStore } from '../stores/user' // 假设使用Pinia状态管理
  
  // 境界状态
  const realm = ref('筑基')
  const stage = ref(3)
  const cultivation = ref(8920)
  const maxCultivation = 10000
  
  // 灵气操作
  const spiritualLevel = ref(0.85)
  const isCultivating = ref(false)
  const elements = ref({
    金: 4, 木: 3, 水: 2, 火: 5, 土: 1
  })
  
  // 计算属性
  const cultivationProgress = computed(() => 
    Math.round((cultivation.value / maxCultivation) * 100)
  )
  
  const progressBar = computed(() => 
    '■'.repeat(cultivationProgress.value / 10) + 
    '□'.repeat(10 - cultivationProgress.value / 10)
  )
  
  const canBreakthrough = computed(() => 
    cultivation.value >= maxCultivation && 
    elements.value.火 >= 5
  )
  
  const breakthroughText = computed(() =>
    canBreakthrough.value ? '突破境界' : '灵气不足'
  )
  
  // 修炼方法
  const startCultivation = () => {
    if (!canBreakthrough.value) return
    
    isCultivating.value = true
    // 调用突破接口逻辑
    setTimeout(() => {
      realm.value = '金丹'
      stage.value = 1
      cultivation.value = 0
      isCultivating.value = false
    }, 2000)
  }
  
  // 生命周期钩子
  onMounted(() => {
    // 初始化灵气数据
    useSpiritStore().initSpiritualData()
  })
  </script>
  
  <style scoped>
  .cultivate-container {
    max-width: 600px;
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
  
  .elements-panel {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .element-item {
    padding: 8px;
    border: 1px solid #7cb342;
  }
  
  .火 { color: #ff6b6b; }
  </style>