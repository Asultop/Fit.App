import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'track',
      component: () => import('@/views/TrackView.vue'),
      meta: { section: 'track' },
    },
    {
      path: '/track/:id',
      name: 'track-detail',
      component: () => import('@/views/TrackDetailView.vue'),
      meta: { section: 'track' },
    },
    {
      path: '/editor',
      name: 'mine',
      component: () => import('@/views/TrackEditorView.vue'),
      meta: { section: 'mine' },
    },
  ],
})

export default router
