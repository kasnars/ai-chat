<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAll, addMessages, set, STORES } from '../utils/db.js'

const emit = defineEmits(['close'])

const isExporting = ref(false)
const isImporting = ref(false)
const exportFormat = ref('json')

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
    ElMessage.success('导出成功喵～✨')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败喵～ ' + error.message)
  } finally {
    isExporting.value = false
  }
}

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

const formatAsMarkdown = (messages, characters) => {
  let md = '# AI Chat 对话导出\n\n'
  md += `导出时间：${new Date().toLocaleString('zh-CN')}\n\n`
  md += `总消息数：${messages.length}\n\n---\n\n`
  
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

const handleImport = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  isImporting.value = true
  
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
    
    await ElMessageBox.confirm(`确定要导入 ${data.messages.length} 条消息吗？\n这将追加到现有对话中喵～`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    })
    
    await addMessages(data.messages)
    
    if (data.characters) {
      const existing = await getAll(STORES.CHARACTERS)
      const existingList = existing.find(c => c.key === 'list')?.value || []
      
      const merged = [...existingList]
      data.characters.forEach(newChar => {
        const idx = merged.findIndex(c => c.id === newChar.id)
        if (idx >= 0) {
          merged[idx] = newChar
        } else {
          merged.push(newChar)
        }
      })
      
      await set(STORES.CHARACTERS, 'list', merged)
    }
    
    ElMessage.success(`导入成功喵～✨\n导入了 ${data.messages.length} 条消息`)
    emit('close')
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败喵～ ' + error.message)
  } finally {
    isImporting.value = false
  }
}
</script>

<template>
  <div style="padding: 20px 0;">
    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">📤 导出数据</h3>
    <p style="font-size: 13px; color: var(--el-text-color-secondary); margin-bottom: 16px;">
      将对话记录导出为文件，用于备份或迁移喵～
    </p>
    
    <el-radio-group v-model="exportFormat" style="margin-bottom: 16px;">
      <el-radio-button label="json">JSON（完整备份）</el-radio-button>
      <el-radio-button label="markdown">Markdown（可读性强）</el-radio-button>
      <el-radio-button label="text">纯文本</el-radio-button>
    </el-radio-group>
    
    <el-button 
      type="primary" 
      @click="exportData" 
      :loading="isExporting"
      icon="Download"
      style="width: 100%;"
    >
      {{ isExporting ? '导出中...' : '📤 导出对话' }}
    </el-button>
    
    <el-divider />
    
    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">📥 导入数据</h3>
    <p style="font-size: 13px; color: var(--el-text-color-secondary); margin-bottom: 16px;">
      从备份文件恢复对话记录喵～
    </p>
    
    <input
      type="file"
      accept=".json"
      @change="handleImport"
      :disabled="isImporting"
      style="display: none;"
      id="import-file"
    />
    <label for="import-file">
      <el-button 
        :loading="isImporting"
        icon="Upload"
        style="width: 100%;"
      >
        {{ isImporting ? '导入中...' : '📥 选择文件导入' }}
      </el-button>
    </label>
    
    <el-divider />
    
    <el-alert
      title="💡 提示"
      description="JSON 格式包含完整的对话、角色和配置信息。Markdown 和纯文本格式仅包含对话内容，适合阅读。导入操作会追加数据，不会删除现有对话。"
      type="info"
      :closable="false"
    />
  </div>
</template>
