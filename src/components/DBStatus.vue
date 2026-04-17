<script setup>
import { ref, onMounted } from 'vue'
import { isFallbackMode, getStorageStats } from '../utils/db.js'

const stats = ref({
  mode: 'loading',
  stores: {}
})

onMounted(async () => {
  const s = await getStorageStats()
  stats.value = s
})

const modeColor = {
  'IndexedDB': '#5b8ff9',
  'localStorage': '#f59e0b',
  'loading': '#8f959e'
}

const modeIcon = {
  'IndexedDB': '💾',
  'localStorage': '📝',
  'loading': '⏳'
}
</script>

<template>
  <div class="db-status">
    <span 
      class="mode-badge"
      :style="{ backgroundColor: modeColor[stats.mode] || '#8f959e' }"
      :title="stats.mode === 'localStorage' ? '降级模式：IndexedDB 不可用' : '正常模式'"
    >
      {{ modeIcon[stats.mode] || '⏳' }} {{ stats.mode }}
    </span>
    <span class="store-count" v-if="stats.mode !== 'loading'">
      {{ Object.values(stats.stores).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) }} 条数据
    </span>
  </div>
</template>

<style scoped>
.db-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f7f8fa;
  border-radius: 8px;
  font-size: 0.75rem;
  color: #646a73;
}

.mode-badge {
  padding: 4px 8px;
  border-radius: 4px;
  color: white;
  font-weight: 500;
  font-size: 0.7rem;
}

.store-count {
  color: #8f959e;
}
</style>
