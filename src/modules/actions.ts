import type { UserStoreType } from '../stores/user'
export type { Action, SubAction, ActionState }

interface Action {
  name: string // 主行动名称，例如 打坐、采矿、跑腿
  description: string // 主行动描述，用于展示在卡片或菜单上
  progress:number // 进度条有多长
  unlock?: (user: UserStoreType) => boolean // 该主行动是否已解锁（可选）
  autoUnlock?: boolean | ((user: UserStoreType) => boolean) // 自动功能是否解锁（布尔值或函数）（可选）
  duration?: number // 主行动需要的时间（可选）
  actions: SubAction[] // 当前主行动下包含的所有子行动
}

interface SubAction {
  name: string // 子行动名称，例如 普通打坐、宗门打坐
  description: string // 描述文字，用于展示 UI 提示或说明
  cost?: (user: UserStoreType) => void // 执行该子行动时消耗的资源（可选）
  effect?: (user: UserStoreType) => void // 子行动完成后产生的效果（可选）
  unlock?: (user: UserStoreType) => boolean // 子行动是否解锁（用于根据角色状态控制解锁逻辑）（可选）
  disable?: (user: UserStoreType) => boolean // 子行动是否临时禁用（例如资源不足、冷却中等）（可选）
  autoEffect?: (user: UserStoreType) => void  // 子行动自动执行的效果
}


interface ActionState {
  key: string // 对应主行动的键（例如 "修行"、"碎石" 等），用于在 actionStateMap 中识别
  description:string //描述
  unlocked: boolean // 是否已解锁该主行动（满足 unlock 条件）
  autoUnlocked: boolean // 是否已解锁自动功能（满足 autoUnlock 条件）
  currentSubAction: SubAction | null // 当前选中的子行动（如果有）
  progress: number // 当前主行动的进度（例如 0 到 100）
  isActive: boolean // 是否正在进行该主行动
}

export const ActionsMap: Record<string, Action> = {
  跑腿: {
    name: '跑腿',
    description: '只要996，月入三十万不是梦',
    progress: 10,
    unlock: (user) => true,
    autoUnlock: (user) => user.realmStatus.majorRealm >= 1,
    actions: [
      {
        name: '普通跑腿',
        description: '收益：10~20铜币，消耗1点生命值',
        unlock: (user) => true,
        cost: (user) => {
          user.combat.health.current -= 1
        },
        effect: (user) => {
          user.resources.money += Math.floor(Math.random() * 10 + 10)
        },
        disable: (user) => user.combat.health.current <= 1,
        autoEffect: (user) => {
          user.resources.money += Math.floor(Math.random() * 10 + 10)
        }
      },
    ],
  },

  修行: {
    name: '修行',
    description: '倾听/感受/思考……',
    progress: 10,
    unlock: (user) => user.hasPassiveSkills('基础吐纳术'),
    autoUnlock: (user) => user.hasPassiveSkills('自动吐纳术'),
    actions: [
      {
        name: '独自修行',
        description: '孤独的修行',
        unlock: (user) => user.hasPassiveSkills('基础吐纳术'),
        effect: (user) => {
          user.qiSystem.currentQi += 10
        },
        autoEffect: (user) => {
          user.qiSystem.currentQi += 10
        }
      },
      {
        name: '外院打坐',
        description: '在宗门外院灵气聚地打坐，收益更高',
        unlock: (user) => user.realmStatus.majorRealm >= 1,
        effect: (user) => {
          user.qiSystem.currentQi += 25
        },
        autoEffect: (user) => {
          user.qiSystem.currentQi += 25
        }
      },
      {
        name: '内院打坐',
        description: '在宗门内院灵气聚地打坐，收益更高',
        unlock: (user) => user.realmStatus.majorRealm >= 2,
        effect: (user) => {
          user.qiSystem.currentQi += 50
        },
        autoEffect: (user) => {
          user.qiSystem.currentQi += 50
        }
      },
    ],
  },

  碎石: {
    name: '碎石',
    description: '80，80，80……',
    progress: 10,
    unlock: (user) => user.realmStatus.majorRealm >= 1,
    autoUnlock: (user) => user.hasPassiveSkills('自动碎石'),
    actions: [
      {
        name: '普通碎石',
        description: '收益：2铜币，10%获得下品灵石；消耗5点生命',
        unlock: (user) => true,
        effect: (user) => {
          user.resources.money += 2
          if (Math.random() < 0.1) {
            user.resources.magicStoneLow += 1
          }
        },
        autoEffect: (user) => {
          user.resources.magicStoneLow += 1
        }
      },
    ],
  },

  炼丹: {
    name: '炼丹',
    description: '吃药吃药，若论出身，更不公道',
    progress: 10,
    unlock: (user) => user.realmStatus.majorRealm >= 2,
    autoUnlock: (user) => user.hasPassiveSkills('自动碎石'),
    actions: [
      {
        name: '随便练练',
        description: '收益：2铜币，10%获得下品灵石；消耗5点生命',
        unlock: (user) => true,
        cost: (user) => {
          user.combat.health.current -= 5
        },
        effect: (user) => {
          user.resources.money += 2
          if (Math.random() < 0.1) {
            user.resources.magicStoneLow += 1
          }
        },
        disable: (user) => user.combat.health.current <= 5,
        autoEffect: (user) => {
          user.resources.money += 2
          if (Math.random() < 0.1) {
            user.resources.magicStoneLow += 1
          }
        }
      },
    ],
  },

  种植: {
    name: '种植',
    description: '月壤不能种地？那没意思了',
    progress: 10,
    unlock: (user) => user.realmStatus.majorRealm * 10 + user.realmStatus.minorRealm >= 15,
    autoUnlock: (user) => user.hasPassiveSkills('自动碎石'),
    actions: [
      {
        name: '大萝贝！',
        description: '收益：2铜币，10%获得下品灵石；消耗5点生命',
        unlock: (user) => true,
        cost: (user) => {
          user.combat.health.current -= 5
        },
        effect: (user) => {
          user.resources.money += 2
          if (Math.random() < 0.1) {
            user.resources.magicStoneLow += 1
          }
        },
        disable: (user) => user.combat.health.current <= 5,
        autoEffect: (user) => {
          user.resources.money += 2
          if (Math.random() < 0.1) {
            user.resources.magicStoneLow += 1
          }
        }
      },
    ],
  },
}

export default ActionsMap;