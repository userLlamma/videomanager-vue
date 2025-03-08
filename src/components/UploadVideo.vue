<template>
    <div class="upload-container">
      <h2>上传视频</h2>
      
      <div class="upload-options">
        <div class="option-toggle">
          <button 
            :class="{ active: uploadMode === 'file' }"
            @click="uploadMode = 'file'"
            class="toggle-button"
          >
            上传视频文件
          </button>
          <button 
            :class="{ active: uploadMode === 'path' }"
            @click="uploadMode = 'path'"
            class="toggle-button"
          >
            处理已有视频
          </button>
        </div>
        
        <div class="extract-only">
          <input 
            type="checkbox" 
            id="extract-only" 
            v-model="extractOnly"
          >
          <label for="extract-only">仅提取帧（不进行分类）</label>
        </div>
      </div>
      
      <div v-if="uploadMode === 'file'" class="file-upload">
        <div 
          class="drop-zone"
          :class="{ active: isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleFileDrop"
        >
          <input 
            type="file" 
            ref="fileInput"
            @change="handleFileSelect"
            accept="video/*"
            class="file-input"
          />
          
          <div v-if="!selectedFile" class="drop-content">
            <div class="upload-icon">📁</div>
            <p>拖拽视频文件到此处或</p>
            <button @click="triggerFileInput" class="browse-button">浏览文件</button>
          </div>
          
          <div v-else class="selected-file">
            <div class="file-icon">🎬</div>
            <div class="file-name">{{ selectedFile.name }}</div>
            <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
            <button @click="clearSelectedFile" class="clear-file">&times;</button>
          </div>
        </div>
      </div>
      
      <div v-else class="path-input">
        <input 
          type="text" 
          v-model="videoPath"
          placeholder="输入服务器上的视频路径，例如：/videos/sample.mp4"
          class="path-field"
        />
      </div>
      
      <div class="upload-actions">
        <button 
          @click="processVideo" 
          :disabled="!canProcess || isProcessing"
          class="process-button"
        >
          <span v-if="isProcessing">
            <span class="spinner"></span>
            处理中...
          </span>
          <span v-else>开始处理</span>
        </button>
      </div>
      
      <div v-if="processingResult" class="result-panel">
        <div 
          :class="['result-header', processingResult.success ? 'success' : 'error']"
        >
          <span v-if="processingResult.success">✓ 处理成功</span>
          <span v-else>✗ 处理失败</span>
        </div>
        
        <div class="result-details">
          <div v-if="processingResult.success">
            <p>成功处理视频文件</p>
            <p v-if="processingResult.frames_count">提取了 {{ processingResult.frames_count }} 个帧</p>
            <button @click="goToMaterials" class="view-materials">查看素材</button>
          </div>
          <div v-else>
            <p>处理失败：{{ processingResult.error || '未知错误' }}</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { processingApi } from '@/api';
  import type { ProcessingResult } from '@/types';
  
  const router = useRouter();
  const uploadMode = ref<'file' | 'path'>('file');
  const extractOnly = ref(false);
  const selectedFile = ref<File | null>(null);
  const videoPath = ref('');
  const isDragging = ref(false);
  const isProcessing = ref(false);
  const processingResult = ref<ProcessingResult | null>(null);
  const fileInput = ref<HTMLInputElement | null>(null);
  
  const canProcess = computed(() => {
    if (uploadMode.value === 'file') {
      return !!selectedFile.value;
    } else {
      return !!videoPath.value;
    }
  });
  
  function triggerFileInput() {
    fileInput.value?.click();
  }
  
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      selectedFile.value = input.files[0];
    }
  }
  
  function handleFileDrop(event: DragEvent) {
    isDragging.value = false;
    if (event.dataTransfer?.files.length) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        selectedFile.value = file;
      }
    }
  }
  
  function clearSelectedFile() {
    selectedFile.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
  
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  async function processVideo() {
    isProcessing.value = true;
    processingResult.value = null;
    
    try {
      let result: ProcessingResult;
      
      if (uploadMode.value === 'file' && selectedFile.value) {
        result = await processingApi.uploadVideo(selectedFile.value, extractOnly.value);
      } else if (uploadMode.value === 'path' && videoPath.value) {
        result = await processingApi.processExistingVideo(videoPath.value, extractOnly.value);
      } else {
        throw new Error('No file or path selected');
      }
      
      processingResult.value = result;
    } catch (error) {
      processingResult.value = {
        success: false,
        error: error instanceof Error ? error.message : '处理失败'
      };
    } finally {
      isProcessing.value = false;
    }
  }
  
  function goToMaterials() {
    router.push('/materials');
  }
  </script>
  
  <style scoped>
  .upload-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 30px 20px;
  }
  
  .upload-options {
    margin-bottom: 24px;
  }
  
  .option-toggle {
    display: flex;
    margin-bottom: 16px;
  }
  
  .toggle-button {
    flex: 1;
    padding: 10px;
    text-align: center;
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    cursor: pointer;
  }
  
  .toggle-button:first-child {
    border-radius: 4px 0 0 4px;
  }
  
  .toggle-button:last-child {
    border-radius: 0 4px 4px 0;
  }
  
  .toggle-button.active {
    background-color: #2196f3;
    color: white;
    border-color: #2196f3;
  }
  
  .extract-only {
    display: flex;
    align-items: center;
    margin-top: 8px;
  }
  
  .extract-only label {
    margin-left: 8px;
    cursor: pointer;
  }
  
  .file-upload {
    margin-bottom: 24px;
  }
  
  .drop-zone {
    position: relative;
    border: 2px dashed #ddd;
    border-radius: 8px;
    padding: 40px 20px;
    text-align: center;
    transition: all 0.3s;
  }
  
  .drop-zone.active {
    border-color: #2196f3;
    background-color: rgba(33, 150, 243, 0.05);
  }
  
  .file-input {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    opacity: 0;
    cursor: pointer;
  }
  
  .drop-content {
    pointer-events: none;
  }
  
  .upload-icon {
    font-size: 40px;
    margin-bottom: 10px;
    color: #777;
  }
  
  .browse-button {
    display: inline-block;
    padding: 8px 16px;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;
    pointer-events: auto;
  }
  
  .selected-file {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
  
  .file-icon {
    font-size: 24px;
  }
  
  .file-name {
    font-weight: bold;
  }
  
  .file-size {
    color: #777;
    font-size: 0.9em;
  }
  
  .clear-file {
    background: none;
    border: none;
    color: #f44336;
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
  }
  
  .path-input {
    margin-bottom: 24px;
  }
  
  .path-field {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
  }
  
  .upload-actions {
    text-align: center;
  }
  
  .process-button {
    padding: 12px 24px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    min-width: 200px;
  }
  
  .process-button:disabled {
    background-color: #ddd;
    cursor: not-allowed;
  }
  
  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .result-panel {
    margin-top: 30px;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .result-header {
    padding: 12px;
    font-weight: bold;
    text-align: center;
  }
  
  .result-header.success {
    background-color: #e8f5e9;
    color: #2e7d32;
  }
  
  .result-header.error {
    background-color: #ffebee;
    color: #c62828;
  }
  
  .result-details {
    padding: 20px;
    text-align: center;
  }
  
  .view-materials {
    margin-top: 16px;
    padding: 8px 16px;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  </style>