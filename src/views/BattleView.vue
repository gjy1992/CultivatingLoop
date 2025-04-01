<template>
  <div class="battle-view">
    <!-- 主内容区域 -->
    <div class="main-content">
      <div class="party-info">
        <h3>己方信息</h3>
        <div v-for="(ally, index) in party" :key="index">
          {{ ally.name }} - HP: {{ ally.hp }} / MP: {{ ally.mp }}
          <div class="hp-bar">
            <div class="hp-bar-fill" :style="{ width: (ally.hp / 100) * 100 + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="enemy-info">
        <h3>敌方信息</h3>
        <div v-for="(enemy, index) in enemies" :key="index">
          {{ enemy.name }} - LV: {{ enemy.level }}
        </div>
      </div>

      <div class="battle-info">
        <h3>战斗信息</h3>
        <div>回合数：{{ turn }} 回</div>
        <div>战斗状态：{{ battleStatus }}</div>
      </div>

      <div class="main-display">
        <h3>主要信息</h3>
        <div>经验值：{{ exp }}/100</div>
        <div>掉落物品：{{ dropItems.join(', ') }}</div>
      </div>
    </div>

    <!-- 右侧边栏 -->
    <div class="right-sidebar">
      <div class="preview">
        <h3>战斗日志</h3>
        <div>下一个事件：{{ previewEvent }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'

const player = useUserStore()

const realmProgress = computed(() => {
  const progress = player.realmStatus.minorRealm
  return '■'.repeat(progress) + '□'.repeat(9 - progress)
})

// 模拟数据
const currentTime = ref('12:00')
const gold = ref(5000)
const breedingFarm = ref(3)
const demonGirls = ref(8)
const cityLevel = ref(5)
const backpack = ref({ items: ['剑', '药水', '防具'] })
const party = ref([
  { name: '剑士', hp: 100, mp: 20 },
  { name: '法师', hp: 80, mp: 50 },
])
const enemies = ref([
  { name: '哥布林', level: 3 },
  { name: '史莱姆', level: 1 },
])
const turn = ref(15)
const battleStatus = ref('进行中')
const exp = ref(85)
const dropItems = ref(['金币', '药草'])
const team = ref({ leader: { name: '勇者' }, members: ['弓箭手', '牧师'] })
const previewEvent = ref('遭遇精英怪')
</script>

<style scoped>
.character-panel {
  border: 1px dashed #616161;
  padding: 1rem;
  margin-bottom: 1.5rem;
  width: 300px;
}

.battle-view {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100vh;
  background: #1a1a1a;
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

.hp-bar-fill {
  height: 100%;
  background: #ff4d4d;
  transition: width 0.3s ease;
}
</style>
