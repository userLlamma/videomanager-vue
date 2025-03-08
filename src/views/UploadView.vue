<template>
    <div class="upload-view">
      <h1>上传视频</h1>
      <UploadVideo />
    </div>
</template>

<script setup lang="ts">
import UploadVideo from '@/components/UploadVideo.vue';
</script>

<style scoped>
.upload-view {
max-width: 1200px;
margin: 0 auto;
padding: 20px;
}

.upload-view h1 {
margin-bottom: 20px;
}
</style>