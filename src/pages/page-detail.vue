<template>
   <q-page class="page-full-height">
      <q-scroll-area class="fit page-scroll-area">
         <template v-if="thePage && !theOperation?.operation">
            <div class="text-h5 row items-center">
               <div v-if="thePage['x-displayName']">{{ thePage['x-displayName'] }}</div>
            </div>
            <div class="page-markdown-content" v-html="marked.parse(thePage.description)"></div>
         </template>

         <template v-else>
            <div class="text-h5 row items-center">
               <div>{{ theOperation?.operation?.summary }}</div>
               <q-chip v-if="theOperation.operation?.deprecated" color="negative" text-color="white" square outline class="q-ml-md text-weight-medium">Deprecated</q-chip>
            </div>
            <div v-if="theOperation?.method" class="q-pa-sm q-my-md bg-grey-3 rounded-borders" style="font-family: monospace">
               <q-btn class="or-btn-chip" :class="'method_' + theOperation.method" unelevated dense size="sm" text-color="white" square :label="theOperation.method" style="width: 60px" />
               {{ theOperation?.route }}
               <q-btn flat square padding="4px 8px" icon="content_copy" size="sm" color="grey-7" class="float-right" @click="onCopy"></q-btn>
            </div>
            <div v-if="theOperation?.operation?.description" class="text-body2 q-mb-md">
               {{ theOperation.operation.description }}
            </div>

            <div v-if="theParameterTree && theParameterTree.length > 0">
               <div class="text-h6 text-uppercase">
                  Path Parameters
                  <q-btn flat round size="sm" dense color="secondary" :icon="theExpandCollapseTree.path ? 'unfold_less' : 'unfold_more'" class="q-ml-sm" @click="() => onExpandCollapseTree('path')"></q-btn>
               </div>
               <div class="text-body2">
                  <q-tree ref="thePathTreeRef" :nodes="theParameterTree" icon="keyboard_arrow_right" node-key="label" default-expand-all dense>
                     <template #default-header="prop">
                        <div class="row items-center">
                           <div style="font-family: Inconsolata" class="text-weight-bold">
                              {{ prop.node.label }}
                           </div>
                           <q-icon v-if="prop.node.required" size="10px" color="negative" name="emergency" style="margin-top: -2px; margin-left: 2px"></q-icon>
                        </div>
                        <x-badge-object-type :type="prop.node.type"></x-badge-object-type>
                        <x-badge-length :min-length="prop.node.minlength" :max-length="prop.node.maxLength"></x-badge-length>
                        <x-badge-pattern v-if="prop.node.pattern" :pattern="prop.node.pattern"></x-badge-pattern>
                     </template>
                     <template #default-body="prop">
                        <div v-if="prop.node.enum" style="font-size: 12px; line-height: 16px" class="text-grey-8">ENUM : {{ prop.node.enum.toString().replaceAll(',', ', ') }}</div>
                        <div style="font-size: 12px; line-height: 16px" class="text-grey-7">{{ prop.node.description }}</div>
                     </template>
                  </q-tree>
               </div>
            </div>

            <div v-if="theRequestTree && theRequestTree.length > 0">
               <div class="text-h6 text-uppercase">
                  Request Body
                  <q-btn flat round size="sm" dense color="secondary" :icon="theExpandCollapseTree.request ? 'unfold_less' : 'unfold_more'" class="q-ml-sm" @click="() => onExpandCollapseTree('request')"></q-btn>
               </div>
               <div class="text-body2">
                  <q-tree ref="theRequestTreeRef" :nodes="theRequestTree" icon="keyboard_arrow_right" node-key="label" default-expand-all dense>
                     <template #default-header="prop">
                        <div class="row items-center">
                           <div style="font-family: Inconsolata" class="text-weight-bold">
                              {{ prop.node.label }}
                           </div>
                           <q-icon v-if="prop.node.required" size="10px" color="negative" name="emergency" style="margin-top: -2px; margin-left: 2px"></q-icon>
                        </div>
                        <x-badge-object-type :type="prop.node.type"></x-badge-object-type>
                        <x-badge-length :min-length="prop.node.minlength" :max-length="prop.node.maxLength"></x-badge-length>
                        <x-badge-minimum-maximum :minimum="prop.node.minimum" :maximum="prop.node.maximum"></x-badge-minimum-maximum>
                        <x-badge-pattern v-if="prop.node.pattern" :pattern="prop.node.pattern"></x-badge-pattern>
                     </template>
                     <template #default-body="prop">
                        <div v-if="prop.node.enum && prop.node.enum.length > 0" style="font-family: monospace" class="items-center row q-ml-sm">
                           <q-chip v-for="stringEnum in prop.node.enum" :key="stringEnum" size="12px" dense square text-color="grey-9" style="font-family: monospace; padding: 2px 8px">"{{ stringEnum }}"</q-chip>
                        </div>
                        <div v-if="storeGlobal.showDescription && prop.node.description" class="tree-description text-grey-7" v-html="marked.parse(prop.node.description)"></div>
                     </template>
                  </q-tree>
               </div>
            </div>

            <div v-if="theResponseTree && theResponseTree.length > 0" class="q-mt-md">
               <div class="text-h6 text-uppercase">
                  Responses
                  <q-btn flat round size="sm" dense color="secondary" :icon="theExpandCollapseTree.response ? 'unfold_less' : 'unfold_more'" class="q-ml-sm" @click="() => onExpandCollapseTree('response')"></q-btn>
               </div>
               <div class="text-body2">
                  <q-tree ref="theResponseTreeRef" :nodes="theResponseTree" icon="keyboard_arrow_right" node-key="label" default-expand-all dense>
                     <template #default-header="prop">
                        <div class="row items-center">
                           <div style="font-family: Inconsolata" class="text-weight-bold">
                              {{ prop.node.label }}
                           </div>
                           <q-icon v-if="prop.node.required" size="10px" color="negative" name="emergency" style="margin-top: -2px; margin-left: 2px"></q-icon>
                        </div>
                        <x-badge-object-type :type="prop.node.type"></x-badge-object-type>
                        <x-badge-length :min-length="prop.node.minlength" :max-length="prop.node.maxLength"></x-badge-length>
                        <x-badge-minimum-maximum :minimum="prop.node.minimum" :maximum="prop.node.maximum"></x-badge-minimum-maximum>
                        <x-badge-pattern v-if="prop.node.pattern" :pattern="prop.node.pattern"></x-badge-pattern>
                     </template>
                     <template #default-body="prop">
                        <div v-if="prop.node.enum && prop.node.enum.length > 0" style="font-family: monospace" class="items-center row">
                           <q-chip v-for="stringEnum in prop.node.enum" :key="stringEnum" size="12px" dense square text-color="grey-9" style="font-family: monospace; padding: 2px 8px">"{{ stringEnum }}"</q-chip>
                        </div>
                        <div v-if="storeGlobal.showDescription && prop.node.description" class="tree-description text-grey-7" v-html="marked.parse(prop.node.description)"></div>
                     </template>
                  </q-tree>
               </div>
            </div>
         </template>
      </q-scroll-area>

      <!-- <pre style="font-size: 10px; line-height: 12px">{{ theOpenapiDocument }}</pre> -->
   </q-page>
</template>

<script setup lang="ts">
import { ref, inject, Ref, computed, watch, reactive } from 'vue'
import { useQuasar, QTree } from 'quasar'
import { useRoute } from 'vue-router'
// import { QTreeNode } from 'quasar'
import { OpenAPIV3 } from 'openapi-types'
import { UOpenApi } from 'src/utils/openapi'
import { useGlobalStore } from 'src/stores/global'
import { marked } from 'marked'

import XBadgeLength from 'src/components/badge-length'
import XBadgeMinimumMaximum from 'src/components/badge-minimum-maximum'
import XBadgeObjectType from 'src/components/badge-object-type'
import XBadgePattern from 'src/components/badge-pattern'

interface IAdditionnalDocument {
   'x-tagGroups': {
      name: string
      tags: string[]
   }[]
}

interface IAdditionnalTag {
   'x-displayName': string
   description: string
}

type IEzmaxDocument = OpenAPIV3.Document & IAdditionnalDocument
type IEzmaxTag = OpenAPIV3.TagObject & IAdditionnalTag

const route = useRoute()
const quasar = useQuasar()
const storeGlobal = useGlobalStore()

const theOpenapiDocument = inject('theOpenapiDocument') as Ref<IEzmaxDocument | undefined>

const theRequestTree = ref<any[]>([])
const theResponseTree = ref<any[]>([])
const theParameterTree = ref<any[]>([])

const thePathTreeRef = ref<QTree>()
const theRequestTreeRef = ref<QTree>()
const theResponseTreeRef = ref<QTree>()

const theExpandCollapseTree = reactive({
   path: true,
   request: true,
   response: true
})

const thePage = computed<IEzmaxTag | undefined>(() => {
   if (theOpenapiDocument.value) {
      const page = theOpenapiDocument.value.tags?.find((tag) => tag.name == route.params.object) as IEzmaxTag
      return page
   } else {
      return undefined
   }
})

// const theOperation = ref<{ method: string; route: string; operation?: OpenAPIV3.OperationObject }>()
const theOperation = computed<{ method: string; route: string; operation?: OpenAPIV3.OperationObject }>(() => {
   if (theOpenapiDocument.value) {
      const paths = Object.keys(theOpenapiDocument.value.paths).map((obj) => {
         return {
            route: obj,
            detail: theOpenapiDocument.value?.paths[obj]
         }
      }) as { route: string; detail: OpenAPIV3.PathItemObject }[]

      const operation = paths.find((path) => {
         if (
            (path.detail.get && path.detail.get.operationId == route.params.operation) ||
            (path.detail.post && path.detail.post.operationId == route.params.operation) ||
            (path.detail.put && path.detail.put.operationId == route.params.operation) ||
            (path.detail.patch && path.detail.patch.operationId == route.params.operation) ||
            (path.detail.delete && path.detail.delete.operationId == route.params.operation)
         ) {
            return path
         } else {
            return undefined
         }
      })

      if (operation?.detail.get && operation.detail.get.operationId == route.params.operation) {
         return {
            method: 'get',
            route: operation.route,
            operation: operation.detail.get
         }
      } else if (operation?.detail.post && operation.detail.post.operationId == route.params.operation) {
         return {
            method: 'post',
            route: operation.route,
            operation: operation.detail.post
         }
      } else if (operation?.detail.put && operation.detail.put.operationId == route.params.operation) {
         return {
            method: 'put',
            route: operation.route,
            operation: operation.detail.put
         }
      } else if (operation?.detail.patch && operation.detail.patch.operationId == route.params.operation) {
         return {
            method: 'patch',
            route: operation.route,
            operation: operation.detail.patch
         }
      } else if (operation?.detail.delete && operation.detail.delete.operationId == route.params.operation) {
         return {
            method: 'delete',
            route: operation.route,
            operation: operation.detail.delete
         }
      } else {
         return {
            method: '',
            route: '',
            operation: undefined
         }
      }
   } else {
      return {
         method: '',
         route: '',
         operation: undefined
      }
   }
})

function setRequestTree() {
   theRequestTree.value = []
   const openapiDocument = theOpenapiDocument.value
   const requestBody = theOperation.value?.operation?.requestBody
   theRequestTree.value = getRequestTree(requestBody, openapiDocument)
}

function setResponseTree() {
   theResponseTree.value = []
   const openapiDocument = theOpenapiDocument.value
   const responses = theOperation.value?.operation?.responses
   theResponseTree.value = getResponseTree(responses, openapiDocument)
}

function setParameterTree() {
   theParameterTree.value = []
   const openapiDocument = theOpenapiDocument.value
   const parameters = theOperation.value?.operation?.parameters
   theParameterTree.value = getParameterTree(parameters, openapiDocument)
}

function getTree(ref: any): any[] {
   let tree = []
   const properties = getProperties(ref)

   if (properties) {
      for (const key in properties) {
         const element = properties[key]
         let children: any[] = []
         const isRequired = ref.required && ref.required.length > 0 && ref.required.includes(key) ? true : false

         if (element?.items?.allOf && element.items.allOf.length > 0) {
            for (let index = 0; index < element.items.allOf.length; index++) {
               if (element.items.allOf[index]?.ref) children = [...children, ...getTree(element.items.allOf[index]?.ref)]
               else if (element.items.allOf[index]) children = [...children, ...getTree(element.items.allOf[index])]
            }
         }

         if (element?.allOf && element.allOf.length > 0) {
            for (let index = 0; index < element.allOf.length; index++) {
               if (element.allOf[index]?.ref) children = [...children, ...getTree(element.allOf[index]?.ref)]
               else if (element.allOf[index]) children = [...children, ...getTree(element.allOf[index])]
            }
         }

         if (element?.properties) {
            children = [...children, ...getTree(element)]
         }

         if (element?.items?.properties) {
            children = [...children, ...getTree(element?.items)]
         }

         children.sort((a, b) => customSort(a.label, b.label))

         if (element) {
            tree.push({
               label: key,
               children: children,
               description: element && Object.prototype.hasOwnProperty.call(element, 'description') ? element.description : '',
               maximum: element.maximum,
               minimum: element.minimum,
               type: element.type,
               pattern: element.pattern,
               minLength: element.minLength,
               maxLength: element.maxLength,
               enum: element.enum || [],
               required: isRequired
            })
         }
      }
   }

   tree.sort((a, b) => customSort(a.label, b.label))

   return tree
}

function customSort(a: string, b: string) {
   const order: any = {
      mPayload: 0,
      a_obj: 1,
      obj: 2,
      pki: 3,
      fki: 4,
      objAudit: 5,
      objDebug: 6,
      objDebugPayload: 7
   }

   const getSortValue = (label: string) => {
      for (const key in order) {
         if (label.startsWith(key)) {
            return order[key]
         }
      }
      return 8 // Default value for other labels
   }

   const valueA = getSortValue(a)
   const valueB = getSortValue(b)

   if (valueA !== valueB) {
      return valueA - valueB
   } else {
      return a.localeCompare(b) // Sort alphabetically for labels within the same category
   }
}

function getProperties(ref: any) {
   let properties: any = {}

   if (ref?.allOf) {
      ref.allOf.forEach((element: any) => {
         if (element?.properties) {
            properties = { ...properties, ...element.properties }
         }
      })
   }

   if (ref?.properties) {
      if (ref?.properties?.allOf) {
         properties = { ...properties, ...getProperties(ref.properties.allOf) }
      } else {
         properties = { ...properties, ...ref.properties }
      }
   }

   return properties
}

function getRequestTree(body: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject | undefined, openapiDocument: IEzmaxDocument | undefined) {
   const requestBody = body as any
   const applicationJsonSchema = UOpenApi.findRefs(requestBody?.content?.['application/json']?.schema, openapiDocument)
   const ref = applicationJsonSchema?.$ref
   return getTree(ref)
}

function getResponseTree(bodyResponses: OpenAPIV3.ResponsesObject | undefined, openapiDocument: IEzmaxDocument | undefined) {
   let tree = []

   const responses = bodyResponses as any

   for (const key in responses) {
      const response = responses[key]
      const applicationJsonSchema = UOpenApi.findRefs(response?.content?.['application/json']?.schema, openapiDocument)
      const ref = applicationJsonSchema?.$ref

      const children = getTree(ref)

      tree.push({
         label: key,
         children: children
      })
   }
   return tree
}

function getParameterTree(bodyParameters: any | undefined, openapiDocument: IEzmaxDocument | undefined) {
   let tree = []

   const parameters = bodyParameters

   for (const key in parameters) {
      const parameter = parameters[key]
      const applicationJsonSchema = UOpenApi.findRefs(parameter, openapiDocument)
      const ref = applicationJsonSchema?.$ref || applicationJsonSchema

      tree.push({
         label: ref?.name,
         ...ref?.schema
      })
   }

   return tree
}

function onCopy() {
   navigator.clipboard.writeText(theOperation.value?.route || 'undefined')
   navigator.clipboard.writeText(theOperation.value?.route || 'undefined')
   quasar.notify({
      message: 'La route a été copié avec succès',
      color: 'positive'
   })
}

function onExpandCollapseTree(treeName: 'path' | 'request' | 'response') {
   switch (treeName) {
      case 'path':
         theExpandCollapseTree.path = !theExpandCollapseTree.path
         if (theExpandCollapseTree.path) thePathTreeRef.value?.expandAll()
         else thePathTreeRef.value?.collapseAll()
         break
      case 'request':
         theExpandCollapseTree.request = !theExpandCollapseTree.request
         if (theExpandCollapseTree.request) theRequestTreeRef.value?.expandAll()
         else theRequestTreeRef.value?.collapseAll()
         break
      case 'response':
         theExpandCollapseTree.response = !theExpandCollapseTree.response
         if (theExpandCollapseTree.response) theResponseTreeRef.value?.expandAll()
         else theResponseTreeRef.value?.collapseAll()
         break
   }
}

let loadTimeout: any

async function load() {
   if (loadTimeout) clearTimeout(loadTimeout)
   loadTimeout = setTimeout(() => {
      setRequestTree()
      setResponseTree()
      setParameterTree()
   }, 100)
}

load()

watch(
   () => theOperation.value,
   () => {
      load()
   },
   {
      deep: true
   }
)

// load()
</script>

<style lang="scss">
// $
@import url('https://fonts.googleapis.com/css2?family=Inconsolata:wght@200;300;400;500;600;700;800;900&display=swap');

.method_get {
   background-color: $green-9;
}
.method_post {
   background: $blue-9;
}
.method_put {
   background: $purple-8;
}
.method_patch {
   background: $orange-10;
}
.method_delete {
   background: $red-10;
}
</style>
