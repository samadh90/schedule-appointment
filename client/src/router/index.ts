import { createRouter, createWebHistory } from 'vue-router'
import SlotListView from '../views/SlotListView.vue'
import BookView from '../views/BookView.vue'
import CancelView from '../views/CancelView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: SlotListView },
    { path: '/book', component: BookView },
    { path: '/cancel/:token?', component: CancelView },
  ],
})

export default router
