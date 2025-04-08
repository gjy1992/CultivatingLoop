import type { UserStoreType } from './stores/user'

interface Action {
  name: string
  description: string
  duration: number
  cooldown: number
  minmajorRealm: number
  maxmajorRealm: number
  cost?: (user: UserStoreType) => void
  effect?: (user: UserStoreType) => void
  unlock?: (user: UserStoreType) => boolean //额外解锁条件
  disable?: (user: UserStoreType) => boolean //因为生命等临时条件不符而禁用
}

const ActionsMap: Record<string, Action> = {
  打坐: {
    name: '打坐',
    description: '倾听/感受/思考……',
    duration: 10,
    cooldown: 10,
    minmajorRealm: 0,
    maxmajorRealm: 3,
    effect: (user) => {
      user.qiSystem.currentQi += 10
    },
  },
  跑腿: {
    name: '跑腿',
    description: '只要996，月入30万不是梦',
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
}

interface ActionsData {
  progress: number
  cooldownRemaining: number
  pending: boolean // wait for cd
}

export default ActionsMap
export type { Action, ActionsData }
