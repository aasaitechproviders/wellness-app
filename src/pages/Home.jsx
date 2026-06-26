import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { api } from '../api'
import BottomNav from '../components/BottomNav'
import { showToast } from '../components/Toast'
import logo from '../assets/logo.png'

const AVATAR_COLORS = ['#2D6A35','#1565C0','#AD1457','#E65100','#6A1B9A','#00695C']
const initials = (n='') => n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
const avatarColor = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length]

const GOAL_ICONS = {
  'Immunity Support':'🛡️','Iron Support':'💧','Protein Support':'💪',
  'Weight Management':'⚖️','Diabetes Control':'🩺','Diabetes Friendly':'🩺',
  'Heart Wellness':'❤️','Digestive Wellness':'🌀','Detox':'✨',
  'Kids Nutrition':'😊','Senior Wellness':'👴','Bone Health':'🦴','General Wellness':'🌿',
}

export default function Home() {
  const { family, updateFamily } = useAuth()
  const { addToCart, removeFromCart, isInCart } = useCart()
  const nav = useNavigate()
  const [baskets,     setBaskets]     = useState([])
  const [recentOrder, setRecentOrder] = useState(null)
  const [activeSub,   setActiveSub]   = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [freshFamily, setFreshFamily] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  // Address sheet
  const [addrSheet, setAddrSheet] = useState(false)
  const [addr, setAddr] = useState({ city:'Coimbatore', deliveryType:'individual', aptName:'', tower:'', flat:'', landmark:'', pincode:'' })
  const [addrSaving, setAddrSaving] = useState(false)

  useEffect(() => {
    if (!family?._id) return
    api.getFamily(family._id).then(d => {
      const f = d.family || family
      setFreshFamily(f)
      const members = (f.members||[]).filter(m=>m.wellnessGoals?.length)
      const basketP = members.length>0
        ? api.recommend({members}).then(d=>{
            const mr = d.recommendation?.memberResults||[]
            const seen=new Set(), flat=[]
            for(const r of mr) for(const b of (r.baskets||[])){const k=b._id?.toString();if(!seen.has(k)){seen.add(k);flat.push({...b,_forMember:r.memberName})}}
            return flat.slice(0,6)
          }).catch(()=>api.getBaskets({}).then(d=>(d.baskets||[]).slice(0,6)).catch(()=>[]))
        : api.getBaskets({}).then(d=>(d.baskets||[]).slice(0,6)).catch(()=>[])

      Promise.all([
        basketP,
        api.getOrders(family._id).catch(()=>({orders:[]})),
        api.getSubscriptions(family._id).catch(()=>({subscriptions:[]})),
      ]).then(([bArr,o,s])=>{
        setBaskets(bArr)
        setRecentOrder(o.orders?.[0]||null)
        setActiveSub(s.subscriptions?.find(x=>x.status==='active')||null)
        // Pre-fill address
        const adr=f.deliveryAddress||f
        setAddr({ city:f.city||'Coimbatore', deliveryType:f.deliveryType||'individual', aptName:f.apartmentName||'', tower:f.towerNo||'', flat:f.flatNo||'', landmark:f.landmark||'', pincode:f.pincode||'' })
      }).finally(()=>setLoading(false))
    }).catch(()=>setLoading(false))
  },[family])

  const f = freshFamily || family
  const members = f?.members || []
  const allGoals = [...new Set(members.flatMap(m=>m.wellnessGoals||[]))]

  const addrLabel = () => {
    const parts=[]
    if(addr.flat) parts.push(addr.flat)
    if(addr.aptName) parts.push(addr.aptName)
    if(!parts.length&&addr.city) parts.push(addr.city)
    return parts.join(', ')
  }

  const saveAddr = async () => {
    setAddrSaving(true)
    try {
      const upd = await api.updateFamily(family._id,{ city:addr.city, deliveryType:addr.deliveryType, apartmentName:addr.aptName, towerNo:addr.tower, flatNo:addr.flat, landmark:addr.landmark, pincode:addr.pincode })
      updateFamily(upd.family||f)
      setFreshFamily(upd.family||f)
      showToast('Address updated ✓','success')
      setAddrSheet(false)
    } catch(e){ showToast(e.message,'error') } finally { setAddrSaving(false) }
  }

  if(loading) return (
    <div className="page-full center" style={{ minHeight:'100dvh' }}>
      <div style={{ textAlign:'center' }}>
        <div className="spinner" style={{ margin:'0 auto 16px' }} />
        <p style={{ color:'var(--text-light)',fontSize:13 }}>Loading your wellness…</p>
      </div>
    </div>
  )

  const memberColors = ['PK','AK','AA','AM']

  return (
    <div className="page-shell fade-in">
      <div className="page-shell-scroll with-nav">

        {/* ── Top header ── */}
        <div style={{ padding:'16px 18px 12px', background:'var(--white)' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <img src={logo} alt="KP" style={{ width:36,height:36,borderRadius:10,objectFit:'contain' }} />
              <div>
                <div style={{ fontSize:12,color:'var(--text-light)',fontWeight:500 }}>Welcome to Krisha Pure</div>
                <div style={{ fontFamily:'var(--font-head)',fontSize:18,fontWeight:700,color:'var(--text)',display:'flex',alignItems:'center',gap:6 }}>
                  Eat Pure. Live Well. <span>🌿</span>
                </div>
              </div>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <div style={{ position:'relative',cursor:'pointer' }}>
                <span style={{ fontSize:22 }}>🔔</span>
                <span style={{ position:'absolute',top:-3,right:-3,background:'var(--red)',color:'#fff',fontSize:8,fontWeight:700,width:14,height:14,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center' }}>2</span>
              </div>
              <div style={{ width:36,height:36,borderRadius:50,background:'var(--green)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,cursor:'pointer' }}
                onClick={()=>nav('/profile')}>
                {initials(f?.familyName)}
              </div>
            </div>
          </div>
        </div>

        {/* ── Address bar ── */}
        <div style={{ margin:'0 18px 14px',background:'var(--green-pale)',borderRadius:14,padding:'12px 14px',display:'flex',alignItems:'center',gap:10,cursor:'pointer',border:'1px solid #C8E6C9' }} onClick={()=>setAddrSheet(true)}>
          <div style={{ width:34,height:34,borderRadius:10,background:'var(--green)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <span style={{ fontSize:16 }}>🏠</span>
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontWeight:700,fontSize:13,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
              {addrLabel()||f?.familyName||'Your home'}
            </div>
            <div style={{ fontSize:11,color:'var(--text-light)',textTransform:'uppercase',letterSpacing:0.5 }}>
              {addr.flat?`Flat ${addr.flat} · `:''}{addr.city||'COIMBATORE'}
            </div>
          </div>
          <span style={{ fontSize:13,fontWeight:700,color:'var(--green)',flexShrink:0 }}>Change ›</span>
        </div>

        {/* ── Hero banner ── */}
        <div style={{ margin:'0 18px 18px',background:'linear-gradient(135deg,#EBF5EC 0%,#C8E6C9 50%,#A8D5AA 100%)',borderRadius:18,overflow:'hidden',padding:'20px',position:'relative',minHeight:140 }}>
          <div style={{ position:'absolute',top:0,right:0,width:160,height:160,display:'flex',alignItems:'center',justifyContent:'center',opacity:0.85 }}>
            <span style={{ fontSize:100 }}>🧺</span>
          </div>
          <div style={{ position:'relative',zIndex:1,maxWidth:'60%' }}>
            <div style={{ fontSize:10,fontWeight:700,letterSpacing:1,color:'var(--green)',textTransform:'uppercase',marginBottom:4 }}>PERSONALISED FOR YOU</div>
            <div style={{ fontFamily:'var(--font-head)',fontSize:22,fontWeight:700,color:'var(--green-dark)',lineHeight:1.25,marginBottom:6 }}>
              Get Your Wellness Basket Today
            </div>
            <div style={{ fontSize:13,color:'var(--green-mid)',marginBottom:14,display:'flex',alignItems:'center',gap:4 }}>
              Based on your family's goals →
            </div>
            <button className="btn btn-primary" onClick={()=>nav('/goals')} style={{ width:'auto',padding:'10px 18px',fontSize:13,borderRadius:12 }}>
              🧺 Get Basket
            </button>
          </div>
        </div>

        {/* ── Family Wellness Progress ── */}
        {members.length>0 && (
          <div style={{ padding:'0 18px 18px' }}>
            <div className="section-hd">
              <span className="section-title">Family Wellness Progress</span>
              <span className="section-link" onClick={()=>nav('/goals')}>View all →</span>
            </div>
            <div className="chip-row">
              {members.slice(0,4).map((m,i)=>{
                const goals=(m.wellnessGoals||[]).length
                const pct = goals===3?85:goals===2?70:goals===1?50:30
                return (
                  <div key={i} style={{ background:'var(--white)',border:`2px solid ${i===0?'var(--green)':'var(--border)'}`,borderRadius:14,padding:'12px',minWidth:130,flexShrink:0 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                      <div className="avatar-chip" style={{ width:32,height:32,background:avatarColor(i),fontSize:11 }}>{initials(m.name)}</div>
                      <div>
                        <div style={{ fontSize:12,fontWeight:700,color:'var(--text)' }}>{m.name.split(' ')[0]}{i===0?' (You)':''}</div>
                        <div style={{ fontSize:10,color:'var(--text-light)' }}>
                          {m.age||'–'} yrs · {m.gender||'–'}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize:11,color:'var(--text-mid)',marginBottom:5 }}>{goals} Goals</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width:`${pct}%` }} />
                    </div>
                    <div style={{ fontSize:10,fontWeight:700,color:'var(--green)',marginTop:3 }}>{pct}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Family Goals chips ── */}
        {allGoals.length>0 && (
          <div style={{ padding:'0 18px 18px' }}>
            <div className="section-hd">
              <span className="section-title">Family Goals</span>
              <span className="section-link" onClick={()=>nav('/goals')}>Edit ✏</span>
            </div>
            <div className="chip-row">
              {allGoals.map(g=>(
                <div key={g} style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 14px',background:'var(--white)',border:'1px solid var(--border)',borderRadius:20,flexShrink:0 }}>
                  <span style={{ fontSize:14 }}>{GOAL_ICONS[g]||'🌿'}</span>
                  <span style={{ fontSize:12,fontWeight:600,color:'var(--text-mid)' }}>{g}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Curated Baskets ── */}
        <div style={{ padding:'0 18px 18px' }}>
          <div className="section-hd">
            <span className="section-title">Curated Baskets for You</span>
            <span className="section-link" onClick={()=>nav('/recommend')}>See all →</span>
          </div>
          {baskets.length===0 ? (
            <div style={{ background:'var(--white)',borderRadius:14,padding:'24px',textAlign:'center',border:'1px solid var(--border)' }}>
              <div style={{ fontSize:40,marginBottom:8 }}>🧺</div>
              <div style={{ fontSize:14,fontWeight:600,marginBottom:4 }}>No baskets yet</div>
              <div style={{ fontSize:12,color:'var(--text-light)',marginBottom:14 }}>Set your wellness goals to get personalized baskets</div>
              <button className="btn btn-primary" onClick={()=>nav('/goals')} style={{ width:'auto',padding:'10px 20px',fontSize:13 }}>Set Goals →</button>
            </div>
          ) : (
            <div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                {baskets.slice(0,4).map((b,i)=>{
                  const inCart=isInCart(b._id)
                  return (
                    <div key={b._id||i} className="basket-card" onClick={()=>nav(`/basket/${b._id}`,{state:{basket:b}})}>
                      <div style={{ height:120,background:'linear-gradient(135deg,#EBF5EC,#C8E6C9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:56,position:'relative' }}>
                        🧺
                        {b._forMember && (
                          <div style={{ position:'absolute',top:6,left:6,background:'rgba(255,255,255,0.9)',borderRadius:6,padding:'2px 7px',fontSize:10,fontWeight:700,color:'var(--green)',display:'flex',alignItems:'center',gap:3 }}>
                            👥 For Your Family
                          </div>
                        )}
                      </div>
                      <div style={{ padding:'10px 12px 12px' }}>
                        <div style={{ fontSize:13,fontWeight:700,marginBottom:3,lineHeight:1.3 }}>{b.basketName}</div>
                        <div style={{ fontSize:11,color:'var(--text-light)',marginBottom:6,lineHeight:1.4 }}>{b.description}</div>
                        {b.wellnessGoal && (
                          <div style={{ display:'flex',alignItems:'center',gap:4,marginBottom:8 }}>
                            <span style={{ fontSize:12 }}>{GOAL_ICONS[b.wellnessGoal]||'🌿'}</span>
                            <span style={{ fontSize:10,fontWeight:600,color:'var(--green)' }}>{b.wellnessGoal}</span>
                          </div>
                        )}
                        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                          <div style={{ fontFamily:'var(--font-head)',fontSize:18,fontWeight:700,color:'var(--text)' }}>₹{b.price}</div>
                          <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                            <button onClick={e=>{e.stopPropagation();inCart?removeFromCart(b._id):addToCart(b);showToast(inCart?'Removed from cart':'Added to cart ✓',inCart?'':'success')}}
                              style={{ padding:'6px 10px',borderRadius:10,border:`1.5px solid ${inCart?'var(--red)':'var(--green)'}`,background:inCart?'#FFF0F0':'var(--green)',color:inCart?'var(--red)':'#fff',fontSize:11,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
                              {inCart?<>✕ Remove</>:<>🛒 Add</>}
                            </button>
                            <button onClick={e=>e.stopPropagation()} style={{ width:30,height:30,borderRadius:8,border:'1.5px solid #FFCDD2',background:'#FFF0F0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,cursor:'pointer' }}>
                              ♡
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Dots */}
              {baskets.length>4 && (
                <div style={{ display:'flex',justifyContent:'center',gap:6,marginTop:12 }}>
                  {[0,1,2].map(i=><div key={i} style={{ width:i===0?20:8,height:8,borderRadius:4,background:i===0?'var(--green)':'var(--border)' }} />)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Next Delivery banner ── */}
        {(recentOrder||activeSub) && (
          <div style={{ margin:'0 18px 18px',background:'var(--white)',borderRadius:14,border:'1px solid var(--border)',padding:'14px 16px',display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ width:40,height:40,borderRadius:12,background:'var(--green)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>📅</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13,fontWeight:700 }}>Next Delivery</div>
              <div style={{ fontSize:12,color:'var(--text-light)' }}>
                {recentOrder?.deliveryDate
                  ? new Date(recentOrder.deliveryDate).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'})
                  : 'Tomorrow'}
                {recentOrder?.deliverySlot?` · ${recentOrder.deliverySlot}`:''}
              </div>
            </div>
            <button onClick={()=>nav('/orders')} style={{ padding:'7px 12px',borderRadius:10,border:'1.5px solid var(--border)',background:'var(--white)',fontSize:12,fontWeight:700,cursor:'pointer',color:'var(--text-mid)' }}>
              View / Reschedule
            </button>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div style={{ padding:'0 18px 18px' }}>
          <div className="section-title" style={{ marginBottom:14 }}>Quick Actions</div>
          <div style={{ display:'flex',gap:0,justifyContent:'space-between' }}>
            {[['🛍️','My Orders',()=>nav('/orders')],['🔄','Subscriptions',()=>nav('/orders')],['🧺','My Baskets',()=>nav('/recommend')],['📍','Address Book',()=>setAddrSheet(true)],['🎧','Help &\nSupport',()=>{}]].map(([ic,lb,fn])=>(
              <div key={lb} className="quick-action" onClick={fn}>
                <div className="quick-action-icon">{ic}</div>
                <span style={{ fontSize:10,fontWeight:600,color:'var(--text-mid)',textAlign:'center',whiteSpace:'pre-line',lineHeight:1.4 }}>{lb}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Wellness Progress link ── */}
        <div style={{ margin:'0 18px 18px',borderRadius:14,border:'1px solid var(--border)',overflow:'hidden',cursor:'pointer' }} onClick={()=>nav('/wellness-progress')}>
          <div style={{ background:'linear-gradient(135deg,var(--green-dark),var(--green))',padding:'16px',display:'flex',alignItems:'center',gap:14 }}>
            <div>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:1,color:'rgba(255,255,255,0.7)',textTransform:'uppercase',marginBottom:2 }}>KRISHA WELLNESS SCORE™</div>
              <div style={{ fontSize:32,fontWeight:700,color:'#fff',fontFamily:'var(--font-head)',lineHeight:1 }}>82<span style={{ fontSize:16,fontWeight:500 }}>/100</span></div>
              <div style={{ fontSize:12,color:'rgba(255,255,255,0.8)',marginTop:4 }}>Excellent Progress</div>
            </div>
            <div style={{ marginLeft:'auto',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4 }}>
              <div style={{ fontSize:13,color:'rgba(255,255,255,0.9)',fontWeight:600 }}>View Details →</div>
              <div style={{ display:'flex',gap:2 }}>{'★★★★☆'.split('').map((s,i)=><span key={i} style={{ fontSize:14,color:s==='★'?'#FFD700':'rgba(255,255,255,0.4)' }}>{s}</span>)}</div>
            </div>
          </div>
        </div>

      </div>
      <BottomNav />

      {/* ── Address bottom sheet ── */}
      {addrSheet && (
        <div className="sheet-overlay" onClick={()=>setAddrSheet(false)}>
          <div className="sheet-body" onClick={e=>e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding:'0 20px 20px' }}>
              <div style={{ fontSize:17,fontWeight:700,marginBottom:16 }}>Change Delivery Address</div>
              <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                <div className="input-group">
                  <label className="input-label">City</label>
                  <select className="kp-select" value={addr.city} onChange={e=>setAddr(p=>({...p,city:e.target.value}))}>
                    <option>Coimbatore</option><option>Chennai</option>
                  </select>
                </div>
                <div style={{ display:'flex',gap:8 }}>
                  {[{id:'individual',icon:'🏠',label:'Individual Home'},{id:'gated',icon:'🏢',label:'Gated Community'}].map(o=>(
                    <button key={o.id} onClick={()=>setAddr(p=>({...p,deliveryType:o.id}))}
                      style={{ flex:1,padding:'10px 8px',borderRadius:10,border:`1.5px solid ${addr.deliveryType===o.id?'var(--green)':'var(--border)'}`,background:addr.deliveryType===o.id?'var(--green-pale)':'var(--white)',fontSize:12,fontWeight:700,color:addr.deliveryType===o.id?'var(--green)':'var(--text-mid)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                      {o.icon} {o.label}
                    </button>
                  ))}
                </div>
                <div className="input-group">
                  <label className="input-label">Apartment / Building Name</label>
                  <input className="kp-input no-icon" placeholder="e.g. Green Meadows Apartments" value={addr.aptName} onChange={e=>setAddr(p=>({...p,aptName:e.target.value}))} />
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
                  <div className="input-group">
                    <label className="input-label">Tower / Block</label>
                    <input className="kp-input no-icon" placeholder="Block A" value={addr.tower} onChange={e=>setAddr(p=>({...p,tower:e.target.value}))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Flat / House No.</label>
                    <input className="kp-input no-icon" placeholder="B-101" value={addr.flat} onChange={e=>setAddr(p=>({...p,flat:e.target.value}))} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Landmark <span className="opt">(Optional)</span></label>
                  <input className="kp-input no-icon" placeholder="Near Lotus Cafe" value={addr.landmark} onChange={e=>setAddr(p=>({...p,landmark:e.target.value}))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Pincode</label>
                  <input className="kp-input no-icon" placeholder="641001" maxLength={6} value={addr.pincode} onChange={e=>setAddr(p=>({...p,pincode:e.target.value.replace(/\D/g,'')}))} />
                </div>
                <button className="btn btn-primary" onClick={saveAddr} disabled={addrSaving}>
                  {addrSaving?<span className="spinner" style={{width:20,height:20,borderWidth:2}}/>:'Save Address'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
