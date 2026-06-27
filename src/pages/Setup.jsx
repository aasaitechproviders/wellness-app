import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { showToast } from '../components/Toast'
import logo from '../assets/logo.png'

/* ─── Static UI constants (not domain data) ─── */
const RELS = [
  {id:'Self',emoji:'👤'},{id:'Spouse',emoji:'👫'},{id:'Child',emoji:'👶'},
  {id:'Parent',emoji:'👨'},{id:'Grandparent',emoji:'👴'},{id:'Other',emoji:'👥'},
]
const ACTIVITY = [
  {id:'sedentary',label:'Sedentary',       sub:'Mostly sitting;\nlittle exercise',  emoji:'🪑'},
  {id:'light',    label:'Lightly Active',  sub:'Light exercise\n1–3 days/week',     emoji:'🚶'},
  {id:'moderate', label:'Moderately Active',sub:'Exercise\n3–5 days/week',         emoji:'🏃'},
  {id:'high',     label:'Highly Active',   sub:'Intense exercise\nmost days',       emoji:'🏋️'},
]
const STEP_LABELS = [['1','Personal &\nDelivery'],['2','Family\nMembers'],['3','Wellness\nGoals'],['4','Food\nPreferences']]

/* ─── Goal emoji map (icon enrichment for DB goals) ─── */
const GOAL_EMOJI = {
  'Immunity Support':'🛡️','Protein Support':'💪','Iron Support':'💧',
  'Weight Management':'⚖️','Diabetes Friendly':'🩺','Diabetes Control':'🩺',
  'Heart Wellness':'❤️','Digestive Wellness':'🌀','Bone Health':'🦴',
  "Women's Wellness":'🌸','Kids Nutrition':'😊','Senior Wellness':'👴',
  'Detox':'✨','General Wellness':'🌿','Other Goal':'···',
}

const DELIVERY_TYPES = [
  {id:'individual',emoji:'🏠',title:'Individual Home',      sub:'Deliver to your home or apartment'},
  {id:'gated',     emoji:'🏢',title:'Gated Community / Wellness Partner',sub:'Deliver to your community or partner'},
]
const DIET_TYPES = [
  {id:'Vegetarian',    emoji:'🌿',desc:'No meat, poultry or fish'},
  {id:'Eggetarian',    emoji:'🥚',desc:'Includes eggs'},
  {id:'Non-Vegetarian',emoji:'🐟',desc:'Includes meat, poultry & fish'},
]
const DELIVERY_SLOTS = [
  {id:'morning',  emoji:'🌅',label:'Morning',  time:'7 AM – 11 AM'},
  {id:'afternoon',emoji:'☀️',label:'Afternoon',time:'12 PM – 5 PM'},
  {id:'evening',  emoji:'🌙',label:'Evening',  time:'5 PM – 9 PM'},
]

const VEGETABLES = [
  'Tomato','Onion','Potato','Carrot','Cabbage','Cauliflower','Broccoli','Spinach',
  'Bitter Gourd','Bottle Gourd','Ridge Gourd','Snake Gourd','Drumstick','Lady Finger',
  'Brinjal','Beetroot','Radish','Turnip','Sweet Potato','Yam','Pumpkin','Ash Gourd',
  'Ivy Gourd','Cluster Beans','French Beans','Green Peas','Corn','Mushroom','Capsicum',
  'Cucumber','Raw Banana','Methi','Coriander','Mint','Drumstick Leaves','Colocasia',
]

const FRUITS = [
  'Mango','Banana','Apple','Orange','Grapes','Papaya','Guava','Pineapple','Watermelon',
  'Muskmelon','Pomegranate','Sapota','Jackfruit','Coconut','Litchi','Plum','Pear',
  'Strawberry','Kiwi','Avocado','Lemon','Sweet Lime','Gooseberry','Fig','Date',
  'Custard Apple','Dragon Fruit','Raw Mango',
]

const calcBMI = (h,w) => { const hm=parseFloat(h)/100; if(!hm||!w) return null; return (parseFloat(w)/(hm*hm)).toFixed(1) }
const bmiInfo = b => { if(!b) return null; const v=parseFloat(b); if(v<18.5) return{label:'Underweight',color:'#E67E22'}; if(v<25) return{label:'Normal',color:'#27AE60'}; if(v<30) return{label:'Overweight',color:'#E67E22'}; return{label:'Obese',color:'#E53935'} }
const initials = (n='') => n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
const ACOLORS = ['#2D6A35','#1565C0','#AD1457','#E65100','#6A1B9A']
const acolor = i => ACOLORS[i%ACOLORS.length]
const ageOf = dob => dob ? Math.floor((Date.now()-new Date(dob))/31557600000) : null

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
function SecH({ emoji, title }) {
  return <div className="sec-hd"><span className="sec-hd-icon">{emoji}</span><span className="sec-hd-title">{title}</span></div>
}

export default function Setup() {
  const { family, updateFamily } = useAuth()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)

  /* ── DB-loaded data ── */
  const [cities,     setCities]     = useState([])        // from /delivery/cities
  const [apartments, setApartments] = useState([])        // from /delivery/apartments?city=
  const [aptLoading, setAptLoading] = useState(false)
  const [apiGoals,   setApiGoals]   = useState([])        // from /wellness/goals
  const [apiHC,      setApiHC]      = useState([])        // from /delivery/health-challenges
  const [apiPrefs,   setApiPrefs]   = useState({taste:[],cooking:[],allergy:[]}) // from /delivery/preferences

  /* ── Step 0 ── */
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [city,     setCity]     = useState('')
  const [dlvType,  setDlvType]  = useState('individual')
  const [aptId,    setAptId]    = useState('')            // selected apartment _id from DB
  const [aptName,  setAptName]  = useState('')
  const [tower,    setTower]    = useState('')
  const [flat,     setFlat]     = useState('')
  const [landmark, setLandmark] = useState('')
  const [pincode,  setPincode]  = useState('')
  const [prefTime, setPrefTime] = useState('morning')
  const [dlvInstr, setDlvInstr] = useState('')
  const [ecName,   setEcName]   = useState('')
  const [ecRel,    setEcRel]    = useState('')
  const [ecPhone,  setEcPhone]  = useState('')

  /* ── Step 1 ── */
  const [members,  setMembers]  = useState([])
  const [newM,     setNewM]     = useState({rel:'Self',name:'',dob:'',gender:'Female',height:'',weight:'',activity:'moderate',include:true})
  const [editIdx,  setEditIdx]  = useState(null)

  /* ── Step 2 ── */
  const [activeMem, setActiveMem] = useState(0)
  const [mGoals,    setMGoals]    = useState({})
  const [mHC,       setMHC]       = useState({})
  const [hcQ,       setHcQ]       = useState('')

  /* ── Step 3 ── */
  const [diet,         setDiet]         = useState('Vegetarian')
  const [vegRestr,     setVegRestr]     = useState(false)
  const [fruitRestr,   setFruitRestr]   = useState(false)
  const [vegQ,         setVegQ]         = useState('')
  const [fruitQ,       setFruitQ]       = useState('')
  const [dislikedVeg,  setDislikedVeg]  = useState([])
  const [dislikedFruit,setDislikedFruit]= useState([])
  const [taste,        setTaste]        = useState([])
  const [cook,         setCook]         = useState([])
  const [allergy,      setAllergy]      = useState([])
  const [prefPlan,     setPrefPlan]     = useState('weekly')
  const [otherTaste,   setOtherTaste]   = useState('')
  const [otherCook,    setOtherCook]    = useState('')
  const [otherAllergy, setOtherAllergy] = useState('')
  const [showOtherTaste,   setShowOtherTaste]   = useState(false)
  const [showOtherCook,    setShowOtherCook]    = useState(false)
  const [showOtherAllergy, setShowOtherAllergy] = useState(false)

  /* ── Load all DB data on mount ── */
  useEffect(() => {
    // Load cities from DB
    api.getCities().then(d => {
      const list = d.cities || []
      setCities(list)
      if (list.length && !city) setCity(list[0])
    }).catch(() => { setCities(['Coimbatore','Chennai']); setCity('Coimbatore') })

    // Load wellness goals from DB
    api.getGoals().then(d => setApiGoals(d.goals||[])).catch(()=>{})

    // Load health challenges from DB
    api.getHealthChallenges().then(d => setApiHC(d.challenges||[])).catch(()=>{})

    // Load taste/cooking/allergy preferences from DB
    api.getPreferences().then(d => setApiPrefs(d)).catch(()=>{})

    // Load family data and pre-fill all fields
    if (!family?._id) return
    api.getFamily(family._id).then(d => {
      const f = d.family
      if (!f) return
      const autoName = f.familyName && f.familyName.startsWith('Family-')
      setName(autoName ? '' : (f.familyName || ''))
      setEmail(f.email || '')
      const savedCity = f.city || ''
      if (savedCity) setCity(savedCity)
      setDlvType(f.deliveryType || 'individual')
      setAptId(f.apartmentId || '')
      setAptName(f.apartmentName || '')
      setTower(f.towerNo || '')
      setFlat(f.flatNo || '')
      setLandmark(f.landmark || '')
      setPincode(f.pincode || '')
      setPrefTime(f.preferredDeliveryTime || 'morning')
      setDlvInstr(f.deliveryInstructions || '')
      if (f.dietPreference) setDiet(f.dietPreference)
      // Load apartments for saved city
      if (savedCity) loadApartments(savedCity)
    }).catch(() => {
      if (family.familyName) setName(family.familyName)
      if (family.city) { setCity(family.city); loadApartments(family.city) }
    })
  }, [family?._id])

  // Load apartments when city changes
  const loadApartments = (c) => {
    if (!c) return
    setAptLoading(true)
    api.getApartments(c).then(d => {
      setApartments(d.apartments || [])
    }).catch(() => setApartments([]))
      .finally(() => setAptLoading(false))
  }

  const handleCityChange = (c) => {
    setCity(c)
    setAptId('')
    setAptName('')
    loadApartments(c)
  }

  const handleAptSelect = (apt) => {
    setAptId(apt._id?.toString() || apt.apartmentId || '')
    setAptName(apt.apartmentName || apt.name || '')
    // Auto-fill apartment-level address details
    if (apt.landmark) setLandmark(apt.landmark)
    if (apt.pincode)  setPincode(apt.pincode)
    // Note: tower/flat are user-specific — left for user to fill
  }

  /* helpers */
  const curMem   = members[activeMem]
  const curGoals = curMem ? (mGoals[curMem._tid]||[]) : []
  const curHC    = curMem ? (mHC[curMem._tid]||[]) : []

  const toggleGoal = (tid,gn) => setMGoals(p => {
    const c=p[tid]||[]
    if(!c.includes(gn)&&c.length>=3){showToast('Max 3 goals per member','error');return p}
    return {...p,[tid]:c.includes(gn)?c.filter(x=>x!==gn):[...c,gn]}
  })
  const toggleHC    = (tid,h) => setMHC(p=>{const c=p[tid]||[];return{...p,[tid]:c.includes(h)?c.filter(x=>x!==h):[...c,h]}})
  const toggleTaste = t => setTaste(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])
  const toggleCook  = c => setCook(p=>p.includes(c)?p.filter(x=>x!==c):[...p,c])
  const toggleAllergy = a => setAllergy(p=>p.includes(a)?p.filter(x=>x!==a):[...p,a])

  const saveMember = () => {
    if(!newM.name.trim()) return showToast('Name is required','error')
    if(!newM.dob) return showToast('Date of birth is required','error')
    const m={...newM, _tid: editIdx!==null ? members[editIdx]._tid : Date.now().toString()}
    setMembers(p => editIdx!==null ? p.map((x,i)=>i===editIdx?m:x) : [...p,m])
    setNewM({rel:'Self',name:'',dob:'',gender:'Female',height:'',weight:'',activity:'moderate',include:true})
    setEditIdx(null)
  }
  const editMem = i => { setNewM(members[i]); setEditIdx(i) }

  const proceed = async () => {
    if (step===0) {
      if(!name.trim()) return showToast('Full name is required','error')
      if(!city) return showToast('Please select a city','error')
      setStep(1)
    } else if (step===1) {
      if(members.length===0) return showToast('Add at least one family member','error')
      if(editIdx!==null) return showToast('Save or cancel the member form first','error')
      setStep(2)
    } else if (step===2) {
      setStep(3)
    } else {
      setBusy(true)
      try {
        const phone = localStorage.getItem('kp_phone')||family?.phone||''
        const addressStr = [aptName, flat&&`Flat ${flat}`, tower&&`Tower ${tower}`, landmark].filter(Boolean).join(', ') || aptName || ''
        const payload = {
          familyName:  name, phone, email, city,
          address:     addressStr,
          apartmentId: aptId || null,
          apartmentName: aptName,
          flatNo:      flat,
          towerNo:     tower || null,
          landmark,    pincode,
          deliveryType: dlvType,
          preferredDeliveryTime: prefTime,
          deliveryInstructions:  dlvInstr,
          dietPreference: diet,
        }

        let fam = family
        if (!fam?._id) {
          const r = await api.registerFamily(payload)
          fam = r.family; updateFamily(fam)
        } else {
          const r = await api.updateFamily(fam._id, payload)
          fam = r.family||fam; updateFamily(fam)
        }

        for (const m of members) {
          try {
            await api.addMember(fam._id, {
              name:                m.name,
              gender:              m.gender,
              age:                 ageOf(m.dob),
              height:              parseFloat(m.height)||null,
              weight:              parseFloat(m.weight)||null,
              activityLevel:       m.activity,
              relationship:        m.rel,
              dietType:            diet,
              wellnessGoals:       mGoals[m._tid]  || [],
              healthChallenges:    mHC[m._tid]     || [],
              dislikedVeg:         dislikedVeg,
              dislikedFruit:       dislikedFruit,
              tastePref:           taste,
              cookPref:            cook,
              dietaryRestrictions: allergy,
              preferredPlan:       prefPlan,
            })
          } catch(e){ console.warn('Member add error:',e) }
        }

        try { const fresh=await api.getFamily(fam._id); updateFamily(fresh.family||fam) } catch{}
        showToast('Profile saved! 🎉','success')
        nav('/home',{replace:true})
      } catch(e) {
        showToast(e.message||'Save failed','error')
      } finally { setBusy(false) }
    }
  }

  const bmi = calcBMI(newM.height,newM.weight)
  const bi  = bmiInfo(bmi)

  // Build goals list from DB, enrich with emojis
  const goalsList = apiGoals.length
    ? apiGoals.map(g => ({
        name: g.goalName||g.name,
        emoji: GOAL_EMOJI[g.goalName||g.name] || '🌿',
        desc:  g.description || '',
      }))
    : Object.keys(GOAL_EMOJI).map(name=>({name,emoji:GOAL_EMOJI[name],desc:''}))

  // HC list from DB
  const hcList = apiHC.length ? apiHC : ['Blood Sugar','Blood Pressure','Thyroid','PCOS','Cholesterol','Anaemia','Arthritis','Kidney Issues','Digestive Issues']
  const hcFiltered = hcList.filter(h => (typeof h==='string'?h:h.name||'').toLowerCase().includes(hcQ.toLowerCase()))
  const hcName = h => typeof h==='string' ? h : h.name||''

  // Taste/cooking/allergy - these could come from DB in future, hardcode for now as they're UI patterns
  // Preferences from DB (taste/cooking/allergy) with fallbacks
  const TASTE   = apiPrefs.taste.length   ? apiPrefs.taste   : ['Sweet','Mild','Tangy','Spicy','Bitter']
  const COOKING = apiPrefs.cooking.length ? apiPrefs.cooking : ['Quick Cooking','Traditional Cooking','Salads','Juices','Smoothies','Soups']
  const ALLERGY = apiPrefs.allergy.length ? apiPrefs.allergy : ['Nut Allergy','Gluten Sensitivity','Lactose Intolerance']

  return (
    <div className="page">
      {/* ── Header ── */}
      <div style={{background:'var(--cream)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'14px 18px 0'}}>
          <button onClick={()=>step>0?setStep(step-1):nav('/login')}
            style={{width:34,height:34,borderRadius:'50%',background:'var(--white)',border:'1.5px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>←</button>
          <img src={logo} alt="KP" style={{width:28,height:28,objectFit:'contain',borderRadius:8}}/>
          <span style={{fontFamily:'var(--font-serif)',fontSize:14,fontWeight:700,color:'var(--green-dark)'}}>KRISHA PURE</span>
          {(step===2||step===3)&&curMem&&(
            <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:7,background:'var(--white)',border:'1.5px solid var(--border)',borderRadius:10,padding:'5px 10px',cursor:'pointer'}}
              onClick={()=>setActiveMem(p=>(p+1)%members.length)}>
              <span style={{fontSize:14}}>👥</span>
              <div>
                <div style={{fontSize:11,fontWeight:700}}>Member: {curMem.name.split(' ')[0]}{activeMem===0?' (You)':''}</div>
                <div style={{fontSize:10,color:'var(--text-light)'}}>{curMem.gender} · {ageOf(curMem.dob)??'–'} yrs</div>
              </div>
              <span style={{fontSize:10,color:'var(--text-light)'}}>▾</span>
            </div>
          )}
        </div>
        <div style={{padding:'8px 18px 0',position:'relative',minHeight:step<2?80:0}}>
          {step<2&&<div style={{position:'absolute',top:0,right:0,fontSize:80,opacity:0.7,lineHeight:1,filter:'drop-shadow(2px 3px 6px rgba(0,0,0,0.1))'}}>🧺</div>}
          <div style={{fontSize:10,fontWeight:700,letterSpacing:0.8,textTransform:'uppercase',color:'var(--green)',marginBottom:2}}>STEP {step+1} OF 4</div>
          <div style={{fontFamily:'var(--font-serif)',fontSize:22,fontWeight:700,lineHeight:1.25,marginBottom:3,position:'relative',zIndex:1,maxWidth:step<2?'65%':'100%'}}>
            {['Personal & Delivery Details','Family Members','Wellness Goals','Food Preferences'][step]}
          </div>
          <div style={{fontSize:12,color:'var(--text-light)',lineHeight:1.5,marginBottom:10,position:'relative',zIndex:1,maxWidth:step<2?'65%':'100%'}}>
            {['Help us serve you better with fresh, personalized wellness baskets.',
              'Add each member to receive personalized wellness recommendations.',
              curMem?`Choose up to 3 wellness goals for ${curMem.name.split(' ')[0]}`:'Choose wellness goals',
              "Help us curate baskets you'll love, every time."][step]}
          </div>
          {step===2&&<div style={{position:'absolute',top:8,right:18,background:'var(--green)',color:'#fff',borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:700}}>✓ {curGoals.length} selected</div>}
        </div>
      </div>

      <Stepper step={step}/>

      <div className="scroll" style={{padding:'14px 18px 120px'}}>

        {/* ══ STEP 0 ══ */}
        {step===0&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div className="card">
              <SecH emoji="👤" title="Personal Information"/>
              <div style={{display:'flex',flexDirection:'column',gap:11}}>
                <div className="field">
                  <label className="label">Full Name</label>
                  <div className="input-row"><span className="input-ico">👤</span>
                    <input className="inp" placeholder="e.g. Priya Krishnan" value={name} onChange={e=>setName(e.target.value)}/></div>
                </div>
                <div className="field">
                  <label className="label">Mobile Number</label>
                  <div className="input-row"><span className="input-ico">📞</span>
                    <input className="inp" value={'+91 '+(localStorage.getItem('kp_phone')||family?.phone||'')} readOnly style={{color:'var(--text-mid)',background:'#FAFAFA'}}/></div>
                </div>
                <div className="field">
                  <label className="label">Email Address <span className="opt">(Optional)</span></label>
                  <div className="input-row"><span className="input-ico">✉️</span>
                    <input className="inp" type="email" placeholder="e.g. priya@gmail.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
                </div>
              </div>
            </div>

            <div className="card">
              <SecH emoji="📍" title="Delivery Address"/>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>

                {/* City — from DB */}
                <div className="field">
                  <label className="label">City</label>
                  <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                    {cities.map(c=>(
                      <button key={c} onClick={()=>handleCityChange(c)} type="button"
                        style={{flex:1,minWidth:120,padding:'13px',borderRadius:12,border:`2px solid ${city===c?'var(--green)':'var(--border)'}`,background:city===c?'var(--green)':'var(--white)',color:city===c?'#fff':'var(--text-mid)',fontWeight:700,fontSize:14,cursor:'pointer',transition:'all 0.15s',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                        {city===c&&<span>✓</span>} {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delivery type */}
                <div className="field">
                  <label className="label">Delivery Location Type</label>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {DELIVERY_TYPES.map(o=>(
                      <div key={o.id} className={`sel-card${dlvType===o.id?' on':''}`} onClick={()=>{setDlvType(o.id); if(o.id==='gated'&&city) loadApartments(city)}}>
                        <span style={{fontSize:22}}>{o.emoji}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:700}}>{o.title}</div>
                          <div style={{fontSize:11,color:'var(--text-light)'}}>{o.sub}</div>
                        </div>
                        <div className="radio-dot"/>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Apartment — from DB when gated, free text for individual */}
                {dlvType==='gated' ? (
                  <div className="field">
                    <label className="label">Select Apartment / Community</label>
                    {aptLoading ? (
                      <div style={{padding:'12px',textAlign:'center',color:'var(--text-light)',fontSize:13}}>Loading apartments…</div>
                    ) : apartments.length > 0 ? (
                      <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:220,overflowY:'auto'}}>
                        {apartments.map(apt=>{
                          const aid   = apt._id?.toString()||apt.apartmentId
                          const aname = apt.apartmentName||apt.name
                          const sel   = aptId===aid || aptName===aname
                          return (
                            <div key={aid} onClick={()=>handleAptSelect(apt)}
                              style={{padding:'12px 14px',borderRadius:12,border:`2px solid ${sel?'var(--green)':'var(--border)'}`,background:sel?'var(--green-pale)':'var(--white)',cursor:'pointer',transition:'all 0.15s',display:'flex',alignItems:'center',gap:10}}>
                              <div style={{flex:1}}>
                                <div style={{fontSize:13,fontWeight:700,color:sel?'var(--green)':'var(--text)'}}>{aname}</div>
                                {apt.address&&<div style={{fontSize:11,color:'var(--text-light)',marginTop:1}}>{apt.address}</div>}
                                {(apt.city||apt.pincode)&&(
                                  <div style={{fontSize:11,color:'var(--text-light)',marginTop:1}}>
                                    {[apt.city, apt.pincode].filter(Boolean).join(' · ')}
                                  </div>
                                )}
                              </div>
                              {sel&&<span style={{color:'var(--green)',fontSize:18,fontWeight:700}}>✓</span>}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div>
                        <div style={{fontSize:12,color:'var(--text-light)',marginBottom:8}}>No registered apartments for {city||'this city'}. Enter manually:</div>
                        <div className="input-row"><span className="input-ico">🏢</span>
                          <input className="inp" placeholder="e.g. Green Meadows Apartments" value={aptName} onChange={e=>setAptName(e.target.value)}/></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="field">
                    <label className="label">Apartment / Building Name</label>
                    <div className="input-row"><span className="input-ico">🏢</span>
                      <input className="inp" placeholder="e.g. Green Meadows Apartments" value={aptName} onChange={e=>setAptName(e.target.value)}/></div>
                  </div>
                )}

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div className="field">
                    <label className="label">Tower / Block</label>
                    <div className="input-row"><span className="input-ico">🏗️</span>
                      <input className="inp" placeholder="e.g. Block A" value={tower} onChange={e=>setTower(e.target.value)}/></div>
                  </div>
                  <div className="field">
                    <label className="label">Flat / House No.</label>
                    <div className="input-row"><span className="input-ico">🚪</span>
                      <input className="inp" placeholder="e.g. B-101" value={flat} onChange={e=>setFlat(e.target.value)}/></div>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Landmark <span className="opt">(Optional)</span></label>
                  <div className="input-row"><span className="input-ico">📌</span>
                    <input className="inp" placeholder="e.g. Near Lotus Cafe" value={landmark} onChange={e=>setLandmark(e.target.value)}/></div>
                </div>
                <div className="field">
                  <label className="label">Pincode</label>
                  <div className="input-row"><span className="input-ico">🏠</span>
                    <input className="inp" placeholder="641001" inputMode="numeric" maxLength={6} value={pincode} onChange={e=>setPincode(e.target.value.replace(/\D/g,''))}/></div>
                </div>
              </div>
            </div>

            <div className="card">
              <SecH emoji="📅" title="Delivery Preference"/>
              <div style={{fontSize:12,fontWeight:600,color:'var(--text-mid)',marginBottom:10}}>Preferred Delivery Time</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14}}>
                {DELIVERY_SLOTS.map(s=>(
                  <div key={s.id} onClick={()=>setPrefTime(s.id)}
                    style={{border:`1.5px solid ${prefTime===s.id?'var(--green)':'var(--border)'}`,borderRadius:12,padding:'12px 6px',textAlign:'center',cursor:'pointer',background:prefTime===s.id?'var(--green-pale)':'var(--white)',transition:'all 0.15s'}}>
                    <div style={{fontSize:24,marginBottom:4}}>{s.emoji}</div>
                    <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{s.label}</div>
                    <div style={{fontSize:10,color:'var(--text-light)',marginBottom:6}}>{s.time}</div>
                    <div style={{width:16,height:16,borderRadius:'50%',border:`2px solid ${prefTime===s.id?'var(--green)':'var(--border)'}`,background:prefTime===s.id?'var(--green)':'transparent',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {prefTime===s.id&&<span style={{color:'#fff',fontSize:9,fontWeight:700}}>✓</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="field">
                <label className="label">Delivery Instructions <span className="opt">(Optional)</span></label>
                <textarea className="ta" rows={3} maxLength={120} placeholder="e.g. Leave at doorstep, call before delivery, etc." value={dlvInstr} onChange={e=>setDlvInstr(e.target.value)}/>
                <div style={{fontSize:11,color:'var(--text-light)',textAlign:'right',marginTop:3}}>Max 120 characters · {dlvInstr.length}/120</div>
              </div>
            </div>

            <div className="card">
              <SecH emoji="🛡️" title="Emergency Contact"/>
              <div style={{fontSize:12,color:'var(--text-light)',marginBottom:12}}><span style={{fontWeight:500}}>(Optional)</span> — In case we are unable to reach you.</div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <div className="field"><label className="label">Contact Person Name</label>
                  <div className="input-row"><span className="input-ico">👤</span><input className="inp" placeholder="e.g. Aravind Krishnan" value={ecName} onChange={e=>setEcName(e.target.value)}/></div></div>
                <div className="field"><label className="label">Relationship</label>
                  <div className="input-row"><span className="input-ico">👥</span><input className="inp" placeholder="e.g. Husband" value={ecRel} onChange={e=>setEcRel(e.target.value)}/></div></div>
                <div className="field"><label className="label">Mobile Number</label>
                  <div className="input-row"><span className="input-ico">📞</span><input className="inp" placeholder="+91 98765 43211" value={ecPhone} onChange={e=>setEcPhone(e.target.value)}/></div></div>
              </div>
              <div style={{display:'flex',alignItems:'flex-start',gap:10,background:'var(--green-light)',border:'1px solid #C8E6C9',borderRadius:10,padding:'10px 12px',marginTop:14}}>
                <span style={{fontSize:16,flexShrink:0}}>🔒</span>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--green)',marginBottom:2}}>We value your privacy</div>
                  <div style={{fontSize:11,color:'var(--text-mid)',lineHeight:1.5}}>Your information is used only for deliveries and personalized wellness recommendations.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 1 ══ */}
        {step===1&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {members.length>0&&(
              <div style={{background:'var(--white)',borderRadius:16,border:'1px solid var(--border)',padding:'14px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <div style={{fontSize:14,fontWeight:700}}>Your Family ({members.length})</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {members.map((m,i)=>{
                    const a=ageOf(m.dob), hasG=(mGoals[m._tid]||[]).length>0
                    return (
                      <div key={i} style={{border:'1.5px solid var(--border)',borderRadius:12,padding:12,position:'relative'}}>
                        <button onClick={()=>editMem(i)} style={{position:'absolute',top:8,right:8,fontSize:14,color:'var(--text-light)',padding:'2px 4px',background:'none',border:'none',cursor:'pointer'}}>✏️</button>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                          <div className="avatar" style={{background:acolor(i),width:34,height:34,fontSize:12}}>{initials(m.name)}</div>
                          <div>
                            <div style={{fontSize:12,fontWeight:700,color:'var(--green)'}}>{m.name}{i===0?' (You)':''}</div>
                            <div style={{fontSize:11,color:'var(--text-light)'}}>{m.rel}{a?` · ${a} yrs`:''} · {m.gender}</div>
                          </div>
                        </div>
                        {hasG
                          ? <div style={{fontSize:11,color:'var(--green)',fontWeight:600}}>✅ Profile complete</div>
                          : <div style={{fontSize:11,color:'#E67E22',fontWeight:600}}>⏳ Wellness details pending</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="card">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:18}}>👤</span>
                  <span style={{fontSize:15,fontWeight:700}}>{editIdx!==null?'Edit Member':'Add Family Member'}</span>
                </div>
                <span style={{fontSize:11,fontWeight:700,background:'#FFF0F0',color:'var(--red)',padding:'3px 8px',borderRadius:6}}>* Required</span>
              </div>

              <div className="field" style={{marginBottom:14}}>
                <label className="label">Relationship <span style={{color:'var(--red)'}}>*</span></label>
                <div style={{display:'flex',gap:6,marginTop:4,overflowX:'auto',paddingBottom:2}}>
                  {RELS.map(r=>(
                    <button key={r.id} onClick={()=>setNewM(p=>({...p,rel:r.id}))}
                      style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'10px 8px',borderRadius:10,border:`1.5px solid ${newM.rel===r.id?'var(--green)':'var(--border)'}`,background:newM.rel===r.id?'var(--green)':'var(--white)',color:newM.rel===r.id?'#fff':'var(--text-mid)',cursor:'pointer',minWidth:52,flexShrink:0,transition:'all 0.15s'}}>
                      <span style={{fontSize:22}}>{r.emoji}</span>
                      <span style={{fontSize:10,fontWeight:700}}>{r.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field" style={{marginBottom:12}}>
                <label className="label">Full Name <span style={{color:'var(--red)'}}>*</span></label>
                <div className="input-row"><span className="input-ico">👤</span>
                  <input className="inp" placeholder="e.g. Priya Krishnan" value={newM.name} onChange={e=>setNewM(p=>({...p,name:e.target.value}))}/></div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                <div className="field">
                  <label className="label">Date of Birth <span style={{color:'var(--red)'}}>*</span></label>
                  <div className="input-row"><span className="input-ico">📅</span>
                    <input className="inp" type="date" value={newM.dob} onChange={e=>setNewM(p=>({...p,dob:e.target.value}))}/></div>
                  <div style={{fontSize:10,color:'var(--text-light)',marginTop:2}}>We'll use this to calculate age.</div>
                </div>
                <div className="field">
                  <label className="label">Gender <span style={{color:'var(--red)'}}>*</span></label>
                  <div style={{display:'flex',gap:5}}>
                    {['Female','Male','Prefer not to say'].map(g=>(
                      <button key={g} onClick={()=>setNewM(p=>({...p,gender:g}))}
                        style={{flex:1,padding:'9px 4px',borderRadius:8,border:`1.5px solid ${newM.gender===g?'var(--green)':'var(--border)'}`,background:newM.gender===g?'var(--green-pale)':'var(--white)',color:newM.gender===g?'var(--green)':'var(--text-mid)',fontSize:10,fontWeight:600,cursor:'pointer',transition:'all 0.15s',display:'flex',alignItems:'center',justifyContent:'center',gap:2}}>
                        {g==='Female'?'👩':g==='Male'?'👨':'🧑'} {g==='Prefer not to say'?'N/A':g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:4}}>
                <div className="field">
                  <label className="label">Height (cm) <span className="opt">Optional</span></label>
                  <div className="input-row"><span className="input-ico">📏</span>
                    <input className="inp" type="number" placeholder="e.g. 165" value={newM.height} onChange={e=>setNewM(p=>({...p,height:e.target.value}))}/></div>
                  <div style={{fontSize:10,color:'var(--text-light)'}}>Used only for better recommendations.</div>
                </div>
                <div className="field">
                  <label className="label">Weight (kg) <span className="opt">Optional</span></label>
                  <div className="input-row"><span className="input-ico">⚖️</span>
                    <input className="inp" type="number" placeholder="e.g. 65" value={newM.weight} onChange={e=>setNewM(p=>({...p,weight:e.target.value}))}/></div>
                  <div style={{fontSize:10,color:'var(--text-light)'}}>Used only for better recommendations.</div>
                </div>
              </div>
              {bmi&&bi&&<div style={{fontSize:12,fontWeight:600,color:bi.color,marginBottom:10,padding:'5px 10px',background:bi.color+'15',borderRadius:8}}>BMI {bmi} · {bi.label}</div>}

              <div className="field" style={{marginBottom:14}}>
                <label className="label" style={{marginBottom:8}}>Activity Level <span style={{color:'var(--red)'}}>*</span></label>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7}}>
                  {ACTIVITY.map(a=>(
                    <div key={a.id} className={`act-card${newM.activity===a.id?' on':''}`} onClick={()=>setNewM(p=>({...p,activity:a.id}))}>
                      {newM.activity===a.id&&<div className="act-check">✓</div>}
                      <div style={{fontSize:22,marginBottom:3}}>{a.emoji}</div>
                      <div style={{fontSize:10,fontWeight:700,lineHeight:1.3}}>{a.label}</div>
                      <div style={{fontSize:9,color:'var(--text-light)',whiteSpace:'pre-line',marginTop:2,lineHeight:1.3}}>{a.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',marginBottom:16,fontSize:13,color:'var(--text-mid)'}} onClick={()=>setNewM(p=>({...p,include:!p.include}))}>
                <div style={{width:20,height:20,borderRadius:5,border:`2px solid ${newM.include?'var(--green)':'var(--border)'}`,background:newM.include?'var(--green)':'var(--white)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s'}}>
                  {newM.include&&<span style={{color:'#fff',fontSize:11,fontWeight:700}}>✓</span>}
                </div>
                Include this member in family basket suggestions
                <span style={{marginLeft:'auto',color:'var(--text-light)',fontSize:15}}>ℹ️</span>
              </label>

              <div style={{display:'grid',gridTemplateColumns:editIdx!==null?'1fr 2fr':'1fr',gap:10}}>
                {editIdx!==null&&(
                  <button className="btn btn-outline" onClick={()=>{setEditIdx(null);setNewM({rel:'Self',name:'',dob:'',gender:'Female',height:'',weight:'',activity:'moderate',include:true})}}>Cancel</button>
                )}
                <button className="btn btn-primary" onClick={saveMember}>{editIdx!==null?'Update Member':'Save Member  →'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 2 ══ */}
        {step===2&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {/* Goals from DB */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
              {goalsList.map(g=>{
                const on=curMem&&curGoals.includes(g.name)
                return (
                  <div key={g.name} className={`goal-card${on?' on':''}`} onClick={()=>curMem&&toggleGoal(curMem._tid,g.name)}>
                    <div className="gc-radio">{on&&<span className="gc-check">✓</span>}</div>
                    <div style={{fontSize:28,marginBottom:6,marginTop:2}}>{g.emoji}</div>
                    <div style={{fontSize:12,fontWeight:700,lineHeight:1.3,marginBottom:3}}>{g.name}</div>
                    <div style={{fontSize:10,color:'var(--text-light)',lineHeight:1.4}}>{g.desc}</div>
                  </div>
                )
              })}
            </div>

            {/* Health Challenges from DB */}
            <div className="card">
              <div style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:8}}>
                <span style={{fontSize:18}}>💗</span>
                <div style={{flex:1}}>
                  <span style={{fontSize:14,fontWeight:700}}>Current Health Challenges</span>
                  <span style={{fontSize:11,color:'var(--text-light)',marginLeft:6}}>(Optional)</span>
                  <div style={{fontSize:12,color:'var(--text-light)',marginTop:2}}>Select any applicable to {curMem?.name?.split(' ')[0]||'this member'}.</div>
                </div>
              </div>
              <div className="input-row" style={{marginBottom:10}}>
                <span className="input-ico">🔍</span>
                <input className="inp" placeholder="Search health challenges…" value={hcQ} onChange={e=>setHcQ(e.target.value)}/>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                {/* Selected chips always visible */}
                {curHC.map(h=>(
                  <button key={h} onClick={()=>curMem&&toggleHC(curMem._tid,h)}
                    style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:20,border:'1.5px solid var(--green)',background:'var(--green-pale)',color:'var(--green)',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                    {h} <span style={{fontWeight:700}}>×</span>
                  </button>
                ))}
                {/* Unselected options only when user is searching */}
                {hcQ.trim() && hcFiltered.filter(h=>!curHC.includes(hcName(h))).map(h=>(
                  <button key={hcName(h)} onClick={()=>curMem&&toggleHC(curMem._tid,hcName(h))}
                    style={{padding:'6px 12px',borderRadius:20,border:'1.5px solid var(--border)',background:'var(--white)',color:'var(--text-mid)',fontSize:12,cursor:'pointer'}}>
                    + {hcName(h)}
                  </button>
                ))}
                {/* Empty state hint */}
                {!hcQ.trim() && curHC.length===0 && (
                  <div style={{fontSize:12,color:'var(--text-light)',padding:'4px 0'}}>
                    Type above to search and add health challenges
                  </div>
                )}
              </div>
            </div>

            <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',background:'var(--green-light)',borderRadius:10,border:'1px solid #C8E6C9'}}>
              <span style={{fontSize:14}}>🛡️</span>
              <span style={{fontSize:12,color:'var(--text-mid)'}}>Your information is secure and used only to personalize your wellness plan.</span>
            </div>

            {members.length>1&&(
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {members.map((m,i)=>(
                  <button key={i} onClick={()=>setActiveMem(i)}
                    style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:20,border:`1.5px solid ${activeMem===i?'var(--green)':'var(--border)'}`,background:activeMem===i?'var(--green)':'var(--white)',color:activeMem===i?'#fff':'var(--text-mid)',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                    {(mGoals[m._tid]||[]).length>0?'✅ ':''}{m.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ STEP 3 ══ */}
        {step===3&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div className="card">
              <SecH emoji="🍽️" title="Diet Type"/>
              <div style={{fontSize:12,color:'var(--text-light)',marginBottom:12}}>Helps us suggest suitable products</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                {DIET_TYPES.map(d=>(
                  <div key={d.id} onClick={()=>setDiet(d.id)}
                    style={{border:`1.5px solid ${diet===d.id?'var(--green)':'var(--border)'}`,borderRadius:12,padding:'14px 8px',textAlign:'center',cursor:'pointer',background:diet===d.id?'var(--green-pale)':'var(--white)',transition:'all 0.15s',position:'relative'}}>
                    <div style={{position:'absolute',top:8,right:8,width:16,height:16,borderRadius:'50%',border:`2px solid ${diet===d.id?'var(--green)':'var(--border)'}`,background:diet===d.id?'var(--green)':'var(--white)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {diet===d.id&&<span style={{color:'#fff',fontSize:9,fontWeight:700}}>✓</span>}
                    </div>
                    <div style={{fontSize:28,marginBottom:8}}>{d.emoji}</div>
                    <div style={{fontSize:12,fontWeight:700,marginBottom:3}}>{d.id}</div>
                    <div style={{fontSize:10,color:'var(--text-light)',lineHeight:1.4}}>{d.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vegetable Restrictions */}
            <div className="card">
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontSize:18}}>🥬</span>
                <span style={{fontSize:14,fontWeight:700}}>Disliked Vegetables</span>
                <span style={{fontSize:11,color:'var(--text-light)'}}>(Optional)</span>
              </div>
              <div style={{fontSize:12,color:'var(--text-light)',marginBottom:10}}>These will be excluded from your baskets</div>
              <div style={{display:'flex',gap:8,marginBottom:10}}>
                {[{v:false,l:'No restrictions'},{v:true,l:'Yes, I have restrictions'}].map(o=>(
                  <button key={String(o.v)} onClick={()=>{setVegRestr(o.v);if(!o.v){setDislikedVeg([]);setVegQ('')}}}
                    style={{flex:1,padding:'8px 6px',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',border:`1.5px solid ${vegRestr===o.v?'var(--green)':'var(--border)'}`,background:vegRestr===o.v?'var(--green-pale)':'var(--white)',color:vegRestr===o.v?'var(--green)':'var(--text-mid)'}}>
                    {vegRestr===o.v?'✅ ':''}{o.l}
                  </button>
                ))}
              </div>
              {vegRestr&&(
                <>
                  <div className="input-row" style={{marginBottom:10}}>
                    <span className="input-ico">🔍</span>
                    <input className="inp" placeholder="Search vegetables to exclude…" value={vegQ} onChange={e=>setVegQ(e.target.value)}/>
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                    {dislikedVeg.map(v=>(
                      <button key={v} onClick={()=>setDislikedVeg(p=>p.filter(x=>x!==v))}
                        style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--green)',background:'var(--green-pale)',color:'var(--green)',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                        {v} <span style={{fontWeight:700}}>×</span>
                      </button>
                    ))}
                    {vegQ.trim()&&VEGETABLES.filter(v=>v.toLowerCase().includes(vegQ.toLowerCase())&&!dislikedVeg.includes(v)).map(v=>(
                      <button key={v} onClick={()=>{setDislikedVeg(p=>[...p,v]);setVegQ('')}}
                        style={{padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--border)',background:'var(--white)',color:'var(--text-mid)',fontSize:12,cursor:'pointer'}}>
                        + {v}
                      </button>
                    ))}
                    {!vegQ.trim()&&dislikedVeg.length===0&&<div style={{fontSize:12,color:'var(--text-light)'}}>Type above to search and add</div>}
                  </div>
                </>
              )}
            </div>

            {/* Fruit Restrictions */}
            <div className="card">
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontSize:18}}>🍊</span>
                <span style={{fontSize:14,fontWeight:700}}>Disliked Fruits</span>
                <span style={{fontSize:11,color:'var(--text-light)'}}>(Optional)</span>
              </div>
              <div style={{fontSize:12,color:'var(--text-light)',marginBottom:10}}>These will be excluded from your baskets</div>
              <div style={{display:'flex',gap:8,marginBottom:10}}>
                {[{v:false,l:'No restrictions'},{v:true,l:'Yes, I have restrictions'}].map(o=>(
                  <button key={String(o.v)} onClick={()=>{setFruitRestr(o.v);if(!o.v){setDislikedFruit([]);setFruitQ('')}}}
                    style={{flex:1,padding:'8px 6px',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',border:`1.5px solid ${fruitRestr===o.v?'var(--green)':'var(--border)'}`,background:fruitRestr===o.v?'var(--green-pale)':'var(--white)',color:fruitRestr===o.v?'var(--green)':'var(--text-mid)'}}>
                    {fruitRestr===o.v?'✅ ':''}{o.l}
                  </button>
                ))}
              </div>
              {fruitRestr&&(
                <>
                  <div className="input-row" style={{marginBottom:10}}>
                    <span className="input-ico">🔍</span>
                    <input className="inp" placeholder="Search fruits to exclude…" value={fruitQ} onChange={e=>setFruitQ(e.target.value)}/>
                  </div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                    {dislikedFruit.map(f=>(
                      <button key={f} onClick={()=>setDislikedFruit(p=>p.filter(x=>x!==f))}
                        style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--green)',background:'var(--green-pale)',color:'var(--green)',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                        {f} <span style={{fontWeight:700}}>×</span>
                      </button>
                    ))}
                    {fruitQ.trim()&&FRUITS.filter(f=>f.toLowerCase().includes(fruitQ.toLowerCase())&&!dislikedFruit.includes(f)).map(f=>(
                      <button key={f} onClick={()=>{setDislikedFruit(p=>[...p,f]);setFruitQ('')}}
                        style={{padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--border)',background:'var(--white)',color:'var(--text-mid)',fontSize:12,cursor:'pointer'}}>
                        + {f}
                      </button>
                    ))}
                    {!fruitQ.trim()&&dislikedFruit.length===0&&<div style={{fontSize:12,color:'var(--text-light)'}}>Type above to search and add</div>}
                  </div>
                </>
              )}
            </div>

            {/* Preferred Taste — DB driven */}
            <div className="card">
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <span style={{fontSize:18}}>💗</span><span style={{fontSize:14,fontWeight:700}}>Preferred Taste</span>
                <span style={{fontSize:11,color:'var(--text-light)'}}>(Select all that you like)</span>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {TASTE.map(t=><button key={t} onClick={()=>toggleTaste(t)} className={`pill${taste.includes(t)?' on':''}`}>{taste.includes(t)&&'✓ '}{t}</button>)}
                {/* Custom taste chips added via Others */}
                {taste.filter(t=>!TASTE.includes(t)).map(t=>(
                  <button key={t} onClick={()=>toggleTaste(t)} className="pill on">✓ {t} ×</button>
                ))}
                {showOtherTaste ? (
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <input style={{padding:'5px 10px',borderRadius:20,border:'1.5px solid var(--green)',fontSize:12,width:130,outline:'none'}}
                      placeholder="Type & press Enter" value={otherTaste} autoFocus
                      onChange={e=>setOtherTaste(e.target.value)}
                      onKeyDown={e=>{if(e.key==='Enter'&&otherTaste.trim()){setTaste(p=>[...p,otherTaste.trim()]);setOtherTaste('');setShowOtherTaste(false)}if(e.key==='Escape')setShowOtherTaste(false)}}/>
                    <button onClick={()=>{if(otherTaste.trim()){setTaste(p=>[...p,otherTaste.trim()]);setOtherTaste('');setShowOtherTaste(false)}}} className="pill on" style={{padding:'5px 10px'}}>Add</button>
                  </div>
                ) : (
                  <button onClick={()=>setShowOtherTaste(true)} className="pill" style={{borderStyle:'dashed'}}>+ Others</button>
                )}
              </div>
            </div>

            {/* Cooking Preference — DB driven */}
            <div className="card">
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <span style={{fontSize:18}}>👨‍🍳</span><span style={{fontSize:14,fontWeight:700}}>Cooking Preference</span>
                <span style={{fontSize:11,color:'var(--text-light)'}}>(Select all that apply)</span>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {COOKING.map(c=><button key={c} onClick={()=>toggleCook(c)} className={`pill${cook.includes(c)?' on':''}`}>{cook.includes(c)&&'✓ '}{c}</button>)}
                {cook.filter(c=>!COOKING.includes(c)).map(c=>(
                  <button key={c} onClick={()=>toggleCook(c)} className="pill on">✓ {c} ×</button>
                ))}
                {showOtherCook ? (
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <input style={{padding:'5px 10px',borderRadius:20,border:'1.5px solid var(--green)',fontSize:12,width:150,outline:'none'}}
                      placeholder="Type & press Enter" value={otherCook} autoFocus
                      onChange={e=>setOtherCook(e.target.value)}
                      onKeyDown={e=>{if(e.key==='Enter'&&otherCook.trim()){setCook(p=>[...p,otherCook.trim()]);setOtherCook('');setShowOtherCook(false)}if(e.key==='Escape')setShowOtherCook(false)}}/>
                    <button onClick={()=>{if(otherCook.trim()){setCook(p=>[...p,otherCook.trim()]);setOtherCook('');setShowOtherCook(false)}}} className="pill on" style={{padding:'5px 10px'}}>Add</button>
                  </div>
                ) : (
                  <button onClick={()=>setShowOtherCook(true)} className="pill" style={{borderStyle:'dashed'}}>+ Others</button>
                )}
              </div>
            </div>

            {/* Allergies & Restrictions — DB driven */}
            <div className="card">
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <span style={{fontSize:18}}>🛡️</span><span style={{fontSize:14,fontWeight:700}}>Allergies & Restrictions</span>
                <span style={{fontSize:11,color:'var(--text-light)'}}>(Select all that apply)</span>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {ALLERGY.map(a=><button key={a} onClick={()=>toggleAllergy(a)} className={`pill${allergy.includes(a)?' on':''}`}>{allergy.includes(a)&&'✓ '}{a}</button>)}
                {allergy.filter(a=>!ALLERGY.includes(a)).map(a=>(
                  <button key={a} onClick={()=>toggleAllergy(a)} className="pill on">✓ {a} ×</button>
                ))}
                {showOtherAllergy ? (
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <input style={{padding:'5px 10px',borderRadius:20,border:'1.5px solid var(--green)',fontSize:12,width:150,outline:'none'}}
                      placeholder="Type & press Enter" value={otherAllergy} autoFocus
                      onChange={e=>setOtherAllergy(e.target.value)}
                      onKeyDown={e=>{if(e.key==='Enter'&&otherAllergy.trim()){setAllergy(p=>[...p,otherAllergy.trim()]);setOtherAllergy('');setShowOtherAllergy(false)}if(e.key==='Escape')setShowOtherAllergy(false)}}/>
                    <button onClick={()=>{if(otherAllergy.trim()){setAllergy(p=>[...p,otherAllergy.trim()]);setOtherAllergy('');setShowOtherAllergy(false)}}} className="pill on" style={{padding:'5px 10px'}}>Add</button>
                  </div>
                ) : (
                  <button onClick={()=>setShowOtherAllergy(true)} className="pill" style={{borderStyle:'dashed'}}>+ Others</button>
                )}
              </div>
            </div>

            <div className="card">
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{fontSize:18}}>📅</span><span style={{fontSize:14,fontWeight:700}}>Preferred Plan</span>
              </div>
              <div style={{fontSize:12,color:'var(--text-light)',marginBottom:12}}>Select a plan that will apply to all family members</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                {[{id:'weekly',emoji:'🧺',label:'Weekly Plan',sub:'₹699',sub2:'7 Days'},{id:'daily',emoji:'🥕',label:'Daily Plan',sub:'Save 5%',sub2:''},{id:'alternate',emoji:'📅',label:'Alternate Days',sub:'Two days once',sub2:''}].map(p=>(
                  <div key={p.id} className={`plan-card${prefPlan===p.id?' on':''}`} onClick={()=>setPrefPlan(p.id)}>
                    <div className="plan-radio"/>
                    <div style={{fontSize:26,marginBottom:6,marginTop:6}}>{p.emoji}</div>
                    <div style={{fontSize:11,fontWeight:700,marginBottom:2}}>{p.label}</div>
                    <div style={{fontSize:11,color:prefPlan===p.id?'var(--green)':'var(--text-mid)',fontWeight:600}}>{p.sub}</div>
                    {p.sub2&&<div style={{fontSize:10,color:'var(--text-light)'}}>{p.sub2}</div>}
                  </div>
                ))}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6,marginTop:10,padding:'8px 10px',background:'#F8F8F8',borderRadius:8}}>
                <span style={{fontSize:14}}>ℹ️</span>
                <span style={{fontSize:12,color:'var(--text-light)'}}>You can change or pause your plan any time.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:430,background:'var(--white)',borderTop:'1px solid var(--border)',padding:'12px 18px max(16px,env(safe-area-inset-bottom))',zIndex:100}}>
        <button className="btn btn-primary" onClick={proceed} disabled={busy} style={{fontSize:15}}>
          {busy?<span className="spin"/>:step===3?'Get Started  🎉':'Save & Continue  →'}
        </button>
        <div style={{textAlign:'center',marginTop:6,fontSize:11,color:'var(--text-light)',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
          🔒 Your data is secure with us
        </div>
      </div>
    </div>
  )
}
