import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { showToast } from '../components/Toast'
import WellnessBadge from '../components/WellnessBadge'

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
  const nav        = useNavigate()
  const [result,   setResult]  = useState(state?.result || null)
  const [catalog,  setCatalog] = useState({})
  const [loading,  setLoading] = useState(!state?.result)

  useEffect(() => {
    api.getIngredients({ limit: 141, page: 1 }).then(d => {
      const m = {}
      ;(d.ingredients || []).forEach(x => { m[x.name] = x })
      setCatalog(m)
    }).catch(() => {})

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

  return (
    <div className="page-shell fade-in">
      {/* Sticky header */}
      <div className="top-bar">
        <button className="back-btn" onClick={() => nav(-1)}>←</button>
        <div className="top-bar-title">Recommended for You</div>
      </div>

      {/* Scrollable content */}
      <div className="page-shell-scroll" style={{ padding:'10px 18px 24px' }}>
        <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Personalised based on your wellness goals</p>
      </div>

      {/* Goals covered */}
      {result.goalsCovered?.length > 0 && (
        <div style={{ padding: '0 18px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {result.goalsCovered.map(g => (
            <span key={g.goalId} style={{ background: 'var(--green)', color: '#fff', padding: '4px 12px', borderRadius: 50, fontSize: 11, fontWeight: 600 }}>
              ✓ {g.goalName}
            </span>
          ))}
        </div>
      )}

      <div style={{ padding: '4px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Basket cards — "Top Picks For You" (Image 5) REMOVED per client */}
        {result.baskets?.map(b => (
          <div key={b._id} style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {/* Visual — shopping cart */}
            <div style={{ width: '100%', height: 120, background: 'linear-gradient(135deg,#EBF5EC,#B8DDB8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 58 }}>
              🧺
            </div>

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

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>₹{b.price}</div>
                {/* Single clear CTA — no more "Add to Cart" vs "Choose Subscription Plan" confusion */}
                <button
                  className="btn btn-primary btn-sm"
                  style={{ width: 'auto', padding: '10px 20px', borderRadius: 50 }}
                  onClick={() => nav('/basket-detail', { state: { basket: b } })}>
                  View Basket →
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* No baskets fallback */}
        {(!result.baskets || result.baskets.length === 0) && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🧺</div>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Your Basket is Ready</div>
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>We've found the best wellness produce for your goals</p>
            <button className="btn btn-primary" onClick={() => nav('/plans', { state: { result } })}>
              Choose a Plan →
            </button>
          </div>
        )}

        {/* Info card explaining the next step */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: '13px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.7 }}>
            <strong>Next:</strong> View your basket → Choose how often you want delivery → Place your order. Customisation is optional.
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      {result.baskets?.length > 0 && (
        <div className="sticky-footer">
          <button className="btn btn-primary" onClick={() => nav('/plans', { state: { result } })}>
            Choose Subscription Plan →
          </button>
        </div>
      )}
    </div>
  )
}
