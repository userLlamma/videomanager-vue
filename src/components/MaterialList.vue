<template>
  <div class="materials-container">
    <div class="search-container">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="搜索素材..." 
        @input="debounceSearch"
        class="search-input"
      />
      <TagSelector 
        :selectedTags="selectedTagIds" 
        @update:selectedTags="updateSelectedTags" 
      />
    </div>
    
    <div v-if="loading && !materials.length" class="loading">
      <div class="loader"></div>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="retry" class="retry-button">重试</button>
    </div>
    
    <div v-else-if="!materials.length" class="no-data">
      <p>没有找到素材</p>
    </div>
    
    <div v-else :class="['materials-grid', {'list-view': viewMode === 'list'}]">
      <div 
        v-for="material in materials" 
        :key="material.id" 
        :class="['material-card', {'selected': isSelected(material.id)}]"
        @click="handleMaterialClick(material, $event)"
      >
        <div class="selection-overlay" v-if="isSelected(material.id)">
          <div class="checkmark">✓</div>
        </div>
        
        <div class="material-image">
          <img :src="`/api/v1/materials/${material.id}/image`" :alt="material.description || 'Material image'" />
        </div>
        <div class="material-info">
          <div class="source">{{ getSourceName(material.source_video) }}</div>
          <div class="timestamp">{{ formatTimestamp(material.timestamp) }}</div>
          <div class="tags">
            <span 
              v-for="tag in material.tags.slice(0, 3)" 
              :key="tag.id" 
              class="tag"
            >
              {{ tag.name }}
            </span>
            <span v-if="material.tags.length > 3" class="more-tags">+{{ material.tags.length - 3 }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="materials.length && hasMoreItems" class="load-more">
      <button @click="loadMore" :disabled="loading" class="load-more-button">
        <span v-if="loading">加载中...</span>
        <span v-else>加载更多</span>
      </button>
    </div>
    
    <MaterialDetail 
      v-if="selectedMaterial"
      :material="selectedMaterial"
      :visible="!!selectedMaterial"
      @close="selectedMaterial = null"
      @updated="handleMaterialUpdated"
      @deleted="handleMaterialDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, inject } from 'vue';
import { useMaterialStore } from '@/stores/materialStore';
import TagSelector from '@/components/TagSelector.vue';
import MaterialDetail from '@/components/MaterialDetail.vue';
import type { Material } from '@/types';
import { useRouter, useRoute } from 'vue-router';

const props = defineProps({
  viewMode: {
    type: String,
    default: 'grid'
  }
});

const emit = defineEmits(['deleted']);

const materialStore = useMaterialStore();
const router = useRouter();
const route = useRoute();

const searchQuery = ref('');
const selectedMaterial = ref<Material | null>(null);
const searchTimeout = ref<number | null>(null);
const selectedMaterials = inject<Ref<number[]>>('selectedMaterials', ref([]));

// Mode flags
const selectionMode = computed(() => selectedMaterials.value.length > 0);

// Get search and tags from query parameters
onMounted(() => {
  // Check if there's a project filter
  const projectId = route.query.project;
  if (projectId) {
    // TODO: Implement project filtering
    console.log('Filtering materials for project:', projectId);
  }
  
  if (route.query.search) {
    searchQuery.value = route.query.search as string;
  }
  
  if (route.query.tags) {
    const tagIds = Array.isArray(route.query.tags) 
      ? route.query.tags.map(t => parseInt(t as string)) 
      : [parseInt(route.query.tags as string)];
    
    materialStore.selectedTagIds = tagIds.filter(t => !isNaN(t));
  }
  
  // Load materials with current search query and tag filters
  materialStore.fetchMaterials(searchQuery.value, materialStore.selectedTagIds, true);
});

// Computed properties from store
const materials = computed(() => materialStore.materials);
const loading = computed(() => materialStore.loading);
const error = computed(() => materialStore.error);
const selectedTagIds = computed(() => materialStore.selectedTagIds);
const hasMoreItems = computed(() => {
  return materialStore.totalItems > (materialStore.currentPage + 1) * materialStore.itemsPerPage;
});

// Methods
function isSelected(materialId: number): boolean {
  return selectedMaterials.value.includes(materialId);
}

function handleMaterialClick(material: Material, event: MouseEvent) {
  // Check if shift or ctrl key is pressed
  const multiSelect = event.shiftKey || event.ctrlKey || event.metaKey;
  
  if (selectionMode.value || multiSelect) {
    event.preventDefault();
    
    // Toggle selection
    if (isSelected(material.id)) {
      selectedMaterials.value = selectedMaterials.value.filter(id => id !== material.id);
    } else {
      selectedMaterials.value.push(material.id);
    }
  } else {
    selectedMaterial.value = material;
  }
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

function debounceSearch() {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  
  searchTimeout.value = setTimeout(() => {
    updateFilters();
  }, 300) as unknown as number;
}

function updateSelectedTags(tagIds: number[]) {
  materialStore.selectedTagIds = tagIds;
  updateFilters();
}

function updateFilters() {
  // Update URL query parameters
  router.replace({
    query: {
      ...route.query,
      search: searchQuery.value || undefined,
      tags: materialStore.selectedTagIds.length ? materialStore.selectedTagIds : undefined
    }
  });
  
  // Fetch with new filters
  materialStore.fetchMaterials(searchQuery.value, materialStore.selectedTagIds, true);
}

function loadMore() {
  materialStore.loadNextPage();
}

function retry() {
  materialStore.fetchMaterials(searchQuery.value, materialStore.selectedTagIds, true);
}

function handleMaterialUpdated(updatedMaterial: Material) {
  // Find and update the material in the list
  const index = materials.value.findIndex(m => m.id === updatedMaterial.id);
  if (index !== -1) {
    materials.value[index] = updatedMaterial;
  }
  selectedMaterial.value = null;
}

function handleMaterialDeleted(materialId: number) {
  // Emit deleted event to parent component
  emit('deleted');
  
  // Remove the material locally too
  materialStore.deleteMaterial(materialId);
  selectedMaterial.value = null;
  
  // Also remove from selection if present
  if (isSelected(materialId)) {
    selectedMaterials.value = selectedMaterials.value.filter(id => id !== materialId);
  }
}
</script>

<style scoped>
.materials-container {
  padding: 20px;
}

.search-container {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex-grow: 1;
  min-width: 200px;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.materials-grid.list-view {
  grid-template-columns: 1fr;
}

.materials-grid.list-view .material-card {
  display: flex;
}

.materials-grid.list-view .material-image {
  width: 180px;
  height: 100px;
  flex-shrink: 0;
}

.materials-grid.list-view .material-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.material-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  background-color: white;
}

.material-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.material-card.selected {
  border: 2px solid #2196f3;
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(33, 150, 243, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.checkmark {
  background-color: #2196f3;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.material-image {
  height: 160px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.material-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.material-info {
  padding: 12px;
}

.source {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timestamp {
  font-size: 0.9em;
  color: #666;
  margin: 4px 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.tag {
  background-color: #f0f0f0;
  color: #333;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8em;
}

.more-tags {
  font-size: 0.8em;
  color: #666;
  padding: 2px 6px;
}

.loading, .error-message, .no-data {
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

.retry-button, .load-more-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.retry-button:hover, .load-more-button:hover {
  background-color: #2980b9;
}

.load-more {
  margin-top: 20px;
  text-align: center;
}
</style>