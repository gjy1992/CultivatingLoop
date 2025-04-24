import type { ResourcesSystem } from '@/stores/user'
import { ItemDB } from './items'
import { defineStore } from 'pinia'
import { reactive } from 'vue'
export interface ShopItemData {
  id: string
  price: number
  amount: number
  desc: string
}

export interface Shop {
  name: string
  currency: string
  collapsed: boolean
  items: ShopItemData[]
}

export type ShopData = Omit<Shop, 'items'> & { items: { id: string; amount: number }[] }

export const useShopStore = defineStore('shop', {
  state: () => ({
    shopdata: reactive<ShopData[]>([
      {
        name: '铜币商店',
        currency: '铜币',
        collapsed: false,
        items: [
          { id: 'pill_001', amount: 10 },
          { id: 'equip_001', amount: 1 },
          { id: 'skill_001', amount: 1 },
        ],
      },
      {
        name: '灵石商店',
        currency: '下品灵石',
        collapsed: true,
        items: [{ id: 'pill_002', amount: 1 }],
      },
      {
        name: '宗门商店',
        currency: '宗门贡献',
        collapsed: true,
        items: [],
      },
    ]),
  }),

  actions: {
    // reset
    reset() {
      this.shopdata = reactive<ShopData[]>([
        {
          name: '铜币商店',
          currency: '铜币',
          collapsed: false,
          items: [
            { id: 'pill_001', amount: 10 },
            { id: 'equip_001', amount: 1 },
            { id: 'skill_001', amount: 1 },
          ],
        },
        {
          name: '灵石商店',
          currency: '下品灵石',
          collapsed: true,
          items: [{ id: 'pill_002', amount: 1 }],
        },
        {
          name: '宗门商店',
          currency: '宗门贡献',
          collapsed: true,
          items: [],
        },
      ])
    },
  },
  persist: true,
})
