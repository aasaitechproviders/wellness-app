import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api'

const PLANS = [
  { id:'weekly',   name:'Weekly Plan',    days:7,  price:699,  per:'/week',    icon:'🌱', desc:'Fresh delivery every week' },
  { id:'biweekly', name:'Bi-Weekly Plan', days:15, price:1299, per:'/15 days', icon:'🌿', desc:'Twice-monthly wellness basket' },
  { id:'monthly',  name:'Monthly Plan',   days:30, price:2399, per:'/month',   icon:'🍃', desc:'Best value for your family' },
]

export default function Plans() {
  const nav = useNavigate()
  const { state } = useLocation()
  const [sel, setSel]         = useState('weekly')
  const [dbPlans, setDbPlans] = useState([])

  useEffect(() => { api.getPlans().then(d => setDbPlans(d.plans || [])) }, [])

  const plans = PLANS.map(p => {
    const db = dbPlans.find(d => {
      const n = d.planName?.toLowerCase() || ''
      if (p.id === 'biweekly') return n.includes('bi')
      if (p.id === 'weekly')   return n.includes('week') && !n.includes('bi')
      return n.includes('month')
    })
    return { ...p, price: db?.price || p.price, dbPlanId: db?.planId || null }
  })

  const go = () => {
    const plan   = plans.find(p => p.id === sel)
    const basket = state?.basket || state?.result?.baskets?.[0] || null
    nav('/basket-detail', { state: { basket, plan } })
  }

  return (
    <div className="page-shell">
      {/* Sticky header */}
      <div className="top-bar">
        <button className="back-btn" onClick={() => nav(-1)}>←</button>
        <div className="top-bar-title">Choose Your Plan</div>
      </div>

      {/* Scrollable content */}
      <div className="page-shell-scroll" style={{ padding:'18px 18px 24px' }}>
        <p style={{ fontSize:13, color:'var(--text-light)', marginBottom:18 }}>
          Pick a plan that suits your family. You'll see your basket next.
        </p>

        {plans.map(p => (
          <div key={p.id} className={`plan-tile${sel===p.id?' sel':''}`} onClick={() => setSel(p.id)}
            style={{ position:'relative', display:'flex', alignItems:'center', gap:12 }}>
            {p.id === 'weekly' && (
              <div style={{ position:'absolute', top:-1, right:14, background:'var(--gold)', color:'#fff', fontSize:9, fontWeight:700, padding:'3px 9px', borderRadius:'0 0 7px 7px', letterSpacing:0.5 }}>POPULAR</div>
            )}
            <span style={{ fontSize:28 }}>{p.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:1 }}>{p.name}</div>
              <div style={{ fontSize:12, color:'var(--text-light)' }}>{p.days} Days · {p.desc}</div>
            </div>
            <div style={{ textAlign:'right', marginRight:12 }}>
              <div style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color:sel===p.id?'var(--green)':'var(--text)' }}>₹{p.price}</div>
              <div style={{ fontSize:11, color:'var(--text-light)' }}>{p.per}</div>
            </div>
            <div className="plan-radio"/>
          </div>
        ))}

        <div className="card" style={{ marginTop:6 }}>
          <div style={{ fontWeight:700, fontSize:12, marginBottom:12, color:'var(--text-mid)', letterSpacing:0.5 }}>ALL PLANS INCLUDE</div>
          {[['🚚','Free delivery to your apartment'],['🌿','Farm-fresh organic produce'],['📦','Hygienically packed boxes'],['💚','Personalised wellness picks']].map(([ic, tx]) => (
            <div key={tx} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:9 }}>
              <span style={{ fontSize:18 }}>{ic}</span>
              <span style={{ fontSize:13, color:'var(--text-mid)' }}>{tx}</span>
            </div>
          ))}
        </div>

        <div style={{ background:'#fff', borderRadius:12, border:'1px solid var(--border)', padding:'12px 14px', marginTop:6, display:'flex', gap:10 }}>
          <span style={{ fontSize:18 }}>💡</span>
          <div style={{ fontSize:12, color:'var(--text-mid)', lineHeight:1.6 }}>
            After selecting your plan, you can view your basket, customise it if needed, then place your order.
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="sticky-footer">
        <button className="btn btn-primary" onClick={go}>Continue to Your Basket →</button>
      </div>
    </div>
  )
}
