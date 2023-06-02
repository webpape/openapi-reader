<template>
   <q-layout view="hHh LpR fFf">
      <q-header elevated>
         <q-toolbar>
            <q-btn v-show="$q.screen.lt.md" flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

            <q-toolbar-title>{{ theOpenapiDocument?.info.title }}</q-toolbar-title>

            <div v-if="theOpenapiDocument?.info.version">v{{ theOpenapiDocument.info.version }}</div>
         </q-toolbar>
      </q-header>

      <q-drawer v-model="isDrawerOpen" show-if-above bordered :width="350">
         <div class="row q-ma-md">
            <div class="col-xs-12">
               Recherche
               <q-input v-model="theSearch" outlined dense clearable clear-icon="clear" @clear="() => (theSearch = '')"></q-input>
            </div>
         </div>
         <q-list dense class="q-mb-md">
            <template v-for="tagGroup in theTagGroupsFiltered" :key="tagGroup.name">
               <q-item-label header class="q-pb-xs text-uppercase">{{ tagGroup.name }}</q-item-label>
               <q-expansion-item dense v-for="tag in tagGroup.tags" group="ex-item" expand-icon="none" :key="tag" :label="formatTag(tag)" class="text-grey-10" style="font-size: 11px" @click="setCollapsedItemObjectByTag(tag)">
                  <q-list dense v-if="tag == theCollapsedItemTag && theCollapsedItems && theCollapsedItems.length > 0">
                     <template v-for="collapsedItem in theCollapsedItems" :key="collapsedItem.description">
                        <q-item v-show="collapsedItem.get" class="or-item" clickable :to="{ name: 'page-details', params: { object: tag, operation: collapsedItem.get?.operationId } }">
                           <q-item-section label style="max-width: 40px"><q-btn class="or-btn-chip" unelevated dense size="xs" color="green-9" text-color="white" square label="GET" style="max-width: 60px" /></q-item-section>
                           <q-item-section :class="collapsedItem.get?.deprecated ? 'text-strike grey-6' : ''">{{ collapsedItem.get?.summary }}</q-item-section>
                        </q-item>
                        <q-item v-show="collapsedItem.post" class="or-item" clickable :to="{ name: 'page-details', params: { object: tag, operation: collapsedItem.post?.operationId } }">
                           <q-item-section label style="max-width: 40px"><q-btn class="or-btn-chip" unelevated dense size="xs" color="blue-9" text-color="white" square label="POST" style="max-width: 60px" /></q-item-section>
                           <q-item-section :class="collapsedItem.post?.deprecated ? 'text-strike grey-6' : ''">{{ collapsedItem.post?.summary }}</q-item-section>
                        </q-item>
                        <q-item v-show="collapsedItem.put" class="or-item" clickable :to="{ name: 'page-details', params: { object: tag, operation: collapsedItem.put?.operationId } }">
                           <q-item-section label style="max-width: 40px"><q-btn class="or-btn-chip" unelevated dense size="xs" color="purple-8" text-color="white" square label="PUT" style="max-width: 60px" /></q-item-section>
                           <q-item-section :class="collapsedItem.put?.deprecated ? 'text-strike grey-6' : ''">{{ collapsedItem.put?.summary }}</q-item-section>
                        </q-item>
                        <q-item v-show="collapsedItem.patch" class="or-item" clickable :to="{ name: 'page-details', params: { object: tag, operation: collapsedItem.patch?.operationId } }">
                           <q-item-section label style="max-width: 40px"><q-btn class="or-btn-chip" unelevated dense size="xs" color="orange-10" text-color="white" square label="PATCH" style="max-width: 60px" /></q-item-section>
                           <q-item-section :class="collapsedItem.patch?.deprecated ? 'text-strike grey-6' : ''">{{ collapsedItem.patch?.summary }}</q-item-section>
                        </q-item>
                        <q-item v-show="collapsedItem.delete" class="or-item" clickable :to="{ name: 'page-details', params: { object: tag, operation: collapsedItem.delete?.operationId } }">
                           <q-item-section label style="max-width: 40px"><q-btn class="or-btn-chip" unelevated dense size="xs" color="red-10" text-color="white" square label="DELETE" style="max-width: 60px" /></q-item-section>
                           <q-item-section :class="collapsedItem.delete?.deprecated ? 'text-strike grey-6' : ''">{{ collapsedItem.delete?.summary }}</q-item-section>
                        </q-item>
                     </template>
                  </q-list>
               </q-expansion-item>

               <!-- <q-item clickable v-for="tag in tagGroup.tags" :key="tag" class="text-grey-10" style="font-size: 11px; min-height: 24px" @click="setCollapsedItemObjectByTag(tag)">
                  <q-item-section>
                     <q-item-label>{{ formatTag(tag) }}</q-item-label>
                  </q-item-section>
               </q-item> -->
            </template>
         </q-list>
      </q-drawer>

      <q-page-container>
         <router-view />
      </q-page-container>
   </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, provide, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from 'boot/axios'
import { OpenAPIV3 } from 'openapi-types'

interface IAdditionnalDocument {
   'x-tagGroups': {
      name: string
      tags: string[]
   }[]
}

type IEzmaxDocument = OpenAPIV3.Document & IAdditionnalDocument

const router = useRouter()

let theOpenapiDocumentRaw = {} as IEzmaxDocument
const theOpenapiDocument = ref<IEzmaxDocument>()
const theCollapsedItemTag = ref('')
const theCollapsedItems = ref<OpenAPIV3.PathItemObject[]>([])
const theSearch = ref('')

const isDrawerOpen = ref(false)

const theTagGroupsFiltered = computed(() => {
   let tagGroups = [] as IAdditionnalDocument['x-tagGroups']
   theOpenapiDocument.value?.['x-tagGroups'].forEach((tagGroup) => {
      const tags = tagGroup.tags.filter((tag) => tag.toLowerCase().includes(theSearch.value.toLowerCase()))
      if (tags && tags.length > 0) {
         const newTagGroup = { ...tagGroup }
         newTagGroup.tags = tags
         tagGroups.push(newTagGroup)
      }
   })
   return tagGroups
})

function fetchOpenapiDocument() {
   api.get('ezmax.v1.1.json').then((res) => {
      const openapiDocument = res.data as IEzmaxDocument

      theOpenapiDocumentRaw = openapiDocument
      theOpenapiDocument.value = openapiDocument
   })
}

async function setCollapsedItemObjectByTag(tag: string) {
   theCollapsedItemTag.value = tag

   let filteredPaths: OpenAPIV3.PathItemObject[] = []

   const pathsByType = {
      post: {} as { [key: string]: OpenAPIV3.PathItemObject },
      get: {} as { [key: string]: OpenAPIV3.PathItemObject },
      put: {} as { [key: string]: OpenAPIV3.PathItemObject },
      patch: {} as { [key: string]: OpenAPIV3.PathItemObject },
      delete: {} as { [key: string]: OpenAPIV3.PathItemObject }
   }

   if (theOpenapiDocumentRaw) {
      const paths = Object.keys(theOpenapiDocumentRaw.paths).map((obj) => {
         return theOpenapiDocumentRaw?.paths[obj]
      }) as OpenAPIV3.PathItemObject[]

      console.log(paths)

      paths.forEach((path) => {
         if (path?.get && path.get.tags) {
            if (path.get.tags?.findIndex((t) => t == tag) > -1) {
               if (path.get.operationId) pathsByType.get[path.get.operationId] = { get: path.get }
            }
         }
         if (path?.post && path.post.tags) {
            if (path.post.tags?.findIndex((t) => t == tag) > -1) {
               if (path.post.operationId) pathsByType.post[path.post.operationId] = { post: path.post }
            }
         }
         if (path?.delete && path.delete.tags) {
            if (path.delete.tags?.findIndex((t) => t == tag) > -1) {
               if (path.delete.operationId) pathsByType.delete[path.delete.operationId] = { delete: path.delete }
            }
         }
         if (path?.patch && path.patch.tags) {
            if (path.patch.tags?.findIndex((t) => t == tag) > -1) {
               if (path.patch.operationId) pathsByType.patch[path.patch.operationId] = { patch: path.patch }
            }
         }
         if (path?.put && path.put.tags) {
            if (path.put.tags?.findIndex((t) => t == tag) > -1) {
               if (path.put.operationId) pathsByType.put[path.put.operationId] = { put: path.put }
            }
         }
      })

      Object.values(pathsByType).forEach(function (type) {
         Object.values(type).forEach((path) => {
            filteredPaths.push(path)
         })
      })

      theCollapsedItems.value = filteredPaths

      router.push({ name: 'page-details', params: { object: tag } })
   }
}

function toggleLeftDrawer() {
   isDrawerOpen.value = !isDrawerOpen.value
}

function formatTag(tagName: string) {
   return tagName.replace('General_', '').replace('Object_', '').replace('Global_', '').replace('Module_', '')
}

provide('theOpenapiDocument', theOpenapiDocument)

onMounted(() => {
   fetchOpenapiDocument()
})
</script>

<style lang="scss">
.or-item {
   line-height: 14px;
   padding: 0px 4px 0px 16px;
}

.or-btn-chip {
   font-family: Verdana, Geneva, Tahoma, sans-serif !important;
   font-weight: 700;
   text-align: center;
}
</style>
