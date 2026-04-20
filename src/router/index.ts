import { createRouter, createWebHistory } from 'vue-router'

import { isAccessGranted } from '@/utils/access'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/access',
      name: 'access',
      component: () => import('@/views/AccessGateView.vue'),
      meta: { public: true, section: 'access' },
    },
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
      path: '/mine',
      name: 'mine',
      component: () => import('@/views/MineView.vue'),
      meta: { section: 'mine' },
    },
    {
      path: '/editor',
      name: 'editor',
      component: () => import('@/views/TrackEditorView.vue'),
      meta: { section: 'mine' },
    },
  ],
})

router.beforeEach((to) => {
  const isPublicRoute = Boolean(to.meta.public)

  if (isPublicRoute) {
    if (to.name === 'access' && isAccessGranted()) {
      const redirect = to.query.redirect
      if (typeof redirect === 'string' && redirect.startsWith('/')) {
        return redirect
      }

      return '/'
    }

    return true
  }

  if (isAccessGranted()) {
    return true
  }

  return {
    path: '/access',
    query: {
      redirect: to.fullPath,
    },
  }
})

export default router
