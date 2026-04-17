<script setup>
import { ref, computed } from 'vue'
import { getAll, addMessages, clear, STORES } from '../utils/db.js'

const props = defineProps({
  characters: Array
})

const emit = defineEmits(['close'])

const isExporting = ref(false)
const isImporting = ref(false)
const importError = ref('')

// 导出格式
const exportFormat = ref('json')

// 导出对话
const exportData = async () => {
  isExporting.value = true
  try {
    const messages = await getAll(STORES.MESSAGES)
    const characters = await getAll(STORES.CHARACTERS)
    const config = await getAll(STORES.CONFIG)
    
    const exportObj = {
      version: 1,
      exportedAt: new Date().toISOString(),
      messages: messages.map(m => m.value),
      characters: characters.find(c => c.key === 'list')?.value || [],
      config: config.find(c => c.key === 'main')?.value
    }
    
    let content, filename, mimeType
    
    if (exportFormat.value === 'json') {
      content = JSON.stringify(exportObj, null, 2)
      filename = `ai-chat-backup-${new Date().toISOString().split('T')[0]}.json`
      mimeType = 'application/json'
    } else if (exportFormat.value === 'markdown') {
      content = formatAsMarkdown(exportObj.messages, exportObj.characters)
      filename = `ai-chat-${new Date().toISOString().split('T')[0]}.md`
      mimeType = 'text/markdown'
    } else {
      content = formatAsText(exportObj.messages, exportObj.characters)
      filename = `ai-chat-${new Date().toISOString().split('T')[0]}.txt`
      mimeType = 'text/plain'
    }
    
    downloadFile(content, filename, mimeType)
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败喵～ ' + error.message)
  } finally {
    isExporting.value = false
  }
}

// 下载文件
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 格式化为 Markdown
const formatAsMarkdown = (messages, characters) => {
  let md = '# AI Chat 对话导出\n\n'
  md += `导出时间：${new Date().toLocaleString('zh-CN')}\n\n`
  md += `总消息数：${messages.length}\n\n---\n\n`
  
  // 按角色分组
  const grouped = {}
  messages.forEach(msg => {
    const key = msg.characterId || 'group'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(msg)
  })
  
  for (const [charId, charMsgs] of Object.entries(grouped)) {
    const char = characters.find(c => c.id === parseInt(charId))
    const charName = char ? char.name : '群聊'
    
    md += `## 💬 ${charName}\n\n`
    
    charMsgs.forEach(msg => {
      const role = msg.role === 'user' ? '👤 你' : `🤖 ${charName}`
      const time = new Date(msg.timestamp).toLocaleString('zh-CN')
      md += `### ${role} · ${time}\n\n${msg.content}\n\n`
    })
    
    md += `---\n\n`
  }
  
  return md
}

// 格式化为文本
const formatAsText = (messages, characters) => {
  let text = 'AI Chat 对话导出\n'
  text += `导出时间：${new Date().toLocaleString('zh-CN')}\n`
  text += `总消息数：${messages.length}\n\n`
  text += '='.repeat(50) + '\n\n'
  
  messages.forEach(msg => {
    const char = characters.find(c => c.id === msg.characterId)
    const role = msg.role === 'user' ? '你' : (char?.name || 'AI')
    const time = new Date(msg.timestamp).toLocaleString('zh-CN')
    text += `[${time}] ${role}: ${msg.content}\n\n`
  })
  
  return text
}

// 导入对话
const handleImport = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  isImporting.value = true
  importError.value = ''
  
  try {
    const text = await file.text()
    let data
    
    try {
      data = JSON.parse(text)
    } catch (e) {
      throw new Error('文件格式不正确，请确保是 JSON 格式喵～')
    }
    
    if (!data.version || !data.messages) {
      throw new Error('这不是 AI Chat 的导出文件喵～')
    }
    
    // 确认导入
    if (!confirm(`确定要导入 ${data.messages.length} 条消息吗？\n这将追加到现有对话中喵～`)) {
      isImporting.value = false
      return
    }
    
    // 导入消息
    await addMessages(data.messages)
    
    // 导入角色（如果存在）
    if (data.characters) {
      const existing = await getAll(STORES.CHARACTERS)
      const existingList = existing.find(c => c.key === 'list')?.value || []
      
      // 合并角色
      const merged = [...existingList]
      data.characters.forEach(newChar => {
        const idx = merged.findIndex(c => c.id === newChar.id)
        if (idx >= 0) {
          merged[idx] = newChar
        } else {
          merged.push(newChar)
        }
      })
      
      await import.meta.glob('../utils/db.js').then(() => {})
      // 简单处理：直接保存
      const { set } = await import('../utils/db.js')
      await set(STORES.CHARACTERS, 'list', merged)
    }
    
    alert(`导入成功喵～✨\n导入了 ${data.messages.length} 条消息`)
    emit('close')
  } catch (error) {
    console.error('导入失败:', error)
    importError.value = error.message
    alert('导入失败喵～ ' + error.message)
  } finally {
    isImporting.value = false
  }
}
</script>

<template>
  <div class="import-export">
    <h3>📤 导出数据</h3>
    <p class="hint">将对话记录导出为文件，用于备份或迁移喵～</p>
    
    <div class="export-options">
      <label class="radio-label">
        <input type="radio" v-model="exportFormat" value="json" />
        <span>JSON（完整备份）</span>
      </label>
      <label class="radio-label">
        <input type="radio" v-model="exportFormat" value="markdown" />
        <span>Markdown（可读性强）</span>
      </label>
      <label class="radio-label">
        <input type="radio" v-model="exportFormat" value="text" />
        <span>纯文本</span>
      </label>
    </div>
    
    <button @click="exportData" :disabled="isExporting" class="btn-export">
      {{ isExporting ? '导出中...' : '📤 导出对话' }}
    </button>
    
    <div class="divider"></div>
    
    <h3>📥 导入数据</h3>
    <p class="hint">从备份文件恢复对话记录喵～</p>
    
    <label class="import-label">
      <input 
        type="file" 
        accept=".json" 
        @change="handleImport" 
        :disabled="isImporting"
        hidden
      />
      <span class="import-btn">
        {{ isImporting ? '导入中...' : '📥 选择文件导入' }}
      </span>
    </label>
    
    <p v-if="importError" class="error">{{ importError }}</p>
    
    <div class="divider"></div>
    
    <div class="info-box">
      <h4>💡 提示</h4>
      <ul>
        <li>JSON 格式包含完整的对话、角色和配置信息</li>
        <li>Markdown 和纯文本格式仅包含对话内容，适合阅读</li>
        <li>导入操作会追加数据，不会删除现有对话</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.import-export {
  padding: 1.5rem;
}

h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.hint {
  font-size: 0.85rem;
  color: var(--text-tertiary);
  margin-bottom: 1rem;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 1rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-label:hover {
  background: var(--border);
}

.radio-label input[type="radio"] {
  margin: 0;
}

.btn-export,
.import-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #5b8ff9, #3d72f6);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-export:hover,
.import-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(91, 143, 249, 0.3);
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.import-label {
  display: block;
}

.divider {
  height: 1px;
  background: var(--border);
  margin: 1.5rem 0;
}

.error {
  color: var(--error);
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.info-box {
  background: linear-gradient(135deg, rgba(91, 143, 249, 0.08), rgba(61, 114, 246, 0.08));
  border-left: 4px solid var(--primary-color);
  padding: 1rem;
  border-radius: 8px;
}

.info-box h4 {
  font-size: 0.9rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.info-box ul {
  margin: 0;
  padding-left: 1.2rem;
}

.info-box li {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.3rem;
}
</style>
