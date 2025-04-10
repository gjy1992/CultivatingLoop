// stores/bag.ts
import { defineStore } from 'pinia'
import { ItemDB } from './itemsdata/items'
import { useUserStore } from './user'

export interface BagItem {
  id: string
  amount: number
}

export const useBagStore = defineStore('bag', {
  state: () => ({
    items: [] as BagItem[],
  }),

  actions: {
    // 添加物品（自动堆叠）
    addItem(id: string, amount: number = 1) {
      const existing = this.items.find((item) => item.id === id)
      if (existing) {
        existing.amount += amount
      } else {
        this.items.push({ id, amount })
      }
      //功法自动学习
      if (id.startsWith('skill_')) {
        const skillname = ItemDB[id].metadata || ''
        const user = useUserStore()
        user.learnPassiveSkills(skillname)
      }
    },

    // 移除物品
    removeItem(id: string, amount: number = 1) {
      const index = this.items.findIndex((item) => item.id === id)
      if (index === -1) return false

      const item = this.items[index]
      if (item.amount < amount) return false

      item.amount -= amount
      if (item.amount === 0) this.items.splice(index, 1)
      return true
    },

    // 获取某个物品数量
    getItemAmount(id: string) {
      return this.items.find((item) => item.id === id)?.amount || 0
    },

    // 清空背包
    clearBag() {
      this.items = []
    },
  },
  persist: true,
})
