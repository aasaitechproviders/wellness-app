import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { api } from '../api'
import BottomNav from '../components/BottomNav'
import { showToast } from '../components/Toast'
import logo from '../assets/logo.jpeg'

const CITIES = ['Coimbatore', 'Chennai']

export default function Home() {
  const { family, updateFamily } = useAuth()
  const { addToCart, removeFromCart, isInCart } = useCart()
  const nav = useNavigate()
  const [baskets, setBaskets]         = useState([])
  const [recentOrder, setRecentOrder] = useState(null)
  const [activeSub, setActiveSub]     = useState(null)
  const [loading, setLoading]         = useState(true)

  // ── Address change sheet state ────────────────────────────────────────────
  const [addrSheet, setAddrSheet]     = useState(false)
  const [addrSaving, setAddrSaving]   = useState(false)
  const [apts, setApts]               = useState([])
  const [aptLoading, setAptLoading]   = useState(false)
  const [aptSearch, setAptSearch]     = useState('')
  const [aptOpen, setAptOpen]         = useState(false)
  const [addr, setAddr] = useState({
    deliveryType: 'individual',
    city: 'Coimbatore',
    apartmentId: '', apartmentName: '',
    towerNo: '', flatNo: '',
    landmark: '', pincode: '',
  })

  useEffect(() => {
    if (!family) return
    const members = family?.members || []
    const goals   = [...new Set(members.flatMap(m => m.wellnessGoals || []))]
    const basketFetches = goals.length > 0
      ? goals.map(g => api.getBaskets({ goal: g }).catch(() => ({ baskets: [] })))
      : [api.getBaskets({ featured: 'true' }).catch(() => ({ baskets: [] }))]

    Promise.all([
      Promise.all(basketFetches),
      family?._id ? api.getOrders(family._id).catch(() => ({ orders: [] })) : { orders: [] },
      family?._id ? api.getSubscriptions(family._id).catch(() => ({ subscriptions: [] })) : { subscriptions: [] },
    ]).then(([basketResults, o, s]) => {
      const seen = new Set()
      const merged = []
      for (const r of basketResults) {
        for (const b of (r.baskets || [])) {
          if (!seen.has(b._id?.toString())) { seen.add(b._id?.toString()); merged.push(b) }
        }
      }
      setBaskets(merged.slice(0, 4))
      setRecentOrder(o.orders?.[0] || null)
      setActiveSub(s.subscriptions?.find(x => x.status === 'active') || null)
    }).finally(() => setLoading(false))
  }, [family])

  // ── Open address sheet: pre-fill from family ──────────────────────────────
  const openAddrSheet = () => {
    const deliveryType = family?.apartmentId ? 'gated' : 'individual'
    const addrStr = family?.address || ''
    const parts   = addrStr.split(',').map(s => s.trim())
    const pincode = parts.find(p => /^\d{6}$/.test(p)) || ''
    const landmark = parts.filter(p => p !== pincode).join(', ')
    setAddr({
      deliveryType,
      city:          family?.city || 'Coimbatore',
      apartmentId:   family?.apartmentId || '',
      apartmentName: family?.apartmentName || '',
      towerNo:       family?.towerNo || '',
      flatNo:        family?.flatNo || '',
      landmark:      deliveryType === 'individual' ? landmark : '',
      pincode:       deliveryType === 'individual' ? pincode  : '',
    })
    setAptSearch('')
    setAptOpen(false)
    setAddrSheet(true)
  }

  // ── Load apartments when gated is selected ────────────────────────────────
  useEffect(() => {
    if (!addrSheet || addr.deliveryType !== 'gated') return
    setAptLoading(true)
    api.getApartments(addr.city)
      .then(d => setApts(d.apartments || []))
      .catch(() => {})
      .finally(() => setAptLoading(false))
  }, [addrSheet, addr.deliveryType, addr.city])

  const setA = (k, v) => setAddr(p => ({ ...p, [k]: v }))

  const saveAddress = async () => {
    if (!addr.flatNo) return showToast('Flat number is required', 'error')
    if (addr.deliveryType === 'individual' && !addr.apartmentName) return showToast('Building name is required', 'error')
    if (addr.deliveryType === 'gated' && !addr.apartmentName) return showToast('Please select an apartment', 'error')
    setAddrSaving(true)
    try {
      const body = {
        apartmentId:   addr.deliveryType === 'gated' ? addr.apartmentId : null,
        apartmentName: addr.apartmentName,
        flatNo:        addr.flatNo,
        towerNo:       addr.towerNo || '',
        address:       addr.deliveryType === 'individual'
          ? [addr.landmark, addr.pincode].filter(Boolean).join(', ')
          : '',
        city: addr.city,
      }
      const d = await api.updateFamily(family._id, body)
      updateFamily(d.family)
      showToast('Address updated ✓', 'success')
      setAddrSheet(false)
    } catch(e) {
      showToast(e.message || 'Failed to save', 'error')
    } finally {
      setAddrSaving(false)
    }
  }

  const filteredApts = apts.filter(a =>
    a.apartmentName?.toLowerCase().includes(aptSearch.toLowerCase())
  )

  const members = family?.members || []
  const goals   = [...new Set(members.flatMap(m => m.wellnessGoals || []))]

  return (
    <div className="page-shell fade-in">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#1A3D20 0%,#2D6A35 100%)', padding: '18px 18px 20px', flexShrink: 0 }}>
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
          <button
            onClick={() => nav('/profile')}
            style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>

        {/* Address chip — clickable to change address */}
        {family?.apartmentName ? (
          <button
            onClick={openAddrSheet}
            style={{ width: '100%', background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: 14 }}>🏠</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{family.apartmentName}</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 }}>
                Flat {family.flatNo}{family.towerNo ? ` · ${family.towerNo}` : ''} · {family.city}
              </div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>Change ›</span>
          </button>
        ) : (
          <button
            onClick={openAddrSheet}
            style={{ width: '100%', background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8, border: '1.5px dashed rgba(255,255,255,0.3)', cursor: 'pointer' }}>
            <span style={{ fontSize: 14 }}>📍</span>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600 }}>Add your delivery address</div>
          </button>
        )}
      </div>

      {/* ── Scrollable content ─────────────────────────────────────────── */}
      <div className="page-shell-scroll with-nav">

        {/* Active subscription banner */}
        {activeSub && (
          <div style={{ margin: '12px 18px 0', background: 'var(--green-pale)', borderRadius: 12, padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--green-muted)' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Active Subscription</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{activeSub.planName}</div>
            </div>
            <button onClick={() => nav('/orders')} style={{ background: 'var(--green)', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 50, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Track →</button>
          </div>
        )}

        {/* Hero CTA */}
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
            <div style={{ fontSize: 52, filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>🧺</div>
          </div>
        </div>

        {/* Family Goals strip */}
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

        {/* Curated Baskets */}
        <div style={{ padding: '14px 18px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 16, fontWeight: 600 }}>Curated Baskets</div>
            <button onClick={() => nav('/goals')} style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>See all →</button>
          </div>
          {loading
            ? <div className="center" style={{ height: 120 }}><div className="spinner" style={{ width: 32, height: 32 }}/></div>
            : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {baskets.map(b => {
                  const inCart = isInCart(b._id)
                  return (
                    <div
                      key={b._id}
                      style={{ background: '#fff', borderRadius: 14, padding: '14px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 30, marginBottom: 8 }}>🧺</div>
                      <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3, marginBottom: 4 }}>{b.basketName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 8, lineHeight: 1.4 }}>{b.description}</div>
                      {b.wellnessGoal && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'var(--green-pale)', color: 'var(--green)', padding: '2px 8px', borderRadius: 50, fontSize: 10, fontWeight: 600, marginBottom: 8 }}>✓ {b.wellnessGoal}</div>
                      )}
                      <div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, color: 'var(--green)', fontSize: 16, marginBottom: 10 }}>₹{b.price}</div>

                      {/* Add / Remove from Cart */}
                      {inCart ? (
                        <div style={{ display: 'flex', gap: 5, marginTop: 'auto' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); nav('/cart') }}
                            style={{ flex: 1, padding: '8px 0', background: 'var(--green-pale)', color: 'var(--green)', border: '1.5px solid var(--green)', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            ✓ In Cart
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeFromCart(b._id); showToast(`${b.basketName} removed`, 'success') }}
                            style={{ width: 32, height: 32, flexShrink: 0, background: '#FEE2E2', border: 'none', borderRadius: 8, color: '#DC2626', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(b); showToast(`${b.basketName} added to cart 🛒`, 'success') }}
                          style={{ width: '100%', padding: '8px 0', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 'auto' }}>
                          🛒 Add to Cart
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>

        {/* Recent Order */}
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

        <div style={{ height: 24 }} />
      </div>{/* end page-shell-scroll */}

      <BottomNav />

      {/* ── Address Change Bottom Sheet ─────────────────────────────────── */}
      {addrSheet && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setAddrSheet(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} />

          {/* Sheet */}
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: '100%', maxWidth: 430,
            background: '#fff', borderRadius: '20px 20px 0 0',
            zIndex: 201, maxHeight: '88vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
          }}>
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 10px' }}>
              <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 17, fontWeight: 700 }}>Change Delivery Address</div>
              <button onClick={() => setAddrSheet(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-light)', lineHeight: 1 }}>✕</button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* City */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>City</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {CITIES.map(c => (
                    <div key={c} onClick={() => setA('city', c)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${addr.city === c ? 'var(--green)' : 'var(--border)'}`, background: addr.city === c ? 'var(--green-pale)' : '#fff', cursor: 'pointer' }}>
                      <div style={{ width: 15, height: 15, borderRadius: '50%', border: `2px solid ${addr.city === c ? 'var(--green)' : 'var(--border)'}`, background: addr.city === c ? 'var(--green)' : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {addr.city === c && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: addr.city === c ? 'var(--green)' : 'var(--text)' }}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery type */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Location Type</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { id: 'individual', icon: '🏠', label: 'Individual Home', sub: 'Enter address manually' },
                    { id: 'gated', icon: '🏘️', label: 'Gated Community', sub: 'Select from registered apartments' },
                  ].map(({ id, icon, label, sub }) => (
                    <div key={id} onClick={() => { setA('deliveryType', id); setA('apartmentName', ''); setA('apartmentId', '') }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 10, border: `1.5px solid ${addr.deliveryType === id ? 'var(--green)' : 'var(--border)'}`, background: addr.deliveryType === id ? 'var(--green-pale)' : '#fff', cursor: 'pointer' }}>
                      <span style={{ fontSize: 20 }}>{icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: addr.deliveryType === id ? 'var(--green)' : 'var(--text)' }}>{label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 1 }}>{sub}</div>
                      </div>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${addr.deliveryType === id ? 'var(--green)' : 'var(--border)'}`, background: addr.deliveryType === id ? 'var(--green)' : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {addr.deliveryType === id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual Home fields */}
              {addr.deliveryType === 'individual' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SheetField label="Building / Apartment Name *">
                    <input className="input-field" placeholder="e.g. Green Meadows" value={addr.apartmentName} onChange={e => setA('apartmentName', e.target.value)} />
                  </SheetField>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <SheetField label="Tower / Block">
                      <input className="input-field" placeholder="Block A" value={addr.towerNo} onChange={e => setA('towerNo', e.target.value)} />
                    </SheetField>
                    <SheetField label="Flat Number *">
                      <input className="input-field" placeholder="B-101" value={addr.flatNo} onChange={e => setA('flatNo', e.target.value)} />
                    </SheetField>
                  </div>
                  <SheetField label="Landmark / Street">
                    <input className="input-field" placeholder="Near metro / temple" value={addr.landmark} onChange={e => setA('landmark', e.target.value)} />
                  </SheetField>
                  <SheetField label="Pincode">
                    <input className="input-field" type="tel" inputMode="numeric" maxLength={6} placeholder="641001" value={addr.pincode} onChange={e => setA('pincode', e.target.value.replace(/\D/g,''))} />
                  </SheetField>
                </div>
              )}

              {/* Gated Community fields */}
              {addr.deliveryType === 'gated' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SheetField label="Select Apartment / Wellness Partner">
                    <div style={{ position: 'relative' }}>
                      <div
                        onClick={() => setAptOpen(o => !o)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 12px', border: `1.5px solid ${addr.apartmentName ? 'var(--green)' : 'var(--border)'}`, borderRadius: 10, background: addr.apartmentName ? 'var(--green-pale)' : '#fff', cursor: 'pointer', minHeight: 44 }}>
                        <span style={{ fontSize: 13, color: addr.apartmentName ? 'var(--green)' : 'var(--text-light)', fontWeight: addr.apartmentName ? 600 : 400 }}>
                          {addr.apartmentName || 'Search apartment…'}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-light)' }}>{aptOpen ? '▲' : '▼'}</span>
                      </div>

                      {aptOpen && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1.5px solid var(--green-muted)', borderRadius: 12, zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                            <input autoFocus className="input-field" style={{ marginBottom: 0 }} placeholder="🔍 Type to search…" value={aptSearch} onChange={e => setAptSearch(e.target.value)} />
                          </div>
                          <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                            {aptLoading ? (
                              <div style={{ padding: 16, textAlign: 'center' }}><div className="spinner" style={{ width: 22, height: 22, margin: '0 auto' }} /></div>
                            ) : filteredApts.length === 0 ? (
                              <div style={{ padding: 14, textAlign: 'center', fontSize: 12, color: 'var(--text-light)' }}>
                                {apts.length === 0 ? 'No apartments found for this city' : 'No results'}
                              </div>
                            ) : filteredApts.map((apt, i) => (
                              <div key={apt._id || i}
                                onClick={() => { setA('apartmentName', apt.apartmentName); setA('apartmentId', apt.apartmentId || apt._id?.toString() || ''); setA('city', apt.city || addr.city); setAptOpen(false); setAptSearch('') }}
                                style={{ padding: '11px 12px', borderBottom: i < filteredApts.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', background: addr.apartmentName === apt.apartmentName ? 'var(--green-pale)' : '#fff' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: addr.apartmentName === apt.apartmentName ? 'var(--green)' : 'var(--text)' }}>{apt.apartmentName}</div>
                                {apt.city && <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 1 }}>{apt.city}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </SheetField>

                  {addr.apartmentName && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <SheetField label="Tower / Block">
                        <input className="input-field" placeholder="Block A" value={addr.towerNo} onChange={e => setA('towerNo', e.target.value)} />
                      </SheetField>
                      <SheetField label="Flat Number *">
                        <input className="input-field" placeholder="B-101" value={addr.flatNo} onChange={e => setA('flatNo', e.target.value)} />
                      </SheetField>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Save button */}
            <div style={{ padding: '12px 20px 28px', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-primary" onClick={saveAddress} disabled={addrSaving}>
                {addrSaving && <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />}
                {addrSaving ? 'Saving…' : 'Save Address ✓'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SheetField({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      {children}
    </div>
  )
}
