import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import BottomNav from '../components/BottomNav'

export function Orders() {
  const { family } = useAuth()
  const nav = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!family?._id) return
    api.getOrders(family._id)
      .then(d => setOrders(d.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [family])

  return (
    <div className="page-shell fade-in">
      <div className="top-bar">
        <div className="top-bar-title">My Orders</div>
      </div>

      <div className="page-shell-scroll with-nav">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No Orders Yet</h3>
            <p>Your wellness basket orders will appear here</p>
            <button className="btn btn-primary" onClick={() => nav('/goals')} style={{ marginTop:8, width:'auto', padding:'12px 24px' }}>
              Get a Basket →
            </button>
          </div>
        ) : (
          <div style={{ padding:'16px 20px' }}>
            {orders.map(order => (
              <div key={order._id} className="card" onClick={() => nav(`/orders/${order._id}`)}
                style={{ marginBottom:12, cursor:'pointer' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{order.orderNo}</div>
                    <div style={{ fontSize:12, color:'var(--text-light)', marginTop:2 }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    </div>
                  </div>
                  <span className={`status-pill status-${order.status}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
                {order.deliveryDate && (
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                    <span style={{ fontSize:13 }}>📅</span>
                    <span style={{ fontSize:13, color:'var(--text-mid)' }}>
                      {new Date(order.deliveryDate).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })}
                      {order.deliverySlot ? ` · ${order.deliverySlot}` : ''}
                    </span>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:13, color:'var(--text-light)' }}>{order.items?.length || 0} items</span>
                  <span style={{ fontWeight:700, color:'var(--green)', fontSize:17 }}>
                    ₹{order.totalAmount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>{/* end page-shell-scroll */}

      <BottomNav />
    </div>
  )
}

export function OrderDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.getOrder(id).then(d => setOrder(d.order)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="page-shell" style={{ alignItems:'center', justifyContent:'center' }}><div className="spinner" style={{ width:36, height:36 }} /></div>
  if (!order)  return <div className="page-shell" style={{ alignItems:'center', justifyContent:'center' }}><p>Order not found</p></div>

  const STATUS_STEPS = ['placed','confirmed','packed','out_for_delivery','delivered']
  const curStep = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="page-shell fade-in">
      {/* Top bar */}
      <div className="top-bar">
        <button className="back-btn" onClick={() => nav(-1)}>←</button>
        <div className="top-bar-title">{order.orderNo}</div>
        <span className={`status-pill status-${order.status}`}>{order.status.replace(/_/g,' ')}</span>
      </div>

      <div className="page-shell-scroll">
      <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>

        {/* Progress tracker */}
        {order.status !== 'cancelled' && (
          <div className="card">
            <div style={{ fontWeight:600, fontSize:14, marginBottom:16 }}>Order Progress</div>
            <div style={{ display:'flex', alignItems:'flex-start', position:'relative' }}>
              {STATUS_STEPS.map((s, i) => (
                <div key={s} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5, position:'relative' }}>
                  {i < STATUS_STEPS.length - 1 && (
                    <div style={{ position:'absolute', top:10, left:'50%', width:'100%', height:2, background: i < curStep ? 'var(--green)' : 'var(--border)', zIndex:0 }} />
                  )}
                  <div style={{ width:22, height:22, borderRadius:'50%', zIndex:1, background: i <= curStep ? 'var(--green)' : 'var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff', fontWeight:700 }}>
                    {i < curStep ? '✓' : i + 1}
                  </div>
                  <div style={{ fontSize:9, color: i <= curStep ? 'var(--green)' : 'var(--text-light)', textAlign:'center', fontWeight:600, textTransform:'capitalize', lineHeight:1.3 }}>
                    {s.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delivery info */}
        <div className="card">
          <div style={{ fontWeight:600, fontSize:14, marginBottom:12 }}>Delivery Details</div>
          <InfoRow icon="📅" label="Date"    value={order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN',{ weekday:'long', day:'numeric', month:'long' }) : '–'} />
          <InfoRow icon="🕐" label="Slot"    value={order.deliverySlot || '–'} />
          <InfoRow icon="📍" label="Address" value={`${order.apartmentName || ''}, Flat ${order.flatNo || ''}${order.towerNo ? `, ${order.towerNo}` : ''}, ${order.city || ''}`} />
        </div>

        {/* Items */}
        {order.items?.length > 0 && (
          <div className="card">
            <div style={{ fontWeight:600, fontSize:14, marginBottom:12 }}>Items ({order.items.length})</div>
            {order.items.map((item, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: i < order.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, background:'var(--green-pale)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🥗</div>
                  <span style={{ fontSize:14 }}>{item.name}</span>
                </div>
                <span style={{ fontSize:13, color:'var(--text-light)' }}>×{item.quantity || item.qty || 1}</span>
              </div>
            ))}
          </div>
        )}

        {/* Total */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:600, fontSize:15 }}>Total Amount</span>
            <span style={{ fontSize:24, fontWeight:700, color:'var(--green)' }}>₹{order.totalAmount}</span>
          </div>
          <div style={{ fontSize:13, color:'var(--text-light)', marginTop:6 }}>Payment: {order.paymentMethod}</div>
        </div>

        {order.status === 'cancelled' && (
          <div style={{ background:'#FEE2E2', borderRadius:12, padding:'12px 14px', display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:18 }}>❌</span>
            <div style={{ fontSize:13, color:'#DC2626', fontWeight:600 }}>This order has been cancelled</div>
          </div>
        )}
      </div>
      </div>{/* end page-shell-scroll */}
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:12 }}>
      <span style={{ fontSize:16, marginTop:1 }}>{icon}</span>
      <div>
        <div style={{ fontSize:11, color:'var(--text-light)', fontWeight:600, textTransform:'uppercase' }}>{label}</div>
        <div style={{ fontSize:14, color:'var(--text)', marginTop:2 }}>{value}</div>
      </div>
    </div>
  )
}
