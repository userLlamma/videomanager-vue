<template>
    <div class="home-container">
      <section class="hero">
        <h1>视频素材管理系统</h1>
        <p class="subtitle">上传、管理和组织您的视频素材</p>
        <div class="action-buttons">
          <router-link to="/upload" class="action-button upload">上传视频</router-link>
          <router-link to="/materials" class="action-button browse">浏览素材</router-link>
        </div>
      </section>
      
      <section class="features">
        <div class="feature-card">
          <div class="feature-icon">🎬</div>
          <h3>自动提取关键帧</h3>
          <p>从视频中自动提取关键帧，无需手动截取</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🔍</div>
          <h3>智能标签识别</h3>
          <p>利用AI自动为提取的帧添加描述性标签</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🗂️</div>
          <h3>项目管理</h3>
          <p>创建项目收集和整理相关素材，提高工作效率</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🔎</div>
          <h3>快速检索</h3>
          <p>通过标签、描述或项目快速找到所需素材</p>
        </div>
      </section>
      
      <section v-if="statsLoaded" class="stats">
        <div class="stat-card">
          <div class="stat-number">{{ stats.materialsCount }}</div>
          <div class="stat-label">素材</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">{{ stats.tagsCount }}</div>
          <div class="stat-label">标签</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">{{ stats.projectsCount }}</div>
          <div class="stat-label">项目</div>
        </div>
      </section>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useMaterialStore } from '@/stores/materialStore';
  import { useTagStore } from '@/stores/tagStore';
  import { useProjectStore } from '@/stores/projectStore';
  
  const materialStore = useMaterialStore();
  const tagStore = useTagStore();
  const projectStore = useProjectStore();
  
  const stats = ref({
    materialsCount: 0,
    tagsCount: 0,
    projectsCount: 0
  });
  
  const statsLoaded = ref(false);
  
  onMounted(async () => {
    // Load data for stats
    try {
      await Promise.all([
        materialStore.fetchMaterials(),
        tagStore.fetchTags(),
        projectStore.fetchProjects()
      ]);
      
      stats.value = {
        materialsCount: materialStore.materials.length,
        tagsCount: tagStore.tags.length,
        projectsCount: projectStore.projects.length
      };
      
      statsLoaded.value = true;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  });
  </script>
  
  <style scoped>
  .home-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  
  .hero {
    text-align: center;
    padding: 60px 20px;
    background-color: #f5f5f5;
    border-radius: 12px;
    margin-bottom: 40px;
  }
  
  .hero h1 {
    font-size: 2.5rem;
    margin-bottom: 20px;
    color: #333;
  }
  
  .subtitle {
    font-size: 1.2rem;
    color: #666;
    margin-bottom: 30px;
  }
  
  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 20px;
  }
  
  .action-button {
    display: inline-block;
    padding: 12px 24px;
    border-radius: 6px;
    font-weight: bold;
    text-decoration: none;
    transition: all 0.3s;
  }
  
  .action-button.upload {
    background-color: #4caf50;
    color: white;
  }
  
  .action-button.upload:hover {
    background-color: #43a047;
  }
  
  .action-button.browse {
    background-color: #2196f3;
    color: white;
  }
  
  .action-button.browse:hover {
    background-color: #1e88e5;
  }
  
  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }
  
  .feature-card {
    background-color: white;
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    transition: transform 0.3s;
  }
  
  .feature-card:hover {
    transform: translateY(-5px);
  }
  
  .feature-icon {
    font-size: 3rem;
    margin-bottom: 20px;
  }
  
  .feature-card h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #333;
  }
  
  .feature-card p {
    margin: 0;
    color: #666;
  }
  
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }
  
  .stat-card {
    background-color: white;
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  
  .stat-number {
    font-size: 2.5rem;
    font-weight: bold;
    color: #2196f3;
    margin-bottom: 10px;
  }
  
  .stat-label {
    font-size: 1.2rem;
    color: #666;
  }
  </style>