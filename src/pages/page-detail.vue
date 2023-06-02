<template>
   <q-page padding>
      <div class="text-h4">{{ theOperation?.operation?.summary }}</div>
      <div v-if="theOperation.method" class="q-pa-sm q-my-md bg-grey-3 rounded-borders" style="font-family: monospace">
         <q-btn class="or-btn-chip" :class="'method_' + theOperation.method" unelevated dense size="sm" text-color="white" square :label="theOperation.method" style="width: 60px" />
         {{ theOperation.route }}
      </div>
      <div class="text-body2">
         {{ theOperation.operation?.description }}
      </div>

      <div v-if="theRequestTree">
         <div class="text-h5">Request</div>
         <div class="text-h6">Body</div>
         <div class="text-body2">
            <pre style="font-size: 10px; line-height: 12px">{{ theRequestTree }}</pre>
            <!-- <q-tree :nodes="simple" node-key="label" :filter="filter" default-expand-all /> -->
         </div>
      </div>

      <pre v-if="theOperation" style="font-size: 10px; line-height: 12px">{{ theOperation }}</pre>
   </q-page>
</template>

<script setup lang="ts">
import { ref, watch, inject, computed } from 'vue'
import { useRoute } from 'vue-router'
import { QTreeNode } from 'quasar'
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

const theOpenapiDocument = ref(inject('theOpenapiDocument') as IEzmaxDocument | undefined)
const theParams = ref(route.params)
const theRequestTree = ref<QTreeNode[]>([])

const theOperation = computed(() => {
   if (theOpenapiDocument.value) {
      const paths = Object.keys(theOpenapiDocument.value.paths).map((obj) => {
         return {
            route: obj,
            detail: theOpenapiDocument.value?.paths[obj]
         }
      }) as { route: string; detail: OpenAPIV3.PathItemObject }[]

      const operation = paths.find((path) => {
         if (
            (path.detail.get && path.detail.get.operationId == theParams.value.operation) ||
            (path.detail.post && path.detail.post.operationId == theParams.value.operation) ||
            (path.detail.put && path.detail.put.operationId == theParams.value.operation) ||
            (path.detail.patch && path.detail.patch.operationId == theParams.value.operation) ||
            (path.detail.delete && path.detail.delete.operationId == theParams.value.operation)
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
      }
      if (operation?.detail.post) {
         return {
            method: 'post',
            route: operation.route,
            operation: operation.detail.post
         }
      }
      if (operation?.detail.put) {
         return {
            method: 'put',
            route: operation.route,
            operation: operation.detail.put
         }
      }
      if (operation?.detail.patch) {
         return {
            method: 'patch',
            route: operation.route,
            operation: operation.detail.patch
         }
      }
      if (operation?.detail.delete) {
         return {
            method: 'delete',
            route: operation.route,
            operation: operation.detail.delete
         }
      }

      return {
         route: '',
         operation: undefined
      }
   } else {
      return {
         route: '',
         operation: undefined
      }
   }
})

function loadRequestTree() {
   const requestBody = theOperation.value.operation?.requestBody as any
   const applicationJsonSchema = UOpenApi.findRefs(requestBody?.content?.['application/json']?.schema, theOpenapiDocument.value)
   const properties = applicationJsonSchema?.properties
   theRequestTree.value = properties
   // if (properties) {
   //    let tree = []
   //    for (const key in properties) {
   //       const value = object[key]
   //       tree.push({
   //          label: key,
   //          children:
   //       })
   //       if (properties.hasOwnProperty(key)) {
   //          const value = object[key]
   //          object[key] = this.findRefs(value, openapiDocument)
   //       }
   //    }
   // }
}

// const theRequestTree = computed(() => {
//    const requestBody = theOperation.value.operation?.requestBody as any
//    const schemaRef = requestBody.content?.['application/json']?.schema?.$ref

//    if (schemaRef) return UOpenApi.findSchema(schemaRef, theOpenapiDocument.value)
//    else return requestBody.content?.['application/json']?.schema
// })

watch(
   () => route.params,
   () => {
      theParams.value = route.params
      loadRequestTree()
   }
)
</script>

<style lang="scss">
// $
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
