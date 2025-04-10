import type { UserStoreType } from '../stores/user'

interface Action {
  name: string
  description: string
  duration: number
  cooldown: number
  minmajorRealm: number
  maxmajorRealm: number
  immediate?: boolean // 是否立即生效
  // 立即生效的技能，持续时间和冷却时间不生效
  cost?: (user: UserStoreType) => void
  effect?: (user: UserStoreType) => void
  unlock?: (user: UserStoreType) => boolean //额外解锁条件
  disable?: (user: UserStoreType) => boolean //因为生命等临时条件不符而禁用
}

const ActionsMap: Record<string, Action> = {
  打坐: {
    name: '打坐',
    description: '倾听/感受/思考……\n收益：10点灵气',
    duration: 10,
    cooldown: 10,
    minmajorRealm: 0,
    maxmajorRealm: 3,
    unlock: (user) => {
      return user.hasPassiveSkills('基础吐纳术')
    },
    effect: (user) => {
      user.qiSystem.currentQi += 10
    },
  },
  '打坐（手动）': {
    name: '打坐（手动）',
    description: '倾听/感受/思考……\n收益：每次1点灵气',
    duration: 10,
    cooldown: 10,
    minmajorRealm: 0,
    maxmajorRealm: 3,
    immediate: true,
    effect: (user) => {
      user.qiSystem.currentQi += 1
    },
  },
  跑腿: {
    name: '跑腿',
    description: '只要996，月入30万不是梦\n消耗：1点生命值\n收益：10-20铜币',
    duration: 5,
    cooldown: 5,
    minmajorRealm: 0,
    maxmajorRealm: 3,
    cost: (user) => {
      user.combat.health.current -= 1
    },
    effect: (user) => {
      user.resources.money += Math.random() * 10 + 10
    },
    disable: (user) => {
      return user.combat.health.current <= 1
    },
  },
  '跑腿（手动）': {
    name: '跑腿（手动）',
    description: '只要996，月入30万不是梦\n消耗：1点生命值\n收益：10-20铜币',
    duration: 5,
    cooldown: 5,
    minmajorRealm: 0,
    maxmajorRealm: 3,
    immediate: true,
    cost: (user) => {
      user.combat.health.current -= 1
    },
    effect: (user) => {
      user.resources.money += 5
    },
    disable: (user) => {
      return user.combat.health.current <= 1
    },
  },
  碎石: {
    name: '碎石',
    description: '80，80，80……\n消耗：5点生命值\n收益：2铜币，10%概率获得1下品灵石',
    duration: 20,
    cooldown: 20,
    minmajorRealm: 1,
    maxmajorRealm: 100,
    cost: (user) => {
      user.combat.health.current -= 5
    },
    effect: (user) => {
      user.resources.money += 2
      if (Math.random() < 0.1) {
        user.resources.magicStoneLow += 1
      }
    },
    disable: (user) => {
      return user.combat.health.current <= 5
    },
  },
  '碎石（手动）': {
    name: '碎石（手动）',
    description: '160，160，160……\n消耗：20点生命值\n收益：5铜币，20%概率获得1下品灵石',
    duration: 20,
    cooldown: 20,
    minmajorRealm: 1,
    maxmajorRealm: 100,
    immediate: true,
    cost: (user) => {
      user.combat.health.current -= 20
    },
    effect: (user) => {
      user.resources.money += 5
      if (Math.random() < 0.2) {
        user.resources.magicStoneLow += 1
      }
    },
    disable: (user) => {
      return user.combat.health.current <= 20
    },
  },
}

interface ActionsData {
  progress: number
  cooldownRemaining: number
  pending: boolean // wait for cd
}

export default ActionsMap
export type { Action, ActionsData }
