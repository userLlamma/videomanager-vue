<template>
    <div v-if="visible" class="material-detail-modal">
      <div class="modal-overlay" @click="close"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>素材详情</h3>
          <button class="close-button" @click="close">&times;</button>
        </div>
        
        <div v-if="loading" class="loading">
          <div class="loader"></div>
          <p>加载中...</p>
        </div>
        
        <div v-else-if="error" class="error-message">
          <p>{{ error }}</p>
        </div>
        
        <div v-else class="material-info">
          <div class="material-preview">
            <img :src="`/api/v1/materials/${material.id}/image`" alt="Material preview" />
          </div>
          
          <div class="material-metadata">
            <div class="field">
              <label>来源视频:</label>
              <div>{{ getSourceName(material.source_video) }}</div>
            </div>
            
            <div class="field">
              <label>时间戳:</label>
              <div>{{ formatTimestamp(material.timestamp) }}</div>
            </div>
            
            <div class="field">
              <label>添加日期:</label>
              <div>{{ formatDate(material.added_date) }}</div>
            </div>
            
            <div class="field">
              <label>描述:</label>
              <div class="editable-field">
                <textarea 
                  v-model="editedDescription" 
                  rows="3"
                  placeholder="添加描述..."
                ></textarea>
                <button 
                  @click="saveDescription" 
                  class="save-button"
                  :disabled="!descriptionChanged"
                >
                  保存
                </button>
              </div>
            </div>
            
            <div class="field">
              <label>标签:</label>
              <div class="tags-list">
                <div 
                  v-for="tag in material.tags" 
                  :key="tag.id"
                  class="tag-item"
                >
                  <span class="tag-name">{{ tag.name }}</span>
                  <button class="remove-tag" @click="removeTag(tag.id)">&times;</button>
                </div>
                <button @click="showAddTag = !showAddTag" class="add-tag">
                  + 添加标签
                </button>
              </div>
            </div>
            
            <div v-if="showAddTag" class="add-tag-panel">
              <TagSelector 
                :selectedTags="[]" 
                @update:selectedTags="addTags" 
              />
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="showDeleteConfirm = true" class="delete-button">删除素材</button>
        </div>
        
        <div v-if="showDeleteConfirm" class="delete-confirm">
          <div class="confirm-message">
            确定要删除此素材吗？此操作不可撤销。
          </div>
          <div class="confirm-buttons">
            <button @click="deleteMaterial" class="confirm-delete">确定删除</button>
            <button @click="showDeleteConfirm = false" class="cancel-delete">取消</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import { materialsApi } from '@/api';
  import TagSelector from './TagSelector.vue';
  import type { Material, TagInfo } from '@/types';
  
  const props = defineProps<{
    material: Material;
    visible: boolean;
  }>();
  
  const emit = defineEmits<{
    (e: 'close'): void;
    (e: 'updated', material: Material): void;
    (e: 'deleted', id: number): void;
  }>();
  
  const editedDescription = ref('');
  const showAddTag = ref(false);
  const showDeleteConfirm = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // Initialize edited description with the material's description
  watch(() => props.material, (newMaterial) => {
    editedDescription.value = newMaterial.description || '';
  }, { immediate: true });
  
  const descriptionChanged = computed(() => {
    return editedDescription.value !== (props.material.description || '');
  });
  
  function close() {
    emit('close');
  }
  
  function getSourceName(path: string): string {
    if (!path) return 'Unknown';
    const parts = path.split('/');
    return parts[parts.length - 1];
  }
  
  function formatTimestamp(timestamp: number): string {
    const hours = Math.floor(timestamp / 3600);
    const minutes = Math.floor((timestamp % 3600) / 60);
    const seconds = Math.floor(timestamp % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  async function saveDescription() {
    if (!descriptionChanged.value) return;
    
    loading.value = true;
    error.value = null;
    
    try {
      const updated = await materialsApi.updateMaterial(props.material.id, {
        description: editedDescription.value
      });
      
      if (updated) {
        emit('updated', updated);
      } else {
        error.value = '更新失败';
      }
    } catch (e) {
      error.value = '保存描述时出错';
      console.error(e);
    } finally {
      loading.value = false;
    }
  }
  
  async function removeTag(tagId: number) {
    loading.value = true;
    error.value = null;
    
    try {
      const success = await materialsApi.removeTag(props.material.id, tagId);
      
      if (success) {
        // Get updated material
        const updated = await materialsApi.getById(props.material.id);
        if (updated) {
          emit('updated', updated);
        }
      } else {
        error.value = '移除标签失败';
      }
    } catch (e) {
      error.value = '移除标签时出错';
      console.error(e);
    } finally {
      loading.value = false;
    }
  }
  
  async function addTags(tagIds: number[]) {
    if (!tagIds.length) return;
    
    loading.value = true;
    error.value = null;
    
    try {
      const success = await materialsApi.addTag(props.material.id, tagIds);
      
      if (success) {
        // Get updated material
        const updated = await materialsApi.getById(props.material.id);
        if (updated) {
          emit('updated', updated);
        }
        showAddTag.value = false;
      } else {
        error.value = '添加标签失败';
      }
    } catch (e) {
      error.value = '添加标签时出错';
      console.error(e);
    } finally {
      loading.value = false;
    }
  }
  
  async function deleteMaterial() {
    loading.value = true;
    error.value = null;
    
    try {
      const success = await materialsApi.deleteMaterial(props.material.id);
      
      if (success) {
        emit('deleted', props.material.id);
      } else {
        error.value = '删除素材失败';
      }
    } catch (e) {
      error.value = '删除素材时出错';
      console.error(e);
    } finally {
      loading.value = false;
      showDeleteConfirm.value = false;
    }
  }
  </script>
  
  <style scoped>
  .material-detail-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
  }
  
  .modal-content {
    position: relative;
    background-color: white;
    border-radius: 8px;
    width: 80%;
    max-width: 900px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    z-index: 1001;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
  }
  
  .modal-header h3 {
    margin: 0;
    font-size: 1.5rem;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
  }
  
  .loading, .error-message {
    padding: 40px;
    text-align: center;
  }
  
  .loader {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .material-info {
    display: flex;
    padding: 20px;
  }
  
  .material-preview {
    flex: 0 0 40%;
    margin-right: 20px;
  }
  
  .material-preview img {
    width: 100%;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .material-metadata {
    flex: 1;
  }
  
  .field {
    margin-bottom: 16px;
  }
  
  .field label {
    display: block;
    font-weight: bold;
    margin-bottom: 4px;
    color: #555;
  }
  
  .editable-field {
    display: flex;
    gap: 8px;
  }
  
  .editable-field textarea {
    flex: 1;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
  }
  
  .save-button {
    padding: 8px 16px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .save-button:disabled {
    background-color: #ddd;
    cursor: not-allowed;
  }
  
  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .tag-item {
    display: flex;
    align-items: center;
    background-color: #e1f5fe;
    border-radius: 16px;
    padding: 4px 10px;
  }
  
  .tag-name {
    margin-right: 4px;
  }
  
  .remove-tag {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 0 2px;
  }
  
  .remove-tag:hover {
    color: #f44336;
  }
  
  .add-tag {
    background-color: #f5f5f5;
    border: 1px dashed #ddd;
    border-radius: 16px;
    padding: 4px 10px;
    cursor: pointer;
    font-size: 0.9em;
  }
  
  .add-tag:hover {
    background-color: #e0e0e0;
  }
  
  .add-tag-panel {
    margin-top: 10px;
    padding: 10px;
    background-color: #f9f9f9;
    border-radius: 4px;
  }
  
  .modal-footer {
    padding: 16px 20px;
    border-top: 1px solid #eee;
    text-align: right;
  }
  
  .delete-button {
    background-color: #f44336;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .delete-confirm {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.95);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;
    z-index: 1002;
  }
  
  .confirm-message {
    font-size: 1.2rem;
    margin-bottom: 20px;
    text-align: center;
  }
  
  .confirm-buttons {
    display: flex;
    gap: 16px;
  }
  
  .confirm-delete {
    background-color: #f44336;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .cancel-delete {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  </style>