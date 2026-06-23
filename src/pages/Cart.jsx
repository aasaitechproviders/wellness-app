import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { showToast } from '../components/Toast'
import ProductCatalog from '../components/ProductCatalog'
import BottomNav from '../components/BottomNav'

export default function Cart() {
  const nav = useNavigate()
  const { family } = useAuth()
  const { cartItems, removeFromCart, clearCart, updateCartItem, cartTotal, cartCount } = useCart()

  // Track which basket's ingredient list is expanded
  const [expanded, setExpanded]     = useState({})
  // Track which basket the product catalog is open for
  const [catalogFor, setCatalogFor] = useState(null)

  const members = family?.members || []

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  const assignMember = (basketId, memberId) => {
    updateCartItem(basketId, { assignedMemberId: memberId })
  }

  const addExtraProduct = (basketId, ingredient) => {
    const basket = cartItems.find(b => b._id?.toString() === basketId)
    if (!basket) return
    const extras = basket.extraProducts || []
    if (extras.find(e => e.name === ingredient.name)) {
      showToast(`${ingredient.name} already added`, 'error'); return
    }
    updateCartItem(basketId, { extraProducts: [...extras, { name: ingredient.name, category: ingredient.category }] })
    showToast(`${ingredient.name} added to basket ✓`, 'success')
  }

  const removeExtra = (basketId, name) => {
    const basket = cartItems.find(b => b._id?.toString() === basketId)
    if (!basket) return
    updateCartItem(basketId, { extraProducts: (basket.extraProducts || []).filter(e => e.name !== name) })
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) return showToast('Your cart is empty', 'error')
    nav('/review-order', {
      state: {
        baskets:     cartItems,
        basket:      cartItems[0],
        items:       cartItems.flatMap(b => [
          ...(b.ingredientNames || []).map(n => ({ name: n, qty: 1, weight: 200, emoji: '🥗' })),
          ...(b.extraProducts  || []).map(p => ({ name: p.name, qty: 1, weight: 200, emoji: '🥗' })),
        ]),
        totalAmount: cartTotal,
        multiBasket: true,
      }
    })
  }

  const currentBasket = catalogFor ? cartItems.find(b => b._id?.toString() === catalogFor) : null
  const addedNamesForCatalog = currentBasket
    ? [...(currentBasket.ingredientNames || []), ...(currentBasket.extraProducts || []).map(e => e.name)]
    : []

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100dvh', background:'var(--cream)' }}>

      {/* ── STICKY HEADER ── */}
      <div style={{ position:'sticky', top:0, zIndex:50, background:'#fff', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, padding:'14px 18px 12px', flexShrink:0 }}>
        <button className="back-btn" onClick={() => nav('/home')}>←</button>
        <div style={{ fontFamily:'var(--font-head)', fontSize:17, fontWeight:600, flex:1 }}>My Cart</div>
        {cartCount > 0 && (
          <button onClick={() => { clearCart(); showToast('Cart cleared', 'success') }}
            style={{ fontSize:12, color:'#DC2626', background:'none', border:'none', cursor:'pointer', fontWeight:600, padding:'4px 8px' }}>
            Clear All
          </button>
        )}
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 18px', paddingBottom: cartCount > 0 ? 140 : 80 }}>

        {cartCount === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:16, textAlign:'center' }}>
            <div style={{ fontSize:64 }}>🛒</div>
            <div style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700 }}>Your cart is empty</div>
            <div style={{ fontSize:14, color:'var(--text-light)', lineHeight:1.6 }}>Add wellness baskets from the home screen<br/>based on your family's goals</div>
            <button className="btn btn-primary" onClick={() => nav('/home')} style={{ width:200, marginTop:8 }}>Browse Baskets →</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize:13, color:'var(--text-light)', marginBottom:12 }}>
              {cartCount} basket{cartCount > 1 ? 's' : ''} · ₹{cartTotal} total
            </div>

            {/* ── BASKET CARDS ── */}
            {cartItems.map((b, i) => {
              const isOpen   = !!expanded[b._id]
              const extras   = b.extraProducts || []
              const allIngs  = [...(b.ingredientNames || []), ...extras.map(e => e.name)]
              const assigned = members.find(m => m.memberId === b.assignedMemberId)

              return (
                <div key={b._id || i} style={{ background:'#fff', borderRadius:16, border:'1px solid var(--border)', marginBottom:12, overflow:'hidden' }}>

                  {/* Card header */}
                  <div style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                      <div style={{ width:48, height:48, background:'var(--green-pale)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>🧺</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{b.basketName}</div>
                        {b.description && <div style={{ fontSize:12, color:'var(--text-light)', lineHeight:1.4, marginBottom:4 }}>{b.description}</div>}
                        {b.wellnessGoal && (
                          <div style={{ display:'inline-flex', alignItems:'center', gap:3, background:'var(--green-pale)', color:'var(--green)', padding:'2px 8px', borderRadius:50, fontSize:10, fontWeight:600 }}>
                            ✓ {b.wellnessGoal}
                          </div>
                        )}
                      </div>
                      {/* Price + Remove */}
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
                        <button onClick={() => { removeFromCart(b._id); showToast(`${b.basketName} removed`, 'success') }}
                          style={{ width:26, height:26, borderRadius:'50%', background:'#FEE2E2', border:'none', color:'#DC2626', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                        <div style={{ fontFamily:'Playfair Display,serif', fontSize:18, fontWeight:700, color:'var(--green)' }}>₹{b.price}</div>
                      </div>
                    </div>

                    {/* Member assignment */}
                    {members.length > 0 && (
                      <div style={{ marginTop:12 }}>
                        <div style={{ fontSize:11, color:'var(--text-light)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.4, marginBottom:6 }}>For</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                          {members.map(m => {
                            const sel = b.assignedMemberId === m.memberId
                            return (
                              <button key={m.memberId} onClick={() => assignMember(b._id, sel ? null : m.memberId)}
                                style={{ padding:'4px 12px', borderRadius:50, fontSize:12, fontWeight:600, border:`1.5px solid ${sel?'var(--green)':'var(--border)'}`, background:sel?'var(--green)':'#fff', color:sel?'#fff':'var(--text)', cursor:'pointer', transition:'all 0.15s' }}>
                                {m.gender==='Male'?'👨':'👩'} {m.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Toggle ingredients */}
                    <button onClick={() => toggleExpand(b._id)}
                      style={{ width:'100%', marginTop:12, padding:'8px 0', background:'var(--cream)', border:'none', borderRadius:8, fontSize:12, fontWeight:600, color:'var(--text-mid)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      <span>{isOpen ? 'Hide' : 'Show'} contents ({allIngs.length} items)</span>
                      <span style={{ fontSize:14, transition:'transform 0.2s', display:'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </button>
                  </div>

                  {/* Collapsible ingredient list */}
                  {isOpen && (
                    <div style={{ borderTop:'1px solid var(--border)', background:'var(--cream)' }}>
                      {/* Base ingredients */}
                      {(b.ingredientNames || []).map((name, idx) => (
                        <div key={idx} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 16px', borderBottom:'1px solid var(--border)', background:'#fff' }}>
                          <span style={{ fontSize:16 }}>🥗</span>
                          <span style={{ fontSize:13, flex:1 }}>{name}</span>
                          <span style={{ fontSize:10, color:'var(--text-light)', background:'var(--cream)', padding:'2px 8px', borderRadius:50 }}>Basket</span>
                        </div>
                      ))}
                      {/* Extra / custom products */}
                      {extras.map((e, idx) => (
                        <div key={idx} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 16px', borderBottom:'1px solid var(--border)', background:'#FFF9C4' }}>
                          <span style={{ fontSize:16 }}>➕</span>
                          <span style={{ fontSize:13, flex:1 }}>{e.name}</span>
                          <span style={{ fontSize:10, color:'#B7791F', background:'#FEF9C3', padding:'2px 8px', borderRadius:50, marginRight:4 }}>Added</span>
                          <button onClick={() => removeExtra(b._id, e.name)}
                            style={{ background:'none', border:'none', color:'#DC2626', fontSize:14, cursor:'pointer', padding:'0 4px' }}>✕</button>
                        </div>
                      ))}
                      {/* Add more products CTA */}
                      <button onClick={() => setCatalogFor(b._id)}
                        style={{ width:'100%', padding:'11px 16px', background:'none', border:'none', fontSize:13, fontWeight:600, color:'var(--green)', cursor:'pointer', display:'flex', alignItems:'center', gap:8, borderTop: extras.length ? '1px solid var(--border)' : 'none' }}>
                        <span style={{ fontSize:16 }}>🔍</span> Add More Products to this Basket
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Order Summary — basket names + total only, no per-product prices */}
            <div style={{ background:'#fff', borderRadius:16, border:'1px solid var(--border)', padding:'14px 16px', marginBottom:12 }}>
              <div style={{ fontWeight:700, fontSize:12, color:'var(--text-mid)', marginBottom:12, textTransform:'uppercase', letterSpacing:0.4 }}>Order Summary</div>
              {cartItems.map((b, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:13, color:'var(--text-mid)' }}>{b.basketName}</div>
                    {b.assignedMemberId && members.find(m => m.memberId === b.assignedMemberId) && (
                      <div style={{ fontSize:11, color:'var(--text-light)', marginTop:1 }}>
                        For {members.find(m => m.memberId === b.assignedMemberId)?.name}
                      </div>
                    )}
                    {(b.extraProducts?.length > 0) && (
                      <div style={{ fontSize:11, color:'#B7791F', marginTop:1 }}>+ {b.extraProducts.length} extra item{b.extraProducts.length > 1 ? 's' : ''}</div>
                    )}
                  </div>
                  <span style={{ fontSize:13, fontWeight:600 }}>₹{b.price}</span>
                </div>
              ))}
              <div style={{ height:1, background:'var(--border)', margin:'10px 0' }} />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15 }}>Total</div>
                  <div style={{ fontSize:11, color:'var(--text-light)', marginTop:2 }}>{cartCount} basket{cartCount > 1 ? 's' : ''}</div>
                </div>
                <div style={{ fontFamily:'Playfair Display,serif', fontSize:26, fontWeight:700, color:'var(--green)' }}>₹{cartTotal}</div>
              </div>
            </div>

            {/* Add more baskets */}
            <button onClick={() => nav('/home')}
              style={{ width:'100%', padding:'12px', background:'var(--green-pale)', border:'1.5px dashed var(--green-muted)', borderRadius:12, fontSize:13, fontWeight:600, color:'var(--green)', cursor:'pointer' }}>
              + Add More Baskets
            </button>
          </>
        )}
      </div>

      {/* ── FIXED FOOTER CTA ── */}
      {cartCount > 0 && (
        <div style={{ position:'sticky', bottom:0, zIndex:40, background:'#fff', borderTop:'1px solid var(--border)', padding:'12px 18px', paddingBottom:'calc(12px + env(safe-area-inset-bottom))' }}>
          <button className="btn btn-primary" onClick={handleCheckout}>
            Proceed to Order → ₹{cartTotal}
          </button>
        </div>
      )}

      {/* Bottom nav sits below the sticky footer */}
      <BottomNav />

      {/* Product catalog bottom sheet */}
      <ProductCatalog
        visible={!!catalogFor}
        onClose={() => setCatalogFor(null)}
        onAdd={(ing) => { addExtraProduct(catalogFor, ing); }}
        addedNames={addedNamesForCatalog}
      />
    </div>
  )
}
