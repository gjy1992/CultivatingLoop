// src/stores/user.ts
import { defineStore } from 'pinia'
import { reactive, ref, type Reactive, type Ref } from 'vue'
import type { CombatAttributes, Buff } from '../buff'
import type { EnemyData } from '@/enemyData'
import EnemyList from '@/enemyData'
import type { AdventureMapData } from '@/AdvMap'
import AdventureMapList from '@/AdvMap'
import constitutionLists, { type Constitution, type ConstitutionData } from '@/Constitution'

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

// 实时战斗属性
interface BattleAttributes {
  // 输入数值
  original: CombatAttributes // 输入数值
  // 实时数值
  current: CombatAttributes // 实时数值
  // buff
  buffs: Buff[] // 增益效果
  // 掉落
  drops: string[] // 掉落物品
  dropProbs: number[] //掉落物品概率
  // 行动条进度
  actionBar: Ref<number> // 行动条进度（0-5）
  // 友方或敌方
  ally: boolean
  metadata: EnemyData
}

class BattleSystem {
  // 友方
  allies: BattleAttributes[] = [] // 友方
  // 敌方
  enemies: BattleAttributes[] = [] // 敌方

  result: number = -1 // 战斗结果（1-胜利，0-失败，-1-战斗中）

  // dt: number // 时间间隔（秒）
  update(dt: number) {
    // 更新所有单位的buff状态
    for (const unit of [...this.allies, ...this.enemies]) {
      let rawbufflength = unit.buffs.length // 记录buff数量
      for (const buff of unit.buffs) {
        buff.duration -= dt // 减少持续时间
        // 移除过期buff
        unit.buffs = unit.buffs.filter((b) => b.duration > 0)
      }
      // 如果buff数量减少了，则更新实时属性
      if (unit.buffs.length < rawbufflength) {
        unit.current = { ...unit.original } // 重置实时属性
        for (const buff of unit.buffs) {
          if (buff.effectFunc) {
            buff.effectFunc(unit.current) // 应用buff效果
          }
        }
      }
    }
    // 更新血量和蓝量
    for (const unit of [...this.allies, ...this.enemies]) {
      unit.current.health.current = Math.round(unit.current.health.current + unit.current.health.regenPerSec * dt);
      unit.current.mp.current = Math.round(unit.current.mp.current + unit.current.mp.regenPerSec * dt);
    }
    // 更新行动条进度
    const allUnits = [...this.allies, ...this.enemies]
    for (const unit of allUnits) {
      unit.actionBar.value += dt * unit.current.speed // 增加行动条进度
    }
    // 排序行动条，友方敌方一起排序
    allUnits.sort((a, b) => b.actionBar.value - a.actionBar.value)
    // 执行行动条
    for (const unit of allUnits) {
      if (unit.actionBar.value >= 5) {
        unit.actionBar.value -= 5 // 执行行动条
        // 执行技能或攻击逻辑
        this.executeAction(unit)
      }
    }
  }
  executeAction(unit: BattleAttributes) {
    // 选择目标
    let targets: BattleAttributes[] = []
    if (unit.ally) {
      targets = [this.enemies[Math.floor(Math.random() * this.enemies.length)]] // 随机选择敌方目标
    } else {
      targets = [this.allies[Math.floor(Math.random() * this.allies.length)]] // 随机选择友方目标
    }
    // 执行技能或攻击逻辑
    let tnames: string[] = []
    targets.forEach((a) => tnames.push(a.metadata.name))
    combatMgr.AddLog('执行行动:', unit.metadata.name, '对', tnames.join(' ')) // 添加日志
    // skill to do
    // 先普通攻击
    targets.forEach((target) => {
      const physical_damage = Math.max(
        0,
        unit.current.attack.physical - target.current.defense.physical,
      ) // 计算伤害
      const magical_damage = Math.max(
        0,
        unit.current.attack.magical - target.current.defense.magical,
      ) // 计算伤害
      // 计算命中率
      const hit = Math.random() < unit.current.hitRate // 命中
      const dodge = Math.random() < target.current.dodgeRate // 闪避
      const crit = Math.random() < unit.current.critRate // 暴击
      if (hit && !dodge) {
        let damage = physical_damage + magical_damage // 计算伤害
        if (crit) {
          damage *= unit.current.critDamage // 计算暴击伤害
        }
        const 无敌 = target.buffs.find((a) => a.name == '无敌')
        if (无敌 === undefined) target.current.health.current -= damage // 扣除目标生命值
        combatMgr.AddLog(
          '攻击成功，造成伤害:',
          damage,
          '其中物理伤害:',
          physical_damage,
          '魔法伤害:',
          magical_damage,
          无敌 ? '但是目标无敌' : '',
        )
      } else if (dodge) {
        combatMgr.AddLog('攻击被闪避')
      } else {
        combatMgr.AddLog('攻击未命中')
      }
      // 计算目标死亡
      if (target.current.health.current <= 0) {
        target.current.health.current = 0 // 设置目标生命值为0
        combatMgr.AddLog('目标死亡', target.metadata.name) // 添加日志
        // 执行死亡逻辑
        this.executeDeath(target)
      }
    })
  }
  executeDeath(unit: BattleAttributes) {
    // 执行死亡逻辑
    //console.log('单位死亡:', unit)
    // 移除单位
    if (unit.ally) {
      this.allies = this.allies.filter((u) => u !== unit) // 移除友方单位
    } else {
      this.enemies = this.enemies.filter((u) => u !== unit) // 移除敌方单位
    }
    // 检查战斗结果
    if (this.allies.length === 0) {
      this.result = 0 // 失败
    } else if (this.enemies.length === 0) {
      this.result = 1 // 胜利
    } else {
      this.result = -1 // 战斗中
    }
  }
}

class AdventureCombat {
  currentMap: AdventureMapData | null = null // 当前地图数据
  battleSystem: BattleSystem | null = null // 战斗系统
  battleTimer: number = 0 // 战斗定时器
  battleInterval: number = 100 // 战斗更新间隔（毫秒）
  battleLog: Reactive<string[]> = [] // 战斗日志

  constructor() {
    this.battleSystem = new BattleSystem()
  }

  AddLog(...log: any[]) {
    // 添加战斗日志
    this.battleLog.push(log.join(',')) // 将日志添加到战斗日志中
    //console.log(this.battleLog)
    // 限制日志数量
    if (this.battleLog.length > 20) {
      this.battleLog.shift() // 删除最旧的日志
    }
  }

  generateEnemies(enemyData: string[]): BattleAttributes[] {
    // 生成敌人列表
    const enemies: BattleAttributes[] = []
    // 生成本关难度，在difficulty±sqrt(difficulty)范围内
    let difficulty =
      (this.currentMap?.difficulty || 0) -
      Math.sqrt(this.currentMap?.difficulty || 0) +
      Math.floor(Math.random() * 2 * Math.sqrt(this.currentMap?.difficulty || 0)) // 随机难度
    if (difficulty <= 0) difficulty = 1
    this.AddLog('current difficulty', difficulty)
    // 根据难度生成敌人
    let totalDiff = 0
    while (totalDiff < difficulty) {
      const enemyName = enemyData[Math.floor(Math.random() * enemyData.length)] // 随机选择敌人
      const enemy = EnemyList[enemyName] // 获取敌人数据
      const enemyAttributes: BattleAttributes = {
        original: { ...enemy.attributes },
        current: reactive<CombatAttributes>({ ...enemy.attributes }),
        buffs: reactive<Buff[]>([]), // 增益效果
        drops: this.currentMap?.drops || [], // 掉落物品
        dropProbs: this.currentMap?.dropProbs || [], // 掉落概率
        actionBar: ref(0), // 行动条进度（0-5）
        ally: false, // 敌人
        metadata: enemy,
      }
      enemies.push(enemyAttributes)
      totalDiff += enemy.strength // 增加总难度
    }
    return enemies
  }

  startAdventure(mapData: AdventureMapData, name: string, playerData: CombatAttributes) {
    this.currentMap = mapData
    this.startCurrentBattle(name, playerData)
  }

  startCurrentBattle(name: string, playerData: CombatAttributes) {
    // 生成敌人列表
    const enemies = this.generateEnemies(this.currentMap?.enemies || [])
    this.battleSystem = new BattleSystem()
    this.battleSystem.enemies = enemies // 设置敌人列表
    // 设置友方列表
    const player: BattleAttributes = {
      original: playerData,
      current: reactive<CombatAttributes>({ ...playerData }),
      buffs: reactive<Buff[]>([]), // 增益效果
      drops: [], // 玩家没有掉落物品
      dropProbs: [],
      actionBar: ref(0), // 行动条进度（0-5）
      ally: true, // 玩家是友方
      metadata: {
        name: name,
        description: '',
        attributes: playerData,
        strength: 0,
      },
    }
    this.battleSystem.allies = [player]
    this.battleSystem.result = -1 // 战斗中
    // console.log(this.stopBattle)
    //this.battleUpdate()
    // console.log(this.stopBattle)
    // 开始战斗
    //this.battleTimer = setInterval(this.battleUpdate, this.battleInterval) // 开始战斗定时器
  }

  battleUpdate() {
    if (this.battleSystem) {
      this.battleSystem.update(this.battleInterval / 1000) // 更新战斗系统
      if (this.battleSystem.result !== -1) {
        console.log('战斗结果:', this.battleSystem.result) // 输出战斗结果
        this.stopBattle() // 停止战斗
      }
    }
  }

  stopBattle() {
    this.battleSystem = null // 清空战斗系统
    this.currentMap = null // 清空当前地图数据
  }
}

const combatMgr = new AdventureCombat() // 战斗管理器实例
export { combatMgr } // 导出战斗管理器实例

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
      speed: 1,
      hitRate: 0.95, // 命中率
      dodgeRate: 0.05, // 闪避率
      critRate: 0.1, // 暴击率
      critDamage: 2, // 暴击伤害倍率
      recoveryTime: 60, // 复活时间
    }),
    updateInterval: 1000, // 更新间隔（毫秒）
    constitutions: reactive<ConstitutionData[]>([]), //体质
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
      let P_success = Math.min(1, (1 / (1 + Math.exp(-(0.1 * total + α)))) * (1 + maxKH / 100))
      if (this.constitutions.find((a) => a.name == '天灵根') !== undefined)
        P_success = Math.min(1, P_success + 0.1)
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
      this.element.unusedPoints += 1 // 增加剩余点数
      this.combat.health.max += 10 // 增加最大生命值
      this.combat.mp.max += 10 // 增加最大蓝量
      this.combat.health.current = this.combat.health.max // 重置当前生命值
      this.combat.mp.current = this.combat.mp.max // 重置当前蓝量
      this.combat.attack.physical += 1 // 增加物理攻击
      this.combat.attack.magical += 1 // 增加魔法攻击
      // 如果小境界大于9，则增加大境界并重置小境界
      if (this.realmStatus.minorRealm > 9) {
        let r = this.calcBreakthroughResult()
        if (r === 1) {
          this.realmStatus.majorRealm++ // 增加大境界
          this.realmStatus.minorRealm = 1 // 重置小境界
          this.realmStatus.breakthroughAttempts = 0 // 重置突破失败次数
          this.element.unusedPoints += 5 // 增加剩余点数
          this.combat.health.max += 90 // 增加最大生命值
          this.combat.mp.max += 90 // 增加最大蓝量
          this.combat.health.current = this.combat.health.max // 重置当前生命值
          this.combat.mp.current = this.combat.mp.max // 重置当前蓝量
          this.combat.attack.physical += 9 // 增加物理攻击
          this.combat.attack.magical += 9 // 增加魔法攻击
          this.combat.defense.physical += 3 // 增加物理防御
          this.combat.defense.magical += 3 // 增加魔法防御
          //todo，随机获得先天体质
          const c = this.GetRandomConstitution()
          console.log('获得体质：', c)
          this.GetConstitution(c)
        } else if (r === 0) {
          this.realmStatus.breakthroughAttempts++ // 增加突破失败次数
        } else {
          alert('渡劫失败，你反而跌落了一个境界')
          if (this.realmStatus.majorRealm > 0) {
            this.realmStatus.majorRealm-- // 减少大境界
          }
          this.realmStatus.minorRealm = 1 // 重置小境界
          this.realmStatus.breakthroughAttempts = 0 // 重置突破失败次数
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
      switch (key) {
        case 'metalPoints':
          this.combat.attack.physical += 1 // 增加物理攻击
          break
        case 'firePoints':
          this.combat.attack.magical += 1 // 增加魔法攻击
          this.combat.critDamage += 0.01 //增加爆伤
          break
        case 'waterPoints':
          this.combat.health.regenPerSec += 0.01 // 增加生命回复
          {
            let ac = this.constitutions.find((a) => a.name == '先天道体')
            if (ac !== undefined) this.combat.health.regenPerSec += 0.005 * ac.level
          }
          break
        case 'woodPoints':
          this.combat.defense.magical += 1 // 增加魔法防御
          break
        case 'earthPoints':
          this.combat.defense.physical += 1 // 增加物理防御
          break
      }
    },
    //获得一个随机体质的名称
    GetRandomConstitution() {
      const keys = Object.keys(constitutionLists)
      const randomIndex = Math.floor(Math.random() * keys.length)
      return keys[randomIndex]
    },
    //获得体质
    GetConstitution(name: string) {
      const c = constitutionLists[name]
      if (c === undefined) {
        alert('体质名称不对')
      } else {
        const ac = this.constitutions.find((a) => a.name == name)
        if (ac === undefined) {
          this.constitutions.push({ name: c.name, level: 1 })
          if (c.apply) {
            c.apply(this, 1)
          }
        } else if (c.canLevelUp) {
          ac.level += 1
          if (c.apply) {
            c.apply(this, ac.level)
          }
        }
      }
    },
    // 轮回重置
    Reset() {
      // 停止战斗(如果正在战斗的话)
      this.stopBattle()

      if (this.constitutions.find((a) => a.name == '轮回圣体') === undefined) {
        this.realmStatus.majorRealm = 1 // 大境界（1-7对应文档境界体系）
        this.realmStatus.minorRealm = 1 // 小境界（1-9）
      } else {
        let lv = (this.realmStatus.majorRealm - 1) * 10 + this.realmStatus.minorRealm - 1
        lv = Math.round(lv * 0.3)
        this.realmStatus.majorRealm = Math.floor(lv / 10) + 1
        this.realmStatus.minorRealm = lv - 10 * (this.realmStatus.majorRealm - 1) + 1
      }
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
      let prob = 0.1
      this.constitutions = this.constitutions.filter(() => Math.random() < prob)

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
      this.combat.speed = 1
      this.combat.hitRate = 0.95 // 命中率
      this.combat.dodgeRate = 0.05 // 闪避率
      this.combat.critRate = 0.1 // 暴击率
      this.combat.critDamage = 2 // 暴击伤害倍率
      this.combat.recoveryTime = 60 // 复活时间
    },
    // 停止战斗
    stopBattle() {
      // 停止战斗逻辑
      combatMgr.stopBattle() // 停止战斗
    },

    // 挂机逻辑
    updateTick() {
      let coef = 1
      if (this.constitutions.find((a) => a.name == '天灵根') !== undefined) coef += 2
      if (this.constitutions.find((a) => a.name == '先天道体') !== undefined) coef += 1
      this.qiSystem.currentQi +=
        coef * this.qiSystem.autoGainPerSec * this.qiSystem.concentrationFactor
      this.qiSystem.lastUpdateTime += this.updateInterval
    },

    enterAdvMap(mapData: AdventureMapData) {
      combatMgr.startAdventure(mapData, this.name, this.combat) // 开始冒险战斗
      return combatMgr.battleSystem
    },
  },
  persist: true,
})

export type UserStoreType = ReturnType<typeof useUserStore>
