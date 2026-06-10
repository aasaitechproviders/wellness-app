import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import BottomNav from '../components/BottomNav'

const BICONS = {'Iron Support Basket':'🌿','Immunity Basket':'🛡️','Protein Support Basket':'💪','Diabetes Wellness Basket':'💧','Detox Basket':'✨','Kids Nutrition Basket':'😊','Senior Wellness Basket':'👴','Heart Wellness Basket':'❤️'}

export default function Home() {
  const { family } = useAuth()
  const nav = useNavigate()
  const [baskets, setBaskets] = useState([])
  const [recentOrder, setRecentOrder] = useState(null)
  const [activeSub, setActiveSub] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    Promise.all([
      api.getBaskets({featured:'true'}),
      family?._id ? api.getOrders(family._id).catch(()=>({orders:[]})) : {orders:[]},
      family?._id ? api.getSubscriptions(family._id).catch(()=>({subscriptions:[]})) : {subscriptions:[]},
    ]).then(([b,o,s])=>{
      setBaskets(b.baskets?.slice(0,4)||[])
      setRecentOrder(o.orders?.[0]||null)
      setActiveSub(s.subscriptions?.find(x=>x.status==='active')||null)
    }).finally(()=>setLoading(false))
  },[family])

  const members = family?.members||[]
  const goals = [...new Set(members.flatMap(m=>m.wellnessGoals||[]))]

  return(
    <div className="page fade-in" style={{background:'var(--cream)'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#1E4D26 0%,#2D6A35 100%)',padding:'18px 18px 22px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div>
            <div style={{color:'rgba(255,255,255,0.6)',fontSize:12}}>Good morning 🌿</div>
            <div style={{color:'#fff',fontFamily:'Playfair Display,serif',fontSize:19,fontWeight:600,marginTop:2}}>
              {family?.familyName||'Welcome!'}
            </div>
          </div>
          <button onClick={()=>nav('/profile')} style={{width:38,height:38,borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',fontSize:17,cursor:'pointer'}}>👤</button>
        </div>
        {family?.apartmentName&&(
          <div style={{background:'rgba(255,255,255,0.1)',borderRadius:10,padding:'9px 12px',display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:15}}>🏠</span>
            <div>
              <div style={{color:'#fff',fontSize:12,fontWeight:600}}>{family.apartmentName}</div>
              <div style={{color:'rgba(255,255,255,0.6)',fontSize:11}}>Flat {family.flatNo}{family.towerNo?` · ${family.towerNo}`:''} · {family.city}</div>
            </div>
          </div>
        )}
      </div>

      {/* Active sub banner */}
      {activeSub&&(
        <div style={{margin:'12px 18px 0',background:'var(--green-pale)',borderRadius:12,padding:'11px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',border:'1px solid var(--green-muted)'}}>
          <div>
            <div style={{fontSize:10,color:'var(--green)',fontWeight:700,textTransform:'uppercase'}}>Active Subscription</div>
            <div style={{fontSize:14,fontWeight:600,marginTop:2}}>{activeSub.planName}</div>
          </div>
          <button onClick={()=>nav('/orders')} style={{background:'var(--green)',color:'#fff',border:'none',padding:'7px 12px',borderRadius:50,fontSize:12,fontWeight:600,cursor:'pointer'}}>View →</button>
        </div>
      )}

      {/* CTA banner */}
      <div style={{padding:'14px 18px 0'}}>
        <div onClick={()=>nav('/goals')} style={{background:'linear-gradient(135deg,#2D6A35 0%,#4A9456 100%)',borderRadius:16,padding:'18px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{color:'rgba(255,255,255,0.65)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>Personalised For You</div>
            <div style={{color:'#fff',fontFamily:'Playfair Display,serif',fontSize:17,fontWeight:600,lineHeight:1.3}}>Get Your Wellness<br/>Basket Today</div>
            <div style={{color:'rgba(255,255,255,0.7)',fontSize:12,marginTop:7}}>Based on your family's goals →</div>
          </div>
          <div style={{fontSize:48}}>🧺</div>
        </div>
      </div>

      {/* Goals */}
      {goals.length>0&&(
        <div style={{padding:'14px 18px 0'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:600}}>Family Goals</div>
            <button onClick={()=>nav('/goals')} style={{background:'none',border:'none',color:'var(--green)',fontSize:12,fontWeight:600,cursor:'pointer'}}>Edit →</button>
          </div>
          <div className="hscroll">
            {goals.slice(0,6).map(g=><span key={g} className="tag" style={{whiteSpace:'nowrap',padding:'5px 12px',fontSize:12}}>{g}</span>)}
          </div>
        </div>
      )}

      {/* Baskets */}
      <div style={{padding:'14px 18px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:600}}>Curated Baskets</div>
          <button onClick={()=>nav('/goals')} style={{background:'none',border:'none',color:'var(--green)',fontSize:12,fontWeight:600,cursor:'pointer'}}>See all →</button>
        </div>
        {loading
          ? <div className="center" style={{height:120}}><div className="spinner" style={{width:32,height:32}}/></div>
          : <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {baskets.map(b=>(
                <div key={b._id} onClick={()=>nav('/plans',{state:{basket:b}})} style={{background:'#fff',borderRadius:14,padding:'13px',border:'1px solid var(--border)',cursor:'pointer'}}>
                  <div style={{fontSize:28,marginBottom:7}}>{BICONS[b.basketName]||'🧺'}</div>
                  <div style={{fontWeight:600,fontSize:13,lineHeight:1.3,marginBottom:4}}>{b.basketName}</div>
                  <div style={{fontSize:11,color:'var(--text-light)',marginBottom:6,lineHeight:1.4}}>{b.description}</div>
                  {b.wellnessGoal&&<div style={{display:'inline-flex',alignItems:'center',gap:3,background:'var(--green-pale)',color:'var(--green)',padding:'2px 8px',borderRadius:50,fontSize:10,fontWeight:600,marginBottom:8}}>✓ {b.wellnessGoal}</div>}
                  <div style={{fontFamily:'Playfair Display,serif',fontWeight:700,color:'var(--green)',fontSize:15}}>₹{b.price}</div>
                </div>
              ))}
            </div>
        }
      </div>

      {/* Recent order */}
      {recentOrder&&(
        <div style={{padding:'14px 18px 0'}}>
          <div style={{fontFamily:'Playfair Display,serif',fontSize:16,fontWeight:600,marginBottom:10}}>Recent Order</div>
          <div className="card" onClick={()=>nav(`/orders/${recentOrder._id}`)} style={{cursor:'pointer'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>{recentOrder.orderNo}</div>
                <div style={{fontSize:11,color:'var(--text-light)',marginTop:2}}>{new Date(recentOrder.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div>
              </div>
              <span className={`pill pill-${recentOrder.status}`}>{recentOrder.status.replace(/_/g,' ')}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:12,color:'var(--text-light)'}}>{recentOrder.items?.length||0} items</span>
              <span style={{fontWeight:700,color:'var(--green)',fontSize:16,fontFamily:'Playfair Display,serif'}}>₹{recentOrder.totalAmount}</span>
            </div>
          </div>
        </div>
      )}

      {!loading&&members.length===0&&(
        <div style={{padding:'14px 18px'}}>
          <div className="card" style={{textAlign:'center',padding:'28px 20px'}}>
            <div style={{fontSize:44,marginBottom:10}}>👨‍👩‍👧</div>
            <div style={{fontFamily:'Playfair Display,serif',fontSize:17,fontWeight:600,marginBottom:8}}>Set Up Your Family</div>
            <p style={{marginBottom:14,fontSize:13}}>Add members and wellness goals to get started</p>
            <button className="btn btn-primary" onClick={()=>nav('/setup')}>Set Up Now →</button>
          </div>
        </div>
      )}

      <BottomNav/>
    </div>
  )
}
