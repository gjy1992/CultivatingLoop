<template>
  <div class="garden">
    <div class="grid">
      <div class="grid-item" v-for="(slot, index) in player.gardendata.slots" :key="index">
        <p class="plant-name">
          {{ slot.药草 === '' ? slot.name : 药草数据[slot.药草].name }}
        </p>
        <p>{{ slot.description }}</p>
        <p>等级: {{ slot.level }}</p>
        <span style="display: inline-block; overflow: auto; white-space: nowrap">{{
          slot.药草 === ''
            ? ''
            : slot.remainingTime > 0
              ? '剩余时间: ' + formatTime2(slot.remainingTime)
              : '已成熟'
        }}</span>
        <button @click="handleAction(index)" :disabled="slot.remainingTime > 0">
          {{ slot.药草 === '' ? '种地' : '采摘' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import GardenModule from '@/modules/gardenModule'
import { formatTime2 } from '@/modules/utilsModule'
import { useUserStore } from '@/stores/user'
import { 药草数据 } from '@/modules/gardenModule'

export default {
  data() {
    // test
    // useUserStore().gardendata.slots[0] = {
    //   name: '空地', // 槽位名称
    //   description: '空地',
    //   level: 1, // 槽位等级
    //   药草: '', // 药草名称
    //   remainingTime: 0, // 剩余时间（秒）
    // }
    return {
      player: useUserStore(),
      药草数据: 药草数据,
    }
  },
  methods: {
    handleAction(index: number) {
      GardenModule.handleAction(index, 'minHerbs', this.player, this.player.gardendata)
    },
    formatTime2(time: number) {
      return formatTime2(time)
    },
  },
}
</script>

<style scoped>
.garden {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f8ff;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3);
  grid-gap: 10px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 10px;
  background-color: #fff;
}

.plant-name {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: bold;
}

button {
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  border-radius: 3px;
  background-color: #4caf50;
  color: white;
}

button:hover {
  background-color: #45a049;
}
</style>
