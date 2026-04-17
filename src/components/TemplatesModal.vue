<script setup>
import { ref, onMounted } from 'vue'
import { get, set, STORES } from '../utils/db.js'

const emit = defineEmits(['insert', 'close'])

const templates = ref([])
const editingId = ref(null)
const newTemplate = ref({
  title: '',
  content: '',
  category: '常用'
})

const categories = ['常用', '翻译', '写作', '编程', '学习', '其他']

onMounted(async () => {
  const saved = await get(STORES.SETTINGS, 'templates')
  if (saved) {
    templates.value = saved
  }
})

const saveTemplates = async () => {
  await set(STORES.SETTINGS, 'templates', templates.value)
}

const addTemplate = () => {
  if (!newTemplate.value.title.trim() || !newTemplate.value.content.trim()) {
    alert('请填写标题和内容喵～')
    return
  }
  
  templates.value.push({
    id: Date.now(),
    ...newTemplate.value,
    createdAt: Date.now()
  })
  
  newTemplate.value = { title: '', content: '', category: '常用' }
  saveTemplates()
}

const editTemplate = (template) => {
  editingId.value = template.id
  newTemplate.value = { ...template }
}

const updateTemplate = () => {
  const index = templates.value.findIndex(t => t.id === editingId.value)
  if (index !== -1) {
    templates.value[index] = {
      ...templates.value[index],
      ...newTemplate.value
    }
    editingId.value = null
    newTemplate.value = { title: '', content: '', category: '常用' }
    saveTemplates()
  }
}

const cancelEdit = () => {
  editingId.value = null
  newTemplate.value = { title: '', content: '', category: '常用' }
}

const deleteTemplate = (id) => {
  if (confirm('确定要删除这个模板吗？')) {
    templates.value = templates.value.filter(t => t.id !== id)
    saveTemplates()
  }
}

const insertTemplate = (content) => {
  emit('insert', content)
  emit('close')
}

// 预设模板
const presetTemplates = [
  { title: '翻译', content: '请将以下内容翻译成英文：', category: '翻译' },
  { title: '润色', content: '请帮我润色以下文字，使其更加流畅优美：', category: '写作' },
  { title: '总结', content: '请用简洁的语言总结以下内容的核心要点：', category: '学习' },
  { title: '解释', content: '请用通俗易懂的方式解释以下概念：', category: '学习' },
  { title: '代码审查', content: '请帮我审查以下代码，指出潜在问题和改进建议：', category: '编程' },
  { title: '写邮件', content: '请帮我写一封正式的工作邮件，主题是：', category: '写作' }
]

const loadPreset = (preset) => {
  newTemplate.value = { ...preset }
}
</script>

<template>
  <div class="templates-modal">
    <div class="modal-header">
      <h3>⚡ 常用语/提示词模板</h3>
      <button @click="emit('close')" class="close-btn">×</button>
    </div>
    
    <!-- 添加/编辑表单 -->
    <div class="template-form">
      <div class="form-row">
        <input
          v-model="newTemplate.title"
          type="text"
          placeholder="模板标题"
          class="form-input"
        />
        <select v-model="newTemplate.category" class="form-select">
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>
      <textarea
        v-model="newTemplate.content"
        placeholder="模板内容，点击插入到输入框..."
        rows="3"
        class="form-textarea"
      ></textarea>
      <div class="form-actions">
        <button v-if="editingId" @click="cancelEdit" class="btn-secondary">取消</button>
        <button 
          v-if="editingId" 
          @click="updateTemplate" 
          :disabled="!newTemplate.title.trim() || !newTemplate.content.trim()"
          class="btn-primary"
        >
          更新模板
        </button>
        <button 
          v-else 
          @click="addTemplate" 
          :disabled="!newTemplate.title.trim() || !newTemplate.content.trim()"
          class="btn-primary"
        >
          ➕ 添加模板
        </button>
      </div>
    </div>
    
    <!-- 预设模板 -->
    <div class="preset-section">
      <h4>💡 预设模板（点击使用）</h4>
      <div class="preset-list">
        <button
          v-for="preset in presetTemplates"
          :key="preset.title"
          @click="loadPreset(preset)"
          class="preset-tag"
        >
          {{ preset.title }}
        </button>
      </div>
    </div>
    
    <!-- 我的模板 -->
    <div class="templates-list">
      <h4>📝 我的模板（{{ templates.length }}个）</h4>
      
      <div v-if="templates.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>暂无模板，添加一个喵～</p>
      </div>
      
      <div v-else class="template-grid">
        <div
          v-for="template in templates"
          :key="template.id"
          class="template-card"
        >
          <div class="template-header">
            <div class="template-title">
              <span class="template-name">{{ template.title }}</span>
              <span class="template-category">{{ template.category }}</span>
            </div>
            <div class="template-actions">
              <button @click="editTemplate(template)" class="icon-btn" title="编辑">✏️</button>
              <button @click="deleteTemplate(template.id)" class="icon-btn delete" title="删除">🗑️</button>
            </div>
          </div>
          <div class="template-content" @click="insertTemplate(template.content)">
            {{ template.content }}
          </div>
          <div class="template-footer">
            <span class="template-time">
              {{ new Date(template.createdAt).toLocaleDateString('zh-CN') }}
            </span>
            <button @click="insertTemplate(template.content)" class="insert-btn">
              点击插入
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.templates-modal {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
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
}

.template-form {
  background: var(--bg-tertiary);
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.form-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px;
  border: 2px solid var(--border);
  border-radius: 8px;
  font-size: 0.9rem;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.btn-primary {
  background: linear-gradient(135deg, #5b8ff9, #3d72f6);
  color: white;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preset-section {
  margin-bottom: 1.5rem;
}

.preset-section h4 {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.preset-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-tag {
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 16px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.preset-tag:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(91, 143, 249, 0.1);
}

.templates-list h4 {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-tertiary);
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.template-card {
  background: var(--bg-tertiary);
  border-radius: 12px;
  padding: 12px;
  border: 1px solid var(--border);
  transition: all 0.2s;
}

.template-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.template-title {
  flex: 1;
}

.template-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.template-category {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(91, 143, 249, 0.1);
  color: var(--primary-color);
  border-radius: 4px;
  font-size: 0.75rem;
  margin-left: 6px;
}

.template-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--bg-primary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: var(--border);
}

.icon-btn.delete:hover {
  background: rgba(245, 63, 63, 0.1);
}

.template-content {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
  padding: 8px;
  background: var(--bg-primary);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  max-height: 80px;
  overflow-y: auto;
  white-space: pre-wrap;
}

.template-content:hover {
  background: rgba(91, 143, 249, 0.05);
}

.template-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.insert-btn {
  padding: 4px 12px;
  background: linear-gradient(135deg, #5b8ff9, #3d72f6);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.insert-btn:hover {
  transform: scale(1.05);
}
</style>
