import { createApp } from 'vue'

import App from '@/App.vue'
import router from '@/router'
import store from '@/store'
import '@/style.css'

createApp(App).use(store).use(router).mount('#app')

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker
			.register('/sw.js')
			.catch((error) => console.error('Service Worker 注册失败:', error))
	})
}
