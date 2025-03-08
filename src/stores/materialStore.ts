import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { materialsApi } from '@/api';
import type { Material } from '@/types';

export const useMaterialStore = defineStore('material', () => {
  const materials = ref<Material[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const currentPage = ref(0);
  const totalItems = ref(0);
  const itemsPerPage = ref(20);
  const currentSearchQuery = ref('');
  const selectedTagIds = ref<number[]>([]);
  
  const filteredMaterials = computed(() => {
    return materials.value;
  });
  
  async function fetchMaterials(search = '', tagIds: number[] = [], reset = false) {
    if (reset) {
      currentPage.value = 0;
      materials.value = [];
    }
    
    currentSearchQuery.value = search;
    selectedTagIds.value = tagIds;
    
    loading.value = true;
    error.value = null;
    
    try {
      const skip = currentPage.value * itemsPerPage.value;
      const result = await materialsApi.getAll(search, tagIds, skip, itemsPerPage.value);
      
      // Make sure result is always an array
      if (Array.isArray(result)) {
        if (reset || currentPage.value === 0) {
          materials.value = result;
        } else {
          materials.value = [...materials.value, ...result];
        }
        
        // Estimate total items based on whether we got a full page
        if (result.length < itemsPerPage.value) {
          totalItems.value = currentPage.value * itemsPerPage.value + result.length;
        } else {
          // If we got a full page, there might be more
          totalItems.value = (currentPage.value + 1) * itemsPerPage.value + 1;
        }
      } else {
        // Handle case where API returns a non-array
        error.value = 'Invalid response format from API';
        materials.value = [];
      }
    } catch (e) {
      error.value = 'Failed to fetch materials';
      console.error(e);
    } finally {
      loading.value = false;
    }
  }
  
  function loadNextPage() {
    if (loading.value) return;
    currentPage.value++;
    fetchMaterials(currentSearchQuery.value, selectedTagIds.value);
  }
  
  async function getMaterial(id: number): Promise<Material | null> {
    loading.value = true;
    error.value = null;
    
    try {
      const material = await materialsApi.getById(id);
      return material;
    } catch (e) {
      error.value = `Failed to fetch material ${id}`;
      console.error(e);
      return null;
    } finally {
      loading.value = false;
    }
  }
  
  async function updateMaterial(id: number, data: Partial<Material>): Promise<boolean> {
    loading.value = true;
    error.value = null;
    
    try {
      const updated = await materialsApi.updateMaterial(id, data);
      if (updated) {
        // Update in local cache
        const index = materials.value.findIndex(m => m.id === id);
        if (index !== -1) {
          materials.value[index] = { ...materials.value[index], ...updated };
        }
        return true;
      }
      return false;
    } catch (e) {
      error.value = `Failed to update material ${id}`;
      console.error(e);
      return false;
    } finally {
      loading.value = false;
    }
  }
  
  async function deleteMaterial(id: number): Promise<boolean> {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await materialsApi.deleteMaterial(id);
      if (result) {
        // Remove from local cache
        materials.value = materials.value.filter(m => m.id !== id);
        // Decrement total items count
        totalItems.value = Math.max(0, totalItems.value - 1);
        return true;
      }
      return false;
    } catch (e) {
      error.value = `Failed to delete material ${id}`;
      console.error(e);
      return false;
    } finally {
      loading.value = false;
    }
  }
  
  return {
    materials,
    loading,
    error,
    currentPage,
    totalItems,
    itemsPerPage,
    filteredMaterials,
    currentSearchQuery,
    selectedTagIds,
    fetchMaterials,
    loadNextPage,
    getMaterial,
    updateMaterial,
    deleteMaterial
  };
});