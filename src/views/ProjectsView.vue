<template>
  <div class="projects-view">
    <div class="projects-header">
      <h1>项目管理</h1>
      <button class="add-project-button" @click="showAddProject = true">
        新建项目
      </button>
    </div>
    
    <div v-if="loading && !projects.length" class="loading">
      <div class="loader"></div>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="fetchProjects" class="retry-button">重试</button>
    </div>
    
    <div v-else-if="!projects.length" class="no-data">
      <p>没有找到项目</p>
      <button class="add-project-button" @click="showAddProject = true">
        创建第一个项目
      </button>
    </div>
    
    <div v-else class="projects-grid">
      <div 
        v-for="project in projects" 
        :key="project.id" 
        class="project-card"
        @click="selectProject(project)"
      >
        <div class="project-content">
          <h3 class="project-name">{{ project.name }}</h3>
          <p class="project-description">{{ project.description || '没有描述' }}</p>
          <div class="project-meta">
            <span class="material-count">{{ project.material_count }} 素材</span>
            <span class="date">{{ formatDate(project.created_date) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add Project Modal -->
    <div v-if="showAddProject" class="modal-overlay" @click="showAddProject = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>新建项目</h3>
          <button class="close-button" @click="showAddProject = false">&times;</button>
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
          <button class="cancel-button" @click="showAddProject = false">取消</button>
          <button 
            class="create-button" 
            @click="createProject"
            :disabled="!newProject.name || saving"
          >
            {{ saving ? '创建中...' : '创建项目' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Project Detail Modal -->
    <div v-if="selectedProject" class="project-detail-overlay" @click="selectedProject = null">
      <div class="project-detail-modal" @click.stop>
        <div class="detail-header">
          <h2>{{ selectedProject.name }}</h2>
          <button class="close-button" @click="selectedProject = null">&times;</button>
        </div>
        
        <div class="detail-content">
          <div class="project-info">
            <div class="info-row">
              <span class="info-label">ID:</span>
              <span class="info-value">{{ selectedProject.id }}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">创建日期:</span>
              <span class="info-value">{{ formatDate(selectedProject.created_date) }}</span>
            </div>
            
            <div class="info-row">
              <span class="info-label">素材数量:</span>
              <span class="info-value">{{ selectedProject.material_count }}</span>
            </div>
            
            <div class="description-row">
              <span class="info-label">描述:</span>
              <p class="info-description">{{ selectedProject.description || '没有描述' }}</p>
            </div>
          </div>
          
          <div class="project-materials" v-if="projectMaterials.length > 0">
            <h3>项目素材</h3>
            <div class="materials-grid">
              <div 
                v-for="material in projectMaterials" 
                :key="material.id" 
                class="material-item"
              >
                <img :src="`/api/v1/materials/${material.id}/image`" :alt="material.id" />
                <div class="material-tags">
                  <span 
                    v-for="tag in material.tags.slice(0, 2)" 
                    :key="tag.id" 
                    class="material-tag"
                  >
                    {{ tag.name }}
                  </span>
                  <span v-if="material.tags.length > 2" class="more-tags">+{{ material.tags.length - 2 }}</span>
                </div>
              </div>
            </div>
            
            <div class="view-all">
              <button class="view-all-button" @click="viewAllMaterials(selectedProject.id)">
                查看全部素材
              </button>
            </div>
          </div>
          
          <div class="no-materials" v-else>
            <p>项目中没有素材</p>
            <button class="add-materials-button" @click="goToMaterialsPage">
              浏览素材库
            </button>
          </div>
        </div>
        
        <div class="detail-footer">
          <button class="edit-button" @click="editProject">编辑项目</button>
          <button class="delete-button" @click="confirmDeleteProject">删除项目</button>
        </div>
      </div>
    </div>
    
    <!-- Edit Project Modal -->
    <div v-if="showEditProject" class="modal-overlay" @click="showEditProject = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑项目</h3>
          <button class="close-button" @click="showEditProject = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="edit-project-name">项目名称</label>
            <input 
              type="text" 
              id="edit-project-name" 
              v-model="editedProject.name" 
              placeholder="输入项目名称"
              :class="{ 'error': nameError }"
            />
            <span v-if="nameError" class="error-text">{{ nameError }}</span>
          </div>
          
          <div class="form-group">
            <label for="edit-project-description">描述(可选)</label>
            <textarea 
              id="edit-project-description" 
              v-model="editedProject.description" 
              placeholder="项目描述"
              rows="4"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-button" @click="showEditProject = false">取消</button>
          <button 
            class="create-button" 
            @click="updateProject"
            :disabled="!editedProject.name || saving"
          >
            {{ saving ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
      <div class="confirm-modal" @click.stop>
        <div class="modal-header">
          <h3>确认删除</h3>
          <button class="close-button" @click="showDeleteConfirm = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>确定要删除项目 "{{ selectedProject?.name }}" 吗？此操作不可撤销。</p>
        </div>
        <div class="modal-footer">
          <button class="cancel-button" @click="showDeleteConfirm = false">取消</button>
          <button 
            class="delete-button" 
            @click="deleteProject"
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectStore } from '@/stores/projectStore';
import { projectsApi } from '@/api';
import type { Project, Material } from '@/types';

const router = useRouter();
const projectStore = useProjectStore();

// State
const showAddProject = ref(false);
const showEditProject = ref(false);
const selectedProject = ref<Project | null>(null);
const showDeleteConfirm = ref(false);
const newProject = ref({ name: '', description: '' });
const editedProject = ref({ name: '', description: '' });
const nameError = ref('');
const saving = ref(false);
const deleting = ref(false);
const projectMaterials = ref<Material[]>([]);

// Computed properties
const projects = computed(() => projectStore.projects);
const loading = computed(() => projectStore.loading);
const error = computed(() => projectStore.error);

// Methods
function fetchProjects() {
  projectStore.fetchProjects();
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

async function createProject() {
  if (!newProject.value.name) {
    nameError.value = '请输入项目名称';
    return;
  }
  
  saving.value = true;
  nameError.value = '';
  
  try {
    const project = await projectStore.createProject(
      newProject.value.name, 
      newProject.value.description
    );
    
    if (project) {
      showAddProject.value = false;
      newProject.value = { name: '', description: '' };
    } else {
      nameError.value = '创建项目失败，请重试';
    }
  } catch (e) {
    nameError.value = '创建项目失败';
    console.error(e);
  } finally {
    saving.value = false;
  }
}

async function selectProject(project: Project) {
  selectedProject.value = project;
  
  // Load project materials
  try {
    const materials = await projectsApi.getProjectMaterials(project.id);
    projectMaterials.value = materials;
  } catch (e) {
    console.error('Failed to load project materials:', e);
    projectMaterials.value = [];
  }
}

function editProject() {
  if (!selectedProject.value) return;
  
  editedProject.value = {
    name: selectedProject.value.name,
    description: selectedProject.value.description || ''
  };
  
  showEditProject.value = true;
}

async function updateProject() {
  if (!selectedProject.value || !editedProject.value.name) {
    nameError.value = '请输入项目名称';
    return;
  }
  
  saving.value = true;
  nameError.value = '';
  
  try {
    // API call would go here if available in your API
    // For now, just update the local state
    if (selectedProject.value) {
      selectedProject.value.name = editedProject.value.name;
      selectedProject.value.description = editedProject.value.description;
      
      // Update in the projects list
      const index = projects.value.findIndex(p => p.id === selectedProject.value?.id);
      if (index !== -1) {
        projects.value[index] = { ...selectedProject.value };
      }
      
      showEditProject.value = false;
    }
  } catch (e) {
    nameError.value = '更新项目失败';
    console.error(e);
  } finally {
    saving.value = false;
  }
}

function confirmDeleteProject() {
  showDeleteConfirm.value = true;
}

async function deleteProject() {
  if (!selectedProject.value || deleting.value) return;
  
  deleting.value = true;
  
  try {
    // API call would go here if available in your API
    // For now, just update the local state
    projectStore.projects = projectStore.projects.filter(
      p => p.id !== selectedProject.value?.id
    );
    
    showDeleteConfirm.value = false;
    selectedProject.value = null;
  } catch (e) {
    console.error('Failed to delete project:', e);
  } finally {
    deleting.value = false;
  }
}

function viewAllMaterials(projectId: number) {
  router.push({
    path: '/materials',
    query: { project: projectId.toString() }
  });
}

function goToMaterialsPage() {
  router.push('/materials');
}

// Load projects on component mount
onMounted(() => {
  fetchProjects();
});
</script>

<style scoped>
.projects-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.projects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.projects-header h1 {
  margin: 0;
}

.add-project-button {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 500;
}

.add-project-button:hover {
  background-color: #45a049;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.project-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.project-content {
  padding: 20px;
}

.project-name {
  margin-top: 0;
  margin-bottom: 8px;
}

.project-description {
  color: #666;
  margin-bottom: 12px;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.project-meta {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 0.9em;
}

.loading, .error-message, .no-data {
  padding: 40px;
  text-align: center;
}

.loader {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2196f3;
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

.retry-button {
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  margin-top: 10px;
}

/* Modal styles */
.modal-overlay, .project-detail-overlay {
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
}

.modal-footer {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background-color: #f5f5f5;
  border-top: 1px solid #e0e0e0;
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

.edit-button {
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
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

/* Project detail modal */
.project-detail-modal {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.detail-header h2 {
  margin: 0;
}

.detail-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.project-info {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
}

.info-label {
  font-weight: bold;
  width: 100px;
}

.description-row {
  margin-bottom: 8px;
}

.info-description {
  margin: 8px 0;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.project-materials h3 {
  margin-top: 0;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.material-item {
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.material-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
}

.material-tags {
  padding: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.material-tag {
  background-color: #e3f2fd;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7em;
}

.more-tags {
  font-size: 0.7em;
  color: #757575;
}

.view-all {
  text-align: center;
}

.view-all-button {
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
}

.no-materials {
  text-align: center;
  padding: 30px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.add-materials-button {
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  margin-top: 10px;
}

.detail-footer {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background-color: #f5f5f5;
  border-top: 1px solid #e0e0e0;
}
</style>