// src/stores/user.ts
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '无名修士',
    level: 1,
    cultivation: 0
  }),
  actions: {
    levelUp() {
      this.level++
      this.cultivation = 0
    }
  },
  persist: true
})

export const useSpiritStore = defineStore('spirit', () => {
  const concentration = ref(1.0)
  const elementBalance = reactive({金:5, 木:3})

  function absorbSpirit(value: number) {
    concentration.value += value
  }

  const initSpiritualData = () => {
    concentration.value = 0.85
    elementBalance.金 = 4
    elementBalance.木 = 3
  }

  return { concentration, elementBalance, absorbSpirit, initSpiritualData }
}, { persist: true })

// In the above code, we define two stores: user and spirit. The user store contains the user's name, level, and cultivation. The spirit store contains the user's concentration and element balance. Both stores have the persist option set to true, which means that their state will be persisted across page reloads.