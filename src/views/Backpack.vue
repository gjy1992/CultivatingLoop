<template>
    <div class="backpack-overlay" v-if="innerVisible">
        <div class="backpack-container">
            <div class="header">
                <span>背包</span>
                <button @click="close">×</button>
            </div>
            <div class="grid-container">
                <div v-for="item in enrichedItems" :key="item.id" class="item-slot" @mouseenter="hoveredItem = item.id"
                    @mouseleave="hoveredItem = null">
                    <div class="name">{{ item.icon }}</div>
                    <div class="name">{{ item.name }}</div>
                    <div class="amount">x{{ item.amount }}</div>

                    <!-- 出售浮窗 -->
                    <div v-if="hoveredItem === item.id" class="sell-tooltip" @click="openSellDialog(item)">
                        出售
                    </div>
                </div>
                <div v-for="n in emptySlotCount" :key="'empty-' + n" class="item-slot empty"></div>
            </div>
        </div>
    </div>

    <!-- 出售弹窗 -->
    <el-dialog v-model="sellDialogVisible" title="出售物品" width="300px" :append-to-body="true">
        <template #default>
            <div>你想出售多少个「{{ sellingItem?.name }}」？（最多{{ sellingItem?.amount }}）</div>
            <el-input v-model.number="sellAmount" type="number" :min="1" :max="sellingItem?.amount"
                style="margin-top: 12px" />
        </template>

        <template #footer>
            <el-button @click="sellDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="confirmSell">确认出售</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits, ref } from 'vue'
import { useBagStore } from '@/stores/bag'
import { ItemDB } from '@/stores/itemsdata/items'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { currencyNameMap } from '@/stores/user'
import type { ResourcesSystem, } from '@/stores/user'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close'])

const hoveredItem = ref<string | null>(null)
const user = useUserStore()
const bag = useBagStore()

const innerVisible = computed(() => props.visible)

const enrichedItems = computed(() =>
    bag.items.map(item => ({
        ...ItemDB[item.id],
        amount: item.amount,
    }))
)

const totalSlots = 30
const emptySlotCount = computed(() => totalSlots - bag.items.length)

function close() {
    emit('close')
}

// 弹窗控制
const sellDialogVisible = ref(false)
const sellingItem = ref<any>(null)
const sellAmount = ref(1)

function openSellDialog(item: any) {
    sellingItem.value = item
    sellAmount.value = 1
    sellDialogVisible.value = true
}

function confirmSell() {
    const item = sellingItem.value
    const quantity = Math.min(sellAmount.value, item.amount)
    const unitPrice = Math.floor(item.value / 2)

    const bagItem = bag.items.find(i => i.id === item.id)
    if (bagItem && bagItem.amount >= quantity) {
        bagItem.amount -= quantity

        const totalValue = unitPrice * quantity
        const currencyType = item.currencyType as keyof ResourcesSystem


        user.resources[currencyType] += totalValue

        if (bagItem.amount === 0) {
            bag.items = bag.items.filter(i => i.id !== item.id)
        }

        ElMessage.success(`成功售出 ${item.name} x${quantity}，获得 ${unitPrice * quantity} ${currencyNameMap[currencyType]}`)
    }

    sellDialogVisible.value = false
}
</script>

<style scoped>
.backpack-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    /* 不设 z-index，Element Plus 弹窗自己顶上去 */
    display: flex;
    justify-content: center;
    align-items: center;
}

.backpack-container {
    background: white;
    border-radius: 12px;
    width: 600px;
    padding: 16px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
}

.header {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    margin-bottom: 12px;
}

.grid-container {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
}

.item-slot {
    background: #f7f7f7;
    border: 1px solid #ddd;
    border-radius: 6px;
    text-align: center;
    padding: 8px;
    position: relative;
}

.item-slot.empty {
    background: #eaeaea;
}

.name {
    font-size: 14px;
    margin-top: 4px;
}

.amount {
    font-size: 12px;
    color: #666;
}

.sell-tooltip {
    position: absolute;
    top: 4px;
    right: 4px;
    background: #f6f6d1;
    border: 1px solid #aaa;
    border-radius: 6px;
    font-size: 12px;
    padding: 4px 6px;
    cursor: pointer;
    z-index: 10;
    white-space: nowrap;
    box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.1);
}

.sell-tooltip:hover {
    background-color: #f1f1aa;
}
</style>
