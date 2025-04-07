<template>
  <div class="debug-view">
    <h1>Debug Page</h1>
    <button @click="increaseAura">增加灵气</button>
    <button @click="increaseFiveElements">增加五行点数</button>
  </div>
</template>

<script>
import { useUserStore } from '@/stores/user'

export default {
  name: 'DebugView',
  data() {
    return {
      player: useUserStore(),
    }
  },
  methods: {
    increaseAura() {
      console.log('增加灵气')
      // Add your logic to increase aura here
      this.player.qiSystem.currentQi += 100000
    },
    increaseFiveElements() {
      console.log('增加五行点数')
      // Add your logic to increase five elements points here
      this.player.element.unusedPoints += 1000
    },
  },
}
</script>

<style scoped>
.debug-view {
  padding: 20px;
}
button {
  margin: 10px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>
