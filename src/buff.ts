// 核心战斗属性
interface CombatAttributes {
  health: {
    // 生命系统
    max: number // 100+土灵根×2% + 装备加成
    current: number // 当前生命值
    regenPerSec: number // 0.01+木灵根×0.5%
  }
  mp: {
    // 魔法系统
    max: number // 100+水灵根×2% + 装备加成
    current: number // 当前魔法值
    regenPerSec: number // 0.01+火灵根×0.5%
  }
  attack: {
    // 攻击系统
    physical: number // 10+金灵根×1% + 装备
    magical: number // 10+火灵根×1.2%
  }
  defense: {
    // 防御系统
    physical: number // 10+土灵根×1%
    magical: number // 10+水灵根×0.8%
  }
  speed: number // 10+木灵根×0.5% + 装备修正
  hitRate: number // 基础100% + 装备修正
  dodgeRate: number // 身法×0.3% + 装备修正
  critRate: number // 金火组合×(等级和×0.5%) + 装备修正
  critDamage: number // 火灵根×1.2% + 装备修正
  recoveryTime: number // 60s // 复活时间
}

interface Buff {
  // buff名称
  name: string
  // buff描述
  description: string
  // buff基本数值
  value: number
  // buff等级
  level: number
  // buff剩余持续时间（秒）
  duration: number
  // buff计算优先级（加算为1，乘算为2，锁死为3，先算加算的，再算乘算的，最后算锁死的）
  priority: number
  // effect
  effectFunc?: (attributes: CombatAttributes) => void // buff效果函数
}

const BuffList: { [key: string]: Buff } = {
  // buff列表
  buff1: {
    name: '无敌',
    description: '处于无敌状态，锁死血量',
    value: 10,
    level: 1,
    duration: 60,
    priority: 1,
  },
  buff2: {
    name: '灼烧',
    description: '每秒丢失血量',
    value: 20,
    level: 1,
    duration: 60,
    priority: 2,
    effectFunc(attributes: CombatAttributes) {
      attributes.health.current -= attributes.health.max * 0.01 * this.level
    },
  },
}

export default BuffList
export type { Buff, CombatAttributes }
