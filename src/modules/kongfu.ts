import type { BattleAttributes, ElementType, UserStoreType } from '@/stores/user'
import BuffList from './buff'

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
  baseExpReq: number //基础熟练度
  ExpReqCoef: number //熟练度倍率
  canLevelUp: boolean //可升级
  maxKongfuLevel: number //最大等级
  extraEffect?: (
    allies: BattleAttributes[],
    enemies: BattleAttributes[],
    targets: BattleAttributes[],
  ) => void // 额外效果
  unlock?: (user: UserStoreType) => boolean // 解锁条件（可选）
  canSee?: (user: UserStoreType) => boolean // 出现在选择列表里的条件
}

// 参考魔法学徒的设计，五行点按统一公式影响技能效果（不再逐技能判断），并决定是否能解锁技能

export function KongFuReqExp(KF: KongFu, level: number) {
  return KF.baseExpReq * Math.pow(KF.ExpReqCoef, level - 1)
}

interface KongFuData {
  name: string // 名称
  level: number // 等级
  exp: number //当前熟练度
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
    baseExpReq: 0,
    ExpReqCoef: 1,
    canLevelUp: false,
    maxKongfuLevel: 1,
  },
  赤炎焚天诀: {
    name: '赤炎焚天诀',
    description: '凝聚地火之力形成火龙冲击，对单个敌人造成灼烧效果',
    minLevel: 3,
    mp_cost: 120,
    cooldown: 15,
    dmgType: 'magic',
    elementType: 'firePoints',
    damage: 4.8,
    targetNumber: 1,
    targetAttr: 'dmg',
    target: 'enemy',
    levelbonus: 0.3,
    baseExpReq: 100,
    ExpReqCoef: 1.5,
    canLevelUp: true,
    maxKongfuLevel: 10,
    extraEffect(allies, enemies, targets) {
      const buffTemplate = { ...BuffList['灼烧'] }
      buffTemplate.value = 1
      buffTemplate.source = '赤炎焚天诀'
      buffTemplate.duration = 5
      targets.forEach((a) => {
        // 移除旧的
        let idx = a.buffs.findIndex((b) => b.source == '赤炎焚天诀')
        if (idx >= 0) a.buffs.splice(idx, 1)
        a.buffs.push({ ...buffTemplate })
      })
    },
  },
  青木回春术: {
    name: '青木回春术',
    description: '催动草木精华恢复自身气血，可解除轻度负面状态',
    minLevel: 2,
    mp_cost: 80,
    cooldown: 8,
    dmgType: 'magic',
    elementType: 'none',
    damage: 1.5,
    targetNumber: 1,
    targetAttr: 'heal_hp',
    target: 'self',
    levelbonus: 0.2,
    baseExpReq: 90,
    ExpReqCoef: 1.2,
    canLevelUp: true,
    maxKongfuLevel: 8,
  },
  玄冰破: {
    name: '玄冰破',
    description: '凝水成冰形成穿透性冰锥，有30%概率造成冰冻效果',
    minLevel: 4,
    mp_cost: 150,
    cooldown: 12,
    dmgType: 'magic',
    elementType: 'waterPoints',
    damage: 3.2,
    targetNumber: 3,
    targetAttr: 'dmg',
    target: 'enemy',
    levelbonus: 0.25,
    baseExpReq: 110,
    ExpReqCoef: 1.8,
    canLevelUp: true,
    maxKongfuLevel: 12,
    extraEffect(allies, enemies, targets) {
      const buffTemplate = { ...BuffList['眩晕'] }
      buffTemplate.source = '玄冰破'
      buffTemplate.duration = 3
      targets.forEach((a) => {
        if (Math.random() > 0.3) return //30%概率
        // 移除旧的
        let idx = a.buffs.findIndex((b) => b.source == '玄冰破')
        if (idx >= 0) a.buffs.splice(idx, 1)
        a.buffs.push({ ...buffTemplate })
      })
    },
  },
  金刚伏魔拳: {
    name: '金刚伏魔拳',
    description: '灌注佛门金刚之力近战攻击，破除敌方护体罡气',
    minLevel: 5,
    mp_cost: 200,
    cooldown: 18,
    dmgType: 'physical',
    elementType: 'none',
    damage: 5.0,
    targetNumber: 1,
    targetAttr: 'dmg',
    target: 'enemy',
    levelbonus: 0.35,
    baseExpReq: 120,
    ExpReqCoef: 2.0,
    canLevelUp: true,
    maxKongfuLevel: 15,
  },
  裂地撼山击: {
    name: '裂地撼山击',
    description: '引发地震冲击波，对全体造成土系伤害并附加减速效果，施法者获得防御强化',
    minLevel: 2,
    mp_cost: 80,
    cooldown: 15,
    dmgType: 'magic',
    elementType: 'earthPoints',
    damage: 3.5,
    targetNumber: 'all',
    targetAttr: 'dmg',
    target: 'enemy',
    levelbonus: 0.2,
    baseExpReq: 90,
    ExpReqCoef: 1.2,
    canLevelUp: false,
    maxKongfuLevel: 1,
  },
  血影连环刺: {
    name: '血影连环刺',
    description: '对3个目标发动高速穿刺攻击，造成伤害的15%转化为自身生命值',
    minLevel: 1,
    mp_cost: 50,
    cooldown: 8,
    dmgType: 'physical',
    elementType: 'metalPoints',
    damage: 2.8,
    targetNumber: 3,
    targetAttr: 'dmg',
    target: 'enemy',
    levelbonus: 0.15,
    baseExpReq: 80,
    ExpReqCoef: 1.1,
    canLevelUp: false,
    maxKongfuLevel: 1,
  },
  焚身业火: {
    name: '焚身业火',
    description: '对随机2名敌人施加持续灼烧，每秒造成火焰伤害并可能触发斩杀效果',
    minLevel: 3,
    mp_cost: 120,
    cooldown: 12,
    dmgType: 'magic',
    elementType: 'firePoints',
    damage: 4.2,
    targetNumber: 2,
    targetAttr: 'dmg',
    target: 'enemy',
    levelbonus: 0.3,
    baseExpReq: 110,
    ExpReqCoef: 1.5,
    canLevelUp: false,
    maxKongfuLevel: 1,
  },
  千足瘴云: {
    name: '千足瘴云',
    description: '释放覆盖全场的剧毒云雾，可叠加中毒效果并提升暴击几率',
    minLevel: 5,
    mp_cost: 200,
    cooldown: 25,
    dmgType: 'magic',
    elementType: 'woodPoints',
    damage: 3.2,
    targetNumber: 'all',
    targetAttr: 'dmg',
    target: 'enemy',
    levelbonus: 0.05,
    baseExpReq: 120,
    ExpReqCoef: 2.0,
    canLevelUp: false,
    maxKongfuLevel: 1,
  },
}

export default KongFuList
export type { KongFu, KongFuData }
