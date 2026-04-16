<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  apiUrl: String,
  apiKey: String,
  model: String
})

const messages = ref([])
const inputMessage = ref('')
const isLoading = ref(false)
const messagesContainer = ref(null)

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userMessage = {
    role: 'user',
    content: inputMessage.value.trim(),
    timestamp: new Date().toLocaleTimeString()
  }

  messages.value.push(userMessage)
  inputMessage.value = ''
  isLoading.value = true
  await scrollToBottom()

  // 创建 AI 消息占位
  const aiMessage = {
    role: 'assistant',
    content: '',
    timestamp: new Date().toLocaleTimeString(),
    isStreaming: true
  }
  messages.value.push(aiMessage)

  try {
    const response = await fetch(`${props.apiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${props.apiKey}`
      },
      body: JSON.stringify({
        model: props.model || 'qwen-plus',
        messages: messages.value.slice(0, -1).map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

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
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    aiMessage.isStreaming = false
  } catch (error) {
    aiMessage.content = `❌ 错误：${error.message}`
    aiMessage.isStreaming = false
  }

  isLoading.value = false
  await scrollToBottom()
}

// 清空对话
const clearChat = () => {
  if (confirm('确定要清空当前对话吗？')) {
    messages.value = []
  }
}

// 处理回车发送
const handleEnter = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="chat-container">
    <!-- 消息列表 -->
    <div ref="messagesContainer" class="messages-container">
      <div v-if="messages.length === 0" class="welcome-message">
        <div class="welcome-icon">👋</div>
        <h2>欢迎使用 AI Chat</h2>
        <p>输入消息开始对话吧～</p>
      </div>

      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['message', message.role]"
      >
        <div class="message-avatar">
          {{ message.role === 'user' ? '👤' : '🤖' }}
        </div>
        <div class="message-content">
          <div class="message-text">{{ message.content }}</div>
          <div class="message-time">{{ message.timestamp }}</div>
          <div v-if="message.isStreaming" class="streaming-indicator">
            <span class="dot">●</span> 正在输入...
          </div>
        </div>
      </div>

      <div v-if="isLoading && messages.length === 0" class="loading-message">
        <span class="loading-dots">
          <span></span><span></span><span></span>
        </span>
        AI 正在思考中...
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <button @click="clearChat" class="clear-btn" title="清空对话">
        🗑️
      </button>
      <textarea
        v-model="inputMessage"
        @keydown="handleEnter"
        placeholder="输入消息... (Shift+Enter 换行)"
        :disabled="isLoading"
        rows="1"
        class="message-input"
      ></textarea>
      <button
        @click="sendMessage"
        :disabled="!inputMessage.trim() || isLoading"
        class="send-btn"
      >
        <span v-if="!isLoading">📤</span>
        <span v-else class="sending-loader"></span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

/* 消息列表 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  scroll-behavior: smooth;
}

.welcome-message {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.welcome-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.welcome-message h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 消息样式 */
.message {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  font-size: 2rem;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 12px;
}

.message.user .message-content {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.message-text {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 0.5rem;
}

.streaming-indicator {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dot {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* 加载状态 */
.loading-message {
  text-align: center;
  padding: 2rem;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.loading-dots {
  display: flex;
  gap: 0.25rem;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  background: #667eea;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* 输入区域 */
.input-area {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  background: white;
}

.clear-btn {
  padding: 0.75rem;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  background: #fee;
  transform: scale(1.1);
}

.message-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #eee;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: none;
  transition: all 0.3s ease;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
}

.message-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.send-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sending-loader {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 响应式 */
@media (max-width: 768px) {
  .message-content {
    max-width: 85%;
  }

  .input-area {
    padding: 0.75rem;
  }

  .message-input {
    font-size: 16px; /* 防止 iOS 缩放 */
  }
}
</style>
