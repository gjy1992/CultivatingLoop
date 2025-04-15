import type { ResourcesSystem, UserStoreType, CombatAttributes } from '@/stores/user'
// 物品类型枚举
export enum ItemType {
  EQUIP = '装备',
  PILL = '丹药',
  SKILL = '武学',
}

// 基础物品接口
export interface BaseItem {
  id: string // 唯一标识符
  name: string // 物品名称
  metadata?: string // 物品元数据（如物品等级、品质等）
  type: ItemType // 物品类型（装备、丹药、武学等）
  icon: string // 图标路径
  desc: string // 描述文字
  stackable: boolean // 是否可堆叠（如丹药可堆叠，装备不可）
  useImmediately?: boolean // 是否立即使用（不进背包）

  value: number // 价值（用于交易等）
  currencyType: keyof ResourcesSystem // 货币类型（如铜币、灵石等）

  effect?: (user: UserStoreType) => void // 物品效果（用于丹药等，如 { hpRestore: 100 }）
  stats?: (attr: CombatAttributes) => void // 属性加成（用于装备，如 { atk: 5, def: 2 }）
}

// 所有物品总表
export const ItemDB: Record<string, BaseItem> = {
  /*
   * 丹药
   */
  pill_001: {
    id: 'pill_001',
    name: '小还丹',
    type: ItemType.PILL,
    icon: '🫘',
    desc: '恢复100气血',
    stackable: true,
    effect: (user) => {
      user.combat.health_current += 100
      user.combat.health_current = Math.min(user.combat.health_current, user.combat.health_max)
    },
    value: 30,
    currencyType: 'money',
  },
  pill_002: {
    id: 'pill_002',
    name: '筑基丹',
    metadata: '筑基丹',
    type: ItemType.PILL,
    icon: '🌰',
    desc: '突破到筑基必须的丹药',
    // 需要留记录的丹药作为法术处理，其效果不放在这里的effect，放在对应法术里的apply里
    useImmediately: true,
    stackable: false,
    value: 20,
    currencyType: 'magicStoneLow',
  },

  /*
   * 装备
   */
  equip_001: {
    id: 'equip_001',
    name: '铁剑',
    type: ItemType.EQUIP,
    icon: '🗡️',
    desc: '一把普通的铁剑',
    stackable: false,
    stats: (attr) => {
      attr.attack_physical += 2
    },
    value: 50,
    currencyType: 'money',
  },

  /*
   * 功法
   */
  skill_001: {
    id: 'skill_001',
    name: '基础吐纳术',
    metadata: '基础吐纳术',
    type: ItemType.SKILL,
    useImmediately: true,
    icon: '📘',
    desc: '可以打坐吸收天地灵气',
    stackable: false,
    value: 100,
    currencyType: 'money',
  },
}
