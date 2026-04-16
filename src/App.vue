<script setup>
import { ref, onMounted, computed } from 'vue'
import ChatBox from './components/ChatBox.vue'
import SettingsModal from './components/SettingsModal.vue'

// 配置状态
const config = ref({
  apiUrl: '',
  apiKey: '',
  model: 'qwen-plus'
})

const showSettings = ref(false)
const isFirstTime = ref(false)

// 检查是否是首次访问
onMounted(() => {
  const savedConfig = localStorage.getItem('ai-chat-config')
  if (!savedConfig) {
    isFirstTime.value = true
    showSettings.value = true
  } else {
    config.value = JSON.parse(savedConfig)
  }
})

// 保存配置
const saveConfig = (newConfig) => {
  config.value = newConfig
  localStorage.setItem('ai-chat-config', JSON.stringify(newConfig))
  showSettings.value = false
}

// 打开设置
const openSettings = () => {
  showSettings.value = true
}

// 是否有有效配置
const hasConfig = computed(() => {
  return config.value.apiUrl && config.value.apiKey
})
</script>

<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-content">
        <h1 class="title">🤖 AI Chat</h1>
        <button @click="openSettings" class="settings-btn" title="设置">
          ⚙️ 设置
        </button>
      </div>
    </header>

    <!-- 聊天区域 -->
    <main class="main-content">
      <ChatBox 
        v-if="hasConfig" 
        :api-url="config.apiUrl" 
        :api-key="config.apiKey"
        :model="config.model"
      />
      <div v-else class="no-config-tip">
        <p>请先配置 AI API 信息</p>
        <button @click="openSettings" class="primary-btn">去设置</button>
      </div>
    </main>

    <!-- 设置模态框 -->
    <SettingsModal
      v-model="showSettings"
      :config="config"
      @save="saveConfig"
    />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .app-container {
    height: 100vh;
  }
}

/* 头部 */
.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  padding: 1rem 1.5rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.settings-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #667eea;
  border-radius: 8px;
  background: white;
  color: #667eea;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.settings-btn:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

/* 主内容区 */
.main-content {
  flex: 1;
  overflow: hidden;
  padding: 1rem;
}

.no-config-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
}

.no-config-tip p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 1.5rem;
}

.primary-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}
</style>
