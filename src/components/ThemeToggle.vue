<script setup>
import { ref, onMounted } from 'vue'
import { get, set, STORES } from '../utils/db.js'

const isDark = ref(false)

onMounted(async () => {
  // 加载保存的主题
  const savedTheme = await get(STORES.SETTINGS, 'theme')
  console.log('[Theme] 加载的主题:', savedTheme)
  
  if (savedTheme === 'dark') {
    isDark.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
  } else if (savedTheme === 'light') {
    isDark.value = false
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    // 跟随系统
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    console.log('[Theme] 系统偏好:', prefersDark)
    isDark.value = prefersDark
    if (prefersDark) {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }
})

const toggleTheme = async () => {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  console.log('[Theme] 切换主题:', theme)
  document.documentElement.setAttribute('data-theme', theme)
  const result = await set(STORES.SETTINGS, 'theme', theme)
  console.log('[Theme] 保存结果:', result)
}
</script>

<template>
  <button @click="toggleTheme" class="theme-toggle" :title="isDark ? '切换到浅色模式' : '切换到深色模式'">
    <span class="theme-icon">{{ isDark ? '☀️' : '🌙' }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--bg-tertiary);
  border-radius: 8px;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--text-primary);
}

.theme-toggle:hover {
  background: var(--border);
  transform: scale(1.05);
}
</style>
