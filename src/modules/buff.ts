import type { ElementType } from '@/stores/user'

// 核心战斗属性
interface CombatAttributes {
  health_max: number // 100+土灵根×2% + 装备加成
  health_current: number // 当前生命值
  health_regenPerSec: number // 0.01+木灵根×0.5%
  mp_max: number // 100+水灵根×2% + 装备加成
  mp_current: number // 当前魔法值
  mp_regenPerSec: number // 0.01+火灵根×0.5%
  attack_physical: number // 10+金灵根×1% + 装备
  attack_magical: number // 10+火灵根×1.2%
  defense_physical: number // 10+土灵根×1%
  defense_magical: number // 10+水灵根×0.8%
  speed: number // 10+木灵根×0.5% + 装备修正
  hitRate: number // 基础100% + 装备修正
  dodgeRate: number // 身法×0.3% + 装备修正
  critRate: number // 金火组合×(等级和×0.5%) + 装备修正
  critDamage: number // 火灵根×1.2% + 装备修正
  recoveryTime: number // 60s // 复活时间
}

export interface DamageType {
  dmgType: 'physical' | 'magic'
  elementType: ElementType | 'none' // 元素类型
  targetAttr: 'heal_hp' | 'heal_mp' | 'dmg' | 'dmg_mp' // 目标类型
  damage: number // 伤害
}

interface Buff {
  // buff名称
  name: string
  // buff描述
  description: string
  // buff基本数值
  value: number
  // buff剩余持续时间（秒）
  duration: number
  // buff计算优先级（加算为1，乘算为2，锁死为3，先算加算的，再算乘算的，最后算锁死的）
  // 对属性作用的buff优先级为正数，对最终伤害生效的属性优先级为负，依旧从小到大，加算为-3，乘算为-2，锁死为-1
  priority: number
  source?: string //来源技能
  // effect
  effectFunc?: (attributes: CombatAttributes, dt: number) => void // buff效果函数
  postEffectFunc?: (dmgData: DamageType) => void // buff效果函数
}

const BuffList: { [key: string]: Buff } = {
  // buff列表
  // 伤害处理类
  无敌: {
    name: '无敌',
    description: '处于无敌状态，锁死血量',
    value: 1,
    duration: 3,
    priority: -1,
    postEffectFunc(dmgData: DamageType) {
      if (dmgData.targetAttr === 'dmg') dmgData.damage = 0
    },
  },
  金钟罩: {
    name: '金钟罩',
    description: '物伤减80%',
    value: 0.8,
    duration: 10,
    priority: -2,
    postEffectFunc(dmgData: DamageType) {
      if (dmgData.dmgType === 'physical' && dmgData.targetAttr === 'dmg')
        dmgData.damage *= 1 - this.value
    },
  },
  龟甲: {
    name: '龟甲',
    description: '物伤减10点',
    value: 10,
    duration: 10,
    priority: -3,
    postEffectFunc(dmgData: DamageType) {
      if (dmgData.dmgType === 'magic' && dmgData.targetAttr === 'dmg') dmgData.damage -= this.value
    },
  },
  燃魂: {
    name: '燃魂',
    description: '火系伤害加成30%',
    value: 0.3, // 火系伤害加成30%
    duration: 10,
    priority: -2, // 乘算
    postEffectFunc(dmgData: DamageType) {
      if (
        dmgData.dmgType === 'magic' &&
        dmgData.elementType === 'firePoints' &&
        dmgData.targetAttr === 'dmg'
      )
        dmgData.damage *= 1 + this.value
    },
  },
  弱水: {
    name: '弱水',
    description: '水系伤害加成30%',
    value: 0.3, // 水系伤害加成30%
    duration: 10,
    priority: -2, // 乘算
    postEffectFunc(dmgData: DamageType) {
      if (
        dmgData.dmgType === 'magic' &&
        dmgData.elementType === 'waterPoints' &&
        dmgData.targetAttr === 'dmg'
      )
        dmgData.damage *= 1 + this.value
    },
  },
  玄冰护体: {
    name: '玄冰护体',
    description: '寒冰灵气形成护体罡气，水属性减伤25%',
    value: 0.25, // 减伤25%
    duration: 20,
    priority: -2,
    postEffectFunc(dmgData: DamageType) {
      //烧魔也生效
      if (dmgData.dmgType === 'magic' && dmgData.elementType === 'waterPoints')
        dmgData.damage *= 1 - this.value
    },
  },

  //提前伤害类
  灼烧: {
    name: '灼烧',
    description: '每秒丢失血量上限的1%',
    value: 0.01,
    duration: 5,
    priority: 2,
    effectFunc(attributes: CombatAttributes, dt: number) {
      attributes.health_current = Math.round(
        attributes.health_current - attributes.health_max * this.value * dt,
      )
    },
  },
  中毒: {
    name: '中毒',
    description: '每秒丢失血量上限的0.5%，失血量每次累加',
    value: 0.01,
    duration: 5,
    priority: 2,
    effectFunc(attributes: CombatAttributes, dt: number) {
      attributes.health_current = Math.round(
        attributes.health_current - attributes.health_max * this.value * dt,
      )
      this.value += this.value * dt
    },
  },

  //其他
  眩晕: {
    name: '眩晕',
    description: '无法行动',
    value: 0,
    duration: 3,
    priority: 0,
  },

  // 属性修改类
  破甲: {
    name: '破甲',
    description: '降低目标物理防御',
    value: 1,
    duration: 5,
    priority: 2,
    effectFunc(attributes: CombatAttributes) {
      attributes.defense_physical = Math.round(attributes.defense_physical - this.value)
    },
  },
  缓速: {
    name: '缓速',
    description: '速度下降20%',
    value: 0.2,
    duration: 5,
    priority: 2,
    effectFunc(attributes: CombatAttributes) {
      attributes.speed *= 1 - this.value
    },
  },
  无力: {
    name: '缓速',
    description: '物理攻击下降20',
    value: 20,
    duration: 5,
    priority: 1,
    effectFunc(attributes: CombatAttributes) {
      attributes.attack_physical -= this.value
    },
  },
}

export default BuffList
export type { Buff, CombatAttributes }
