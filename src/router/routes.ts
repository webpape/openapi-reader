import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
   {
      path: '/',
      component: () => import('src/layouts/layout-default.vue'),
      children: [
         {
            path: '',
            name: 'home',
            component: () => import('src/pages/page-home.vue')
         },
         {
            path: 'schema/:name',
            name: 'schema',
            component: () => import('src/pages/page-schema.vue')
         },
         {
            path: 'webhook/:name',
            name: 'webhook',
            component: () => import('src/pages/page-detail.vue')
         },
         {
            path: ':object/:operation?',
            name: 'page-details',
            component: () => import('src/pages/page-detail.vue')
         }
      ]
   },
   {
      path: '/:catchAll(.*)*',
      name: 'not-found',
      component: () => import('src/pages/page-error-404.vue')
   }
]

export default routes
