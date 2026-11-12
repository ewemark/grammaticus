/**
 * Lightweight English lemmatizer — maps inflected forms back to likely base words.
 * Pure functions, unit-tested in lemmatize.test.ts.
 *
 * Strategy: irregular tables first (highest confidence), then suffix rules.
 * Returns candidate base forms; callers query the DB with each candidate.
 */

/* ── Irregular verbs: inflected → base ─────────────────────── */
const IRREGULAR_VERBS: Record<string, string> = {
  // be
  am: 'be', is: 'be', are: 'be', was: 'be', were: 'be', being: 'be', been: 'be',
  // common strong verbs (past / participle / -ing / 3rd person)
  began: 'begin', begun: 'begin', beginning: 'begin',
  broke: 'break', broken: 'break', breaking: 'break',
  brought: 'bring', bringing: 'bring',
  built: 'build', building: 'build',
  bought: 'buy', buying: 'buy',
  caught: 'catch', catching: 'catch',
  chose: 'choose', chosen: 'choose', choosing: 'choose',
  came: 'come', coming: 'come',
  cut: 'cut', cutting: 'cut',
  did: 'do', done: 'do', doing: 'do', does: 'do',
  drew: 'draw', drawn: 'draw', drawing: 'draw',
  drank: 'drink', drunk: 'drink', drinking: 'drink',
  drove: 'drive', driven: 'drive', driving: 'drive',
  ate: 'eat', eaten: 'eat', eating: 'eat',
  fell: 'fall', fallen: 'fall', falling: 'fall',
  felt: 'feel', feeling: 'feel',
  fought: 'fight', fighting: 'fight',
  found: 'find', finding: 'find',
  flew: 'fly', flown: 'fly', flying: 'fly',
  forgot: 'forget', forgotten: 'forget', forgetting: 'forget',
  got: 'get', gotten: 'get', getting: 'get',
  gave: 'give', given: 'give', giving: 'give',
  went: 'go', gone: 'go', going: 'go', goes: 'go',
  grew: 'grow', grown: 'grow', growing: 'grow',
  had: 'have', having: 'have', has: 'have',
  heard: 'hear', hearing: 'hear',
  held: 'hold', holding: 'hold',
  kept: 'keep', keeping: 'keep',
  knew: 'know', known: 'know', knowing: 'know',
  learnt: 'learn', learned: 'learn', learning: 'learn',
  left: 'leave', leaving: 'leave',
  lost: 'lose', losing: 'lose',
  made: 'make', making: 'make',
  meant: 'mean', meaning: 'mean',
  met: 'meet', meeting: 'meet',
  paid: 'pay', paying: 'pay',
  put: 'put', putting: 'put',
  read: 'read', reading: 'read',
  ran: 'run', running: 'run',
  said: 'say', saying: 'say', says: 'say',
  saw: 'see', seen: 'see', seeing: 'see',
  sold: 'sell', selling: 'sell',
  sent: 'send', sending: 'send',
  set: 'set', setting: 'set',
  showed: 'show', shown: 'show', showing: 'show',
  sang: 'sing', sung: 'sing', singing: 'sing',
  sat: 'sit', sitting: 'sit',
  slept: 'sleep', sleeping: 'sleep',
  spoke: 'speak', spoken: 'speak', speaking: 'speak',
  spent: 'spend', spending: 'spend',
  stood: 'stand', standing: 'stand',
  swam: 'swim', swum: 'swim', swimming: 'swim',
  took: 'take', taken: 'take', taking: 'take',
  taught: 'teach', teaching: 'teach',
  told: 'tell', telling: 'tell',
  thought: 'think', thinking: 'think',
  threw: 'throw', thrown: 'throw', throwing: 'throw',
  understood: 'understand', understanding: 'understand',
  woke: 'wake', woken: 'wake', waking: 'wake',
  wore: 'wear', worn: 'wear', wearing: 'wear',
  won: 'win', winning: 'win',
  wrote: 'write', written: 'write', writing: 'write',
  lay: 'lie', lain: 'lie', lying: 'lie',
  rose: 'rise', risen: 'rise', rising: 'rise',
  shook: 'shake', shaken: 'shake', shaking: 'shake',
  shone: 'shine', shining: 'shine',
  shot: 'shoot', shooting: 'shoot',
  shrank: 'shrink', shrunk: 'shrink', shrinking: 'shrink',
  sank: 'sink', sunk: 'sink', sinking: 'sink',
  sprang: 'spring', sprung: 'spring', springing: 'spring',
  stole: 'steal', stolen: 'steal', stealing: 'steal',
  stuck: 'stick', sticking: 'stick',
  stung: 'sting', stinging: 'sting',
  struck: 'strike', striking: 'strike',
  swore: 'swear', sworn: 'swear', swearing: 'swear',
  swept: 'sweep', sweeping: 'sweep',
  tore: 'tear', torn: 'tear', tearing: 'tear',
  wound: 'wind', winding: 'wind',
  withdrew: 'withdraw', withdrawn: 'withdraw', withdrawing: 'withdraw',
  undertook: 'undertake', undertaken: 'undertake', undertaking: 'undertake',
  overcame: 'overcome', overcoming: 'overcome',
  underwent: 'undergo', undergoing: 'undergo',
  bore: 'bear', born: 'bear', borne: 'bear', bearing: 'bear',
  bit: 'bite', bitten: 'bite', biting: 'bite',
  bled: 'bleed', bleeding: 'bleed',
  bound: 'bind', binding: 'bind',
  bred: 'breed', breeding: 'breed',
  broadcast: 'broadcast', broadcasting: 'broadcast',
  crept: 'creep', creeping: 'creep',
  dealt: 'deal', dealing: 'deal',
  dug: 'dig', digging: 'dig',
  fed: 'feed', feeding: 'feed',
  froze: 'freeze', frozen: 'freeze', freezing: 'freeze',
  hung: 'hang', hanging: 'hang',
  hid: 'hide', hidden: 'hide', hiding: 'hide',
  knelt: 'kneel', kneeling: 'kneel',
  led: 'lead', leading: 'lead',
  leant: 'lean', leaned: 'lean', leaning: 'lean',
  lit: 'light', lighting: 'light',
  misled: 'mislead', misleading: 'mislead',
  mistook: 'mistake', mistaken: 'mistake',
  proved: 'prove', proven: 'prove', proving: 'prove',
  quit: 'quit', quitting: 'quit',
  rode: 'ride', ridden: 'ride', riding: 'ride',
  rang: 'ring', rung: 'ring', ringing: 'ring',
  sought: 'seek', seeking: 'seek',
  sewed: 'sew', sewing: 'sew',
  sowed: 'sow', sowing: 'sow',
  spun: 'spin', spinning: 'spin',
  split: 'split', splitting: 'split',
  spread: 'spread', spreading: 'spread',
  leapt: 'leap', leaped: 'leap', leaping: 'leap',
  spelt: 'spell', spelled: 'spell', spelling: 'spell',
  spilt: 'spill', spilled: 'spill', spilling: 'spill',
  spoilt: 'spoil', spoiled: 'spoil', spoiling: 'spoil',
  swelled: 'swell', swollen: 'swell',
  swung: 'swing', swinging: 'swing',
  trod: 'tread', trodden: 'tread', treading: 'tread',
  wept: 'weep', weeping: 'weep',
}

/* ── Irregular plurals & comparatives ──────────────────────── */
const IRREGULAR_NOUNS: Record<string, string> = {
  men: 'man', women: 'woman', children: 'child', feet: 'foot',
  teeth: 'tooth', mice: 'mouse', geese: 'goose', people: 'person',
  oxen: 'ox', lice: 'louse', analyses: 'analysis', bases: 'basis',
  crises: 'crisis', theses: 'thesis', diagnoses: 'diagnosis',
  phenomena: 'phenomenon', criteria: 'criterion', indices: 'index',
  appendices: 'appendix', matrices: 'matrix', vertices: 'vertex',
  media: 'medium', data: 'datum', cacti: 'cactus', fungi: 'fungus',
  nuclei: 'nucleus', syllabi: 'syllabus', alumni: 'alumnus',
  stimuli: 'stimulus', radii: 'radius', foci: 'focus',
  leaves: 'leaf', lives: 'life', knives: 'knife', wives: 'wife',
  halves: 'half', shelves: 'shelf', wolves: 'wolf', calves: 'calf',
  loaves: 'loaf', thieves: 'thief',
}

const IRREGULAR_COMPARATIVES: Record<string, string> = {
  better: 'good', best: 'good', well: 'good',
  worse: 'bad', worst: 'bad',
  more: 'much', most: 'much',
  less: 'little', least: 'little',
  farther: 'far', farthest: 'far', further: 'far', furthest: 'far',
  elder: 'old', eldest: 'old', older: 'old', oldest: 'old',
  nearer: 'near', nearest: 'near',
}

/* ── Suffix rules ──────────────────────────────────────────── */

/** Generate candidate base forms by stripping common inflection suffixes */
function suffixCandidates(w: string): string[] {
  const out: string[] = []
  if (w.length < 4) return out

  // -ies → -y  (studies → study)
  if (w.endsWith('ies')) out.push(w.slice(0, -3) + 'y')
  // -ied → -y  (carried → carry)
  if (w.endsWith('ied')) out.push(w.slice(0, -3) + 'y')
  // -ier / -iest → -y (happier → happy)
  if (w.endsWith('ier')) out.push(w.slice(0, -3) + 'y')
  if (w.endsWith('iest')) out.push(w.slice(0, -4) + 'y')
  // -es → base (boxes → box, watches → watch, goes → go)
  if (w.endsWith('es') && w.length > 4) {
    out.push(w.slice(0, -2))
    out.push(w.slice(0, -1)) // -s variant e.g. "shoes" → "shoe"
  }
  // -s → base (cats → cat), but not -ss (class stays)
  if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) {
    out.push(w.slice(0, -1))
  }
  // -ed → base (loved → love), also strip doubled consonant (stopped → stop)
  if (w.endsWith('ed') && !w.endsWith('eed')) {
    out.push(w.slice(0, -2))        // loved → lov(e) via DB match on 'love'? need +e
    out.push(w.slice(0, -1))        // loved → love
    if (w.length > 5 && w[w.length - 3] === w[w.length - 4]) {
      out.push(w.slice(0, -3))      // stopped → stop
    }
  }
  // -ing → base (making → make via +e, running → run)
  if (w.endsWith('ing') && w.length > 5) {
    out.push(w.slice(0, -3))        // falling → fall
    out.push(w.slice(0, -3) + 'e')  // making → make
    if (w[w.length - 4] === w[w.length - 5]) {
      out.push(w.slice(0, -4))      // running → run
    }
  }
  // -ly → base (quickly → quick)
  if (w.endsWith('ly') && w.length > 5) {
    out.push(w.slice(0, -2))
    if (w.endsWith('ily')) out.push(w.slice(0, -3) + 'y') // happily → happy
  }
  // -er / -est → base (faster → fast)
  if (w.endsWith('er') && w.length > 5) {
    out.push(w.slice(0, -2))
    out.push(w.slice(0, -1))        // larger → large
  }
  if (w.endsWith('est') && w.length > 6) {
    out.push(w.slice(0, -3))
    out.push(w.slice(0, -2))        // largest → large
  }
  return out
}

/**
 * Return likely base forms for a word, best candidates first.
 * Always includes the original word itself.
 */
export function lemmatize(word: string): string[] {
  const w = word.toLowerCase().trim()
  if (!w) return []
  const candidates = new Set<string>([w])

  const irr = IRREGULAR_VERBS[w] || IRREGULAR_NOUNS[w] || IRREGULAR_COMPARATIVES[w]
  if (irr) candidates.add(irr)

  for (const c of suffixCandidates(w)) candidates.add(c)

  // Original first, then irregular (high confidence), then rule-based
  const rest = [...candidates].filter((c) => c !== w)
  const ordered = [w]
  if (irr && rest.includes(irr)) ordered.push(irr)
  ordered.push(...rest.filter((c) => c !== irr))
  return [...new Set(ordered)]
}

/** Levenshtein edit distance (iterative, small-string optimized) */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  if (Math.abs(a.length - b.length) > 2) return 3 // early exit beyond max useful distance

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  let curr = new Array<number>(b.length + 1)
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    const tmp = prev
    prev = curr
    curr = tmp
  }
  return prev[b.length]
}
