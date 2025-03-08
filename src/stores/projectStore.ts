import { defineStore } from 'pinia';
import { ref } from 'vue';
import { projectsApi } from '@/api';
import type { Project } from '@/types';

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  async function fetchProjects() {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await projectsApi.getAll();
      projects.value = result;
    } catch (e) {
      error.value = 'Failed to fetch projects';
      console.error(e);
    } finally {
      loading.value = false;
    }
  }
  
  async function getProject(id: number): Promise<Project | null> {
    loading.value = true;
    error.value = null;
    
    try {
      const project = await projectsApi.getById(id);
      return project;
    } catch (e) {
      error.value = `Failed to fetch project ${id}`;
      console.error(e);
      return null;
    } finally {
      loading.value = false;
    }
  }
  
  async function createProject(name: string, description?: string): Promise<Project | null> {
    loading.value = true;
    error.value = null;
    
    try {
      const project = await projectsApi.createProject(name, description);
      if (project) {
        projects.value.push(project);
        return project;
      }
      return null;
    } catch (e) {
      error.value = 'Failed to create project';
      console.error(e);
      return null;
    } finally {
      loading.value = false;
    }
  }
  
  return {
    projects,
    loading,
    error,
    fetchProjects,
    getProject,
    createProject
  };
});