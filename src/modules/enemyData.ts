import type { CombatAttributes } from './buff'

const Param = {
  Q0: 20, // 炼体境第一层基础值（建议100~500）
  a: 3.45, //大境跃迁系数（建议0.6~1.2）
  b: 0.13, //小境递增斜率（建议0.15~0.3）
  HP_major_coef: 1.5,
  HP_minor_coef: Math.pow(1.5, 0.2),
  ATK_major_coef: 1.25,
  ATK_minor_coef: Math.pow(1.25, 0.2),
  DEF_major_coef: 1.25,
  DEF_minor_coef: Math.pow(1.25, 0.2),
  MP_major_add: 100,
  MP_minor_add: 0,
  HP_regen_major_coef: 1 / 2000,
  HP_regen_minor_coef: 1 / 10000,
  MP_regen_major_add: 0.5,
  MP_regen_minor_add: 0,

  ATK_attr_coef: 1.1,
  DEF_attr_coef: 1.1,
  HP_attr_coef: 1.12,

  minor_bonus: 1.15, // 小境界加成（建议1.1~1.2）
  battle_time_coef: 1.2, // 战斗时间系数（建议1.0~1.5）
}

// strength = 10*major+minor
function GenEnemyAttrWithStrenth(strength: number, avePoints?: number): CombatAttributes {
  const major = Math.floor(strength / 10)
  const minor = strength % 10
  const p = major + ((major - 1) * 9 + minor - 1) / 5
  let res = {
    health_max: Math.round(100 * Math.pow(Param.HP_major_coef, p)),
    health_current: Math.round(100 * Math.pow(Param.HP_major_coef, p)),
    health_regenPerSec:
      Math.round(100 * Math.pow(Param.HP_major_coef, p)) * Param.HP_regen_major_coef,
    mp_max: Math.round(100 * major),
    mp_current: Math.round(100 * major),
    mp_regenPerSec: Math.round(0.5 * major),
    attack_physical: Math.round(10 * Math.pow(Param.ATK_major_coef, p)),
    attack_magical: Math.round(10 * Math.pow(Param.ATK_major_coef, p)),
    defense_physical: Math.round(10 * Math.pow(Param.DEF_major_coef, p)),
    defense_magical: Math.round(10 * Math.pow(Param.DEF_major_coef, p)),
    speed: 1,
    hitRate: 0.95, // 命中率
    dodgeRate: 0.05, // 闪避率
    critRate: 0.1, // 暴击率
    critDamage: 2, // 暴击伤害倍率
    recoveryTime: 60, // 复活时间
  }
  if (avePoints) {
    res.health_max = Math.round(res.health_max * Math.pow(Param.HP_attr_coef, avePoints))
    res.health_current = res.health_max
    res.attack_physical = Math.round(res.attack_physical * Math.pow(Param.ATK_attr_coef, avePoints))
    res.attack_magical = Math.round(res.attack_magical * Math.pow(Param.ATK_attr_coef, avePoints))
    res.defense_physical = Math.round(
      res.defense_physical * Math.pow(Param.DEF_attr_coef, avePoints),
    )
    res.defense_magical = Math.round(res.defense_magical * Math.pow(Param.DEF_attr_coef, avePoints))
    res.health_regenPerSec += res.health_max * Param.HP_regen_minor_coef * avePoints
  }
  return res
}

function StrengthCalc(strength: number, avePoints?: number): number {
  const major = Math.floor(strength / 10)
  const minor = strength % 10
  const p = major * 5 + ((major - 1) * 9 + minor - 1) - 15
  return Math.round(p / 5 + (avePoints || 0))
}

export { Param, GenEnemyAttrWithStrenth, StrengthCalc }

//for test
// Expose GenEnemyAttrWithStrenth to the global window object
if (typeof window !== 'undefined') {
  ;(window as any).GenEnemyAttrWithStrenth = GenEnemyAttrWithStrenth
}

// 敌人数据
interface EnemyData {
  name: string // 敌人名称
  description: string // 敌人描述
  attributes: CombatAttributes // 敌人属性
  kongfus: string[] // 敌人功法列表
  strength: number // 敌人强度评估（1-10）
}
// 敌人列表
const EnemyList: { [key: string]: EnemyData } = {
  小怪: {
    name: '小怪',
    description: '小怪中的入门者',
    attributes: GenEnemyAttrWithStrenth(21), // 生成小怪属性
    kongfus: ['普通攻击'], // 小怪功法列表
    strength: StrengthCalc(21), // 小怪强度评估
  },
  进阶小怪: {
    name: '小怪队长',
    description: '已经是一些小怪的头头了',
    attributes: GenEnemyAttrWithStrenth(23, 2), // 生成小怪属性
    kongfus: ['普通攻击'], // 小怪功法列表
    strength: StrengthCalc(23, 2), // 小怪强度评估
  },

  元婴雷劫怪: {
    name: '元婴雷劫怪',
    description: '天道历练',
    attributes: GenEnemyAttrWithStrenth(49, 13), // 生成小怪属性
    kongfus: ['普通攻击'], // 小怪功法列表
    strength: StrengthCalc(49, 13), // 小怪强度评估
  },

  化神雷劫怪: {
    name: '化神雷劫怪',
    description: '天道历练',
    attributes: GenEnemyAttrWithStrenth(59, 16), // 生成小怪属性
    kongfus: ['普通攻击'], // 小怪功法列表
    strength: StrengthCalc(59, 16), // 小怪强度评估
  },

  合体雷劫怪: {
    name: '合体雷劫怪',
    description: '天道历练',
    attributes: GenEnemyAttrWithStrenth(69, 19), // 生成小怪属性
    kongfus: ['普通攻击'], // 小怪功法列表
    strength: StrengthCalc(69, 19), // 小怪强度评估
  },

  渡劫雷劫怪: {
    name: '渡劫雷劫怪',
    description: '天道历练',
    attributes: GenEnemyAttrWithStrenth(79, 22), // 生成小怪属性
    kongfus: ['普通攻击'], // 小怪功法列表
    strength: StrengthCalc(79, 22), // 小怪强度评估
  },
}

export default EnemyList
export type { EnemyData }
