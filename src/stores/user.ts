// src/stores/user.ts
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

const Param = {
  Q0: 200, // 炼体境第一层基础值（建议100~500）
  a: 1, //大境跃迁系数（建议0.6~1.2）
  b: 0.2, //小境递增斜率（建议0.15~0.3）
}

const GammaCoef = function (R: number, r: number) {
  return 1 + 0.1 * Math.sin((3 * (R + r)) / 17)
}

interface RealmStatus {
  majorRealm: number // 大境界（1-7对应文档境界体系）
  minorRealm: number // 小境界（1-9）
  requiredQi: number // 当前突破所需灵气（根据文档Q(R,r)公式计算）
  breakthroughAttempts: number // 当前连续渡劫突破失败次数（用于衰减补偿）
}

interface QiSystem {
  currentQi: number // 当前积累灵气值
  concentrationFactor: number // 当前灵气浓度（0.0-1.0）
  lastUpdateTime: number // 用于离线收益计算
  autoGainPerSec: number // 自动挂机速率（根据灵根计算）
}

//五行灵根系统
type ElementType = 'metal' | 'wood' | 'water' | 'fire' | 'earth'

interface ElementSystem {
  // 各灵根分配点数
  metalPoints: number
  woodPoints: number
  waterPoints: number
  firePoints: number
  earthPoints: number
  unusedPoints: number // 剩余点数
}

// 先天体质
interface Constitution {
  name: string // 体质名称
  description: string // 体质描述
  level: number // 体质等级（1-9）
  effect: string // 体质效果描述
  Apply: (user: typeof useUserStore) => void // 体质效果应用函数
}

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
  speed: {
    // 速度系统
    base: number // 10+木灵根×1%
    agility: number // 10+金灵根×1% // 装备加成
  }
  hitRate: number // 基础100% + 装备修正
  dodgeRate: number // 身法×0.3% + 装备修正
  critRate: number // 金火组合×(等级和×0.5%) + 装备修正
  critDamage: number // 火灵根×1.2% + 装备修正
  recoveryTime: number // 60s // 复活时间
}

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '无名修士',
    cultivation: 0,
    realmStatus: reactive<RealmStatus>({
      majorRealm: 1, // 大境界（1-7对应文档境界体系）
      minorRealm: 1, // 小境界（1-9）
      requiredQi: 100, // 当前突破所需灵气（根据文档Q(R,r)公式计算）
      breakthroughAttempts: 0, // 当前连续突破失败次数（用于衰减补偿）
    }),
    qiSystem: reactive<QiSystem>({
      currentQi: 0, // 当前积累灵气值
      concentrationFactor: 1.0, // 当前灵气浓度（0.0-1.0）
      lastUpdateTime: new Date().getTime(), // 用于离线收益计算
      autoGainPerSec: 1, // 自动挂机速率（根据灵根计算）
    }),
    element: reactive<ElementSystem>({
      metalPoints: 0,
      woodPoints: 0,
      waterPoints: 0,
      firePoints: 0,
      earthPoints: 0,
      unusedPoints: 5, // 剩余点数
    }),
    combat: reactive<CombatAttributes>({
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
        physical: 10,
        magical: 10,
      },
      defense: {
        physical: 10,
        magical: 10,
      },
      speed: {
        base: 1,
        agility: 0,
      },
      hitRate: 0.95, // 命中率
      dodgeRate: 0.05, // 闪避率
      critRate: 0.1, // 暴击率
      critDamage: 2, // 暴击伤害倍率
      recoveryTime: 60, // 复活时间
    }),
    updateInterval: 1000, // 更新间隔（毫秒）
    timer: 0, // 定时器ID
  }),
  actions: {
    // majorRealmsName
    majorRealmsName(): string {
      const arr = ['炼体', '筑基', '金丹', '元婴', '化神', '合体', '渡劫']
      return arr[this.realmStatus.majorRealm - 1]
    },
    // minorRealmsName
    minorRealmsName(): string {
      const arr = ['一', '二', '三', '四', '五', '六', '七', '八', '九']
      return '第' + arr[this.realmStatus.minorRealm - 1] + '层'
    },
    // 计算当前境界突破所需灵气
    calculateRequiredQi() {
      const { majorRealm, minorRealm } = this.realmStatus
      const R = majorRealm - 1 // 大境界
      const r = minorRealm - 1 // 小境界
      let Q0 = Param.Q0 * Math.pow(+Param.a, R) * (1 + Param.b * r) * GammaCoef(R, r)
      if (R == 6) {
        Q0 = Q0 * (1 + 0.2 * r) //​天劫加成
      }
      if (r === 8) {
        Q0 = Q0 * Math.max(0.8, Math.pow(0.95, this.realmStatus.breakthroughAttempts)) // 突破失败补偿
      }
      this.realmStatus.requiredQi = Math.round(Q0)
    },
    // 渡劫概率计算（文档5节）
    calcBreakthroughResult(): number {
      const element = this.element
      const total =
        element.metalPoints +
        element.woodPoints +
        element.waterPoints +
        element.firePoints +
        element.earthPoints
      const R = this.realmStatus.majorRealm
      const α = R === 7 ? 2.5 : 0.5
      const maxKH = Math.max(element.metalPoints, element.firePoints)
      const P_success = Math.min(1, (1 / (1 + Math.exp(-(0.1 * total + α)))) * (1 + maxKH / 100))
      const P_failure =
        (1 - P_success) / (1 + Math.exp(0.05 * (element.woodPoints + element.earthPoints)))
      const P_death = 1 - P_success - P_failure
      // get a random result by probability: P_success, P_failure, P_death
      const random = Math.random()
      if (random < P_success) {
        return 1 // 成功
      } else if (random < P_success + P_failure) {
        return 0 // 失败
      } else {
        return -1 // 死亡
      }
    },
    CanLevelUp(): boolean {
      // 判断是否可以突破
      return this.qiSystem.currentQi >= this.realmStatus.requiredQi
    },
    LevelUp(): void {
      // 增加当前境界小境界
      this.realmStatus.minorRealm++
      this.qiSystem.currentQi -= this.realmStatus.requiredQi // 扣除突破所需灵气
      // 如果小境界大于9，则增加大境界并重置小境界
      if (this.realmStatus.minorRealm > 9) {
        let r = this.calcBreakthroughResult()
        if (r === 1) {
          this.realmStatus.majorRealm++ // 增加大境界
          this.realmStatus.minorRealm = 1 // 重置小境界
          this.realmStatus.breakthroughAttempts = 0 // 重置突破失败次数
          //todo，随机获得先天体质
        } else if (r === 0) {
          this.realmStatus.breakthroughAttempts++ // 增加突破失败次数
        } else {
          alert('你死了！')
          this.realmStatus.breakthroughAttempts = 0 // 重置突破失败次数
          this.Reset()
        }
      }
      // 计算当前突破所需灵气
      this.calculateRequiredQi()
    },
    // 分配灵根点数
    DistributePoints(key: keyof ElementSystem): void {
      if (this.element.unusedPoints > 0) {
        this.element[key]++ // 增加对应灵根点数
        this.element.unusedPoints-- // 减少剩余点数
      } else {
        alert('没有剩余点数可以分配！')
      }
    },
    // 轮回重置
    Reset() {
      // 停止战斗(如果正在战斗的话)
      this.stopBattle()

      this.realmStatus.majorRealm = 1 // 大境界（1-7对应文档境界体系）
      this.realmStatus.minorRealm = 1 // 小境界（1-9）
      this.calculateRequiredQi() // 计算当前突破所需灵气
      this.realmStatus.breakthroughAttempts = 0 // 当前连续渡劫突破失败次数（用于衰减补偿）
      this.qiSystem.currentQi = 0 // 当前积累灵气值
      this.qiSystem.concentrationFactor = 1.0 // 当前灵气浓度（0.0-1.0）
      this.qiSystem.lastUpdateTime = new Date().getTime() // 用于离线收益计算
      this.qiSystem.autoGainPerSec = 1 // 自动挂机速率（根据灵根计算）
      this.element.metalPoints = 0
      this.element.woodPoints = 0
      this.element.waterPoints = 0
      this.element.firePoints = 0
      this.element.earthPoints = 0
      this.element.unusedPoints = 5 // 剩余点数
      // 先天体质随机

      // 战斗属性重置
      this.combat.health.max = 100
      this.combat.health.current = 100
      this.combat.health.regenPerSec = 0.01
      this.combat.mp.max = 100
      this.combat.mp.current = 100
      this.combat.mp.regenPerSec = 0.01
      this.combat.attack.physical = 10
      this.combat.attack.magical = 10
      this.combat.defense.physical = 10
      this.combat.defense.magical = 10
      this.combat.speed.base = 1
      this.combat.speed.agility = 0
      this.combat.hitRate = 0.95 // 命中率
      this.combat.dodgeRate = 0.05 // 闪避率
      this.combat.critRate = 0.1 // 暴击率
      this.combat.critDamage = 2 // 暴击伤害倍率
      this.combat.recoveryTime = 60 // 复活时间
    },
    // 停止战斗
    stopBattle() {
      // 停止战斗逻辑
      console.log('停止战斗')
    },
    startUpdate() {
      if (this.timer == 0) this.timer = setInterval(this.updateTick, this.updateInterval)
    },
    stopUpdate() {
      clearInterval(this.timer)
      this.timer = 0
    },

    // 挂机逻辑
    updateTick() {
      this.qiSystem.currentQi += this.qiSystem.autoGainPerSec * this.qiSystem.concentrationFactor
      this.qiSystem.lastUpdateTime += this.updateInterval
    },
  },
  persist: true,
})
