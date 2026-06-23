import { useState, useEffect } from 'react'
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
    api.getIngredients({ limit: 141, page: 1 }).then(d => {
      const map = {}
      ;(d.ingredients || []).forEach(x => { map[x.name] = x })
      setCatalog(map)
      setItems((b.ingredientNames || []).map((name, i) => mkItem(name, i, map)))
    }).catch(() => {
      setItems((b.ingredientNames || []).map((name, i) => mkItem(name, i)))
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
  const extraCost    = extraItems.reduce((s, it) => s + calcItemPrice(it.name, it.weight * it.qty), 0)
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
        <div className="page-shell-scroll">

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
                <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 26, fontWeight: 700, color: 'var(--green)' }}>₹{basket.price}</div>
                <button onClick={() => setView('customize')} style={{ background: 'none', border: '1px solid var(--green)', color: 'var(--green)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '7px 16px', borderRadius: 50 }}>Customise →</button>
              </div>
            </div>

            {/* What's Inside */}
            <div style={{ padding: '14px 18px' }}>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>What's Inside</div>
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
                {items.map((it, i) => (
                  <div key={it.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 16px', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 48, height: 48, background: 'var(--green-pale)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                      {it.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{it.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 5 }}>
                        {it.weight}g · ₹{calcItemPrice(it.name, it.weight)}
                        {it.ingredient?.glycemic?.gi && (
                          <span style={{ marginLeft: 6, background: '#F1F8E9', color: '#33691E', padding: '1px 6px', borderRadius: 50, fontSize: 10, fontWeight: 600 }}>GI {it.ingredient.glycemic.gi}</span>
                        )}
                      </div>
                      <WellnessBadge ingredient={it.ingredient || { bestFor: it.bestFor, name: it.name }} max={2} size="sm" />
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: 13 }}>₹{calcItemPrice(it.name, it.weight)}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-light)' }}>/{it.weight}g</div>
                    </div>
                  </div>
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
                  <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 26, fontWeight: 700, color: 'var(--green)' }}>₹{displayPrice}</div>
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
