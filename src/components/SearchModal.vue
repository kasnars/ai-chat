<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElEmpty, ElTag } from 'element-plus'
import { getAll, STORES } from '../utils/db.js'

const emit = defineEmits(['close', 'selectMessage'])

const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const searched = ref(false)
const charactersMap = ref({})

onMounted(async () => {
  const chars = await getAll(STORES.CHARACTERS)
  const charList = chars.find(c => c.key === 'list')?.value || []
  charactersMap.value = Object.fromEntries(charList.map(c => [c.id, c]))
})

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
      .slice(0, 100)
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    isSearching.value = false
  }
}

let searchTimer = null
const handleSearchInput = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(performSearch, 300)
}

const selectResult = (msg) => {
  emit('selectMessage', msg)
  emit('close')
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const highlightKeyword = (text, keyword) => {
  if (!keyword) return text
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}
</script>

<template>
  <div style="padding: 24px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <h3 style="font-size: 18px; font-weight: 600; margin: 0;">🔍 搜索对话</h3>
      <el-button @click="emit('close')" size="default" icon="Close">关闭</el-button>
    </div>
    
    <el-input
      v-model="searchQuery"
      @input="handleSearchInput"
      placeholder="搜索关键词..."
      prefix-icon="Search"
      clearable
      size="large"
      style="margin-bottom: 20px;"
    />
    
    <div style="max-height: 500px; overflow-y: auto;">
      <div v-if="isSearching" style="text-align: center; padding: 40px; color: var(--el-text-color-secondary);">
        <el-icon class="is-loading" style="font-size: 24px;"><Loading /></el-icon>
        <div style="margin-top: 12px;">搜索中...</div>
      </div>
      
      <el-empty
        v-else-if="searched && searchResults.length === 0"
        description="没有找到相关对话喵～"
        :image-size="100"
      >
        <template #description>
          <div style="font-size: 13px; color: var(--el-text-color-secondary);">
            试试其他关键词喵～
          </div>
        </template>
      </el-empty>
      
      <div v-else-if="searched">
        <div style="font-size: 13px; color: var(--el-text-color-secondary); margin-bottom: 12px;">
          找到 {{ searchResults.length }} 条结果
        </div>
        
        <el-card
          v-for="msg in searchResults"
          :key="msg.id"
          style="margin-bottom: 12px; cursor: pointer; transition: all 0.2s;"
          @click="selectResult(msg)"
          @mouseenter="$event.currentTarget.style.transform = 'translateX(4px)'"
          @mouseleave="$event.currentTarget.style.transform = 'none'"
        >
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <el-tag :type="msg.role === 'user' ? 'primary' : 'success'" size="small">
              {{ msg.role === 'user' ? '👤 你' : '🤖 ' + msg.characterName }}
            </el-tag>
            <span style="font-size: 12px; color: var(--el-text-color-secondary);">
              {{ formatTime(msg.timestamp) }}
            </span>
          </div>
          <div 
            style="font-size: 14px; color: var(--el-text-color-primary); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;"
            v-html="highlightKeyword(msg.content, searchQuery)"
          ></div>
        </el-card>
      </div>
      
      <el-empty
        v-else
        description="输入关键词搜索对话记录喵～"
        :image-size="100"
      >
        <template #description>
          <div style="font-size: 13px; color: var(--el-text-color-secondary);">
            支持搜索所有角色的对话喵～
          </div>
        </template>
      </el-empty>
    </div>
  </div>
</template>

<style scoped>
:deep(mark) {
  background: rgba(255, 122, 69, 0.2);
  color: var(--el-color-warning);
  padding: 1px 4px;
  border-radius: 2px;
}
</style>
