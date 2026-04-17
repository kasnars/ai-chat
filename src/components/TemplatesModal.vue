<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, set, STORES } from '../utils/db.js'

const emit = defineEmits(['insert', 'close'])

const templates = ref([])
const editingId = ref(null)
const newTemplate = ref({ title: '', content: '', category: '常用' })
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
    ElMessage.warning('请填写标题和内容喵～')
    return
  }
  
  templates.value.push({
    id: Date.now(),
    ...newTemplate.value,
    createdAt: Date.now()
  })
  
  newTemplate.value = { title: '', content: '', category: '常用' }
  saveTemplates()
  ElMessage.success('模板添加成功喵～✨')
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
    ElMessage.success('模板更新成功喵～✨')
  }
}

const cancelEdit = () => {
  editingId.value = null
  newTemplate.value = { title: '', content: '', category: '常用' }
}

const deleteTemplate = (id) => {
  ElMessageBox.confirm('确定要删除这个模板吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    templates.value = templates.value.filter(t => t.id !== id)
    saveTemplates()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const insertTemplate = (content) => {
  emit('insert', content)
  emit('close')
}

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
  <div style="padding: 20px 0;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3 style="font-size: 16px; font-weight: 600;">⚡ 常用语/提示词模板</h3>
      <el-button @click="emit('close')" size="small" icon="Close">关闭</el-button>
    </div>
    
    <!-- 添加/编辑表单 -->
    <el-card style="margin-bottom: 20px;">
      <el-form label-position="top" size="small">
        <el-row :gutter="16">
          <el-col :span="18">
            <el-form-item label="模板标题">
              <el-input v-model="newTemplate.title" placeholder="模板标题" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="分类">
              <el-select v-model="newTemplate.category" placeholder="选择分类" style="width: 100%;">
                <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="模板内容">
          <el-input
            v-model="newTemplate.content"
            type="textarea"
            :rows="3"
            placeholder="模板内容，点击插入到输入框..."
          />
        </el-form-item>
        <el-form-item>
          <el-button v-if="editingId" @click="cancelEdit">取消</el-button>
          <el-button 
            v-if="editingId" 
            type="primary" 
            @click="updateTemplate"
            :disabled="!newTemplate.title.trim() || !newTemplate.content.trim()"
          >
            更新模板
          </el-button>
          <el-button 
            v-else 
            type="primary" 
            @click="addTemplate"
            :disabled="!newTemplate.title.trim() || !newTemplate.content.trim()"
            icon="Plus"
          >
            添加模板
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 预设模板 -->
    <div style="margin-bottom: 20px;">
      <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: var(--el-text-color-secondary);">
        💡 预设模板（点击使用）
      </h4>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        <el-tag
          v-for="preset in presetTemplates"
          :key="preset.title"
          @click="loadPreset(preset)"
          style="cursor: pointer;"
        >
          {{ preset.title }}
        </el-tag>
      </div>
    </div>
    
    <!-- 我的模板 -->
    <div>
      <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: var(--el-text-color-secondary);">
        📝 我的模板（{{ templates.length }}个）
      </h4>
      
      <el-empty v-if="templates.length === 0" description="暂无模板，添加一个喵～" :image-size="80" />
      
      <el-row v-else :gutter="16">
        <el-col :xs="24" :sm="12" :md="8" v-for="template in templates" :key="template.id">
          <el-card style="margin-bottom: 16px; height: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 600; font-size: 14px;">{{ template.title }}</span>
                <el-tag size="small">{{ template.category }}</el-tag>
              </div>
              <div style="display: flex; gap: 4px;">
                <el-button size="small" @click="editTemplate(template)" icon="Edit" />
                <el-button size="small" type="danger" @click="deleteTemplate(template.id)" icon="Delete" />
              </div>
            </div>
            <div 
              style="font-size: 13px; color: var(--el-text-color-secondary); line-height: 1.6; margin-bottom: 12px; max-height: 80px; overflow-y: auto; white-space: pre-wrap;"
              @click="insertTemplate(template.content)"
            >
              {{ template.content }}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; color: var(--el-text-color-tertiary);">
                {{ new Date(template.createdAt).toLocaleDateString('zh-CN') }}
              </span>
              <el-button type="primary" size="small" @click="insertTemplate(template.content)">
                点击插入
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
