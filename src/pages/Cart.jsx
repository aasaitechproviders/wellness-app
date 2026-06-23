import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { showToast } from '../components/Toast'
import BottomNav from '../components/BottomNav'

export default function Cart() {
  const nav = useNavigate()
  const { cartItems, removeFromCart, clearCart, cartTotal, cartCount } = useCart()

  const handleCheckout = () => {
    if (cartItems.length === 0) return showToast('Your cart is empty', 'error')
    // Pass all baskets and combined total to review order
    nav('/review-order', {
      state: {
        baskets:     cartItems,
        basket:      cartItems[0],           // primary basket (for legacy compat)
        items:       cartItems.flatMap(b => (b.ingredientNames || []).map(n => ({ name: n, qty: 1, weight: 200, emoji: '🥗' }))),
        totalAmount: cartTotal,
        multiBasket: true,
      }
    })
  }

  return (
    <div className="page fade-in" style={{ background: 'var(--cream)', paddingBottom: 100 }}>
      <div className="top-bar">
        <button className="back-btn" onClick={() => nav('/home')}>←</button>
        <div className="top-bar-title">My Cart</div>
        {cartCount > 0 && (
          <button
            onClick={() => { clearCart(); showToast('Cart cleared', 'success') }}
            style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}>
            Clear
          </button>
        )}
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {cartCount === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', gap: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 64 }}>🛒</div>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 20, fontWeight: 700 }}>Your cart is empty</div>
            <div style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.6 }}>Add wellness baskets from the home screen<br/>based on your family's goals</div>
            <button className="btn btn-primary" onClick={() => nav('/home')} style={{ width: 200, marginTop: 8 }}>
              Browse Baskets →
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 4 }}>
              {cartCount} basket{cartCount > 1 ? 's' : ''} in your cart
            </div>

            {/* Basket cards */}
            {cartItems.map((b, i) => (
              <div key={b._id || i} style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {/* Icon */}
                    <div style={{ width: 52, height: 52, background: 'var(--green-pale)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                      🧺
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{b.basketName}</div>
                      {b.description && (
                        <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 6, lineHeight: 1.4 }}>{b.description}</div>
                      )}
                      {b.wellnessGoal && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'var(--green-pale)', color: 'var(--green)', padding: '2px 8px', borderRadius: 50, fontSize: 10, fontWeight: 600 }}>
                          ✓ {b.wellnessGoal}
                        </div>
                      )}
                    </div>
                    {/* Remove button */}
                    <button
                      onClick={() => { removeFromCart(b._id); showToast(`${b.basketName} removed`, 'success') }}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: '#FEE2E2', border: 'none', color: '#DC2626', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      ✕
                    </button>
                  </div>

                  {/* Ingredients preview */}
                  {b.ingredientNames?.length > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 4 }}>Includes</div>
                      <div style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.7 }}>
                        {b.ingredientNames.slice(0, 4).join(', ')}
                        {b.ingredientNames.length > 4 ? ` + ${b.ingredientNames.length - 4} more` : ''}
                      </div>
                    </div>
                  )}

                  {/* Price row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                    <button
                      onClick={() => nav('/basket-detail', { state: { basket: b } })}
                      style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, background: 'none', border: '1px solid var(--green-muted)', borderRadius: 50, padding: '5px 12px', cursor: 'pointer' }}>
                      View Details
                    </button>
                    <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>
                      ₹{b.price}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Order Summary */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: '14px 16px', marginTop: 4 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-mid)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>Order Summary</div>

              {cartItems.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>{b.basketName}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>₹{b.price}</span>
                </div>
              ))}

              <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Total</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>{cartCount} basket{cartCount > 1 ? 's' : ''}</div>
                </div>
                <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 26, fontWeight: 700, color: 'var(--green)' }}>
                  ₹{cartTotal}
                </div>
              </div>
            </div>

            {/* Add more */}
            <button
              onClick={() => nav('/home')}
              style={{ width: '100%', padding: '12px', background: 'var(--green-pale)', border: '1.5px dashed var(--green-muted)', borderRadius: 12, fontSize: 13, fontWeight: 600, color: 'var(--green)', cursor: 'pointer' }}>
              + Add More Baskets
            </button>
          </>
        )}
      </div>

      {/* Fixed checkout CTA */}
      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 64, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, padding: '12px 18px', background: '#fff', borderTop: '1px solid var(--border)', zIndex: 40 }}>
          <button className="btn btn-primary" onClick={handleCheckout}>
            Proceed to Order → ₹{cartTotal}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
