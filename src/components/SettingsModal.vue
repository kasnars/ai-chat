<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { isFallbackMode } from '../utils/db.js'

const props = defineProps({
  modelValue: Boolean,
  config: Object,
  characters: Array
})

const dbMode = ref(null)

onMounted(async () => {
  dbMode.value = isFallbackMode() ? 'localStorage' : 'IndexedDB'
})

const emit = defineEmits(['update:modelValue', 'save', 'saveCharacters'])

const localConfig = ref({ ...props.config })
const localCharacters = ref(props.characters ? [...props.characters] : [])
const activeTab = ref('api')
const editingCharacterId = ref(null)

// 多 API 配置
const apiList = ref([])
const editingApiIndex = ref(-1)

// 初始化 API 列表
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    localConfig.value = { ...props.config }
    localCharacters.value = props.characters ? [...props.characters] : []
    
    // 初始化 API 列表
    if (props.config?.apiList && props.config.apiList.length > 0) {
      apiList.value = JSON.parse(JSON.stringify(props.config.apiList))
    } else if (props.config?.apiUrl) {
      // 兼容旧配置，转换为 API 列表
      apiList.value = [{
        name: '默认 API',
        url: props.config.apiUrl,
        key: props.config.apiKey,
        model: props.config.model || 'qwen-plus'
      }]
    } else {
      apiList.value = []
    }
  }
})

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
  if (editingApiIndex.value >= 0) {
    // 编辑模式
    apiList.value[editingApiIndex.value].url = preset.url
  } else {
    // 新增模式
    localConfig.value.apiUrl = preset.url
  }
}

// 添加 API
const addApi = () => {
  apiList.value.push({
    name: `API ${apiList.value.length + 1}`,
    url: '',
    key: '',
    model: 'qwen-plus'
  })
  editingApiIndex.value = apiList.value.length - 1
}

// 编辑 API
const editApi = (index) => {
  editingApiIndex.value = index
}

// 删除 API
const deleteApi = (index) => {
  if (apiList.value.length <= 1) {
    alert('至少需要保留一个 API 喵～')
    return
  }
  if (confirm('确定要删除这个 API 配置吗？')) {
    apiList.value.splice(index, 1)
    if (editingApiIndex.value >= index) {
      editingApiIndex.value = -1
    }
  }
}

// 上移 API
const moveApiUp = (index) => {
  if (index > 0) {
    const temp = apiList.value[index - 1]
    apiList.value[index - 1] = apiList.value[index]
    apiList.value[index] = temp
  }
}

// 下移 API
const moveApiDown = (index) => {
  if (index < apiList.value.length - 1) {
    const temp = apiList.value[index + 1]
    apiList.value[index + 1] = apiList.value[index]
    apiList.value[index] = temp
  }
}

// 保存 API 编辑
const saveApiEdit = () => {
  if (editingApiIndex.value >= 0) {
    const api = apiList.value[editingApiIndex.value]
    if (!api.name.trim()) {
      alert('请输入 API 名称喵～')
      return
    }
    if (!api.url.trim()) {
      alert('请输入 API 地址喵～')
      return
    }
    if (!api.key.trim()) {
      alert('请输入 API Key 喵～')
      return
    }
    api.url = api.url.replace(/\/$/, '')
  }
  editingApiIndex.value = -1
}

// 取消编辑
const cancelEditApi = () => {
  if (editingApiIndex.value >= 0 && apiList.value[editingApiIndex.value].url === '') {
    // 如果是新增但未填写的 API，删除它
    apiList.value.splice(editingApiIndex.value, 1)
  }
  editingApiIndex.value = -1
}

const handleSubmit = () => {
  console.log('[Settings] 提交配置，apiList:', apiList.value)
  
  // 验证 API 列表
  if (apiList.value.length === 0) {
    alert('请至少添加一个 API 配置喵～')
    return
  }
  
  for (let i = 0; i < apiList.value.length; i++) {
    const api = apiList.value[i]
    if (!api.name.trim()) {
      alert(`第${i + 1}个 API 名称不能为空喵～`)
      return
    }
    if (!api.url.trim()) {
      alert(`第${i + 1}个 API 地址不能为空喵～`)
      return
    }
    if (!api.key.trim()) {
      alert(`第${i + 1}个 API Key 不能为空喵～`)
      return
    }
    api.url = api.url.replace(/\/$/, '')
  }
  
  // 深拷贝 API 列表到配置
  localConfig.value.apiList = JSON.parse(JSON.stringify(apiList.value))
  
  // 兼容旧字段：使用第一个 API 作为默认
  if (apiList.value.length > 0) {
    localConfig.value.apiUrl = apiList.value[0].url
    localConfig.value.apiKey = apiList.value[0].key
    localConfig.value.model = apiList.value[0].model
  }
  
  console.log('[Settings] emit 配置:', localConfig.value)
  emit('save', JSON.parse(JSON.stringify(localConfig.value)))
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
            <div>
              <h2 class="modal-title">⚙️ 设置</h2>
              <div class="db-status-inline" v-if="dbMode">
                <span 
                  class="mode-dot"
                  :style="{ backgroundColor: dbMode === 'IndexedDB' ? '#5b8ff9' : '#f59e0b' }"
                  :title="dbMode === 'localStorage' ? '降级模式：IndexedDB 不可用' : '正常模式'"
                ></span>
                <span>{{ dbMode }}</span>
              </div>
            </div>
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
              <div class="info-box" style="margin-top: 0; margin-bottom: 1.5rem;">
                <h4>🔌 多 API 配置</h4>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
                  可以配置多个 API，在人设设置中为不同角色分配不同的 API。
                  如果只有一个 API，所有角色默认使用它。
                  <strong>第一个 API 会作为默认 API 使用。</strong>
                </p>
              </div>

              <!-- API 列表 -->
              <div class="api-list-section">
                <div class="api-list-header">
                  <h4>API 列表（{{ apiList.length }}个）</h4>
                  <button @click="addApi" class="add-api-btn">➕ 添加 API</button>
                </div>

                <div class="api-list">
                  <div 
                    v-for="(api, index) in apiList" 
                    :key="index"
                    :class="['api-item', { editing: editingApiIndex === index }]"
                  >
                    <!-- 编辑模式 -->
                    <div v-if="editingApiIndex === index" class="api-edit-form">
                      <div class="form-row">
                        <input
                          v-model="api.name"
                          type="text"
                          placeholder="API 名称（如：阿里云、OpenAI）"
                          class="form-input small"
                        />
                        <div class="api-actions">
                          <button @click="moveApiUp(index)" :disabled="index === 0" class="icon-btn" title="上移">⬆️</button>
                          <button @click="moveApiDown(index)" :disabled="index === apiList.length - 1" class="icon-btn" title="下移">⬇️</button>
                          <button @click="deleteApi(index)" class="icon-btn delete" title="删除">🗑️</button>
                        </div>
                      </div>
                      <div class="form-row">
                        <input
                          v-model="api.url"
                          type="url"
                          placeholder="API 地址"
                          class="form-input small"
                        />
                        <button @click="selectPreset(api)" class="preset-btn small">预设</button>
                      </div>
                      <div class="form-row">
                        <input
                          v-model="api.key"
                          type="password"
                          placeholder="API Key"
                          class="form-input small"
                        />
                        <input
                          v-model="api.model"
                          type="text"
                          placeholder="模型名称"
                          class="form-input small"
                        />
                      </div>
                      <div class="form-actions">
                        <button @click="cancelEditApi" class="btn-secondary small">取消</button>
                        <button @click="saveApiEdit" class="btn-primary small">保存</button>
                      </div>
                    </div>

                    <!-- 显示模式 -->
                    <div v-else class="api-display" @click="editApi(index)">
                      <div class="api-info">
                        <div class="api-name">{{ api.name || '未命名 API' }}</div>
                        <div class="api-url-display">{{ api.url }}</div>
                        <div class="api-model">模型：{{ api.model || 'qwen-plus' }}</div>
                      </div>
                      <button @click="editApi(index)" class="edit-api-btn">✏️ 编辑</button>
                    </div>
                  </div>

                  <div v-if="apiList.length === 0" class="empty-api-list">
                    暂无 API 配置，请点击下方按钮添加喵～
                  </div>
                </div>
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

                <!-- API 选择 -->
                <div class="form-group">
                  <label class="form-label">使用的 API</label>
                  <select v-model="char.apiIndex" class="form-input">
                    <option 
                      v-for="(api, idx) in apiList" 
                      :key="idx"
                      :value="idx"
                    >
                      {{ api.name || 'API ' + (idx + 1) }} ({{ api.url }})
                    </option>
                  </select>
                  <p class="form-hint" v-if="apiList.length <= 1">
                    只有一个 API 时，所有角色都使用它喵～
                  </p>
                  <p class="form-hint" v-else>
                    为这个角色选择使用的 API，不同角色可以用不同的 API 喵～ ✨
                  </p>
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
  margin-bottom: 4px;
}

.db-status-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-tertiary, #8f959e);
}

.mode-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
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

.preset-btn.small {
  padding: 0.4rem 0.8rem;
  font-size: 0.75rem;
}

/* API 列表样式 */
.api-list-section {
  margin-top: 1rem;
}

.api-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(91, 143, 249, 0.08), rgba(61, 114, 246, 0.08));
  border-radius: 8px;
}

.api-list-header h4 {
  font-size: 0.95rem;
  color: var(--primary-color, #5b8ff9);
  margin: 0;
}

.add-api-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #5b8ff9, #3d72f6);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.add-api-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(91, 143, 249, 0.3);
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.api-item {
  background: var(--bg-tertiary, #f2f3f5);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border, #e5e6eb);
  transition: all 0.2s;
}

.api-item.editing {
  border-color: var(--primary-color, #5b8ff9);
  background: #ffffff;
}

.api-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.api-display:hover {
  opacity: 0.8;
}

.api-info {
  flex: 1;
}

.api-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #1c1f23);
  margin-bottom: 4px;
}

.api-url-display {
  font-size: 0.85rem;
  color: var(--text-tertiary, #8f959e);
  margin-bottom: 4px;
  word-break: break-all;
}

.api-model {
  font-size: 0.75rem;
  color: var(--text-secondary, #646a73);
}

.edit-api-btn {
  padding: 0.5rem 1rem;
  background: #ffffff;
  border: 1px solid var(--border, #e5e6eb);
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary, #1c1f23);
}

.edit-api-btn:hover {
  border-color: var(--primary-color, #5b8ff9);
  color: var(--primary-color, #5b8ff9);
}

.api-edit-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.form-input.small {
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
}

.form-row .form-input {
  flex: 1;
}

.api-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-tertiary, #f2f3f5);
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: var(--border, #e5e6eb);
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-btn.delete:hover {
  background: #fff5f5;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.btn-secondary.small,
.btn-primary.small {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  flex: 1;
}

.empty-api-list {
  text-align: center;
  padding: 2rem;
  color: var(--text-tertiary, #8f959e);
  font-size: 0.9rem;
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
