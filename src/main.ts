import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createPinia } from 'pinia';
import App from './App.vue';
import HomeView from './views/HomeView.vue';
import MaterialsView from './views/MaterialsView.vue';
import UploadView from './views/UploadView.vue';

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/materials',
      name: 'materials',
      component: MaterialsView
    },
    {
      path: '/upload',
      name: 'upload',
      component: UploadView
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('./views/ProjectsView.vue')
    }
  ]
});

// Create Pinia store
const pinia = createPinia();

// Create and mount application
const app = createApp(App);
app.use(router);
app.use(pinia);
app.mount('#app');