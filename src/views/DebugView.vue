<template>
  <div class="debug-view">
    <h1>Debug Page</h1>
    <div class="debug-form">
      <el-select v-model="selectedResource" placeholder="选择资源类型" class="debug-input">
        <el-option v-for="key in Object.keys(resourceMap)" :key="key" :label="labelMap[key as keyof typeof labelMap]"
          :value="key" />
      </el-select>

      <el-input v-model.number="inputValue" placeholder="输入数量" type="number" class="debug-input" />

      <el-button type="primary" @click="handleIncrease" class="debug-button"> 确认增加 </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useUserStore } from '@/stores/user'
import type { ResourcesSystem } from '@/stores/user'

export default {
  name: 'DebugView',
  data() {
    return {
      player: useUserStore(),
      selectedResource: 'aura',
      inputValue: 1000,
      labelMap: {
        aura: '灵气',
        elements: '五行点数',
        WarehouseLevel: '仓库等级',
        money: '铜币',
        magicStoneLow: '下品灵石',
        magicStoneMid: '中品灵石',
        magicStoneHigh: '上品灵石',
        magicStoneTop: '极品灵石',
        minHerbs: '药草',
        midHerbs: '灵草',
        maxHerbs: '仙草',
      },
      resourceMap: {
        aura: 'qiSystem.currentQi',
        elements: 'element.unusedPoints',
        WarehouseLevel: 'resources.WarehouseLevel',
        money: 'resources.money',
        magicStoneLow: 'resources.magicStoneLow',
        magicStoneMid: 'resources.magicStoneMid',
        magicStoneHigh: 'resources.magicStoneHigh',
        magicStoneTop: 'resources.magicStoneTop',
        minHerbs: 'resources.minHerbs',
        midHerbs: 'resources.midHerbs',
        maxHerbs: 'resources.maxHerbs',
      },
    }
  },
  methods: {
    handleIncrease() {
      type ResourceKey = keyof typeof this.resourceMap
      const value = Number(this.inputValue) || 0
      const path = this.resourceMap[this.selectedResource as ResourceKey].split('.')
      const lastProp = path.pop()
      const target = path.reduce(
        (obj: { [x: string]: any }, key: string | number) => obj[key],
        this.player,
      )
      target[lastProp || ''] += value
    },
  },
}
</script>

<style scoped>
.debug-view {
  background-color: #f0f0f0;
  width: 100%;
  max-width: 100%;
  border-radius: 15px;
}

button {
  margin: 10px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

.debug-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 300px;
}

.debug-input {
  margin-bottom: 10px;
}

.debug-button {
  margin-top: 10px;
}
</style>
