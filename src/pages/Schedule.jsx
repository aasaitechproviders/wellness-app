import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { api } from '../api'
import { showToast } from '../components/Toast'

const SLOTS = ['7 AM – 10 AM','10 AM – 1 PM','4 PM – 7 PM']

function next7(){
  return Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()+i); return d })
}

export default function Schedule() {
  const nav = useNavigate()
  const { state } = useLocation()
  const { family } = useAuth()
  const { clearCart } = useCart()
  const [day, setDay]   = useState(null)
  const [slot, setSlot] = useState(null)
  const [going, setGoing] = useState(false)
  const days = next7()

  const confirm = async () => {
    if(!day)  return showToast('Select a delivery day','error')
    if(!slot) return showToast('Select a time slot','error')
    setGoing(true)
    try {
      const { basket, baskets=[], plan, items=[], totalAmount, multiBasket } = state||{}

      // For multi-basket: place one order with merged items from all baskets
      const allBaskets   = multiBasket && baskets.length ? baskets : (basket ? [basket] : [])
      const primaryBasket = allBaskets[0] || basket
      const mergedItems  = multiBasket
        ? allBaskets.flatMap(b => (b.ingredientNames||[]).map(n => ({ name:n, quantity:1, unit:'serving' })))
        : items.length
          ? items.map(it=>({name:it.name,quantity:it.qty||1,unit:'g'}))
          : (primaryBasket?.ingredientNames||[]).map(n=>({name:n,quantity:1,unit:'serving'}))

      const orderTotal = totalAmount || primaryBasket?.price || plan?.price || 699

      // Subscribe if plan available (single basket only)
      if(!multiBasket && (plan?.dbPlanId||plan?.planId)){
        await api.subscribe({
          planId: plan.dbPlanId||plan.planId,
          basketId: primaryBasket?.basketId||null,
          deliveryDay: day.toLocaleDateString('en',{weekday:'long'}),
          deliverySlot: slot, startDate: day.toISOString(),
        }).catch(()=>{})
      }

      const order = await api.placeOrder({
        basketId: !multiBasket ? (primaryBasket?.basketId||null) : null,
        items: mergedItems,
        deliveryDate: day.toISOString(),
        deliverySlot: slot,
        totalAmount: orderTotal,
        paymentMethod: 'UPI',
      })

      // Clear cart after successful order
      if(multiBasket) clearCart()

      nav('/confirmed',{ state:{ order:order.order, basket: primaryBasket, baskets: allBaskets, plan, multiBasket }, replace:true })
    } catch(e){ showToast(e.message||'Failed to place order','error')
    } finally { setGoing(false) }
  }

  return (
    <div className="page-shell">
      {/* Sticky header */}
      <div className="top-bar">
        <button className="back-btn" onClick={()=>nav(-1)}>←</button>
        <div className="top-bar-title">Schedule Delivery</div>
      </div>

      {/* Scrollable content */}
      <div className="page-shell-scroll" style={{padding:'16px 18px',display:'flex',flexDirection:'column',gap:18}}>

        {/* Address */}
        {family&&(
          <div style={{background:'var(--green-pale)',borderRadius:12,padding:'11px 14px',display:'flex',gap:10,alignItems:'flex-start'}}>
            <span style={{fontSize:18}}>📍</span>
            <div>
              <div style={{fontWeight:600,fontSize:13}}>{family.apartmentName}</div>
              <div style={{fontSize:12,color:'var(--text-mid)',marginTop:1}}>
                Flat {family.flatNo}{family.towerNo?`, ${family.towerNo}`:''}, {family.address}, {family.city}
              </div>
            </div>
          </div>
        )}

        {/* Day picker */}
        <div>
          <div style={{fontWeight:600,fontSize:15,marginBottom:12}}>Select Delivery Day</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:8}}>
            {days.slice(0,4).map((d,i)=>DayBtn(d,i,day,setDay))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {days.slice(4).map((d,i)=>DayBtn(d,i+4,day,setDay))}
          </div>
        </div>

        {/* Time slots */}
        <div>
          <div style={{fontWeight:600,fontSize:15,marginBottom:12}}>Select Time Slot</div>
          {SLOTS.map(s=>(
            <button key={s} className={`slot-btn${slot===s?' sel':''}`} onClick={()=>setSlot(s)}>
              <span>{s}</span>
              {slot===s&&<span style={{color:'var(--green)',fontSize:17}}>✓</span>}
            </button>
          ))}
        </div>

        {/* Payment info */}
        <div className="card" style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:22}}>📱</span>
          <div>
            <div style={{fontWeight:600,fontSize:14}}>UPI / Card / Wallet</div>
            <div style={{fontSize:12,color:'var(--text-light)',marginTop:1}}>Pay securely on delivery</div>
          </div>
          <span style={{marginLeft:'auto',background:'var(--green-pale)',color:'var(--green)',padding:'4px 10px',borderRadius:50,fontSize:11,fontWeight:600}}>Selected</span>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="sticky-footer">
        <button className="btn btn-primary" onClick={confirm} disabled={going||!day||!slot}>
          {going&&<span className="spinner" style={{width:18,height:18,borderWidth:2}}/>}
          {going?'Placing Order...':'Confirm Delivery →'}
        </button>
      </div>
    </div>
  )
}

function DayBtn(d, i, day, setDay) {
  const sel = day?.toDateString()===d.toDateString()
  const dayN = d.toLocaleDateString('en',{weekday:'short'})
  const date = d.getDate()
  const mon  = d.toLocaleDateString('en',{month:'short'})
  return(
    <div key={i} onClick={()=>setDay(d)} style={{
      display:'flex',flexDirection:'column',alignItems:'center',gap:3,
      padding:'10px 4px',borderRadius:12,cursor:'pointer',transition:'all 0.15s',
      border:`1.5px solid ${sel?'var(--green)':'var(--border)'}`,
      background:sel?'var(--green)':'#fff',
    }}>
      <span style={{fontSize:11,fontWeight:600,color:sel?'rgba(255,255,255,0.8)':'var(--text-light)'}}>{dayN}</span>
      <span style={{fontSize:18,fontWeight:700,color:sel?'#fff':'var(--text)'}}>{date}</span>
      <span style={{fontSize:10,color:sel?'rgba(255,255,255,0.7)':'var(--text-light)'}}>{mon}</span>
    </div>
  )
}
