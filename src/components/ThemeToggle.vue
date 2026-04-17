<script setup>
import { ref, onMounted, watch } from 'vue'
import { get, set, STORES } from '../utils/db.js'
import { ElMessage } from 'element-plus'

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
  const newTheme = isDark.value ? 'dark' : 'light'
  console.log('[Theme] 切换主题:', newTheme)
  document.documentElement.setAttribute('data-theme', newTheme)
  const result = await set(STORES.SETTINGS, 'theme', newTheme)
  console.log('[Theme] 保存结果:', result)
  ElMessage.success(`已切换到${newTheme === 'dark' ? '深色' : '浅色'}模式喵～✨`)
}
</script>

<template>
  <el-tooltip :content="isDark ? '切换到浅色模式' : '切换到深色模式'" placement="bottom">
    <el-switch
      v-model="isDark"
      @change="toggleTheme"
      :active-icon="Moon"
      :inactive-icon="Sunny"
      inline-prompt
      size="large"
      style="--el-switch-on-color: #2c2f36; --el-switch-off-color: #f7f8fa;"
    />
  </el-tooltip>
</template>

<style scoped>
:deep(.el-switch) {
  margin: 0 8px;
}
</style>
