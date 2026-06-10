// WellnessBadge — shows contextual wellness tags on any ingredient
// Usage: <WellnessBadge ingredient={ing} max={3} />

const GOAL_MAP = {
  diabetes:        { label:'Diabetic Friendly', color:'#E0F7FA', text:'#0277BD', icon:'💧' },
  weightLoss:      { label:'Weight Loss',        color:'#F3E5F5', text:'#7B1FA2', icon:'⚖️' },
  immunity:        { label:'Immunity Boost',     color:'#E8F5E9', text:'#2E7D32', icon:'🛡️' },
  detox:           { label:'Detox',              color:'#FFF8E1', text:'#F57F17', icon:'✨' },
  antiInflammatory:{ label:'Anti-Inflammatory',  color:'#FCE4EC', text:'#C62828', icon:'🔥' },
  satiety:         { label:'High Satiety',       color:'#E3F2FD', text:'#1565C0', icon:'🫙' },
}

const SPECIAL_MAP = [
  { key:'kidFriendly',      label:'Kids ✓',         color:'#FFF9C4', text:'#F9A825', icon:'😊' },
  { key:'seniorFriendly',   label:'Senior ✓',       color:'#EFEBE9', text:'#4E342E', icon:'👴' },
  { key:'diabeticFriendly', label:'Diabetic Safe',  color:'#E0F7FA', text:'#006064', icon:'💧' },
]

const KEYWORD_MAP = [
  { kw:'iron',       label:'Iron Rich',      color:'#FFF3E0', text:'#E65100', icon:'💪' },
  { kw:'calcium',    label:'Calcium Rich',   color:'#F3E5F5', text:'#6A1B9A', icon:'🦴' },
  { kw:'protein',    label:'Protein',        color:'#E3F2FD', text:'#1565C0', icon:'⚡' },
  { kw:'vitamin c',  label:'Vitamin C',      color:'#FFF9C4', text:'#F57F17', icon:'🍊' },
  { kw:'immunity',   label:'Immunity',       color:'#E8F5E9', text:'#1B5E20', icon:'🛡️' },
  { kw:'detox',      label:'Detox',          color:'#FFF8E1', text:'#E65100', icon:'✨' },
  { kw:'diabetes',   label:'Blood Sugar',    color:'#E0F7FA', text:'#006064', icon:'💧' },
  { kw:'heart',      label:'Heart Health',   color:'#FCE4EC', text:'#880E4F', icon:'❤️' },
  { kw:'digestion',  label:'Digestion',      color:'#F1F8E9', text:'#33691E', icon:'🌀' },
  { kw:'weight',     label:'Weight Mgmt',    color:'#EDE7F6', text:'#4527A0', icon:'⚖️' },
  { kw:'kidney',     label:'Kidney',         color:'#E8EAF6', text:'#283593', icon:'🫘' },
  { kw:'women',      label:'Women\'s Health',color:'#FCE4EC', text:'#880E4F', icon:'🌸' },
  { kw:'energy',     label:'Energy Boost',   color:'#FFFDE7', text:'#F57F17', icon:'⚡' },
  { kw:'skin',       label:'Skin Health',    color:'#FFF3E0', text:'#E65100', icon:'✨' },
  { kw:'antioxidant',label:'Antioxidant',    color:'#FCE4EC', text:'#AD1457', icon:'🍇' },
  { kw:'microgreen', label:'Microgreen',     color:'#E8F5E9', text:'#1B5E20', icon:'🌱' },
]

export function getBadges(ingredient, max = 3) {
  if (!ingredient) return []
  const badges = []
  const bestFor = (ingredient.bestFor || '').toLowerCase()
  const name    = (ingredient.name || '').toLowerCase()
  const scores  = ingredient.wellnessScores || {}
  const suit    = ingredient.suitability || {}
  const seen    = new Set()

  // 1. From wellnessScores — top scoring goals first
  const sorted = Object.entries(scores)
    .filter(([k, v]) => v >= 80 && GOAL_MAP[k])
    .sort(([,a],[,b]) => b - a)
  for (const [k] of sorted) {
    if (badges.length >= max) break
    const m = GOAL_MAP[k]
    if (!seen.has(m.label)) { badges.push(m); seen.add(m.label) }
  }

  // 2. From bestFor keywords
  for (const km of KEYWORD_MAP) {
    if (badges.length >= max) break
    if ((bestFor + name).includes(km.kw) && !seen.has(km.label)) {
      badges.push({ label:km.label, color:km.color, text:km.text, icon:km.icon })
      seen.add(km.label)
    }
  }

  // 3. From suitability flags
  for (const s of SPECIAL_MAP) {
    if (badges.length >= max) break
    if (suit[s.key] && !seen.has(s.label)) {
      badges.push({ label:s.label, color:s.color, text:s.text, icon:s.icon })
      seen.add(s.label)
    }
  }

  return badges.slice(0, max)
}

export default function WellnessBadge({ ingredient, max = 2, size = 'sm' }) {
  const badges = getBadges(ingredient, max)
  if (!badges.length) return null
  const pad  = size === 'sm' ? '3px 8px' : '4px 10px'
  const fs   = size === 'sm' ? 10 : 12
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
      {badges.map((b, i) => (
        <span key={i} style={{
          background: b.color, color: b.text,
          padding: pad, borderRadius: 50,
          fontSize: fs, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 3,
          lineHeight: 1.4,
        }}>
          {b.icon} {b.label}
        </span>
      ))}
    </div>
  )
}
