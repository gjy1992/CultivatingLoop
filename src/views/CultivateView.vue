<template>
  <div class="cultivate-view">
    <el-row :gutter="20">
      <!-- 左侧主内容 -->
      <el-col :span="16">
        <!-- 境界状态 -->
        <el-card class="panel">
          <div class="person_panel">
            <div class="left-info">
              <p>道号：{{ player.name }}</p>
              <p>宗门：无门无派</p>
              <p>职位：小虾米</p>
              <p>声望：默默无闻</p>
            </div>

            <div class="right-cultivation">
              <h2>当前境界：{{ player.majorRealmsName() }} {{ player.minorRealmsName() }}</h2>
              <p>灵气浓度：{{ Math.round(player.qiSystem.concentrationFactor * 100) }}%</p>
              <p>当前灵气：{{ Math.round(player.qiSystem.currentQi) }}</p>
              <p>突破需要：{{ player.realmStatus.requiredQi }}</p>

              <el-button
                type="primary"
                size="large"
                :disabled="!player.CanLevelUp().can"
                @click="player.LevelUp()"
                :style="{ color: player.CanLevelUp().can ? '#ffd700' : '#ffffff' }"
              >
                {{ player.CanLevelUp().reason || '突破' }}
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 五行雷达图 -->
        <el-card class="panel radar-panel">
          <div class="radar-container">
            <div ref="chartRef" style="width: 100%; height: 400px"></div>
            <div class="element-buttons">
              <p>剩余点数：{{ player.element.unusedPoints }}</p>
              <el-button type="success" @click="addElementPoint('metalPoints')">金 +1</el-button>
              <el-button type="success" @click="addElementPoint('woodPoints')">木 +1</el-button>
              <el-button type="success" @click="addElementPoint('waterPoints')">水 +1</el-button>
              <el-button type="success" @click="addElementPoint('firePoints')">火 +1</el-button>
              <el-button type="success" @click="addElementPoint('earthPoints')">土 +1</el-button>
            </div>
          </div>
          <div class="element-description">
            <p>金：提升物理攻击</p>
            <p>木：提升魔法防御</p>
            <p>水：影响生命和回复速度</p>
            <p>火：提升魔法攻击</p>
            <p>土：提升物理防御</p>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧状态区 -->
      <el-col :span="8">
        <div class="left-panel-container">
          <!-- 体质 -->
          <el-card class="panel constitution-panel">
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
          </el-card>

          <!-- 技能 -->
          <el-card class="panel skill-panel scrollable-panel">
            <h3>技能</h3>
            <el-tabs v-model="activeTab">
              <el-tab-pane label="主动技能" name="active">
                <div class="constitution-container">
                  <div
                    class="constitution-item"
                    v-for="(skill, index) in player.actionSkills"
                    :key="index"
                  >
                    <el-card class="constitution-card">
                      <p>{{ skill.name }}+{{ skill.level }}+{{ skill.description }}</p>
                    </el-card>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="被动技能" name="passive">
                <div class="constitution-container">
                  <div
                    class="constitution-item"
                    v-for="(skill, index) in player.passiveSkills"
                    :key="index"
                  >
                    <p>{{ skill.name }} Lv.{{ skill.level }}:{{ skill.description }}</p>
                  </div>
                </div>
              </el-tab-pane>

              <SkillList :skills="player.constitutions" type="passive" />
              <el-tab-pane label="先天体质" name="constitution">
                <div class="constitution-container">
                  <div
                    class="constitution-item"
                    v-for="(constitution, index) in player.constitutions"
                    :key="index"
                  >
                    <p>{{ constitution.name }} Lv.{{ constitution.level }}</p>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>

          <!-- 装备显示 -->
          <el-card class="panel equipment-panel">
            <h3>当前装备</h3>
            <div class="equipment-container">
              <!-- 左边：武器+衣服+鞋子 -->
              <div class="equip-left">
                <div>
                  武器:{{ player.equipments.weapon != '' ? player.equipments.weapon : '手无寸铁' }}
                </div>
                <div>
                  衣服:{{ player.equipments.armor != '' ? player.equipments.armor : '猎户装' }}
                </div>
                <div>
                  鞋子:{{ player.equipments.boots != '' ? player.equipments.boots : '赤脚' }}
                </div>
              </div>
              <!-- 右边：三类法宝 -->
              <div class="equip-right">
                <div>
                  攻击法宝:{{
                    player.equipments.artifactAttack != '' ? player.equipments.artifactAttack : '无'
                  }}
                </div>
                <div>
                  防御法宝:{{
                    player.equipments.artifactDefense != ''
                      ? player.equipments.artifactDefense
                      : '无'
                  }}
                </div>
                <div>
                  辅助法宝:{{
                    player.equipments.artifactSupport != ''
                      ? player.equipments.artifactSupport
                      : '无'
                  }}
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useUserStore, type ElementType } from '@/stores/user'
import * as echarts from 'echarts'

const player = useUserStore()
const activeTab = ref('active')

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

function getMaxRadarPoints() {
  const m = Math.max(
    player.element.metalPoints,
    player.element.woodPoints,
    player.element.waterPoints,
    player.element.firePoints,
    player.element.earthPoints,
  )
  return Math.ceil(m / 5) * 5
}

function renderRadarChart() {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const metal = Number(player.element.metalPoints)
  const wood = Number(player.element.woodPoints)
  const water = Number(player.element.waterPoints)
  const fire = Number(player.element.firePoints)
  const earth = Number(player.element.earthPoints)

  const radarSize = getMaxRadarPoints()

  const options = {
    tooltip: {
      trigger: 'axis',
    },
    radar: {
      indicator: [
      { name: `金 (${metal}/${radarSize})`, max: radarSize },
      { name: `木 (${wood}/${radarSize})`, max: radarSize },
      { name: `水 (${water}/${radarSize})`, max: radarSize },
      { name: `火 (${fire}/${radarSize})`, max: radarSize },
      { name: `土 (${earth}/${radarSize})`, max: radarSize },
      ],
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: [metal, wood, water, fire, earth],
            name: '五行属性',
          },
        ],
      },
    ],
  }

  chartInstance.setOption(options)
}

function addElementPoint(type: ElementType) {
  if (!player.element) return
  if (player.element.unusedPoints <= 0) return
  player.DistributePoints(type)
}

// 首次挂载时延迟初始化（等待 DOM 渲染）
onMounted(() => {
  nextTick(() => {
    renderRadarChart()
  })
})

// 自动监听五行属性变化，刷新图表
watch(
  () => [
    player.element.metalPoints,
    player.element.woodPoints,
    player.element.waterPoints,
    player.element.firePoints,
    player.element.earthPoints,
  ],
  () => {
    nextTick(() => {
      let newRadarSize = getMaxRadarPoints()
      const options = {
        radar: {
          indicator: [
            { name: '金', max: newRadarSize },
            { name: '木', max: newRadarSize },
            { name: '水', max: newRadarSize },
            { name: '火', max: newRadarSize },
            { name: '土', max: newRadarSize },
          ],
        },
      }

      chartInstance?.setOption(options)
      renderRadarChart()
    })
  },
  { immediate: true },
)

// 卸载时销毁图表实例
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.cultivate-view {
  background-color: #f0f0f0;
  border-radius: 15px;
  height: 100vh;
}

.person_panel {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 20px;
}

.left-info,
.right-cultivation {
  display: flex;
  flex-direction: column;
  width: 48%;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  padding: 1rem;
  border: 1px solid #616161;
  border-radius: 10px;
}

.panel {
  margin-bottom: 20px;
}

.radar-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.element-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}
.radar-chart {
  flex: 1;
  height: 400px;
}

.element-description {
  margin-top: 20px;
  font-size: 14px;
  line-height: 1.6;
  color: #666;
}

.equipment-container {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.equip-left,
.equip-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.element-buttons {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

::v-deep(.el-button) {
  min-width: 100px;
  justify-content: center;
  margin-left: 0px;
}

.left-panel-container {
  display: flex;
  flex-direction: column;
  height: 100%; /* 或者写成 height: 800px; 根据你页面结构调整 */
}

.constitution-container {
  display: flex;
  flex-wrap: wrap; /* 使项目换行 */
  gap: 10px; /* 每个项目之间的间隔 */
  flex: 2;
  overflow: hidden;
}

.skill-panel {
  flex: 2;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.scrollable-panel .el-tabs__content {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px; /* 方便滚动条不压住内容 */
}

.constitution-item {
  flex: 1 0 21%; /* 每个卡片的宽度，保持一定的比例，21% 是为了留出一些间隔 */
  max-width: 100%; /* 最小宽度，以确保卡片不会过于拥挤 */
  max-height: 50px;
  box-sizing: border-box; /* 确保 padding 不影响宽度计算 */
}

.constitution-card {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
  text-align: center;
}

.constitution-card p {
  font-size: 12px;
  color: #666;
  margin: 0;
  word-wrap: break-word; /* 确保文本不超出卡片区域 */
}

.equipment-panel {
  flex: 1;
  overflow: hidden;
}
</style>
