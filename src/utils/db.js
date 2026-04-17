/**
 * IndexedDB 数据库工具类
 * 使用 idb 库封装，带 localStorage 降级策略
 * 兼容性：支持所有现代浏览器，降级支持旧浏览器
 */

import { openDB } from 'idb'

// 数据库配置
const DB_NAME = 'ai-chat-db'
const DB_VERSION = 1
const STORES = {
  CONFIG: 'config',
  CHARACTERS: 'characters',
  MESSAGES: 'messages',
  SETTINGS: 'settings'
}

// 降级标志
let useLocalStorage = false
let dbInstance = null

/**
 * 检查是否支持 IndexedDB
 */
function isIndexedDBSupported() {
  return typeof indexedDB !== 'undefined'
}

/**
 * 初始化数据库
 */
export async function initDB() {
  if (!isIndexedDBSupported()) {
    console.warn('[AI-Chat DB] IndexedDB 不支持，降级到 localStorage')
    useLocalStorage = true
    return null
  }

  try {
    dbInstance = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 配置存储
        if (!db.objectStoreNames.contains(STORES.CONFIG)) {
          db.createObjectStore(STORES.CONFIG, { keyPath: 'key' })
        }
        
        // 角色存储
        if (!db.objectStoreNames.contains(STORES.CHARACTERS)) {
          db.createObjectStore(STORES.CHARACTERS, { keyPath: 'key' })
        }
        
        // 消息存储（带索引）
        if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
          const messageStore = db.createObjectStore(STORES.MESSAGES, { keyPath: 'id' })
          messageStore.createIndex('characterId', 'characterId')
          messageStore.createIndex('timestamp', 'timestamp')
          messageStore.createIndex('role', 'role')
        }
        
        // 设置存储
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' })
        }
      }
    })
    
    console.log('[AI-Chat DB] IndexedDB 初始化成功')
    return dbInstance
  } catch (error) {
    console.error('[AI-Chat DB] IndexedDB 初始化失败，降级到 localStorage:', error)
    useLocalStorage = true
    return null
  }
}

/**
 * 获取数据库实例
 */
export function getDB() {
  return dbInstance
}

/**
 * 检查是否使用降级模式
 */
export function isFallbackMode() {
  return useLocalStorage
}

// ==================== localStorage 降级实现 ====================

const localStorageKeys = {
  [STORES.CONFIG]: 'ai-chat-config',
  [STORES.CHARACTERS]: 'ai-chat-characters',
  [STORES.MESSAGES]: 'ai-chat-messages',
  [STORES.SETTINGS]: 'ai-chat-settings'
}

function localStorageGet(store, key) {
  try {
    const item = localStorage.getItem(localStorageKeys[store])
    if (!item) return null
    
    const data = JSON.parse(item)
    if (typeof data === 'object' && data !== null) {
      return data[key] || null
    }
    return data
  } catch (e) {
    console.error('[AI-Chat DB] localStorage 读取失败:', e)
    return null
  }
}

function localStorageSet(store, key, value) {
  try {
    let existing = {}
    try {
      const item = localStorage.getItem(localStorageKeys[store])
      if (item) {
        existing = JSON.parse(item)
      }
    } catch (e) {
      existing = {}
    }
    
    if (typeof existing === 'object' && existing !== null) {
      existing[key] = value
    } else {
      existing = { [key]: value }
    }
    
    localStorage.setItem(localStorageKeys[store], JSON.stringify(existing))
    return true
  } catch (e) {
    console.error('[AI-Chat DB] localStorage 写入失败:', e)
    return false
  }
}

function localStorageDelete(store, key) {
  try {
    const item = localStorage.getItem(localStorageKeys[store])
    if (!item) return true
    
    const data = JSON.parse(item)
    if (typeof data === 'object' && data !== null) {
      delete data[key]
      localStorage.setItem(localStorageKeys[store], JSON.stringify(data))
    }
    return true
  } catch (e) {
    console.error('[AI-Chat DB] localStorage 删除失败:', e)
    return false
  }
}

// ==================== 通用 CRUD 操作 ====================

/**
 * 获取数据
 */
export async function get(store, key) {
  if (useLocalStorage || !dbInstance) {
    return localStorageGet(store, key)
  }
  
  try {
    return await dbInstance.get(store, key)
  } catch (error) {
    console.error('[AI-Chat DB] 读取失败，降级到 localStorage:', error)
    useLocalStorage = true
    return localStorageGet(store, key)
  }
}

/**
 * 保存数据
 */
export async function set(store, key, value) {
  if (useLocalStorage || !dbInstance) {
    return localStorageSet(store, key, value)
  }
  
  try {
    await dbInstance.put(store, { key, value, updatedAt: Date.now() })
    return true
  } catch (error) {
    console.error('[AI-Chat DB] 写入失败，降级到 localStorage:', error)
    useLocalStorage = true
    return localStorageSet(store, key, value)
  }
}

/**
 * 删除数据
 */
export async function remove(store, key) {
  if (useLocalStorage || !dbInstance) {
    return localStorageDelete(store, key)
  }
  
  try {
    await dbInstance.delete(store, key)
    return true
  } catch (error) {
    console.error('[AI-Chat DB] 删除失败:', error)
    return false
  }
}

/**
 * 获取所有数据
 */
export async function getAll(store) {
  if (useLocalStorage || !dbInstance) {
    const item = localStorage.getItem(localStorageKeys[store])
    if (!item) return []
    try {
      const data = JSON.parse(item)
      return typeof data === 'object' && data !== null ? Object.values(data) : []
    } catch (e) {
      return []
    }
  }
  
  try {
    return await dbInstance.getAll(store)
  } catch (error) {
    console.error('[AI-Chat DB] 读取全部失败:', error)
    return []
  }
}

/**
 * 清空存储
 */
export async function clear(store) {
  if (useLocalStorage || !dbInstance) {
    try {
      localStorage.removeItem(localStorageKeys[store])
      return true
    } catch (e) {
      return false
    }
  }
  
  try {
    await dbInstance.clear(store)
    return true
  } catch (error) {
    console.error('[AI-Chat DB] 清空失败:', error)
    return false
  }
}

// ==================== 消息专用方法 ====================

/**
 * 添加消息
 */
export async function addMessage(message) {
  const messageWithId = {
    ...message,
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now()
  }
  
  await set(STORES.MESSAGES, messageWithId.id, messageWithId)
  return messageWithId
}

/**
 * 获取角色的消息
 */
export async function getMessagesByCharacter(characterId, limit = 100) {
  if (useLocalStorage || !dbInstance) {
    const all = await getAll(STORES.MESSAGES)
    return all
      .filter(m => m.characterId === characterId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }
  
  try {
    const index = dbInstance.transaction(STORES.MESSAGES).store.index('characterId')
    const messages = await index.getAll(characterId)
    return messages
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  } catch (error) {
    console.error('[AI-Chat DB] 查询消息失败:', error)
    return []
  }
}

/**
 * 删除角色的所有消息
 */
export async function deleteMessagesByCharacter(characterId) {
  const messages = await getMessagesByCharacter(characterId)
  
  for (const msg of messages) {
    await remove(STORES.MESSAGES, msg.id)
  }
}

/**
 * 批量添加消息
 */
export async function addMessages(messages) {
  const results = []
  for (const msg of messages) {
    const result = await addMessage(msg)
    results.push(result)
  }
  return results
}

// ==================== 数据迁移 ====================

/**
 * 从 localStorage 迁移到 IndexedDB
 */
export async function migrateFromLocalStorage() {
  if (!dbInstance || useLocalStorage) {
    console.log('[AI-Chat DB] 无法迁移：IndexedDB 不可用')
    return false
  }
  
  try {
    const config = localStorage.getItem('ai-chat-config')
    const characters = localStorage.getItem('ai-chat-characters')
    const selected = localStorage.getItem('ai-chat-selected-character')
    
    if (config) {
      await set(STORES.CONFIG, 'main', JSON.parse(config))
      localStorage.removeItem('ai-chat-config')
    }
    
    if (characters) {
      await set(STORES.CHARACTERS, 'list', JSON.parse(characters))
      localStorage.removeItem('ai-chat-characters')
    }
    
    if (selected) {
      await set(STORES.SETTINGS, 'selectedCharacter', JSON.parse(selected))
      localStorage.removeItem('ai-chat-selected-character')
    }
    
    console.log('[AI-Chat DB] 数据迁移完成')
    return true
  } catch (error) {
    console.error('[AI-Chat DB] 迁移失败:', error)
    return false
  }
}

/**
 * 获取存储统计
 */
export async function getStorageStats() {
  const stats = {
    mode: useLocalStorage ? 'localStorage' : 'IndexedDB',
    stores: {}
  }
  
  if (useLocalStorage || !dbInstance) {
    stats.stores.config = localStorage.getItem('ai-chat-config') ? 1 : 0
    stats.stores.characters = localStorage.getItem('ai-chat-characters') ? 1 : 0
    stats.stores.messages = localStorage.getItem('ai-chat-messages') ? 1 : 0
  } else {
    for (const store of Object.values(STORES)) {
      const items = await getAll(store)
      stats.stores[store] = items.length
    }
  }
  
  return stats
}

// 导出存储常量
export { STORES }
