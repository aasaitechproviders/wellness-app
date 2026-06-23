import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import BottomNav from '../components/BottomNav'
import logo from '../assets/logo.jpeg'

const BICONS = {
  'Iron Support Basket':'💪','Immunity Basket':'🛡️','Protein Support Basket':'⚡',
  'Diabetes Wellness Basket':'💧','Detox Basket':'✨','Kids Nutrition Basket':'😊',
  'Senior Wellness Basket':'👴','Heart Wellness Basket':'❤️',
}


export default function Home() {
  const { family } = useAuth()
  const nav = useNavigate()
  const [baskets, setBaskets]       = useState([])
  const [recentOrder, setRecentOrder] = useState(null)
  const [activeSub, setActiveSub]   = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!family) return

    const members = family?.members || []
    const goals   = [...new Set(members.flatMap(m => m.wellnessGoals || []))]

    // Build basket fetch — filter by each wellness goal and merge results
    const basketFetches = goals.length > 0
      ? goals.map(g => api.getBaskets({ goal: g }).catch(() => ({ baskets: [] })))
      : [api.getBaskets({ featured: 'true' }).catch(() => ({ baskets: [] }))]

    Promise.all([
      Promise.all(basketFetches),
      family?._id ? api.getOrders(family._id).catch(() => ({ orders: [] })) : { orders: [] },
      family?._id ? api.getSubscriptions(family._id).catch(() => ({ subscriptions: [] })) : { subscriptions: [] },
    ]).then(([basketResults, o, s]) => {
      // Merge all basket results, deduplicate by _id, cap at 4
      const seen = new Set()
      const merged = []
      for (const r of basketResults) {
        for (const b of (r.baskets || [])) {
          if (!seen.has(b._id?.toString())) {
            seen.add(b._id?.toString())
            merged.push(b)
          }
        }
      }
      setBaskets(merged.slice(0, 4))
      setRecentOrder(o.orders?.[0] || null)
      setActiveSub(s.subscriptions?.find(x => x.status === 'active') || null)
    }).finally(() => setLoading(false))
  }, [family])

  const members = family?.members || []
  const goals   = [...new Set(members.flatMap(m => m.wellnessGoals || []))]

  return (
    <div className="page fade-in" style={{ background: 'var(--cream)' }}>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#1A3D20 0%,#2D6A35 100%)', padding: '18px 18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logo} alt="KP" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'contain', background: 'rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 500, letterSpacing: 0.2 }}>Welcome to Krisha Pure</div>
              <div style={{ color: '#fff', fontFamily: 'Playfair Display,serif', fontSize: 18, fontWeight: 700, marginTop: 2 }}>
                Eat Pure. Live Well. 🌿
              </div>
            </div>
          </div>
          {/* Profile icon */}
          <button
            onClick={() => nav('/profile')}
            style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>

        {/* Address chip */}
        {family?.apartmentName && (
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>🏠</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{family.apartmentName}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 }}>
                Flat {family.flatNo}{family.towerNo ? ` · ${family.towerNo}` : ''} · {family.city}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Active subscription banner ─────────────────── */}
      {activeSub && (
        <div style={{ margin: '12px 18px 0', background: 'var(--green-pale)', borderRadius: 12, padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--green-muted)' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Active Subscription</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{activeSub.planName}</div>
          </div>
          <button onClick={() => nav('/orders')} style={{ background: 'var(--green)', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Track →</button>
        </div>
      )}

      {/* ── Hero CTA banner ────────────────────────────── */}
      <div style={{ padding: '14px 18px 0' }}>
        <div
          onClick={() => nav('/goals')}
          style={{ background: 'linear-gradient(135deg,#2D6A35 0%,#4A9456 100%)', borderRadius: 16, padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Personalised For You</div>
            <div style={{ color: '#fff', fontFamily: 'Playfair Display,serif', fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>
              Get Your Wellness<br/>Basket Today
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8 }}>Based on your family's goals →</div>
          </div>
          {/* Produce basket illustration */}
          <div style={{ fontSize: 52, filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>🧺</div>
        </div>
      </div>

      {/* ── Family Goals strip ─────────────────────────── */}
      {goals.length > 0 && (
        <div style={{ padding: '14px 18px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 16, fontWeight: 600 }}>Family Goals</div>
            <button onClick={() => nav('/goals')} style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit →</button>
          </div>
          <div className="hscroll">
            {goals.slice(0, 6).map(g => (
              <span key={g} className="tag" style={{ whiteSpace: 'nowrap', padding: '5px 12px', fontSize: 12 }}>{g}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Curated Baskets ────────────────────────────── */}
      <div style={{ padding: '14px 18px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 16, fontWeight: 600 }}>Curated Baskets</div>
          <button onClick={() => nav('/goals')} style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>See all →</button>
        </div>
        {loading
          ? <div className="center" style={{ height: 120 }}><div className="spinner" style={{ width: 32, height: 32 }}/></div>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {baskets.map(b => (
                <div
                  key={b._id}
                  onClick={() => nav('/basket-detail', { state: { basket: b } })}
                  style={{ background: '#fff', borderRadius: 14, padding: '14px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
                  {/* Basket icon */}
                  <div style={{ fontSize: 30, marginBottom: 8 }}>🧺</div>
                  <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, marginBottom: 4 }}>{b.basketName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 8, lineHeight: 1.4 }}>{b.description}</div>
                  {b.wellnessGoal && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'var(--green-pale)', color: 'var(--green)', padding: '2px 8px', borderRadius: 50, fontSize: 10, fontWeight: 600, marginBottom: 8 }}>✓ {b.wellnessGoal}</div>
                  )}
                  <div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, color: 'var(--green)', fontSize: 16 }}>₹{b.price}</div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* ── Recent Order ───────────────────────────────── */}
      {recentOrder && (
        <div style={{ padding: '14px 18px 0' }}>
          <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Recent Order</div>
          <div className="card" onClick={() => nav(`/orders/${recentOrder._id}`)} style={{ cursor: 'pointer', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{recentOrder.orderNo}</div>
                <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
                  {new Date(recentOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <span className={`pill pill-${recentOrder.status}`}>{recentOrder.status.replace(/_/g,' ')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{recentOrder.items?.length || 0} items</span>
              <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: 16, fontFamily: 'Playfair Display,serif' }}>₹{recentOrder.totalAmount}</span>
            </div>
          </div>
        </div>
      )}

      {/* NOTE: "Set Up Your Family" card (Image 9) and "Add family members" (Image 8 annotation)
          are intentionally REMOVED per client request. Users reach setup via /goals flow. */}

      <div style={{ height: 24 }} />
      <BottomNav />
    </div>
  )
}
