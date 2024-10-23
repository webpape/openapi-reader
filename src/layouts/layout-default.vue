<template>
   <q-layout view="hHh LpR fFf">
      <q-header elevated>
         <q-toolbar>
            <q-btn v-show="$q.screen.lt.md" flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

            <q-toolbar-title class="text-uppercase" style="font-size: 12px">{{ theOpenapiDocument?.info.title }}</q-toolbar-title>

            <q-btn round flat color="white" icon="settings" class="q-mr-sm">
               <q-popup-proxy style="width: 300px">
                  <q-card>
                     <q-card-section>
                        <div class="text-h6">Configuration</div>
                        <q-toggle size="xs" v-model="storeGlobal.showDescription">Show Descriptions</q-toggle>
                     </q-card-section>
                  </q-card>
               </q-popup-proxy>
            </q-btn>
            <div v-if="theOpenapiDocument?.info.version">v{{ theOpenapiDocument.info.version }}</div>
         </q-toolbar>
      </q-header>

      <q-drawer v-model="isDrawerOpen" show-if-above bordered :width="theDrawerWidth" class="bg-grey-2">
         <div class="column fit">
            <div class="col-auto">
               <div class="row q-ma-md">
                  <div class="col-xs-12">
                     <q-input v-model="theSearch" outlined dense clearable class="bg-white" clear-icon="clear" @clear="() => (theSearch = '')">
                        <template v-slot:prepend>
                           <q-icon name="search" />
                        </template>
                     </q-input>
                  </div>
               </div>
            </div>
            <div class="col">
               <q-scroll-area class="fit">
                  <q-list dense class="q-mb-md">
                     <template v-for="tagGroup in theTagGroupsFiltered" :key="tagGroup.name">
                        <q-item-label header class="q-pb-xs text-uppercase text-weight-bold text-black">{{ tagGroup.name }}</q-item-label>
                        <q-expansion-item :model-value="theParams.object == tag" dense v-for="tag in tagGroup.tags" :id="'Tag_' + tag" group="ex-item" expand-icon="none" :key="tag" class="text-grey-10" style="font-size: 11px" @click="setCollapsedItemObjectByTag(tag)">
                           <template #header>
                              <div class="row items-center">
                                 <div v-if="tag == theCollapsedItemTag && theCollapsedItems && theCollapsedItems.length > 0" class="text-weight-bold">{{ formatTag(tag) }}</div>
                                 <div v-else>{{ formatTag(tag) }}</div>
                              </div>
                           </template>
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
                     </template>
                  </q-list>
               </q-scroll-area>
            </div>
         </div>
         <div v-touch-pan.preserveCursor.prevent.mouse.horizontal="resizeDrawer" class="q-drawer__resizer"></div>
      </q-drawer>

      <q-page-container>
         <router-view :key="theUID" />
      </q-page-container>
   </q-layout>
</template>

<script setup lang="ts">
import { ref, provide, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { scroll, uid } from 'quasar'
import { OpenAPIV3 } from 'openapi-types'

// import fileSpecJSON from 'G:/ezmax.api/appcluster01/specs/internal.json'
import axios from 'axios'
import { useGlobalStore } from 'src/stores/global'

const { getScrollTarget, setVerticalScrollPosition } = scroll

interface IAdditionnalDocument {
   'x-tagGroups': {
      name: string
      tags: string[]
   }[]
}

type IEzmaxDocument = OpenAPIV3.Document & IAdditionnalDocument

const router = useRouter()
const route = useRoute()
const storeGlobal = useGlobalStore()

let theInitialDrawerWidth: number

const theOpenapiDocument = ref<IEzmaxDocument>()
const theCollapsedItemTag = ref('')
const theCollapsedItems = ref<OpenAPIV3.PathItemObject[]>([])
const theSearch = ref('')
const theParams = ref(route.params)
const theUID = ref()
const theDrawerWidth = ref(300)

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

async function fetchOpenapiDocument() {
   const openapiDocument = await axios.get('../../../specs/internal.json')
   // const openapiDocument = fileSpecJSON
   theOpenapiDocument.value = openapiDocument.data as IEzmaxDocument

   if (theParams.value.object) {
      setCollapsedItemObjectByTag(theParams.value.object as string, true)

      setTimeout(() => {
         scrollToTag(theParams.value.object as string)
      }, 0)
   }
}

async function setCollapsedItemObjectByTag(tag: string, skipRouter?: boolean) {
   theCollapsedItemTag.value = tag

   let filteredPaths: OpenAPIV3.PathItemObject[] = []

   const pathsByType = {
      post: {} as { [key: string]: OpenAPIV3.PathItemObject },
      get: {} as { [key: string]: OpenAPIV3.PathItemObject },
      put: {} as { [key: string]: OpenAPIV3.PathItemObject },
      patch: {} as { [key: string]: OpenAPIV3.PathItemObject },
      delete: {} as { [key: string]: OpenAPIV3.PathItemObject }
   }

   if (theOpenapiDocument.value) {
      const paths = Object.keys(theOpenapiDocument.value.paths).map((obj) => {
         return theOpenapiDocument.value?.paths[obj]
      }) as OpenAPIV3.PathItemObject[]

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

      if (!skipRouter) {
         router.push({ name: 'page-details', params: { object: tag } })
         // setTimeout(() => {
         //    scrollToTag(tag)
         // }, 500)
      }
   }
}

function scrollToTag(tag: string) {
   const el = window.document.getElementById('Tag_' + tag)
   if (el) {
      const target = getScrollTarget(el)
      const offset = el.offsetTop
      const duration = 250
      setVerticalScrollPosition(target, offset, duration)
   }
}

function toggleLeftDrawer() {
   isDrawerOpen.value = !isDrawerOpen.value
}

function formatTag(tagName: string) {
   return tagName.replace('General_', '').replace('Object_', '').replace('Global_', '').replace('Module_', '')
}

function resizeDrawer(ev: any) {
   if (ev.isFirst === true) {
      theInitialDrawerWidth = theDrawerWidth.value
   }
   theDrawerWidth.value = theInitialDrawerWidth + ev.offset.x
}

theParams.value = route.params

fetchOpenapiDocument()

provide('theOpenapiDocument', theOpenapiDocument)

watch(
   () => route,
   () => {
      theUID.value = uid()
   },
   { deep: true }
)
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

.q-drawer__resizer {
   position: absolute;
   top: 0;
   bottom: 0;
   right: -1px;
   width: 1px;
   background-color: $grey-4;
   cursor: ew-resize;
}
</style>
