import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { showToast } from '../components/Toast'
import logo from '../assets/logo.png'

/* ─── constants ─── */
const RELS = [
  { id:'Self',        emoji:'👤' },
  { id:'Spouse',      emoji:'👫' },
  { id:'Child',       emoji:'👶' },
  { id:'Parent',      emoji:'👨' },
  { id:'Grandparent', emoji:'👴' },
  { id:'Other',       emoji:'👥' },
]
const ACTIVITY = [
  { id:'sedentary', label:'Sedentary',        sub:'Mostly sitting;\nlittle exercise',    emoji:'🪑' },
  { id:'light',     label:'Lightly Active',   sub:'Light exercise\n1–3 days/week',       emoji:'🚶' },
  { id:'moderate',  label:'Moderately Active',sub:'Exercise\n3–5 days/week',             emoji:'🏃' },
  { id:'high',      label:'Highly Active',    sub:'Intense exercise\nmost days',         emoji:'🏋️' },
]
const GOALS_LIST = [
  { name:'Immunity Support',   emoji:'🛡️', desc:'Strengthen immunity naturally' },
  { name:'Protein Support',    emoji:'💪', desc:'Build & repair muscles' },
  { name:'Iron Support',       emoji:'💧', desc:'Improve hemoglobin levels' },
  { name:'Weight Management',  emoji:'⚖️', desc:'Healthy weight control' },
  { name:'Diabetes Friendly',  emoji:'🩺', desc:'Balanced sugar management' },
  { name:'Heart Wellness',     emoji:'❤️', desc:'Support heart health' },
  { name:'Digestive Wellness', emoji:'🌀', desc:'Better digestion & gut health' },
  { name:'Bone Health',        emoji:'🦴', desc:'Stronger bones & joints' },
  { name:"Women's Wellness",   emoji:'🌸', desc:'Hormonal & overall well-being' },
  { name:'Kids Nutrition',     emoji:'😊', desc:'Support growth & development' },
  { name:'Senior Wellness',    emoji:'👴', desc:'Healthy ageing & vitality' },
  { name:'Other Goal',         emoji:'···', desc:'Something else in mind?' },
]
const TASTE   = ['Sweet','Mild','Tangy','Spicy','Bitter']
const COOKING = ['Quick Cooking','Traditional Cooking','Salads','Juices','Smoothies','Soups']
const ALLERGY = ['Nut Allergy','Gluten Sensitivity','Lactose Intolerance','None']
const STEP_LABELS = [['1','Personal &\nDelivery'],['2','Family\nMembers'],['3','Wellness\nGoals'],['4','Food\nPreferences']]
const HC_LIST = ['Blood Sugar','Blood Pressure','Thyroid','PCOS','Cholesterol','Anaemia','Arthritis','Kidney Issues','Digestive Issues','Liver Issues']

function calcBMI(h,w) { const hm=parseFloat(h)/100; if(!hm||!w) return null; return (parseFloat(w)/(hm*hm)).toFixed(1) }
function bmiInfo(b) {
  if(!b) return null
  const v=parseFloat(b)
  if(v<18.5) return { label:'Underweight', color:'#E67E22' }
  if(v<25)   return { label:'Normal',      color:'#27AE60' }
  if(v<30)   return { label:'Overweight',  color:'#E67E22' }
  return              { label:'Obese',      color:'#E53935' }
}
const initials = (n='') => n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
const ACOLORS = ['#2D6A35','#1565C0','#AD1457','#E65100','#6A1B9A']
const acolor = i => ACOLORS[i%ACOLORS.length]

/* ─── Stepper ─── */
function Stepper({ step }) {
  return (
    <div className="stepper">
      {STEP_LABELS.map(([num,lbl],i) => {
        const done = i < step, active = i === step
        return (
          <div key={i} className={`s-item${done?' done':''}${active?' active':''}`}>
            <div className="s-dot">{done ? '✓' : num}</div>
            <div className="s-lbl" style={{ whiteSpace:'pre-line' }}>{lbl}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Section header ─── */
function SecH({ emoji, title }) {
  return (
    <div className="sec-hd">
      <span className="sec-hd-icon">{emoji}</span>
      <span className="sec-hd-title">{title}</span>
    </div>
  )
}

/* ─── Divider ─── */
const Divider = () => <div style={{ height:1, background:'var(--border)', margin:'18px 0' }} />

export default function Setup() {
  const { family, updateFamily } = useAuth()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)

  /* Step 0 */
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [city,      setCity]      = useState('Coimbatore')
  const [dlvType,   setDlvType]   = useState('individual')
  const [aptName,   setAptName]   = useState('')
  const [tower,     setTower]     = useState('')
  const [flat,      setFlat]      = useState('')
  const [landmark,  setLandmark]  = useState('')
  const [pincode,   setPincode]   = useState('')
  const [prefTime,  setPrefTime]  = useState('morning')
  const [dlvInstr,  setDlvInstr]  = useState('')
  const [ecName,    setEcName]    = useState('')
  const [ecRel,     setEcRel]     = useState('')
  const [ecPhone,   setEcPhone]   = useState('')

  /* Step 1 */
  const [members,  setMembers]  = useState([])
  const [newM,     setNewM]     = useState({ rel:'Self', name:'', dob:'', gender:'Female', height:'', weight:'', activity:'moderate', include:true })
  const [editIdx,  setEditIdx]  = useState(null)

  /* Step 2 */
  const [activeMem,   setActiveMem]   = useState(0)
  const [mGoals,      setMGoals]      = useState({})
  const [mHC,         setMHC]         = useState({})
  const [hcQ,         setHcQ]         = useState('')
  const [apiGoals,    setApiGoals]    = useState([])

  /* Step 3 */
  const [diet,      setDiet]      = useState('Vegetarian')
  const [vegRestr,  setVegRestr]  = useState(false)
  const [vegQ,      setVegQ]      = useState('')
  const [fruitQ,    setFruitQ]    = useState('')
  const [taste,     setTaste]     = useState([])
  const [cook,      setCook]      = useState([])
  const [allergy,   setAllergy]   = useState(['None'])
  const [prefPlan,  setPrefPlan]  = useState('weekly')

  useEffect(() => {
    api.getGoals().then(d => setApiGoals(d.goals||[])).catch(()=>{})
    if (family) { setName(family.familyName||''); setCity(family.city||'Coimbatore') }
  },[family])

  /* helpers */
  const curMem  = members[activeMem]
  const curGoals= curMem ? (mGoals[curMem._tid]||[]) : []

  const toggleGoal = (tid, gName) => {
    setMGoals(p => {
      const c = p[tid]||[]
      if(!c.includes(gName) && c.length>=3) { showToast('Max 3 goals per member','error'); return p }
      return {...p, [tid]: c.includes(gName) ? c.filter(x=>x!==gName) : [...c,gName]}
    })
  }
  const toggleHC = (tid, ch) => setMHC(p => { const c=p[tid]||[]; return {...p,[tid]:c.includes(ch)?c.filter(x=>x!==ch):[...c,ch]} })
  const toggleTaste   = t => setTaste(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])
  const toggleCook    = c => setCook(p=>p.includes(c)?p.filter(x=>x!==c):[...p,c])
  const toggleAllergy = a => {
    if(a==='None'){setAllergy(['None']);return}
    setAllergy(p=>{ const f=p.filter(x=>x!=='None'); return f.includes(a)?f.filter(x=>x!==a):[...f,a] })
  }

  const saveMember = () => {
    if(!newM.name.trim()) return showToast('Name is required','error')
    if(!newM.dob) return showToast('Date of birth is required','error')
    const m = {...newM, _tid: editIdx!==null ? members[editIdx]._tid : Date.now().toString()}
    setMembers(p => editIdx!==null ? p.map((x,i)=>i===editIdx?m:x) : [...p,m])
    setNewM({rel:'Self',name:'',dob:'',gender:'Female',height:'',weight:'',activity:'moderate',include:true})
    setEditIdx(null)
  }
  const editMem = i => { setNewM(members[i]); setEditIdx(i) }
  const delMem  = i => setMembers(p=>p.filter((_,x)=>x!==i))

  const age = (dob) => dob ? Math.floor((Date.now()-new Date(dob))/31557600000) : null

  const proceed = async () => {
    if(step===0) {
      if(!name.trim()) return showToast('Full name is required','error')
      setStep(1)
    } else if(step===1) {
      if(members.length===0) return showToast('Add at least one family member','error')
      if(editIdx!==null) return showToast('Save or cancel the member form first','error')
      setStep(2)
    } else if(step===2) {
      setStep(3)
    } else {
      setBusy(true)
      try {
        const phone = localStorage.getItem('kp_phone')||''
        let fam = family

        // Step 1: register or update the family record
        if (!fam?._id) {
          // Build address string — backend requires this field
          const addressStr = [aptName, tower && `Tower ${tower}`, flat && `Flat ${flat}`, landmark, pincode].filter(Boolean).join(', ')
          const r = await api.registerFamily({
            familyName:name, phone, email, city,
            address: addressStr || aptName || 'N/A',
            apartmentName:aptName || 'N/A',
            towerNo:tower,
            flatNo:flat || 'N/A',
            landmark, pincode,
            preferredDeliveryTime:prefTime, deliveryInstructions:dlvInstr,
            dietPreference:diet,
          })
          fam = r.family
          updateFamily(fam)
        } else {
          const addressStr2 = [aptName, tower && `Tower ${tower}`, flat && `Flat ${flat}`, landmark, pincode].filter(Boolean).join(', ')
          const r = await api.updateFamily(fam._id, {
            familyName:name, email, city,
            address: addressStr2 || aptName || '',
            apartmentName:aptName,
            towerNo:tower,
            flatNo:flat,
            landmark, pincode,
            dietPreference:diet,
          })
          fam = r.family || fam
          updateFamily(fam)
        }

        // Step 2: add each member with their wellness goals attached
        for (const m of members) {
          try {
            await api.addMember(fam._id, {
              name:            m.name,
              gender:          m.gender,
              age:             age(m.dob),
              height:          parseFloat(m.height) || null,
              weight:          parseFloat(m.weight) || null,
              activityLevel:   m.activity,
              relationship:    m.rel,
              wellnessGoals:   mGoals[m._tid] || [],
              healthChallenges:mHC[m._tid]    || [],
            })
          } catch(addErr) {
            console.warn('Member add failed:', addErr)
          }
        }

        // Step 3: re-fetch family so AuthContext has fresh members with real memberIds
        try {
          const fresh = await api.getFamily(fam._id)
          updateFamily(fresh.family || fam)
        } catch {}

        showToast('Profile saved! 🎉', 'success')
        nav('/home', { replace:true })
      } catch(e) {
        showToast(e.message || 'Save failed', 'error')
      } finally {
        setBusy(false)
      }
    }
  }

  const bmi = calcBMI(newM.height,newM.weight)
  const bi  = bmiInfo(bmi)
  const goalsList = apiGoals.length ? apiGoals.map(g=>({name:g.goalName||g.name,emoji:GOALS_LIST.find(x=>x.name===g.goalName||x.name===g.name)?.emoji||'🌿',desc:g.description||GOALS_LIST.find(x=>x.name===g.goalName||x.name===g.name)?.desc||''})) : GOALS_LIST
  const hcFiltered = HC_LIST.filter(x=>x.toLowerCase().includes(hcQ.toLowerCase()))

  return (
    <div className="page">
      {/* ── Sticky top bar ── */}
      <div style={{ background:'var(--cream)', flexShrink:0 }}>
        {/* Header row */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 18px 0' }}>
          <button onClick={()=>step>0?setStep(step-1):nav('/login')}
            style={{ width:36,height:36,borderRadius:'50%',background:'var(--white)',border:'1.5px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 }}>←</button>
          <img src={logo} alt="KP" style={{ width:28,height:28,objectFit:'contain',borderRadius:8 }} />
          <span style={{ fontFamily:'var(--font-serif)',fontSize:14,fontWeight:700,color:'var(--green-dark)' }}>KRISHA PURE</span>
          {/* member switcher on steps 2+3 */}
          {(step===2||step===3)&&curMem&&(
            <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:7,background:'var(--white)',border:'1.5px solid var(--border)',borderRadius:10,padding:'5px 10px',cursor:'pointer' }}
              onClick={()=>setActiveMem(p=>(p+1)%members.length)}>
              <span style={{ fontSize:14 }}>👥</span>
              <div>
                <div style={{ fontSize:11,fontWeight:700 }}>Member: {curMem.name.split(' ')[0]}{activeMem===0?' (You)':''}</div>
                <div style={{ fontSize:10,color:'var(--text-light)' }}>{curMem.gender} · {age(curMem.dob)??'–'} yrs</div>
              </div>
              <span style={{ fontSize:10,color:'var(--text-light)' }}>▾</span>
            </div>
          )}
        </div>

        {/* Decorative basket — steps 0 & 1 */}
        {(step===0||step===1)&&(
          <div style={{ position:'relative', padding:'10px 18px 0', minHeight:90 }}>
            <div style={{ position:'absolute',top:0,right:0,fontSize:90,opacity:0.75,filter:'drop-shadow(2px 3px 6px rgba(0,0,0,0.1))' }}>🧺</div>
            <div style={{ position:'relative',zIndex:1,maxWidth:'65%' }}>
              <div style={{ fontFamily:'var(--font-serif)',fontSize:22,fontWeight:700,color:'var(--text)',lineHeight:1.25,marginBottom:4 }}>
                {step===0?'Personal & Delivery Details':'Family Members'}
              </div>
              <div style={{ fontSize:12,color:'var(--text-light)',lineHeight:1.5 }}>
                {step===0?'Help us serve you better with fresh, personalized wellness baskets.':'Add each member to receive personalized wellness recommendations.'}
              </div>
            </div>
          </div>
        )}

        {/* Steps 2 & 3 compact title */}
        {(step===2||step===3)&&(
          <div style={{ padding:'6px 18px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:10,fontWeight:700,letterSpacing:0.8,textTransform:'uppercase',color:'var(--green)',marginBottom:2 }}>STEP {step+1} OF 4</div>
              <div style={{ fontFamily:'var(--font-serif)',fontSize:20,fontWeight:700 }}>{step===2?'Wellness Goals':'Food Preferences'}</div>
              {step===2&&curMem&&<div style={{ fontSize:12,color:'var(--text-light)',marginTop:2 }}>Choose <strong>up to 3</strong> wellness goals for <strong>{curMem.name.split(' ')[0]}</strong></div>}
              {step===3&&<div style={{ fontSize:12,color:'var(--text-light)',marginTop:2 }}>Help us curate baskets you'll love, every time.</div>}
            </div>
            {step===2&&(
              <div style={{ background:'var(--green)',color:'#fff',borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:4,flexShrink:0 }}>
                ✓ {curGoals.length} selected
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stepper */}
      <Stepper step={step} />

      {/* ── Scrollable body ── */}
      <div className="scroll" style={{ padding:'16px 18px 120px' }}>

        {/* ══════════════ STEP 0 ══════════════ */}
        {step===0&&(
          <div style={{ display:'flex',flexDirection:'column',gap:0 }}>

            {/* Personal Information */}
            <div className="card" style={{ marginBottom:12 }}>
              <SecH emoji="👤" title="Personal Information" />
              <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                <div className="field">
                  <label className="label">Full Name</label>
                  <div className="input-row"><span className="input-ico">👤</span>
                    <input className="inp" placeholder="e.g. Priya Krishnan" value={name} onChange={e=>setName(e.target.value)} /></div>
                </div>
                <div className="field">
                  <label className="label">Mobile Number</label>
                  <div className="input-row"><span className="input-ico">📞</span>
                    <input className="inp" value={'+91 '+(localStorage.getItem('kp_phone')||'')} readOnly style={{ color:'var(--text-mid)',background:'#FAFAFA' }} /></div>
                </div>
                <div className="field">
                  <label className="label">Email Address <span className="opt">(Optional)</span></label>
                  <div className="input-row"><span className="input-ico">✉️</span>
                    <input className="inp" type="email" placeholder="e.g. priya@gmail.com" value={email} onChange={e=>setEmail(e.target.value)} /></div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="card" style={{ marginBottom:12 }}>
              <SecH emoji="📍" title="Delivery Address" />
              <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                <div className="field">
                  <label className="label">City</label>
                  <select className="sel" value={city} onChange={e=>setCity(e.target.value)}>
                    <option>Coimbatore</option><option>Chennai</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">Delivery Location Type</label>
                  <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                    {[{id:'individual',emoji:'🏠',title:'Individual Home',sub:'Deliver to your home or apartment'},{id:'gated',emoji:'🏢',title:'Gated Community / Wellness Partner',sub:'Deliver to your community or partner'}].map(o=>(
                      <div key={o.id} className={`sel-card${dlvType===o.id?' on':''}`} onClick={()=>setDlvType(o.id)}>
                        <span style={{ fontSize:24 }}>{o.emoji}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13,fontWeight:700 }}>{o.title}</div>
                          <div style={{ fontSize:11,color:'var(--text-light)' }}>{o.sub}</div>
                        </div>
                        <div className="radio-dot" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label className="label">Apartment / Building Name</label>
                  <div className="input-row"><span className="input-ico">🏢</span>
                    <input className="inp" placeholder="e.g. Green Meadows Apartments" value={aptName} onChange={e=>setAptName(e.target.value)} /></div>
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                  <div className="field">
                    <label className="label">Tower / Block</label>
                    <div className="input-row"><span className="input-ico">🏗️</span>
                      <input className="inp" placeholder="e.g. Block A" value={tower} onChange={e=>setTower(e.target.value)} /></div>
                  </div>
                  <div className="field">
                    <label className="label">Flat / House No.</label>
                    <div className="input-row"><span className="input-ico">🚪</span>
                      <input className="inp" placeholder="e.g. B-101" value={flat} onChange={e=>setFlat(e.target.value)} /></div>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Landmark <span className="opt">(Optional)</span></label>
                  <div className="input-row"><span className="input-ico">📌</span>
                    <input className="inp" placeholder="e.g. Near Lotus Cafe, Anna Nagar" value={landmark} onChange={e=>setLandmark(e.target.value)} /></div>
                </div>
                <div className="field">
                  <label className="label">Pincode</label>
                  <div className="input-row"><span className="input-ico">🏠</span>
                    <input className="inp" placeholder="641001" inputMode="numeric" maxLength={6} value={pincode} onChange={e=>setPincode(e.target.value.replace(/\D/g,''))} /></div>
                </div>
              </div>
            </div>

            {/* Delivery Preference */}
            <div className="card" style={{ marginBottom:12 }}>
              <SecH emoji="📅" title="Delivery Preference" />
              <div className="label" style={{ marginBottom:10 }}>Preferred Delivery Time</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14 }}>
                {[{id:'morning',emoji:'🌅',label:'Morning',time:'7 AM – 11 AM'},{id:'afternoon',emoji:'☀️',label:'Afternoon',time:'12 PM – 5 PM'},{id:'evening',emoji:'🌙',label:'Evening',time:'5 PM – 9 PM'}].map(s=>(
                  <div key={s.id} onClick={()=>setPrefTime(s.id)}
                    style={{ border:`1.5px solid ${prefTime===s.id?'var(--green)':'var(--border)'}`,borderRadius:var(--r-md),padding:'12px 6px',textAlign:'center',cursor:'pointer',background:prefTime===s.id?'var(--green-pale)':'var(--white)',transition:'all 0.15s' }}>
                    <div style={{ fontSize:24,marginBottom:4 }}>{s.emoji}</div>
                    <div style={{ fontSize:12,fontWeight:700,marginBottom:2 }}>{s.label}</div>
                    <div style={{ fontSize:10,color:'var(--text-light)',marginBottom:6 }}>{s.time}</div>
                    <div style={{ width:16,height:16,borderRadius:'50%',border:`2px solid ${prefTime===s.id?'var(--green)':'var(--border)'}`,background:prefTime===s.id?'var(--green)':'transparent',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      {prefTime===s.id&&<span style={{ color:'#fff',fontSize:9,fontWeight:700 }}>✓</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="field">
                <label className="label">Delivery Instructions <span className="opt">(Optional)</span></label>
                <textarea className="ta" rows={3} maxLength={120} placeholder="e.g. Leave at doorstep, call before delivery, etc." value={dlvInstr} onChange={e=>setDlvInstr(e.target.value)} />
                <div style={{ fontSize:11,color:'var(--text-light)',textAlign:'right',marginTop:3 }}>Max 120 characters · {dlvInstr.length}/120</div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="card">
              <SecH emoji="🛡️" title="Emergency Contact" />
              <div style={{ fontSize:12,color:'var(--text-light)',marginBottom:12 }}>
                <span style={{ fontWeight:500 }}>(Optional)</span> — In case we are unable to reach you.
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                <div className="field">
                  <label className="label">Contact Person Name</label>
                  <div className="input-row"><span className="input-ico">👤</span>
                    <input className="inp" placeholder="e.g. Aravind Krishnan" value={ecName} onChange={e=>setEcName(e.target.value)} /></div>
                </div>
                <div className="field">
                  <label className="label">Relationship</label>
                  <div className="input-row"><span className="input-ico">👥</span>
                    <input className="inp" placeholder="e.g. Husband" value={ecRel} onChange={e=>setEcRel(e.target.value)} /></div>
                </div>
                <div className="field">
                  <label className="label">Mobile Number</label>
                  <div className="input-row"><span className="input-ico">📞</span>
                    <input className="inp" placeholder="+91 98765 43211" value={ecPhone} onChange={e=>setEcPhone(e.target.value)} /></div>
                </div>
              </div>
              <div style={{ display:'flex',alignItems:'flex-start',gap:10,background:'var(--green-light)',border:'1px solid #C8E6C9',borderRadius:10,padding:'10px 12px',marginTop:14 }}>
                <div style={{ width:30,height:30,borderRadius:'50%',background:'var(--green-pale)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0 }}>🔒</div>
                <div>
                  <div style={{ fontSize:12,fontWeight:700,color:'var(--green)',marginBottom:2 }}>We value your privacy</div>
                  <div style={{ fontSize:11,color:'var(--text-mid)',lineHeight:1.5 }}>Your information is used only for deliveries and personalized wellness recommendations. <span style={{ color:'var(--green)',textDecoration:'underline',cursor:'pointer' }}>Learn more</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ STEP 1 ══════════════ */}
        {step===1&&(
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {/* Existing members */}
            {members.length>0&&(
              <div style={{ background:'var(--white)',borderRadius:var(--r-lg),border:'1px solid var(--border)',padding:'14px',marginBottom:4 }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
                  <div style={{ fontSize:14,fontWeight:700 }}>Your Family ({members.length})</div>
                  <span style={{ fontSize:12,fontWeight:600,color:'var(--green)',cursor:'pointer' }}>View / Edit All  ›</span>
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                  {members.map((m,i)=>{
                    const a=age(m.dob), hasG=(mGoals[m._tid]||[]).length>0
                    return (
                      <div key={i} style={{ border:'1.5px solid var(--border)',borderRadius:12,padding:12,position:'relative' }}>
                        <button onClick={()=>editMem(i)} style={{ position:'absolute',top:8,right:8,fontSize:14,color:'var(--text-light)',padding:'2px 4px' }}>✏️</button>
                        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                          <div className="avatar" style={{ background:acolor(i),width:34,height:34,fontSize:12 }}>{initials(m.name)}</div>
                          <div>
                            <div style={{ fontSize:12,fontWeight:700,color:'var(--green)' }}>{m.name}{i===0?' (You)':''}</div>
                            <div style={{ fontSize:11,color:'var(--text-light)' }}>{m.rel}{a?` · ${a} yrs`:''} · {m.gender}</div>
                          </div>
                        </div>
                        {hasG
                          ? <div style={{ display:'flex',alignItems:'center',gap:4,fontSize:11,color:'var(--green)',fontWeight:600 }}>✅ Profile complete</div>
                          : <div style={{ display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#E67E22',fontWeight:600 }}>⏳ Wellness details pending</div>
                        }
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Add member form */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <span style={{ fontSize:20 }}>👤➕</span>
                  <span style={{ fontSize:15,fontWeight:700 }}>Add Family Member</span>
                </div>
                <span style={{ fontSize:11,fontWeight:700,background:'#FFF0F0',color:'var(--red)',padding:'3px 8px',borderRadius:6 }}>* Required</span>
              </div>

              {/* Relationship */}
              <div className="field" style={{ marginBottom:14 }}>
                <label className="label">Relationship <span style={{ color:'var(--red)' }}>*</span></label>
                <div style={{ display:'flex',gap:6,marginTop:4,overflowX:'auto',paddingBottom:2 }}>
                  {RELS.map(r=>(
                    <button key={r.id} onClick={()=>setNewM(p=>({...p,rel:r.id}))}
                      style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'10px 8px',borderRadius:10,border:`1.5px solid ${newM.rel===r.id?'var(--green)':'var(--border)'}`,background:newM.rel===r.id?'var(--green)':'var(--white)',color:newM.rel===r.id?'#fff':'var(--text-mid)',cursor:'pointer',minWidth:52,flexShrink:0,transition:'all 0.15s' }}>
                      <span style={{ fontSize:22 }}>{r.emoji}</span>
                      <span style={{ fontSize:10,fontWeight:700 }}>{r.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="field" style={{ marginBottom:12 }}>
                <label className="label">Full Name <span style={{ color:'var(--red)' }}>*</span></label>
                <div className="input-row"><span className="input-ico">👤</span>
                  <input className="inp" placeholder="e.g. Priya Krishnan" value={newM.name} onChange={e=>setNewM(p=>({...p,name:e.target.value}))} /></div>
              </div>

              {/* DOB + Gender */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:4 }}>
                <div className="field">
                  <label className="label">Date of Birth <span style={{ color:'var(--red)' }}>*</span></label>
                  <div className="input-row"><span className="input-ico">📅</span>
                    <input className="inp" type="date" value={newM.dob} onChange={e=>setNewM(p=>({...p,dob:e.target.value}))} /></div>
                  <div style={{ fontSize:10,color:'var(--text-light)' }}>We'll use this to calculate age.</div>
                </div>
                <div className="field">
                  <label className="label">Gender <span style={{ color:'var(--red)' }}>*</span></label>
                  <div style={{ display:'flex',gap:5 }}>
                    {['Female','Male','Prefer not to say'].map(g=>(
                      <button key={g} onClick={()=>setNewM(p=>({...p,gender:g}))}
                        style={{ flex:1,padding:'9px 4px',borderRadius:8,border:`1.5px solid ${newM.gender===g?'var(--green)':'var(--border)'}`,background:newM.gender===g?'var(--green-pale)':'var(--white)',color:newM.gender===g?'var(--green)':'var(--text-mid)',fontSize:10,fontWeight:600,cursor:'pointer',transition:'all 0.15s',display:'flex',alignItems:'center',justifyContent:'center',gap:3 }}>
                        {g==='Female'?'👩':g==='Male'?'👨':'🧑'} {g==='Prefer not to say'?'N/A':g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginBottom:12 }} />

              {/* Height + Weight */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:4 }}>
                <div className="field">
                  <label className="label">Height (cm) <span className="opt">Optional</span></label>
                  <div className="input-row"><span className="input-ico">📏</span>
                    <input className="inp" type="number" placeholder="e.g. 165" value={newM.height} onChange={e=>setNewM(p=>({...p,height:e.target.value}))} /></div>
                  <div style={{ fontSize:10,color:'var(--text-light)' }}>Used only for better recommendations.</div>
                </div>
                <div className="field">
                  <label className="label">Weight (kg) <span className="opt">Optional</span></label>
                  <div className="input-row"><span className="input-ico">⚖️</span>
                    <input className="inp" type="number" placeholder="e.g. 65" value={newM.weight} onChange={e=>setNewM(p=>({...p,weight:e.target.value}))} /></div>
                  <div style={{ fontSize:10,color:'var(--text-light)' }}>Used only for better recommendations.</div>
                </div>
              </div>
              {bmi&&bi&&(
                <div style={{ fontSize:12,fontWeight:600,color:bi.color,marginBottom:10,padding:'5px 10px',background:bi.color+'15',borderRadius:8 }}>
                  BMI {bmi} · {bi.label}
                </div>
              )}

              {/* Activity Level */}
              <div className="field" style={{ marginBottom:14 }}>
                <label className="label" style={{ marginBottom:8 }}>Activity Level <span style={{ color:'var(--red)' }}>*</span></label>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7 }}>
                  {ACTIVITY.map(a=>(
                    <div key={a.id} className={`act-card${newM.activity===a.id?' on':''}`} onClick={()=>setNewM(p=>({...p,activity:a.id}))}>
                      {newM.activity===a.id&&<div className="act-check">✓</div>}
                      <div style={{ fontSize:22,marginBottom:3 }}>{a.emoji}</div>
                      <div style={{ fontSize:10,fontWeight:700,lineHeight:1.3 }}>{a.label}</div>
                      <div style={{ fontSize:9,color:'var(--text-light)',whiteSpace:'pre-line',marginTop:2,lineHeight:1.3 }}>{a.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Include checkbox */}
              <label style={{ display:'flex',alignItems:'center',gap:10,cursor:'pointer',marginBottom:16,fontSize:13,color:'var(--text-mid)' }} onClick={()=>setNewM(p=>({...p,include:!p.include}))}>
                <div style={{ width:20,height:20,borderRadius:5,border:`2px solid ${newM.include?'var(--green)':'var(--border)'}`,background:newM.include?'var(--green)':'var(--white)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s' }}>
                  {newM.include&&<span style={{ color:'#fff',fontSize:11,fontWeight:700 }}>✓</span>}
                </div>
                Include this member in family basket suggestions
                <span style={{ marginLeft:'auto',color:'var(--text-light)',fontSize:15 }}>ℹ️</span>
              </label>

              {/* Action buttons */}
              <div style={{ display:'grid',gridTemplateColumns:editIdx!==null?'1fr 2fr':'1fr',gap:10 }}>
                {editIdx!==null&&(
                  <button className="btn btn-outline" onClick={()=>{setEditIdx(null);setNewM({rel:'Self',name:'',dob:'',gender:'Female',height:'',weight:'',activity:'moderate',include:true})}}>Cancel</button>
                )}
                <button className="btn btn-primary" onClick={saveMember}>{editIdx!==null?'Update Member':'Save Member  →'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ STEP 2 ══════════════ */}
        {step===2&&(
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {/* Goal grid */}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
              {goalsList.map(g=>{
                const on = curMem&&curGoals.includes(g.name)
                return (
                  <div key={g.name} className={`goal-card${on?' on':''}`} onClick={()=>curMem&&toggleGoal(curMem._tid,g.name)}>
                    <div className="gc-radio">{on&&<span className="gc-check">✓</span>}</div>
                    <div style={{ fontSize:28,marginBottom:6 }}>{g.emoji}</div>
                    <div style={{ fontSize:12,fontWeight:700,lineHeight:1.3,marginBottom:3 }}>{g.name}</div>
                    <div style={{ fontSize:10,color:'var(--text-light)',lineHeight:1.4 }}>{g.desc}</div>
                  </div>
                )
              })}
            </div>

            {/* Health Challenges */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'flex-start',gap:8,marginBottom:8 }}>
                <span style={{ fontSize:18 }}>💗</span>
                <div>
                  <span style={{ fontSize:14,fontWeight:700 }}>Current Health Challenges</span>
                  <span style={{ fontSize:11,color:'var(--text-light)',marginLeft:6 }}>(Optional)</span>
                  <div style={{ fontSize:12,color:'var(--text-light)',marginTop:2 }}>Select any health challenges applicable to {curMem?.name?.split(' ')[0]||'this member'}.</div>
                </div>
              </div>
              <div className="input-row" style={{ marginBottom:10 }}>
                <span className="input-ico">🔍</span>
                <input className="inp" placeholder="Search health challenges" value={hcQ} onChange={e=>setHcQ(e.target.value)} />
              </div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:7 }}>
                {/* Selected chips first */}
                {curMem&&(mHC[curMem._tid]||[]).map(ch=>(
                  <button key={ch} onClick={()=>toggleHC(curMem._tid,ch)}
                    style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:20,border:'1.5px solid var(--green)',background:'var(--green-pale)',color:'var(--green)',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                    {ch} <span style={{ fontSize:14 }}>×</span>
                  </button>
                ))}
                {/* Add more */}
                {hcFiltered.filter(ch=>!(mHC[curMem?._tid]||[]).includes(ch)).slice(0,6).map(ch=>(
                  <button key={ch} onClick={()=>curMem&&toggleHC(curMem._tid,ch)}
                    style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:20,border:'1.5px solid var(--border)',background:'var(--white)',color:'var(--text-mid)',fontSize:12,fontWeight:500,cursor:'pointer' }}>
                    + {ch}
                  </button>
                ))}
                {!hcQ&&<button style={{ padding:'5px 10px',borderRadius:20,border:'1.5px solid var(--border)',background:'var(--white)',color:'var(--text-mid)',fontSize:12,cursor:'pointer' }}>+ Add more</button>}
              </div>
            </div>

            {/* Security note */}
            <div style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 12px',background:'var(--green-light)',borderRadius:10 }}>
              <span style={{ fontSize:14 }}>🛡️</span>
              <span style={{ fontSize:12,color:'var(--text-mid)' }}>Your information is secure and used only to personalize your wellness plan.</span>
            </div>

            {/* Member tabs */}
            {members.length>1&&(
              <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                {members.map((m,i)=>(
                  <button key={i} onClick={()=>setActiveMem(i)}
                    style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:20,border:`1.5px solid ${activeMem===i?'var(--green)':'var(--border)'}`,background:activeMem===i?'var(--green)':'var(--white)',color:activeMem===i?'#fff':'var(--text-mid)',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                    {(mGoals[m._tid]||[]).length>0?'✅ ':''}{m.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ STEP 3 ══════════════ */}
        {step===3&&(
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {/* Diet Type */}
            <div className="card">
              <SecH emoji="🍽️" title="Diet Type" />
              <div style={{ fontSize:12,color:'var(--text-light)',marginBottom:12 }}>Helps us suggest suitable products</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8 }}>
                {[{id:'Vegetarian',emoji:'🌿',desc:'No meat, poultry or fish'},{id:'Eggetarian',emoji:'🥚',desc:'Includes eggs'},{id:'Non-Vegetarian',emoji:'🐟',desc:'Includes meat, poultry & fish'}].map(d=>(
                  <div key={d.id} onClick={()=>setDiet(d.id)}
                    style={{ border:`1.5px solid ${diet===d.id?'var(--green)':'var(--border)'}`,borderRadius:12,padding:'14px 8px',textAlign:'center',cursor:'pointer',background:diet===d.id?'var(--green-pale)':'var(--white)',transition:'all 0.15s',position:'relative' }}>
                    <div style={{ position:'absolute',top:8,right:8,width:16,height:16,borderRadius:'50%',border:`2px solid ${diet===d.id?'var(--green)':'var(--border)'}`,background:diet===d.id?'var(--green)':'var(--white)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      {diet===d.id&&<span style={{ color:'#fff',fontSize:9,fontWeight:700 }}>✓</span>}
                    </div>
                    <div style={{ fontSize:28,marginBottom:8 }}>{d.emoji}</div>
                    <div style={{ fontSize:12,fontWeight:700,marginBottom:3 }}>{d.id}</div>
                    <div style={{ fontSize:10,color:'var(--text-light)',lineHeight:1.4 }}>{d.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Restrictions side by side */}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <div className="card">
                <SecH emoji="🥬" title="Vegetable / Fruit Restrictions" />
                <div style={{ fontSize:11,color:'var(--text-light)',marginBottom:8 }}>Any allergies or ingredients to avoid?</div>
                <div style={{ display:'flex',gap:6,marginBottom:8 }}>
                  {[{v:true,l:'Yes, I have restrictions'},{v:false,l:'No restrictions'}].map(o=>(
                    <button key={String(o.v)} onClick={()=>setVegRestr(o.v)}
                      style={{ flex:1,padding:'8px 6px',borderRadius:8,border:`1.5px solid ${vegRestr===o.v?'var(--green)':'var(--border)'}`,background:vegRestr===o.v?'var(--green-pale)':'var(--white)',color:vegRestr===o.v?'var(--green)':'var(--text-mid)',fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
                      {vegRestr===o.v&&<span style={{ fontSize:13 }}>✅</span>}{o.l}
                    </button>
                  ))}
                </div>
                {vegRestr&&(
                  <>
                    <div className="input-row" style={{ marginBottom:5 }}><span className="input-ico">🔍</span><input className="inp" placeholder="Search vegetables & greens..." value={vegQ} onChange={e=>setVegQ(e.target.value)} /></div>
                    <div style={{ fontSize:10,color:'var(--text-light)' }}>Selected items will be excluded from your basket</div>
                  </>
                )}
              </div>
              <div className="card">
                <SecH emoji="🍊" title="Fruit Restrictions" />
                <div style={{ fontSize:11,color:'var(--text-light)',marginBottom:8 }}>Any fruits you prefer to avoid?</div>
                <div className="input-row" style={{ marginBottom:5 }}><span className="input-ico">🔍</span><input className="inp" placeholder="Search fruits..." value={fruitQ} onChange={e=>setFruitQ(e.target.value)} /></div>
                <div style={{ fontSize:10,color:'var(--text-light)' }}>Selected items will be excluded from your basket</div>
              </div>
            </div>

            {/* Preferred Taste */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
                <span style={{ fontSize:18 }}>💗</span>
                <span style={{ fontSize:14,fontWeight:700 }}>Preferred Taste</span>
                <span style={{ fontSize:11,color:'var(--text-light)' }}>(Select all that you like)</span>
              </div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                {TASTE.map(t=>(
                  <button key={t} onClick={()=>toggleTaste(t)}
                    className={`pill${taste.includes(t)?' on':''}`}>
                    {taste.includes(t)&&<span>✓</span>}{t}
                  </button>
                ))}
              </div>
            </div>

            {/* Cooking Preference */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
                <span style={{ fontSize:18 }}>👨‍🍳</span>
                <span style={{ fontSize:14,fontWeight:700 }}>Cooking Preference</span>
                <span style={{ fontSize:11,color:'var(--text-light)' }}>(Select all that apply)</span>
              </div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                {COOKING.map(c=>(
                  <button key={c} onClick={()=>toggleCook(c)}
                    className={`pill${cook.includes(c)?' on':''}`}>
                    {cook.includes(c)&&<span>✓</span>}{c}
                  </button>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
                <span style={{ fontSize:18 }}>🛡️</span>
                <span style={{ fontSize:14,fontWeight:700 }}>Allergies & Restrictions</span>
                <span style={{ fontSize:11,color:'var(--text-light)' }}>(Select all that apply)</span>
              </div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                {ALLERGY.map(a=>(
                  <button key={a} onClick={()=>toggleAllergy(a)}
                    className={`pill${allergy.includes(a)?' on':''}`}>
                    {allergy.includes(a)&&<span>✓</span>}{a}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred Plan */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                <span style={{ fontSize:18 }}>📅</span>
                <span style={{ fontSize:14,fontWeight:700 }}>Preferred Plan</span>
              </div>
              <div style={{ fontSize:12,color:'var(--text-light)',marginBottom:12 }}>Select a plan that will apply to all family members</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8 }}>
                {[{id:'weekly',emoji:'🧺',label:'Weekly Plan',sub:'₹699',sub2:'7 Days'},{id:'daily',emoji:'🥕',label:'Daily Plan',sub:'Save 5%',sub2:''},{id:'alternate',emoji:'📅',label:'Alternate Days',sub:'Two days once',sub2:''}].map(p=>(
                  <div key={p.id} className={`plan-card${prefPlan===p.id?' on':''}`} onClick={()=>setPrefPlan(p.id)}>
                    <div className="plan-radio" />
                    <div style={{ fontSize:26,marginBottom:6,marginTop:6 }}>{p.emoji}</div>
                    <div style={{ fontSize:11,fontWeight:700,marginBottom:2 }}>{p.label}</div>
                    <div style={{ fontSize:11,color:prefPlan===p.id?'var(--green)':'var(--text-mid)',fontWeight:600 }}>{p.sub}</div>
                    {p.sub2&&<div style={{ fontSize:10,color:'var(--text-light)' }}>{p.sub2}</div>}
                  </div>
                ))}
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:10,padding:'8px 10px',background:'#F8F8F8',borderRadius:8 }}>
                <span style={{ fontSize:14 }}>ℹ️</span>
                <span style={{ fontSize:12,color:'var(--text-light)' }}>You can change or pause your plan any time.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Fixed bottom CTA ── */}
      <div style={{ position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:430,background:'var(--white)',borderTop:'1px solid var(--border)',padding:'12px 18px max(16px,env(safe-area-inset-bottom))',zIndex:100 }}>
        <button className="btn btn-primary" onClick={proceed} disabled={busy} style={{ fontSize:15 }}>
          {busy ? <span className="spin" /> : step===3 ? 'Get Started  🎉' : 'Save & Continue  →'}
        </button>
        <div style={{ textAlign:'center',marginTop:6,fontSize:11,color:'var(--text-light)',display:'flex',alignItems:'center',justifyContent:'center',gap:4 }}>
          🔒 Your data is secure with us
        </div>
      </div>
    </div>
  )
}
