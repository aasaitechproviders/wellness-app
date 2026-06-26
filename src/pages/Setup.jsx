import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { showToast } from '../components/Toast'
import logo from '../assets/logo.png'

const GOAL_META = {
  'Immunity Support':   { icon:'🛡️', color:'#E8F5E9', desc:'Strengthen immunity naturally' },
  'Protein Support':    { icon:'💪', color:'#FFF9C4', desc:'Build & repair muscles' },
  'Iron Support':       { icon:'💧', color:'#FFEBEE', desc:'Improve hemoglobin levels' },
  'Weight Management':  { icon:'⚖️', color:'#F3E5F5', desc:'Healthy weight control' },
  'Diabetes Friendly':  { icon:'🩺', color:'#E1F5FE', desc:'Balanced sugar management' },
  'Heart Wellness':     { icon:'❤️', color:'#FCE4EC', desc:'Support heart health' },
  'Digestive Wellness': { icon:'🌀', color:'#E8F5E9', desc:'Better digestion & gut health' },
  'Bone Health':        { icon:'🦴', color:'#F3E5F5', desc:"Stronger bones & joints" },
  "Women's Wellness":   { icon:'🌸', color:'#FCE4EC', desc:'Hormonal & overall well-being' },
  'Kids Nutrition':     { icon:'😊', color:'#FFF8E1', desc:'Support growth & development' },
  'Senior Wellness':    { icon:'👴', color:'#EFEBE9', desc:'Healthy ageing & vitality' },
  'Other Goal':         { icon:'···', color:'#F5F5F5', desc:'Something else in mind?' },
}
const TASTE_PREFS  = ['Sweet','Mild','Tangy','Spicy','Bitter']
const COOK_PREFS   = ['Quick Cooking','Traditional Cooking','Salads','Juices','Smoothies','Soups']
const ALLERGIES    = ['Nut Allergy','Gluten Sensitivity','Lactose Intolerance','None']
const DIET_TYPES   = [
  { id:'Vegetarian',    icon:'🌿', desc:'No meat, poultry or fish' },
  { id:'Eggetarian',    icon:'🥚', desc:'Includes eggs' },
  { id:'Non-Vegetarian',icon:'🐟', desc:'Includes meat, poultry & fish' },
]
const PLAN_OPTS = [
  { id:'weekly',  label:'Weekly Plan',    price:'₹699', days:'7 Days', icon:'🧺' },
  { id:'daily',   label:'Daily Plan',     price:'Save 5%', days:'', icon:'🥕' },
  { id:'alternate',label:'Alternate Days',price:'Two days once', days:'', icon:'📅' },
]
const STEPS = ['Personal &\nDelivery','Family\nMembers','Wellness\nGoals','Food\nPreferences']
const RELS  = ['Self','Spouse','Child','Parent','Grandparent','Other']
const ACTIVITY = [
  { id:'sedentary', label:'Sedentary', sub:'Mostly sitting;\nlittle exercise', icon:'🪑' },
  { id:'lightly',   label:'Lightly Active', sub:'Light exercise\n1–3 days/week', icon:'🚶' },
  { id:'moderate',  label:'Moderately Active', sub:'Exercise\n3–5 days/week', icon:'🏃' },
  { id:'high',      label:'Highly Active', sub:'Intense exercise\nmost days', icon:'🏋️' },
]

function calcBMI(h,w){ if(!h||!w) return null; const hm=parseFloat(h)/100; if(hm<=0) return null; return (parseFloat(w)/(hm*hm)).toFixed(1) }
function bmiCat(b){ if(!b) return ''; const v=parseFloat(b); if(v<18.5) return 'Underweight'; if(v<25) return 'Normal'; if(v<30) return 'Overweight'; return 'Obese' }
function bmiColor(b){ if(!b) return 'var(--green)'; const v=parseFloat(b); if(v<18.5||v>=25) return '#E67E22'; if(v>=30) return '#E53935'; return '#27AE60' }

const Stepper = ({ step }) => (
  <div className="stepper">
    {STEPS.map((s,i) => {
      const done = i < step, active = i === step
      return (
        <div key={i} className={`step-item${done?' done':''}${active?' active':''}`}>
          <div className="step-circle">{done ? '✓' : i+1}</div>
          <div className="step-label" style={{ whiteSpace:'pre-line', textAlign:'center' }}>{s}</div>
        </div>
      )
    })}
  </div>
)

const SectionHdr = ({ icon, title }) => (
  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
    <span style={{ fontSize:20 }}>{icon}</span>
    <span style={{ fontSize:16, fontWeight:700, color:'var(--text)' }}>{title}</span>
  </div>
)

export default function Setup() {
  const { family, updateFamily } = useAuth()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [goals, setGoals]   = useState([])

  // Step 0 state
  const [s0, setS0] = useState({
    name:'', email:'', city:'Coimbatore', deliveryType:'individual',
    aptName:'', tower:'', flat:'', landmark:'', pincode:'',
    prefTime:'morning', delivInstr:'', ecName:'', ecRel:'', ecPhone:'',
  })
  // Step 1 state
  const [members, setMembers]     = useState([])
  const [addOpen, setAddOpen]     = useState(false)
  const [editIdx, setEditIdx]     = useState(null)
  const [newM, setNewM]           = useState({ rel:'Self', name:'', dob:'', gender:'Female', height:'', weight:'', activity:'moderate', include:true })
  // Step 2 state
  const [activeMember, setActiveMember] = useState(0)
  const [memberGoals, setMemberGoals]   = useState({})
  const [healthChallenges, setHC]       = useState({})
  const [hcSearch, setHcSearch]         = useState('')
  // Step 3 state
  const [diet, setDiet]     = useState('Vegetarian')
  const [vegRestr, setVegR] = useState(false)
  const [vegSearch, setVegSearch] = useState('')
  const [fruitSearch, setFrSearch] = useState('')
  const [taste, setTaste]   = useState([])
  const [cook, setCook]     = useState([])
  const [allergy, setAllergy] = useState(['None'])
  const [prefPlan, setPrefPlan] = useState('weekly')

  useEffect(() => {
    api.getGoals().then(d => setGoals(d.goals || [])).catch(()=>{})
    if (family) {
      setS0(p => ({ ...p, name: family.familyName || '', city: family.city || 'Coimbatore' }))
    }
  }, [family])

  const bmi = calcBMI(newM.height, newM.weight)

  // ── Relationship icons ──
  const RelIcon = ({ rel }) => {
    const icons = { Self:'👤', Spouse:'👫', Child:'👶', Parent:'👨', Grandparent:'👴', Other:'👥' }
    return <span style={{ fontSize:22 }}>{icons[rel]||'👤'}</span>
  }

  // ── Save & proceed ──
  const proceed = async () => {
    if (step === 0) {
      if (!s0.name.trim()) return showToast('Full name is required','error')
      setStep(1)
    } else if (step === 1) {
      if (members.length === 0) return showToast('Add at least one family member','error')
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else {
      // Final save
      setSaving(true)
      try {
        let fam = family
        if (!fam?._id) {
          const phone = localStorage.getItem('kp_phone') || ''
          const reg = await api.registerFamily({
            familyName: s0.name, phone, email: s0.email,
            city: s0.city, deliveryType: s0.deliveryType,
            apartmentName: s0.aptName, towerNo: s0.tower, flatNo: s0.flat,
            landmark: s0.landmark, pincode: s0.pincode,
            preferredDeliveryTime: s0.prefTime, deliveryInstructions: s0.delivInstr,
            dietPreference: diet,
          })
          fam = reg.family
          updateFamily(fam)
        } else {
          const upd = await api.updateFamily(fam._id, {
            familyName: s0.name, email: s0.email,
            city: s0.city, deliveryType: s0.deliveryType,
            apartmentName: s0.aptName, towerNo: s0.tower, flatNo: s0.flat,
            landmark: s0.landmark, pincode: s0.pincode,
            preferredDeliveryTime: s0.prefTime, deliveryInstructions: s0.delivInstr,
            dietPreference: diet,
          })
          fam = upd.family || fam
          updateFamily(fam)
        }
        // Add members
        for (const m of members) {
          try {
            await api.addMember(fam._id, {
              name: m.name, gender: m.gender,
              age: m.dob ? Math.floor((new Date()-new Date(m.dob))/31557600000) : null,
              height: parseFloat(m.height)||null, weight: parseFloat(m.weight)||null,
              activityLevel: m.activity, relationship: m.rel,
              wellnessGoals: memberGoals[m._tmpId] || [],
              healthChallenges: healthChallenges[m._tmpId] || [],
            })
          } catch {}
        }
        showToast('Profile saved! 🎉','success')
        nav('/home', { replace:true })
      } catch(e) {
        showToast(e.message||'Save failed','error')
      } finally { setSaving(false) }
    }
  }

  const saveMember = () => {
    if (!newM.name.trim()) return showToast('Name is required','error')
    if (!newM.dob) return showToast('Date of birth is required','error')
    const m = { ...newM, _tmpId: Date.now().toString() }
    if (editIdx !== null) {
      setMembers(p => p.map((x,i) => i===editIdx ? m : x))
      setEditIdx(null)
    } else {
      setMembers(p => [...p, m])
    }
    setNewM({ rel:'Self', name:'', dob:'', gender:'Female', height:'', weight:'', activity:'moderate', include:true })
    setAddOpen(false)
  }

  const editMember = (idx) => {
    setNewM(members[idx])
    setEditIdx(idx)
    setAddOpen(true)
  }

  const toggleGoal = (memberId, gName) => {
    setMemberGoals(p => {
      const cur = p[memberId] || []
      if (!cur.includes(gName) && cur.length >= 3) { showToast('Max 3 goals per member','error'); return p }
      return { ...p, [memberId]: cur.includes(gName) ? cur.filter(x=>x!==gName) : [...cur,gName] }
    })
  }

  const toggleTaste = (t) => setTaste(p => p.includes(t)?p.filter(x=>x!==t):[...p,t])
  const toggleCook  = (c) => setCook(p => p.includes(c)?p.filter(x=>x!==c):[...p,c])
  const toggleAllergy = (a) => {
    if (a==='None') { setAllergy(['None']); return }
    setAllergy(p => {
      const f = p.filter(x=>x!=='None')
      return f.includes(a) ? f.filter(x=>x!==a) : [...f,a]
    })
  }

  const AVATAR_COLORS = ['#2D6A35','#1565C0','#AD1457','#E65100','#6A1B9A']
  const avatarColor = (i) => AVATAR_COLORS[i % AVATAR_COLORS.length]
  const initials = (name) => name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()

  const curMemberObj = members[activeMember]

  return (
    <div className="page-shell fade-in">
      {/* ── Sticky header ── */}
      <div style={{ background:'var(--cream)', padding:'16px 18px 0', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <button className="back-btn" onClick={()=>step>0?setStep(step-1):nav('/login')}>←</button>
          <img src={logo} alt="KP" style={{ width:32, height:32, objectFit:'contain', borderRadius:8 }} />
          <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:700, color:'var(--green-dark)' }}>KRISHA PURE</div>
          {/* Member switcher for steps 2-3 */}
          {(step===2||step===3) && members.length>0 && (
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8, background:'var(--white)', border:'1.5px solid var(--border)', borderRadius:10, padding:'6px 10px', cursor:'pointer' }}
              onClick={() => setActiveMember(p => (p+1)%members.length)}>
              <span style={{ fontSize:16 }}>👥</span>
              <div>
                <div style={{ fontSize:12, fontWeight:700 }}>Member: {members[activeMember]?.name?.split(' ')[0]} {activeMember===0?'(You)':''}</div>
                <div style={{ fontSize:10, color:'var(--text-light)' }}>
                  {members[activeMember]?.gender} · {members[activeMember]?.dob ? Math.floor((new Date()-new Date(members[activeMember].dob))/31557600000)+' yrs' : ''}
                </div>
              </div>
              <span style={{ fontSize:12, color:'var(--text-light)' }}>▾</span>
            </div>
          )}
        </div>
      </div>

      {/* Page title */}
      <div style={{ padding:'0 18px 10px', background:'var(--cream)', flexShrink:0, position:'relative' }}>
        {step===2 && (
          <div style={{ position:'absolute', top:0, right:80 }}>
            <div style={{ background:'var(--green)', color:'#fff', borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>
              ✓ {(memberGoals[curMemberObj?._tmpId]||[]).length} selected
            </div>
          </div>
        )}
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', color:'var(--green)', marginBottom:2 }}>
          STEP {step+1} OF 4
        </div>
        <div style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:700, color:'var(--text)' }}>
          {['Personal & Delivery Details','Family Members','Wellness Goals','Food Preferences'][step]}
        </div>
        <div style={{ fontSize:13, color:'var(--text-light)', marginTop:2 }}>
          {['Help us serve you better with fresh, personalized wellness baskets.',
            'Add each member to receive personalized wellness recommendations.',
            `Choose up to 3 wellness goals for ${curMemberObj?.name?.split(' ')[0]||'you'}`,
            'Help us curate baskets you\'ll love, every time.'][step]}
        </div>
      </div>

      {/* Stepper */}
      <Stepper step={step} />

      {/* ── Scrollable content ── */}
      <div className="page-shell-scroll" style={{ padding:'16px 18px 100px' }}>

        {/* ════ STEP 0: Personal & Delivery ════ */}
        {step===0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Personal Information */}
            <div className="card">
              <SectionHdr icon="👤" title="Personal Information" />
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <div className="input-wrap">
                    <span className="input-icon">👤</span>
                    <input className="kp-input" placeholder="e.g. Priya Krishnan" value={s0.name} onChange={e=>setS0(p=>({...p,name:e.target.value}))} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Mobile Number</label>
                  <div className="input-wrap">
                    <span className="input-icon">📞</span>
                    <input className="kp-input" value={'+91 '+(localStorage.getItem('kp_phone')||'')} readOnly style={{ color:'var(--text-mid)', background:'#FAFAFA' }} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address <span className="opt">(Optional)</span></label>
                  <div className="input-wrap">
                    <span className="input-icon">✉️</span>
                    <input className="kp-input" type="email" placeholder="e.g. priya@gmail.com" value={s0.email} onChange={e=>setS0(p=>({...p,email:e.target.value}))} />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="card">
              <SectionHdr icon="📍" title="Delivery Address" />
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div className="input-group">
                  <label className="input-label">City</label>
                  <select className="kp-select" value={s0.city} onChange={e=>setS0(p=>({...p,city:e.target.value}))}>
                    <option>Coimbatore</option>
                    <option>Chennai</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Delivery Location Type</label>
                  {[{id:'individual',icon:'🏠',title:'Individual Home',sub:'Deliver to your home or apartment'},{id:'gated',icon:'🏢',title:'Gated Community / Wellness Partner',sub:'Deliver to your community or partner'}].map(opt=>(
                    <div key={opt.id} className={`sel-card${s0.deliveryType===opt.id?' active':''}`} onClick={()=>setS0(p=>({...p,deliveryType:opt.id}))} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                      <span style={{ fontSize:22 }}>{opt.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700 }}>{opt.title}</div>
                        <div style={{ fontSize:11, color:'var(--text-light)' }}>{opt.sub}</div>
                      </div>
                      <div className="sel-radio" />
                    </div>
                  ))}
                </div>
                <div className="input-group">
                  <label className="input-label">Apartment / Building Name</label>
                  <div className="input-wrap">
                    <span className="input-icon">🏢</span>
                    <input className="kp-input" placeholder="e.g. Green Meadows Apartments" value={s0.aptName} onChange={e=>setS0(p=>({...p,aptName:e.target.value}))} />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div className="input-group">
                    <label className="input-label">Tower / Block</label>
                    <div className="input-wrap">
                      <span className="input-icon">🏗️</span>
                      <input className="kp-input" placeholder="e.g. Block A" value={s0.tower} onChange={e=>setS0(p=>({...p,tower:e.target.value}))} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Flat / House No.</label>
                    <div className="input-wrap">
                      <span className="input-icon">🚪</span>
                      <input className="kp-input" placeholder="e.g. B-101" value={s0.flat} onChange={e=>setS0(p=>({...p,flat:e.target.value}))} />
                    </div>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Landmark <span className="opt">(Optional)</span></label>
                  <div className="input-wrap">
                    <span className="input-icon">📌</span>
                    <input className="kp-input" placeholder="e.g. Near Lotus Cafe, Anna Nagar" value={s0.landmark} onChange={e=>setS0(p=>({...p,landmark:e.target.value}))} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Pincode</label>
                  <div className="input-wrap">
                    <span className="input-icon">🏠</span>
                    <input className="kp-input" placeholder="641001" maxLength={6} inputMode="numeric" value={s0.pincode} onChange={e=>setS0(p=>({...p,pincode:e.target.value.replace(/\D/g,'')}))} />
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Preference */}
            <div className="card">
              <SectionHdr icon="📅" title="Delivery Preference" />
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text-mid)', marginBottom:10 }}>Preferred Delivery Time</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                  {[{id:'morning',icon:'🌅',label:'Morning',time:'7 AM – 11 AM'},{id:'afternoon',icon:'☀️',label:'Afternoon',time:'12 PM – 5 PM'},{id:'evening',icon:'🌙',label:'Evening',time:'5 PM – 9 PM'}].map(sl=>(
                    <div key={sl.id} className={`slot-card${s0.prefTime===sl.id?' active':''}`} onClick={()=>setS0(p=>({...p,prefTime:sl.id}))}>
                      <div style={{ fontSize:22, marginBottom:4 }}>{sl.icon}</div>
                      <div style={{ fontSize:12, fontWeight:700 }}>{sl.label}</div>
                      <div style={{ fontSize:10, color:'var(--text-light)' }}>{sl.time}</div>
                      <div style={{ marginTop:6, display:'flex', justifyContent:'center' }}>
                        <div style={{ width:16,height:16,borderRadius:'50%',border:`2px solid ${s0.prefTime===sl.id?'var(--green)':'var(--border)'}`,background:s0.prefTime===sl.id?'var(--green)':'transparent',display:'flex',alignItems:'center',justifyContent:'center' }}>
                          {s0.prefTime===sl.id && <span style={{ color:'#fff',fontSize:9 }}>✓</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Delivery Instructions <span className="opt">(Optional)</span></label>
                <textarea className="kp-textarea" rows={3} maxLength={120} placeholder="e.g. Leave at doorstep, call before delivery, etc." value={s0.delivInstr} onChange={e=>setS0(p=>({...p,delivInstr:e.target.value}))} />
                <div style={{ fontSize:11,color:'var(--text-light)',textAlign:'right',marginTop:2 }}>Max 120 characters · {s0.delivInstr.length}/120</div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="card">
              <SectionHdr icon="🛡️" title="Emergency Contact (Optional)" />
              <div style={{ fontSize:12, color:'var(--text-light)', marginBottom:12 }}>In case we are unable to reach you.</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div className="input-group">
                  <label className="input-label">Contact Person Name</label>
                  <div className="input-wrap"><span className="input-icon">👤</span><input className="kp-input" placeholder="e.g. Aravind Krishnan" value={s0.ecName} onChange={e=>setS0(p=>({...p,ecName:e.target.value}))} /></div>
                </div>
                <div className="input-group">
                  <label className="input-label">Relationship</label>
                  <div className="input-wrap"><span className="input-icon">👥</span><input className="kp-input" placeholder="e.g. Husband" value={s0.ecRel} onChange={e=>setS0(p=>({...p,ecRel:e.target.value}))} /></div>
                </div>
                <div className="input-group">
                  <label className="input-label">Mobile Number</label>
                  <div className="input-wrap"><span className="input-icon">📞</span><input className="kp-input" placeholder="+91 98765 43211" value={s0.ecPhone} onChange={e=>setS0(p=>({...p,ecPhone:e.target.value}))} /></div>
                </div>
              </div>
              <div style={{ display:'flex',alignItems:'flex-start',gap:10,background:'var(--green-light)',borderRadius:10,padding:'10px 12px',marginTop:12 }}>
                <span style={{ fontSize:18 }}>🔒</span>
                <div>
                  <div style={{ fontSize:12,fontWeight:700,color:'var(--green)',marginBottom:2 }}>We value your privacy</div>
                  <div style={{ fontSize:11,color:'var(--text-mid)',lineHeight:1.5 }}>Your information is used only for deliveries and personalized wellness recommendations. <span style={{ color:'var(--green)',textDecoration:'underline',cursor:'pointer' }}>Learn more</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ STEP 1: Family Members ════ */}
        {step===1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Existing members */}
            {members.length>0 && (
              <div className="card">
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
                  <div style={{ fontSize:14,fontWeight:700 }}>Your Family ({members.length})</div>
                  <span style={{ fontSize:12,fontWeight:600,color:'var(--green)',cursor:'pointer' }}>View / Edit All ›</span>
                </div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                  {members.map((m,i)=>{
                    const age = m.dob ? Math.floor((new Date()-new Date(m.dob))/31557600000) : null
                    const hasGoals = (memberGoals[m._tmpId]||[]).length>0
                    return (
                      <div key={i} style={{ border:'1.5px solid var(--border)',borderRadius:12,padding:'12px',position:'relative' }}>
                        <button onClick={()=>editMember(i)} style={{ position:'absolute',top:8,right:8,fontSize:14,color:'var(--text-light)',background:'none',border:'none',cursor:'pointer' }}>✏️</button>
                        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                          <div className="avatar-chip" style={{ width:36,height:36,background:avatarColor(i),fontSize:12 }}>{initials(m.name)}</div>
                          <div>
                            <div style={{ fontWeight:700,fontSize:13 }}>{m.name}{i===0?' (You)':''}</div>
                            <div style={{ fontSize:11,color:'var(--text-light)' }}>{m.rel}{age?` · ${age} yrs`:''} · {m.gender}</div>
                          </div>
                        </div>
                        {hasGoals
                          ? <div style={{ display:'flex',alignItems:'center',gap:5,fontSize:11,color:'var(--green)',fontWeight:600 }}><span>✅</span> Profile complete</div>
                          : <div style={{ display:'flex',alignItems:'center',gap:5,fontSize:11,color:'#E67E22',fontWeight:600 }}><span>⏳</span> Wellness details pending</div>
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
                  <span style={{ fontSize:20 }}>➕</span>
                  <span style={{ fontSize:15,fontWeight:700 }}>Add Family Member</span>
                </div>
                <span style={{ fontSize:11,fontWeight:700,color:'var(--red)',background:'#FFF0F0',padding:'3px 8px',borderRadius:6 }}>* Required</span>
              </div>

              {/* Relationship chips */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:13,fontWeight:600,color:'var(--text-mid)',marginBottom:8 }}>Relationship *</div>
                <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                  {RELS.map(r=>(
                    <button key={r} onClick={()=>setNewM(p=>({...p,rel:r}))}
                      style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'8px 10px',borderRadius:10,border:`1.5px solid ${newM.rel===r?'var(--green)':'var(--border)'}`,background:newM.rel===r?'var(--green)':'var(--white)',color:newM.rel===r?'#fff':'var(--text-mid)',cursor:'pointer',minWidth:52,transition:'all 0.15s' }}>
                      <RelIcon rel={r} />
                      <span style={{ fontSize:10,fontWeight:700 }}>{r}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="input-group" style={{ marginBottom:12 }}>
                <label className="input-label">Full Name *</label>
                <div className="input-wrap"><span className="input-icon">👤</span><input className="kp-input" placeholder="e.g. Priya Krishnan" value={newM.name} onChange={e=>setNewM(p=>({...p,name:e.target.value}))} /></div>
              </div>

              {/* DOB + Gender */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12 }}>
                <div className="input-group">
                  <label className="input-label">Date of Birth *</label>
                  <div className="input-wrap"><span className="input-icon">📅</span><input className="kp-input" type="date" value={newM.dob} onChange={e=>setNewM(p=>({...p,dob:e.target.value}))} /></div>
                  <div style={{ fontSize:10,color:'var(--text-light)' }}>We'll use this to calculate age.</div>
                </div>
                <div className="input-group">
                  <label className="input-label">Gender *</label>
                  <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
                    {['Female','Male','Prefer not to say'].map(g=>(
                      <button key={g} onClick={()=>setNewM(p=>({...p,gender:g}))}
                        style={{ flex:1,padding:'8px 4px',borderRadius:8,border:`1.5px solid ${newM.gender===g?'var(--green)':'var(--border)'}`,background:newM.gender===g?'var(--green-pale)':'var(--white)',color:newM.gender===g?'var(--green)':'var(--text-mid)',fontSize:11,fontWeight:600,cursor:'pointer',transition:'all 0.15s',minWidth:0 }}>
                        {g==='Female'?'👩 ':g==='Male'?'👨 ':'🧑 '}{g==='Prefer not to say'?'Prefer':g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Height + Weight */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:4 }}>
                <div className="input-group">
                  <label className="input-label">Height (cm) <span className="opt">Optional</span></label>
                  <div className="input-wrap"><span className="input-icon">📏</span><input className="kp-input" type="number" placeholder="e.g. 165" value={newM.height} onChange={e=>setNewM(p=>({...p,height:e.target.value}))} /></div>
                </div>
                <div className="input-group">
                  <label className="input-label">Weight (kg) <span className="opt">Optional</span></label>
                  <div className="input-wrap"><span className="input-icon">⚖️</span><input className="kp-input" type="number" placeholder="e.g. 65" value={newM.weight} onChange={e=>setNewM(p=>({...p,weight:e.target.value}))} /></div>
                </div>
              </div>
              {bmi && (
                <div style={{ fontSize:12,color:bmiColor(bmi),fontWeight:600,marginBottom:10,padding:'6px 10px',background:'#F9F9F9',borderRadius:8 }}>
                  BMI: {bmi} · {bmiCat(bmi)}
                </div>
              )}

              {/* Activity Level */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:13,fontWeight:600,color:'var(--text-mid)',marginBottom:8 }}>Activity Level *</div>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6 }}>
                  {ACTIVITY.map(a=>(
                    <div key={a.id} className={`activity-card${newM.activity===a.id?' active':''}`} onClick={()=>setNewM(p=>({...p,activity:a.id}))}>
                      <div style={{ fontSize:22,marginBottom:4 }}>{a.icon}</div>
                      <div style={{ fontSize:11,fontWeight:700,lineHeight:1.3 }}>{a.label}</div>
                      <div style={{ fontSize:9,color:'var(--text-light)',whiteSpace:'pre-line',marginTop:2,lineHeight:1.3 }}>{a.sub}</div>
                      {newM.activity===a.id && <div style={{ marginTop:6,fontSize:12,color:'var(--green)' }}>✓</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Include in family basket */}
              <label style={{ display:'flex',alignItems:'center',gap:10,cursor:'pointer',marginBottom:14 }}>
                <div onClick={()=>setNewM(p=>({...p,include:!p.include}))} style={{ width:20,height:20,borderRadius:5,border:`2px solid ${newM.include?'var(--green)':'var(--border)'}`,background:newM.include?'var(--green)':'var(--white)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s' }}>
                  {newM.include && <span style={{ color:'#fff',fontSize:11,fontWeight:700 }}>✓</span>}
                </div>
                <span style={{ fontSize:13,color:'var(--text-mid)' }}>Include this member in family basket suggestions</span>
                <span style={{ marginLeft:'auto',fontSize:15,color:'var(--text-light)' }}>ℹ️</span>
              </label>

              {/* Buttons */}
              <div style={{ display:'flex',gap:10 }}>
                {addOpen && <button className="btn btn-outline" style={{ flex:1 }} onClick={()=>{setAddOpen(false);setEditIdx(null)}}>Cancel</button>}
                <button className="btn btn-primary" style={{ flex:2 }} onClick={saveMember}>Save Member →</button>
              </div>
            </div>
          </div>
        )}

        {/* ════ STEP 2: Wellness Goals ════ */}
        {step===2 && curMemberObj && (
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            {/* Goal grid */}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10 }}>
              {Object.entries(GOAL_META).map(([name,meta])=>{
                const sel = (memberGoals[curMemberObj._tmpId]||[]).includes(name)
                return (
                  <div key={name} className={`goal-card${sel?' sel':''}`} onClick={()=>toggleGoal(curMemberObj._tmpId,name)}>
                    <div className="gc-check">{sel?'✓':''}</div>
                    <div style={{ fontSize:28,marginBottom:6 }}>{meta.icon}</div>
                    <div style={{ fontSize:12,fontWeight:700,lineHeight:1.3,marginBottom:4 }}>{name}</div>
                    <div style={{ fontSize:10,color:'var(--text-light)',lineHeight:1.4 }}>{meta.desc}</div>
                  </div>
                )
              })}
            </div>

            {/* Health Challenges */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                <span style={{ fontSize:18 }}>💗</span>
                <div>
                  <span style={{ fontSize:14,fontWeight:700 }}>Current Health Challenges</span>
                  <span style={{ fontSize:11,color:'var(--text-light)',marginLeft:6 }}>(Optional)</span>
                </div>
              </div>
              <div style={{ fontSize:12,color:'var(--text-light)',marginBottom:10 }}>Select any health challenges applicable to {curMemberObj.name.split(' ')[0]}.</div>
              <div style={{ position:'relative',marginBottom:10 }}>
                <span style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:14,color:'var(--text-light)' }}>🔍</span>
                <input className="kp-input" style={{ paddingLeft:32 }} placeholder="Search health challenges" value={hcSearch} onChange={e=>setHcSearch(e.target.value)} />
              </div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                {['Blood Sugar','Blood Pressure','Thyroid','PCOS','Cholesterol','Anaemia','Arthritis','Digestive Issues'].filter(x=>x.toLowerCase().includes(hcSearch.toLowerCase())).map(ch=>{
                  const active=(healthChallenges[curMemberObj._tmpId]||[]).includes(ch)
                  return (
                    <button key={ch} onClick={()=>setHC(p=>({...p,[curMemberObj._tmpId]:active?(p[curMemberObj._tmpId]||[]).filter(x=>x!==ch):[...(p[curMemberObj._tmpId]||[]),ch]}))}
                      style={{ padding:'5px 12px 5px 10px',borderRadius:20,border:`1.5px solid ${active?'var(--green)':'var(--border)'}`,background:active?'var(--green-pale)':'var(--white)',color:active?'var(--green)':'var(--text-mid)',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
                      {active?<>× {ch}</>:<>+ {ch}</>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Security note */}
            <div style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 12px',background:'var(--green-light)',borderRadius:10 }}>
              <span style={{ fontSize:14 }}>🛡️</span>
              <span style={{ fontSize:12,color:'var(--text-mid)' }}>Your information is secure and used only to personalize your wellness plan.</span>
            </div>

            {/* Member tabs */}
            {members.length>1 && (
              <div className="card" style={{ padding:'12px' }}>
                <div style={{ fontSize:12,fontWeight:600,color:'var(--text-light)',marginBottom:8 }}>Set goals for all members:</div>
                <div className="chip-row">
                  {members.map((m,i)=>(
                    <button key={i} onClick={()=>setActiveMember(i)}
                      style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:20,border:`1.5px solid ${activeMember===i?'var(--green)':'var(--border)'}`,background:activeMember===i?'var(--green)':'var(--white)',color:activeMember===i?'#fff':'var(--text-mid)',fontSize:12,fontWeight:600,flexShrink:0,cursor:'pointer' }}>
                      {(memberGoals[m._tmpId]||[]).length>0?'✅ ':''}{m.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ STEP 3: Food Preferences ════ */}
        {step===3 && (
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            {/* Diet Type */}
            <div className="card">
              <SectionHdr icon="🍽️" title="Diet Type" />
              <div style={{ fontSize:12,color:'var(--text-light)',marginBottom:12 }}>Helps us suggest suitable products</div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8 }}>
                {DIET_TYPES.map(d=>(
                  <div key={d.id} onClick={()=>setDiet(d.id)}
                    style={{ border:`1.5px solid ${diet===d.id?'var(--green)':'var(--border)'}`,borderRadius:12,padding:'14px 8px',textAlign:'center',cursor:'pointer',background:diet===d.id?'var(--green-pale)':'var(--white)',transition:'all 0.15s',position:'relative' }}>
                    <div style={{ position:'absolute',top:8,right:8,width:16,height:16,borderRadius:'50%',border:`2px solid ${diet===d.id?'var(--green)':'var(--border)'}`,background:diet===d.id?'var(--green)':'transparent',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      {diet===d.id && <span style={{ color:'#fff',fontSize:9,fontWeight:700 }}>✓</span>}
                    </div>
                    <div style={{ fontSize:26,marginBottom:6 }}>{d.icon}</div>
                    <div style={{ fontSize:12,fontWeight:700,marginBottom:3 }}>{d.id}</div>
                    <div style={{ fontSize:10,color:'var(--text-light)',lineHeight:1.4 }}>{d.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Restrictions */}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <div className="card">
                <SectionHdr icon="🥬" title="Veg / Fruit Restrictions" />
                <div style={{ fontSize:11,color:'var(--text-light)',marginBottom:8 }}>Any allergies or ingredients to avoid?</div>
                <div style={{ display:'flex',gap:6,marginBottom:8 }}>
                  {[{id:true,label:'Yes, I have restrictions'},{id:false,label:'No restrictions'}].map(o=>(
                    <button key={String(o.id)} onClick={()=>setVegR(o.id)}
                      style={{ flex:1,padding:'8px 6px',borderRadius:8,border:`1.5px solid ${vegRestr===o.id?'var(--green)':'var(--border)'}`,background:vegRestr===o.id?'var(--green-pale)':'var(--white)',color:vegRestr===o.id?'var(--green)':'var(--text-mid)',fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
                      {vegRestr===o.id?'✅ ':''}{o.label}
                    </button>
                  ))}
                </div>
                {vegRestr && <input className="kp-input no-icon" placeholder="Search vegetables & greens..." value={vegSearch} onChange={e=>setVegSearch(e.target.value)} style={{ fontSize:12 }} />}
                {vegRestr && <div style={{ fontSize:11,color:'var(--text-light)',marginTop:4 }}>Selected items will be excluded from your basket</div>}
              </div>
              <div className="card">
                <SectionHdr icon="🍊" title="Fruit Restrictions" />
                <div style={{ fontSize:11,color:'var(--text-light)',marginBottom:8 }}>Any fruits you prefer to avoid?</div>
                <input className="kp-input no-icon" placeholder="Search fruits..." value={fruitSearch} onChange={e=>setFrSearch(e.target.value)} style={{ fontSize:12 }} />
                <div style={{ fontSize:11,color:'var(--text-light)',marginTop:4 }}>Selected items will be excluded from your basket</div>
              </div>
            </div>

            {/* Preferred Taste */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10 }}>
                <span style={{ fontSize:18 }}>💗</span>
                <span style={{ fontSize:14,fontWeight:700 }}>Preferred Taste</span>
                <span style={{ fontSize:11,color:'var(--text-light)' }}>(Select all that you like)</span>
              </div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                {TASTE_PREFS.map(t=>(
                  <button key={t} onClick={()=>toggleTaste(t)}
                    className={`pill${taste.includes(t)?' sel':''}`}>
                    {taste.includes(t)?'✓ ':''}{t}
                  </button>
                ))}
              </div>
            </div>

            {/* Cooking Preference */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10 }}>
                <span style={{ fontSize:18 }}>👨‍🍳</span>
                <span style={{ fontSize:14,fontWeight:700 }}>Cooking Preference</span>
                <span style={{ fontSize:11,color:'var(--text-light)' }}>(Select all that apply)</span>
              </div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                {COOK_PREFS.map(c=>(
                  <button key={c} onClick={()=>toggleCook(c)}
                    className={`pill${cook.includes(c)?' sel':''}`}>
                    {cook.includes(c)?'✓ ':''}{c}
                  </button>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="card">
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10 }}>
                <span style={{ fontSize:18 }}>🛡️</span>
                <span style={{ fontSize:14,fontWeight:700 }}>Allergies & Restrictions</span>
                <span style={{ fontSize:11,color:'var(--text-light)' }}>(Select all that apply)</span>
              </div>
              <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
                {ALLERGIES.map(a=>(
                  <button key={a} onClick={()=>toggleAllergy(a)}
                    className={`pill${allergy.includes(a)?' sel':''}`}>
                    {allergy.includes(a)?'✓ ':''}{a}
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
                {PLAN_OPTS.map(p=>(
                  <div key={p.id} onClick={()=>setPrefPlan(p.id)}
                    style={{ border:`1.5px solid ${prefPlan===p.id?'var(--green)':'var(--border)'}`,borderRadius:12,padding:'12px 8px',textAlign:'center',cursor:'pointer',background:prefPlan===p.id?'var(--green-pale)':'var(--white)',transition:'all 0.15s',position:'relative' }}>
                    <div style={{ position:'absolute',top:8,left:8,width:14,height:14,borderRadius:'50%',border:`2px solid ${prefPlan===p.id?'var(--green)':'var(--border)'}`,background:prefPlan===p.id?'var(--green)':'transparent' }} />
                    <div style={{ fontSize:22,marginBottom:4 }}>{p.icon}</div>
                    <div style={{ fontSize:12,fontWeight:700 }}>{p.label}</div>
                    {p.price && <div style={{ fontSize:11,color:prefPlan===p.id?'var(--green)':'var(--text-mid)',marginTop:2,fontWeight:600 }}>{p.price}</div>}
                    {p.days && <div style={{ fontSize:10,color:'var(--text-light)' }}>{p.days}</div>}
                  </div>
                ))}
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:10,fontSize:12,color:'var(--text-light)' }}>
                <span>ℹ️</span> You can change or pause your plan any time.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Fixed bottom CTA ── */}
      <div style={{ position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:430,background:'var(--white)',borderTop:'1px solid var(--border)',padding:'12px 18px max(16px,env(safe-area-inset-bottom))',zIndex:100 }}>
        <button className="btn btn-primary" onClick={proceed} disabled={saving}>
          {saving ? <span className="spinner" style={{ width:20,height:20,borderWidth:2 }} /> : step===3 ? <>Get Started 🎉</> : <>Save & Continue →</>}
        </button>
        <div style={{ textAlign:'center',fontSize:11,color:'var(--text-light)',marginTop:6,display:'flex',alignItems:'center',justifyContent:'center',gap:4 }}>
          🔒 Your data is secure with us
        </div>
      </div>
    </div>
  )
}
