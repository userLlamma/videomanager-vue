<template>
  <div class="app-container">
    <header>
      <nav>
        <router-link to="/">首页</router-link>
        <router-link to="/materials">素材库</router-link>
        <router-link to="/projects">项目</router-link>
        <router-link to="/upload">上传</router-link>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>