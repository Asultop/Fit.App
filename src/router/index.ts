import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'track',
      component: () => import('@/views/TrackView.vue'),
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('@/views/TrackEditorView.vue'),
    },
  ],
})

export default router
