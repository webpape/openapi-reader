<template>
   <q-page padding>
      <div class="text-h5">{{ theOperation?.operation?.summary }}</div>
      <div v-if="theOperation?.method" class="q-pa-sm q-my-md bg-grey-3 rounded-borders" style="font-family: monospace">
         <q-btn class="or-btn-chip" :class="'method_' + theOperation.method" unelevated dense size="sm" text-color="white" square :label="theOperation.method" style="width: 60px" />
         {{ theOperation?.route }}
         {{ theOperation?.route }}
         <q-btn flat square padding="4px 8px" icon="content_copy" size="sm" color="grey-7" class="float-right" @click="onCopy"></q-btn>
      </div>
      <div v-if="theOperation?.operation?.description" class="text-body2 q-mb-md">
         {{ theOperation.operation.description }}
      </div>

      <div v-if="theParameterTree && theParameterTree.length > 0">
         <div class="text-h6 text-uppercase">Path Parameters</div>
         <div class="text-body2">
            <q-tree :nodes="theParameterTree" icon="keyboard_arrow_right" node-key="label" default-expand-all dense>
               <template #default-header="prop">
                  <div class="row items-center">
                     <div style="font-family: Inconsolata" class="text-weight-bold">
                        {{ prop.node.label }}
                     </div>
                     <q-icon v-if="prop.node.required" size="10px" color="negative" name="emergency" style="margin-top: -2px; margin-left: 2px"></q-icon>
                  </div>
                  <div style="font-family: Inconsolata; font-size: 12px" class="row text-light-blue-10 q-ml-sm">
                     <div>{{ prop.node.type }}</div>
                  </div>
               </template>
               <template #default-body="prop">
                  <div v-if="prop.node.enum" style="font-size: 12px; line-height: 16px" class="text-grey-8">ENUM : {{ prop.node.enum.toString().replaceAll(',', ', ') }}</div>
                  <div style="font-size: 12px; line-height: 16px" class="text-grey-7">{{ prop.node.description }}</div>
               </template>
            </q-tree>
         </div>
      </div>

      <div v-if="theRequestTree && theRequestTree.length > 0">
         <div class="text-h6 text-uppercase">Request Body</div>
         <div class="text-body2">
            <q-tree :nodes="theRequestTree" icon="keyboard_arrow_right" node-key="label" default-expand-all dense>
               <template #default-header="prop">
                  <div class="row items-center">
                     <div style="font-family: Inconsolata" class="text-weight-bold">
                        {{ prop.node.label }}
                     </div>
                     <q-icon v-if="prop.node.required" size="10px" color="negative" name="emergency" style="margin-top: -2px; margin-left: 2px"></q-icon>
                  </div>
                  <div style="font-family: Inconsolata; font-size: 12px" class="row text-light-blue-10 q-ml-sm">
                     <div>{{ prop.node.type }}</div>
                  </div>
               </template>
               <template #default-body="prop">
                  <div v-if="prop.node.enum && prop.node.enum.length > 0" style="font-family: monospace" class="items-center row">
                     <q-chip v-for="stringEnum in prop.node.enum" :key="stringEnum" size="12px" dense square text-color="grey-9" style="font-family: monospace; padding: 2px 8px">"{{ stringEnum }}"</q-chip>
                  </div>
               </template>
            </q-tree>
         </div>
      </div>

      <div v-if="theResponseTree && theResponseTree.length > 0" class="q-mt-md">
         <div class="text-h6 text-uppercase">Responses</div>
         <div class="text-body2">
            <q-tree :nodes="theResponseTree" icon="keyboard_arrow_right" node-key="label" default-expand-all dense>
               <template #default-header="prop">
                  <div class="row items-center">
                     <div style="font-family: Inconsolata" class="text-weight-bold">
                        {{ prop.node.label }}
                     </div>
                     <q-icon v-if="prop.node.required" size="10px" color="negative" name="emergency" style="margin-top: -2px; margin-left: 2px"></q-icon>
                  </div>
                  <div style="font-family: Inconsolata; font-size: 12px" class="row text-light-blue-10 q-ml-sm">
                     <div>{{ prop.node.type }}</div>
                  </div>
               </template>
               <template #default-body="prop">
                  <div v-if="prop.node.enum && prop.node.enum.length > 0" style="font-family: monospace" class="items-center row">
                     <q-chip v-for="stringEnum in prop.node.enum" :key="stringEnum" size="12px" dense square text-color="grey-9" style="font-family: monospace; padding: 2px 8px">"{{ stringEnum }}"</q-chip>
                  </div>
               </template>
            </q-tree>
         </div>
      </div>

      <!-- <pre v-if="theOperation" style="font-size: 10px; line-height: 12px">{{ theOperation }}</pre> -->
   </q-page>
</template>

<script setup lang="ts">
import { ref, inject, Ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
// import { QTreeNode } from 'quasar'
import { OpenAPIV3 } from 'openapi-types'
import { UOpenApi } from 'src/utils/openapi'

interface IAdditionnalDocument {
   'x-tagGroups': {
      name: string
      tags: string[]
   }[]
}

type IEzmaxDocument = OpenAPIV3.Document & IAdditionnalDocument

const route = useRoute()
const quasar = useQuasar()

const theOpenapiDocument = inject('theOpenapiDocument') as Ref<IEzmaxDocument | undefined>

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

      if (operation?.detail.get) {
         return {
            method: 'get',
            route: operation.route,
            operation: operation.detail.get
         }
      } else if (operation?.detail.post) {
         return {
            method: 'post',
            route: operation.route,
            operation: operation.detail.post
         }
      } else if (operation?.detail.put) {
         return {
            method: 'put',
            route: operation.route,
            operation: operation.detail.put
         }
      } else if (operation?.detail.patch) {
         return {
            method: 'patch',
            route: operation.route,
            operation: operation.detail.patch
         }
      } else if (operation?.detail.delete) {
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

const theRequestTree = ref<any[]>([])
const theResponseTree = ref<any[]>([])
const theParameterTree = ref<any[]>([])

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

// function fetchOperation(openapiDocument: IEzmaxDocument | undefined) {
//    if (openapiDocument) {
//       console.log(openapiDocument)
//       const paths = Object.keys(openapiDocument.paths).map((obj) => {
//          return {
//             route: obj,
//             detail: openapiDocument?.paths[obj]
//          }
//       }) as { route: string; detail: OpenAPIV3.PathItemObject }[]

//       const operation = paths.find((path) => {
//          if (
//             (path.detail.get && path.detail.get.operationId == route.params.operation) ||
//             (path.detail.post && path.detail.post.operationId == route.params.operation) ||
//             (path.detail.put && path.detail.put.operationId == route.params.operation) ||
//             (path.detail.patch && path.detail.patch.operationId == route.params.operation) ||
//             (path.detail.delete && path.detail.delete.operationId == route.params.operation)
//          ) {
//             return path
//          } else {
//             return undefined
//          }
//       })

//       if (operation?.detail.get) {
//          theOperation.value = {
//             method: 'get',
//             route: operation.route,
//             operation: operation.detail.get
//          }
//       } else if (operation?.detail.post) {
//          theOperation.value = {
//             method: 'post',
//             route: operation.route,
//             operation: operation.detail.post
//          }
//       } else if (operation?.detail.put) {
//          theOperation.value = {
//             method: 'put',
//             route: operation.route,
//             operation: operation.detail.put
//          }
//       } else if (operation?.detail.patch) {
//          theOperation.value = {
//             method: 'patch',
//             route: operation.route,
//             operation: operation.detail.patch
//          }
//       } else if (operation?.detail.delete) {
//          theOperation.value = {
//             method: 'delete',
//             route: operation.route,
//             operation: operation.detail.delete
//          }
//       } else {
//          theOperation.value = {
//             method: '',
//             route: '',
//             operation: undefined
//          }
//       }
//    } else {
//       theOperation.value = {
//          method: '',
//          route: '',
//          operation: undefined
//       }
//    }
//    console.log(2)
// }

function onCopy() {
   navigator.clipboard.writeText(theOperation.value?.route || 'undefined')
   navigator.clipboard.writeText(theOperation.value?.route || 'undefined')
   quasar.notify({
      message: 'La route a été copié avec succès',
      color: 'positive'
   })
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
