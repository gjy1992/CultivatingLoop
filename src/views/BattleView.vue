<template>
  <div class="battle-view">
    <!-- 主内容区域 -->
    <div class="main-content">
      <div class="party-info">
        <h3>己方信息</h3>
        <div v-for="(ally, index) in battleSystem.allies" :key="index">
          <span v-if="index === 1"
            ><strong>{{ ally.metadata.name }}</strong></span
          >
          <span v-else>{{ ally.metadata.name }}</span> - HP:
          {{ Math.round(ally.current.health.current) }} / MP:
          {{ Math.round(ally.current.mp.current) }}
          <div class="hp-bar">
            <div
              class="hp-bar-fill"
              :style="{
                width: (ally.current.health.current / ally.current.health.max) * 100 + '%',
              }"
            ></div>
          </div>
          <div class="action-bar">
            <div
              class="action-bar-fill"
              :style="{
                width: (ally.actionBar.value / 5) * 100 + '%',
              }"
            ></div>
          </div>
          <div class="buffs">
            <span
              v-for="(buff, buffIndex) in ally.buffs"
              :key="buffIndex"
              class="buff"
              :title="buff.description"
            >
              {{ buff }}
            </span>
          </div>
        </div>
      </div>

      <div class="enemy-info">
        <h3>敌方信息</h3>
        <div v-for="(enemy, index) in battleSystem.enemies" :key="index">
          {{ enemy.metadata.name }} - LV: {{ enemy.metadata.strength }} - HP:
          {{ Math.round(enemy.current.health.current) }}
          <div class="hp-bar">
            <div
              class="hp-bar-fill"
              :style="{
                width: (enemy.current.health.current / enemy.current.health.max) * 100 + '%',
              }"
            ></div>
          </div>
          <div class="action-bar">
            <div
              class="action-bar-fill"
              :style="{
                width: (enemy.actionBar.value / 5) * 100 + '%',
              }"
            ></div>
          </div>
          <div class="buffs">
            <span
              v-for="(buff, buffIndex) in enemy.buffs"
              :key="buffIndex"
              class="buff"
              :title="buff.description"
            >
              {{ buff }}
            </span>
          </div>
        </div>
      </div>

      <div class="battle-info">
        <h3>战斗信息</h3>
      </div>

      <div class="main-display">
        <h3>主要信息</h3>
        <div>当前地图：{{ mapData.name }}</div>
        <div>可能掉落物品：{{ mapData.drops.join(',') }}</div>
      </div>
    </div>

    <!-- 右侧边栏 -->
    <div class="right-sidebar">
      <div class="preview">
        <h3>战斗日志</h3>
        <div class="log">
          <!-- 遍历combatMgr.battleLog数组，显示每一条日志 -->
          <div v-for="(log, index) in combatMgr.battleLog" :key="index">
            {{ log }}
          </div>
        </div>
      </div>
    </div>
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
.character-panel {
  border: 1px dashed #616161;
  padding: 1rem;
  margin-bottom: 1.5rem;
  width: 300px;
}

.battle-view {
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

.sidebar,
.right-sidebar {
  width: 20%;
  background: #2d2d2d;
  padding: 15px;
  border-right: 2px solid #444;
}

.main-content {
  width: 80%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 15px;
  background: #151515;
}

.info-item {
  padding: 8px;
  margin: 5px 0;
  background: #3a3a3a;
  border-radius: 4px;
}

.backpack {
  padding: 10px;
  background: #4a4a4a;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.party-info,
.enemy-info,
.battle-info,
.main-display {
  padding: 15px;
  background: #222;
  border-radius: 8px;
  margin: 5px 0;
}

h3 {
  color: #4caf50;
  margin: 0 0 10px;
}

.preview {
  background: #444;
  padding: 12px;
  border-radius: 6px;
  margin-top: 10px;
}

.hp-bar {
  width: 100%;
  height: 10px;
  background: #555;
  border-radius: 5px;
  overflow: hidden;
  margin-top: 5px;
}

.action-bar {
  width: 100%;
  height: 10px;
  background: #555;
  border-radius: 5px;
  overflow: hidden;
  margin-top: 5px;
}

.hp-bar-fill {
  height: 100%;
  background: #ff4d4d;
  transition: width 0.3s ease;
}

.action-bar-fill {
  height: 100%;
  background: #49abf1;
  transition: width 0.3s ease;
}

.buffs {
  display: flex;
  gap: 5px;
  margin-top: 5px;
}

.buff {
  padding: 2px 6px;
  background: #4caf50;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}

.log {
  max-height: 500px;
  overflow-y: auto;
  padding: 10px;
  background: #333;
  border-radius: 4px;
}
</style>
