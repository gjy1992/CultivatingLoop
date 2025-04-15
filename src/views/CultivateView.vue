<!-- src/views/CultivateView.vue -->
<template>
  <div class="cultivate-container">
    <!-- 修炼界面 -->
    <div class="cultivate-panel">
      <!-- 境界状态 -->
      <div class="realm-status">
        <h2>当前境界：{{ player.majorRealmsName() }} {{ player.minorRealmsName() }}</h2>
      </div>

      <!-- 灵气操作 -->
      <div class="spirit-control">
        <p>灵气浓度：{{ Math.round(player.qiSystem.concentrationFactor * 100) }}%</p>
        <p>当前灵气：{{ Math.round(player.qiSystem.currentQi) }}</p>
        <p>突破需要：{{ player.realmStatus.requiredQi }}</p>
        <el-button
          @click="player.LevelUp()"
          :disabled="!breakthroughInfo.can"
          class="breakthrough-btn"
          :style="{ color: player.CanLevelUp().can ? '#ffd700' : '#ffffff' }"
        >
          {{ breakthroughInfo.reason ? breakthroughInfo.reason : '突破' }}
        </el-button>
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
    </div>
    <!-- 战斗属性界面 -->
    <div class="attr-panel">
      <div class="combat-attributes">
        <h3>战斗属性</h3>
        <p>
          生命：{{ Math.round(player.combat.health_current) }} /
          {{ Math.round(player.combat.health_max) }}（{{
            Math.round(player.combat.health_regenPerSec * 1000) / 1000
          }}/s）
        </p>
        <p>
          灵力：{{ Math.round(player.combat.mp_current) }} /
          {{ Math.round(player.combat.mp_max) }}（{{
            Math.round(player.combat.mp_regenPerSec * 1000) / 1000
          }}/s）
        </p>
        <p>
          攻击力（物理/魔法）：{{ Math.round(player.combat.attack_physical) }} /
          {{ Math.round(player.combat.attack_magical) }}
        </p>
        <p>
          防御力（物理/魔法）：{{ Math.round(player.combat.defense_physical) }} /
          {{ Math.round(player.combat.defense_magical) }}
        </p>
        <p>速度：{{ Math.round(player.combat.speed * 100) / 100 }}</p>
        <p>暴击率：{{ Math.round(player.combat.critRate * 1000) / 10 }}%</p>
        <p>暴击伤害：{{ Math.round(player.combat.critDamage * 1000) / 10 }}%</p>
        <p>命中率：{{ Math.round(player.combat.hitRate * 1000) / 10 }}%</p>
        <p>闪避率：{{ Math.round(player.combat.dodgeRate * 1000) / 10 }}%</p>
      </div>
    </div>
    <!-- 显示体质 -->
    <div class="constitutions-panel">
      <h3>体质</h3>
      <div class="constitutions-list">
        <span
          v-for="(value, key) in player.constitutions"
          :key="key"
          class="constitution-item"
          :title="constitutionHint(value)"
        >
          {{ value.name }}: Lv{{ value.level }}
        </span>
      </div>
    </div>
    <!-- 显示被动技能 -->
    <div class="passive-skills-panel">
      <h3>被动技能</h3>
      <div class="passive-skills-list">
        <span
          v-for="(skill, index) in player.passiveSkills"
          :key="index"
          class="passive-skill-item"
          :title="ps[skill.name].description"
        >
          {{ skill.name }}: Lv{{ skill.level }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '../stores/user' // 假设使用Pinia状态管理
import type { Constitution, ConstitutionData } from '@/modules/Constitution'
import constitutionLists, { passiveSpells } from '@/modules/Constitution'
import { ElButton } from 'element-plus'

// 境界状态
const player = useUserStore()

const ps = passiveSpells

// 计算属性[2,5](@ref)
const breakthroughInfo = computed(() => player.CanLevelUp())

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

// 手动吸收灵气方法
const absorbQi = () => {
  player.qiSystem.currentQi += player.qiSystem.concentrationFactor * 10 // Example logic
}

const constitutionHint = (v: ConstitutionData) => {
  const c = constitutionLists[v.name]
  return c.description + '\n' + c.effect(v.level)
}
</script>

<style scoped>
.cultivate-container {
  background-color: #f0f0f0;
  width: 100%;
  max-width: 100%;
  border-radius: 15px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.cultivate-panel {
  width: auto;
  margin: 2rem auto;
  padding: 1rem;
  border: 1px dashed #616161;
}

.attr-panel {
  flex-grow: 1;
  margin: 2rem auto;
  padding: 1rem;
  border: 1px dashed #616161;
}

.breakthrough-btn {
  padding: 8px 20px;
  background: #2c2f3a;
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

.constitutions-panel {
  margin-top: 2rem;
  padding: 1rem;
  border: 1px dashed #616161;
}

.constitutions-list {
  flex-direction: column;
  flex-wrap: nowrap;
  display: flex;
  gap: 10px;
}

.constitution-item {
  display: inline-block;
  white-space: nowrap;
  padding: 8px 12px;
  border: 1px solid #7cb342;
  border-radius: 4px;
  background-color: #f5f5f5;
  font-size: 14px;
  color: #333;
}

.passive-skills-panel {
  margin-top: 2rem;
  padding: 1rem;
  border: 1px dashed #616161;
}

.passive-skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.passive-skill-item {
  display: inline-block;
  white-space: nowrap;
  padding: 8px 12px;
  border: 1px solid #7cb342;
  border-radius: 4px;
  background-color: #f5f5f5;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition:
    background-color 0.3s,
    color 0.3s;
}

.passive-skill-item:hover {
  background-color: #7cb342;
  color: #fff;
}
</style>
