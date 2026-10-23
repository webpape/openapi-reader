const WORD = /[^a-z0-9]+/

export function tokenize(query: string) {
   return query
      .toLowerCase()
      .split(/[\s/_-]+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0)
}

function tolerance(token: string) {
   if (token.length <= 3) return 0
   if (token.length <= 6) return 1
   return 2
}

function damerau(left: string, right: string, max: number) {
   if (Math.abs(left.length - right.length) > max) return max + 1
   const cols = right.length + 1
   let previousPrevious = [] as number[]
   let previous = Array.from({ length: cols }, (_, index) => index)
   for (let i = 1; i <= left.length; i++) {
      const current = [i]
      let best = current[0]
      for (let j = 1; j < cols; j++) {
         const cost = left[i - 1] === right[j - 1] ? 0 : 1
         let value = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost)
         if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) value = Math.min(value, previousPrevious[j - 2] + 1)
         current[j] = value
         if (value < best) best = value
      }
      if (best > max) return max + 1
      previousPrevious = previous
      previous = current
   }
   return previous[cols - 1]
}

export function queryScore(haystack: string, query: string) {
   const tokens = tokenize(query)
   if (!tokens.length) return 1
   const text = haystack.toLowerCase()
   const words = text.split(WORD).filter((word) => word.length > 1)
   let score = 0
   for (const token of tokens) {
      if (text.includes(token)) {
         score += token.length >= 5 ? 12 : 8
         continue
      }
      const maxDist = tolerance(token)
      if (!maxDist) return 0
      let best = maxDist + 1
      for (const word of words) {
         if (Math.abs(word.length - token.length) > maxDist) continue
         const distance = damerau(word, token, maxDist)
         if (distance < best) best = distance
         if (best === 0) break
      }
      if (best > maxDist) return 0
      score += 5 - best
   }
   return score
}
