<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  config: Object,
  characters: Array
})

const emit = defineEmits(['update:modelValue', 'save', 'saveCharacters'])

const localConfig = ref({ ...props.config })
const localCharacters = ref(props.characters ? [...props.characters] : [])
const activeTab = ref('api')
const editingCharacterId = ref(null)

// 角色颜色
const characterColors = [
  'linear-gradient(135deg, #ff9a9e, #fad0c4)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #84fab0, #8fd3f4)',
  'linear-gradient(135deg, #fccb90, #d57eeb)'
]

// 角色头像
const characterAvatars = { 1: '🐱', 2: '🤖', 3: '🌸', 4: '🎓' }

// 可用 ID 池
const availableIds = [1, 2, 3, 4]

// 监听弹窗打开
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    localConfig.value = { ...props.config }
    localCharacters.value = props.characters ? [...props.characters] : []
  }
})

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

const handleSubmit = () => {
  if (!localConfig.value.apiUrl.trim()) {
    alert('请输入 API 地址喵～')
    return
  }
  if (!localConfig.value.apiKey.trim()) {
    alert('请输入 API Key 喵～')
    return
  }
  localConfig.value.apiUrl = localConfig.value.apiUrl.replace(/\/$/, '')
  emit('save', localConfig.value)
}

const saveCharacters = () => {
  emit('saveCharacters', localCharacters.value)
  alert('角色配置已保存喵～✨')
}

const editCharacter = (id) => {
  editingCharacterId.value = id
  activeTab.value = 'edit'
}

const getCharacterById = (id) => {
  return localCharacters.value.find(c => c.id === id)
}

const getCharacterAvatar = (id) => {
  return characterAvatars[id] || '🤖'
}

const getCharacterColor = (index) => {
  return characterColors[index] || characterColors[0]
}

const updateCharacter = () => {
  const index = localCharacters.value.findIndex(c => c.id === editingCharacterId.value)
  if (index !== -1) {
    localCharacters.value[index] = { ...localCharacters.value[index] }
  }
  activeTab.value = 'characters'
  editingCharacterId.value = null
}

const cancelEdit = () => {
  activeTab.value = 'characters'
  editingCharacterId.value = null
}

// 删除角色
const deleteCharacter = (id) => {
  if (localCharacters.value.length <= 1) {
    alert('至少需要保留一个角色喵～')
    return
  }
  if (confirm('确定要删除这个角色吗？')) {
    localCharacters.value = localCharacters.value.filter(c => c.id !== id)
  }
}

// 新增角色
const addCharacter = () => {
  if (localCharacters.value.length >= 4) {
    alert('最多只能创建 4 个角色喵～')
    return
  }
  
  // 找到下一个可用 ID
  const usedIds = localCharacters.value.map(c => c.id)
  const nextId = availableIds.find(id => !usedIds.includes(id))
  
  if (!nextId) {
    alert('角色数量已达上限喵～')
    return
  }
  
  const newCharacter = {
    id: nextId,
    name: `新角色${nextId}`,
    enabled: true,
    description: '描述这个角色的性格特点',
    style: '描述说话风格',
    quirks: '描述口癖或口头禅',
    emoji: '✨💖'
  }
  
  localCharacters.value.push(newCharacter)
  editCharacter(nextId)
}

// 已使用的 ID
const usedIds = computed(() => {
  return localCharacters.value.map(c => c.id)
})

// 可添加角色
const canAddCharacter = computed(() => {
  return localCharacters.value.length < 4
})

// 默认人设
const defaultCharacters = [
  { id: 1, name: 'Kira', enabled: true, description: '刚毕业的女大学生，活泼可爱', style: '活泼开朗、可爱', quirks: '喜欢用"喵"口癖', emoji: '✨💖🐱' },
  { id: 2, name: '小智', enabled: true, description: '理性专业的助手', style: '简洁、专业', quirks: '无特殊口癖', emoji: '🤖💡' },
  { id: 3, name: '暖暖', enabled: true, description: '温柔体贴的大姐姐', style: '温柔、耐心', quirks: '喜欢用"呢"、"哦"', emoji: '🌸💕' },
  { id: 4, name: '博士', enabled: false, description: '知识渊博的学者', style: '严谨、学术', quirks: '喜欢引用数据', emoji: '📚🔬' }
]

// 恢复默认人设
const resetToDefaults = () => {
  if (confirm('确定要恢复默认人设吗？当前自定义的人设将会被覆盖喵～')) {
    localCharacters.value = defaultCharacters.map(c => ({ ...c }))
    alert('已恢复默认人设喵～✨')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="emit('update:modelValue', false)">
        <div class="modal">
          <!-- 头部 -->
          <div class="modal-header">
            <h2 class="modal-title">⚙️ 设置</h2>
            <button @click="emit('update:modelValue', false)" class="modal-close">×</button>
          </div>

          <!-- 标签页 -->
          <div class="tabs">
            <button 
              :class="['tab-btn', { active: activeTab === 'api' }]"
              @click="activeTab = 'api'"
            >
              🔌 API 配置
            </button>
            <button 
              :class="['tab-btn', { active: activeTab === 'characters' }]"
              @click="activeTab = 'characters'"
            >
              🎭 角色管理
            </button>
            <button 
              v-if="activeTab === 'edit'"
              :class="['tab-btn', 'active']"
            >
              ✏️ 编辑角色
            </button>
          </div>

          <!-- 内容 -->
          <div class="modal-content">
            <!-- API 配置 -->
            <div v-if="activeTab === 'api'">
              <div class="form-group">
                <label class="form-label">快速选择 API 服务商</label>
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

              <div class="form-group">
                <label class="form-label">API 地址 <span class="required">*</span></label>
                <input
                  v-model="localConfig.apiUrl"
                  type="url"
                  placeholder="例如：https://dashscope.aliyuncs.com/api/v1"
                  class="form-input"
                />
                <p class="form-hint">AI 服务的 API 基础地址</p>
              </div>

              <div class="form-group">
                <label class="form-label">API Key <span class="required">*</span></label>
                <input
                  v-model="localConfig.apiKey"
                  type="password"
                  placeholder="请输入你的 API Key"
                  class="form-input"
                />
                <p class="form-hint">API Key 仅保存在本地，不会上传到服务器</p>
              </div>

              <div class="form-group">
                <label class="form-label">模型名称</label>
                <input
                  v-model="localConfig.model"
                  type="text"
                  placeholder="例如：qwen-plus"
                  class="form-input"
                />
                <p class="form-hint">使用的 AI 模型名称</p>
              </div>
            </div>

            <!-- 角色列表 -->
            <div v-if="activeTab === 'characters'">
              <div class="info-box" style="margin-top: 0; margin-bottom: 1.5rem;">
                <h4>🎭 角色管理</h4>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
                  配置 1-4 个角色的人设。点击左侧角色名单进行单聊，点击"群聊"让所有角色一起讨论。
                  在群聊中可以勾选要回复的角色喵～
                </p>
              </div>

              <!-- 操作按钮区域 -->
              <div class="action-buttons-section">
                <button 
                  @click="addCharacter" 
                  :disabled="!canAddCharacter"
                  :class="['action-btn', 'add-btn', { disabled: !canAddCharacter }]"
                >
                  <span class="btn-icon">➕</span>
                  <span>{{ canAddCharacter ? '添加新角色' : '已达上限 (4/4)' }}</span>
                </button>
                <button 
                  @click="resetToDefaults"
                  class="action-btn reset-btn"
                >
                  <span class="btn-icon">🔄</span>
                  <span>恢复默认人设</span>
                </button>
              </div>

              <div class="character-list">
                <div 
                  v-for="(char, index) in localCharacters" 
                  :key="char.id"
                  class="character-item"
                >
                  <div class="character-main">
                    <div class="character-avatar" :style="{ background: getCharacterColor(index) }">
                      {{ getCharacterAvatar(char.id) }}
                    </div>
                    <div class="character-details">
                      <div class="character-name">{{ char.name }}</div>
                      <div class="character-desc">{{ char.description }}</div>
                      <div class="character-actions-row">
                        <button @click="editCharacter(char.id)" class="edit-btn-small">
                          ✏️ 编辑
                        </button>
                        <button 
                          @click="deleteCharacter(char.id)" 
                          class="delete-btn-small"
                          :disabled="localCharacters.length <= 1"
                        >
                          🗑️ 删除
                        </button>
                      </div>
                    </div>
                  </div>
                  <label class="switch">
                    <input type="checkbox" v-model="char.enabled" />
                    <span class="slider"></span>
                  </label>
                </div>
              </div>

              <div class="character-actions">
                <button @click="saveCharacters" class="btn-primary">
                  💾 保存角色配置
                </button>
              </div>
            </div>

            <!-- 编辑角色 -->
            <div v-if="activeTab === 'edit'">
              <div v-for="char in localCharacters" :key="char.id" v-show="char.id === editingCharacterId">
                <div class="form-group">
                  <label class="form-label">角色名字</label>
                  <input v-model="char.name" type="text" class="form-input" />
                </div>

                <div class="form-group">
                  <label class="form-label">性格描述</label>
                  <textarea v-model="char.description" rows="2" class="form-input" style="resize: vertical;"></textarea>
                  <p class="form-hint">例如：刚毕业的女大学生，活泼可爱</p>
                </div>

                <div class="form-group">
                  <label class="form-label">说话风格</label>
                  <textarea v-model="char.style" rows="2" class="form-input" style="resize: vertical;"></textarea>
                  <p class="form-hint">例如：活泼开朗、可爱、热心肠</p>
                </div>

                <div class="form-group">
                  <label class="form-label">口癖/口头禅</label>
                  <textarea v-model="char.quirks" rows="2" class="form-input" style="resize: vertical;"></textarea>
                  <p class="form-hint">例如：喜欢用"喵"口癖</p>
                </div>

                <div class="form-group">
                  <label class="form-label">表情习惯</label>
                  <textarea v-model="char.emoji" rows="2" class="form-input" style="resize: vertical;"></textarea>
                  <p class="form-hint">例如：✨💖🐱</p>
                </div>

                <div class="character-actions">
                  <button @click="cancelEdit" class="btn-secondary">返回</button>
                  <button @click="updateCharacter" class="btn-primary">保存</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部 -->
          <div class="modal-footer" v-if="activeTab === 'api' || activeTab === 'edit'">
            <button @click="activeTab === 'edit' ? cancelEdit() : emit('update:modelValue', false)" class="btn-secondary">
              {{ activeTab === 'edit' ? '返回' : '取消' }}
            </button>
            <button 
              v-if="activeTab === 'api'"
              @click="handleSubmit" 
              class="btn-primary"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border, #e5e6eb);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #1c1f23);
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-tertiary, #f2f3f5);
  border-radius: 6px;
  font-size: 1.5rem;
  color: var(--text-secondary, #646a73);
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--border, #e5e6eb);
}

/* 标签页 */
.tabs {
  display: flex;
  border-bottom: 1px solid var(--border, #e5e6eb);
  padding: 0 1.5rem;
}

.tab-btn {
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, #646a73);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text-primary, #1c1f23);
}

.tab-btn.active {
  color: var(--primary-color, #5b8ff9);
  border-bottom-color: var(--primary-color, #5b8ff9);
}

/* 内容区 */
.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 500;
  color: var(--text-primary, #1c1f23);
  margin-bottom: 0.5rem;
  font-size: 14px;
}

.required {
  color: var(--error, #f53f3f);
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.preset-btn {
  padding: 0.5rem 1rem;
  background: var(--bg-tertiary, #f2f3f5);
  border: 1px solid var(--border, #e5e6eb);
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary, #1c1f23);
}

.preset-btn:hover {
  border-color: var(--primary-color, #5b8ff9);
  background: var(--bg-primary, #ffffff);
  transform: translateY(-1px);
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border, #e5e6eb);
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #1c1f23);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color, #5b8ff9);
  box-shadow: 0 0 0 3px rgba(91, 143, 249, 0.1);
}

.form-input::placeholder {
  color: var(--text-quaternary, #c9cdd4);
}

.form-hint {
  font-size: 0.85rem;
  color: var(--text-tertiary, #8f959e);
  margin-top: 0.5rem;
}

.info-box {
  background: linear-gradient(135deg, rgba(91, 143, 249, 0.08), rgba(61, 114, 246, 0.08));
  border-left: 4px solid var(--primary-color, #5b8ff9);
  padding: 1rem;
  border-radius: 8px;
}

.info-box h4 {
  font-size: 0.95rem;
  color: var(--primary-color, #5b8ff9);
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.info-box p {
  font-size: 0.85rem;
  color: var(--text-secondary, #646a73);
  margin: 0.5rem 0 0;
  line-height: 1.6;
}

.info-box code {
  background: #ffffff;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  color: var(--primary-color, #5b8ff9);
}

/* 操作按钮区域 */
.action-buttons-section {
  display: flex;
  gap: 12px;
  margin-bottom: 1.5rem;
}

.action-btn {
  flex: 1;
  padding: 14px 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  border: none;
}

.add-btn {
  background: linear-gradient(135deg, #f7f8fa, #e8eaed);
  border: 2px dashed #c9cdd4;
  color: #646a73;
}

.add-btn:not(.disabled):hover {
  background: linear-gradient(135deg, #e8f3ff, #d0e8ff);
  border-color: #5b8ff9;
  color: #5b8ff9;
}

.add-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reset-btn {
  background: linear-gradient(135deg, #fff5f5, #fee2e2);
  border: 2px dashed #fca5a5;
  color: #dc2626;
}

.reset-btn:hover {
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  border-color: #f87171;
  color: #b91c1c;
}

.btn-icon {
  font-size: 16px;
}

/* 角色列表 */
.character-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 1.5rem;
}

.character-item {
  background: var(--bg-tertiary, #f2f3f5);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border, #e5e6eb);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.character-main {
  display: flex;
  gap: 12px;
  flex: 1;
}

.character-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.character-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.character-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1c1f23);
}

.character-desc {
  font-size: 13px;
  color: var(--text-tertiary, #8f959e);
  line-height: 1.5;
}

.character-actions-row {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.edit-btn-small {
  padding: 6px 12px;
  background: #ffffff;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: #1c1f23;
}

.edit-btn-small:hover {
  background: #f2f3f5;
  border-color: #5b8ff9;
  color: #5b8ff9;
}

.delete-btn-small {
  padding: 6px 12px;
  background: #ffffff;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: #1c1f23;
}

.delete-btn-small:hover {
  background: #fff5f5;
  border-color: #f53f3f;
  color: #f53f3f;
}

.delete-btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 开关按钮 */
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 26px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--primary-color, #5b8ff9);
}

input:checked + .slider:before {
  transform: translateX(22px);
}

/* 角色操作按钮 */
.character-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border, #e5e6eb);
}

.character-actions .btn-secondary {
  flex: 1;
}

.character-actions .btn-primary {
  flex: 2;
}

/* 底部 */
.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border, #e5e6eb);
}

.modal-footer .btn-secondary {
  flex: 1;
}

.modal-footer .btn-primary {
  flex: 2;
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

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.9) translateY(20px);
}

/* 响应式 */
@media (max-width: 768px) {
  .modal {
    max-height: 95vh;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-footer .btn-primary {
    order: -1;
  }

  .tabs {
    padding: 0 1rem;
  }

  .tab-btn {
    padding: 0.75rem 1rem;
    font-size: 13px;
  }

  .modal-content {
    padding: 1rem;
  }

  .character-item {
    flex-direction: column;
    align-items: stretch;
  }

  .character-main {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .character-avatar {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }

  .character-actions-row {
    justify-content: center;
  }

  .switch {
    align-self: center;
  }

  .action-buttons-section {
    flex-direction: column;
  }
}
</style>
