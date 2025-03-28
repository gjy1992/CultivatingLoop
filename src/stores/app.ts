// stores/app.ts
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebar: {
      opened: false,
      withoutAnimation: false
    }
  }),
  actions: {
    toggleSidebar() {
      this.sidebar.opened = !this.sidebar.opened
    },
    closeSidebar() {
      this.sidebar.opened = false
    }
  }
})