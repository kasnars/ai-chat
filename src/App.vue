<script setup>
import { ref, onMounted, computed } from 'vue'
import ChatBox from './components/ChatBox.vue'
import SettingsModal from './components/SettingsModal.vue'
import { initDB, get, set, migrateFromLocalStorage, isFallbackMode, getStorageStats, STORES } from './utils/db.js'

// 配置状态
const config = ref({
  apiUrl: '',
  apiKey: '',
  model: 'qwen-plus'
})

// 角色列表（最多 4 个）
const characters = ref([
  { id: 1, name: 'Kira', enabled: true, description: '刚毕业的女大学生，活泼可爱', style: '活泼开朗、可爱', quirks: '喜欢用"喵"口癖', emoji: '✨💖🐱', apiIndex: 0 },
  { id: 2, name: '小智', enabled: true, description: '理性专业的助手', style: '简洁、专业', quirks: '无特殊口癖', emoji: '🤖💡', apiIndex: 0 },
  { id: 3, name: '暖暖', enabled: true, description: '温柔体贴的大姐姐', style: '温柔、耐心', quirks: '喜欢用"呢"、"哦"', emoji: '🌸💕', apiIndex: 0 },
  { id: 4, name: '博士', enabled: false, description: '知识渊博的学者', style: '严谨、学术', quirks: '喜欢引用数据', emoji: '📚🔬', apiIndex: 0 }
])

// 当前选中的角色（null 表示群聊模式）
const selectedCharacterId = ref(null)

const showSettings = ref(false)
const sidebarCollapsed = ref(false)
const showMobileSidebar = ref(false)

// 检查是否是首次访问
onMounted(async () => {
  // 初始化数据库
  await initDB()
  
  // 尝试迁移 localStorage 数据
  if (!isFallbackMode()) {
    await migrateFromLocalStorage()
  }
  
  // 加载配置
  const savedConfig = await get(STORES.CONFIG, 'main')
  if (savedConfig) {
    config.value = savedConfig
  }
  
  // 加载角色
  const savedCharacters = await get(STORES.CHARACTERS, 'list')
  if (savedCharacters) {
    characters.value = savedCharacters
  }
  
  // 加载选中状态
  const savedSelected = await get(STORES.SETTINGS, 'selectedCharacter')
  if (savedSelected !== null && savedSelected !== undefined) {
    selectedCharacterId.value = savedSelected
  }
  
  // 打印存储统计
  const stats = await getStorageStats()
  console.log('[AI-Chat] 存储模式:', stats.mode, '| 数据:', stats.stores)
})

// 保存配置
const saveConfig = async (newConfig) => {
  config.value = newConfig
  await set(STORES.CONFIG, 'main', newConfig)
  showSettings.value = false
}

// 保存角色配置
const saveCharacters = async (newCharacters) => {
  characters.value = newCharacters
  await set(STORES.CHARACTERS, 'list', newCharacters)
}

// 选择角色
const selectCharacter = async (id) => {
  selectedCharacterId.value = id
  await set(STORES.SETTINGS, 'selectedCharacter', id)
  showMobileSidebar.value = false
}

// 切换侧边栏
const toggleSidebar = () => {
  if (window.innerWidth <= 768) {
    showMobileSidebar.value = !showMobileSidebar.value
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
}

// 是否有有效配置
const hasConfig = computed(() => {
  return config.value.apiUrl && config.value.apiKey
})

// 获取当前选中的角色
const selectedCharacter = computed(() => {
  if (selectedCharacterId.value === null) return null
  return characters.value.find(c => c.id === selectedCharacterId.value)
})
</script>

<template>
  <div class="app-container">
    <!-- 移动端遮罩 -->
    <div 
      v-if="showMobileSidebar" 
      class="mobile-overlay" 
      @click="showMobileSidebar = false"
    ></div>

    <!-- 左侧边栏 -->
    <aside :class="['sidebar', { collapsed: sidebarCollapsed, 'mobile-show': showMobileSidebar }]">
      <div class="sidebar-header">
        <div class="logo" v-if="!sidebarCollapsed">
          <span class="logo-icon">🤖</span>
          <span class="logo-text">AI Chat</span>
        </div>
        <button @click="toggleSidebar" class="collapse-btn" title="折叠边栏">
          {{ sidebarCollapsed || showMobileSidebar ? '→' : '←' }}
        </button>
      </div>

      <div class="sidebar-content" v-if="!sidebarCollapsed">
        <!-- 角色列表 -->
        <div class="section-title">角色</div>
        <div class="character-list">
          <div
            v-for="char in characters"
            :key="char.id"
            :class="['character-item', { active: selectedCharacterId === char.id, disabled: !char.enabled }]"
            @click="char.enabled && selectCharacter(char.id)"
          >
            <span class="character-avatar">{{ getCharacterAvatar(char.id) }}</span>
            <div class="character-info" v-if="!sidebarCollapsed">
              <div class="character-name">{{ char.name }}</div>
              <div class="character-desc">{{ char.description }}</div>
            </div>
          </div>
        </div>

        <!-- 群聊入口 -->
        <div class="section-title" style="margin-top: 24px;">模式</div>
        <div
          :class="['character-item', 'group-chat-item', { active: selectedCharacterId === null }]"
          @click="selectCharacter(null)"
        >
          <span class="character-avatar">👥</span>
          <div class="character-info" v-if="!sidebarCollapsed">
            <div class="character-name">群聊</div>
            <div class="character-desc">所有角色一起讨论</div>
          </div>
        </div>
      </div>

      <!-- 底部用户信息 -->
      <div class="sidebar-footer" v-if="!sidebarCollapsed">
        <div class="user-info">
          <div class="user-avatar">👤</div>
          <div class="user-name">用户</div>
          <button @click="showSettings = true" class="user-settings-btn" title="设置">
            ⚙️
          </button>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 移动端顶部栏 -->
      <header class="mobile-header">
        <button @click="toggleSidebar" class="menu-btn">
          <span class="menu-icon">☰</span>
        </button>
        <div class="mobile-title">
          <span class="mobile-avatar">
            {{ selectedCharacterId === null ? '👥' : getCharacterAvatar(selectedCharacterId) }}
          </span>
          <span class="mobile-name">
            {{ selectedCharacterId === null ? '群聊' : selectedCharacter?.name }}
          </span>
        </div>
        <button @click="showSettings = true" class="settings-btn">
          ⚙️
        </button>
      </header>

      <ChatBox 
        v-if="hasConfig" 
        :api-url="config.apiUrl" 
        :api-key="config.apiKey"
        :model="config.model"
        :api-list="config.apiList || []"
        :characters="characters"
        :selected-character-id="selectedCharacterId"
        @saveCharacters="saveCharacters"
      />
      <div v-else class="no-config-tip">
        <p>请先配置 AI API 信息</p>
        <button @click="showSettings = true" class="primary-btn">去设置</button>
      </div>
    </main>

    <!-- 设置模态框 -->
    <SettingsModal
      v-model="showSettings"
      :config="config"
      :characters="characters"
      @save="saveConfig"
      @saveCharacters="saveCharacters"
    />
  </div>
</template>

<script>
export default {
  methods: {
    getCharacterAvatar(id) {
      const avatars = { 1: '🐱', 2: '🤖', 3: '🌸', 4: '🎓' }
      return avatars[id] || '🤖'
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: #f7f8fa;
  min-height: 100vh;
  -webkit-tap-highlight-color: transparent;
}

.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* 移动端遮罩 */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
  display: none;
}

/* 侧边栏 */
.sidebar {
  width: 280px;
  background: #ffffff;
  border-right: 1px solid #e5e6eb;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  flex-shrink: 0;
  position: relative;
  z-index: 100;
}

.sidebar.collapsed {
  width: 70px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e6eb;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1c1f23;
}

.logo-icon {
  font-size: 24px;
}

.collapse-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f2f3f5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  color: #646a73;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-btn:hover {
  background: #e5e6eb;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  -webkit-overflow-scrolling: touch;
}

.section-title {
  font-size: 12px;
  color: #8f959e;
  padding: 8px 12px;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 角色列表 */
.character-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.character-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.character-item:hover {
  background: #f2f3f5;
}

.character-item.active {
  background: #e8f3ff;
  border-left: 3px solid #5b8ff9;
}

.character-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.character-item.disabled:hover {
  background: transparent;
}

.character-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.sidebar.collapsed .character-avatar {
  margin: 0 auto;
}

.character-info {
  flex: 1;
  overflow: hidden;
}

.character-name {
  font-size: 14px;
  font-weight: 600;
  color: #1c1f23;
  margin-bottom: 2px;
}

.character-desc {
  font-size: 12px;
  color: #8f959e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 群聊项 */
.group-chat-item {
  background: linear-gradient(135deg, #f5f7fa, #e4e8ed);
  border: 1px solid #e5e6eb;
}

.group-chat-item.active {
  background: linear-gradient(135deg, #e8f3ff, #d0e8ff);
  border-left: 3px solid #5b8ff9;
  border-color: #5b8ff9;
}

/* 侧边栏底部 */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #e5e6eb;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #5b8ff9, #3d72f6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.user-name {
  font-size: 14px;
  color: #1c1f23;
  flex: 1;
}

.user-settings-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f2f3f5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.user-settings-btn:hover {
  background: #e5e6eb;
  transform: scale(1.05);
}

/* 主内容区 */
.main-content {
  flex: 1;
  overflow: hidden;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
}

/* 移动端顶部栏 */
.mobile-header {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e5e6eb;
}

.menu-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 24px;
  color: #1c1f23;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-btn:hover {
  background: #f2f3f5;
}

.mobile-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1c1f23;
}

.mobile-avatar {
  font-size: 24px;
}

.settings-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 20px;
  color: #1c1f23;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-btn:hover {
  background: #f2f3f5;
}

.no-config-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #ffffff;
  border-radius: 16px;
  margin: 20px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.no-config-tip p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 1.5rem;
}

.primary-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #5b8ff9, #3d72f6);
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
  box-shadow: 0 8px 24px rgba(91, 143, 249, 0.35);
}

/* 响应式 - 移动端 */
@media (max-width: 768px) {
  .mobile-overlay {
    display: block;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    transform: translateX(-100%);
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
  }

  .sidebar.mobile-show {
    transform: translateX(0);
  }

  .sidebar.collapsed {
    width: 280px;
  }

  .mobile-header {
    display: flex;
  }

  .character-info {
    display: block !important;
  }

  .section-title {
    display: block !important;
  }

  .user-info {
    display: flex !important;
  }
}

/* 小屏幕手机 */
@media (max-width: 375px) {
  .sidebar {
    width: 260px;
  }

  .character-name {
    font-size: 13px;
  }

  .character-desc {
    font-size: 11px;
  }

  .mobile-title {
    font-size: 14px;
  }
}
</style>
