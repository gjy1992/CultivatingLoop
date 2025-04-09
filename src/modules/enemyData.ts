import type { CombatAttributes } from './buff'

// 敌人数据
interface EnemyData {
  name: string // 敌人名称
  description: string // 敌人描述
  attributes: CombatAttributes // 敌人属性
  strength: number // 敌人强度评估（1-10）
}
// 敌人列表
const EnemyList: { [key: string]: EnemyData } = {
  小怪: {
    name: '小怪',
    description: '小怪描述',
    attributes: {
      health: {
        max: 100,
        current: 100,
        regenPerSec: 0.01,
      },
      mp: {
        max: 100,
        current: 100,
        regenPerSec: 0.01,
      },
      attack: {
        physical: 15,
        magical: 15,
      },
      defense: {
        physical: 0,
        magical: 0,
      },
      speed: 1,
      hitRate: 100,
      dodgeRate: 0.3,
      critRate: 0.5,
      critDamage: 1.2,
      recoveryTime: 60,
    },
    strength: 1, // 小怪强度评估为1
  },
}

export default EnemyList
export type { EnemyData }
