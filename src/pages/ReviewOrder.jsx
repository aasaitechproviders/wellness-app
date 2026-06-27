import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { calcItemPrice } from '../components/ProductCatalog'

export default function ReviewOrder() {
  const nav = useNavigate()
  const { state } = useLocation()
  const { family } = useAuth()

  const multiBasket = state?.multiBasket || false
  const baskets     = state?.baskets || (state?.basket ? [state.basket] : [])
  const basket      = state?.basket   // single basket (legacy / customised)
  const items       = state?.items || []
  const plan        = state?.plan

  if (baskets.length === 0 && !plan) return (
    <div className="page-full center" style={{ minHeight:'100dvh', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:48 }}>📋</div><p>Nothing to review</p>
      <button className="btn btn-primary" onClick={() => nav('/goals')} style={{ width:160 }}>Start →</button>
    </div>
  )

  // Total: sum of all basket prices
  const total = multiBasket
    ? baskets.reduce((sum, b) => sum + (b.price || 0), 0)
    : (basket?.price || plan?.price || 699)

  const itemsWithPrice = items.map(it => ({
    ...it,
    linePrice: calcItemPrice(it.name, (it.weight || 200) * (it.qty || 1))
  }))

  return (
    <div className="page-shell">
      {/* Sticky header */}
      <div className="top-bar">
        <button className="back-btn" onClick={() => nav(-1)}>←</button>
        <div className="top-bar-title">Review Order</div>
      </div>

      {/* Scrollable content */}
      <div className="page-shell-scroll" style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:12 }}>

        {/* Multi-basket summary */}
        {multiBasket ? (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {baskets.map((b, i) => (
              <div key={i} style={{ background:'var(--green-pale)', borderRadius:12, padding:'12px 14px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: b.assignedMemberId ? 4 : 0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:20 }}>🧺</span>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13, color:'var(--green)' }}>{b.basketName}</div>
                      {b.wellnessGoal && <div style={{ fontSize:11, color:'var(--text-light)', marginTop:1 }}>✓ {b.wellnessGoal}</div>}
                    </div>
                  </div>
                  <div style={{ fontWeight:700, fontSize:14, color:'var(--green)' }}>₹{b.price}</div>
                </div>
                {b.assignedMemberId && b._assignedName && (
                  <div style={{ fontSize:11, color:'var(--text-mid)', marginLeft:30 }}>For: {b._assignedName}</div>
                )}
                {(b.extraProducts?.length > 0) && (
                  <div style={{ fontSize:11, color:'#B7791F', marginLeft:30, marginTop:2 }}>+ {b.extraProducts.length} extra item{b.extraProducts.length > 1 ? 's' : ''} added</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          basket && (
            <div style={{ background:'var(--green-pale)', borderRadius:10, padding:'10px 14px', fontWeight:600, fontSize:14, color:'var(--green)', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:22 }}>🧺</span>
              {basket.basketName} {items.length > 0 && items.length !== basket.ingredientNames?.length ? '(Customized)' : ''}
            </div>
          )
        )}

        {/* Quick summary */}
        <div className="card">
          <SRow label="Baskets"      value={`${baskets.length} basket${baskets.length > 1 ? 's' : ''}`} />
          {plan && <SRow label="Plan" value={plan?.name || plan?.planName || 'Weekly Plan'} />}
          <SRow label="Delivery Day" value="To be scheduled" />
        </div>

        {/* Items list — only for single basket with custom items */}
        {!multiBasket && itemsWithPrice.length > 0 && (
          <div className="card">
            <div style={{ fontWeight:600, fontSize:14, marginBottom:12 }}>Order Items</div>
            {itemsWithPrice.map((it, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom: i < itemsWithPrice.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:20 }}>{it.emoji || '🥗'}</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:500 }}>{it.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-light)', marginTop:1 }}>{(it.weight || 200) * (it.qty || 1)}g × {it.qty || 1}</div>
                  </div>
                </div>
                <span style={{ fontSize:14, fontWeight:600, color:'var(--green)' }}>₹{it.linePrice}</span>
              </div>
            ))}
          </div>
        )}

        {/* Delivery address */}
        {family && (
          <div className="card">
            <div style={{ fontWeight:600, fontSize:12, color:'var(--text-mid)', marginBottom:8, textTransform:'uppercase', letterSpacing:0.4 }}>Delivery Address</div>
            <div style={{ display:'flex', gap:10 }}>
              <span style={{ fontSize:18 }}>📍</span>
              <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.8 }}>
                <div style={{ fontWeight:600 }}>{family.apartmentName}</div>
                <div>Flat {family.flatNo}{family.towerNo ? `, ${family.towerNo}` : ''}</div>
                <div>{family.landmark ? family.landmark + ', ' : ''}{family.city || 'Coimbatore'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="card">
          {multiBasket && (
            <>
              {baskets.map((b, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:13, color:'var(--text-mid)' }}>{b.basketName}</span>
                  <span style={{ fontSize:13, fontWeight:600 }}>₹{b.price}</span>
                </div>
              ))}
              <div style={{ height:1, background:'var(--border)', margin:'8px 0 12px' }} />
            </>
          )}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:700, fontSize:15 }}>Total Amount</span>
            <span style={{ fontSize:28, fontWeight:700, color:'var(--green)' }}>₹{total}</span>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="sticky-footer">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginBottom:9 }}>
          <span>🔒</span><span style={{ fontSize:12, color:'var(--text-light)' }}>100% Secure Payments</span>
        </div>
        <button className="btn btn-primary" onClick={() => nav('/schedule', { state: { ...state, totalAmount: total, baskets, basket: baskets[0] } })}>
          Place Order →
        </button>
      </div>
    </div>
  )
}

function SRow({ label, value }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
      <span style={{ fontSize:14, color:'var(--text-light)' }}>{label}</span>
      <span style={{ fontSize:14, fontWeight:600 }}>{value}</span>
    </div>
  )
}
