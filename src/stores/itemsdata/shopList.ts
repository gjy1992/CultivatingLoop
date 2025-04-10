import type { ResourcesSystem } from '@/stores/user'
import { ItemDB } from './items'
export interface ShopItemData {
  id: string
  price: number
  amount: number
  desc: string
}

export interface Shop {
  name: string
  currency: string
  currencyType: keyof ResourcesSystem
  collapsed: boolean
  items: ShopItemData[]
}

const rawShopList: (Omit<Shop, 'items'> & { items: { id: string; amount: number }[] })[] = [
  {
    name: '铜币商店',
    currency: '铜币',
    currencyType: 'money',
    collapsed: false,
    items: [
      { id: 'pill_001', amount: 10 },
      { id: 'equip_001', amount: 1 },
    ],
  },
  {
    name: '灵石商店',
    currency: '下品灵石',
    currencyType: 'magicStoneLow',
    collapsed: true,
    items: [{ id: 'pill_002', amount: 1 }],
  },
  {
    name: '宗门商店',
    currency: '宗门贡献',
    currencyType: 'contribution',
    collapsed: true,
    items: [{ id: 'skill_001', amount: 1 }],
  },
]

// 最终导出带价格的 ShopList
export const ShopList: (Shop & {
  items: {
    id: string
    name: string
    icon: string
    price: number
    amount: number
    desc: string
  }[]
})[] = rawShopList.map((shop) => ({
  ...shop,
  items: shop.items.map((item) => {
    const itemInfo = ItemDB[item.id]
    return {
      id: item.id,
      name: itemInfo.name,
      icon: itemInfo.icon,
      price: itemInfo.value, // ✅ 从 ItemDB 里取
      amount: item.amount,
      desc: itemInfo.desc,
    }
  }),
}))
