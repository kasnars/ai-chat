<script setup>
import { ref, onMounted } from 'vue'
import { get, set, STORES } from '../utils/db.js'

const isDark = ref(false)

onMounted(async () => {
  const savedTheme = await get(STORES.SETTINGS, 'theme')
  console.log('[Theme] 加载的主题:', savedTheme)
  
  if (savedTheme === 'dark') {
    isDark.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
  } else if (savedTheme === 'light') {
    isDark.value = false
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
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
  <el-switch
    v-model="isDark"
    @change="toggleTheme"
    :active-icon="Moon"
    :inactive-icon="Sunny"
    inline-prompt
    style="--el-switch-on-color: #2c2f36; --el-switch-off-color: #f7f8fa;"
  />
</template>

<style scoped>
:deep(.el-switch) {
  margin: 0 8px;
}
</style>
