<script setup>
import { ref, onMounted } from 'vue'
import { get, set, STORES } from '../utils/db.js'

const isDark = ref(false)

onMounted(async () => {
  // 加载保存的主题
  const savedTheme = await get(STORES.SETTINGS, 'theme')
  if (savedTheme === 'dark') {
    isDark.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
  } else if (savedTheme === 'light') {
    isDark.value = false
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    // 跟随系统
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark.value = prefersDark
    if (prefersDark) {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }
})

const toggleTheme = async () => {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  await set(STORES.SETTINGS, 'theme', theme)
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
