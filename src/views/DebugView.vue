<template>
  <div class="debug-view">
    <h1>Debug Page</h1>
    <div class="debug-form">
      <el-select v-model="selectedResource" placeholder="选择资源类型" class="debug-input">
        <el-option 
          v-for="key in Object.keys(resourceMap)"
          :key="key"
          :label="labelMap[key]"
          :value="key"
        />
      </el-select>
      
      <el-input 
        v-model.number="inputValue"
        placeholder="输入数量"
        type="number"
        class="debug-input"
      />
      
      <el-button 
        type="primary" 
        @click="handleIncrease"
        class="debug-button"
      >
        确认增加
      </el-button>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '@/stores/user'

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
        WarehouseLevel:'仓库等级',
        money: '铜币',
        magicStone: '灵石',
        minHerbs:'药草',
        midHerbs:'灵草',
        maxHerbs:'仙草'
      },
      resourceMap: {
        aura: 'qiSystem.currentQi',
        elements: 'element.unusedPoints',
        WarehouseLevel:'resources.WarehouseLevel',
        money: 'resources.money',
        magicStone: 'resources.magicStone',
        minHerbs:'resources.minHerbs',
        midHerbs:'resources.midHerbs',
        maxHerbs:'resources.maxHerbs'
      }
    }
  },
  methods: {
    handleIncrease() {
      const value = Number(this.inputValue) || 0;
      const path = this.resourceMap[this.selectedResource].split('.');
      const lastProp = path.pop();
      const target = path.reduce((obj, key) => obj[key], this.player);
      target[lastProp] += value;
    }
  }
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
