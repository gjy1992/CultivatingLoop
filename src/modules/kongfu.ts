import type { ElementType } from '@/stores/user'

interface KongFu {
  name: string // 名称
  description: string // 描述
  minLevel: number // 最低大境界
  mp_cost: number // 消耗
  cooldown: number // 冷却时间
  dmgType: 'physical' | 'magic'
  elementType: ElementType | 'none' // 元素类型
  damage: number // 伤害倍率
  targetNumber: number | 'all'
  targetAttr: 'heal_hp' | 'heal_mp' | 'dmg' | 'dmg_mp' // 目标类型
  target: 'enemy' | 'self' | 'ally' // 目标
  levelbonus: number // 等级加成
}

interface KongFuData {
  name: string // 名称
  level: number // 等级
  cooldown: number // 冷却时间
}

// 功法列表
const KongFuList: { [key: string]: KongFu } = {
  // 功法列表
  普通攻击: {
    name: '普通攻击',
    description: '普通的一拳',
    minLevel: 0,
    mp_cost: 0,
    cooldown: 0,
    dmgType: 'physical',
    elementType: 'none',
    damage: 1,
    targetNumber: 1,
    targetAttr: 'dmg',
    target: 'enemy',
    levelbonus: 0,
  },
}

export default KongFuList
export type { KongFu, KongFuData }
