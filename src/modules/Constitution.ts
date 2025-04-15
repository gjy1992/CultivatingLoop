import type { UserStoreType } from '../stores/user'

// 先天体质/被动法术，其实都是一样的，是被动效果
interface Constitution {
  name: string // 体质名称
  description: string // 体质描述
  level: number // 体质等级（1-9）
  maxlevel: number // 体质最大等级
  effect: (level: number) => string // 体质效果描述
  canLevelUp?: boolean // 是否可以升级（可选）
  unlock?: (user: UserStoreType) => boolean // 解锁条件（可选）
  apply?: (user: UserStoreType, currentLevel: number) => void // 应用效果（可选），每升一级调用一次
}

interface ConstitutionData {
  name: string
  level: number
}

// 体质和被动法术列表
const constitutionLists: { [key: string]: Constitution } = {
  天灵根: {
    name: '天灵根',
    description: '先天五行俱全的顶级灵根，修炼速度远超常人',
    level: 1,
    maxlevel: 1,
    effect: () => '灵气吸收效率×300%，突破概率上升10%',
  },

  先天道体: {
    name: '先天道体',
    description: '体内孕育先天灵气的特殊体质，可自动吸收天地精华',
    level: 1,
    effect: (level: number) => '生命回复速度+' + 50 * level + '%，灵气吸收效率×200%', //50% * level
    canLevelUp: true,
    maxlevel: 9,
    apply: (user, currentLevel) => {
      user.combat.health_regenPerSec /= 2 + currentLevel - 1
      user.combat.health_regenPerSec *= 2 + currentLevel
    },
  },

  龙吟之体: {
    name: '龙吟之体',
    description: '身负上古龙族血脉的禁忌体质',
    level: 1,
    maxlevel: 1,
    effect: () => '暴击率+5%，暴击伤害+50%',
    apply: (user, currentLevel) => {
      user.combat.critRate + 0.05
      user.combat.critDamage += 0.5
    },
  },

  五行灵体: {
    name: '五行灵体',
    description: '同时具备金木水火土五种灵根的先天体质',
    level: 1,
    maxlevel: 9,
    effect: (level: number) => '元素类法术威力+' + 50 * level + '%', //50% * level
    canLevelUp: true,
  },

  玄冰圣体: {
    name: '玄冰圣体',
    description: '修炼寒冰之道的极致体质',
    level: 1,
    maxlevel: 9,
    effect: (level: number) =>
      '冰系法术威力+' + 100 * level + '%，冻结效果持续时间+' + 10 * level + '%', //100% * level, 10% * level
    canLevelUp: true,
  },

  炎阳金体: {
    name: '炎阳金体',
    description: '掌控太阳真火的霸道体质',
    level: 1,
    maxlevel: 9,
    effect: (level: number) => '火系法术附带灼烧效果，每秒损失最大生命值' + 1 * level + '%', //1% * level
    canLevelUp: true,
  },

  不灭之体: {
    name: '不灭之体',
    description: '肉身强横到极致的肉体凡胎',
    level: 1,
    maxlevel: 9,
    effect: (level: number) => '生命值低于30%时触发无敌状态，持续' + (3 + 2 * level) + '秒', //3+2 * level
    canLevelUp: true,
  },

  轮回圣体: {
    name: '轮回圣体',
    description: '看破轮回大道的体质',
    level: 1,
    maxlevel: 1,
    effect: () => '重生时保留约30%当前境界进度',
  },
}

export default constitutionLists
export type { Constitution, ConstitutionData }

//心法、被动法术
const passiveSpells: { [key: string]: Constitution } = {
  基础吐纳术: {
    name: '基础吐纳术',
    description: '基础吐纳术，修仙的基础',
    level: 1,
    maxlevel: 1,
    canLevelUp: false,
    effect: () => '学会了打坐',
    unlock: (user: UserStoreType) => false,
  },
  筑基丹: {
    name: '筑基丹',
    description: '突破到筑基必须的丹药',
    level: 1,
    maxlevel: 10,
    canLevelUp: true,
    effect: () => '可以筑基了',
    unlock: (user: UserStoreType) => false,
    apply: (user, currentLevel) => {
      user.combat.health_max += 100
    },
  },
}

export { passiveSpells }
