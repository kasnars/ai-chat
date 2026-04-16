<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  config: Object
})

const emit = defineEmits(['update:modelValue', 'save'])

const localConfig = ref({ ...props.config })

// 监听弹窗打开，重置本地配置
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    localConfig.value = { ...props.config }
  }
})

const handleSubmit = () => {
  // 验证配置
  if (!localConfig.value.apiUrl.trim()) {
    alert('请输入 API 地址喵～')
    return
  }
  if (!localConfig.value.apiKey.trim()) {
    alert('请输入 API Key 喵～')
    return
  }

  // 去除末尾斜杠
  localConfig.value.apiUrl = localConfig.value.apiUrl.replace(/\/$/, '')

  emit('save', localConfig.value)
}

const handleClose = () => {
  emit('update:modelValue', false)
}

// 常用 API 预设
const apiPresets = [
  { name: '阿里云百炼', url: 'https://dashscope.aliyuncs.com/api/v1' },
  { name: 'OpenAI', url: 'https://api.openai.com/v1' },
  { name: 'DeepSeek', url: 'https://api.deepseek.com/v1' },
  { name: 'Moonshot', url: 'https://api.moonshot.cn/v1' }
]

const selectPreset = (preset) => {
  localConfig.value.apiUrl = preset.url
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="handleClose">
        <div class="modal-container">
          <!-- 头部 -->
          <div class="modal-header">
            <h2>⚙️ API 设置</h2>
            <button @click="handleClose" class="close-btn">×</button>
          </div>

          <!-- 内容 -->
          <div class="modal-content">
            <!-- API 预设 -->
            <div class="preset-section">
              <label class="label">快速选择 API 服务商</label>
              <div class="preset-buttons">
                <button
                  v-for="preset in apiPresets"
                  :key="preset.name"
                  @click="selectPreset(preset)"
                  class="preset-btn"
                >
                  {{ preset.name }}
                </button>
              </div>
            </div>

            <!-- API 地址 -->
            <div class="form-group">
              <label class="label">
                API 地址 <span class="required">*</span>
              </label>
              <input
                v-model="localConfig.apiUrl"
                type="url"
                placeholder="例如：https://dashscope.aliyuncs.com/api/v1"
                class="input"
              />
              <p class="hint">AI 服务的 API 基础地址</p>
            </div>

            <!-- API Key -->
            <div class="form-group">
              <label class="label">
                API Key <span class="required">*</span>
              </label>
              <input
                v-model="localConfig.apiKey"
                type="password"
                placeholder="请输入你的 API Key"
                class="input"
              />
              <p class="hint">API Key 仅保存在本地，不会上传到服务器</p>
            </div>

            <!-- 模型名称 -->
            <div class="form-group">
              <label class="label">模型名称</label>
              <input
                v-model="localConfig.model"
                type="text"
                placeholder="例如：qwen-plus"
                class="input"
              />
              <p class="hint">使用的 AI 模型名称</p>
            </div>

            <!-- 说明 -->
            <div class="info-box">
              <h4>💡 如何获取 API Key？</h4>
              <ol>
                <li>访问阿里云百炼控制台</li>
                <li>创建或选择一个 API Key</li>
                <li>复制 Key 并粘贴到上方</li>
              </ol>
            </div>
          </div>

          <!-- 底部 -->
          <div class="modal-footer">
            <button @click="handleClose" class="cancel-btn">取消</button>
            <button @click="handleSubmit" class="save-btn">保存配置</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 遮罩层 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

/* 弹窗容器 */
.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* 头部 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  font-size: 1.25rem;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #fee;
  color: #e74c3c;
}

/* 内容区 */
.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

/* 预设按钮 */
.preset-section {
  margin-bottom: 1.5rem;
}

.label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.required {
  color: #e74c3c;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.preset-btn {
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border: 2px solid transparent;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.preset-btn:hover {
  border-color: #667eea;
  background: white;
}

/* 表单 */
.form-group {
  margin-bottom: 1.5rem;
}

.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #eee;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: #667eea;
}

.hint {
  font-size: 0.85rem;
  color: #999;
  margin-top: 0.5rem;
}

/* 信息框 */
.info-box {
  background: linear-gradient(135deg, #667eea15, #764ba215);
  border-left: 4px solid #667eea;
  padding: 1rem;
  border-radius: 8px;
}

.info-box h4 {
  font-size: 0.95rem;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.info-box ol {
  font-size: 0.85rem;
  color: #666;
  padding-left: 1.25rem;
  line-height: 1.8;
}

/* 底部 */
.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #eee;
}

.cancel-btn {
  flex: 1;
  padding: 0.75rem;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #e5e5e5;
}

.save-btn {
  flex: 2;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(20px);
}

/* 响应式 */
@media (max-width: 768px) {
  .modal-container {
    max-height: 95vh;
  }

  .modal-footer {
    flex-direction: column;
  }

  .save-btn {
    order: -1;
  }
}
</style>
