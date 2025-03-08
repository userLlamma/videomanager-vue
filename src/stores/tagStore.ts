import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { tagsApi } from '@/api';
import type { TagInfo } from '@/types';

export const useTagStore = defineStore('tag', () => {
  const tags = ref<TagInfo[]>([]);
  const categories = ref<string[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  const tagsByCategory = computed(() => {
    const result: Record<string, TagInfo[]> = {};
    // Initialize with all categories
    categories.value.forEach(cat => {
      result[cat] = [];
    });
    
    // Add 'Other' category
    result['其他'] = [];
    
    // Group tags by category
    tags.value.forEach(tag => {
      const category = tag.category || '其他';
      if (!result[category]) {
        result[category] = [];
      }
      result[category].push(tag);
    });
    
    return result;
  });
  
  async function fetchTags(category?: string) {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await tagsApi.getAll(category);
      tags.value = result;
    } catch (e) {
      error.value = 'Failed to fetch tags';
      console.error(e);
    } finally {
      loading.value = false;
    }
  }
  
  async function fetchCategories() {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await tagsApi.getCategories();
      categories.value = result;
    } catch (e) {
      error.value = 'Failed to fetch tag categories';
      console.error(e);
    } finally {
      loading.value = false;
    }
  }
  
  async function createTag(name: string, category?: string): Promise<TagInfo | null> {
    loading.value = true;
    error.value = null;
    
    try {
      const tag = await tagsApi.createTag(name, category);
      if (tag) {
        tags.value.push(tag);
        return tag;
      }
      return null;
    } catch (e) {
      error.value = 'Failed to create tag';
      console.error(e);
      return null;
    } finally {
      loading.value = false;
    }
  }
  
  return {
    tags,
    categories,
    loading,
    error,
    tagsByCategory,
    fetchTags,
    fetchCategories,
    createTag
  };
});