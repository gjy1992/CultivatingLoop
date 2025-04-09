<template>
  <div class="map-view">
    <!-- 主内容区域 -->
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { combatMgr, useUserStore } from '@/stores/user'
import AdventureMapList from '@/AdvMap'

const player = useUserStore()

const realmProgress = computed(() => {
  const progress = player.realmStatus.minorRealm
  return '■'.repeat(progress) + '□'.repeat(9 - progress)
})

//test
const mapData = AdventureMapList['地图1']
const battleSystem = player.enterAdvMap(mapData)
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
