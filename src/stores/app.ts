// stores/app.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', {
  state: () => ({
    activeTab: ref('/'),
    sidebar: {
      opened: false,
      withoutAnimation: false,
    },
  }),
  actions: {
    toggleSidebar() {
      this.sidebar.opened = !this.sidebar.opened
    },
    closeSidebar() {
      this.sidebar.opened = false
    },
  },
  persist: true,
})
