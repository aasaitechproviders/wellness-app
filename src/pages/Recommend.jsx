import { useState, useEffect, useRef } from 'react'
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
  const allRef     = useRef(null)

  const [result,     setResult]     = useState(state?.result || null)
  const [catalog,    setCatalog]    = useState({})
  const [loading,    setLoading]    = useState(!state?.result)
  const [allBaskets, setAllBaskets] = useState([])

  // If came from "See all →", auto-scroll to All Baskets section
  const browseAll = state?.browseAll || false

  useEffect(() => {
    api.getIngredients({ limit: 141, page: 1 }).then(d => {
      const m = {}
      ;(d.ingredients || []).forEach(x => { m[x.name] = x })
      setCatalog(m)
    }).catch(() => {})

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

  // Auto-scroll to All Baskets section when browseAll
  useEffect(() => {
    if (browseAll && allRef.current && !loading) {
      setTimeout(() => allRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
    }
  }, [browseAll, loading])

  if (loading) return (
    <div className="page-full center" style={{ minHeight: '100dvh', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" style={{ width: 44, height: 44 }} />
      <p style={{ color: 'var(--text-light)', fontSize: 14 }}>Loading baskets…</p>
    </div>
  )

  const recommendedIds = new Set(result?.baskets?.map(b => b._id?.toString()) || [])
  const curatedBaskets = result?.baskets || []
  const otherBaskets   = allBaskets.filter(b => !recommendedIds.has(b._id?.toString()))

  // ── Shared basket card (compact) ─────────────────────────────────────────
  const BasketCard = ({ basket, featured = false }) => {
    const inCart = isInCart(basket._id)
    return (
      <div style={{
        background: '#fff',
        borderRadius: 16,
        border: featured ? '2px solid var(--green)' : '1.5px solid var(--border)',
        overflow: 'hidden',
      }}>
        {/* Top info row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px 10px' }}>
          <div style={{
            width: 52, height: 52, flexShrink: 0,
            background: 'linear-gradient(135deg,#EBF5EC,#B8DDB8)',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          }}>🧺</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {basket.wellnessGoal && (
              <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>
                {basket.wellnessGoal}
              </div>
            )}
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, lineHeight: 1.3 }}>{basket.basketName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)', lineHeight: 1.4 }}>{basket.description}</div>
          </div>
          <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: 16, flexShrink: 0 }}>₹{basket.price}</div>
        </div>

        {/* Ingredients chips */}
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

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px' }}>
          <button
            onClick={() => nav('/basket-detail', { state: { basket } })}
            style={{ padding: '9px 16px', background: '#fff', color: 'var(--text)', border: '1.5px solid var(--border)', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Details
          </button>
          <div style={{ flex: 1 }}>
            {inCart ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => nav('/cart')}
                  style={{ flex: 1, padding: '9px 0', background: 'var(--green-pale)', color: 'var(--green)', border: '1.5px solid var(--green)', borderRadius: 50, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  ✓ In Cart
                </button>
                <button
                  onClick={() => { removeFromCart(basket._id); showToast(`${basket.basketName} removed`, 'success') }}
                  style={{ width: 36, height: 36, flexShrink: 0, background: '#FEE2E2', border: 'none', borderRadius: '50%', color: '#DC2626', fontSize: 13, cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => { addToCart(basket); showToast(`${basket.basketName} added 🛒`, 'success') }}
                style={{ width: '100%', padding: '9px 0', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 50, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                🛒 Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Section header ────────────────────────────────────────────────────────
  const SectionHeader = ({ title, sub, count }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 17, fontWeight: 700 }}>{title}</div>
        {count != null && <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{count} basket{count !== 1 ? 's' : ''}</span>}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 3 }}>{sub}</div>}
    </div>
  )

  return (
    <div className="page-shell fade-in">
      {/* Header */}
      <div className="top-bar">
        <button className="back-btn" onClick={() => nav(-1)}>←</button>
        <div className="top-bar-title">Baskets</div>
      </div>

      <div className="page-shell-scroll with-nav" style={{ padding: '14px 18px 100px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Section 1: Curated Baskets (goal-matched) ───────────────── */}
        <div>
          <SectionHeader
            title="Curated Baskets"
            sub="Personalised based on your wellness goals"
            count={curatedBaskets.length}
          />

          {/* Active goals chips */}
          {result?.goalsCovered?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {result.goalsCovered.map(g => (
                <span key={g.goalId} style={{ background: 'var(--green)', color: '#fff', padding: '4px 12px', borderRadius: 50, fontSize: 11, fontWeight: 600 }}>
                  ✓ {g.goalName}
                </span>
              ))}
            </div>
          )}

          {curatedBaskets.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1.5px dashed var(--border)', padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>No curated baskets yet</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>
                Set your wellness goals so we can recommend the right baskets for you
              </div>
              <button className="btn btn-primary" onClick={() => nav('/goals')} style={{ width: 180 }}>
                Set Goals →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {curatedBaskets.map(b => <BasketCard key={b._id} basket={b} featured />)}
            </div>
          )}
        </div>

        {/* ── Divider ─────────────────────────────────────────────────── */}
        <div ref={allRef} style={{ borderTop: '2px solid var(--border)', position: 'relative' }}>
          <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'var(--cream)', padding: '0 12px', fontSize: 11, color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Explore More
          </span>
        </div>

        {/* ── Section 2: All Available Baskets ────────────────────────── */}
        <div>
          <SectionHeader
            title="All Available Baskets"
            sub="Everything we offer — add any to your cart"
            count={allBaskets.length}
          />

          {allBaskets.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: 'var(--text-light)', background: '#fff', borderRadius: 14, border: '1.5px solid var(--border)' }}>
              <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 10px' }} />
              Loading baskets…
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allBaskets.map(b => {
                const isRecommended = recommendedIds.has(b._id?.toString())
                return (
                  <div key={b._id} style={{ position: 'relative' }}>
                    {isRecommended && (
                      <div style={{ position: 'absolute', top: 10, right: 12, zIndex: 1, background: 'var(--green)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 50, letterSpacing: 0.3 }}>
                        ⭐ In Your Goals
                      </div>
                    )}
                    <BasketCard basket={b} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Tip */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.7 }}>
            <strong>Tip:</strong> You can add multiple baskets to cart — mix and match for different family members.
          </div>
        </div>

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
