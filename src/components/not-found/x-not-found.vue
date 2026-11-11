<template>
   <div class="not-found-card">
      <div class="nf-visual">
         <!-- Robot / Satellite explorer searching for the missing route -->
         <svg class="nf-illustration" :class="{ scanning: isScanning }" viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <!-- Radar scan waves -->
            <circle cx="160" cy="90" r="70" class="nf-wave nf-wave-1" stroke="currentColor" stroke-dasharray="4 6" />
            <circle cx="160" cy="90" r="50" class="nf-wave nf-wave-2" stroke="currentColor" stroke-dasharray="3 5" />
            <circle cx="160" cy="90" r="30" class="nf-wave nf-wave-3" stroke="currentColor" />

            <!-- Radar beam -->
            <line x1="160" y1="90" x2="230" y2="40" class="nf-radar-beam" stroke="currentColor" stroke-width="2" stroke-linecap="round" />

            <!-- Floating Robot / Satellite -->
            <g class="nf-satellite">
               <rect x="145" y="78" width="30" height="24" rx="6" class="nf-sat-body" />
               <line x1="133" y1="90" x2="145" y2="90" stroke="currentColor" stroke-width="2.5" />
               <line x1="175" y1="90" x2="187" y2="90" stroke="currentColor" stroke-width="2.5" />
               <!-- Solar wings -->
               <rect x="120" y="82" width="13" height="16" rx="2" class="nf-sat-panel" />
               <rect x="187" y="82" width="13" height="16" rx="2" class="nf-sat-panel" />
               <!-- Blinking antenna -->
               <line x1="160" y1="78" x2="160" y2="66" stroke="currentColor" stroke-width="2" />
               <circle cx="160" cy="64" r="3.5" class="nf-sat-beacon" />
               <!-- Robot eye sensors -->
               <circle cx="154" cy="88" r="2.5" class="nf-sat-eye" />
               <circle cx="166" cy="88" r="2.5" class="nf-sat-eye" />
            </g>

            <!-- Background space dust -->
            <circle cx="40" cy="30" r="1.5" class="nf-star nf-star-1" fill="currentColor" />
            <circle cx="280" cy="45" r="1.5" class="nf-star nf-star-2" fill="currentColor" />
            <circle cx="260" cy="140" r="1" class="nf-star nf-star-3" fill="currentColor" />
            <circle cx="65" cy="135" r="1.2" class="nf-star nf-star-4" fill="currentColor" />
            <circle cx="105" cy="40" r="1" class="nf-star nf-star-1" fill="currentColor" />
         </svg>

         <div class="nf-huge-code">404</div>
      </div>

      <h1 class="nf-title">Houston, this route does not exist.</h1>

      <p class="nf-subtitle">
         We searched the entire specification, but this requested route was nowhere to be found.
      </p>

      <!-- Satellite Scanner Console -->
      <div class="nf-console">
         <div class="nf-console-header">
            <span class="nf-console-title">SATELLITE ROUTE SCANNER</span>
            <span class="nf-console-status" :class="{ scanning: isScanning, locked: scanResult?.found, idle: !isScanning && !scanResult }">
               <span class="nf-console-led"></span>
               {{ consoleStatusText }}
            </span>
         </div>

         <div class="nf-console-body">
            <!-- Round outline radar scan button -->
            <button
               type="button"
               class="nf-radar-btn"
               :class="{ scanning: isScanning, locked: scanResult?.found }"
               :disabled="isScanning"
               title="Scan spectrum for matching routes"
               aria-label="Scan spectrum for matching routes"
               @click="scanForNearestRoute"
            >
               <svg class="nf-btn-ring" viewBox="0 0 100 100" fill="none" aria-hidden="true">
                  <circle cx="50" cy="50" r="44" class="nf-ring-outer" stroke="currentColor" stroke-dasharray="6 4" stroke-width="1.6" />
                  <circle cx="50" cy="50" r="35" class="nf-ring-inner" stroke="currentColor" stroke-width="1.2" />
                  <line x1="50" y1="4" x2="50" y2="15" stroke="currentColor" stroke-width="2" />
                  <line x1="50" y1="85" x2="50" y2="96" stroke="currentColor" stroke-width="2" />
                  <line x1="4" y1="50" x2="15" y2="50" stroke="currentColor" stroke-width="2" />
                  <line x1="85" y1="50" x2="96" y2="50" stroke="currentColor" stroke-width="2" />
               </svg>
               <div class="nf-radar-content">
                  <i v-if="isScanning" class="pi pi-spin pi-spinner nf-radar-spinner"></i>
                  <span class="nf-radar-label">SCAN</span>
               </div>
            </button>

            <!-- Telemetry screen -->
            <div class="nf-telemetry">
               <div class="nf-telemetry-screen">
                  <div class="nf-telemetry-line primary">
                     <span class="nf-prompt">&gt;</span>
                     <span class="nf-stream-text">{{ telemetryMessage }}</span>
                  </div>
                  <div class="nf-telemetry-line secondary">
                     <span class="nf-meta-chip">BAND: {{ currentBranchLabel.toUpperCase() }}</span>
                     <span v-if="isScanning" class="nf-telemetry-progress">ANALYZING SPECTRUM [{{ scanProgress }}%]</span>
                     <span v-else-if="scanResult?.found && autoRedirectCountdown > 0" class="nf-telemetry-progress success">
                        AUTO-BEAMING [{{ autoRedirectCountdown }}S]
                     </span>
                     <span v-else-if="scanResult?.found" class="nf-telemetry-progress success">
                        TARGET LOCKED ({{ scanResult.proposals?.length || 0 }} FOUND)
                     </span>
                     <span v-else class="nf-telemetry-progress idle">STANDBY · READY</span>
                  </div>
               </div>
            </div>
         </div>

         <!-- Proposed Signals / Routes -->
         <div v-if="scanResult?.proposals?.length" class="nf-proposals">
            <div class="nf-proposals-head">
               <span class="nf-proposals-title">
                  IDENTIFIED SIGNALS ({{ scanResult.proposals.length }})
               </span>
               <div v-if="autoRedirectCountdown > 0" class="nf-autobeam-box">
                  <span class="nf-autobeam-text">Beaming in {{ autoRedirectCountdown }}s</span>
                  <button type="button" class="nf-pause-btn" @click="pauseAutoRedirect">Pause</button>
               </div>
            </div>

            <div class="nf-proposals-list">
               <button
                  v-for="(candidate, idx) in scanResult.proposals"
                  :key="idx"
                  type="button"
                  class="nf-proposal-item"
                  :class="{ 'is-top': idx === 0 && candidate.score >= 0.85 }"
                  @click="navigateTo(candidate)"
               >
                  <div class="nf-proposal-meta">
                     <span class="nf-badge match-pill">{{ candidate.matchPercent }}% MATCH</span>
                     <span v-if="candidate.type === 'tag'" class="nf-badge tag">TAG</span>
                     <span v-else class="nf-badge method" :class="'m-' + candidate.method?.toLowerCase()">
                        {{ candidate.method }}
                     </span>
                  </div>

                  <div class="nf-proposal-body">
                     <div class="nf-proposal-title">
                        <span class="nf-prop-name">{{ candidate.title }}</span>
                        <span v-if="candidate.tag && candidate.type !== 'tag'" class="nf-prop-parent">in {{ candidate.tag }}</span>
                     </div>
                     <div class="nf-proposal-route">{{ candidate.route }}</div>
                  </div>

                  <div class="nf-proposal-action">
                     <span class="nf-beam-pill" :class="{ highlight: idx === 0 && candidate.score >= 0.85 }">
                        Beam
                        <i class="pi pi-arrow-right"></i>
                     </span>
                  </div>
               </button>
            </div>
         </div>
      </div>

      <!-- Navigation actions -->
      <div class="nf-actions">
         <Button
            label="Back to home"
            size="small"
            as="router-link"
            to="/"
         />
         <Button
            label="Go back"
            severity="secondary"
            size="small"
            @click="goBack"
         />
         <Button
            label="View changelog"
            text
            size="small"
            as="router-link"
            to="/changelog"
         />
      </div>
   </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import { SPEC_BRANCH_STORAGE_KEY } from 'src/utils/specs'
import { useOpenApi } from 'src/composables/use-openapi'
import { buildNav } from 'src/utils/nav'
import { formatTag } from 'src/utils/openapi'

const props = defineProps<{
   missing?: string
}>()

const router = useRouter()
const route = useRoute()
const { document } = useOpenApi()

const isScanning = ref(false)
const scanProgress = ref(0)
const scanningLog = ref('')
const autoRedirectCountdown = ref(0)

interface Candidate {
   type: 'tag' | 'operation'
   rawId: string
   method?: string
   route: string
   title: string
   tag?: string
   score: number
   matchPercent: number
   to: { name: string; params: Record<string, string> }
}

const scanResult = ref<{
   found: boolean
   proposals?: Candidate[]
   message?: string
} | null>(null)

let countdownTimer: ReturnType<typeof setInterval> | null = null
let scanTimer: ReturnType<typeof setInterval> | null = null

onUnmounted(() => {
   if (countdownTimer) clearInterval(countdownTimer)
   if (scanTimer) clearInterval(scanTimer)
})

const currentBranchLabel = computed(() => {
   const saved = sessionStorage.getItem(SPEC_BRANCH_STORAGE_KEY)
   return saved === 'develop' ? 'Develop' : 'Master'
})

const consoleStatusText = computed(() => {
   if (isScanning.value) return 'SCANNING SPECTRUM'
   if (scanResult.value?.found) return 'TARGET LOCKED'
   if (scanResult.value && !scanResult.value.found) return 'NO SIGNAL'
   return 'RADAR STANDBY'
})

const telemetryMessage = computed(() => {
   if (isScanning.value) return scanningLog.value || 'Searching routes…'
   if (scanResult.value?.found && scanResult.value.proposals?.length) {
      const top = scanResult.value.proposals[0]
      if (autoRedirectCountdown.value > 0) {
         return `Signal locked: ${top.title} · Auto-beaming in ${autoRedirectCountdown.value}s…`
      }
      return `Signals identified: ${top.title} (${scanResult.value.proposals.length} routes found)`
   }
   if (scanResult.value && !scanResult.value.found) {
      return 'No matching frequency detected for this route'
   }
   return 'Click the radar scanner to search for matching routes'
})

function goBack() {
   if (window.history.length > 1) {
      router.back()
   } else {
      router.push('/')
   }
}

function pauseAutoRedirect() {
   if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
   }
   autoRedirectCountdown.value = 0
}

function navigateTo(candidate: Candidate) {
   pauseAutoRedirect()
   router.push(candidate.to)
}

function levenshtein(a: string, b: string): number {
   const s1 = a.toLowerCase()
   const s2 = b.toLowerCase()
   const matrix: number[][] = []
   for (let i = 0; i <= s2.length; i++) matrix[i] = [i]
   for (let j = 0; j <= s1.length; j++) matrix[0][j] = j
   for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
         if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1]
         } else {
            matrix[i][j] = Math.min(
               matrix[i - 1][j - 1] + 1,
               matrix[i][j - 1] + 1,
               matrix[i - 1][j] + 1
            )
         }
      }
   }
   return matrix[s2.length][s1.length]
}

function lcsLen(a: string, b: string): number {
   const s1 = a.toLowerCase()
   const s2 = b.toLowerCase()
   const dp = Array.from({ length: s1.length + 1 }, () => new Uint16Array(s2.length + 1))
   for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
         if (s1[i - 1] === s2[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1] + 1
         } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
         }
      }
   }
   return dp[s1.length][s2.length]
}

function collapseRepeats(s: string): string {
   return s.replace(/(.)\1{2,}/g, '$1')
}

function tokenize(str: string): string[] {
   return str
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .split(/[^a-zA-Z0-9]+/)
      .map((s) => s.toLowerCase().trim())
      .filter((s) => s.length > 1)
}

function computeSimilarity(query: string, target: string): number {
   const q = query.toLowerCase().trim()
   const t = target.toLowerCase().trim()
   if (!q || !t) return 0
   if (q === t) return 1.0

   let maxScore = 0

   // Substring & prefix checks
   if (t.includes(q)) {
      maxScore = Math.max(maxScore, 0.78 + 0.22 * (q.length / t.length))
   }
   if (q.includes(t)) {
      maxScore = Math.max(maxScore, 0.72 + 0.28 * (t.length / q.length))
   }

   // Dedup repeated letters (e.g. cueeeeeeeestomer -> cuestomer)
   const qDedup = collapseRepeats(q)
   const tDedup = collapseRepeats(t)
   if (tDedup.includes(qDedup)) {
      maxScore = Math.max(maxScore, 0.78 + 0.22 * (qDedup.length / tDedup.length))
   }
   if (qDedup.includes(tDedup)) {
      maxScore = Math.max(maxScore, 0.72 + 0.28 * (tDedup.length / qDedup.length))
   }

   // Levenshtein on deduped strings
   const levDist = levenshtein(qDedup, tDedup)
   const maxL = Math.max(qDedup.length, tDedup.length)
   maxScore = Math.max(maxScore, Math.max(0, 1 - levDist / maxL))

   // LCS ratio (Dice formula)
   const lcs = lcsLen(q, t)
   const lcsSim = (2 * lcs) / (q.length + t.length)
   maxScore = Math.max(maxScore, lcsSim)

   // Token matching (splitting camelCase, underscores, hyphens)
   const qTokens = tokenize(query)
   const tTokens = tokenize(target)
   if (qTokens.length > 0 && tTokens.length > 0) {
      let matchedSum = 0
      for (const qt of qTokens) {
         let bestTok = 0
         for (const tt of tTokens) {
            if (qt === tt) {
               bestTok = 1.0
               break
            }
            if (tt.includes(qt) || qt.includes(tt)) {
               bestTok = Math.max(bestTok, 0.88)
            } else {
               const d = levenshtein(collapseRepeats(qt), collapseRepeats(tt))
               const mLen = Math.max(qt.length, tt.length)
               bestTok = Math.max(bestTok, Math.max(0, 1 - d / mLen))
            }
         }
         matchedSum += bestTok
      }
      maxScore = Math.max(maxScore, matchedSum / qTokens.length)
   }

   return maxScore
}

function extractQueryTerms(missingProp?: string): string[] {
   const terms = new Set<string>()
   const addClean = (val?: string | null) => {
      if (!val) return
      let clean = String(val).trim()
      clean = clean.replace(/^[#/]+/, '').split('?')[0]
      if (clean.length >= 2) terms.add(clean)

      const segments = clean.split('/').map((s) => s.trim()).filter(Boolean)
      for (const seg of segments) {
         if (seg.length >= 2 && !['object', 'page-details', 'details', 'webhook'].includes(seg.toLowerCase())) {
            terms.add(seg)
         }
      }
   }

   addClean(missingProp)
   addClean(route.fullPath)
   if (typeof route.params.object === 'string') addClean(route.params.object)
   if (typeof route.params.operation === 'string') addClean(route.params.operation)
   if (typeof route.params.name === 'string') addClean(route.params.name)

   return Array.from(terms)
}

function getCandidatePool(): Candidate[] {
   if (!document.value) return []
   const nav = buildNav(document.value)
   const candidates: Candidate[] = []

   // 1. Tags
   for (const tag of Object.keys(nav.byTag)) {
      candidates.push({
         type: 'tag',
         rawId: tag,
         route: `Tag · ${nav.byTag[tag].length} operations`,
         title: formatTag(tag),
         score: 0,
         matchPercent: 0,
         to: { name: 'page-details', params: { object: tag } }
      })
   }

   // 2. Operations
   for (const [tag, ops] of Object.entries(nav.byTag)) {
      for (const op of ops) {
         candidates.push({
            type: 'operation',
            rawId: op.operationId,
            method: op.method.toUpperCase(),
            route: op.route,
            title: op.summary || op.operationId,
            tag,
            score: 0,
            matchPercent: 0,
            to: { name: 'page-details', params: { object: tag, operation: op.operationId } }
         })
      }
   }

   return candidates
}

function findMatchingCandidates(queryTerms: string[]): Candidate[] {
   if (!document.value || !queryTerms.length) return []
   const pool = getCandidatePool()

   for (const candidate of pool) {
      let maxScore = 0

      for (const query of queryTerms) {
         // Evaluate against raw ID
         const sId = computeSimilarity(query, candidate.rawId)
         // Evaluate against formatted title
         const sTitle = computeSimilarity(query, candidate.title)
         // Evaluate against route or tag
         const sRoute = candidate.type === 'operation' ? computeSimilarity(query, candidate.route) : 0
         const sTag = candidate.tag ? computeSimilarity(query, candidate.tag) : 0

         let score = Math.max(sId, sTitle, sRoute, sTag)

         // If candidate is a tag and has strong match, slight boost for tag overview
         if (candidate.type === 'tag' && score > 0.7) {
            score = Math.min(1.0, score + 0.03)
         }

         if (score > maxScore) {
            maxScore = score
         }
      }

      candidate.score = maxScore
      candidate.matchPercent = Math.round(maxScore * 100)
   }

   // Filter candidates above minimal similarity threshold (40%)
   const matches = pool.filter((c) => c.score >= 0.40)
   matches.sort((a, b) => b.score - a.score)

   // Return top 4 unique proposals
   const seen = new Set<string>()
   const topProposals: Candidate[] = []
   for (const m of matches) {
      const key = `${m.type}:${m.rawId}`
      if (!seen.has(key)) {
         seen.add(key)
         topProposals.push(m)
         if (topProposals.length >= 4) break
      }
   }

   return topProposals
}

async function scanForNearestRoute() {
   if (isScanning.value) return
   pauseAutoRedirect()
   isScanning.value = true
   scanResult.value = null
   scanProgress.value = 0

   const pool = getCandidatePool()
   const sampleLabels = pool.map((c) => (c.type === 'tag' ? `Tag: ${c.title}` : `${c.method} ${c.route}`))
   const duration = 1600
   const startTime = Date.now()

   // Telemetry live stream simulation
   scanTimer = setInterval(() => {
      const elapsed = Date.now() - startTime
      scanProgress.value = Math.min(95, Math.round((elapsed / duration) * 100))
      if (sampleLabels.length) {
         const randomItem = sampleLabels[Math.floor(Math.random() * sampleLabels.length)]
         scanningLog.value = `SCANNING SPECTRUM > ${randomItem}`
      }
   }, 60)

   await new Promise((resolve) => setTimeout(resolve, duration))
   if (scanTimer) {
      clearInterval(scanTimer)
      scanTimer = null
   }
   scanProgress.value = 100

   const queryTerms = extractQueryTerms(props.missing)
   const proposals = findMatchingCandidates(queryTerms)

   if (proposals.length > 0) {
      const top = proposals[0]
      scanningLog.value = `TARGET LOCKED > ${top.title} [${top.matchPercent}%]`
      scanResult.value = {
         found: true,
         proposals
      }

      // If top match is high confidence (>= 85%), offer auto-redirect with countdown
      if (top.score >= 0.85) {
         autoRedirectCountdown.value = 10
         countdownTimer = setInterval(() => {
            if (autoRedirectCountdown.value <= 1) {
               pauseAutoRedirect()
               navigateTo(top)
            } else {
               autoRedirectCountdown.value -= 1
            }
         }, 1000)
      }
   } else {
      scanningLog.value = 'SPECTRUM EMPTY > No matching route detected'
      scanResult.value = {
         found: false,
         proposals: []
      }
   }

   isScanning.value = false
}
</script>

<style scoped>
.not-found-card {
   max-width: 660px;
   margin: 16px auto;
   padding: 24px 24px 34px;
   text-align: center;
   display: flex;
   flex-direction: column;
   align-items: center;
   background: var(--or-card-bg);
   border: 1px solid var(--or-line);
   border-radius: 12px;
}

.nf-visual {
   position: relative;
   width: 100%;
   display: flex;
   flex-direction: column;
   align-items: center;
   margin-bottom: 2px;
}

.nf-illustration {
   width: 100%;
   max-width: 210px;
   height: auto;
   color: var(--p-primary-color);
   opacity: 0.85;
   margin: 0 0 -10px;
   transition: opacity 0.3s;
}

.nf-wave {
   opacity: 0.28;
   transform-origin: 160px 90px;
}
.nf-wave-1 {
   animation: rotateRadar 12s linear infinite;
}
.nf-wave-2 {
   animation: rotateRadar 8s linear infinite reverse;
}

.nf-radar-beam {
   opacity: 0.45;
   transform-origin: 160px 90px;
   animation: rotateRadar 4s linear infinite;
}

.nf-satellite {
   animation: floatSat 4s ease-in-out infinite;
   transform-origin: 160px 90px;
}
.nf-sat-body {
   fill: var(--or-card-bg);
   stroke: currentColor;
   stroke-width: 2;
}
.nf-sat-panel {
   fill: color-mix(in srgb, var(--p-primary-color) 22%, transparent);
   stroke: currentColor;
   stroke-width: 1.5;
}
.nf-sat-beacon {
   fill: #ef4444;
   animation: beaconBlink 1s infinite;
}
.nf-sat-eye {
   fill: var(--p-primary-color);
}

/* Scanning active state on satellite */
.nf-illustration.scanning .nf-radar-beam {
   animation: rotateRadar 0.7s linear infinite;
   opacity: 0.95;
   stroke-width: 2.5;
}
.nf-illustration.scanning .nf-wave-1 {
   animation: rotateRadar 1.4s linear infinite;
   opacity: 0.65;
}
.nf-illustration.scanning .nf-sat-beacon {
   animation: beaconBlink 0.2s infinite;
}

.nf-star {
   opacity: 0.4;
   animation: twinkle 3s infinite ease-in-out alternate;
}
.nf-star-2 {
   animation-delay: 1s;
}
.nf-star-3 {
   animation-delay: 1.8s;
}
.nf-star-4 {
   animation-delay: 2.4s;
}

.nf-huge-code {
   font-family: 'JetBrains Mono', ui-monospace, monospace;
   font-size: 72px;
   font-weight: 900;
   line-height: 0.95;
   letter-spacing: -0.04em;
   background: linear-gradient(135deg, var(--p-primary-color), #818cf8 60%, #ec4899);
   -webkit-background-clip: text;
   -webkit-text-fill-color: transparent;
   user-select: none;
   margin-top: 2px;
}

.nf-title {
   margin: 6px 0 8px;
   font-size: 21px;
   font-weight: 800;
   color: var(--or-text);
   line-height: 1.25;
}

.nf-subtitle {
   margin: 0 0 24px;
   font-size: 14px;
   line-height: 1.5;
   color: var(--p-text-muted-color);
   max-width: 500px;
}

/* Satellite Scanner Console */
.nf-console {
   width: 100%;
   max-width: 540px;
   margin: 0 0 18px;
   border: 1px solid var(--or-line);
   border-radius: 10px;
   background: var(--p-content-background);
   overflow: hidden;
   display: flex;
   flex-direction: column;
   text-align: left;
}

.nf-console-header {
   display: flex;
   align-items: center;
   justify-content: space-between;
   padding: 6px 12px;
   background: color-mix(in srgb, var(--p-text-color) 4%, transparent);
   border-bottom: 1px solid var(--or-line);
   font-family: 'JetBrains Mono', ui-monospace, monospace;
   font-size: 11px;
   letter-spacing: 0.05em;
}

.nf-console-title {
   font-weight: 700;
   color: var(--p-text-muted-color);
}

.nf-console-status {
   display: inline-flex;
   align-items: center;
   gap: 6px;
   font-weight: 700;
   font-size: 10.5px;
   color: var(--p-text-muted-color);
}

.nf-console-led {
   width: 6px;
   height: 6px;
   border-radius: 50%;
   background: var(--p-text-muted-color);
}

.nf-console-status.idle .nf-console-led {
   background: #38bdf8;
   box-shadow: 0 0 4px #38bdf8;
}

.nf-console-status.scanning {
   color: #eab308;
}
.nf-console-status.scanning .nf-console-led {
   background: #eab308;
   box-shadow: 0 0 6px #eab308;
   animation: pulse 0.8s infinite;
}

.nf-console-status.locked {
   color: #22c55e;
}
.nf-console-status.locked .nf-console-led {
   background: #22c55e;
   box-shadow: 0 0 6px #22c55e;
}

.nf-console-body {
   display: flex;
   align-items: center;
   gap: 14px;
   padding: 12px 14px;
}

/* Circular Outline Radar Button */
.nf-radar-btn {
   position: relative;
   width: 72px;
   height: 72px;
   flex: none;
   border-radius: 50%;
   border: none;
   background: transparent;
   color: var(--p-primary-color);
   cursor: pointer;
   display: grid;
   place-items: center;
   padding: 0;
   transition: transform 0.2s, color 0.2s;
   outline: none;
}

.nf-radar-btn:hover:not(:disabled) {
   transform: scale(1.08);
   color: var(--p-primary-hover-color, #4f647a);
}

.nf-radar-btn:active:not(:disabled) {
   transform: scale(0.96);
}

.nf-btn-ring {
   position: absolute;
   inset: 0;
   width: 100%;
   height: 100%;
   transform-origin: center;
   transition: transform 0.3s;
}

.nf-radar-btn:hover:not(:disabled) .nf-btn-ring {
   animation: rotateRadar 10s linear infinite;
}

.nf-radar-btn.scanning .nf-btn-ring {
   animation: rotateRadar 1.2s linear infinite;
   color: #eab308;
}

.nf-radar-btn.locked .nf-btn-ring {
   color: #22c55e;
}

.nf-radar-content {
   position: relative;
   z-index: 2;
   display: flex;
   flex-direction: column;
   align-items: center;
   justify-content: center;
   gap: 2px;
}

.nf-radar-spinner {
   font-size: 13px;
   margin-bottom: 2px;
}

.nf-radar-label {
   font-family: 'JetBrains Mono', ui-monospace, monospace;
   font-size: 13px;
   font-weight: 800;
   letter-spacing: 0.1em;
   color: var(--p-primary-color);
   transition: color 0.2s;
}

/* Color shifting ONLY on the word SCAN (no scale, no shadow) */
.nf-radar-btn:not(.scanning):not(.locked) .nf-radar-label {
   animation: scanWordColorChange 3s ease-in-out infinite;
}

.nf-radar-btn:hover:not(:disabled) .nf-radar-label {
   animation-play-state: paused;
}

@keyframes scanWordColorChange {
   0%, 100% {
      color: var(--p-primary-color);
   }
   35% {
      color: #0284c7;
   }
   70% {
      color: #6366f1;
   }
}

/* Telemetry Screen */
.nf-telemetry {
   flex: 1;
   min-width: 0;
}

.nf-telemetry-screen {
   display: flex;
   flex-direction: column;
   gap: 6px;
   padding: 8px 10px;
   border-radius: 6px;
   background: color-mix(in srgb, var(--p-text-color) 4%, transparent);
   border: 1px solid var(--or-line);
   font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.nf-telemetry-line.primary {
   display: flex;
   align-items: center;
   gap: 6px;
   font-size: 12px;
   font-weight: 600;
   color: var(--or-text);
   min-height: 20px;
}

.nf-prompt {
   color: var(--p-primary-color);
   font-weight: 800;
   flex: none;
}

.nf-stream-text {
   overflow: hidden;
   text-overflow: ellipsis;
   white-space: nowrap;
}

.nf-telemetry-line.secondary {
   display: flex;
   align-items: center;
   justify-content: space-between;
   gap: 8px;
   font-size: 10px;
   color: var(--p-text-muted-color);
   flex-wrap: wrap;
}

.nf-meta-chip {
   letter-spacing: 0.05em;
   opacity: 0.8;
}

.nf-telemetry-progress {
   font-weight: 700;
   letter-spacing: 0.04em;
}

.nf-telemetry-progress.success {
   color: #22c55e;
}

.nf-telemetry-progress.idle {
   opacity: 0.7;
}

/* Proposals section */
.nf-proposals {
   border-top: 1px solid var(--or-line);
   background: color-mix(in srgb, var(--p-text-color) 2%, transparent);
   display: flex;
   flex-direction: column;
}

.nf-proposals-head {
   display: flex;
   align-items: center;
   justify-content: space-between;
   padding: 7px 12px;
   background: color-mix(in srgb, var(--p-text-color) 3%, transparent);
   border-bottom: 1px solid var(--or-line);
   font-family: 'JetBrains Mono', ui-monospace, monospace;
   font-size: 10.5px;
}

.nf-proposals-title {
   display: inline-flex;
   align-items: center;
   gap: 6px;
   font-weight: 700;
   color: var(--p-text-muted-color);
   letter-spacing: 0.04em;
}

.nf-autobeam-box {
   display: inline-flex;
   align-items: center;
   gap: 6px;
}

.nf-autobeam-text {
   color: #22c55e;
   font-weight: 700;
   font-size: 10.5px;
}

.nf-pause-btn {
   background: transparent;
   border: 1px solid var(--or-line);
   border-radius: 4px;
   color: var(--or-text);
   font-size: 10px;
   font-weight: 600;
   padding: 1px 6px;
   cursor: pointer;
   text-decoration: none !important;
}

.nf-pause-btn:hover {
   background: color-mix(in srgb, var(--p-text-color) 8%, transparent);
}

.nf-proposals-list {
   display: flex;
   flex-direction: column;
   padding: 6px 8px;
   gap: 6px;
}

.nf-proposal-item {
   display: flex;
   align-items: center;
   justify-content: space-between;
   gap: 10px;
   padding: 8px 10px;
   border: 1px solid var(--or-line);
   border-radius: 8px;
   background: var(--or-card-bg);
   cursor: pointer;
   text-align: left;
   transition: border-color 0.15s, background-color 0.15s, transform 0.15s;
   text-decoration: none !important;
   outline: none;
}

.nf-proposal-item:hover {
   border-color: var(--p-primary-color);
   background: color-mix(in srgb, var(--p-primary-color) 6%, var(--or-card-bg));
   transform: translateX(2px);
}

.nf-proposal-item.is-top {
   border-color: color-mix(in srgb, #22c55e 50%, var(--or-line));
   box-shadow: 0 0 0 1px color-mix(in srgb, #22c55e 20%, transparent);
}

.nf-proposal-meta {
   display: flex;
   align-items: center;
   gap: 6px;
   flex: none;
}

.nf-badge {
   display: inline-flex;
   align-items: center;
   justify-content: center;
   font-family: 'JetBrains Mono', ui-monospace, monospace;
   font-size: 9.5px;
   font-weight: 800;
   padding: 2px 5px;
   border-radius: 4px;
   line-height: 1.2;
   letter-spacing: 0.04em;
   text-transform: uppercase;
}

.nf-badge.tag {
   background: color-mix(in srgb, #8b5cf6 18%, transparent);
   color: #8b5cf6;
   border: 1px solid color-mix(in srgb, #8b5cf6 30%, transparent);
}

.nf-badge.method.m-get {
   background: var(--or-get-bg);
   color: var(--or-get-fg);
}
.nf-badge.method.m-post {
   background: var(--or-post-bg);
   color: var(--or-post-fg);
}
.nf-badge.method.m-put {
   background: var(--or-put-bg);
   color: var(--or-put-fg);
}
.nf-badge.method.m-patch {
   background: var(--or-patch-bg);
   color: var(--or-patch-fg);
}
.nf-badge.method.m-delete {
   background: var(--or-delete-bg);
   color: var(--or-delete-fg);
}

.nf-badge.match-pill {
   background: color-mix(in srgb, #22c55e 12%, transparent);
   color: #22c55e;
   font-size: 9px;
   font-weight: 700;
   border: 1px solid color-mix(in srgb, #22c55e 25%, transparent);
   min-width: 66px;
   text-align: center;
   justify-content: center;
}

.nf-proposal-body {
   flex: 1;
   min-width: 0;
   display: flex;
   flex-direction: column;
   gap: 2px;
}

.nf-proposal-title {
   display: flex;
   align-items: center;
   gap: 6px;
   font-size: 12.5px;
   font-weight: 700;
   color: var(--or-text);
   line-height: 1.3;
   overflow: hidden;
}

.nf-prop-name {
   overflow: hidden;
   text-overflow: ellipsis;
   white-space: nowrap;
}

.nf-prop-parent {
   font-size: 11px;
   font-weight: 500;
   color: var(--p-text-muted-color);
   flex: none;
}

.nf-proposal-route {
   font-family: 'JetBrains Mono', ui-monospace, monospace;
   font-size: 11px;
   color: var(--p-text-muted-color);
   overflow: hidden;
   text-overflow: ellipsis;
   white-space: nowrap;
}

.nf-proposal-action {
   flex: none;
}

.nf-beam-pill {
   display: inline-flex;
   align-items: center;
   gap: 5px;
   font-family: 'JetBrains Mono', ui-monospace, monospace;
   font-size: 11px;
   font-weight: 700;
   letter-spacing: 0.04em;
   padding: 4px 10px;
   border-radius: 6px;
   background: transparent;
   color: var(--p-primary-color);
   border: 1px solid color-mix(in srgb, var(--p-primary-color) 50%, var(--or-line));
   transition: background 0.15s, border-color 0.15s, color 0.15s;
   text-decoration: none !important;
}

.nf-beam-pill.highlight {
   border-color: var(--p-primary-color);
   background: color-mix(in srgb, var(--p-primary-color) 10%, transparent);
   box-shadow: 0 0 0 1px color-mix(in srgb, var(--p-primary-color) 25%, transparent);
}

.nf-proposal-item:hover .nf-beam-pill {
   background: color-mix(in srgb, var(--p-primary-color) 18%, transparent);
   border-color: var(--p-primary-color);
   color: var(--p-primary-color);
}

/* Navigation actions */
.nf-actions {
   display: flex;
   align-items: center;
   justify-content: center;
   gap: 8px;
   flex-wrap: wrap;
}

.nf-actions :deep(.p-button),
.nf-actions :deep(a),
.nf-actions a {
   text-decoration: none !important;
}

.nf-actions :deep(.p-button:hover),
.nf-actions :deep(a:hover),
.nf-actions a:hover {
   text-decoration: none !important;
}

@keyframes rotateRadar {
   from { transform: rotate(0deg); }
   to { transform: rotate(360deg); }
}

@keyframes floatSat {
   0%, 100% { transform: translateY(0px) rotate(0deg); }
   50% { transform: translateY(-5px) rotate(-2.5deg); }
}

@keyframes beaconBlink {
   0%, 100% { opacity: 1; filter: drop-shadow(0 0 3px #ef4444); }
   50% { opacity: 0.25; filter: none; }
}

@keyframes twinkle {
   0% { opacity: 0.2; transform: scale(0.8); }
   100% { opacity: 0.85; transform: scale(1.2); }
}

@keyframes pulse {
   0%, 100% { transform: scale(1); opacity: 1; }
   50% { transform: scale(1.3); opacity: 0.5; }
}

@media (max-width: 600px) {
   .not-found-card {
      margin: 12px 8px;
      padding: 20px 14px 28px;
   }
   .nf-huge-code {
      font-size: 58px;
   }
   .nf-title {
      font-size: 19px;
   }
   .nf-console-body {
      flex-direction: column;
      align-items: center;
      text-align: center;
   }
   .nf-telemetry {
      width: 100%;
   }
   .nf-proposal-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
   }
   .nf-proposal-action {
      align-self: flex-end;
   }
   .nf-actions {
      flex-direction: column;
      width: 100%;
   }
   .nf-actions :deep(.p-button) {
      width: 100%;
   }
}
</style>
