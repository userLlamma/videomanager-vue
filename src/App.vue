<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <router-link to="/" class="app-logo">视频素材管理系统</router-link>
        <nav class="app-nav">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/materials" class="nav-link">素材库</router-link>
          <router-link to="/projects" class="nav-link">项目</router-link>
          <router-link to="/upload" class="nav-link">上传</router-link>
        </nav>
      </div>
    </header>
    <main class="app-content">
      <router-view />
    </main>
    <footer class="app-footer">
      <div class="footer-content">
        <p>© {{ new Date().getFullYear() }} 视频素材管理系统</p>
      </div>
    </footer>
  </div>
</template>

<style>
:root {
  --primary-color: #2196f3;
  --secondary-color: #4caf50;
  --background-color: #f5f5f5;
  --text-color: #333;
  --light-text-color: #666;
  --border-color: #ddd;
}

* {
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 0;
  background-color: var(--background-color);
  color: var(--text-color);
  line-height: 1.6;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.app-logo {
  font-size: 1.5em;
  font-weight: bold;
  color: var(--primary-color);
  text-decoration: none;
}

.app-nav {
  display: flex;
  gap: 20px;
}

.nav-link {
  color: var(--text-color);
  text-decoration: none;
  padding: 8px 0;
  position: relative;
}

.nav-link.router-link-active {
  color: var(--primary-color);
  font-weight: 500;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary-color);
}

.app-content {
  flex: 1;
  padding: 20px 0;
}

.app-footer {
  background-color: #333;
  color: white;
  padding: 20px 0;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: center;
}
</style>