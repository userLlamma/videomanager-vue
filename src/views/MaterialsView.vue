<template>
    <div class="materials-view">
      <div class="materials-header">
        <h1>素材库</h1>
        <div class="view-controls">
          <button 
            @click="viewMode = 'grid'" 
            :class="{ active: viewMode === 'grid' }" 
            class="view-button"
          >
            网格视图
          </button>
          <button 
            @click="viewMode = 'list'" 
            :class="{ active: viewMode === 'list' }" 
            class="view-button"
          >
            列表视图
          </button>
        </div>
      </div>
  
      <MaterialList :viewMode="viewMode" />
      
      <div class="batch-actions" v-if="selectedMaterials.length > 0">
        <div class="selected-count">已选择 {{ selectedMaterials.length }} 个素材</div>
        <div class="action-buttons">
          <button @click="addToProject" class="batch-button add-to-project">
            添加到项目
          </button>
          <button @click="confirmBatchDelete" class="batch-button delete-selected">
            删除所选
          </button>
          <button @click="clearSelection" class="batch-button cancel">
            取消选择
          </button>
        </div>
      </div>
      
      <!-- Add to project modal -->
      <div v-if="showProjectModal" class="modal-overlay" @click="showProjectModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>添加到项目</h3>
            <button class="close-button" @click="showProjectModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div v-if="loadingProjects" class="loading-indicator">
              <div class="loader"></div>
              <p>加载项目中...</p>
            </div>
            
            <div v-else-if="projects.length === 0" class="no-projects">
              <p>没有可用的项目</p>
              <button @click="createNewProject" class="create-project-button">
                创建新项目
              </button>
            </div>
            
            <div v-else class="projects-list">
              <div 
                v-for="project in projects" 
                :key="project.id"
                class="project-item"
                @click="selectProject(project)"
              >
                <div class="project-name">{{ project.name }}</div>
                <div class="project-details">
                  <span class="material-count">{{ project.material_count }} 素材</span>
                  <span class="created-date">{{ formatDate(project.created_date) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Create project modal -->
      <div v-if="showCreateProject" class="modal-overlay" @click="showCreateProject = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>创建新项目</h3>
            <button class="close-button" @click="showCreateProject = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="project-name">项目名称</label>
              <input 
                type="text" 
                id="project-name" 
                v-model="newProject.name" 
                placeholder="输入项目名称"
                :class="{ 'error': nameError }"
              />
              <span v-if="nameError" class="error-text">{{ nameError }}</span>
            </div>
            
            <div class="form-group">
              <label for="project-description">描述(可选)</label>
              <textarea 
                id="project-description" 
                v-model="newProject.description" 
                placeholder="项目描述"
                rows="4"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-button" @click="showCreateProject = false">取消</button>
            <button 
              class="create-button" 
              @click="createProject"
              :disabled="!newProject.name || creating"
            >
              {{ creating ? '创建中...' : '创建项目' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Confirm delete modal -->
      <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
        <div class="confirm-modal" @click.stop>
          <div class="modal-header">
            <h3>确认删除</h3>
            <button class="close-button" @click="showDeleteConfirm = false">&times;</button>
          </div>
          <div class="modal-body">
            <p>确定要删除选中的 {{ selectedMaterials.length }} 个素材吗？此操作不可撤销。</p>
          </div>
          <div class="modal-footer">
            <button class="cancel-button" @click="showDeleteConfirm = false">取消</button>
            <button 
              class="delete-button" 
              @click="batchDelete"
              :disabled="deleting"
            >
              {{ deleting ? '删除中...' : '确认删除' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted, provide } from 'vue';
  import { useProjectStore } from '@/stores/projectStore';
  import { useMaterialStore } from '@/stores/materialStore';
  import { projectsApi, materialsApi } from '@/api';
  import MaterialList from '@/components/MaterialList.vue';
  import type { Project, Material } from '@/types';
  
  const materialStore = useMaterialStore();
  const projectStore = useProjectStore();
  
  // View state
  const viewMode = ref<'grid' | 'list'>('grid');
  const selectedMaterials = ref<number[]>([]);
  const showProjectModal = ref(false);
  const showCreateProject = ref(false); 
  const showDeleteConfirm = ref(false);
  const loadingProjects = ref(false);
  const creating = ref(false);
  const deleting = ref(false);
  const nameError = ref('');
  const newProject = ref({ name: '', description: '' });
  
  // Computed properties
  const projects = computed(() => projectStore.projects);
  
  // Create selection context for MaterialList component
  provide('selectedMaterials', selectedMaterials);
  
  function addToProject() {
    if (selectedMaterials.value.length === 0) return;
    
    loadingProjects.value = true;
    showProjectModal.value = true;
    
    // Load projects if not already loaded
    projectStore.fetchProjects().finally(() => {
      loadingProjects.value = false;
    });
  }
  
  function createNewProject() {
    showProjectModal.value = false;
    showCreateProject.value = true;
    newProject.value = { name: '', description: '' };
  }
  
  async function createProject() {
    if (!newProject.value.name) {
      nameError.value = '请输入项目名称';
      return;
    }
    
    creating.value = true;
    nameError.value = '';
    
    try {
      const project = await projectStore.createProject(
        newProject.value.name, 
        newProject.value.description
      );
      
      if (project) {
        showCreateProject.value = false;
        selectProject(project);
      } else {
        nameError.value = '创建项目失败，请重试';
      }
    } catch (e) {
      nameError.value = '创建项目失败';
      console.error(e);
    } finally {
      creating.value = false;
    }
  }
  
  async function selectProject(project: Project) {
    if (selectedMaterials.value.length === 0) return;
    
    try {
      const success = await projectsApi.addMaterialsToProject(
        project.id, 
        selectedMaterials.value
      );
      
      if (success) {
        // Update material count in the project
        project.material_count += selectedMaterials.value.length;
        
        // Clear selection and close modal
        selectedMaterials.value = [];
        showProjectModal.value = false;
      }
    } catch (e) {
      console.error('Failed to add materials to project:', e);
    }
  }
  
  function confirmBatchDelete() {
    if (selectedMaterials.value.length === 0) return;
    showDeleteConfirm.value = true;
  }
  
  async function batchDelete() {
    if (selectedMaterials.value.length === 0) return;
    
    deleting.value = true;
    
    try {
      // Delete materials one by one
      for (const id of selectedMaterials.value) {
        await materialsApi.deleteMaterial(id);
      }
      
      // Refresh the materials list
      materialStore.fetchMaterials('', materialStore.selectedTagIds, true);
      
      // Clear selection and close modal
      selectedMaterials.value = [];
      showDeleteConfirm.value = false;
    } catch (e) {
      console.error('Failed to delete materials:', e);
    } finally {
      deleting.value = false;
    }
  }
  
  function clearSelection() {
    selectedMaterials.value = [];
  }
  
  function formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }
  
  // Load projects on component mount
  onMounted(() => {
    projectStore.fetchProjects();
  });
  </script>
  
  <style scoped>
  .materials-view {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    position: relative;
  }
  
  .materials-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .materials-header h1 {
    margin: 0;
  }
  
  .view-controls {
    display: flex;
    gap: 10px;
  }
  
  .view-button {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 6px 12px;
    cursor: pointer;
  }
  
  .view-button.active {
    background-color: #2196f3;
    color: white;
    border-color: #2196f3;
  }
  
  .batch-actions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(33, 150, 243, 0.95);
    color: white;
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 100;
  }
  
  .action-buttons {
    display: flex;
    gap: 10px;
  }
  
  .batch-button {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }
  
  .batch-button.add-to-project {
    background-color: #4caf50;
    color: white;
  }
  
  .batch-button.delete-selected {
    background-color: #f44336;
    color: white;
  }
  
  .batch-button.cancel {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
  }
  
  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    overflow: hidden;
  }
  
  .confirm-modal {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
    overflow: hidden;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background-color: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .modal-header h3 {
    margin: 0;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    color: #666;
  }
  
  .modal-body {
    padding: 20px;
    max-height: 60vh;
    overflow-y: auto;
  }
  
  .modal-footer {
    padding: 16px 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    background-color: #f5f5f5;
    border-top: 1px solid #e0e0e0;
  }
  
  .loading-indicator {
    text-align: center;
    padding: 20px;
  }
  
  .loader {
    border: 3px solid #f3f3f3;
    border-top: 3px solid #2196f3;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
    margin: 0 auto 10px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .no-projects {
    text-align: center;
    padding: 20px;
  }
  
  .create-project-button {
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
    margin-top: 10px;
  }
  
  .projects-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .project-item {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .project-item:hover {
    background-color: #f5f5f5;
  }
  
  .project-name {
    font-weight: bold;
    margin-bottom: 6px;
  }
  
  .project-details {
    display: flex;
    justify-content: space-between;
    font-size: 0.9em;
    color: #666;
  }
  
  .form-group {
    margin-bottom: 16px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
  }
  
  .form-group input, .form-group textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .form-group input.error {
    border-color: #f44336;
  }
  
  .error-text {
    color: #f44336;
    font-size: 0.8em;
    margin-top: 4px;
    display: block;
  }
  
  .cancel-button {
    background-color: #e0e0e0;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
  }
  
  .create-button {
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
  }
  
  .create-button:disabled {
    background-color: #a5d6a7;
    cursor: not-allowed;
  }
  
  .delete-button {
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
  }
  
  .delete-button:disabled {
    background-color: #ef9a9a;
    cursor: not-allowed;
  }
  </style>