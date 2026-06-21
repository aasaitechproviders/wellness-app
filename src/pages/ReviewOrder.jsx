import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { calcItemPrice } from '../components/ProductCatalog'

export default function ReviewOrder() {
  const nav = useNavigate()
  const { state } = useLocation()
  const { family } = useAuth()
  const basket = state?.basket
  const items  = state?.items || []
  const plan   = state?.plan

  if (!basket && !plan) return (
    <div className="page-full center" style={{ minHeight:'100dvh', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:48 }}>📋</div><p>Nothing to review</p>
      <button className="btn btn-primary" onClick={() => nav('/goals')} style={{ width:160 }}>Start →</button>
    </div>
  )

  // Use basket price as total (already includes extras calculated in BasketDetail)
  const total = basket?.price || plan?.price || 699

  // Calculate per-item prices using shared calcItemPrice (same as BasketDetail)
  const itemsWithPrice = items.map(it => ({
    ...it,
    linePrice: calcItemPrice(it.name, (it.weight || 200) * (it.qty || 1))
  }))

  return (
    <div className="page-full fade-in" style={{ minHeight:'100dvh', background:'var(--cream)', paddingBottom:90 }}>
      <div className="top-bar">
        <button className="back-btn" onClick={() => nav(-1)}>←</button>
        <div className="top-bar-title">Review Order</div>
      </div>

      <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:12 }}>

        {/* Basket label */}
        {basket && (
          <div style={{ background:'var(--green-pale)', borderRadius:10, padding:'10px 14px', fontWeight:600, fontSize:14, color:'var(--green)', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:22 }}>🛒</span>
            {basket.basketName} {items.length > 0 && items.length !== basket.ingredientNames?.length ? '(Customized)' : ''}
          </div>
        )}

        {/* Quick summary */}
        <div className="card">
          <SRow label="Items"        value={`${items.length || basket?.ingredientNames?.length || 0} items`} />
          <SRow label="Plan"         value={plan?.name || plan?.planName || 'Weekly Plan'} />
          <SRow label="Delivery Day" value="To be scheduled" />
        </div>

        {/* Items list */}
        {items.length > 0 && (
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
                <div>{family.address}, {family.city}</div>
              </div>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:700, fontSize:15 }}>Total Amount</span>
            <span style={{ fontFamily:'Playfair Display,serif', fontSize:28, fontWeight:700, color:'var(--green)' }}>₹{total}</span>
          </div>
        </div>
      </div>

      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, padding:'12px 18px 26px', background:'#fff', borderTop:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginBottom:9 }}>
          <span>🔒</span><span style={{ fontSize:12, color:'var(--text-light)' }}>100% Secure Payments</span>
        </div>
        <button className="btn btn-primary" onClick={() => nav('/schedule', { state })}>Place Order →</button>
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
