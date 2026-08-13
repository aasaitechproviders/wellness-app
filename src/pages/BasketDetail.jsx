import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api'
import { showToast } from '../components/Toast'
import WellnessBadge from '../components/WellnessBadge'
import ProductCatalog, { calcItemPrice, baseWeight } from '../components/ProductCatalog'

const EMJ = {
  Spinach:'🥬', Beetroot:'🫐', Broccoli:'🥦', Carrot:'🥕', Cucumber:'🥒',
  Tomato:'🍅', Capsicum:'🫑', Pumpkin:'🎃', Amla:'🟢', Guava:'🍐',
  Pomegranate:'🍎','Bitter gourd':'🌿','Bitter Gourd':'🌿',
  'Drumstick Leaves':'🌿','Drumstick leaves':'🌿','Drumstick':'🌿',
  'Curry leaves':'🌿','Mint leaves':'🌿','Coriander leaves':'🌿',
  'Sunflower Microgreens':'🌱','Fenugreek greens':'🌿',
  Amaranth:'🌿','Cluster beans':'🫘','French beans':'🫘','Green peas':'🫛',
  Apple:'🍎',Banana:'🍌',Papaya:'🍈',Mango:'🥭',
  Vegetable:'🥦','Leafy Vegetables':'🥬',Fruits:'🍎', default:'🥗',
}

function mkItem(name, idx, catalogMap = {}) {
  const cat = catalogMap[name]
  const w   = baseWeight(name)
  return {
    id: idx, name,
    emoji:      EMJ[name] || EMJ.default,
    weight:     w, qty: 1,
    category:   cat?.category || 'Vegetable',
    ingredient: cat || null,
    bestFor:    cat?.bestFor || name,
  }
}

/* ── Nutrient display config ── */
const NUTRIENT_CONFIG = [
  { key: 'calories',  label: 'Calories',   unit: 'kcal', icon: '🔥', color: '#E65100' },
  { key: 'protein',   label: 'Protein',    unit: 'g',    icon: '💪', color: '#1565C0' },
  { key: 'fibre',     label: 'Fibre',      unit: 'g',    icon: '🌾', color: '#2D6A35' },
  { key: 'carbs',     label: 'Carbs',      unit: 'g',    icon: '🍚', color: '#F9A825' },
  { key: 'fat',       label: 'Fat',        unit: 'g',    icon: '🫒', color: '#6D4C41' },
  { key: 'iron',      label: 'Iron',       unit: 'mg',   icon: '🩸', color: '#B71C1C' },
  { key: 'calcium',   label: 'Calcium',    unit: 'mg',   icon: '🦴', color: '#0277BD' },
  { key: 'potassium', label: 'Potassium',  unit: 'mg',   icon: '🍌', color: '#558B2F' },
  { key: 'vitaminC',  label: 'Vitamin C',  unit: 'mg',   icon: '🍊', color: '#EF6C00' },
  { key: 'vitaminA',  label: 'Vitamin A',  unit: 'µg',   icon: '👁️',  color: '#7B1FA2' },
  { key: 'magnesium', label: 'Magnesium',  unit: 'mg',   icon: '⚡', color: '#00838F' },
  { key: 'zinc',      label: 'Zinc',       unit: 'mg',   icon: '🔬', color: '#4527A0' },
]

// Goal → which nutrients to highlight in coverage
const GOAL_COVERAGE_KEYS = {
  'General Wellness':    ['calories','protein','fibre','vitaminC','iron'],
  'Weight Loss':         ['calories','protein','fibre','fat'],
  'Weight Gain':         ['calories','protein','carbs','fat'],
  'Build Muscle':        ['protein','calories','carbs'],
  'Blood Sugar Control': ['fibre','calories','carbs','protein'],
  'Heart Health':        ['potassium','fibre','fat','calories'],
  'Iron Support':        ['iron','vitaminC','protein','calcium'],
  'Digestive Wellness':  ['fibre','calories','protein'],
  'Immunity Nutrition':  ['vitaminC','vitaminA','iron','zinc'],
  'Bone Health':         ['calcium','magnesium','protein','vitaminD'],
  'Hypertension Support':['potassium','fibre','fat','calories'],
  'PCOS Support':        ['fibre','iron','protein','calories'],
  'Pregnancy Nutrition': ['iron','calcium','protein','vitaminA'],
  'Healthy Ageing':      ['calcium','protein','fibre','vitaminC'],
  'Fatty Liver Support': ['fibre','fat','protein','calories'],
  'Thyroid Support':     ['protein','fibre','zinc','calories'],
  'default':             ['calories','protein','fibre','iron','calcium','vitaminC'],
}

function getCoverageKeys(goals = []) {
  for (const g of goals) {
    if (GOAL_COVERAGE_KEYS[g]) return GOAL_COVERAGE_KEYS[g]
  }
  return GOAL_COVERAGE_KEYS['default']
}

function coverageColor(pct) {
  if (pct >= 90)  return '#2D6A35'
  if (pct >= 70)  return '#F9A825'
  return '#E53935'
}

/* ── Coverage Section ── */
function CoverageSection({ basket }) {
  const coverage  = basket.coveragePercent || {}
  const targets   = basket.targets         || {}
  const achieved  = basket.totalNutrition  || {}
  const goals     = basket.goals           || []

  const keys = getCoverageKeys(goals).filter(k => coverage[k] !== undefined && targets[k] > 0)
  if (!keys.length) return null

  return (
    <div style={{ padding: '14px 18px 4px' }}>
      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
        Weekly Nutritional Coverage
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 12, lineHeight: 1.4 }}>
        How much of your weekly targets this basket provides
        {goals.length > 0 && <span> · Based on <b style={{ color: 'var(--green)' }}>{goals[0]}</b></span>}
      </div>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {keys.map(k => {
          const cfg  = NUTRIENT_CONFIG.find(n => n.key === k)
          if (!cfg) return null
          const rawPct  = parseFloat(coverage[k] || 0)
          const pct     = Math.min(rawPct, 130) // cap bar at 130%
          const barW    = Math.min(pct, 100)
          const tgt     = targets[k]   ? +targets[k].toFixed(1)   : null
          const ach     = achieved[k]  ? +achieved[k].toFixed(1)  : null
          const clr     = coverageColor(rawPct)
          return (
            <div key={k}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15 }}>{cfg.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{cfg.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {ach !== null && tgt !== null && (
                    <span style={{ fontSize: 11, color: 'var(--text-light)' }}>
                      {ach}{cfg.unit} / {tgt}{cfg.unit}
                    </span>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 800, color: clr, minWidth: 38, textAlign: 'right' }}>
                    {rawPct.toFixed(0)}%
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height: 8, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  width: `${barW}%`,
                  background: rawPct >= 90
                    ? `linear-gradient(90deg, ${clr}, ${clr}CC)`
                    : rawPct >= 70
                    ? `linear-gradient(90deg, #F9A825, #FFD54F)`
                    : `linear-gradient(90deg, #E53935, #EF9A9A)`,
                  transition: 'width 0.6s ease',
                }} />
              </div>
              {rawPct > 100 && (
                <div style={{ fontSize: 10, color: '#558B2F', marginTop: 3, fontWeight: 600 }}>
                  ✓ Exceeds target — great coverage!
                </div>
              )}
            </div>
          )
        })}
        <div style={{ fontSize: 10, color: 'var(--text-light)', borderTop: '1px solid var(--border)', paddingTop: 10, lineHeight: 1.5 }}>
          💡 Coverage shown for your weekly basket based on your plan type. 90%+ is excellent.
        </div>
      </div>
    </div>
  )
}

/* ── Per-product Nutrition Row ── */
function ProductNutritionRow({ item, isLast }) {
  const [open, setOpen] = useState(false)
  const n = item.nutrients

  // Which macros to always show
  const macros = [
    { key: 'calories', label: 'Cal',     unit: 'kcal' },
    { key: 'protein',  label: 'Protein', unit: 'g'    },
    { key: 'carbs',    label: 'Carbs',   unit: 'g'    },
    { key: 'fat',      label: 'Fat',     unit: 'g'    },
    { key: 'fibre',    label: 'Fibre',   unit: 'g'    },
  ]
  // Micros — only show if > 0
  const micros = n ? [
    { key: 'iron',      label: 'Iron',      unit: 'mg' },
    { key: 'calcium',   label: 'Calcium',   unit: 'mg' },
    { key: 'potassium', label: 'Potassium', unit: 'mg' },
    { key: 'vitaminC',  label: 'Vit C',     unit: 'mg' },
    { key: 'vitaminA',  label: 'Vit A',     unit: 'µg' },
    { key: 'magnesium', label: 'Mg',        unit: 'mg' },
    { key: 'zinc',      label: 'Zinc',      unit: 'mg' },
  ].filter(m => n[m.key] > 0) : []

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 16px' }}>
        <div style={{ width: 48, height: 48, background: 'var(--green-pale)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
          {item.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{item.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>
            {item.weight}g · ₹{item.pricePerItem || calcItemPrice(item.name, item.weight)}
            {item.ingredient?.glycemic?.gi && (
              <span style={{ marginLeft: 6, background: '#F1F8E9', color: '#33691E', padding: '1px 6px', borderRadius: 50, fontSize: 10, fontWeight: 600 }}>GI {item.ingredient.glycemic.gi}</span>
            )}
          </div>
          {item.reason && (
            <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, lineHeight: 1.4, marginBottom: 4 }}>
              {item.reason}
            </div>
          )}
          <WellnessBadge ingredient={item.ingredient || { bestFor: item.bestFor, name: item.name }} max={2} size="sm" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: 13 }}>₹{item.pricePerItem || calcItemPrice(item.name, item.weight)}</div>
          {n && (
            <button
              onClick={() => setOpen(o => !o)}
              style={{ background: open ? 'var(--green)' : 'var(--bg)', border: `1px solid ${open ? 'var(--green)' : 'var(--border)'}`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: open ? '#fff' : 'var(--text-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
              Nutrition {open ? '▲' : '▼'}
            </button>
          )}
        </div>
      </div>

      {/* Expandable nutrition panel */}
      {open && n && (
        <div style={{ background: 'var(--green-pale)', margin: '0 12px 12px', borderRadius: 12, padding: '12px 14px' }}>
          {/* Macros row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: micros.length ? 10 : 0 }}>
            {macros.map(m => (
              <div key={m.key} style={{ textAlign: 'center', background: '#fff', borderRadius: 10, padding: '8px 4px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--green)', lineHeight: 1 }}>
                  {n[m.key] != null ? +n[m.key].toFixed(1) : '–'}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-light)', marginTop: 3, lineHeight: 1 }}>{m.label}</div>
                <div style={{ fontSize: 9, color: 'var(--text-light)', lineHeight: 1 }}>{m.unit}</div>
              </div>
            ))}
          </div>
          {/* Micros — only non-zero */}
          {micros.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Micronutrients</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {micros.map(m => (
                  <div key={m.key} style={{ background: '#fff', borderRadius: 8, padding: '5px 10px', display: 'flex', gap: 4, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{+n[m.key].toFixed(1)}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-light)' }}>{m.unit}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-mid)', fontWeight: 600 }}>{m.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <div style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 8 }}>Per {item.weight}g serving</div>
        </div>
      )}
    </div>
  )
}

export default function BasketDetail() {
  const { id }    = useParams()
  const nav       = useNavigate()
  const { state } = useLocation()

  const [basket,  setBasket]  = useState(null)
  const [items,   setItems]   = useState([])
  const [catalog, setCatalog] = useState({})
  const [view,    setView]    = useState('view')  // 'view' | 'customize'
  const [showCat, setShowCat] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const src = state?.basket
    if (src) { init(src); return }
    if (id && id !== 'undefined') {
      api.getBasket(id).then(d => init(d.basket)).catch(loadFallback).finally(() => setLoading(false))
      return
    }
    loadFallback()
  }, [])

  const loadFallback = () => {
    api.getBaskets({ featured: 'true' })
      .then(d => { const b = d.baskets?.[0]; if (b) init(b); else setLoading(false) })
      .catch(() => setLoading(false))
  }

  const init = (b) => {
    setBasket(b)
    api.getIngredients({ limit: 200, page: 1 }).then(d => {
      const map = {}
      ;(d.ingredients || d.products || []).forEach(x => { map[x.name] = x })
      setCatalog(map)

      // Use basketItems from engine if available (has correct qty + price from product master)
      // Fall back to ingredientNames for older/static baskets
      if (b.basketItems && b.basketItems.length > 0) {
        setItems(b.basketItems.map((item, i) => ({
          id:          i,
          name:        item.name,
          emoji:       EMJ[item.name] || EMJ[item.category] || EMJ.default,
          weight:      item.quantityGrams || baseWeight(item.name),
          qty:         1,
          pricePerItem: item.pricePerItem || 0,
          category:    item.category || 'Vegetable',
          reason:      item.reason   || null,
          nutrients:   item.nutrients || null,
          ingredient:  map[item.name] || null,
          bestFor:     map[item.name]?.bestFor || item.name,
        })))
      } else {
        setItems((b.ingredientNames || []).map((name, i) => mkItem(name, i, map)))
      }
    }).catch(() => {
      if (b.basketItems && b.basketItems.length > 0) {
        setItems(b.basketItems.map((item, i) => ({
          id:          i,
          name:        item.name,
          emoji:       EMJ[item.name] || EMJ.default,
          weight:      item.quantityGrams || baseWeight(item.name),
          qty:         1,
          pricePerItem: item.pricePerItem || 0,
          category:    item.category || 'Vegetable',
          reason:      item.reason   || null,
          nutrients:   item.nutrients || null,
          ingredient:  null,
          bestFor:     item.name,
        })))
      } else {
        setItems((b.ingredientNames || []).map((name, i) => mkItem(name, i)))
      }
    }).finally(() => setLoading(false))
  }

  const adj = (itemId, d) => setItems(prev => prev.map(it =>
    it.id === itemId ? { ...it, qty: Math.max(0, it.qty + d) } : it
  ))

  const addFromCatalog = (ing) => {
    if (items.find(it => it.name === ing.name)) {
      setItems(prev => prev.map(it => it.name === ing.name ? { ...it, qty: it.qty + 1 } : it))
    } else {
      setItems(prev => [...prev, {
        id: Date.now(), name: ing.name,
        emoji:   EMJ[ing.name] || EMJ[ing.category] || EMJ.default,
        weight:  baseWeight(ing.name), qty: 1,
        ingredient: ing, bestFor: ing.bestFor || '',
      }])
    }
    showToast(`${ing.name} added ✓`, 'success')
  }

  const goToReview = () => {
    nav('/review-order', {
      state: { basket: { ...basket, price: displayPrice }, items: activeItems, plan: state?.plan }
    })
  }

  if (loading) return (
    <div className="page-full center" style={{ minHeight: '100dvh' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  )
  if (!basket) return (
    <div className="page-full center" style={{ minHeight: '100dvh', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 52 }}>🧺</div>
      <p>No basket selected</p>
      <button className="btn btn-primary" onClick={() => nav('/goals')} style={{ width: 180 }}>Browse →</button>
    </div>
  )

  const activeItems  = items.filter(it => it.qty > 0)
  const totalWeight  = activeItems.reduce((s, it) => s + it.weight * it.qty, 0)
  const extraItems   = activeItems.filter(it => !(basket.ingredientNames || []).includes(it.name))
  // Extra items (user-added from catalog) use calcItemPrice; base items already have pricePerItem
  const extraCost    = extraItems.reduce((s, it) => s + (it.pricePerItem ? it.pricePerItem * it.qty : calcItemPrice(it.name, it.weight * it.qty)), 0)
  const displayPrice = Math.max(basket.price || 99, (basket.price || 0) + extraCost)
  const addedNames   = items.map(it => it.name)
  const isCustomized = activeItems.length !== (basket.ingredientNames?.length || 0) || extraCost > 0

  return (
    <>
      <div className="page-shell fade-in">

        {/* Sticky top bar */}
        <div className="top-bar">
          <button className="back-btn" onClick={() => nav(-1)}>←</button>
          <div className="top-bar-title">
            {view === 'view' ? basket.basketName : 'Customize Basket'}
          </div>
          {view === 'customize' && (
            <button onClick={() => setView('view')} style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>Done</button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="page-shell-scroll" style={{paddingBottom:'130px'}}>

        {/* ── VIEW MODE ── */}
        {view === 'view' && (
          <>
            <div style={{ background: '#fff', padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, letterSpacing: 0.8, marginBottom: 4, textTransform: 'uppercase' }}>RECOMMENDED FOR YOU</div>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{basket.basketName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 14 }}>Based on your goals</div>

              {/* Cart visual */}
              <div style={{ width: '100%', height: 130, background: 'linear-gradient(135deg,#EBF5EC,#B8DDB8)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 62, marginBottom: 14 }}>
                🧺
              </div>

              {basket.targetNutrients?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {basket.targetNutrients.map(n => (
                    <span key={n} style={{ background: 'var(--green-pale)', color: 'var(--green)', padding: '4px 10px', borderRadius: 50, fontSize: 11, fontWeight: 600 }}>✓ {n}</span>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>Includes</div>
              <div style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.8, marginBottom: 14 }}>
                {basket.ingredientNames?.slice(0, 5).join(', ')}
                {basket.ingredientNames?.length > 5 ? ` + ${basket.ingredientNames.length - 5} more` : ''}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--green)' }}>₹{basket.price}</div>
                <button onClick={() => setView('customize')} style={{ background: 'none', border: '1px solid var(--green)', color: 'var(--green)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '7px 16px', borderRadius: 50 }}>Customise →</button>
              </div>
            </div>

            {/* Goal Nutrient Coverage */}
            <CoverageSection basket={basket} />

            {/* What's Inside */}
            <div style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 16, fontWeight: 600 }}>What's Inside</div>
                <span style={{ fontSize: 11, color: 'var(--text-light)' }}>{items.length} items</span>
              </div>
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
                {items.map((it, i) => (
                  <ProductNutritionRow key={it.id} item={it} isLast={i === items.length - 1} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── CUSTOMIZE MODE ── */}
        {view === 'customize' && (
          <>
            <div style={{ background: '#fff', padding: '10px 18px 12px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--green)' }}>{basket.basketName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>Adjust quantities or add more items</div>
            </div>

            <div style={{ padding: '12px 18px' }}>
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 10 }}>
                {items.map((it, i) => (
                  <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none', opacity: it.qty === 0 ? 0.35 : 1 }}>
                    <div style={{ width: 44, height: 44, background: 'var(--green-pale)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                      {it.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{it.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
                        {it.weight * it.qty}g · <span style={{ color: 'var(--green)', fontWeight: 700 }}>₹{calcItemPrice(it.name, it.weight * it.qty)}</span>
                      </div>
                    </div>
                    <div className="stepper">
                      <button className="stepper-btn" onClick={() => adj(it.id, -1)}>−</button>
                      <span className="stepper-val">{it.qty}</span>
                      <button className="stepper-btn" onClick={() => adj(it.id, +1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add more CTA */}
              <button onClick={() => setShowCat(true)} style={{ width: '100%', padding: '13px', marginBottom: 14, background: 'linear-gradient(135deg,#EBF5EC,#D4EDD4)', border: '1.5px solid var(--green-muted)', borderRadius: 12, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--green)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🔍</span>
                Browse & Add More Items
                <span style={{ background: 'var(--green)', color: '#fff', borderRadius: 50, padding: '2px 8px', fontSize: 11 }}>141+</span>
              </button>

              {/* Live summary */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-mid)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 }}>Order Summary</div>
                {activeItems.map(it => (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{it.name} <span style={{ color: 'var(--text-light)', fontSize: 11 }}>{it.weight * it.qty}g</span></span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>₹{calcItemPrice(it.name, it.weight * it.qty)}</span>
                  </div>
                ))}
                <div className="hr" />
                {extraCost > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-light)' }}>
                    <span>Base basket</span><span>₹{basket.price}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Total</div>
                    <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>{activeItems.length} items · {totalWeight}g</div>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--green)' }}>₹{displayPrice}</div>
                </div>
              </div>
            </div>
          </>
        )}
        </div>{/* end page-shell-scroll */}

        {/* Sticky footer CTAs */}
        <div className="sticky-footer">
          {view === 'view' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-primary" onClick={goToReview}>
                Place Order → ₹{basket.price}
              </button>
              <button className="btn btn-secondary" onClick={() => setView('customize')} style={{ fontSize: 13, padding: '12px' }}>
                Customise Basket (Optional)
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" disabled={activeItems.length === 0} onClick={goToReview}>
              {isCustomized ? `Proceed with Custom Basket → ₹${displayPrice}` : `Place Order → ₹${displayPrice}`}
            </button>
          )}
        </div>
      </div>

      <ProductCatalog visible={showCat} onClose={() => setShowCat(false)} onAdd={addFromCatalog} addedNames={addedNames} />
    </>
  )
}
