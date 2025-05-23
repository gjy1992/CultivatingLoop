// src/stores/user.ts
import { defineStore } from 'pinia'
import { reactive, ref, type Reactive, type Ref } from 'vue'
import type { CombatAttributes, Buff, DamageType } from '../modules/buff'
import type { EnemyData } from '@/modules/enemyData'
import EnemyList, { Param, GenEnemyAttrWithStrenth } from '@/modules/enemyData'
import type { AdventureMapData } from '@/modules/AdvMap'
import AdventureMapList from '@/modules/AdvMap'
import constitutionLists, {
  passiveSpells,
  type Constitution,
  type ConstitutionData,
} from '@/modules/Constitution'
import GardenModule from '@/modules/gardenModule'
import type { GardenData } from '@/modules/gardenModule'
import { useBagStore } from './bag'
import ActionsMap, { type ActionState, type SubAction } from '@/modules/actions'
import { useLogStore } from './log' // 路径根据你项目结构调整
import type { KongFuData } from '@/modules/kongfu'
import KongFuList, { KongFuReqExp } from '@/modules/kongfu'
import { useAppStore } from './app'
import router from '@/router'
import { useShopStore } from './itemsdata/shopList'

const GammaCoef = function (R: number, r: number) {
  return 1 + 0.1 * Math.sin((3 * (R + r)) / 17)
}

interface RealmStatus {
  majorRealm: number // 大境界（1-7对应文档境界体系）
  minorRealm: number // 小境界（1-9）
  requiredQi: number // 当前突破所需灵气（根据文档Q(R,r)公式计算）
  breakthroughAttempts: number // 当前连续渡劫突破失败次数（用于衰减补偿）
}

interface QiSystem {
  currentQi: number // 当前积累灵气值
  concentrationFactor: number // 当前灵气浓度（0.0-1.0）
  lastUpdateTime: number // 用于离线收益计算
  autoGainPerSec: number // 自动挂机速率（根据灵根计算）
}

interface ElementSystem {
  // 各灵根分配点数
  metalPoints: number
  woodPoints: number
  waterPoints: number
  firePoints: number
  earthPoints: number
  unusedPoints: number // 剩余点数
}

//五行灵根系统
export type ElementType = keyof ElementSystem

// 实时战斗属性
export interface BattleAttributes {
  // 输入数值
  original: CombatAttributes // 输入数值
  // 实时数值
  current: CombatAttributes // 实时数值
  // buff
  buffs: Buff[] // 增益效果
  // 掉落
  drops: string[] // 掉落物品
  dropProbs: number[] //掉落物品概率
  kongfu: KongFuData[] // 技能状态
  // 行动条进度
  actionBar: Ref<number> // 行动条进度（0-5）
  // 友方或敌方
  ally: boolean
  metadata: EnemyData
}

interface ResourcesSystem {
  WarehouseLevel: number //仓库等级
  money: number //铜币 资源默认值为-1，方便在系统未开启的时候不显示
  magicStoneLow: number //下品灵石 无存储量
  magicStoneMid: number //中品灵石 无存储量
  magicStoneHigh: number //上品灵石 无存储量
  magicStoneTop: number //极品灵石 无存储量
  minHerbs: number //普通草药，卖钱 存储量为仓库等级*1000
  midHerbs: number //中级草药，灵气池、宗门任务 存储量为仓库等级*100
  maxHerbs: number //高级草药，炼丹 存储量为仓库等级*10
  contribution: number // 宗门贡献
}

interface Equipments {
  weapon: string //衣服
  armor: string //武器
  boots: string //鞋子
  artifactAttack: string //攻击法宝
  artifactDefense: string //防御法宝
  artifactSupport: string //辅助法宝
}

export const currencyNameMap: Record<keyof ResourcesSystem, string> = {
  WarehouseLevel: '仓库等级', //仓库等级
  money: '铜币', //铜币 资源默认值为-1，方便在系统未开启的时候不显示
  magicStoneLow: '下品灵石', //下品灵石 无存储量
  magicStoneMid: '中品灵石', //中品灵石 无存储量
  magicStoneHigh: '上品灵石', //上品灵石 无存储量
  magicStoneTop: '极品灵石', //极品灵石 无存储量
  minHerbs: '普通草药', //普通草药，卖钱 存储量为仓库等级*1000
  midHerbs: '中级草药', //中级草药，灵气池、宗门任务 存储量为仓库等级*100
  maxHerbs: '高级草药', //高级草药，炼丹 存储量为仓库等级*10
  contribution: '宗门贡献', // 宗门贡献
}

export type { CombatAttributes, ResourcesSystem }

class BattleSystem {
  // 友方
  allies: BattleAttributes[] = reactive([]) // 友方
  // 敌方
  enemies: BattleAttributes[] = reactive([]) // 敌方

  result: number = -2 // 战斗结果（1-胜利，0-失败，-1-战斗中, -2等待战斗开始）

  // dt: number // 时间间隔（秒）
  update(dt: number) {
    // 更新所有单位的buff状态
    for (const unit of [...this.allies, ...this.enemies]) {
      let rawbufflength = unit.buffs.length // 记录buff数量
      for (const buff of unit.buffs) {
        buff.duration -= dt // 减少持续时间
        // 移除过期buff
        unit.buffs = unit.buffs.filter((b) => b.duration > 0)
      }
      // 如果buff数量减少了，则更新实时属性
      if (unit.buffs.length < rawbufflength) {
        unit.current = { ...unit.original } // 重置实时属性
        for (const buff of unit.buffs) {
          if (buff.priority > 0 && buff.effectFunc) {
            buff.effectFunc(unit.current, dt) // 应用buff效果
          }
        }
      }
    }
    // 更新血量和蓝量
    for (const unit of [...this.allies, ...this.enemies]) {
      unit.current.health_current =
        unit.current.health_current + unit.current.health_regenPerSec * dt
      // 限制血量不超过最大值
      unit.current.health_current = Math.min(unit.current.health_current, unit.current.health_max)
      unit.current.mp_current = unit.current.mp_current + unit.current.mp_regenPerSec * dt
      // 限制蓝量不超过最大值
      unit.current.mp_current = Math.min(unit.current.mp_current, unit.current.mp_max)
    }
    // 更新行动条进度
    const allUnits = [...this.allies, ...this.enemies]
    for (const unit of allUnits) {
      //判断眩晕状态
      if (unit.buffs.find((buff) => buff.name == '眩晕')) continue // 如果有眩晕状态，则跳过
      unit.actionBar.value += dt * unit.current.speed // 增加行动条进度
    }
    // 排序行动条，友方敌方一起排序
    allUnits.sort((a, b) => b.actionBar.value - a.actionBar.value)
    // 执行行动条
    for (const unit of allUnits) {
      if (unit.actionBar.value >= 5) {
        unit.actionBar.value -= 5 // 执行行动条
        // 执行技能或攻击逻辑
        this.executeAction(unit)
      }
    }
    // 更新回血量和蓝量
    for (const unit of [...this.allies, ...this.enemies]) {
      unit.original.health_current = Math.round(
        (unit.current.health_current / unit.current.health_max) * unit.original.health_max,
      )
      unit.original.mp_current = Math.round(
        (unit.current.mp_current / unit.current.mp_max) * unit.original.mp_max,
      )
    }
  }
  executeAction(unit: BattleAttributes) {
    // 选择技能
    const skills = unit.kongfu.filter((a) => a.cooldown <= 0) // 选择技能
    let skill: KongFuData = { name: '普通攻击', cooldown: 0, level: 1, exp: 0 } // 默认技能
    if (skills.length > 0) {
      skill = skills[Math.floor(Math.random() * skills.length)] // 随机选择技能
    }
    const skillData = KongFuList[skill.name] // 获取技能数据
    // 选择目标
    let targets: BattleAttributes[] = []
    if (skillData.target == 'self') {
      targets = [unit] // 自己
    } else {
      let targetArr = this.enemies
      if (
        (unit.ally && skillData.target == 'ally') ||
        (!unit.ally && skillData.target == 'enemy')
      ) {
        targetArr = this.allies
      }
      if (skillData.targetNumber == 'all' || skillData.targetNumber >= targetArr.length) {
        targets = targetArr // 全体
      } else {
        let targetIdxs: number[] = []
        for (let i = 0; i < targetArr.length; i++) {
          targetIdxs.push(i)
        }
        targetIdxs = targetIdxs.sort(() => Math.random() - 0.5) // 随机排序
        for (let i = 0; i < skillData.targetNumber; i++) {
          targets.push(targetArr[targetIdxs[i]]) // 随机选择敌人
        }
      }
    }
    // 计算技能冷却
    skill.cooldown = skillData.cooldown // 设置技能冷却
    // 增加技能经验
    if (skillData.canLevelUp) {
      skill.exp++
      if (skill.exp >= KongFuReqExp(skillData, skill.level)) {
        skill.level++
        skill.exp = 0
      }
    }
    // 执行技能或攻击逻辑
    let tnames: string[] = []
    targets.forEach((a) => tnames.push(a.metadata.name))
    combatMgr.AddLog('执行行动:', unit.metadata.name, '对', tnames.join(' ')) // 添加日志
    // 先执行技能附加效果
    if (skillData.extraEffect) {
      skillData.extraEffect(this.allies, this.enemies, targets)
    }
    // 结算伤害
    if (skillData.targetAttr == 'dmg' || skillData.targetAttr == 'dmg_mp') {
      targets.forEach((target) => {
        // 计算命中率
        const hit = Math.random() < unit.current.hitRate // 命中
        const dodge = Math.random() < target.current.dodgeRate // 闪避
        const crit = Math.random() < unit.current.critRate // 暴击
        if (hit && !dodge) {
          let atk =
            skillData.dmgType == 'physical'
              ? unit.current.attack_physical
              : unit.current.attack_magical
          let def =
            skillData.dmgType == 'physical'
              ? target.current.defense_physical
              : target.current.defense_magical
          // TODO 增加元素属性
          let damage =
            atk *
            Math.pow(
              Param.minor_bonus,
              (5 * Math.log(atk / def)) / Math.log(Param.HP_major_coef / Param.battle_time_coef),
            )
          damage *= skillData.damage + skillData.levelbonus * (skill.level - 1) // 计算伤害
          if (crit) {
            damage *= unit.current.critDamage // 计算暴击伤害
          }
          let dmgData: DamageType = {
            dmgType: skillData.dmgType,
            elementType: skillData.elementType,
            targetAttr: skillData.targetAttr,
            damage: damage,
          }
          // 计算buff效果
          unit.buffs.forEach((buff) => {
            if (buff.priority < 0 && buff.postEffectFunc) {
              buff.postEffectFunc(dmgData) // 应用buff效果
            }
          })

          damage = Math.round(dmgData.damage) // 四舍五入
          if (skillData.targetAttr == 'dmg')
            target.current.health_current -= damage // 扣除目标生命值
          else target.current.mp_current -= damage // 扣除目标魔法值
          combatMgr.AddLog(
            skill.name + '成功，造成',
            skillData.targetAttr == 'dmg' ? '生命' : '魔法',
            '伤害:',
            damage,
            '点',
          )
        } else if (dodge) {
          combatMgr.AddLog('攻击被闪避')
        } else {
          combatMgr.AddLog('攻击未命中')
        }
        // 计算目标死亡
        if (target.current.health_current <= 0) {
          target.current.health_current = 0 // 设置目标生命值为0
          combatMgr.AddLog('目标死亡', target.metadata.name) // 添加日志
          // 执行死亡逻辑
          this.executeDeath(target)
        }
      })
    } else {
      // heal
      targets.forEach((target) => {
        // 计算命中率
        let atk =
          skillData.dmgType == 'physical'
            ? unit.current.attack_physical
            : unit.current.attack_magical

        let damage = atk * skillData.damage // 计算治疗量
        const crit = Math.random() < unit.current.critRate // 暴击
        if (crit) {
          damage *= unit.current.critDamage // 计算暴击伤害
        }
        let dmgData: DamageType = {
          dmgType: skillData.dmgType,
          elementType: skillData.elementType,
          targetAttr: skillData.targetAttr,
          damage: damage,
        }
        // 计算buff效果
        unit.buffs.forEach((buff) => {
          if (buff.priority < 0 && buff.postEffectFunc) {
            buff.postEffectFunc(dmgData) // 应用buff效果
          }
        })
        damage = Math.round(damage) // 四舍五入
        if (skillData.targetAttr == 'heal_hp')
          target.current.health_current += Math.min(
            target.current.health_current + damage,
            target.current.health_max,
          )
        // 增加目标生命值
        else
          target.current.mp_current = Math.min(
            target.current.mp_current + damage,
            target.current.mp_max,
          ) // 增加目标魔法值
        combatMgr.AddLog(
          skill.name + '成功，治疗:',
          skillData.targetAttr == 'heal_hp' ? '生命' : '魔法',
          damage,
          '点',
        )
      })
    }
  }
  executeDeath(unit: BattleAttributes) {
    // 执行死亡逻辑
    //console.log('单位死亡:', unit)
    // 移除单位
    if (unit.ally) {
      this.allies = this.allies.filter((u) => u !== unit) // 移除友方单位
    } else {
      this.enemies = this.enemies.filter((u) => u !== unit) // 移除敌方单位
    }
    // 检查战斗结果
    if (this.allies.length === 0) {
      this.result = 0 // 失败
    } else if (this.enemies.length === 0) {
      this.result = 1 // 胜利
    } else {
      this.result = -1 // 战斗中
    }
  }
}

class AdventureCombat {
  currentMap: AdventureMapData | null = null // 当前地图数据
  battleSystem: BattleSystem | null = null // 战斗系统
  battleTimer: number = 0 // 战斗定时器
  battleInterval: number = 100 // 战斗更新间隔（毫秒）
  battleLog: Reactive<string[]> = [] // 战斗日志
  currentLevel = 0
  player: UserStoreType | null = null
  onEndCallback?: (result: number) => void

  constructor() {
    this.battleSystem = new BattleSystem()
  }

  initPlayer(user: UserStoreType) {
    this.player = user
  }

  AddLog(...log: any[]) {
    // 添加战斗日志
    this.battleLog.push(log.join(',')) // 将日志添加到战斗日志中
    //console.log(this.battleLog)
    // 限制日志数量
    if (this.battleLog.length > 20) {
      this.battleLog.shift() // 删除最旧的日志
    }
  }

  generateEnemies(enemyData: string[]): BattleAttributes[] {
    // 生成敌人列表
    const enemies: BattleAttributes[] = []
    // 生成本关难度，在difficulty±sqrt(difficulty)范围内
    let difficulty = this.currentMap?.difficulty || 0
    if (difficulty <= 0) difficulty = 1
    this.AddLog('current difficulty', difficulty)
    // 根据难度生成敌人
    let totalDiff = 0
    while (totalDiff < difficulty) {
      const enemyName = enemyData[Math.floor(Math.random() * enemyData.length)] // 随机选择敌人
      const enemy = EnemyList[enemyName] // 获取敌人数据
      const kongfu = enemy.kongfus
        .map((name: string) => {
          const data = KongFuList[name]
          if (!data) {
            console.warn(`KongFu ${name} not found in KongFuList`)
            return null
          }
          return { name: name, cooldown: 0, level: 1 }
        })
        .filter((kf) => kf !== null) as KongFuData[]
      const enemyAttributes: BattleAttributes = {
        original: { ...enemy.attributes },
        current: reactive<CombatAttributes>({ ...enemy.attributes }),
        buffs: reactive<Buff[]>([]), // 增益效果
        kongfu: kongfu, // 技能状态
        drops: this.currentMap?.drops || [], // 掉落物品
        dropProbs: this.currentMap?.dropProbs || [], // 掉落概率
        actionBar: ref(0), // 行动条进度（0-5）
        ally: false, // 敌人
        metadata: enemy,
      }
      enemies.push(enemyAttributes)
      totalDiff += enemy.strength // 增加总难度
    }
    return enemies
  }

  startAdventure(mapData: AdventureMapData, name: string, playerData: CombatAttributes) {
    this.currentMap = mapData
    this.startCurrentBattle(name, playerData)
  }

  startCurrentBattle(name: string, playerData: CombatAttributes) {
    // 生成敌人列表
    const enemies = this.generateEnemies(this.currentMap?.enemies || [])
    this.battleSystem = new BattleSystem()
    this.battleSystem.enemies = enemies // 设置敌人列表
    let kongfu: KongFuData[] = [{ name: '普通攻击', cooldown: 0, level: 1, exp: 0 }]
    // 获取玩家功法列表
    Object.values(this.player?.actionSkills || {}).map((kf) => {
      kongfu.push(kf)
    })
    let kongfus = ['普通攻击']
    kongfus.concat(Object.keys(this.player?.actionSkills || {}))
    // 设置友方列表
    const player: BattleAttributes = {
      original: playerData,
      current: reactive<CombatAttributes>({ ...playerData }),
      buffs: reactive<Buff[]>([]), // 增益效果
      drops: [], // 玩家没有掉落物品
      kongfu: kongfu,
      dropProbs: [],
      actionBar: ref(0), // 行动条进度（0-5）
      ally: true, // 玩家是友方
      metadata: {
        name: name,
        description: '',
        attributes: playerData,
        kongfus: kongfus,
        strength: 0,
      },
    }
    this.battleSystem.allies = [player]
    this.battleSystem.result = -2 // 等待战斗开始
    this.battleLog = [] // 清空战斗日志
    this.currentLevel = 1
    // console.log(this.stopBattle)
    //this.battleUpdate()
    // console.log(this.stopBattle)
    // 开始战斗
    //this.battleTimer = setInterval(this.battleUpdate, this.battleInterval) // 开始战斗定时器
  }

  startBattle() {
    // 开始战斗
    if (this.battleSystem && this.battleSystem.result == -2) {
      this.battleSystem.result = -1 // 战斗中
    }
  }

  battleUpdate() {
    if (this.battleSystem && this.battleSystem.result > -2) {
      this.battleSystem.update(this.battleInterval / 1000) // 更新战斗系统
      if (this.battleSystem.result !== -1) {
        console.log('本次战斗结果:', this.battleSystem.result) // 输出战斗结果
        if (this.battleSystem.result == 1) {
          //胜利
          if (this.currentLevel >= (this.currentMap?.levelNum || 0)) {
            this.player?.clearedMaps.push(this.currentMap?.name || '')
            this.AddLog('地图通关')
            if (this.onEndCallback) this.onEndCallback(1)
            if (this.currentMap?.effect && this.player) {
              this.currentMap.effect(this.player, 1)
            }
            this.stopBattle() // 停止战斗
          } else {
            this.currentLevel++
            const enemies = this.generateEnemies(this.currentMap?.enemies || [])
            this.battleSystem.enemies = enemies // 设置敌人列表
            this.battleSystem.result = -1
          }
        } else {
          this.AddLog('战斗失败')
          if (this.onEndCallback) this.onEndCallback(0)
          if (this.currentMap?.effect && this.player) {
            this.currentMap.effect(this.player, 0)
          }
          this.stopBattle() // 停止战斗
        }
      }
    }
  }

  stopBattle() {
    this.battleSystem = null // 清空战斗系统
    this.currentMap = null // 清空当前地图数据
    this.currentLevel = 0
  }
}

const combatMgr = new AdventureCombat() // 战斗管理器实例
export { combatMgr } // 导出战斗管理器实例

interface SkillData {
  name: string // 技能名称
  level: number // 技能等级
  description: string //描述
}

type LevelUpRequirement = {
  check: (user: UserStoreType) => boolean
  description: string
}

const LevelUpRequirements: (LevelUpRequirement | undefined)[] = [
  //练气=>筑基
  {
    check: (user) => user.hasPassiveSkills('筑基丹'),
    description: '需要购买 筑基丹 ',
  },
]

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '',
    resources: reactive<ResourcesSystem>({
      WarehouseLevel: 1, //仓库等级
      money: 0, //铜币
      magicStoneLow: 0, //下品灵石 无存储量
      magicStoneMid: 0, //中品灵石 无存储量
      magicStoneHigh: 0, //上品灵石 无存储量
      magicStoneTop: 0, //极品灵石 无存储量
      minHerbs: 0, //普通草药，卖钱 存储量为仓库等级*1000
      midHerbs: 0, //中级草药，灵气池、宗门任务 存储量为仓库等级*100
      maxHerbs: 0, //高级草药，炼丹 存储量为仓库等级*10
      contribution: 0, // 宗门贡献
    }),
    realmStatus: reactive<RealmStatus>({
      majorRealm: 0, // 大境界（1-7对应文档境界体系）
      minorRealm: 0, // 小境界（1-9）
      requiredQi: 20, // 当前突破所需灵气（根据文档Q(R,r)公式计算）
      breakthroughAttempts: 0, // 当前连续突破失败次数（用于衰减补偿）
    }),
    qiSystem: reactive<QiSystem>({
      currentQi: 0, // 当前积累灵气值
      concentrationFactor: 1.0, // 当前灵气浓度（0.0-1.0）
      lastUpdateTime: new Date().getTime(), // 用于离线收益计算
      autoGainPerSec: 1, // 自动挂机速率（根据灵根计算）
    }),
    element: reactive<ElementSystem>({
      metalPoints: 0,
      woodPoints: 0,
      waterPoints: 0,
      firePoints: 0,
      earthPoints: 0,
      unusedPoints: 5, // 剩余点数
    }),
    equipments: reactive<Equipments>({
      weapon: '',
      armor: '',
      boots: '',
      artifactAttack: '',
      artifactDefense: '',
      artifactSupport: '',
    }),
    combat: reactive<CombatAttributes>({
      health_max: 100,
      health_current: 100,
      health_regenPerSec: 0.01,
      mp_max: 0,
      mp_current: 0,
      mp_regenPerSec: 0,
      attack_physical: 10,
      attack_magical: 10,
      defense_physical: 10,
      defense_magical: 10,
      speed: 1,
      hitRate: 0.95, // 命中率
      dodgeRate: 0.05, // 闪避率
      critRate: 0.1, // 暴击率
      critDamage: 2, // 暴击伤害倍率
      recoveryTime: 60, // 复活时间
    }),
    permenantAttr: {
      health_max: 0,
      health_current: 0,
      health_regenPerSec: 0,
      mp_max: 0,
      mp_current: 0,
      mp_regenPerSec: 0,
      attack_physical: 0,
      attack_magical: 0,
      defense_physical: 0,
      defense_magical: 0,
      speed: 0,
      hitRate: 0, // 命中率
      dodgeRate: 0, // 闪避率
      critRate: 0, // 暴击率
      critDamage: 0, // 暴击伤害倍率
    } as CombatAttributes,
    timer: 0, // 定时器
    updateInterval: 500, // 更新间隔（毫秒）

    clearedMaps: reactive<string[]>([]), // 通关的地图记录
    currentBattleMap: '', // 当前战斗地图
    //心法和被动技能
    passiveSkills: reactive<Record<string, SkillData>>({}), //被动技能
    actionSkills: reactive<Record<string, KongFuData>>({}), //主动技能
    constitutions: reactive<ConstitutionData[]>([]), //体

    // 行动
    actionStateMap: {} as Record<string, ActionState>,
    tickProgressMap: {} as Record<string, number>, // 每个 action 的进度
    currentActionCategory: '' as string, // 当前激活的 action（手动用）
  }),
  actions: {
    // majorRealmsName
    majorRealmsName(): string {
      if (this.realmStatus.majorRealm == 0) {
        return '凡人'
      }
      const arr = ['炼体', '筑基', '金丹', '元婴', '化神', '合体', '渡劫']
      return arr[this.realmStatus.majorRealm - 1] + '境'
    },
    // minorRealmsName
    minorRealmsName(): string {
      if (this.realmStatus.majorRealm == 0) {
        return ''
      }
      const arr = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
      return '第' + arr[this.realmStatus.minorRealm - 1] + '层'
    },
    // 计算当前境界突破所需灵气
    calculateRequiredQi() {
      const { majorRealm, minorRealm } = this.realmStatus
      if (majorRealm == 0) {
        this.realmStatus.requiredQi = 0
        return
      }
      const R = majorRealm - 1 // 大境界
      const r = minorRealm - 1 // 小境界
      let Q0 = Param.Q0 * Math.pow(1 + Param.a, R) * (1 + Param.b * r) * GammaCoef(R, r)
      if (R == 6) {
        Q0 = Q0 * (1 + 0.2 * r) //​天劫加成
      }
      if (r === 8) {
        Q0 = Q0 * Math.max(0.8, Math.pow(0.95, this.realmStatus.breakthroughAttempts)) // 突破失败补偿
      }
      this.realmStatus.requiredQi = Math.round(Q0)
    },
    // 渡劫概率计算（文档5节）
    calcBreakthroughResult(): number {
      const element = this.element
      const total =
        element.metalPoints +
        element.woodPoints +
        element.waterPoints +
        element.firePoints +
        element.earthPoints
      const R = this.realmStatus.majorRealm
      const α = R === 7 ? 2.5 : 0.5
      const maxKH = Math.max(element.metalPoints, element.firePoints)
      let P_success = Math.min(1, (1 / (1 + Math.exp(-(0.1 * total + α)))) * (1 + maxKH / 100))
      if (this.constitutions.find((a) => a.name == '天灵根') !== undefined)
        P_success = Math.min(1, P_success + 0.1)
      const P_failure =
        (1 - P_success) / (1 + Math.exp(0.05 * (element.woodPoints + element.earthPoints)))
      const P_death = 1 - P_success - P_failure
      // get a random result by probability: P_success, P_failure, P_death
      const random = Math.random()
      if (random < P_success) {
        return 1 // 成功
      } else if (random < P_success + P_failure) {
        return 0 // 失败
      } else {
        return -1 // 死亡
      }
    },
    CanLevelUp(): { can: boolean; reason?: string } {
      if (this.realmStatus.minorRealm === 0 && this.qiSystem.currentQi === 0) {
        return { can: false, reason: '需要学习《基础吐纳术》并开始修行' }
      }
      const hasEnoughQi = this.qiSystem.currentQi >= this.realmStatus.requiredQi
      let can = hasEnoughQi
      let reason = ''

      const requirement = LevelUpRequirements[this.realmStatus.majorRealm - 1]

      if (this.realmStatus.minorRealm === 9) {
        if (requirement && !requirement.check(this)) {
          can = false
          reason = requirement.description
        }
      }

      if (!hasEnoughQi) {
        reason = '灵气不足'
      }

      return { can, reason }
    },
    LevelUp(): void {
      if (this.realmStatus.majorRealm == 0) {
        //凡人单独处理
        this.realmStatus.majorRealm = 1 // 增加大境界
        this.realmStatus.minorRealm = 1 // 增加小境界
        this.realmStatus.breakthroughAttempts = 0 // 重置突破失败次数
        this.element.unusedPoints += 5 // 增加剩余点数
        this.UpdateCombatAttr()
        return
      }
      // 如果小境界大于9，则增加大境界并重置小境界
      if (this.realmStatus.minorRealm >= 9) {
        if (this.realmStatus.majorRealm <= 3) {
          // 前三个境界突破不用渡雷劫，刷脸就行
          let r = this.calcBreakthroughResult()
          if (r === 1) {
            this.realmStatus.majorRealm++ // 增加大境界
            this.realmStatus.minorRealm = 1 // 重置小境界
            this.realmStatus.breakthroughAttempts = 0 // 重置突破失败次数
            this.element.unusedPoints += 5 // 增加剩余点数
          } else if (r === 0) {
            this.realmStatus.minorRealm = 9
            this.realmStatus.breakthroughAttempts++ // 增加突破失败次数
          } else {
            alert('渡劫失败，你反而跌落了一个境界')
            this.realmStatus.minorRealm = 8 // 跌落一个小境界
            // 跌落太多了反而成了赚取五行点的途径emm
            this.realmStatus.breakthroughAttempts++ // 增加突破失败次数
            //this.realmStatus.breakthroughAttempts = 0 // 重置突破失败次数
          }
        } else {
          //雷劫
          const mapname = this.majorRealmsName() + '雷劫'
          const mapData = AdventureMapList[mapname]
          this.enterAdvMap(mapData) // 进入雷劫地图
          useAppStore().activeTab = '/battle' // 切换到冒险界面
          router.push('/battle') // 跳转到冒险界面
        }
      } else {
        // 增加当前境界小境界
        this.realmStatus.minorRealm++
        this.qiSystem.currentQi -= this.realmStatus.requiredQi // 扣除突破所需灵气
        this.element.unusedPoints += 1 // 增加剩余点数
      }
      this.UpdateCombatAttr()
      // 计算当前突破所需灵气
      this.calculateRequiredQi()
      this.updateActions()
    },
    BreakUpAfterBattle(res: number): void {
      if (res > 0) {
        // 成功
        this.realmStatus.majorRealm++ // 增加大境界
        this.realmStatus.minorRealm = 1 // 重置小境界
        this.realmStatus.breakthroughAttempts = 0 // 重置突破失败次数
        this.element.unusedPoints += 5 // 增加剩余点数
        //todo，随机获得先天体质
        const c = this.GetRandomConstitution()
        console.log('获得体质：', c)
        this.GetConstitution(c)

        this.UpdateCombatAttr()
      } else {
        // 失败
        // 跌落一个大境界
        this.realmStatus.majorRealm = Math.max(1, this.realmStatus.majorRealm - 1) // 大境界
        this.realmStatus.minorRealm = 1 // 重置小境界
        // 扣10属性点
        let todelete = 10
        if (this.element.unusedPoints > todelete) {
          this.element.unusedPoints -= todelete
          todelete = 0
        } else {
          todelete -= this.element.unusedPoints
          this.element.unusedPoints = 0
        }
        if (todelete > 0) {
          const keys: ElementType[] = [
            'metalPoints',
            'woodPoints',
            'waterPoints',
            'firePoints',
            'earthPoints',
          ]
          while (todelete > 0) {
            const randomIndex = Math.floor(Math.random() * keys.length)
            if (this.element[keys[randomIndex]] > 0) {
              this.element[keys[randomIndex]]-- // 随机减少一个灵根点数
              todelete--
            }
          }
        }
        this.UpdateCombatAttr()
      }
    },
    UpdateCombatAttr() {
      //计算基础属性
      this.combat = GenEnemyAttrWithStrenth(
        10 * this.realmStatus.majorRealm + this.realmStatus.minorRealm,
        0,
      )
      //console.log(this.combat)
      //计算永久加成
      Object.keys(this.combat).forEach((key) => {
        this.combat[key as keyof CombatAttributes] +=
          this.permenantAttr[key as keyof CombatAttributes]
      })
      //计算五行加成
      this.combat.attack_physical += Math.round(
        this.combat.attack_physical * (Param.ATK_attr_coef - 1) * this.element.metalPoints,
      ) // 增加物理攻击
      this.combat.attack_magical += Math.round(
        this.combat.attack_magical * (Param.ATK_attr_coef - 1) * this.element.firePoints,
      ) // 增加魔法攻击
      this.combat.critDamage += 0.01 * (this.element.metalPoints + this.element.firePoints) //增加爆伤
      this.combat.health_max += Math.round(
        this.combat.health_max * (Param.HP_attr_coef - 1) * this.element.waterPoints,
      )
      {
        let bonus = 1
        let ac = this.constitutions.find((a) => a.name == '先天道体')
        if (ac !== undefined) bonus += 0.25 * ac.level
        bonus *= Math.min(
          Param.HP_regen_major_coef,
          (Param.HP_regen_minor_coef / 2) * this.element.waterPoints,
        )
        this.combat.health_regenPerSec += this.combat.health_max * bonus // 增加生命回复
      }
      this.combat.defense_physical += Math.round(
        this.combat.defense_physical * (Param.DEF_attr_coef - 1) * this.element.earthPoints,
      ) // 增加物理防御
      this.combat.defense_magical += Math.round(
        this.combat.defense_magical * (Param.DEF_attr_coef - 1) * this.element.woodPoints,
      ) // 增加魔法防御
      // TODO 增加装备属性
    },
    // 分配灵根点数
    DistributePoints(key: keyof ElementSystem): void {
      if (this.element.unusedPoints > 0) {
        this.element[key]++ // 增加对应灵根点数
        this.element.unusedPoints-- // 减少剩余点数
      } else {
        alert('没有剩余点数可以分配！')
      }
      this.UpdateCombatAttr()
      // switch (key) {
      //   case 'metalPoints':
      //     this.combat.attack_physical = Math.round(
      //       this.combat.attack_physical * Param.ATK_attr_coef,
      //     ) // 增加物理攻击
      //     this.combat.critDamage += 0.01 //增加爆伤
      //     break
      //   case 'firePoints':
      //     this.combat.attack_magical = Math.round(this.combat.attack_magical * Param.ATK_attr_coef) // 增加魔法攻击
      //     this.combat.critDamage += 0.01 //增加爆伤
      //     break
      //   case 'waterPoints':
      //     this.combat.health_max = Math.round(this.combat.health_max * Param.HP_attr_coef)
      //     {
      //       let bonus = 1
      //       let ac = this.constitutions.find((a) => a.name == '先天道体')
      //       if (ac !== undefined) bonus += 0.5 * ac.level
      //       this.combat.health_regenPerSec +=
      //         ((this.combat.health_max * Param.HP_regen_minor_coef) / 2) * bonus // 增加生命回复
      //     }
      //     break
      //   case 'woodPoints':
      //     this.combat.defense_magical = Math.round(
      //       this.combat.defense_magical * Param.DEF_attr_coef,
      //     ) // 增加魔法防御
      //     break
      //   case 'earthPoints':
      //     this.combat.defense_physical = Math.round(
      //       this.combat.defense_physical * Param.DEF_attr_coef,
      //     ) // 增加物理防御
      //     break
      // }
    },
    //获得一个随机体质的名称
    GetRandomConstitution() {
      const keys = Object.keys(constitutionLists)
      const randomIndex = Math.floor(Math.random() * keys.length)
      return keys[randomIndex]
    },
    //获得体质
    GetConstitution(name: string) {
      const c = constitutionLists[name]
      if (c === undefined) {
        alert('体质名称不对')
      } else {
        const ac = this.constitutions.find((a) => a.name == name)
        if (ac === undefined) {
          this.constitutions.push({ name: c.name, level: 1 })
          if (c.apply) {
            c.apply(this, 1)
          }
        } else if (c.canLevelUp) {
          ac.level += 1
          if (c.apply) {
            c.apply(this, ac.level)
          }
        }
      }
    },
    // 轮回重置
    Reset() {
      // 停止战斗(如果正在战斗的话)
      this.stopBattle()

      this.name = ''

      this.resources.money = Math.max(0, Math.round(this.resources.money * 0.1)) // 金钱重置
      if (this.constitutions.find((a) => a.name == '轮回圣体') === undefined) {
        this.realmStatus.majorRealm = 0 // 大境界（1-7对应文档境界体系）
        this.realmStatus.minorRealm = 1 // 小境界（1-9）
      } else {
        let lv = (this.realmStatus.majorRealm - 1) * 10 + this.realmStatus.minorRealm - 1
        lv = Math.round(lv * 0.3)
        this.realmStatus.majorRealm = Math.floor(lv / 10) + 1
        this.realmStatus.minorRealm = lv - 10 * (this.realmStatus.majorRealm - 1) + 1
      }

      this.calculateRequiredQi() // 计算当前突破所需灵气
      this.realmStatus.breakthroughAttempts = 0 // 当前连续渡劫突破失败次数（用于衰减补偿）
      this.qiSystem.currentQi = 0 // 当前积累灵气值
      this.qiSystem.concentrationFactor = 1.0 // 当前灵气浓度（0.0-1.0）
      this.qiSystem.lastUpdateTime = new Date().getTime() // 用于离线收益计算
      this.qiSystem.autoGainPerSec = 1 // 自动挂机速率（根据灵根计算）
      // 剩余属性点有一定程度的继承
      this.element.unusedPoints = Math.round(
        Math.sqrt(
          this.element.metalPoints +
            this.element.firePoints +
            this.element.woodPoints +
            this.element.waterPoints +
            this.element.earthPoints +
            this.element.unusedPoints,
        ),
      ) // 增加剩余点数
      this.element.metalPoints = 0
      this.element.woodPoints = 0
      this.element.waterPoints = 0
      this.element.firePoints = 0
      this.element.earthPoints = 0
      // 先天体质随机
      let prob = 0.1
      this.constitutions = this.constitutions.filter(() => Math.random() < prob)

      // 资源重置
      this.resources.WarehouseLevel = 1 //仓库等级
      this.resources.money = 0 //铜币
      this.resources.magicStoneLow = 0 //下品灵石 无存储量
      this.resources.magicStoneMid = 0 //中品灵石 无存储量
      this.resources.magicStoneHigh = 0 //上品灵石 无存储量
      this.resources.magicStoneTop = 0 //极品灵石 无存储量
      this.resources.minHerbs = 0 //普通草药，卖钱 存储量为仓库等级*1000
      this.resources.midHerbs = 0 //中级草药，灵气池、宗门任务 存储量为仓库等级*100
      this.resources.maxHerbs = 0 //高级草药，炼丹 存储量为仓库等级*10
      // 战斗属性重置
      this.combat.health_max = 100
      this.combat.health_current = 100
      this.combat.health_regenPerSec = 0.01
      this.combat.mp_max = 0
      this.combat.mp_current = 0
      this.combat.mp_regenPerSec = 0
      this.combat.attack_physical = 10
      this.combat.attack_magical = 10
      this.combat.defense_physical = 10
      this.combat.defense_magical = 10
      this.combat.speed = 1
      this.combat.hitRate = 0.95 // 命中率
      this.combat.dodgeRate = 0.05 // 闪避率
      this.combat.critRate = 0.1 // 暴击率
      this.combat.critDamage = 2 // 暴击伤害倍率
      this.combat.recoveryTime = 60 // 复活时间
      this.UpdateCombatAttr()

      this.updateActions() // 更新可用技能

      this.actionStateMap = {} // 清空正在处理的技能
      this.tickProgressMap = {} // 每个 action 的进度
      ;(this.currentActionCategory = ''), // 当前激活的 action（手动用）
        (this.timer = 0) // 定时器
      this.updateInterval = 500
      this.clearedMaps = [] // 通关的地图记录
      this.currentBattleMap = '' // 当前战斗地图

      this.passiveSkills = {} // 清空被动技能

      //背包清空
      const bag = useBagStore()
      bag.clearBag() // 清空背包

      useShopStore().reset() // 重置商店

      this.$reset() // Pinia 自带的重置方法，用于重置所有状态
      // 刷新页面
      window.location.reload()
    },
    // 停止战斗
    stopBattle() {
      // 停止战斗逻辑
      combatMgr.stopBattle() // 停止战斗
      this.currentBattleMap = '' // 清空当前战斗地图
    },

    // 挂机逻辑
    updateTick() {
      const seconds = this.updateInterval / 1000

      // 系数相关（你可以改成其他条件）
      let coef = 1
      if (this.constitutions.find((a) => a.name == '天灵根')) coef += 2
      if (this.constitutions.find((a) => a.name == '先天道体')) coef += 1

      // 境界高于练气期才有被动恢复灵气
      if (this.realmStatus.majorRealm > 1) {
        this.qiSystem.currentQi +=
          coef * this.qiSystem.autoGainPerSec * this.qiSystem.concentrationFactor * seconds
      }

      // 战斗中不进行行动
      if (combatMgr.currentMap) return

      // 战斗外五倍回血回蓝
      this.combat.health_current += this.combat.health_regenPerSec * seconds * 5
      this.combat.health_current = Math.min(this.combat.health_current, this.combat.health_max)
      this.combat.mp_current += this.combat.mp_regenPerSec * seconds * 5
      this.combat.mp_current = Math.min(this.combat.mp_current, this.combat.mp_max)

      if (!this.currentActionCategory) return

      const currentAction = this.actionStateMap[this.currentActionCategory] ?? null
      if (!currentAction) return

      const currentSubAction = currentAction.currentSubAction
      if (!currentSubAction) return

      // === 1. 自动行为处理 ===
      if (currentAction.autoUnlocked) {
        // 增加进度
        const progress = currentAction.progress ?? 10 // 默认为10
        const currentProgress = this.tickProgressMap[this.currentActionCategory] ?? 0
        const newProgress = currentProgress + 1
        this.tickProgressMap[this.currentActionCategory] = newProgress

        // 如果达到进度条上限，就触发一次效果
        if (newProgress >= progress) {
          // 资源消耗
          if (currentSubAction.cost) currentSubAction.cost(this)
          // 效果处理
          if (currentSubAction.effect) currentSubAction.effect(this)
          // 重置进度条
          this.tickProgressMap[this.currentActionCategory] = 0

          logDisplay('执行了一次' + this.currentActionCategory + '行动')
        }
      }

      this.qiSystem.lastUpdateTime += this.updateInterval
    },

    enterAdvMap(mapData: AdventureMapData) {
      this.currentBattleMap = mapData.name
      combatMgr.startAdventure(mapData, this.name, this.combat) // 开始冒险战斗
      return combatMgr.battleSystem
    },

    exitAdvMap() {
      // TODO 增加失败概率
      this.stopBattle()
    },

    updateActions() {
      for (const [key, action] of Object.entries(ActionsMap)) {
        // 判断主行动是否解锁
        const unlocked = action.unlock ? action.unlock(this) : true
        if (!unlocked) continue

        // 判断是否解锁自动功能
        const autoUnlocked =
          typeof action.autoUnlock === 'function' ? action.autoUnlock(this) : !!action.autoUnlock

        // 筛选出已解锁的子行动（保留顺序）
        const unlockedSubActions = action.actions.filter((sub) => !sub.unlock || sub.unlock(this))

        // 选出数组中最靠后的一个子行动（优先度最高）
        const currentSubAction =
          unlockedSubActions.length > 0 ? unlockedSubActions[unlockedSubActions.length - 1] : null

        // 写入新状态
        this.actionStateMap[key] = {
          key,
          unlocked: true,
          description: action.description,
          autoUnlocked: autoUnlocked,
          currentSubAction,
          progress: action.progress,
          isActive: false,
        }
      }
    },

    handleAction() {
      const categoryKey = this.currentActionCategory
      if (!categoryKey) return

      const currentAction = this.actionStateMap[this.currentActionCategory] ?? null
      if (!currentAction) return

      const currentSubAction = currentAction.currentSubAction
      if (!currentSubAction) return

      // 初始化进度（若未定义则设为 0）
      this.tickProgressMap[categoryKey] ??= 0

      if (currentSubAction.disable && currentSubAction.disable(this)) {
        logDisplay('当前行动条件不满足，被暂停')
        return
      }

      // 增加进度
      this.tickProgressMap[categoryKey]++

      const requiredProgress = currentAction.progress ?? 10
      if (this.tickProgressMap[categoryKey] >= requiredProgress) {
        currentSubAction.cost?.(this)
        currentSubAction.effect?.(this)
        this.tickProgressMap[categoryKey] = 0
        logDisplay('执行了一次' + this.currentActionCategory + '行动')
      }
    },

    cancelAction(actionKey: string) {
      if (this.currentActionCategory === actionKey) {
        this.currentActionCategory = ''
        this.tickProgressMap[actionKey] = 0
      }
    },

    hasPassiveSkills(name: string, level?: number): boolean {
      if (name === '') return false
      if (!level) level = 1
      if (this.passiveSkills.hasOwnProperty(name) && this.passiveSkills[name].level >= level)
        return true
      else return false
    },

    learnPassiveSkills(name: string, description: string, level?: number) {
      if (name === '') return
      if (!level) level = 1
      const skill = passiveSpells[name]
      if (!skill) return
      if (!this.passiveSkills.hasOwnProperty(name))
        this.passiveSkills[name] = { name: name, level: 0, description: description }
      if (skill.apply) {
        while (level-- > 0 && this.passiveSkills[name].level < skill.maxlevel) {
          skill.apply(this, this.passiveSkills[name].level) // 应用技能效果
          this.passiveSkills[name].level++
        }
      } else {
        this.passiveSkills[name].level = Math.min(
          this.passiveSkills[name].level + level,
          skill.maxlevel,
        )
      }
      this.updateActions()
    },
  },
  persist: true,
})

function logDisplay(message: string) {
  const logStore = useLogStore()
  logStore.addLog(message)
}

export type UserStoreType = ReturnType<typeof useUserStore>
