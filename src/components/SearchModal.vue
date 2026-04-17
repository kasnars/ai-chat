<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAll, STORES } from '../utils/db.js'

const emit = defineEmits(['close', 'selectMessage'])

const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const searched = ref(false)

// 角色缓存
const charactersMap = ref({})

onMounted(async () => {
  const chars = await getAll(STORES.CHARACTERS)
  const charList = chars.find(c => c.key === 'list')?.value || []
  charactersMap.value = Object.fromEntries(charList.map(c => [c.id, c]))
})

// 执行搜索
const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    searched.value = false
    return
  }
  
  isSearching.value = true
  searched.value = true
  
  try {
    const messages = await getAll(STORES.MESSAGES)
    console.log('[Search] 获取到的消息:', messages)
    const query = searchQuery.value.toLowerCase()
    
    searchResults.value = messages
      .filter(m => {
        const content = m.value?.content || m.content || ''
        return content.toLowerCase().includes(query)
      })
      .map(m => ({
        ...(m.value || m),
        characterName: charactersMap.value[(m.value || m).characterId]?.name || '未知角色'
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100) // 限制 100 条结果
    
    console.log('[Search] 搜索结果:', searchResults.value.length)
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    isSearching.value = false
  }
}

// 防抖搜索
let searchTimer = null
const handleSearchInput = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(performSearch, 300)
}

// 选中消息
const selectResult = (msg) => {
  emit('selectMessage', msg)
  emit('close')
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return date.toLocaleString('zh-CN', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 高亮关键词
const highlightKeyword = (text, keyword) => {
  if (!keyword) return text
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}
</script>

<template>
  <div class="search-modal">
    <div class="search-header">
      <h3>🔍 搜索对话</h3>
      <button @click="emit('close')" class="close-btn">×</button>
    </div>
    
    <div class="search-box">
      <input
        v-model="searchQuery"
        @input="handleSearchInput"
        type="text"
        placeholder="搜索关键词..."
        class="search-input"
        autofocus
      />
      <button 
        v-if="searchQuery" 
        @click="searchQuery = ''; searchResults = []; searched = false"
        class="clear-btn"
      >
        ×
      </button>
    </div>
    
    <div class="search-results">
      <div v-if="isSearching" class="searching">
        <span class="loading-spinner">⏳</span> 搜索中...
      </div>
      
      <div v-else-if="searched && searchResults.length === 0" class="no-results">
        <span class="no-results-icon">🔍</span>
        <p>没有找到相关对话喵～</p>
        <p class="hint">试试其他关键词喵～</p>
      </div>
      
      <div v-else-if="searched" class="results-list">
        <div class="results-count">找到 {{ searchResults.length }} 条结果</div>
        
        <div
          v-for="msg in searchResults"
          :key="msg.id"
          class="result-item"
          @click="selectResult(msg)"
        >
          <div class="result-meta">
            <span class="result-role" :class="msg.role">
              {{ msg.role === 'user' ? '👤 你' : '🤖 ' + msg.characterName }}
            </span>
            <span class="result-time">{{ formatTime(msg.timestamp) }}</span>
          </div>
          <div 
            class="result-content"
            v-html="highlightKeyword(msg.content, searchQuery)"
          ></div>
        </div>
      </div>
      
      <div v-else class="search-placeholder">
        <span class="placeholder-icon">💬</span>
        <p>输入关键词搜索对话记录喵～</p>
        <p class="hint">支持搜索所有角色的对话喵～</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-modal {
  padding: 1.5rem;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.search-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-tertiary);
  border-radius: 6px;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--border);
}

.search-box {
  position: relative;
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  border: 2px solid var(--border);
  border-radius: 12px;
  font-size: 1rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(91, 143, 249, 0.1);
}

.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border: none;
  background: var(--bg-tertiary);
  border-radius: 50%;
  font-size: 1.2rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: var(--border);
  color: var(--text-primary);
}

.search-results {
  max-height: 500px;
  overflow-y: auto;
}

.searching {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 3rem;
  color: var(--text-tertiary);
}

.no-results {
  text-align: center;
  padding: 3rem;
  color: var(--text-tertiary);
}

.no-results-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.no-results .hint {
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.search-placeholder {
  text-align: center;
  padding: 3rem;
  color: var(--text-tertiary);
}

.placeholder-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.results-count {
  font-size: 0.85rem;
  color: var(--text-tertiary);
  margin-bottom: 1rem;
  padding: 0 4px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.result-item:hover {
  background: var(--bg-primary);
  border-color: var(--primary-color);
  transform: translateX(4px);
}

.result-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.result-role {
  font-size: 0.85rem;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
}

.result-role.user {
  background: rgba(91, 143, 249, 0.1);
  color: var(--primary-color);
}

.result-role.assistant {
  background: rgba(0, 179, 101, 0.1);
  color: var(--success);
}

.result-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.result-content {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-content :deep(mark) {
  background: rgba(255, 122, 69, 0.2);
  color: var(--warning);
  padding: 1px 4px;
  border-radius: 2px;
}
</style>
