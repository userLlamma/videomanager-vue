<template>
    <div class="tag-selector">
      <div class="selected-tags">
        <div 
          v-for="tagId in selectedTags" 
          :key="tagId"
          class="selected-tag"
        >
          <span class="tag-name">{{ getTagName(tagId) }}</span>
          <button class="remove-tag" @click="removeTag(tagId)">&times;</button>
        </div>
        
        <button 
          class="add-tag-button" 
          @click="showTagSelector = !showTagSelector"
          :class="{ active: showTagSelector }"
        >
          {{ showTagSelector ? '关闭' : '选择标签' }}
        </button>
      </div>
      
      <div v-if="showTagSelector" class="tag-selector-dropdown">
        <div v-if="loading" class="loading-tags">
          加载标签中...
        </div>
        <div v-else-if="error" class="tag-error">
          加载标签出错
          <button @click="loadTags" class="retry-button">重试</button>
        </div>
        <template v-else>
          <div class="filter-tags">
            <input 
              v-model="tagFilter" 
              type="text" 
              placeholder="筛选标签..." 
              class="tag-filter-input"
            />
            <div class="category-selector">
              <button 
                v-for="category in ['全部', ...categories]" 
                :key="category"
                @click="selectCategory(category)"
                :class="{ active: selectedCategory === category }"
                class="category-button"
              >
                {{ category }}
              </button>
            </div>
          </div>
          
          <div class="tags-container">
            <div 
              v-for="category in filteredCategories" 
              :key="category"
              class="tag-category"
            >
              <h4 class="category-title">{{ category }}</h4>
              <div class="tags-list">
                <button 
                  v-for="tag in filterTagsByCategory(category)" 
                  :key="tag.id"
                  @click="toggleTag(tag.id)"
                  :class="{ selected: selectedTags.includes(tag.id) }"
                  class="tag-button"
                >
                  {{ tag.name }}
                  <span class="tag-count">{{ tag.usage_count }}</span>
                </button>
              </div>
            </div>
            
            <div v-if="Object.keys(filteredCategories).length === 0" class="no-tags">
              没有找到匹配的标签
            </div>
          </div>
        </template>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue';
  import { useTagStore } from '@/stores/tagStore';
  import type { TagInfo } from '@/types';
  
  const props = defineProps<{
    selectedTags: number[]
  }>();
  
  const emit = defineEmits<{
    (e: 'update:selectedTags', value: number[]): void
  }>();
  
  const tagStore = useTagStore();
  const showTagSelector = ref(false);
  const tagFilter = ref('');
  const selectedCategory = ref('全部');
  
  // Computed properties
  const loading = computed(() => tagStore.loading);
  const error = computed(() => tagStore.error);
  const tags = computed(() => tagStore.tags);
  const categories = computed(() => tagStore.categories);
  
  const filteredTags = computed(() => {
    if (!tagFilter.value) return tags.value;
    
    const filter = tagFilter.value.toLowerCase();
    return tags.value.filter(tag => 
      tag.name.toLowerCase().includes(filter)
    );
  });
  
  const filteredCategories = computed(() => {
    const result: Record<string, TagInfo[]> = {};
    
    // Filter by category first
    const tagsToFilter = selectedCategory.value === '全部' 
      ? filteredTags.value 
      : filteredTags.value.filter(tag => (tag.category || '其他') === selectedCategory.value);
    
    // Group by category
    tagsToFilter.forEach(tag => {
      const category = tag.category || '其他';
      if (!result[category]) {
        result[category] = [];
      }
      result[category].push(tag);
    });
    
    return result;
  });
  
  // Methods
  function loadTags() {
    tagStore.fetchTags();
    tagStore.fetchCategories();
  }
  
  function getTagName(tagId: number): string {
    const tag = tags.value.find(t => t.id === tagId);
    return tag ? tag.name : `标签 #${tagId}`;
  }
  
  function removeTag(tagId: number) {
    const updatedTags = props.selectedTags.filter(id => id !== tagId);
    emit('update:selectedTags', updatedTags);
  }
  
  function toggleTag(tagId: number) {
    let updatedTags;
    if (props.selectedTags.includes(tagId)) {
      updatedTags = props.selectedTags.filter(id => id !== tagId);
    } else {
      updatedTags = [...props.selectedTags, tagId];
    }
    emit('update:selectedTags', updatedTags);
  }
  
  function selectCategory(category: string) {
    selectedCategory.value = category;
  }
  
  function filterTagsByCategory(category: string): TagInfo[] {
    return filteredCategories.value[category] || [];
  }
  
  // Load tags on component mount
  onMounted(() => {
    loadTags();
  });
  
  // Close dropdown when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const element = event.target as HTMLElement;
    if (!element.closest('.tag-selector')) {
      showTagSelector.value = false;
    }
  }
  
  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
  });
  
  watch(() => showTagSelector.value, (newValue) => {
    if (newValue) {
      // Reset filter when opening selector
      tagFilter.value = '';
      selectedCategory.value = '全部';
    }
  });
  </script>
  
  <style scoped>
  .tag-selector {
    position: relative;
    min-width: 200px;
  }
  
  .selected-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  
  .selected-tag {
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
  
  .add-tag-button {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 6px 12px;
    cursor: pointer;
  }
  
  .add-tag-button.active {
    background-color: #e0e0e0;
  }
  
  .tag-selector-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    width: 300px;
    max-height: 400px;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 100;
    margin-top: 8px;
    overflow: hidden;
  }
  
  .filter-tags {
    padding: 10px;
    border-bottom: 1px solid #eee;
  }
  
  .tag-filter-input {
    width: 100%;
    padding: 6px 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 8px;
  }
  
  .category-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .category-button {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 0.8em;
    cursor: pointer;
  }
  
  .category-button.active {
    background-color: #2196f3;
    color: white;
    border-color: #2196f3;
  }
  
  .tags-container {
    padding: 10px;
    overflow-y: auto;
    max-height: 300px;
  }
  
  .tag-category {
    margin-bottom: 12px;
  }
  
  .category-title {
    margin: 0 0 6px 0;
    font-size: 0.9em;
    color: #666;
  }
  
  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .tag-button {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 0.9em;
    cursor: pointer;
    display: flex;
    align-items: center;
  }
  
  .tag-button.selected {
    background-color: #e1f5fe;
    border-color: #81d4fa;
  }
  
  .tag-count {
    font-size: 0.8em;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    padding: 1px 5px;
    margin-left: 4px;
  }
  
  .loading-tags, .tag-error, .no-tags {
    padding: 20px;
    text-align: center;
    color: #666;
  }
  
  .retry-button {
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    margin-left: 8px;
    cursor: pointer;
  }
  </style>