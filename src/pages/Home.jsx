import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { api } from '../api'
import BottomNav from '../components/BottomNav'
import { showToast } from '../components/Toast'
import logo from '../assets/logo.png'

const ACOLORS = ['#2D6A35','#1565C0','#AD1457','#E65100','#6A1B9A','#00695C']
const initials = (n='') => n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
const acolor = i => ACOLORS[i%ACOLORS.length]

const GOAL_ICONS = { 'Immunity Support':'🛡️','Iron Support':'💧','Protein Support':'💪','Weight Management':'⚖️','Diabetes Control':'🩺','Diabetes Friendly':'🩺','Heart Wellness':'❤️','Digestive Wellness':'🌀','Detox':'✨','Kids Nutrition':'😊','Senior Wellness':'👴','Bone Health':'🦴','General Wellness':'🌿',"Women's Wellness":'🌸' }

export default function Home() {
  const { family, updateFamily } = useAuth()
  const { addToCart, removeFromCart, isInCart } = useCart()
  const nav = useNavigate()
  const [baskets,     setBaskets]     = useState([])
  const [recentOrder, setRecentOrder] = useState(null)
  const [freshFamily, setFreshFamily] = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [addrSheet,   setAddrSheet]   = useState(false)
  const [addrSaving,  setAddrSaving]  = useState(false)
  const [addr, setAddr] = useState({ city:'Coimbatore', deliveryType:'individual', aptName:'', tower:'', flat:'', landmark:'', pincode:'' })

  useEffect(() => {
    if(!family?._id) return
    api.getFamily(family._id).then(d => {
      const f = d.family||family
      setFreshFamily(f)
      // Keep AuthContext in sync so other pages see fresh data
      if (f !== family) updateFamily(f)
      setAddr({ city:f.city||'Coimbatore', deliveryType:f.deliveryType||'individual', aptName:f.apartmentName||'', tower:f.towerNo||'', flat:f.flatNo||'', landmark:f.landmark||'', pincode:f.pincode||'' })
      const mems = (f.members||[]).filter(m=>m.wellnessGoals?.length)
      const bp = mems.length
        ? api.recommend({members:mems}).then(d=>{ const mr=d.recommendation?.memberResults||[]; const seen=new Set(),flat=[]; for(const r of mr)for(const b of(r.baskets||[])){const k=b._id?.toString();if(!seen.has(k)){seen.add(k);flat.push({...b,_tag:r.memberName})}}; return flat.slice(0,6) }).catch(()=>api.getBaskets({}).then(d=>(d.baskets||[]).slice(0,6)).catch(()=>[]))
        : api.getBaskets({}).then(d=>(d.baskets||[]).slice(0,6)).catch(()=>[])
      Promise.all([bp, api.getOrders(family._id).catch(()=>({orders:[]}))]).then(([bArr,o])=>{
        setBaskets(bArr); setRecentOrder(o.orders?.[0]||null)
      }).finally(()=>setLoading(false))
    }).catch(()=>setLoading(false))
  },[family])

  const f = freshFamily||family
  const members = f?.members||[]
  const allGoals = [...new Set(members.flatMap(m=>m.wellnessGoals||[]))]
  const addrLine1 = [addr.flat&&`Flat ${addr.flat}`,addr.aptName].filter(Boolean).join(', ') || f?.familyName || 'Your Home'
  const addrLine2 = addr.city.toUpperCase()

  const saveAddr = async () => {
    setAddrSaving(true)
    try {
      const r = await api.updateFamily(family._id, {
        city:         addr.city,
        address:      [addr.aptName, addr.flat && `Flat ${addr.flat}`, addr.tower && `Tower ${addr.tower}`].filter(Boolean).join(', ') || addr.aptName || '',
        apartmentName: addr.aptName,
        flatNo:       addr.flat,
        towerNo:      addr.tower,
        landmark:     addr.landmark,
        pincode:      addr.pincode,
      })
      updateFamily(r.family||f); setFreshFamily(r.family||f)
      showToast('Address updated ✓','success'); setAddrSheet(false)
    } catch(e){ showToast(e.message,'error') } finally { setAddrSaving(false) }
  }

  if(loading) return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, background:'var(--cream)' }}>
      <div style={{ width:32,height:32,borderRadius:'50%',border:'3px solid var(--border)',borderTopColor:'var(--green)',animation:'rotate 0.7s linear infinite' }} />
      <p style={{ color:'var(--text-light)',fontSize:13 }}>Loading your wellness…</p>
    </div>
  )

  return (
    <div className="page fade-in">
      <div className="scroll pad-nav">

        {/* ── Top Header ── */}
        <div style={{ background:'var(--white)', padding:'14px 18px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <img src={logo} alt="KP" style={{ width:36,height:36,borderRadius:10,objectFit:'contain' }} />
            <div>
              <div style={{ fontSize:12,color:'var(--text-light)',fontWeight:500 }}>Welcome to Krisha Pure</div>
              <div style={{ fontFamily:'var(--font-serif)',fontSize:19,fontWeight:700,color:'var(--text)',display:'flex',alignItems:'center',gap:6,lineHeight:1.2 }}>
                Eat Pure. Live Well. <span style={{ fontSize:16 }}>🌿</span>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ position:'relative',cursor:'pointer' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-mid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              <span style={{ position:'absolute',top:-4,right:-4,background:'var(--red)',color:'#fff',fontSize:9,fontWeight:700,width:15,height:15,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center' }}>2</span>
            </div>
            <div onClick={()=>nav('/profile')} style={{ width:36,height:36,borderRadius:'50%',background:'var(--green)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,cursor:'pointer' }}>
              {initials(f?.familyName)}
            </div>
          </div>
        </div>

        {/* ── Address bar ── */}
        <div className="addr-bar" onClick={()=>setAddrSheet(true)}>
          <div className="addr-icon">🏠</div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontWeight:700,fontSize:13,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{addrLine1}</div>
            <div style={{ fontSize:11,color:'var(--text-light)',letterSpacing:0.5 }}>{addr.flat&&`Flat ${addr.flat} · `}{addrLine2}</div>
          </div>
          <span style={{ fontSize:13,fontWeight:700,color:'var(--green)',flexShrink:0 }}>Change  ›</span>
        </div>

        {/* ── Hero Banner ── */}
        <div style={{ margin:'0 16px 16px', borderRadius:16, overflow:'hidden', background:'linear-gradient(135deg,#EBF5EC 0%,#C8E6C9 60%,#A5D6A7 100%)', minHeight:145, position:'relative', cursor:'pointer' }} onClick={()=>nav('/recommend')}>
          {/* text */}
          <div style={{ padding:'18px 18px', maxWidth:'58%', position:'relative', zIndex:1 }}>
            <div style={{ fontSize:10,fontWeight:700,letterSpacing:1.2,color:'var(--green)',textTransform:'uppercase',marginBottom:6 }}>PERSONALISED FOR YOU</div>
            <div style={{ fontFamily:'var(--font-serif)',fontSize:22,fontWeight:700,color:'var(--green-dark)',lineHeight:1.25,marginBottom:8 }}>
              Get Your Wellness Basket Today
            </div>
            <div style={{ fontSize:13,color:'var(--green-mid)',display:'flex',alignItems:'center',gap:4,fontWeight:500 }}>
              Based on your family's goals  →
            </div>
          </div>
          {/* basket photo area */}
          <div style={{ position:'absolute',top:0,right:0,bottom:0,width:'48%',display:'flex',alignItems:'flex-end',justifyContent:'center' }}>
            <div style={{ fontSize:100,lineHeight:1,filter:'drop-shadow(2px 4px 10px rgba(0,0,0,0.15))' }}>🧺</div>
          </div>
          {/* basket circle icon */}
          <div style={{ position:'absolute',bottom:14,right:14,width:42,height:42,borderRadius:'50%',background:'var(--green)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,boxShadow:'0 3px 10px rgba(45,106,53,0.4)',zIndex:2 }}>🛒</div>
        </div>

        {/* ── Family Wellness Progress ── */}
        {members.length>0&&(
          <div style={{ padding:'0 16px 16px' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
              <span style={{ fontSize:15,fontWeight:700 }}>Family Wellness Progress</span>
              <span style={{ fontSize:13,fontWeight:600,color:'var(--green)',cursor:'pointer' }} onClick={()=>nav('/wellness-progress')}>View all  →</span>
            </div>
            <div className="chip-row">
              {members.slice(0,4).map((m,i)=>{
                const gCount=(m.wellnessGoals||[]).length
                const pct=gCount===3?85:gCount===2?70:gCount===1?50:30
                return (
                  <div key={i} style={{ background:'var(--white)',border:`2px solid ${i===0?'var(--green)':'var(--border)'}`,borderRadius:14,padding:'12px 12px 10px',minWidth:130,flexShrink:0,boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                      <div className="avatar" style={{ background:acolor(i),width:32,height:32,fontSize:11,borderRadius:'50%' }}>{initials(m.name)}</div>
                      <div>
                        <div style={{ fontSize:12,fontWeight:700 }}>{m.name.split(' ')[0]}{i===0?' (You)':''}</div>
                        <div style={{ fontSize:10,color:'var(--text-light)' }}>{m.age||'–'} yrs · {m.gender||'–'}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:11,color:'var(--text-mid)',marginBottom:5 }}>{gCount} Goals</div>
                    <div className="pbar"><div className="pfill" style={{ width:`${pct}%` }}/></div>
                    <div style={{ fontSize:10,fontWeight:700,color:'var(--green)',marginTop:3 }}>{pct}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Family Goals ── */}
        {allGoals.length>0&&(
          <div style={{ padding:'0 16px 16px' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
              <span style={{ fontSize:15,fontWeight:700 }}>Family Goals</span>
              <span style={{ fontSize:13,fontWeight:600,color:'var(--green)',cursor:'pointer' }} onClick={()=>nav('/goals')}>Edit  ✏</span>
            </div>
            <div className="chip-row">
              {allGoals.map(g=>(
                <div key={g} style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',background:'var(--white)',border:'1px solid var(--border)',borderRadius:50,flexShrink:0,boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                  <span style={{ fontSize:14 }}>{GOAL_ICONS[g]||'🌿'}</span>
                  <span style={{ fontSize:13,fontWeight:500,color:'var(--text-mid)' }}>{g}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Curated Baskets ── */}
        <div style={{ padding:'0 16px 16px' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
            <span style={{ fontSize:15,fontWeight:700 }}>Curated Baskets for You</span>
            <span style={{ fontSize:13,fontWeight:600,color:'var(--green)',cursor:'pointer' }} onClick={()=>nav('/recommend')}>See all  →</span>
          </div>
          {baskets.length===0 ? (
            <div style={{ background:'var(--white)',borderRadius:14,padding:'24px',textAlign:'center',border:'1px solid var(--border)' }}>
              <div style={{ fontSize:40,marginBottom:10 }}>🧺</div>
              <div style={{ fontSize:14,fontWeight:700,marginBottom:6 }}>No baskets yet</div>
              <div style={{ fontSize:12,color:'var(--text-light)',marginBottom:14 }}>Set your wellness goals to get personalized baskets</div>
              <button className="btn btn-primary" style={{ width:'auto',padding:'10px 22px',fontSize:13 }} onClick={()=>nav('/goals')}>Set Goals →</button>
            </div>
          ) : (
            <>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                {baskets.slice(0,4).map((b,i)=>{
                  const inCart=isInCart(b._id)
                  return (
                    <div key={b._id||i} className="bcard" onClick={()=>nav(`/basket/${b._id}`,{state:{basket:b}})}>
                      {/* Image area */}
                      <div className="bcard-img">
                        🧺
                        <div style={{ position:'absolute',top:8,left:8,background:'rgba(255,255,255,0.92)',borderRadius:6,padding:'3px 7px',fontSize:10,fontWeight:700,color:'var(--green)',display:'flex',alignItems:'center',gap:4,backdropFilter:'blur(4px)' }}>
                          👥 For Your Family
                        </div>
                      </div>
                      {/* Details */}
                      <div style={{ padding:'10px 12px 12px' }}>
                        <div style={{ fontSize:13,fontWeight:700,marginBottom:3,lineHeight:1.3 }}>{b.basketName}</div>
                        <div style={{ fontSize:11,color:'var(--text-light)',marginBottom:7,lineHeight:1.4 }}>{b.description}</div>
                        {b.wellnessGoal&&(
                          <div style={{ display:'flex',alignItems:'center',gap:4,marginBottom:9 }}>
                            <span style={{ fontSize:12 }}>{GOAL_ICONS[b.wellnessGoal]||'🌿'}</span>
                            <span style={{ fontSize:10,fontWeight:600,color:'var(--green)' }}>{b.wellnessGoal}</span>
                          </div>
                        )}
                        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                          <div style={{ fontFamily:'var(--font-serif)',fontSize:18,fontWeight:700 }}>₹{b.price}</div>
                          <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                            <button onClick={e=>{e.stopPropagation();inCart?removeFromCart(b._id):addToCart(b);showToast(inCart?'Removed':'Added to cart ✓',inCart?'':'success')}}
                              style={{ display:'flex',alignItems:'center',gap:4,padding:'6px 10px',borderRadius:8,border:`1.5px solid ${inCart?'var(--red)':'var(--green)'}`,background:inCart?'#FFF0F0':'var(--green)',color:inCart?'var(--red)':'#fff',fontSize:11,fontWeight:700,cursor:'pointer' }}>
                              {inCart?<>✕</>:<>🛒</>} {inCart?'Remove':'Add to Cart'}
                            </button>
                            <button onClick={e=>e.stopPropagation()} style={{ width:30,height:30,borderRadius:8,border:'1.5px solid #FFCDD2',background:'#FFF5F5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,cursor:'pointer' }}>♡</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Pagination dots */}
              <div style={{ display:'flex',justifyContent:'center',gap:6,marginTop:12 }}>
                {[0,1,2].map(i=><div key={i} style={{ width:i===0?22:8,height:8,borderRadius:4,background:i===0?'var(--green)':'var(--border)',transition:'all 0.3s' }} />)}
              </div>
            </>
          )}
        </div>

        {/* ── Next Delivery ── */}
        {recentOrder&&(
          <div style={{ margin:'0 16px 16px',background:'var(--white)',borderRadius:14,border:'1px solid var(--border)',padding:'14px 16px',display:'flex',alignItems:'center',gap:12,boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ width:40,height:40,borderRadius:12,background:'var(--green)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>📅</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13,fontWeight:700 }}>Next Delivery</div>
              <div style={{ fontSize:12,color:'var(--text-light)' }}>
                {recentOrder.deliveryDate ? new Date(recentOrder.deliveryDate).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'short'}) : 'Tomorrow'}
                {recentOrder.deliverySlot?` · ${recentOrder.deliverySlot}`:''}
              </div>
            </div>
            <button onClick={()=>nav('/orders')} style={{ padding:'7px 12px',borderRadius:10,border:'1.5px solid var(--border)',background:'var(--white)',fontSize:12,fontWeight:700,cursor:'pointer',color:'var(--text-mid)',flexShrink:0 }}>
              View / Reschedule
            </button>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div style={{ padding:'0 16px 20px' }}>
          <div style={{ fontSize:15,fontWeight:700,marginBottom:14 }}>Quick Actions</div>
          <div style={{ display:'flex',justifyContent:'space-between' }}>
            {[['🛍️','My Orders',()=>nav('/orders')],['🔄','Subscriptions',()=>{}],['🧺','My Baskets',()=>nav('/recommend')],['📍','Address Book',()=>setAddrSheet(true)],['🎧','Help &\nSupport',()=>{}]].map(([ic,lb,fn])=>(
              <div key={lb} className="qa" onClick={fn}>
                <div className="qa-icon">{ic}</div>
                <span style={{ fontSize:10,fontWeight:600,color:'var(--text-mid)',textAlign:'center',whiteSpace:'pre-line',lineHeight:1.4 }}>{lb}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
      <BottomNav />

      {/* ── Address bottom sheet ── */}
      {addrSheet&&(
        <div className="overlay" onClick={()=>setAddrSheet(false)}>
          <div className="sheet" style={{ maxWidth:430 }} onClick={e=>e.stopPropagation()}>
            <div className="handle" />
            <div style={{ padding:'0 20px 20px' }}>
              <div style={{ fontSize:16,fontWeight:700,marginBottom:16 }}>Change Delivery Address</div>
              <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                <div className="field">
                  <label className="label">City</label>
                  <div style={{display:'flex',gap:10}}>
                    {['Coimbatore','Chennai'].map(c=>(
                      <button key={c} onClick={()=>setAddr(p=>({...p,city:c}))} type="button"
                        style={{flex:1,padding:'13px',borderRadius:12,border:`2px solid ${addr.city===c?'var(--green)':'var(--border)'}`,background:addr.city===c?'var(--green)':'var(--white)',color:addr.city===c?'#fff':'var(--text-mid)',fontWeight:700,fontSize:14,cursor:'pointer',transition:'all 0.15s'}}>
                        {addr.city===c?'✓ ':''}{c}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
                  {[{id:'individual',emoji:'🏠',label:'Individual Home'},{id:'gated',emoji:'🏢',label:'Gated Community'}].map(o=>(
                    <button key={o.id} onClick={()=>setAddr(p=>({...p,deliveryType:o.id}))}
                      style={{ padding:'10px 8px',borderRadius:10,border:`1.5px solid ${addr.deliveryType===o.id?'var(--green)':'var(--border)'}`,background:addr.deliveryType===o.id?'var(--green-pale)':'var(--white)',color:addr.deliveryType===o.id?'var(--green)':'var(--text-mid)',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                      {o.emoji} {o.label}
                    </button>
                  ))}
                </div>
                <div className="field"><label className="label">Apartment / Building Name</label><input className="inp no-ico" placeholder="e.g. Green Meadows Apartments" value={addr.aptName} onChange={e=>setAddr(p=>({...p,aptName:e.target.value}))} /></div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
                  <div className="field"><label className="label">Tower / Block</label><input className="inp no-ico" placeholder="Block A" value={addr.tower} onChange={e=>setAddr(p=>({...p,tower:e.target.value}))} /></div>
                  <div className="field"><label className="label">Flat / House No.</label><input className="inp no-ico" placeholder="B-101" value={addr.flat} onChange={e=>setAddr(p=>({...p,flat:e.target.value}))} /></div>
                </div>
                <div className="field"><label className="label">Landmark <span className="opt">(Optional)</span></label><input className="inp no-ico" placeholder="Near Lotus Cafe" value={addr.landmark} onChange={e=>setAddr(p=>({...p,landmark:e.target.value}))} /></div>
                <div className="field"><label className="label">Pincode</label><input className="inp no-ico" placeholder="641001" maxLength={6} value={addr.pincode} onChange={e=>setAddr(p=>({...p,pincode:e.target.value.replace(/\D/g,'')}))} /></div>
                <button className="btn btn-primary" onClick={saveAddr} disabled={addrSaving}>{addrSaving?<span className="spin"/>:'Save Address'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
