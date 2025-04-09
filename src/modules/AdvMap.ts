import type { UserStoreType } from '../stores/user'

// 每个冒险地图的战斗
interface AdventureMapData {
  name: string // 地图名称
  description: string // 地图描述
  enemies: string[] // 敌人列表
  drops: string[] // 掉落物品
  dropProbs: number[] //掉落物品概率
  difficulty: number // 地图平均难度
  levelNum: number //关卡数量
  preaquisition: string[] // 前置关卡
  unlock?: (user: UserStoreType) => boolean //额外解锁条件
}

// 冒险地图列表
const AdventureMapList: { [key: string]: AdventureMapData } = {
  // 冒险地图列表
  地图1: {
    name: '地图1',
    description: '地图1描述',
    enemies: ['小怪'],
    drops: ['物品1', '物品2', '物品3'],
    dropProbs: [0.05, 0.02, 0.01],
    difficulty: 1,
    levelNum: 10,
    preaquisition: [], // 前置关卡
  },
  地图2: {
    name: '地图2',
    description: '地图2描述',
    enemies: ['小怪'],
    drops: ['物品4', '物品5', '物品6'],
    dropProbs: [0.05, 0.02, 0.01],
    difficulty: 2,
    levelNum: 20,
    preaquisition: ['地图1'], // 前置关卡
  },
}

export default AdventureMapList
export type { AdventureMapData }
