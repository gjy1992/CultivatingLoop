import type { UserStoreType, ResoucesSystem } from '@/stores/user'

interface GardenSlot {
  // 花园槽位
  name: string // 槽位名称
  description: string // 槽位描述
  level: number // 槽位等级
  药草: keyof ResoucesSystem | '' // 药草名称
  remainingTime: number // 剩余时间（秒）
}

interface 药草 {
  key: string //对应ResoucesSystem里的键
  name: string
  description: string
  time: number // 生产时间（秒）
}

// 药草列表
const 药草数据: { [key: string]: 药草 } = {
  // 药草列表
  minHerbs: {
    key: 'minHerbs',
    name: '普通草药',
    description: '普通草药',
    time: 60,
  },
  midHerbs: {
    key: 'midHerbs',
    name: '中级草药',
    description: '中级草药',
    time: 60,
  },
  maxHerbs: {
    key: 'maxHerbs',
    name: '高级草药',
    description: '高级草药',
    time: 60,
  },
}

interface GardenData {
  // 花园数据
  slots: GardenSlot[] // 槽位列表
  maxSlots: number // 最大槽位数
  level: number // 花园等级
  experience: number // 花园经验
  experienceToNextLevel: number // 升级所需经验
  upgradeCost: number // 升级所需资源
}

const GardenModule = {
  // 花园模块
  updateTick(dt: number, user: UserStoreType, gd: GardenData) {
    // 更新花园状态
    for (const slot of gd.slots) {
      if (slot.remainingTime > 0) {
        slot.remainingTime -= dt
      }
    }
  },

  //种地
  plant(slot: GardenSlot, name: keyof ResoucesSystem) {
    // 种地
    if (slot && slot.药草 === '') {
      slot.药草 = name
      slot.remainingTime = 药草数据[slot.药草].time // 1小时
    }
  },

  handleAction(slotidx: number, name: keyof ResoucesSystem, user: UserStoreType, gd: GardenData) {
    const slot = gd.slots[slotidx]
    if (slot && slot.药草 === '') {
      this.plant(slot, name) // 种地
    } else {
      // 处理收获逻辑
      if (slot && slot.药草 !== '') {
        user.resources[slot.药草] += 1 // 收获药草
        slot.药草 = ''
        slot.remainingTime = 0
        // 更新经验和资源
      }
    }
  },

  addSlot(gd: GardenData) {
    if (gd.slots.length < gd.maxSlots) {
      gd.slots.push({
        name: `槽位${gd.slots.length + 1}`,
        description: '新槽位',
        level: 1,
        药草: '',
        remainingTime: 0,
      })
    }
  },

  reset(gd: GardenData) {
    // 重置花园
    gd.slots = []
    gd.maxSlots = 9
    gd.level = 1
    gd.experience = 0
    gd.experienceToNextLevel = 100
    gd.upgradeCost = 100
    // 增加一个初始地块
    this.addSlot(gd)
  },
}

export type { GardenSlot, GardenData }
export default GardenModule
export { 药草数据 }
