import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { showToast } from '../components/Toast'
import logo from '../assets/logo.png'

/* ─── Static UI constants ─── */
const RELS = [
  {id:'Self',emoji:'👤'},{id:'Spouse',emoji:'👫'},{id:'Child',emoji:'👶'},
  {id:'Parent',emoji:'👨'},{id:'Grandparent',emoji:'👴'},{id:'Other',emoji:'👥'},
]

const STEP_LABELS = [
  ['1','Personal &\nDelivery'],
  ['2','Family\nMembers'],
  ['3','Health &\nRestrictions'],
  ['4','Food\nPreferences'],
]

const DIET_TYPES = [
  {id:'Vegetarian',    emoji:'🌿',desc:'No meat, poultry or fish'},
  {id:'Eggetarian',   emoji:'🥚',desc:'Includes eggs'},
  {id:'Non-Vegetarian',emoji:'🐟',desc:'Includes meat, poultry & fish'},
]

const DELIVERY_TYPES = [
  {id:'individual',emoji:'🏠',title:'Individual Home',         sub:'Deliver to your home or apartment'},
  {id:'gated',     emoji:'🏢',title:'Gated Community',        sub:'Deliver to your community'},
]

const calcBMI   = (h,w) => { const hm=parseFloat(h)/100; if(!hm||!w) return null; return (parseFloat(w)/(hm*hm)).toFixed(1) }
const bmiInfo   = b => { if(!b) return null; const v=parseFloat(b); if(v<18.5) return{label:'Underweight',color:'#E67E22'}; if(v<25) return{label:'Normal',color:'#27AE60'}; if(v<30) return{label:'Overweight',color:'#E67E22'}; return{label:'Obese',color:'#E53935'} }
const initials  = (n='') => n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
const ACOLORS   = ['#2D6A35','#1565C0','#AD1457','#E65100','#6A1B9A']
const acolor    = i => ACOLORS[i%ACOLORS.length]
const ageOf     = dob => dob ? Math.floor((Date.now()-new Date(dob))/31557600000) : null

/* ─── Stepper ─── */
function Stepper({ step }) {
  return (
    <div className="stepper">
      {STEP_LABELS.map(([num,lbl],i) => {
        const done=i<step, active=i===step
        return (
          <div key={i} className={`s-item${done?' done':''}${active?' active':''}`}>
            <div className="s-dot">{done?'✓':num}</div>
            <div className="s-lbl" style={{whiteSpace:'pre-line'}}>{lbl}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Reusable SearchSelect component ── */
function SearchSelect({ placeholder, items, selected, onAdd, onRemove, chipColor='green', maxResults=15 }) {
  const [q, setQ] = useState('')
  const filtered = q.trim()
    ? items.filter(it => !selected.includes(it) && it.toLowerCase().includes(q.toLowerCase())).slice(0, maxResults)
    : []
  const chipStyles = {
    green:  { bg:'var(--green)',  border:'var(--green)', color:'#fff'       },
    red:    { bg:'#FFF0F0',       border:'var(--red)',   color:'var(--red)' },
    orange: { bg:'#FFF3E0',       border:'#E65100',      color:'#E65100'    },
  }
  const cs = chipStyles[chipColor] || chipStyles.green
  return (
    <div>
      {/* Search box first */}
      <div style={{position:'relative'}}>
        <input className="inp no-ico" placeholder={placeholder} value={q}
          onChange={e=>setQ(e.target.value)} style={{paddingRight:q?36:12}}/>
        {q&&(
          <span onClick={()=>setQ('')}
            style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',
              cursor:'pointer',fontSize:16,color:'var(--text-light)',lineHeight:1}}>×</span>
        )}
      </div>
      {/* Dropdown results */}
      {filtered.length>0&&(
        <div style={{border:'1.5px solid var(--border)',borderRadius:10,marginTop:4,
          background:'#fff',overflow:'hidden',boxShadow:'0 4px 12px rgba(0,0,0,0.08)'}}>
          {filtered.map(it=>(
            <div key={it} onClick={()=>{onAdd(it);setQ('')}}
              style={{padding:'10px 14px',fontSize:13,cursor:'pointer',
                borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}
              onMouseOver={e=>e.currentTarget.style.background='var(--green-pale)'}
              onMouseOut={e=>e.currentTarget.style.background='#fff'}>
              <span style={{color:'var(--green)',fontWeight:700,fontSize:14}}>+</span> {it}
            </div>
          ))}
        </div>
      )}
      {q&&filtered.length===0&&(
        <div style={{fontSize:12,color:'var(--text-light)',marginTop:6,paddingLeft:4}}>No matches found</div>
      )}
      {/* Selected chips BELOW search */}
      {selected.length>0&&(
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
          {selected.map(s=>(
            <span key={s} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 11px',
              borderRadius:20,background:cs.bg,border:`1.5px solid ${cs.border}`,color:cs.color,
              fontSize:12,fontWeight:600,lineHeight:1.3}}>
              {s}
              <span onClick={()=>onRemove(s)}
                style={{cursor:'pointer',fontWeight:700,fontSize:15,lineHeight:1,marginLeft:2}}>×</span>
            </span>
          ))}
        </div>
      )}
      {!q&&selected.length===0&&(
        <div style={{fontSize:11,color:'var(--text-light)',marginTop:5,paddingLeft:4}}>Type to search and select</div>
      )}
    </div>
  )
}

function SecH({ emoji, title }) {
  return <div className="sec-hd"><span className="sec-hd-icon">{emoji}</span><span className="sec-hd-title">{title}</span></div>
}

/* ─── Member blank ─── */
const blankMember = () => ({
  memberId:        `M_${Date.now()}`,
  name:            '',
  dob:             '',
  gender:          'Female',
  relationship:    'Self',
  height:          '',
  weight:          '',
  // new fields
  activityLevel:   '',
  metRange:        '',
  lifestyleCode:   [],
  healthConditions:[],
  wellnessGoals:   [],
  foodRestrictions:[],
  allergies:       [],
  customAllergies: '',
  likedVegetables: [],
  dislikedVegetables: [],
  likedFruits: [],
  dislikedFruits: [],
})

// Convert any date value to YYYY-MM-DD for <input type="date">
const toDateInput = (val) => {
  if (!val) return ''
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return String(val).split('T')[0]
    return d.toISOString().split('T')[0]
  } catch { return '' }
}

// Build member state from DB record — maps all fields correctly
const memberFromDB = (m) => ({
  ...blankMember(),
  ...m,
  dob:             toDateInput(m.dob),
  activityLevel:   m.activityLevel   || '',
  metRange:        m.metRange        || '',
  lifestyleCode:   Array.isArray(m.lifestyleCode) ? m.lifestyleCode : (m.lifestyleCode ? [m.lifestyleCode] : []),
  wellnessGoals:   Array.isArray(m.wellnessGoals)    ? m.wellnessGoals    : [],
  healthConditions:Array.isArray(m.healthConditions) ? m.healthConditions : [],
  foodRestrictions:Array.isArray(m.foodRestrictions) ? m.foodRestrictions : [],
  allergies:       Array.isArray(m.allergies)        ? m.allergies        : [],
  customAllergies: Array.isArray(m.customAllergies)
    ? m.customAllergies.join(', ')
    : (m.customAllergies || ''),
  likedVegetables:   Array.isArray(m.likedVegetables)   ? m.likedVegetables   : [],
  dislikedVegetables:Array.isArray(m.dislikedVegetables) ? m.dislikedVegetables : [],
  likedFruits:       Array.isArray(m.likedFruits)       ? m.likedFruits       : [],
  dislikedFruits:    Array.isArray(m.dislikedFruits)    ? m.dislikedFruits    : [],
})




export default function Setup() {
  const { family, updateFamily } = useAuth()
  const nav = useNavigate()
  const [step, setStep]     = useState(0)
  const [busy, setBusy]     = useState(false)
  const [initDone, setInitDone] = useState(false)

  /* ── DB-loaded dropdown data ── */
  const [cities,          setCities]         = useState([])
  const [apartments,      setApartments]     = useState([])
  const [aptLoading,      setAptLoading]     = useState(false)
  const [activityLevels,  setActivityLevels] = useState([])
  const [lifestyleCodes,  setLifestyleCodes] = useState([])
  const [healthConditions,setHealthConds]    = useState([])
  const [metRanges,       setMetRanges]      = useState([])
  const [allergyList,     setAllergyList]    = useState([])
  const [bmiRules,        setBmiRules]       = useState([])
  const [wellnessGoals,   setWellnessGoals]  = useState([])
  const [products,        setProducts]       = useState([])

  /* ── Form states (populated after fresh fetch) ── */
  const [form0, setForm0] = useState({
    familyName:''  , phone:''     , email:'',
    city:''        , deliveryType:'individual',
    apartmentId:'' , apartmentName:'',
    tower:''       , flat:''      , landmark:'', pincode:'',
    deliveryPreference:'Morning',
  })
  const [members,        setMembers]       = useState([blankMember()])

  const populateFromFamily = (f) => {
    setForm0({
      familyName:   f.familyName    || '',
      phone:        f.phone         || '',
      email:        f.email         || '',
      city:         f.city          || '',
      deliveryType: f.deliveryType  || 'individual',
      apartmentId:  f.apartmentId   || '',
      apartmentName:f.apartmentName || '',
      tower:        f.towerNo       || '',
      flat:         f.flatNo        || '',
      landmark:     f.landmark      || '',
      pincode:      f.pincode       || '',
      deliveryPreference: f.deliveryPreference || 'Morning',
    })
    if (f.members?.length) setMembers(f.members.map(memberFromDB))
  }

  /* ── Fetch fresh family + all dropdown data on mount ── */
  useEffect(() => {
    api.getCities().then(d => { if(d.cities?.length) setCities(d.cities) }).catch(()=>{})
    api.getActivityLevels().then(d => setActivityLevels(d.activityLevels||[])).catch(()=>{})
    api.getMetRanges().then(d => setMetRanges(d.metRanges||[])).catch(()=>{})
    api.getLifestyleCodes().then(d => setLifestyleCodes(d.lifestyleCodes||[])).catch(()=>{})
    api.getHealthConditions().then(d => setHealthConds(d.conditions||[])).catch(()=>{})
    api.getAllergies().then(d => setAllergyList(d.allergies||[])).catch(()=>{})
    api.getBmiRules().then(d => setBmiRules(d.bmiRules||[])).catch(()=>{})
    api.getWellnessGoals().then(d => setWellnessGoals(d.goals||[])).catch(()=>{})
    api.getProducts({limit:500}).then(d => setProducts(d.products||[])).catch(()=>{})

    if (!family?._id) { setInitDone(true); return }
    api.getFamily(family._id)
      .then(d => {
        const f = d.family || family
        updateFamily(f)
        populateFromFamily(f)
      })
      .catch(() => { if (family) populateFromFamily(family) })
      .finally(() => setInitDone(true))
  }, []) // eslint-disable-line

  /* ── Load apartments when city changes ── */
  useEffect(() => {
    if (!form0.city) return
    setAptLoading(true)
    api.getApartments(form0.city)
      .then(d => setApartments(d.apartments||[]))
      .catch(()=>{})
      .finally(()=>setAptLoading(false))
  }, [form0.city])

  /* ─── Member helpers ─── */
  const setMember = (i, key, val) => setMembers(prev => prev.map((m,idx) => idx===i ? {...m,[key]:val} : m))

  const toggleMemberArray = (i, key, val) => setMembers(prev => prev.map((m,idx) => {
    if(idx!==i) return m
    const arr = m[key]||[]
    return {...m, [key]: arr.includes(val) ? arr.filter(x=>x!==val) : [...arr,val]}
  }))

  const addMember    = () => setMembers(prev => [...prev, blankMember()])
  const removeMember = i  => setMembers(prev => prev.filter((_,idx)=>idx!==i))


  // ── BMI-based wellness goal recommendation (age-aware) ──
  const getRecommendedGoal = (height, weight, dob) => {
    if (!height || !weight) return null
    const h = parseFloat(height) / 100
    const bmi = parseFloat(weight) / (h * h)
    if (isNaN(bmi)) return null
    const age = ageOf(dob)
    const isOlderAdult = age !== null && age >= 60
    // Filter rules by age category: Older Adults get Older Adult rules first, Adults get Adult rules
    // Overlapping BMI ranges (e.g. 23-29.99) — pick correct category
    const matchingRules = bmiRules.filter(r =>
      bmi >= (r.bmiMin || 0) && bmi < (r.bmiMax || 999)
    )
    let rule = null
    if (isOlderAdult) {
      // Prefer Older Adult rule if exists, else fall back to Adult
      rule = matchingRules.find(r => r.ageCategory === 'Older Adult')
          || matchingRules.find(r => r.ageCategory === 'Adult')
          || matchingRules[0]
    } else {
      // Non-older-adult: only use Adult rules, never Older Adult
      rule = matchingRules.find(r => r.ageCategory === 'Adult')
          || matchingRules.find(r => !r.ageCategory || r.ageCategory === 'All')
    }
    return rule?.recommendedWellnessGoal || null
  }

  /* ─── Products split by category ─── */
  const vegetables = products.filter(p => ['Leafy Vegetables','Roots & Tubers','Gourds','Beans & Legumes'].includes(p.category))
  const fruits     = products.filter(p => p.category === 'Fruits')
  const allForRestrictions = products // full list for food restrictions

  /* ─── STEP SUBMIT HANDLERS ─── */

  const submitStep0 = async () => {
    if(!form0.familyName.trim()) return showToast('Family name required','error')
    if(!form0.city)              return showToast('Select a city','error')
    if(!form0.flat.trim())       return showToast('Flat / House No. is required','error')
    if(!form0.pincode.trim())    return showToast('Pincode is required','error')
    if(form0.deliveryType==='gated' && !form0.apartmentId && !form0.apartmentName.trim())
      return showToast('Please select or enter your apartment / community','error')
    setBusy(true)
    try {
      const body = {
        familyName:    form0.familyName.trim(),
        email:         form0.email.trim()||null,
        city:          form0.city,
        deliveryType:  form0.deliveryType,
        apartmentId:   form0.deliveryType==='gated' ? form0.apartmentId : null,
        apartmentName: form0.deliveryType==='gated' ? form0.apartmentName : null,
        towerNo:       form0.tower || null,
        flatNo:        form0.flat  || null,
        landmark:      form0.landmark || null,
        pincode:       form0.pincode  || null,
        deliveryPreference: form0.deliveryPreference || 'Morning',
        address:       [form0.aptName, form0.flat&&`Flat ${form0.flat}`, form0.tower&&`Tower ${form0.tower}`].filter(Boolean).join(', '),
      }
      const r = await api.updateFamily(family._id, body)
      updateFamily(r.family)
      // Auto-fill first Self member's name from familyName
      setMembers(prev => prev.map((m, idx) => {
        if (idx === 0 && m.relationship === 'Self' && !m.name.trim()) {
          return { ...m, name: form0.familyName.trim() }
        }
        return m
      }))
      setStep(1)
    } catch(e) { showToast(e.message,'error') }
    finally { setBusy(false) }
  }

  // Helper — saves all members then moves to next step
  const saveMembersAndNext = async (nextStep) => {
    setBusy(true)
    try {
      const latestFamily = await api.getFamily(family._id).then(d=>d.family).catch(()=>family)
      const existingMembers = latestFamily?.members || []
      for(const m of members) {
        const clean = {
          ...m,
          customAllergies: (m.customAllergies||'').split(',').map(s=>s.trim()).filter(Boolean),
        }
        // Match by memberId, fallback name
        const existing = existingMembers.find(e=>e.memberId===m.memberId)
                      || existingMembers.find(e=>e.name===m.name)
        if(existing?.memberId) {
          await api.updateMember(family._id, existing.memberId, clean).catch(()=>{})
        } else {
          await api.addMember(family._id, clean).catch(()=>{})
        }
      }
      const r = await api.getFamily(family._id)
      updateFamily(r.family)
      setStep(nextStep)
    } catch(e) { showToast(e.message,'error') }
    finally { setBusy(false) }
  }

  const submitStep1 = async () => {
    for (const m of members) {
      if (!m.name.trim()) return showToast('All members need a name','error')
      if (!m.relationship) return showToast(`Select a relationship for ${m.name||'member'}`, 'error')
      if (!m.dob && !m.age) return showToast(`Please enter date of birth for ${m.name||'member'}`, 'error')
      if (!m.gender) return showToast(`Select gender for ${m.name||'member'}`, 'error')
    }
    await saveMembersAndNext(2)
  }

  const submitStep2 = async () => {
    await saveMembersAndNext(3)
  }

  const submitStep3 = async () => {
    setBusy(true)
    try {
      // Save diet preference at family level
      await api.updateFamily(family._id, { setupComplete: true })
      // Save liked/disliked veg+fruits per member
      const latestFamily = await api.getFamily(family._id).then(d=>d.family).catch(()=>family)
      const existingMembers = latestFamily?.members || []
      // Track which memberIds we've processed to avoid duplicates
      const processedIds = new Set()
      for(const m of members) {
        if(processedIds.has(m.memberId)) continue
        processedIds.add(m.memberId)
        const clean = {
          ...m,
          customAllergies: (m.customAllergies||'').split(',').map(s=>s.trim()).filter(Boolean),
        }
        const existing = existingMembers.find(e=>e.memberId===m.memberId)
        if(existing?.memberId) {
          await api.updateMember(family._id, existing.memberId, clean).catch(()=>{})
        } else {
          await api.addMember(family._id, clean).catch(()=>{})
        }
      }
      const r = await api.getFamily(family._id)
      updateFamily(r.family)

      // Check if any member's health conditions require clinical review
      const allConditions = members.flatMap(m => m.healthConditions || []).filter(Boolean)
      if (allConditions.length) {
        try {
          const check = await api.checkClinicalReview({ healthConditions: allConditions })
          if (check.required) {
            // Find the first member with a condition that needs review
            const needsMember = members.find(m =>
              (m.healthConditions||[]).some(c => check.conditions.includes(c))
            )
            nav('/appointment', {
              state: {
                book: true,
                conditions: check.conditions,
                memberId: needsMember?.memberId || members[0]?.memberId,
                memberName: needsMember?.name || members[0]?.name || '',
              },
              replace: true,
            })
            return
          }
        } catch {}
      }

      nav('/home')
    } catch(e) { showToast(e.message,'error') }
    finally { setBusy(false) }
  }

  /* ─── RENDER ─── */
  if (!initDone) return (
    <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,background:'var(--cream)'}}>
      <div style={{width:32,height:32,borderRadius:'50%',border:'3px solid var(--border)',borderTopColor:'var(--green)',animation:'rotate 0.7s linear infinite'}}/>
      <p style={{color:'var(--text-light)',fontSize:13}}>Loading your profile…</p>
    </div>
  )

  return (
    <div className="page-shell">

      {/* Header */}
      <div className="top-bar" style={{gap:12}}>
        <img src={logo} alt="KP" style={{width:32,height:32,borderRadius:8,objectFit:'contain'}}/>
        <div className="top-bar-title" style={{flex:1}}>Setup Your Profile</div>
      </div>

      <div className="page-shell-scroll" style={{padding:'0 0 120px'}}>
        <Stepper step={step}/>

        {/* ════════════════════════════════════════
            STEP 0 — Personal & Delivery
        ════════════════════════════════════════ */}
        {step===0&&(
          <div style={{padding:'16px 18px',display:'flex',flexDirection:'column',gap:16}}>

            <SecH emoji="👤" title="Your Details"/>
            <div className="field">
              <label className="label">Family / Full Name *</label>
              <input className="inp no-ico" placeholder="e.g. Priya Family" value={form0.familyName}
                onChange={e=>setForm0(p=>({...p,familyName:e.target.value}))}/>
            </div>
            <div className="field">
              <label className="label">Phone Number</label>
              <input className="inp no-ico" placeholder="98765 43210" value={form0.phone} readOnly
                style={{background:'var(--border)',color:'var(--text-light)'}}/>
            </div>
            <div className="field">
              <label className="label">Email Address <span className="opt">(Optional)</span></label>
              <input className="inp no-ico" type="email" placeholder="you@email.com" value={form0.email}
                onChange={e=>setForm0(p=>({...p,email:e.target.value}))}/>
            </div>

            <SecH emoji="📍" title="Delivery Details"/>
            <div className="field">
              <label className="label">City *</label>
              <div style={{display:'flex',gap:10}}>
                {(cities.length?cities:['Coimbatore','Chennai']).map(c=>(
                  <button key={c} type="button" onClick={()=>setForm0(p=>({...p,city:c,apartmentId:'',apartmentName:''}))}
                    style={{flex:1,padding:'13px',borderRadius:12,border:`2px solid ${form0.city===c?'var(--green)':'var(--border)'}`,
                      background:form0.city===c?'var(--green)':'#fff',color:form0.city===c?'#fff':'var(--text-mid)',
                      fontWeight:700,fontSize:14,cursor:'pointer'}}>
                    {form0.city===c?'✓ ':''}{c}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="label">Delivery Type</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {DELIVERY_TYPES.map(o=>(
                  <button key={o.id} type="button" onClick={()=>setForm0(p=>({...p,deliveryType:o.id}))}
                    style={{padding:'10px 8px',borderRadius:10,border:`1.5px solid ${form0.deliveryType===o.id?'var(--green)':'var(--border)'}`,
                      background:form0.deliveryType===o.id?'var(--green-pale)':'#fff',
                      color:form0.deliveryType===o.id?'var(--green)':'var(--text-mid)',
                      fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                    {o.emoji} {o.title}
                  </button>
                ))}
              </div>
            </div>

            {form0.deliveryType==='gated'&&(
              <div className="field">
                <label className="label">Apartment / Community {aptLoading?'(loading…)':''}</label>
                <select className="inp no-ico" value={form0.apartmentId}
                  onChange={e=>{
                    const apt=apartments.find(a=>a._id?.toString()===e.target.value||a.apartmentId===e.target.value)
                    setForm0(p=>({...p,
                      apartmentId:e.target.value,
                      apartmentName:apt?.apartmentName||'',
                      pincode:apt?.pincode||p.pincode||'',
                      landmark:apt?.landmark||apt?.address||p.landmark||'',
                    }))
                  }}>
                  <option value="">Select apartment…</option>
                  {apartments.map(a=>(
                    <option key={a._id} value={a._id?.toString()||a.apartmentId}>{a.apartmentName}{a.area?` — ${a.area}`:''}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div className="field">
                <label className="label">Tower / Block</label>
                <input className="inp no-ico" placeholder="Block A" value={form0.tower}
                  onChange={e=>setForm0(p=>({...p,tower:e.target.value}))}/>
              </div>
              <div className="field">
                <label className="label">Flat / House No.</label>
                <input className="inp no-ico" placeholder="B-101" value={form0.flat}
                  onChange={e=>setForm0(p=>({...p,flat:e.target.value}))}/>
              </div>
            </div>
            <div className="field">
              <label className="label">Landmark <span className="opt">(Optional)</span></label>
              <input className="inp no-ico" placeholder="Near Lotus Cafe" value={form0.landmark}
                onChange={e=>setForm0(p=>({...p,landmark:e.target.value}))}/>
            </div>
            <div className="field">
              <label className="label">Pincode</label>
              <input className="inp no-ico" placeholder="641001" maxLength={6} value={form0.pincode}
                onChange={e=>setForm0(p=>({...p,pincode:e.target.value.replace(/\D/g,'')}))}/>
            </div>

            <SecH emoji="🕐" title="Preferred Delivery Time"/>
            <div style={{display:'flex',gap:8}}>
              {[{v:'Morning',l:'Morning',t:'7–10 AM'},{v:'Afternoon',l:'Afternoon',t:'12–3 PM'},{v:'Evening',l:'Evening',t:'5–8 PM'}].map(s=>(
                <button key={s.v} type="button" onClick={()=>setForm0(p=>({...p,deliveryPreference:s.v}))}
                  style={{flex:1,padding:'10px 4px',borderRadius:10,
                    border:`2px solid ${form0.deliveryPreference===s.v?'var(--green)':'var(--border)'}`,
                    background:form0.deliveryPreference===s.v?'var(--green-pale)':'#fff',
                    color:form0.deliveryPreference===s.v?'var(--green)':'var(--text-mid)',
                    fontWeight:700,fontSize:12,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                  <span style={{fontSize:9,color:form0.deliveryPreference===s.v?'var(--green)':'var(--text-light)'}}>{s.t}</span>
                  {s.l}
                  {form0.deliveryPreference===s.v&&<span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            STEP 1 — Family Members
        ════════════════════════════════════════ */}
        {step===1&&(
          <div style={{padding:'16px 18px',display:'flex',flexDirection:'column',gap:20}}>
            {members.map((m,i)=>{
              const bmi=calcBMI(m.height,m.weight)
              const bi=bmiInfo(bmi)
              return(
                <div key={m.memberId} style={{background:'#fff',border:'1.5px solid var(--border)',borderRadius:16,overflow:'hidden'}}>
                  {/* Member header */}
                  <div style={{background:'var(--green-pale)',padding:'12px 16px',display:'flex',alignItems:'center',gap:10}}>
                    <div className="avatar" style={{background:acolor(i),width:38,height:38,fontSize:13,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>
                      {m.name?initials(m.name):(i+1)}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14,color:'var(--green)'}}>{m.name||`Member ${i+1}`}</div>
                      {m.dob&&<div style={{fontSize:11,color:'var(--text-light)'}}>{ageOf(m.dob)} years old</div>}
                    </div>
                    {members.length>1&&(
                      <button onClick={()=>removeMember(i)} style={{padding:'4px 10px',borderRadius:8,border:'1.5px solid #FFCDD2',background:'#FFF5F5',color:'var(--red)',fontSize:11,fontWeight:700,cursor:'pointer'}}>Remove</button>
                    )}
                  </div>

                  <div style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:12}}>
                    {/* Basic info */}
                    <div className="field">
                      <label className="label">Full Name *</label>
                      <input className="inp no-ico" placeholder="e.g. Priya"
                        defaultValue={m.name}
                        onBlur={e=>setMember(i,'name',e.target.value)}/>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      <div className="field">
                        <label className="label">Date of Birth</label>
                        <input className="inp no-ico" type="date"
                        defaultValue={m.dob}
                        max={new Date().toISOString().split('T')[0]}
                        onBlur={e=>setMember(i,'dob',e.target.value)}/>
                      </div>
                      <div className="field">
                        <label className="label">Gender</label>
                        <select className="inp no-ico" value={m.gender} onChange={e=>setMember(i,'gender',e.target.value)}>
                          <option>Female</option><option>Male</option><option>Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Relationship */}
                    <div className="field">
                      <label className="label">Relationship</label>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {RELS.map(r=>(
                          <button key={r.id} type="button" onClick={()=>setMember(i,'relationship',r.id)}
                            style={{padding:'6px 12px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
                              border:`1.5px solid ${m.relationship===r.id?'var(--green)':'var(--border)'}`,
                              background:m.relationship===r.id?'var(--green)':'#fff',
                              color:m.relationship===r.id?'#fff':'var(--text-mid)'}}>
                            {r.emoji} {r.id}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Height & Weight */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      <div className="field">
                        <label className="label">Height (cm)</label>
                        <input className="inp no-ico" type="number" placeholder="165"
                        defaultValue={m.height}
                        onBlur={e=>setMember(i,'height',e.target.value)}/>
                      </div>
                      <div className="field">
                        <label className="label">Weight (kg)</label>
                        <input className="inp no-ico" type="number" placeholder="60"
                        defaultValue={m.weight}
                        onBlur={e=>setMember(i,'weight',e.target.value)}/>
                      </div>
                    </div>
                    {bmi&&bi&&(
                      <div style={{background:'var(--green-pale)',borderRadius:10,padding:'8px 12px',display:'flex',gap:10,alignItems:'center'}}>
                        <span style={{fontSize:18}}>⚖️</span>
                        <span style={{fontSize:13,color:'var(--text-mid)'}}>BMI: <b style={{color:bi.color}}>{bmi} — {bi.label}</b></span>
                      </div>
                    )}

                    {/* Activity Level */}
                    <div className="field">
                      <label className="label">Activity Level</label>
                      <select className="inp no-ico" value={m.activityLevel}
                        onChange={e=>setMember(i,'activityLevel',e.target.value)}>
                        <option value="">Select activity level…</option>
                        {activityLevels.map(a=>(
                          <option key={a._id} value={a.activityLevel}>
                            {a.displayName||a.activityLevel}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* MET Range — independent self-reported exertion level */}
                    <div className="field">
                      <label className="label">MET Range <span className="opt">(self-reported exertion level)</span></label>
                      <select className="inp no-ico" value={m.metRange}
                        onChange={e=>setMember(i,'metRange',e.target.value)}>
                        <option value="">Select MET range…</option>
                        {metRanges.map(r=>(
                          <option key={r._id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                      {m.metRange && metRanges.find(r=>r.name===m.metRange)?.description && (
                        <div style={{fontSize:11,color:'var(--text-light)',marginTop:5,lineHeight:1.5,padding:'6px 10px',background:'var(--green-pale)',borderRadius:8}}>
                          {metRanges.find(r=>r.name===m.metRange)?.description}
                        </div>
                      )}
                    </div>

                    {/* Lifestyle Code — multiselect */}
                    <div className="field">
                      <label className="label">Lifestyle <span className="opt">(select all that apply)</span></label>
                      <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                        {lifestyleCodes.map(l=>{
                          const sel = (m.lifestyleCode||[]).includes(l.lifestyleCode)
                          return (
                            <button key={l._id} type="button"
                              onClick={()=>{
                                const arr = m.lifestyleCode||[]
                                setMember(i,'lifestyleCode', sel ? arr.filter(x=>x!==l.lifestyleCode) : [...arr, l.lifestyleCode])
                              }}
                              style={{padding:'8px 14px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
                                border:`1.5px solid ${sel?'var(--green)':'var(--border)'}`,
                                background:sel?'var(--green)':'#fff',
                                color:sel?'#fff':'var(--text-mid)',
                                display:'flex',alignItems:'center',gap:5}}>
                              {l.lifestyleName}
                              {sel && <span style={{fontWeight:700,fontSize:14,lineHeight:1}}>×</span>}
                            </button>
                          )
                        })}
                      </div>
                      {(m.lifestyleCode||[]).length>0 && (()=>{
                        const descs = (m.lifestyleCode||[])
                          .map(code => lifestyleCodes.find(l=>l.lifestyleCode===code))
                          .filter(l=>l?.displayDescription)
                        return descs.length>0 ? (
                          <div style={{fontSize:11,color:'var(--text-light)',marginTop:6,lineHeight:1.5,padding:'6px 10px',background:'var(--green-pale)',borderRadius:8}}>
                            {descs.map(l=>l.displayDescription).join(' · ')}
                          </div>
                        ) : null
                      })()}
                    </div>
                  </div>
                </div>
              )
            })}

            <button onClick={addMember}
              style={{padding:'13px',borderRadius:12,border:'2px dashed var(--border)',background:'#fff',
                color:'var(--green)',fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',
                alignItems:'center',justifyContent:'center',gap:8}}>
              + Add Family Member
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════
            STEP 2 — Health & Restrictions
        ════════════════════════════════════════ */}
        {step===2&&(
          <div style={{padding:'16px 18px',display:'flex',flexDirection:'column',gap:20}}>
            {members.map((m,i)=>(
              <div key={m.memberId} style={{background:'#fff',border:'1.5px solid var(--border)',borderRadius:16,overflow:'hidden'}}>
                {/* Member header */}
                <div style={{background:'var(--green-pale)',padding:'12px 16px',display:'flex',alignItems:'center',gap:10}}>
                  <div className="avatar" style={{background:acolor(i),width:36,height:36,fontSize:12,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>
                    {m.name?initials(m.name):(i+1)}
                  </div>
                  <div style={{fontWeight:700,fontSize:14,color:'var(--green)'}}>{m.name||`Member ${i+1}`}</div>
                </div>

                <div style={{padding:'14px 16px',display:'flex',flexDirection:'column',gap:16}}>

                  {/* ── Health Conditions ── */}
                  <div className="field">
                    <label className="label">Health Conditions</label>
                    <SearchSelect
                      placeholder="Search health conditions…"
                      items={healthConditions.map(hc=>hc.conditionName)}
                      selected={m.healthConditions||[]}
                      onAdd={v=>toggleMemberArray(i,'healthConditions',v)}
                      onRemove={v=>toggleMemberArray(i,'healthConditions',v)}
                      chipColor="green"
                    />
                    {!(m.healthConditions||[]).includes('No Known Condition')&&(
                      <button type="button"
                        onClick={()=>setMembers(prev=>prev.map((mm,idx)=>idx===i?{...mm,healthConditions:['No Known Condition']}:mm))}
                        style={{marginTop:8,padding:'6px 14px',borderRadius:20,fontSize:11,fontWeight:600,cursor:'pointer',
                          border:'1.5px dashed var(--border)',background:'#f9f9f9',color:'var(--text-light)'}}>
                        None / No Known Condition
                      </button>
                    )}
                  </div>

                  {/* ── Food Restrictions ── */}
                  <div className="field">
                    <label className="label">Food Restrictions <span className="opt">(items you avoid / cannot eat)</span></label>
                    <SearchSelect
                      placeholder="Search foods to restrict…"
                      items={allForRestrictions.map(p=>p.name)}
                      selected={m.foodRestrictions||[]}
                      onAdd={v=>toggleMemberArray(i,'foodRestrictions',v)}
                      onRemove={v=>toggleMemberArray(i,'foodRestrictions',v)}
                      chipColor="red"
                    />
                  </div>

                  {/* ── Allergies — multiselect grid + Add New ── */}
                  <div className="field">
                    <label className="label">Allergies <span className="opt">(tap to select / deselect)</span></label>
                    <div style={{display:'flex',flexWrap:'wrap',gap:7,marginTop:4}}>
                      {allergyList.map(a=>{
                        const sel = (m.allergies||[]).includes(a.name)
                        return (
                          <button key={a._id||a.name} type="button"
                            onClick={()=>toggleMemberArray(i,'allergies',a.name)}
                            style={{padding:'7px 13px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
                              border:`1.5px solid ${sel?'#E65100':'var(--border)'}`,
                              background:sel?'#FFF3E0':'#fff',
                              color:sel?'#E65100':'var(--text-mid)',
                              display:'flex',alignItems:'center',gap:5}}>
                            {sel&&<span style={{fontSize:11}}>⚠</span>} {a.name}
                            {sel && <span style={{fontWeight:700,fontSize:14,lineHeight:1}}>×</span>}
                          </button>
                        )
                      })}
                    </div>
                    {/* Custom allergies already added */}
                    {(m.customAllergies||'').trim() && (
                      <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                        {(m.customAllergies||'').split(',').map(s=>s.trim()).filter(Boolean).map(ca=>(
                          <span key={ca} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'5px 11px',
                            borderRadius:20,background:'#FFF3E0',border:'1.5px solid #E65100',color:'#E65100',
                            fontSize:12,fontWeight:600}}>
                            ⚠ {ca}
                            <span onClick={()=>{
                              const updated = (m.customAllergies||'').split(',').map(s=>s.trim()).filter(x=>x&&x!==ca).join(', ')
                              setMember(i,'customAllergies',updated)
                            }} style={{cursor:'pointer',fontWeight:700,fontSize:14,lineHeight:1,marginLeft:2}}>×</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Add New allergy */}
                    <div style={{marginTop:10,display:'flex',gap:8,alignItems:'center'}}>
                      <input className="inp no-ico" placeholder="Add allergy not in list…"
                        id={`custom-allergy-${m.memberId}`}
                        style={{fontSize:12,flex:1}}
                        onKeyDown={e=>{
                          if(e.key==='Enter' && e.target.value.trim()){
                            const val = e.target.value.trim()
                            const existing = (m.customAllergies||'').split(',').map(s=>s.trim()).filter(Boolean)
                            if(!existing.includes(val)){
                              setMember(i,'customAllergies',[...existing,val].join(', '))
                            }
                            e.target.value=''
                          }
                        }}/>
                      <button type="button"
                        onClick={()=>{
                          const inp = document.getElementById(`custom-allergy-${m.memberId}`)
                          if(!inp||!inp.value.trim()) return
                          const val = inp.value.trim()
                          const existing = (m.customAllergies||'').split(',').map(s=>s.trim()).filter(Boolean)
                          if(!existing.includes(val)){
                            setMember(i,'customAllergies',[...existing,val].join(', '))
                          }
                          inp.value=''
                        }}
                        style={{padding:'8px 16px',borderRadius:10,border:'1.5px solid var(--green)',
                          background:'var(--green-pale)',color:'var(--green)',fontSize:12,fontWeight:700,
                          cursor:'pointer',whiteSpace:'nowrap'}}>
                        + Add
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════
            STEP 3 — Food Preferences (per member)
        ════════════════════════════════════════ */}
        {step===3&&(
          <div style={{padding:'16px 18px',display:'flex',flexDirection:'column',gap:20}}>

            {/* Wellness Goals — per member, BMI-aware */}
            {members.map((m,i)=>{
              const recommended = getRecommendedGoal(m.height, m.weight, m.dob)
              return (
                <div key={m.memberId} style={{background:'#fff',border:'1.5px solid var(--border)',borderRadius:16,overflow:'hidden'}}>
                  <div style={{background:'var(--green-pale)',padding:'10px 16px',display:'flex',alignItems:'center',gap:10}}>
                    <div className="avatar" style={{background:acolor(i),width:32,height:32,fontSize:11,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>
                      {m.name?initials(m.name):(i+1)}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14,color:'var(--green)'}}>{m.name||`Member ${i+1}`}</div>
                      <div style={{fontSize:11,color:'var(--text-light)'}}>Select up to 3 wellness goals</div>
                    </div>
                    <span style={{fontSize:11,color:'var(--green)',fontWeight:700}}>{(m.wellnessGoals||[]).length}/3</span>
                  </div>
                  <div style={{padding:'14px 16px'}}>
                    {/* BMI-based recommendation */}
                    {recommended&&!(m.wellnessGoals||[]).includes(recommended)&&(
                      <div style={{background:'#FFF8E7',border:'1.5px solid #F5C842',borderRadius:10,padding:'10px 14px',marginBottom:12}}>
                        <div style={{fontSize:10,fontWeight:700,color:'#B8860B',textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>
                          ⭐ Recommended based on your BMI
                        </div>
                        <button type="button"
                          onClick={()=>{
                            if((m.wellnessGoals||[]).length>=3){showToast('Max 3 goals per member','error');return}
                            setMember(i,'wellnessGoals',[...(m.wellnessGoals||[]),recommended])
                          }}
                          style={{padding:'6px 14px',borderRadius:20,border:'1.5px solid #F5C842',
                            background:'#FFF8E7',color:'#B8860B',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                          + {recommended}
                        </button>
                      </div>
                    )}
                    {/* All goals grid — tap to select */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      {wellnessGoals.filter(g=>g.displayName).map(g=>{
                        const gn = g.displayName
                        const sel = (m.wellnessGoals||[]).includes(gn)
                        const GEMOJI = {'Immunity Support':'🛡️','Protein Support':'💪','Iron Support':'💧','Weight Management':'⚖️','Diabetes Friendly':'🩺','Diabetes Control':'🩺','Heart Wellness':'❤️','Digestive Wellness':'🌀','Bone Health':'🦴',"Women's Wellness":'🌸','Kids Nutrition':'😊','Senior Wellness':'👴','Detox':'✨','General Wellness':'🌿','Other Goal':'🌿'}
                        return (
                          <button key={gn} type="button"
                            onClick={()=>{
                              if(sel){
                                setMember(i,'wellnessGoals',(m.wellnessGoals||[]).filter(x=>x!==gn))
                              } else {
                                if((m.wellnessGoals||[]).length>=3){showToast('Max 3 goals per member','error');return}
                                setMember(i,'wellnessGoals',[...(m.wellnessGoals||[]),gn])
                              }
                            }}
                            style={{padding:'12px 10px',borderRadius:12,cursor:'pointer',textAlign:'center',
                              border:`2px solid ${sel?'var(--green)':'var(--border)'}`,
                              background:sel?'var(--green-pale)':'#fff',
                              position:'relative',transition:'all 0.15s'}}>
                            {sel && (
                              <span style={{position:'absolute',top:6,right:8,color:'var(--green)',fontSize:14,fontWeight:700,lineHeight:1}}>×</span>
                            )}
                            <div style={{fontSize:22,marginBottom:4}}>{GEMOJI[gn]||'🌿'}</div>
                            <div style={{fontSize:12,fontWeight:700,color:sel?'var(--green)':'var(--text)',lineHeight:1.3}}>{gn}</div>
                            {g.goalDescription && (
                              <div style={{fontSize:10,color:'var(--text-light)',marginTop:3,lineHeight:1.3}}>{g.goalDescription}</div>
                            )}
                            {sel && (
                              <div style={{marginTop:4,fontSize:10,fontWeight:700,color:'var(--green)'}}>✓ Selected</div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Diet Type — per member */}
            {members.map((m,i)=>(
              <div key={`diet-${m.memberId}`} style={{background:'#fff',border:'1.5px solid var(--border)',borderRadius:16,overflow:'hidden'}}>
                <div style={{background:'var(--green-pale)',padding:'10px 16px',display:'flex',alignItems:'center',gap:10}}>
                  <div className="avatar" style={{background:acolor(i),width:32,height:32,fontSize:11,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>
                    {m.name?initials(m.name):(i+1)}
                  </div>
                  <div style={{fontWeight:700,fontSize:14,color:'var(--green)'}}>{m.name||`Member ${i+1}`} — Diet Type</div>
                </div>
                <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:8}}>
                  {DIET_TYPES.map(d=>(
                    <button key={d.id} type="button" onClick={()=>setMember(i,'dietType',d.id)}
                      style={{display:'flex',alignItems:'center',gap:14,padding:'12px 14px',borderRadius:12,
                        border:`2px solid ${m.dietType===d.id?'var(--green)':'var(--border)'}`,
                        background:m.dietType===d.id?'var(--green-pale)':'#fff',cursor:'pointer',textAlign:'left'}}>
                      <span style={{fontSize:22}}>{d.emoji}</span>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:m.dietType===d.id?'var(--green)':'var(--text)'}}>{d.id}</div>
                        <div style={{fontSize:11,color:'var(--text-light)',marginTop:1}}>{d.desc}</div>
                      </div>
                      {m.dietType===d.id&&<span style={{marginLeft:'auto',color:'var(--green)',fontSize:18}}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}



          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="sticky-footer">
        <div style={{display:'flex',gap:10}}>
          {step>0&&(
            <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setStep(s=>s-1)} disabled={busy}>
              ← Back
            </button>
          )}
          <button className="btn btn-primary" style={{flex:2}} disabled={busy}
            onClick={step===0?submitStep0:step===1?submitStep1:step===2?submitStep2:submitStep3}>
            {busy ? <span className="spinner" style={{width:18,height:18,borderWidth:2}}/> :
              step===3 ? 'Finish Setup →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
