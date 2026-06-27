import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { api } from '../api'
import { showToast } from '../components/Toast'
import BottomNav from '../components/BottomNav'

const EMJ = {
  Spinach:'🥬', Beetroot:'🫐', Broccoli:'🥦', Carrot:'🥕', Cucumber:'🥒',
  Tomato:'🍅', Capsicum:'🫑', Amla:'🟢', Guava:'🍐', Pomegranate:'🍎',
  'Drumstick Leaves':'🌿', 'Curry leaves':'🌿', 'Mint leaves':'🌿',
  Apple:'🍎', Banana:'🍌', 'Green peas':'🫛',
}

const AVATAR = { Male: '👨', Female: '👩', default: '👤' }

export default function Recommend() {
  const { state }   = useLocation()
  const { family }  = useAuth()
  const { addToCart, removeFromCart, isInCart } = useCart()
  const nav         = useNavigate()
  const allRef      = useRef(null)

  const [result,     setResult]     = useState(state?.result || null)
  const [loading,    setLoading]    = useState(!state?.result)
  const [allBaskets, setAllBaskets] = useState([])
  const browseAll = state?.browseAll || false

  useEffect(() => {
    api.getBaskets({}).then(d => setAllBaskets(d.baskets || [])).catch(() => {})

    if (!result) {
      if (!family?._id) { setLoading(false); return }
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

  useEffect(() => {
    if (browseAll && allRef.current && !loading) {
      setTimeout(() => allRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    }
  }, [browseAll, loading])

  if (loading) return (
    <div className="page-full center" style={{ minHeight: '100dvh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 44, height: 44 }} />
      <p style={{ color: 'var(--text-light)', fontSize: 14 }}>Building your wellness baskets…</p>
    </div>
  )

  const memberResults  = result?.memberResults || []
  const recommendedIds = new Set(memberResults.flatMap(mr => mr.baskets?.map(b => b._id?.toString()) || []))
  const otherBaskets   = allBaskets.filter(b => !recommendedIds.has(b._id?.toString()))

  // ── Basket card (shared) ──────────────────────────────────────────────────
  const BasketCard = ({ basket, memberName, featured = false }) => {
    const inCart = isInCart(basket._id)
    return (
      <div style={{
        background: '#fff', borderRadius: 16,
        border: `${featured ? 2 : 1.5}px solid ${featured ? 'var(--green)' : 'var(--border)'}`,
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px 10px' }}>
          <div style={{ width: 48, height: 48, flexShrink: 0, background: 'linear-gradient(135deg,#EBF5EC,#B8DDB8)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🧺</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {basket.wellnessGoal && (
              <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>{basket.wellnessGoal}</div>
            )}
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, lineHeight: 1.3 }}>{basket.basketName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)', lineHeight: 1.4 }}>{basket.description}</div>
          </div>
          <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: 15, flexShrink: 0 }}>₹{basket.price}</div>
        </div>

        {basket.ingredientNames?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '0 16px 10px' }}>
            {basket.ingredientNames.slice(0, 4).map(n => (
              <span key={n} style={{ fontSize: 11, color: 'var(--text-mid)', background: 'var(--bg)', padding: '3px 9px', borderRadius: 50, border: '1px solid var(--border)' }}>
                {EMJ[n] || '🥗'} {n}
              </span>
            ))}
            {basket.ingredientNames.length > 4 && (
              <span style={{ fontSize: 11, color: 'var(--text-light)', padding: '3px 6px' }}>+{basket.ingredientNames.length - 4} more</span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px' }}>
          <button
            onClick={() => nav('/basket-detail', { state: { basket } })}
            style={{ padding: '9px 16px', background: '#fff', color: 'var(--text)', border: '1.5px solid var(--border)', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Details
          </button>
          <div style={{ flex: 1 }}>
            {inCart ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => nav('/cart')} style={{ flex: 1, padding: '9px 0', background: 'var(--green-pale)', color: 'var(--green)', border: '1.5px solid var(--green)', borderRadius: 50, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✓ In Cart</button>
                <button onClick={() => { removeFromCart(basket._id); showToast(`${basket.basketName} removed`, 'success') }} style={{ width: 36, height: 36, flexShrink: 0, background: '#FEE2E2', border: 'none', borderRadius: '50%', color: '#DC2626', fontSize: 13, cursor: 'pointer' }}>✕</button>
              </div>
            ) : (
              <button onClick={() => { addToCart(basket); showToast(`${basket.basketName} added 🛒`, 'success') }} style={{ width: '100%', padding: '9px 0', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 50, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                🛒 Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell fade-in">
      <div className="top-bar">
        <button className="back-btn" onClick={() => nav(-1)}>←</button>
        <div className="top-bar-title">Baskets</div>
      </div>

      <div className="page-shell-scroll with-nav" style={{ padding: '14px 18px 100px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Section 1: Per-member curated baskets ───────────────────────── */}
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 17, fontWeight: 700 }}>Curated Baskets</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 3 }}>Personalised for each family member based on their goals</div>
          </div>

          {memberResults.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1.5px dashed var(--border)', padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>No curated baskets yet</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>Set wellness goals for your family members to get personalised basket recommendations</div>
              <button className="btn btn-primary" onClick={() => nav('/goals')} style={{ width: 180 }}>Set Goals →</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {memberResults.map((mr, idx) => (
                <div key={mr.memberId || idx}>

                  {/* Member badge row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {AVATAR[mr.gender] || AVATAR.default}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{mr.memberName}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 3 }}>
                        {mr.wellnessGoals.map(g => (
                          <span key={g} style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', background: 'var(--green-pale)', padding: '2px 8px', borderRadius: 50 }}>✓ {g}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Baskets for this member */}
                  {mr.baskets.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: 12, border: '1.5px dashed var(--border)', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
                        No basket linked to {mr.memberName}'s goals yet —
                        <button onClick={() => nav('/goals')} style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '0 4px' }}>update goals</button>
                        or ask admin to link baskets.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {mr.baskets.map(b => <BasketCard key={b._id} basket={b} memberName={mr.memberName} featured />)}
                    </div>
                  )}

                  {/* Divider between members (not after last) */}
                  {idx < memberResults.length - 1 && (
                    <div style={{ borderBottom: '1px solid var(--border)', marginTop: 20 }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Section 2: All Available Baskets ────────────────────────────── */}
        <div ref={allRef}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 17, fontWeight: 700 }}>All Available Baskets</div>
              <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{allBaskets.length} baskets</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 3 }}>Everything we offer — add any to your cart</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {allBaskets.map(b => {
              const isRecommended = recommendedIds.has(b._id?.toString())
              // Find which member this basket belongs to
              const forMembers = memberResults.filter(mr => mr.baskets.some(mb => mb._id?.toString() === b._id?.toString())).map(mr => mr.memberName)
              return (
                <div key={b._id} style={{ position: 'relative' }}>
                  {forMembers.length > 0 && (
                    <div style={{ position: 'absolute', top: 10, right: 12, zIndex: 1, display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {forMembers.map(name => (
                        <span key={name} style={{ background: 'var(--green)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50 }}>
                          ⭐ {name}
                        </span>
                      ))}
                    </div>
                  )}
                  <BasketCard basket={b} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Tip */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.7 }}>
            <strong>Tip:</strong> Add baskets for each family member separately — they can share a subscription or have their own.
          </div>
        </div>

      </div>

      <div className="sticky-footer" style={{ paddingBottom: 'calc(var(--nav-h) + 12px)' }}>
        <button className="btn btn-primary" onClick={() => nav('/plans', { state: { result } })}>
          Choose Subscription Plan →
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
