import { useNavigate, useLocation } from 'react-router-dom'
import logo from '../assets/logo.jpeg'

export default function Confirmed() {
  const nav = useNavigate()
  const { state } = useLocation()
  const { order, basket, baskets=[], plan, multiBasket } = state || {}
  const allBaskets = multiBasket && baskets.length ? baskets : (basket ? [basket] : [])

  return (
    <div className="page-full fade-in" style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '36px 22px', textAlign: 'center',
      background: 'linear-gradient(180deg,var(--green-pale) 0%,var(--cream) 100%)',
    }}>
      {/* Success icon */}
      <div style={{
        width: 90, height: 90, borderRadius: '50%', background: 'var(--green)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 44, marginBottom: 20,
        boxShadow: '0 8px 28px rgba(45,106,53,0.3)',
        animation: 'popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
      }}>✅</div>

      <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: 26, marginBottom: 8 }}>Order Placed!</h1>
      <p style={{ marginBottom: 26, fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.6 }}>
        Your wellness basket is confirmed.<br/>Fresh produce is on its way 🌿
      </p>

      {/* Order summary card */}
      {order && (
        <div style={{ width: '100%', background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 20, border: '1px solid var(--border)', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{order.orderNo}</span>
            <span className="pill pill-placed">Placed</span>
          </div>
          {allBaskets.length > 1
            ? allBaskets.map((b, i) => (
                <Row key={i} label={b.basketName || 'Wellness Basket'} value={`₹${b.price}`} bold={i === 0} />
              ))
            : allBaskets[0] && <Row label={allBaskets[0].basketName || 'Wellness Basket'} value={`₹${allBaskets[0].price || order.totalAmount}`} bold />
          }
          {allBaskets.length > 1 && (
            <Row label="Total" value={`₹${order.totalAmount}`} bold />
          )}
          {plan    && <Row label="Plan" value={plan.name || plan.planName} />}
          {order.deliveryDate && <Row label="Delivery" value={new Date(order.deliveryDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} />}
          {order.deliverySlot && <Row label="Time" value={order.deliverySlot} />}
        </div>
      )}

      {/* Feature icons — matching Image 2 (leaf, produce, tractor) */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 26 }}>
        {[['🌿','Freshly\nPacked'],['🧼','Hygienic'],['🚜','Farm\nFresh']].map(([ic, lb]) => (
          <div key={lb} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 52, height: 52, background: 'var(--green-pale)', borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{ic}</div>
            <span style={{ fontSize: 10, color: 'var(--text-mid)', textAlign: 'center', whiteSpace: 'pre', fontWeight: 600, lineHeight: 1.4 }}>{lb}</span>
          </div>
        ))}
      </div>

      {/* Logo + tagline */}
      <img src={logo} alt="Krisha Pure" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'contain', marginBottom: 8 }} />
      <p style={{ fontFamily: 'Playfair Display,serif', fontSize: 15, fontStyle: 'italic', color: 'var(--green)', marginBottom: 24 }}>
        Eat Pure. Live Well.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
        <button className="btn btn-primary" onClick={() => nav('/orders')}>Track Order →</button>
        <button className="btn btn-ghost"   onClick={() => nav('/home')}>Back to Home</button>
      </div>

      <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.4)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 13, color: bold ? 'var(--text)' : 'var(--text-light)', fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
    </div>
  )
}
