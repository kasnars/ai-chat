<script setup>
import { ref, nextTick, computed, watch, onMounted } from 'vue'
import { addMessage, getMessagesByCharacter, deleteMessagesByCharacter, clear, STORES } from '../utils/db.js'
import SearchModal from './SearchModal.vue'
import TemplatesModal from './TemplatesModal.vue'

const props = defineProps({
  apiUrl: String,
  apiKey: String,
  model: String,
  apiList: Array,
  characters: Array,
  selectedCharacterId: Number
})

const emit = defineEmits(['saveCharacters'])

const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const messagesContainer = ref(null)
const textareaRef = ref(null)

// @提及相关
const showMentionPanel = ref(false)
const mentionText = ref('')
const mentionCursorPos = ref(0)

// 群聊角色选择
const showCharacterSelector = ref(false)
const selectedCharacterIds = ref([])

// 搜索和模板
const showSearch = ref(false)
const showTemplates = ref(false)

// 初始化选中的角色
watch(() => props.characters, (newChars) => {
  if (newChars && newChars.length > 0) {
    selectedCharacterIds.value = newChars.filter(c => c.enabled).map(c => c.id)
  }
}, { immediate: true, deep: true })

// 确保 enabledCharacters 总是有值
const enabledCharacters = computed(() => {
  const chars = props.characters?.filter(c => c.enabled) || []
  return chars
})

// 监听角色切换，加载对应消息
watch(async () => {
  // 角色已切换，加载历史消息
  if (props.selectedCharacterId !== null) {
    const history = await getMessagesByCharacter(props.selectedCharacterId, 50)
    messages.value = history.reverse() // 正序显示
  } else {
    // 群聊模式，加载所有启用角色的消息
    messages.value = []
  }
  showMentionPanel.value = false
}, { deep: true })

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 自动调整 textarea 高度
const adjustTextareaHeight = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    const newHeight = Math.min(textareaRef.value.scrollHeight, 200)
    textareaRef.value.style.height = newHeight + 'px'
  }
}

// 获取角色头像
const getCharacterAvatar = (id) => {
  const avatars = { 1: '🐱', 2: '🤖', 3: '🌸', 4: '🎓' }
  return avatars[id] || '🤖'
}

// 获取角色颜色
const getCharacterColor = (id) => {
  const colors = {
    1: 'linear-gradient(135deg, #ff9a9e, #fad0c4)',
    2: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    3: 'linear-gradient(135deg, #84fab0, #8fd3f4)',
    4: 'linear-gradient(135deg, #fccb90, #d57eeb)'
  }
  return colors[id] || 'linear-gradient(135deg, #5b8ff9, #3d72f6)'
}

// 检测@输入
const handleInput = () => {
  adjustTextareaHeight()
  checkMention()
}

const checkMention = () => {
  const text = inputMessage.value
  const cursorPos = textareaRef.value?.selectionStart || 0
  
  // 查找最后一个@符号
  const lastAtIndex = text.lastIndexOf('@', cursorPos - 1)
  
  if (lastAtIndex !== -1) {
    // 检查@后面是否已经有内容
    const afterAt = text.slice(lastAtIndex + 1, cursorPos)
    
    // 如果@后面没有空格或换行，显示提及面板
    if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
      mentionText.value = afterAt
      mentionCursorPos.value = lastAtIndex
      showMentionPanel.value = true
      console.log('显示提及面板：', { text: afterAt, filteredCount: filteredCharacters.value?.length || 0 })
      return
    }
  }
  
  showMentionPanel.value = false
}

// 插入@提及
const insertMention = (character) => {
  const text = inputMessage.value
  const beforeMention = text.slice(0, mentionCursorPos.value)
  const afterMention = text.slice(mentionCursorPos.value + mentionText.value.length + 1)
  
  inputMessage.value = beforeMention + '@' + character.name + ' ' + afterMention
  showMentionPanel.value = false
  mentionText.value = ''
  
  // 同时关闭角色选择器
  showCharacterSelector.value = false
  
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus()
    }
  })
}

// 关闭提及面板
const closeMentionPanel = () => {
  showMentionPanel.value = false
  mentionText.value = ''
}

// 切换角色选择器
const toggleCharacterSelector = () => {
  showCharacterSelector.value = !showCharacterSelector.value
  console.log('切换角色选择器：', {
    isGroupChat: isGroupChat.value,
    showCharacterSelector: showCharacterSelector.value,
    enabledCharacters: enabledCharacters.value?.length || 0
  })
}

// 过滤匹配的角色
const filteredCharacters = computed(() => {
  const chars = props.characters || []
  if (!mentionText.value) {
    return chars.filter(c => c.enabled)
  }
  return chars.filter(c => 
    c.enabled && c.name.toLowerCase().includes(mentionText.value.toLowerCase())
  )
})

// 解析@提及
const parseMentions = (text) => {
  const mentions = []
  const mentionRegex = /@(\S+)/g
  let match
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionName = match[1]
    const character = props.characters?.find(c => 
      c.enabled && c.name.toLowerCase().includes(mentionName.toLowerCase())
    )
    if (character) {
      mentions.push(character.id)
    }
  }
  
  return mentions
}

// 获取角色使用的 API 配置
const getApiForCharacter = (character) => {
  const apiIndex = character.apiIndex || 0
  if (props.apiList && props.apiList.length > 0) {
    return props.apiList[Math.min(apiIndex, props.apiList.length - 1)]
  }
  // 兼容旧配置
  return {
    url: props.apiUrl,
    key: props.apiKey,
    model: props.model || 'qwen-plus'
  }
}

// 发送消息 - 单聊
const sendMessageSingle = async (characterId) => {
  const character = props.characters?.find(c => c.id === characterId)
  if (!character) return

  // 获取该角色使用的 API 配置
  const apiConfig = getApiForCharacter(character)

  const userMessage = {
    role: 'user',
    content: inputMessage.value.trim(),
    timestamp: new Date().toLocaleTimeString(),
    characterId: characterId
  }

  messages.value.push(userMessage)
  // 异步保存到数据库
  addMessage(userMessage)
  
  inputMessage.value = ''
  isLoading.value = true
  adjustTextareaHeight()
  await scrollToBottom()

  const aiMessage = {
    role: 'assistant',
    content: '',
    timestamp: new Date().toLocaleTimeString(),
    isStreaming: true,
    agentId: character.id,
    agentName: character.name,
    characterId: characterId
  }
  messages.value.push(aiMessage)

  try {
    const messagesToSend = [{
      role: 'system',
      content: `你是一个${character.name}，${character.description || ''}。说话风格：${character.style || ''}。口癖：${character.quirks || ''}。表情习惯：${character.emoji || ''}。请严格遵守这个人设，用你的风格回复用户。`
    }]
    
    messagesToSend.push(...messages.value.slice(0, -1).filter(m => m.role === 'user').map(m => ({
      role: m.role,
      content: m.content
    })))

    const response = await fetch(`${apiConfig.url}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.key}`
      },
      body: JSON.stringify({
        model: apiConfig.model || 'qwen-plus',
        messages: messagesToSend,
        stream: true
      })
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let accumulatedContent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              accumulatedContent += delta
              aiMessage.content = accumulatedContent
              await scrollToBottom()
            }
          } catch (e) {}
        }
      }
    }
    aiMessage.isStreaming = false
    // 保存到数据库
    addMessage(aiMessage)
  } catch (error) {
    aiMessage.content = `❌ 错误：${error.message}`
    aiMessage.isStreaming = false
    // 错误消息也保存
    addMessage(aiMessage)
  }

  isLoading.value = false
  await scrollToBottom()
}

// 发送消息 - 群聊
const sendMessageGroup = async () => {
  const text = inputMessage.value.trim()
  const mentions = parseMentions(text)

  const userMessage = {
    role: 'user',
    content: text,
    timestamp: new Date().toLocaleTimeString()
  }

  messages.value.push(userMessage)
  inputMessage.value = ''
  isLoading.value = true
  adjustTextareaHeight()
  showCharacterSelector.value = false
  await scrollToBottom()

  let targetCharacters = []
  if (mentions.length > 0) {
    // @提及优先
    targetCharacters = props.characters?.filter(c => mentions.includes(c.id)) || []
  } else if (selectedCharacterIds.value.length > 0) {
    // 使用选中的角色
    targetCharacters = props.characters?.filter(c => selectedCharacterIds.value.includes(c.id)) || []
  } else {
    // 默认使用启用的角色
    targetCharacters = props.characters?.filter(c => c.enabled) || []
  }

  const aiMessages = []
  
  for (const character of targetCharacters) {
    const aiMsg = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      isStreaming: true,
      agentId: character.id,
      agentName: character.name
    }
    aiMessages.push(aiMsg)
    messages.value.push(aiMsg)
  }

  const promises = targetCharacters.map(async (character, index) => {
    const aiMessage = aiMessages[index]
    
    // 获取该角色使用的 API 配置
    const apiConfig = getApiForCharacter(character)
    
    try {
      const messagesToSend = [{
        role: 'system',
        content: `你是一个${character.name}，${character.description || ''}。说话风格：${character.style || ''}。口癖：${character.quirks || ''}。表情习惯：${character.emoji || ''}。请严格遵守这个人设，用你的风格回复用户。${mentions.length > 0 ? `用户@了你，请单独回复。` : '这是一个群聊，其他角色也会回复。'}`
      }]
      
      messagesToSend.push(...messages.value.filter(m => m.role === 'user').map(m => ({
        role: m.role,
        content: m.content
      })))

      const response = await fetch(`${apiConfig.url}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiConfig.key}`
        },
        body: JSON.stringify({
          model: apiConfig.model || 'qwen-plus',
          messages: messagesToSend,
          stream: true
        })
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content
              if (delta) {
                accumulatedContent += delta
                aiMessage.content = accumulatedContent
                await scrollToBottom()
              }
            } catch (e) {}
          }
        }
      }
      aiMessage.isStreaming = false
    } catch (error) {
      aiMessage.content = `❌ 错误：${error.message}`
      aiMessage.isStreaming = false
    }
  })

  await Promise.all(promises)
  isLoading.value = false
  await scrollToBottom()
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return
  closeMentionPanel()

  if (props.selectedCharacterId === null) {
    await sendMessageGroup()
  } else {
    await sendMessageSingle(props.selectedCharacterId)
  }
}

// 清空对话
const clearChat = async () => {
  if (confirm('确定要清空当前对话吗？')) {
    messages.value = []
    // 从数据库删除
    if (props.selectedCharacterId !== null) {
      await deleteMessagesByCharacter(props.selectedCharacterId)
    } else {
      // 群聊模式清空所有消息
      await clear(STORES.MESSAGES)
    }
  }
}

// 处理回车发送
const handleEnter = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// 是否有内容
const hasContent = computed(() => {
  return inputMessage.value.trim()
})

// 当前模式
const isGroupChat = computed(() => {
  return props.selectedCharacterId === null
})

// 当前角色
const currentCharacter = computed(() => {
  if (props.selectedCharacterId === null) return null
  return props.characters?.find(c => c.id === props.selectedCharacterId)
})


</script>

<template>
  <div class="chat-container">
    <!-- 消息列表 -->
    <div ref="messagesContainer" class="messages-container">
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-content">
          <div class="welcome-avatar">
            {{ isGroupChat ? '👥' : (currentCharacter ? getCharacterAvatar(currentCharacter.id) : '🤖') }}
          </div>
          <h1>
            {{ isGroupChat ? '群聊模式' : (currentCharacter ? `和${currentCharacter.name}聊天` : 'AI Chat') }}
          </h1>
          <p class="welcome-subtitle">
            {{ isGroupChat ? '所有角色一起讨论，@某个角色可单独回复喵～' : (currentCharacter ? currentCharacter.description : '有什么可以帮你的吗？') }}
          </p>
          
          <div class="quick-actions">
            <button class="quick-action-btn" @click="inputMessage = '帮我写一份工作总结'">
              <span class="action-icon">📝</span>
              <span>帮我写一份工作总结</span>
            </button>
            <button class="quick-action-btn" @click="inputMessage = '解释一下什么是人工智能'">
              <span class="action-icon">💡</span>
              <span>解释一下什么是人工智能</span>
            </button>
            <button class="quick-action-btn" @click="inputMessage = '帮我制定一个学习计划'">
              <span class="action-icon">📚</span>
              <span>帮我制定一个学习计划</span>
            </button>
            <button class="quick-action-btn" @click="inputMessage = '推荐几本好书'">
              <span class="action-icon">📖</span>
              <span>推荐几本好书</span>
            </button>
          </div>
          
          <div v-if="isGroupChat" class="group-tip">
            <p>💡 提示：在消息中输入 <code>@</code> 可以选择要@的角色哦～</p>
          </div>
        </div>
      </div>

      <div class="message-list">
        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="['message-item', message.role]"
        >
          <div class="message-avatar">
            <div 
              class="avatar-icon" 
              :style="{ background: message.agentId ? getCharacterColor(message.agentId) : '' }"
            >
              {{ message.role === 'user' ? '👤' : (message.agentName ? getCharacterAvatar(message.agentId) : '🤖') }}
            </div>
          </div>
          <div class="message-body">
            <div class="message-header">
              <span class="sender-name">
                {{ message.role === 'user' ? '我' : (message.agentName || 'AI 助手') }}
              </span>
              <span class="message-time">{{ message.timestamp }}</span>
            </div>
            <div class="message-text">{{ message.content }}</div>
            
            <div v-if="message.role === 'assistant' && !message.isStreaming" class="message-actions">
              <button class="action-btn" title="复制">📋</button>
              <button class="action-btn" title="重新生成">🔄</button>
              <button class="action-btn" title="点赞">👍</button>
            </div>
            
            <div v-if="message.isStreaming" class="streaming-indicator">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部输入区 -->
    <div class="input-wrapper">
      <!-- 群聊角色选择器 -->
      <div v-if="showCharacterSelector && isGroupChat && !showMentionPanel" class="character-selector-panel">
        <div class="character-selector">
          <div class="selector-header">
            <span class="selector-title">选择回复角色</span>
            <button @click="showCharacterSelector = false" class="selector-close">×</button>
          </div>
          <div class="selector-list" v-if="enabledCharacters && enabledCharacters.length > 0">
            <label
              v-for="char in enabledCharacters"
              :key="char.id"
              class="selector-item"
            >
              <div class="selector-avatar" :style="{ background: getCharacterColor(char.id) }">
                {{ getCharacterAvatar(char.id) }}
              </div>
              <div class="selector-info">
                <div class="selector-name">{{ char.name }}</div>
                <div class="selector-desc">{{ char.description }}</div>
              </div>
              <input
                type="checkbox"
                :value="char.id"
                v-model="selectedCharacterIds"
                class="selector-checkbox"
              />
              <span class="selector-checkmark">✓</span>
            </label>
          </div>
          <div v-else class="selector-empty">
            暂无可用角色，请先在设置中启用角色喵～
          </div>
        </div>
      </div>

      <!-- @提及面板 -->
      <div v-if="showMentionPanel && isGroupChat" class="mention-panel-wrapper">
        <div class="mention-panel">
          <div class="mention-header">
            <span class="mention-title">@ 提及角色</span>
            <button @click="closeMentionPanel" class="mention-close">×</button>
          </div>
          <div class="mention-list">
            <div
              v-for="char in filteredCharacters"
              :key="char.id"
              class="mention-item"
              @click="insertMention(char)"
            >
              <div class="mention-avatar" :style="{ background: getCharacterColor(char.id) }">
                {{ getCharacterAvatar(char.id) }}
              </div>
              <div class="mention-info">
                <div class="mention-name">{{ char.name }}</div>
                <div class="mention-desc">{{ char.description }}</div>
              </div>
            </div>
            <div v-if="filteredCharacters.length === 0" class="mention-empty">
              没有找到匹配的角色
            </div>
          </div>
        </div>
      </div>

      <div class="input-container">
        <!-- 左侧工具按钮 -->
        <div class="input-tools">
          <!-- 群聊角色选择按钮 -->
          <button
            v-if="isGroupChat"
            @click="toggleCharacterSelector"
            :class="['tool-btn', { active: showCharacterSelector }]"
            title="选择回复角色"
          >
            <span class="tool-icon">👥</span>
            <span class="tool-count" v-if="selectedCharacterIds.length < enabledCharacters.length">
              {{ selectedCharacterIds.length }}
            </span>
          </button>
          
          <!-- 搜索按钮 -->
          <button
            @click="showSearch = true"
            class="tool-btn"
            title="搜索对话"
          >
            <span class="tool-icon">🔍</span>
          </button>
          
          <!-- 模板按钮 -->
          <button
            @click="showTemplates = true"
            class="tool-btn"
            title="常用语/提示词"
          >
            <span class="tool-icon">⚡</span>
          </button>
        </div>

        <div class="input-box">
          <textarea
            ref="textareaRef"
            v-model="inputMessage"
            @keydown="handleEnter"
            @input="handleInput"
            @click="handleInput"
            :placeholder="isGroupChat ? '发消息... 输入 @ 提及角色' : '发消息...'"
            :disabled="isLoading"
            rows="1"
            class="message-input"
          ></textarea>
        </div>

        <button
          @click="sendMessage"
          :disabled="!hasContent || isLoading"
          :class="['send-button', { active: hasContent && !isLoading }]"
        >
          <span v-if="!isLoading">↑</span>
          <span v-else class="loading-spinner"></span>
        </button>
      </div>

      <div class="input-footer">
        <span>AI 生成内容可能不准确，请仔细甄别</span>
      </div>
    </div>
    
    <!-- 搜索弹窗 -->
    <div v-if="showSearch" class="modal-overlay" @click.self="showSearch = false">
      <div class="modal-content search-modal-wrapper">
        <SearchModal @close="showSearch = false" />
      </div>
    </div>
    
    <!-- 模板弹窗 -->
    <div v-if="showTemplates" class="modal-overlay" @click.self="showTemplates = false">
      <div class="modal-content templates-modal-wrapper">
        <TemplatesModal 
          @close="showTemplates = false"
          @insert="(content) => { inputMessage += content; showTemplates = false }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #ffffff;
  position: relative;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.welcome-message {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 40px 20px;
}

.welcome-content {
  max-width: 800px;
  text-align: center;
  width: 100%;
}

.welcome-avatar {
  font-size: 64px;
  margin-bottom: 24px;
}

.welcome-message h1 {
  font-size: 32px;
  color: #1c1f23;
  margin-bottom: 12px;
  font-weight: 600;
}

.welcome-subtitle {
  font-size: 16px;
  color: #8f959e;
  margin-bottom: 40px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  max-width: 700px;
  margin: 0 auto 24px;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid #e5e6eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  color: #1c1f23;
  text-align: left;
}

.quick-action-btn:hover {
  background: #f2f3f5;
  border-color: #c9cdd4;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.action-icon {
  font-size: 20px;
}

.group-tip {
  background: linear-gradient(135deg, #e8f3ff, #f0f7ff);
  border: 1px solid #b3d9ff;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 16px;
}

.group-tip p {
  font-size: 13px;
  color: #1c1f23;
  margin: 0;
}

.group-tip code {
  background: #ffffff;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  color: #5b8ff9;
}

.message-list {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.message-item {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-avatar {
  flex-shrink: 0;
}

.avatar-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.message-body {
  flex: 1;
  max-width: calc(100% - 60px);
}

.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.sender-name {
  font-size: 14px;
  font-weight: 600;
  color: #1c1f23;
}

.message-time {
  font-size: 12px;
  color: #c9cdd4;
}

.message-text {
  font-size: 15px;
  line-height: 1.8;
  color: #1c1f23;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-item:hover .message-actions {
  opacity: 1;
}

.action-btn {
  padding: 6px 12px;
  background: #f2f3f5;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #e5e6eb;
}

.streaming-indicator {
  display: flex;
  gap: 4px;
  margin-top: 12px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: #5b8ff9;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-10px); opacity: 1; }
}

/* 角色选择器面板 */
.character-selector-panel {
  position: absolute;
  bottom: 100%;
  left: 20px;
  right: 20px;
  max-width: 680px;
  margin: 0 auto;
  z-index: 100;
}

/* 角色选择器 */
.character-selector {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid #e5e6eb;
  overflow: hidden;
  margin-bottom: 12px;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e6eb;
  background: #f7f8fa;
}

.selector-title {
  font-size: 14px;
  font-weight: 600;
  color: #1c1f23;
}

.selector-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 20px;
  color: #8f959e;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selector-close:hover {
  background: #e5e6eb;
  color: #1c1f23;
}

.selector-list {
  max-height: 240px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.selector-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f2f3f5;
  position: relative;
}

.selector-item:last-child {
  border-bottom: none;
}

.selector-item:hover {
  background: #f7f8fa;
}

.selector-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.selector-info {
  flex: 1;
  overflow: hidden;
}

.selector-name {
  font-size: 14px;
  font-weight: 600;
  color: #1c1f23;
  margin-bottom: 2px;
}

.selector-desc {
  font-size: 12px;
  color: #8f959e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selector-checkbox {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.selector-checkmark {
  width: 24px;
  height: 24px;
  border: 2px solid #c9cdd4;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: white;
  transition: all 0.2s;
  flex-shrink: 0;
}

.selector-checkbox:checked + .selector-checkmark {
  background: #5b8ff9;
  border-color: #5b8ff9;
}

.selector-empty {
  padding: 24px;
  text-align: center;
  color: #8f959e;
  font-size: 14px;
}

/* 角色选择按钮 */
.character-select-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #e5e6eb;
  border-radius: 10px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  position: relative;
}

.character-select-btn.active {
  background: #e8f3ff;
  border: 2px solid #5b8ff9;
}

.select-count {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #5b8ff9;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 8px;
  min-width: 18px;
  text-align: center;
}

/* @提及面板包装器 */
.mention-panel-wrapper {
  position: absolute;
  bottom: 100%;
  left: 20px;
  right: 20px;
  max-width: 680px;
  margin: 0 auto;
  z-index: 100;
}

/* @提及面板 */
.mention-panel {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid #e5e6eb;
  overflow: hidden;
}

.mention-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e6eb;
  background: #f7f8fa;
}

.mention-title {
  font-size: 14px;
  font-weight: 600;
  color: #1c1f23;
}

.mention-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 20px;
  color: #8f959e;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mention-close:hover {
  background: #e5e6eb;
}

.mention-list {
  max-height: 240px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mention-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f2f3f5;
}

.mention-item:last-child {
  border-bottom: none;
}

.mention-item:hover {
  background: #f7f8fa;
}

.mention-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.mention-info {
  flex: 1;
  overflow: hidden;
}

.mention-name {
  font-size: 14px;
  font-weight: 600;
  color: #1c1f23;
  margin-bottom: 2px;
}

.mention-desc {
  font-size: 12px;
  color: #8f959e;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mention-empty {
  padding: 24px;
  text-align: center;
  color: #8f959e;
  font-size: 14px;
}





/* 输入区域 */
.input-wrapper {
  position: relative;
  border-top: 1px solid var(--border);
  background: var(--bg-primary);
  padding: 16px 20px 12px;
}

.input-tools {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.tool-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border: none;
  background: var(--bg-tertiary);
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--text-primary);
}

.tool-btn:hover {
  background: var(--border);
  transform: scale(1.05);
}

.tool-btn.active {
  background: rgba(91, 143, 249, 0.15);
  color: var(--primary-color);
}

.tool-count {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--primary-color);
  color: white;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 10px;
  font-weight: 600;
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex: 1;
  max-width: 900px;
  margin: 0 auto;
  background: var(--bg-tertiary);
  border-radius: 16px;
  padding: 12px 16px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.input-container:focus-within {
  background: #ffffff;
  border-color: #5b8ff9;
  box-shadow: 0 2px 12px rgba(91, 143, 249, 0.15);
}

.input-box {
  flex: 1;
  display: flex;
  align-items: flex-end;
}

.message-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 15px;
  line-height: 1.6;
  padding: 8px 0;
  resize: none;
  font-family: inherit;
  max-height: 200px;
}

.message-input:focus {
  outline: none;
}

.message-input::placeholder {
  color: #c9cdd4;
}

.message-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-button {
  width: 40px;
  height: 40px;
  border: none;
  background: #e5e6eb;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  color: #8f959e;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.send-button.active {
  background: linear-gradient(135deg, #5b8ff9, #3d72f6);
  color: white;
}

.send-button.active:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(91, 143, 249, 0.3);
}

.send-button:disabled {
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.input-footer {
  text-align: center;
  padding-top: 12px;
  font-size: 12px;
  color: #c9cdd4;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .welcome-message {
    padding: 24px 16px;
  }

  .welcome-avatar {
    font-size: 48px;
  }

  .welcome-message h1 {
    font-size: 24px;
  }

  .welcome-subtitle {
    font-size: 14px;
    margin-bottom: 24px;
  }

  .quick-actions {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .quick-action-btn {
    padding: 12px 16px;
    font-size: 13px;
  }

  .message-list {
    padding: 16px;
  }

  .message-item {
    gap: 12px;
    margin-bottom: 24px;
  }

  .avatar-icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .message-body {
    max-width: calc(100% - 50px);
  }

  .message-text {
    font-size: 14px;
  }

  .mention-panel {
    left: 16px;
    right: 16px;
    max-width: none;
  }

  .input-wrapper {
    padding: 12px 16px;
  }

  .input-container {
    padding: 10px 12px;
  }

  .message-input {
    font-size: 16px; /* 防止 iOS 缩放 */
  }

  .send-button {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .character-select-btn {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .character-selector {
    left: 16px;
    right: 16px;
    max-width: none;
  }

  .input-container {
    gap: 8px;
  }
}

/* 小屏幕手机 */
@media (max-width: 375px) {
  .welcome-message h1 {
    font-size: 20px;
  }

  .mention-avatar {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  .mention-name {
    font-size: 13px;
  }

  .mention-desc {
    font-size: 11px;
  }
}

/* 弹窗覆盖层 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 16px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.search-modal-wrapper,
.templates-modal-wrapper {
  overflow-y: auto;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .input-tools {
    flex-wrap: wrap;
  }
}
</style>
