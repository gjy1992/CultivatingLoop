<template>
  <div class="map-view">
    <!-- 主内容区域 -->
    <div class="map-selection">
      <h2>选择地图</h2>
      <ul>
        <li v-for="(map, index) in activeMapList" :key="index">
          <button @click="selectMap(map)" :title="AdventureMapList[map].description">
            {{ map }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { combatMgr, useUserStore } from '@/stores/user'
import AdventureMapList from '@/modules/AdvMap'
import router from '@/router'

const player = useUserStore()

const activeMapList = computed(() => {
  return Object.keys(AdventureMapList).filter((map) => {
    const mapData = AdventureMapList[map]
    let unlock = !mapData.unlock || mapData.unlock(player)
    mapData.preaquisition.forEach((pre) => {
      if (!player.clearedMaps.includes(pre)) {
        unlock = false
      }
    })
    return unlock
  })
})

const selectMap = (map: string) => {
  player.enterAdvMap(AdventureMapList[map])
  router.push({ path: '/battle' })
}

if (player.currentBattleMap != '' && combatMgr.currentMap) {
  // continue battle
  router.push({ path: '/battle' })
}
</script>

<style scoped>
.map-view {
  background-color: #f0f0f0;
  width: 100%;
  max-width: 100%;
  border-radius: 15px;
  display: flex;
  flex-direction: row;
  width: 100%;
  color: #fff;
  font-family: Arial, sans-serif;
}
</style>
