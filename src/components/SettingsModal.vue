<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { isFallbackMode } from '../utils/db.js'

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
const dbMode = ref(null)

// 多 API 配置
const apiList = ref([])
const editingApiIndex = ref(-1)

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

// 初始化 API 列表
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    localConfig.value = { ...props.config }
    localCharacters.value = props.characters ? [...props.characters] : []
    
    // 初始化 API 列表
    if (props.config?.apiList && props.config.apiList.length > 0) {
      apiList.value = JSON.parse(JSON.stringify(props.config.apiList))
    } else if (props.config?.apiUrl) {
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

onMounted(async () => {
  dbMode.value = isFallbackMode() ? 'localStorage' : 'IndexedDB'
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
    apiList.value[editingApiIndex.value].url = preset.url
  } else {
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
    ElMessage.warning('至少需要保留一个 API 喵～')
    return
  }
  ElMessageBox.confirm('确定要删除这个 API 配置吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    apiList.value.splice(index, 1)
    if (editingApiIndex.value >= index) {
      editingApiIndex.value = -1
    }
    ElMessage.success('删除成功')
  }).catch(() => {})
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
      ElMessage.warning('请输入 API 名称喵～')
      return
    }
    if (!api.url.trim()) {
      ElMessage.warning('请输入 API 地址喵～')
      return
    }
    if (!api.key.trim()) {
      ElMessage.warning('请输入 API Key 喵～')
      return
    }
    api.url = api.url.replace(/\/$/, '')
  }
  editingApiIndex.value = -1
}

// 取消编辑
const cancelEditApi = () => {
  if (editingApiIndex.value >= 0 && apiList.value[editingApiIndex.value].url === '') {
    apiList.value.splice(editingApiIndex.value, 1)
  }
  editingApiIndex.value = -1
}

const handleSubmit = () => {
  console.log('[Settings] 提交配置，apiList:', apiList.value)
  
  if (apiList.value.length === 0) {
    ElMessage.warning('请至少添加一个 API 配置喵～')
    return
  }
  
  for (let i = 0; i < apiList.value.length; i++) {
    const api = apiList.value[i]
    if (!api.name.trim()) {
      ElMessage.warning(`第${i + 1}个 API 名称不能为空喵～`)
      return
    }
    if (!api.url.trim()) {
      ElMessage.warning(`第${i + 1}个 API 地址不能为空喵～`)
      return
    }
    if (!api.key.trim()) {
      ElMessage.warning(`第${i + 1}个 API Key 不能为空喵～`)
      return
    }
    api.url = api.url.replace(/\/$/, '')
  }
  
  localConfig.value.apiList = JSON.parse(JSON.stringify(apiList.value))
  
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
  ElMessage.success('角色配置已保存喵～✨')
}

const editCharacter = (id) => {
  editingCharacterId.value = id
  // 使用 nextTick 确保 DOM 更新后再切换 tab
  setTimeout(() => {
    activeTab.value = 'edit'
  }, 50)
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

const deleteCharacter = (id) => {
  if (localCharacters.value.length <= 1) {
    ElMessage.warning('至少需要保留一个角色喵～')
    return
  }
  ElMessageBox.confirm('确定要删除这个角色吗？删除后无法恢复喵～', '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
    distinguishCancelAndClose: true,
  }).then(() => {
    localCharacters.value = localCharacters.value.filter(c => c.id !== id)
    ElMessage.success('删除成功喵～✨')
  }).catch(() => {
    // 用户取消
  })
}

const addCharacter = () => {
  if (localCharacters.value.length >= 4) {
    ElMessage.warning('最多只能创建 4 个角色喵～')
    return
  }
  
  const usedIds = localCharacters.value.map(c => c.id)
  const nextId = availableIds.find(id => !usedIds.includes(id))
  
  if (!nextId) {
    ElMessage.warning('角色数量已达上限喵～')
    return
  }
  
  const newCharacter = {
    id: nextId,
    name: `新角色${nextId}`,
    enabled: true,
    description: '描述这个角色的性格特点',
    style: '描述说话风格',
    quirks: '描述口癖或口头禅',
    emoji: '✨💖',
    apiIndex: 0
  }
  
  localCharacters.value.push(newCharacter)
  editCharacter(nextId)
}

const usedIds = computed(() => {
  return localCharacters.value.map(c => c.id)
})

const canAddCharacter = computed(() => {
  return localCharacters.value.length < 4
})

const defaultCharacters = [
  { id: 1, name: 'Kira', enabled: true, description: '刚毕业的女大学生，活泼可爱', style: '活泼开朗、可爱', quirks: '喜欢用"喵"口癖', emoji: '✨💖🐱', apiIndex: 0 },
  { id: 2, name: '小智', enabled: true, description: '理性专业的助手', style: '简洁、专业', quirks: '无特殊口癖', emoji: '🤖💡', apiIndex: 0 },
  { id: 3, name: '暖暖', enabled: true, description: '温柔体贴的大姐姐', style: '温柔、耐心', quirks: '喜欢用"呢"、"哦"', emoji: '🌸💕', apiIndex: 0 },
  { id: 4, name: '博士', enabled: false, description: '知识渊博的学者', style: '严谨、学术', quirks: '喜欢引用数据', emoji: '📚🔬', apiIndex: 0 }
]

const resetToDefaults = () => {
  ElMessageBox.confirm('确定要恢复默认人设吗？当前自定义的人设将会被覆盖喵～', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    localCharacters.value = defaultCharacters.map(c => ({ ...c }))
    ElMessage.success('已恢复默认人设喵～✨')
  }).catch(() => {})
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="⚙️ 设置"
    width="600px"
    :close-on-click-modal="false"
  >
    <!-- 状态指示器 -->
    <div style="margin-bottom: 16px; font-size: 12px; color: var(--el-text-color-secondary);">
      <el-tag :type="dbMode === 'IndexedDB' ? 'success' : 'warning'" size="small">
        {{ dbMode === 'localStorage' ? '📝' : '💾' }} {{ dbMode }}
      </el-tag>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="🔌 API 配置" name="api">
        <el-alert
          title="多 API 配置"
          description="可以配置多个 API，在人设设置中为不同角色分配不同的 API。如果只有一个 API，所有角色默认使用它。第一个 API 会作为默认 API 使用。"
          type="info"
          show-icon
          :closable="false"
          style="margin-bottom: 16px;"
        />

        <!-- API 列表 -->
        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="font-weight: 600;">API 列表（{{ apiList.length }}个）</span>
            <el-button type="primary" size="small" @click="addApi">➕ 添加 API</el-button>
          </div>

          <el-card v-for="(api, index) in apiList" :key="index" style="margin-bottom: 12px;">
            <!-- 编辑模式 -->
            <div v-if="editingApiIndex === index">
              <el-form :model="api" label-position="top" size="small">
                <el-row :gutter="16">
                  <el-col :span="18">
                    <el-form-item label="API 名称">
                      <el-input v-model="api.name" placeholder="如：阿里云、OpenAI" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="操作">
                      <div style="display: flex; gap: 4px;">
                        <el-button :disabled="index === 0" @click="moveApiUp(index)" icon="Top">上移</el-button>
                        <el-button :disabled="index === apiList.length - 1" @click="moveApiDown(index)" icon="Bottom">下移</el-button>
                        <el-button type="danger" @click="deleteApi(index)" icon="Delete">删除</el-button>
                      </div>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="16">
                  <el-col :span="18">
                    <el-form-item label="API 地址">
                      <el-input v-model="api.url" placeholder="https://..." />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="预设">
                      <el-popover trigger="click" placement="bottom" :width="200">
                        <template #reference>
                          <el-button size="small">选择预设</el-button>
                        </template>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                          <el-button 
                            v-for="preset in apiPresets" 
                            :key="preset.name"
                            size="small"
                            @click="selectPreset(preset)"
                          >
                            {{ preset.name }}
                          </el-button>
                        </div>
                      </el-popover>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="API Key">
                      <el-input v-model="api.key" type="password" placeholder="请输入 API Key" show-password />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="模型名称">
                      <el-input v-model="api.model" placeholder="如：qwen-plus" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item>
                  <el-button @click="cancelEditApi">取消</el-button>
                  <el-button type="primary" @click="saveApiEdit">保存</el-button>
                </el-form-item>
              </el-form>
            </div>

            <!-- 显示模式 -->
            <div v-else style="cursor: pointer;" @click="editApi(index)">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 600; margin-bottom: 4px;">{{ api.name || '未命名 API' }}</div>
                  <div style="font-size: 12px; color: var(--el-text-color-secondary);">{{ api.url }}</div>
                  <div style="font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px;">
                    模型：{{ api.model || 'qwen-plus' }}
                  </div>
                </div>
                <el-button size="small">✏️ 编辑</el-button>
              </div>
            </div>
          </el-card>

          <el-empty v-if="apiList.length === 0" description="暂无 API 配置，请点击上方按钮添加喵～" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="🎭 角色管理" name="characters">
        <el-alert
          title="角色管理"
          description="配置 1-4 个角色的人设。点击左侧角色名单进行单聊，点击'群聊'让所有角色一起讨论。在群聊中可以勾选要回复的角色喵～"
          type="info"
          show-icon
          :closable="false"
          style="margin-bottom: 16px;"
        />

        <!-- 操作按钮 -->
        <div style="display: flex; gap: 12px; margin-bottom: 16px;">
          <el-button 
            type="success" 
            :disabled="!canAddCharacter"
            @click="addCharacter"
            icon="Plus"
          >
            {{ canAddCharacter ? '添加新角色' : '已达上限 (4/4)' }}
          </el-button>
          <el-button type="warning" @click="resetToDefaults" icon="Refresh">
            恢复默认人设
          </el-button>
        </div>

        <!-- 角色列表 -->
        <el-card v-for="(char, index) in localCharacters" :key="char.id" style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="display: flex; gap: 12px;">
              <div 
                :style="{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '50%', 
                  background: getCharacterColor(index),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px'
                }"
              >
                {{ getCharacterAvatar(char.id) }}
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">{{ char.name }}</div>
                <div style="font-size: 13px; color: var(--el-text-color-secondary); line-height: 1.5;">
                  {{ char.description }}
                </div>
                <div style="margin-top: 8px; display: flex; gap: 8px;">
                  <el-button size="small" @click="editCharacter(char.id)">✏️ 编辑</el-button>
                  <el-button 
                    size="small" 
                    type="danger"
                    :disabled="localCharacters.length <= 1"
                    @click="deleteCharacter(char.id)"
                  >
                    🗑️ 删除
                  </el-button>
                </div>
              </div>
            </div>
            <el-switch
              v-model="char.enabled"
              active-text="启用"
              inactive-text="禁用"
            />
          </div>
        </el-card>

        <el-button type="primary" @click="saveCharacters" style="width: 100%;" icon="Check">
          保存角色配置
        </el-button>
      </el-tab-pane>

      <el-tab-pane v-if="activeTab === 'edit'" label="✏️ 编辑角色" name="edit">
        <div v-for="char in localCharacters" :key="char.id" v-show="char.id === editingCharacterId">
          <el-form label-position="top">
            <el-form-item label="角色名字">
              <el-input v-model="char.name" />
            </el-form-item>

            <el-form-item label="使用的 API">
              <el-select v-model="char.apiIndex" placeholder="选择 API" style="width: 100%;">
                <el-option
                  v-for="(api, idx) in apiList"
                  :key="idx"
                  :label="`${api.name || 'API ' + (idx + 1)} (${api.url})`"
                  :value="idx"
                />
              </el-select>
              <el-alert
                v-if="apiList.length <= 1"
                title="只有一个 API 时，所有角色都使用它喵～"
                type="info"
                :closable="false"
                style="margin-top: 8px;"
              />
              <el-alert
                v-else
                title="为这个角色选择使用的 API，不同角色可以用不同的 API 喵～ ✨"
                type="success"
                :closable="false"
                style="margin-top: 8px;"
              />
            </el-form-item>

            <el-form-item label="性格描述">
              <el-input v-model="char.description" type="textarea" :rows="2" placeholder="例如：刚毕业的女大学生，活泼可爱" />
            </el-form-item>

            <el-form-item label="说话风格">
              <el-input v-model="char.style" type="textarea" :rows="2" placeholder="例如：活泼开朗、可爱、热心肠" />
            </el-form-item>

            <el-form-item label="口癖/口头禅">
              <el-input v-model="char.quirks" type="textarea" :rows="2" placeholder="例如：喜欢用'喵'口癖" />
            </el-form-item>

            <el-form-item label="表情习惯">
              <el-input v-model="char.emoji" type="textarea" :rows="2" placeholder="例如：✨💖🐱" />
            </el-form-item>

            <el-form-item>
              <el-button @click="cancelEdit">返回</el-button>
              <el-button type="primary" @click="updateCharacter">保存</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="activeTab === 'edit' ? cancelEdit() : emit('update:modelValue', false)">
        {{ activeTab === 'edit' ? '返回' : '取消' }}
      </el-button>
      <el-button 
        v-if="activeTab === 'api'"
        type="primary" 
        @click="handleSubmit"
      >
        保存配置
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
:deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid var(--el-border-color);
}

:deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--el-border-color);
}

:deep(.el-tabs__header) {
  margin-bottom: 20px;
}

:deep(.el-tabs__item) {
  font-size: 14px;
  padding: 0 20px;
}

:deep(.el-card__body) {
  padding: 16px 20px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
