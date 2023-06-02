import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
   {
      path: '/',
      component: () => import('src/layouts/layout-default.vue'),
      children: [
         {
            path: '',
            component: () => import('src/pages/page-home.vue')
         },
         {
            path: ':object/:operation?',
            name: 'page-details',
            component: () => import('src/pages/page-detail.vue')
         }
      ]
   },

   // Always leave this as last one,
   // but you can also remove it
   {
      path: '/:catchAll(.*)*',
      component: () => import('src/pages/page-error-404.vue')
   }
]

export default routes
