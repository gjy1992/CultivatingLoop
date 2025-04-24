<template>
  <div class="shop-page">
    <div v-for="(shop, index) in shopList" :key="index" class="shop-container">
      <!-- 商店标题 + 折叠按钮 -->
      <div class="shop-header" @click="toggleShop(index)">
        <button class="toggle-button">{{ shop.collapsed ? '▶' : '▼' }} {{ shop.name }}</button>
      </div>

      <div v-if="!shop.collapsed" class="item-grid">
        <el-tooltip
          v-for="(item, idx) in shop.items"
          :key="idx"
          effect="dark"
          :content="ItemDB[item.id]?.desc || '无描述'"
          placement="top"
        >
          <div class="item-card">
            <div class="item-name">{{ ItemDB[item.id]?.icon }} {{ ItemDB[item.id]?.name }}</div>
            <div class="item-info">
              数量：{{ item.amount }}<br />
              价格：{{ ItemDB[item.id]?.value }}
              {{ currencyNameMap[ItemDB[item.id]?.currencyType] }}
            </div>
            <button class="buy-button" @click="buy(item, shop)">购买</button>
          </div>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ItemDB } from '@/stores/itemsdata/items.ts'
import type { BaseItem } from '@/stores/itemsdata/items.ts'
import type { ResourcesSystem } from '@/stores/user'
import { useUserStore, currencyNameMap } from '@/stores/user'
import { useBagStore } from '@/stores/bag'
import { ElMessage } from 'element-plus'
import { useShopStore, type ShopData } from '@/stores/itemsdata/shopList'

// 注意路径按实际位置调整
const user = useUserStore()
const bag = useBagStore()
const shop = useShopStore()
const shopList = shop.shopdata

function toggleShop(index: number) {
  shopList[index].collapsed = !shopList[index].collapsed
}

function buy(itemdata: { id: string; amount: number }, shop: ShopData) {
  // 检查物品是否存在
  if (!ItemDB[itemdata.id]) {
    ElMessage.error('物品不存在')
    return
  }
  const item = ItemDB[itemdata.id]
  const cost = item.value
  const resType = item.currencyType

  const current = user.resources[resType]

  if (current >= cost) {
    user.resources[resType] -= cost
    // bag.addItem(item.id, item.amount)
    // item.amount是商店容量
    bag.addItem(item.id, 1)
    // 购买后减少商店物品数量
    itemdata.amount -= 1
    ElMessage.success(`购买成功，获得 ${item.name}`)
    if (itemdata.amount <= 0) {
      ElMessage.warning(`${item.name} 已售罄`)
      // 从商店中移除物品
      const index = shop.items.findIndex((i) => i.id === item.id)
      if (index !== -1) {
        shop.items.splice(index, 1)
      }
      if (shop.items.length === 0) {
        shop.collapsed = true
      }
    }
  } else {
    ElMessage.error(`${currencyNameMap[ItemDB[item.id]?.currencyType]}不足，无法购买 ${item.name}`)
  }
}
</script>

<style scoped>
.shop-page {
  background-color: #f0f0f0;
  width: 100%;
  min-width: 1200px;
  margin: 0 auto;
  border-radius: 15px;
  flex-shrink: 0;
  overflow-x: auto;
}

.shop-container {
  background: white;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid #ddd;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.shop-header {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 16px;
}

.toggle-button {
  font-size: 20px;
  padding: 4px 10px;
  border: 1px solid #aaa;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.item-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 12px;
  background-color: #f9f9f9;
  text-align: center;
}

.item-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-bottom: 8px;
}

.item-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.item-info {
  font-size: 14px;
  color: #555;
  margin-bottom: 8px;
}

.buy-button {
  padding: 6px 12px;
  background-color: #38a169;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.buy-button:hover {
  background-color: #2f855a;
}

.divider {
  margin-top: 24px;
  border-style: dashed;
}
</style>
