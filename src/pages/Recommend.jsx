import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { api } from '../api'
import { showToast } from '../components/Toast'
import WellnessBadge from '../components/WellnessBadge'
import BottomNav from '../components/BottomNav'

const EMJ = {
  Spinach:'🥬',Beetroot:'🫐',Broccoli:'🥦',Carrot:'🥕',Cucumber:'🥒',
  Tomato:'🍅',Capsicum:'🫑',Amla:'🟢',Guava:'🍐',Pomegranate:'🍎',
  'Drumstick Leaves':'🌿','Curry leaves':'🌿','Mint leaves':'🌿',
  Apple:'🍎',Banana:'🍌','Green peas':'🫛',
  default:'🥗',
}

export default function Recommend() {
  const { state }  = useLocation()
  const { family } = useAuth()
  const { addToCart, removeFromCart, isInCart } = useCart()
  const nav        = useNavigate()
  const [result,   setResult]    = useState(state?.result || null)
  const [catalog,  setCatalog]   = useState({})
  const [loading,  setLoading]   = useState(!state?.result)
  const [allBaskets, setAllBaskets] = useState([])
  const [browsing, setBrowsing]  = useState(false) // show all baskets section

  useEffect(() => {
    api.getIngredients({ limit: 141, page: 1 }).then(d => {
      const m = {}
      ;(d.ingredients || []).forEach(x => { m[x.name] = x })
      setCatalog(m)
    }).catch(() => {})

    // Also load all baskets for the browse section
    api.getBaskets({}).then(d => setAllBaskets(d.baskets || [])).catch(() => {})

    if (!result && family?._id) {
      api.getFamily(family._id)
        .then(d => {
          const m = (d.family?.members || []).filter(x => x.wellnessGoals?.length)
          if (m.length) return api.recommend({ members: m })
          return null
        })
        .then(d => { if (d) setResult(d.recommendation) })
        .catch(e => showToast(e.message, 'error'))
        .finally(() => setLoading(false))
    }
  }, [])

  if (loading) return (
    <div className="page-full center" style={{ minHeight: '100dvh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 44, height: 44 }} />
      <p style={{ color: 'var(--text-light)', fontSize: 14 }}>Building your wellness basket...</p>
    </div>
  )

  if (!result) return (
    <div className="page-full center" style={{ minHeight: '100dvh', flexDirection: 'column', gap: 16, padding: 28, textAlign: 'center' }}>
      <div style={{ fontSize: 52 }}>🎯</div>
      <h2 style={{ fontFamily: 'Playfair Display,serif' }}>No Goals Set</h2>
      <p style={{ color: 'var(--text-light)', fontSize: 14 }}>Set wellness goals to get a personalised basket</p>
      <button className="btn btn-primary" onClick={() => nav('/goals')} style={{ width: 200 }}>Set Goals →</button>
    </div>
  )

  // Basket IDs already recommended — to highlight them in the browse section
  const recommendedIds = new Set(result.baskets?.map(b => b._id?.toString()) || [])

  // Other baskets not in recommendation
  const otherBaskets = allBaskets.filter(b => !recommendedIds.has(b._id?.toString()))

  const CartButton = ({ basket }) => {
    const inCart = isInCart(basket._id)
    if (inCart) return (
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => nav('/cart')}
          style={{ flex: 1, padding: '10px 0', background: 'var(--green-pale)', color: 'var(--green)', border: '1.5px solid var(--green)', borderRadius: 50, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          ✓ In Cart — View
        </button>
        <button
          onClick={() => { removeFromCart(basket._id); showToast(`${basket.basketName} removed`, 'success') }}
          style={{ width: 38, height: 38, flexShrink: 0, background: '#FEE2E2', border: 'none', borderRadius: '50%', color: '#DC2626', fontSize: 14, cursor: 'pointer' }}>
          ✕
        </button>
      </div>
    )
    return (
      <button
        onClick={() => { addToCart(basket); showToast(`${basket.basketName} added 🛒`, 'success') }}
        style={{ width: '100%', padding: '10px 0', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 50, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        🛒 Add to Cart
      </button>
    )
  }

  return (
    <div className="page-shell fade-in">
      {/* Header */}
      <div className="top-bar">
        <button className="back-btn" onClick={() => nav(-1)}>←</button>
        <div className="top-bar-title">Recommended for You</div>
      </div>

      <div className="page-shell-scroll with-nav" style={{ padding: '10px 18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Personalised based on your wellness goals</p>

        {/* Goals covered */}
        {result.goalsCovered?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {result.goalsCovered.map(g => (
              <span key={g.goalId} style={{ background: 'var(--green)', color: '#fff', padding: '4px 12px', borderRadius: 50, fontSize: 11, fontWeight: 600 }}>
                ✓ {g.goalName}
              </span>
            ))}
          </div>
        )}

        {/* ── Recommended baskets ──────────────────────────────────────── */}
        {result.baskets?.map(b => (
          <div key={b._id} style={{ background: '#fff', borderRadius: 16, border: '2px solid var(--green)', overflow: 'hidden' }}>
            {/* Recommended tag */}
            <div style={{ background: 'var(--green)', padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>⭐ Recommended for You</span>
            </div>
            <div style={{ width: '100%', height: 110, background: 'linear-gradient(135deg,#EBF5EC,#B8DDB8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54 }}>🧺</div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 3, textTransform: 'uppercase' }}>
                {b.wellnessGoal || 'Wellness Basket'}
              </div>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 17, fontWeight: 700, marginBottom: 3 }}>{b.basketName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 10 }}>{b.description}</div>

              {b.targetNutrients?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                  {b.targetNutrients.map(n => (
                    <span key={n} style={{ background: 'var(--green-pale)', color: 'var(--green)', padding: '3px 9px', borderRadius: 50, fontSize: 11, fontWeight: 600 }}>✓ {n}</span>
                  ))}
                </div>
              )}

              <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 6 }}>Includes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                {b.ingredientNames?.slice(0, 5).map(name => {
                  const ing = catalog[name]
                  return (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15 }}>{EMJ[name] || '🥗'}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{name}</span>
                      {ing && <WellnessBadge ingredient={ing} max={1} size="sm" />}
                    </div>
                  )
                })}
                {b.ingredientNames?.length > 5 && (
                  <div style={{ fontSize: 12, color: 'var(--text-light)', paddingLeft: 22 }}>
                    + {b.ingredientNames.length - 5} more items
                  </div>
                )}
              </div>

              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 22, fontWeight: 700, color: 'var(--green)', marginBottom: 10 }}>₹{b.price}</div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={{ flex: 1, padding: '10px 0', background: '#fff', color: 'var(--green)', border: '1.5px solid var(--green)', borderRadius: 50, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  onClick={() => nav('/basket-detail', { state: { basket: b } })}>
                  View Details
                </button>
                <div style={{ flex: 1 }}><CartButton basket={b} /></div>
              </div>
            </div>
          </div>
        ))}

        {/* ── Browse Other Baskets ─────────────────────────────────────── */}
        <div style={{ marginTop: 4 }}>
          <div
            onClick={() => setBrowsing(v => !v)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: '#fff', borderRadius: 14, border: '1px solid var(--border)', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Browse All Baskets</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>Explore {allBaskets.length} baskets and add what you like</div>
            </div>
            <span style={{ fontSize: 18, color: 'var(--green)', fontWeight: 700, transition: 'transform 0.2s', display: 'inline-block', transform: browsing ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
          </div>

          {browsing && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {otherBaskets.length === 0 && allBaskets.length > 0 && (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: 'var(--text-light)', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
                  All available baskets are already recommended for you 🎉
                </div>
              )}
              {otherBaskets.map(b => (
                <div key={b._id} style={{ background: '#fff', borderRadius: 14, border: '1px solid var(--border)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg,#EBF5EC,#B8DDB8)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>🧺</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {b.wellnessGoal && (
                        <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>{b.wellnessGoal}</div>
                      )}
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{b.basketName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)', lineHeight: 1.4 }}>{b.description}</div>
                    </div>
                    <div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, color: 'var(--green)', fontSize: 16, flexShrink: 0 }}>₹{b.price}</div>
                  </div>

                  {b.ingredientNames?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {b.ingredientNames.slice(0, 4).map(n => (
                        <span key={n} style={{ fontSize: 11, color: 'var(--text-mid)', background: 'var(--bg)', padding: '2px 8px', borderRadius: 50, border: '1px solid var(--border)' }}>{EMJ[n] || '🥗'} {n}</span>
                      ))}
                      {b.ingredientNames.length > 4 && (
                        <span style={{ fontSize: 11, color: 'var(--text-light)', padding: '2px 8px' }}>+{b.ingredientNames.length - 4} more</span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{ padding: '8px 14px', background: '#fff', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      onClick={() => nav('/basket-detail', { state: { basket: b } })}>
                      Details
                    </button>
                    <div style={{ flex: 1 }}><CartButton basket={b} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info card */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: '13px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.7 }}>
            <strong>Tip:</strong> You can add multiple baskets to cart — mix and match for different family members.
          </div>
        </div>

        <div style={{ height: 8 }} />
      </div>

      {/* Sticky footer */}
      <div className="sticky-footer" style={{ paddingBottom: 'calc(var(--nav-h) + 12px)' }}>
        <button className="btn btn-primary" onClick={() => nav('/plans', { state: { result } })}>
          Choose Subscription Plan →
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
