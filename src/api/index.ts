// src/api/index.ts - API client
import axios from 'axios';
import type { Material, TagInfo, Project, ProcessingResult } from '@/types';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const materialsApi = {
    async getAll(search = '', tagIds: number[] = [], skip = 0, limit = 20): Promise<Material[]> {
      try {
        // Convert tagIds array to URL query parameters
        const tagParams = tagIds.map(id => `tag_ids=${id}`).join('&');
        const url = `/materials/?search=${search}&skip=${skip}&limit=${limit}${tagIds.length ? `&${tagParams}` : ''}`;
        
        const response = await apiClient.get(url);
        
        // Ensure we're always returning an array, even if the API returns an object
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching materials:', error);
        return [];
      }
    },
  
    async getById(id: number): Promise<Material | null> {
      try {
        const response = await apiClient.get(`/materials/${id}`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching material ${id}:`, error);
        return null;
      }
    },
  
    async updateMaterial(id: number, data: Partial<Material>): Promise<Material | null> {
      try {
        const response = await apiClient.put(`/materials/${id}`, data);
        return response.data;
      } catch (error) {
        console.error(`Error updating material ${id}:`, error);
        return null;
      }
    },
    
    async deleteMaterial(id: number): Promise<boolean> {
      try {
        await apiClient.delete(`/materials/${id}`);
        return true;
      } catch (error) {
        console.error(`Error deleting material ${id}:`, error);
        return false;
      }
    },
    
    async addTag(materialId: number, tagIds: number[]): Promise<boolean> {
      try {
        await apiClient.post(`/materials/${materialId}/tags`, tagIds);
        return true;
      } catch (error) {
        console.error('Error adding tags:', error);
        return false;
      }
    },
    
    async removeTag(materialId: number, tagId: number): Promise<boolean> {
      try {
        await apiClient.delete(`/materials/${materialId}/tags/${tagId}`);
        return true;
      } catch (error) {
        console.error('Error removing tag:', error);
        return false;
      }
    }
  };
  
  export const tagsApi = {
    async getAll(category?: string, skip = 0, limit = 100): Promise<TagInfo[]> {
      try {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        
        const response = await apiClient.get(`/tags/?${params.toString()}`);
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching tags:', error);
        return [];
      }
    },
    
    async getCategories(): Promise<string[]> {
      try {
        const response = await apiClient.get('/tags/categories');
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching tag categories:', error);
        return [];
      }
    },
    
    async createTag(name: string, category?: string): Promise<TagInfo | null> {
      try {
        const response = await apiClient.post('/tags/', { name, category });
        return response.data;
      } catch (error) {
        console.error('Error creating tag:', error);
        return null;
      }
    }
  };
  
  export const projectsApi = {
    async getAll(skip = 0, limit = 100): Promise<Project[]> {
      try {
        const response = await apiClient.get(`/projects/?skip=${skip}&limit=${limit}`);
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
      }
    },
    
    async getById(id: number): Promise<Project | null> {
      try {
        const response = await apiClient.get(`/projects/${id}`);
        return response.data;
      } catch (error) {
        console.error(`Error fetching project ${id}:`, error);
        return null;
      }
    },
    
    async createProject(name: string, description?: string): Promise<Project | null> {
      try {
        const response = await apiClient.post('/projects/', { name, description });
        return response.data;
      } catch (error) {
        console.error('Error creating project:', error);
        return null;
      }
    },
    
    async getProjectMaterials(projectId: number, skip = 0, limit = 100): Promise<any[]> {
      try {
        const response = await apiClient.get(`/projects/${projectId}/materials?skip=${skip}&limit=${limit}`);
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error(`Error fetching materials for project ${projectId}:`, error);
        return [];
      }
    },
    
    async addMaterialsToProject(projectId: number, materialIds: number[], notes?: string): Promise<boolean> {
      try {
        await apiClient.post(`/projects/${projectId}/materials`, { material_ids: materialIds, notes });
        return true;
      } catch (error) {
        console.error('Error adding materials to project:', error);
        return false;
      }
    }
  };
  
  export const processingApi = {
    async uploadVideo(file: File, extractOnly = false): Promise<ProcessingResult> {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('extract_only', extractOnly.toString());
        
        const response = await apiClient.post('/processing/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        return response.data;
      } catch (error) {
        console.error('Error uploading video:', error);
        return { success: false, error: 'Failed to upload video' };
      }
    },
    
    async processExistingVideo(videoPath: string, extractOnly = false): Promise<ProcessingResult> {
      try {
        const response = await apiClient.post('/processing/process', { 
          video_path: videoPath, 
          extract_only: extractOnly 
        });
        
        return response.data;
      } catch (error) {
        console.error('Error processing video:', error);
        return { success: false, error: 'Failed to process video' };
      }
    },
    
    async batchProcess(videoFolder: string, extractOnly = false): Promise<ProcessingResult> {
      try {
        const formData = new FormData();
        formData.append('video_folder', videoFolder);
        formData.append('extract_only', extractOnly.toString());
        
        const response = await apiClient.post('/processing/batch', formData);
        return response.data;
      } catch (error) {
        console.error('Error batch processing videos:', error);
        return { success: false, error: 'Failed to batch process videos' };
      }
    }
  };
