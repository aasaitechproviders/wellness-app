import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { showToast } from '../components/Toast'
import BottomNav from '../components/BottomNav'
import logo from '../assets/logo.png'

const ACOLORS = ['#2D6A35','#1565C0','#AD1457','#E65100','#6A1B9A','#00695C']
const acolor  = i => ACOLORS[i % ACOLORS.length]
const initials= (n='') => n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()

const GOAL_EMOJI = {
  'Immunity Support':'🛡️','Protein Support':'💪','Iron Support':'💧',
  'Weight Management':'⚖️','Diabetes Friendly':'🩺','Diabetes Control':'🩺',
  'Heart Wellness':'❤️','Digestive Wellness':'🌀','Bone Health':'🦴',
  "Women's Wellness":'🌸','Kids Nutrition':'😊','Senior Wellness':'👴',
  'Detox':'✨','General Wellness':'🌿','Other Goal':'🌿',
}

const RELS     = ['Self','Spouse','Child','Parent','Grandparent','Other']

const HC_FALLBACK = ['Blood Sugar','Blood Pressure','Thyroid','PCOS','Cholesterol','Anaemia','Arthritis','Kidney Issues','Digestive Issues','Liver Issues']

const InfoRow = ({ label, value }) => value ? (
  <div style={{ marginBottom:8 }}>
    <div style={{ fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:'uppercase',color:'var(--text-light)' }}>{label}</div>
    <div style={{ fontSize:13,color:'var(--text)',marginTop:1 }}>{value}</div>
  </div>
) : null

const ageFromDob = (dob) => {
  if (!dob) return null
  try {
    const d = new Date(dob)
    if (isNaN(d.getTime())) return null
    return Math.floor((Date.now() - d.getTime()) / 31557600000)
  } catch { return null }
}

const Tag = ({ label, icon }) => (
  <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:50,background:'var(--green-pale)',color:'var(--green)',fontSize:11,fontWeight:600,marginRight:5,marginBottom:5 }}>
    {icon} {label}
  </span>
)

const SCard = ({ children, style }) => (
  <div style={{ background:'var(--white)',borderRadius:14,border:'1px solid var(--border)',padding:'14px 16px 88px',marginBottom:12,...style }}>
    {children}
  </div>
)

const SectionLabel = ({children}) => (
  <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:7,textTransform:'uppercase',letterSpacing:0.5 }}>{children}</div>
)

/* ═══════════════════════════════════════════════════════════════════════════
   MemberEditor — EXTRACTED OUTSIDE Profile to prevent unmount/remount
   on every parent re-render (which was killing input focus)
   ═══════════════════════════════════════════════════════════════════════════ */
function MemberEditor({
  isNew, me, setMe, saving, onSave, onCancel,
  goalsList, hcList, allergyList, productList,
  activityLevels, metRanges, lifestyleCodes,
}) {
  // Search states live HERE so typing doesn't re-render parent
  const [goalSearch, setGoalSearch] = useState('')
  const [hcSearch,   setHcSearch]   = useState('')
  const [frQ,        setFrQ]        = useState('')
  const [algQ,       setAlgQ]       = useState('')

  const toggleGoal = g => setMe(p => {
    const c = p.wellnessGoals || []
    if (!c.includes(g) && c.length >= 3) { showToast('Max 3 goals per member','error'); return p }
    return { ...p, wellnessGoals: c.includes(g) ? c.filter(x=>x!==g) : [...c,g] }
  })
  const toggleHC = h => setMe(p => {
    const c = p.healthConditions || []
    return { ...p, healthConditions: c.includes(h) ? c.filter(x=>x!==h) : [...c,h] }
  })
  const toggleAllergy = a => setMe(p => {
    const c = p.allergies || []
    return { ...p, allergies: c.includes(a) ? c.filter(x=>x!==a) : [...c,a] }
  })

  return (
    <div style={{ background:'var(--green-light)',borderRadius:14,border:'1.5px solid var(--green)',padding:'16px',marginBottom:12 }}>
      <div style={{ fontSize:14,fontWeight:700,color:'var(--green)',marginBottom:14 }}>
        {isNew ? '➕ Add Family Member' : `✏️ Edit ${me.name||'Member'}`}
      </div>

      {/* Relationship */}
      <div style={{ marginBottom:12 }}>
        <SectionLabel>Relationship</SectionLabel>
        <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
          {RELS.map(r=>(
            <button key={r} onClick={()=>setMe(p=>({...p,relationship:r}))}
              style={{ padding:'6px 12px',borderRadius:20,border:`1.5px solid ${me.relationship===r?'var(--green)':'var(--border)'}`,background:me.relationship===r?'var(--green)':'var(--white)',color:me.relationship===r?'#fff':'var(--text-mid)',fontSize:12,fontWeight:600,cursor:'pointer' }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div style={{ marginBottom:10 }}>
        <SectionLabel>Full Name *</SectionLabel>
        <input className="inp no-ico" placeholder="e.g. Priya"
          defaultValue={me.name||''} key={`name-${me.memberId}`}
          onBlur={e=>setMe(p=>({...p,name:e.target.value}))} />
      </div>

      {/* DOB + Age */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12 }}>
        <div>
          <SectionLabel>Date of Birth</SectionLabel>
          <input className="inp no-ico" type="date"
            defaultValue={me.dob||''} key={`dob-${me.memberId}`}
            max={new Date().toISOString().split('T')[0]}
            onBlur={e=>{
              const d=e.target.value
              const age=ageFromDob(d)
              setMe(p=>({...p,dob:d,ageRaw:age?String(age):p.ageRaw}))
            }} />
        </div>
        <div>
          <SectionLabel>Age</SectionLabel>
          <input className="inp no-ico" type="number" inputMode="numeric" min="1" max="110" placeholder="34"
            defaultValue={me.ageRaw||''} key={`age-${me.memberId}`}
            onBlur={e=>setMe(p=>({...p,ageRaw:e.target.value}))} />
        </div>
      </div>

      {/* Gender */}
      <div style={{ marginBottom:12 }}>
        <SectionLabel>Gender</SectionLabel>
        <div style={{ display:'flex',gap:7 }}>
          {['Female','Male','Prefer not to say'].map(g=>(
            <button key={g} onClick={()=>setMe(p=>({...p,gender:g}))}
              style={{ flex:1,padding:'8px 4px',borderRadius:8,border:`1.5px solid ${me.gender===g?'var(--green)':'var(--border)'}`,background:me.gender===g?'var(--green-pale)':'var(--white)',color:me.gender===g?'var(--green)':'var(--text-mid)',fontSize:11,fontWeight:600,cursor:'pointer' }}>
              {g==='Female'?'👩 ':g==='Male'?'👨 ':'🧑 '}{g==='Prefer not to say'?'N/A':g}
            </button>
          ))}
        </div>
      </div>

      {/* Height + Weight */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12 }}>
        <div>
          <SectionLabel>Height (cm)</SectionLabel>
          <input className="inp no-ico" type="number" placeholder="165"
            defaultValue={me.height||''} key={`ht-${me.memberId}`}
            onBlur={e=>setMe(p=>({...p,height:e.target.value}))} />
        </div>
        <div>
          <SectionLabel>Weight (kg)</SectionLabel>
          <input className="inp no-ico" type="number" placeholder="65"
            defaultValue={me.weight||''} key={`wt-${me.memberId}`}
            onBlur={e=>setMe(p=>({...p,weight:e.target.value}))} />
        </div>
      </div>

      {/* Activity Level */}
      <div style={{ marginBottom:12 }}>
        <SectionLabel>Activity Level</SectionLabel>
        <select className="inp no-ico" value={me.activityLevel||''} onChange={e=>setMe(p=>({...p,activityLevel:e.target.value}))}>
          <option value="">Select activity level…</option>
          {activityLevels.map(a=>(
            <option key={a._id} value={a.activityLevel}>{a.displayName||a.activityLevel}</option>
          ))}
        </select>
      </div>

      {/* MET Range */}
      <div style={{ marginBottom:12 }}>
        <SectionLabel>MET Range</SectionLabel>
        <select className="inp no-ico" value={me.metRange||''} onChange={e=>setMe(p=>({...p,metRange:e.target.value}))}>
          <option value="">Select MET range…</option>
          {metRanges.map(r=>(
            <option key={r._id} value={r.name}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Lifestyle Code */}
      <div style={{ marginBottom:12 }}>
        <SectionLabel>Lifestyle</SectionLabel>
        <select className="inp no-ico" value={me.lifestyleCode||''} onChange={e=>setMe(p=>({...p,lifestyleCode:e.target.value}))}>
          <option value="">Select lifestyle…</option>
          {lifestyleCodes.map(l=>(
            <option key={l._id} value={l.lifestyleCode}>{l.lifestyleName}</option>
          ))}
        </select>
      </div>

      {/* Diet Type */}
      <div style={{ marginBottom:12 }}>
        <SectionLabel>Diet Type</SectionLabel>
        <div style={{ display:'flex',gap:7 }}>
          {[{v:'Vegetarian',e:'🌿'},{v:'Eggetarian',e:'🥚'},{v:'Non-Vegetarian',e:'🐟'}].map(d=>(
            <button key={d.v} onClick={()=>setMe(p=>({...p,dietType:d.v}))}
              style={{ flex:1,padding:'8px 4px',borderRadius:8,border:`1.5px solid ${me.dietType===d.v?'var(--green)':'var(--border)'}`,background:me.dietType===d.v?'var(--green-pale)':'var(--white)',color:me.dietType===d.v?'var(--green)':'var(--text-mid)',fontSize:10,fontWeight:600,cursor:'pointer',textAlign:'center' }}>
              <div style={{ fontSize:16,marginBottom:2 }}>{d.e}</div>
              {d.v==='Non-Vegetarian'?'Non-Veg':d.v}
              {me.dietType===d.v && <div style={{ fontSize:10 }}>✓</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Wellness Goals */}
      <div style={{ marginBottom:12 }}>
        <SectionLabel>Wellness Goals <span style={{ color:'var(--text-light)',fontWeight:400,fontSize:10 }}>(up to 3)</span></SectionLabel>
        <input className="inp no-ico" placeholder="Search goals…" value={goalSearch} onChange={e=>setGoalSearch(e.target.value)} style={{fontSize:12}}/>
        {goalSearch.trim() && (
          <div style={{border:'1.5px solid var(--border)',borderRadius:10,marginTop:4,background:'#fff',maxHeight:180,overflowY:'auto',boxShadow:'0 4px 12px rgba(0,0,0,0.08)'}}>
            {goalsList
              .filter(g=>g.name && g.name.toLowerCase().includes(goalSearch.toLowerCase()) && !(me.wellnessGoals||[]).includes(g.name))
              .map(g=>(
                <div key={g.name} onClick={()=>{toggleGoal(g.name);setGoalSearch('')}}
                  style={{padding:'9px 14px',fontSize:13,cursor:'pointer',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8}}
                  onMouseOver={e=>e.currentTarget.style.background='var(--green-pale)'}
                  onMouseOut={e=>e.currentTarget.style.background='#fff'}>
                  <span style={{fontWeight:700,color:'var(--green)'}}>+</span> {g.emoji} {g.name}
                </div>
              ))
            }
            {goalsList.filter(g=>g.name&&g.name.toLowerCase().includes(goalSearch.toLowerCase())&&!(me.wellnessGoals||[]).includes(g.name)).length===0&&(
              <div style={{padding:'10px 14px',fontSize:12,color:'var(--text-light)'}}>No matching goals</div>
            )}
          </div>
        )}
        {!goalSearch.trim()&&!(me.wellnessGoals||[]).length&&(
          <div style={{fontSize:11,color:'var(--text-light)',marginTop:5}}>Type to search and select (max 3)</div>
        )}
        {(me.wellnessGoals||[]).length>0&&(
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
            {(me.wellnessGoals||[]).map(g=>(
              <span key={g} onClick={()=>toggleGoal(g)}
                style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:20,
                  background:'var(--green)',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                {GOAL_EMOJI[g]||'🌿'} {g} ×
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Health Challenges */}
      <div style={{ marginBottom:12 }}>
        <SectionLabel>Health Challenges <span style={{ fontWeight:400,color:'var(--text-light)',fontSize:10 }}>(optional)</span></SectionLabel>
        <input className="inp no-ico" placeholder="Search challenges…" value={hcSearch} onChange={e=>setHcSearch(e.target.value)} style={{ marginBottom:8,fontSize:12 }} />
        <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
          {(me.healthConditions||[]).map(h=>(
            <button key={h} onClick={()=>toggleHC(h)}
              style={{ padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--green)',background:'var(--green-pale)',color:'var(--green)',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
              {h} <span style={{fontWeight:700}}>×</span>
            </button>
          ))}
          {hcSearch.trim() && hcList
            .filter(h => { const n=typeof h==='string'?h:(h||''); return n && n.toLowerCase().includes(hcSearch.toLowerCase())&&!(me.healthConditions||[]).includes(n) })
            .map(h => { const n=typeof h==='string'?h:h.name||''; return (
              <button key={n} onClick={()=>toggleHC(n)}
                style={{ padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--border)',background:'var(--white)',color:'var(--text-mid)',fontSize:12,cursor:'pointer' }}>
                + {n}
              </button>
            )})
          }
          {!hcSearch.trim() && !(me.healthConditions||[]).length && (
            <div style={{fontSize:12,color:'var(--text-light)'}}>Type above to search and add</div>
          )}
        </div>
      </div>

      {/* Food Restrictions */}
      <div style={{ marginBottom:12 }}>
        <SectionLabel>Food Restrictions <span style={{ fontWeight:400,color:'var(--text-light)',fontSize:10 }}>(items you avoid)</span></SectionLabel>
        <input className="inp no-ico" placeholder="Search foods to restrict…" value={frQ} onChange={e=>setFrQ(e.target.value)} style={{fontSize:12}}/>
        {frQ.trim() && (
          <div style={{border:'1.5px solid var(--border)',borderRadius:10,marginTop:4,background:'#fff',maxHeight:160,overflowY:'auto'}}>
            {productList
              .filter(p=>p.name && p.name.toLowerCase().includes(frQ.toLowerCase()) && !(me.foodRestrictions||[]).includes(p.name))
              .slice(0,15)
              .map(p=>(
                <div key={p._id} onClick={()=>{setMe(prev=>({...prev,foodRestrictions:[...(prev.foodRestrictions||[]),p.name]}));setFrQ('')}}
                  style={{padding:'9px 14px',fontSize:13,cursor:'pointer',borderBottom:'1px solid var(--border)',display:'flex',gap:8,alignItems:'center'}}
                  onMouseOver={e=>e.currentTarget.style.background='var(--green-pale)'}
                  onMouseOut={e=>e.currentTarget.style.background='#fff'}>
                  <span style={{fontSize:10,color:'var(--text-light)',minWidth:80}}>{p.category}</span>
                  <span style={{fontWeight:600}}>+ {p.name}</span>
                </div>
              ))
            }
          </div>
        )}
        {(me.foodRestrictions||[]).length>0 && (
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
            {(me.foodRestrictions||[]).map(fr=>(
              <span key={fr} onClick={()=>setMe(p=>({...p,foodRestrictions:(p.foodRestrictions||[]).filter(x=>x!==fr)}))}
                style={{display:'inline-flex',alignItems:'center',gap:4,padding:'5px 11px',borderRadius:20,
                  background:'#FFF0F0',border:'1.5px solid var(--red)',color:'var(--red)',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                {fr} ×
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Allergies */}
      <div style={{ marginBottom:12 }}>
        <SectionLabel>Allergies</SectionLabel>
        <input className="inp no-ico" placeholder="Search allergies…" value={algQ} onChange={e=>setAlgQ(e.target.value)} style={{fontSize:12}}/>
        {algQ.trim() && (
          <div style={{border:'1.5px solid var(--border)',borderRadius:10,marginTop:4,background:'#fff',maxHeight:140,overflowY:'auto'}}>
            {allergyList
              .filter(a=>a.name && a.name.toLowerCase().includes(algQ.toLowerCase()) && !(me.allergies||[]).includes(a.name))
              .map(a=>(
                <div key={a._id} onClick={()=>{setMe(p=>({...p,allergies:[...(p.allergies||[]),a.name]}));setAlgQ('')}}
                  style={{padding:'9px 14px',fontSize:13,cursor:'pointer',borderBottom:'1px solid var(--border)'}}
                  onMouseOver={e=>e.currentTarget.style.background='var(--green-pale)'}
                  onMouseOut={e=>e.currentTarget.style.background='#fff'}>
                  + {a.name}
                </div>
              ))
            }
          </div>
        )}
        {(me.allergies||[]).length>0&&(
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
            {(me.allergies||[]).map(a=>(
              <button key={a} onClick={()=>toggleAllergy(a)}
                style={{padding:'5px 12px',borderRadius:20,border:'1.5px solid #E65100',background:'#FFF3E0',color:'#E65100',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                ⚠ {a} <span style={{fontWeight:700}}>×</span>
              </button>
            ))}
          </div>
        )}
        <div style={{marginTop:8}}>
          <div style={{fontSize:11,color:'var(--text-light)',marginBottom:4}}>Other Allergies (not in list — comma separated)</div>
          <input className="inp no-ico" placeholder="e.g. Mango latex, Specific spice…"
            defaultValue={me.customAllergies||''} key={`ca-${me.memberId}`}
            onBlur={e=>setMe(p=>({...p,customAllergies:e.target.value}))}
            style={{fontSize:12}}/>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
        <button className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="btn btn-primary" onClick={onSave} disabled={saving}>
          {saving?<span className="spin"/>:isNew?'Add Member ✓':'Save Changes ✓'}
        </button>
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════════════════
   Profile — main page component
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Profile() {
  const { family, updateFamily, logout } = useAuth()
  const nav = useNavigate()

  const [f,          setF]          = useState(null)
  const [apiGoals,   setApiGoals]   = useState([])
  const [apiHC,         setApiHC]         = useState([])
  const [allergyList,   setAllergyList]   = useState([])
  const [activityLevels,setActivityLevels]= useState([])
  const [metRanges,     setMetRanges]     = useState([])
  const [lifestyleCodes,setLifestyleCodes]= useState([])
  const [productList,   setProductList]   = useState([])
  const [cities,     setCities]     = useState([])
  const [apartments, setApartments] = useState([])
  const [aptLoading, setAptLoading] = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)

  const [editSection, setEditSection] = useState(null)
  const [fe, setFe] = useState({})
  const [me, setMe] = useState({})

  const load = async () => {
    if (!family?._id) return
    setLoading(true)
    api.getGoals().then(d => setApiGoals(d.goals||[])).catch(()=>{})
    api.getHealthConditions().then(d => setApiHC(d.conditions||[])).catch(()=>{})
    api.getAllergies().then(d => setAllergyList(d.allergies||[])).catch(()=>{})
    api.getActivityLevels().then(d => setActivityLevels(d.activityLevels||[])).catch(()=>{})
    api.getMetRanges().then(d => setMetRanges(d.metRanges||[])).catch(()=>{})
    api.getLifestyleCodes().then(d => setLifestyleCodes(d.lifestyleCodes||[])).catch(()=>{})
    api.getProducts({limit:500}).then(d => setProductList(d.products||[])).catch(()=>{})
    api.getCities().then(d => { if(d.cities?.length) setCities(d.cities) }).catch(()=>{})
    try {
      const d = await api.getFamily(family._id)
      const fresh = d.family
      setF(fresh)
      updateFamily(fresh)
    } catch {
      setF(family)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [family?._id])

  const loadApartments = (city) => {
    if (!city) return
    setAptLoading(true)
    api.getApartments(city)
      .then(d => setApartments(d.apartments || []))
      .catch(() => setApartments([]))
      .finally(() => setAptLoading(false))
  }

  const goalsList = apiGoals.length
    ? apiGoals
        .map(g => ({ name: g.displayName||g.goalName||g.name||'', emoji: GOAL_EMOJI[g.displayName||g.goalName||g.name]||'🌿', desc: g.goalDescription||g.description||'' }))
        .filter(g => g.name)
    : Object.keys(GOAL_EMOJI).map(name => ({ name, emoji: GOAL_EMOJI[name], desc: '' }))

  const hcList = apiHC.length ? apiHC.map(c=>c.conditionName||c.name) : HC_FALLBACK

  const startEditFamily = () => {
    const savedCity = f?.city || (cities[0] || '')
    const savedDeliveryType = f?.deliveryType || (f?.apartmentId ? 'gated' : 'individual')
    setFe({
      familyName:           f?.familyName || '',
      email:                f?.email || '',
      city:                 savedCity,
      deliveryType:         savedDeliveryType,
      apartmentId:          f?.apartmentId || '',
      apartmentName:        f?.apartmentName || '',
      towerNo:              f?.towerNo || '',
      flatNo:               f?.flatNo || '',
      landmark:             f?.landmark || '',
      pincode:              f?.pincode || '',
      dietPreference:       f?.dietPreference || 'Vegetarian',
      deliveryPreference:   f?.deliveryPreference || 'Morning',
      deliveryInstructions: f?.deliveryInstructions || '',
    })
    if (savedCity) loadApartments(savedCity)
    setEditSection('family')
  }

  const saveFamily = async () => {
    if (!fe.familyName?.trim()) return showToast('Family name is required','error')
    if (!fe.city) return showToast('Please select a city','error')
    setSaving(true)
    try {
      const addressStr = [
        fe.apartmentName,
        fe.flatNo && `Flat ${fe.flatNo}`,
        fe.towerNo && `Tower ${fe.towerNo}`,
        fe.landmark,
      ].filter(Boolean).join(', ')

      const r = await api.updateFamily(f._id, {
        familyName:           fe.familyName,
        email:                fe.email,
        city:                 fe.city,
        deliveryType:         fe.deliveryType,
        address:              addressStr || fe.apartmentName || '',
        apartmentId:          fe.apartmentId || null,
        apartmentName:        fe.apartmentName,
        flatNo:               fe.flatNo,
        towerNo:              fe.towerNo,
        landmark:             fe.landmark,
        pincode:              fe.pincode,
        dietPreference:       fe.dietPreference,
        deliveryPreference:   fe.deliveryPreference,
        deliveryInstructions: fe.deliveryInstructions,
      })
      const fresh = r.family || f
      setF(fresh); updateFamily(fresh)
      setEditSection(null)
      showToast('Profile updated ✓','success')
    } catch(e) { showToast(e.message||'Save failed','error') }
    finally { setSaving(false) }
  }

  const startEditMember = (m) => {
    setMe({
      memberId:            m.memberId,
      name:                m.name || '',
      relationship:        m.relationship || 'Self',
      dob:                 m.dob ? (m.dob.includes('T') ? m.dob.split('T')[0] : m.dob) : '',
      ageRaw:              ageFromDob(m.dob) ? String(ageFromDob(m.dob)) : (m.age ? String(m.age) : ''),
      gender:              m.gender || 'Female',
      height:              m.height ? String(m.height) : '',
      weight:              m.weight ? String(m.weight) : '',
      activityLevel:    m.activityLevel   || '',
      metRange:         m.metRange        || '',
      lifestyleCode:    m.lifestyleCode   || '',
      dietType:         m.dietType        || 'Vegetarian',
      wellnessGoals:    [...(m.wellnessGoals    || [])],
      healthConditions: [...(m.healthConditions || m.healthChallenges || [])],
      foodRestrictions: [...(m.foodRestrictions || [])],
      allergies:        [...(m.allergies        || m.dietaryRestrictions || [])],
      customAllergies:  Array.isArray(m.customAllergies) ? m.customAllergies.join(', ') : (m.customAllergies||''),
      likedVegetables:   [...(m.likedVegetables   || [])],
      dislikedVegetables:[...(m.dislikedVegetables || m.dislikedVeg || [])],
      likedFruits:       [...(m.likedFruits       || [])],
      dislikedFruits:    [...(m.dislikedFruits    || m.dislikedFruit || [])],
      preferredPlan:    m.preferredPlan   || '',
    })
    setEditSection(m.memberId)
  }

  const startAddMember = () => {
    setMe({
      memberId:            'new',
      name:                '',
      relationship:        'Self',
      dob:                 '',
      ageRaw:              '',
      gender:              'Female',
      height:              '',
      weight:              '',
      activityLevel:    '',
      metRange:         '',
      lifestyleCode:    '',
      dietType:         'Vegetarian',
      wellnessGoals:    [],
      healthConditions: [],
      foodRestrictions: [],
      allergies:        [],
      customAllergies:  '',
      likedVegetables:   [],
      dislikedVegetables:[],
      likedFruits:       [],
      dislikedFruits:    [],
      preferredPlan:    '',
    })
    setEditSection('new')
  }

  const saveMember = async () => {
    if (!me.name?.trim()) return showToast('Name is required','error')
    setSaving(true)
    try {
      const payload = {
        name:                me.name,
        relationship:        me.relationship,
        dob:                 me.dob || null,
        age:                 me.ageRaw ? parseInt(me.ageRaw) : null,
        gender:              me.gender,
        height:              me.height ? parseFloat(me.height) : null,
        weight:              me.weight ? parseFloat(me.weight) : null,
        activityLevel:    me.activityLevel,
        metRange:         me.metRange,
        lifestyleCode:    me.lifestyleCode,
        dietType:         me.dietType,
        wellnessGoals:    me.wellnessGoals,
        healthConditions: me.healthConditions,
        foodRestrictions: me.foodRestrictions,
        allergies:        me.allergies,
        customAllergies:  (me.customAllergies||'').split(',').map(s=>s.trim()).filter(Boolean),
        likedVegetables:   me.likedVegetables   || [],
        dislikedVegetables:me.dislikedVegetables || [],
        likedFruits:       me.likedFruits       || [],
        dislikedFruits:    me.dislikedFruits    || [],
        preferredPlan:    me.preferredPlan || null,
      }
      if (me.memberId === 'new') {
        await api.addMember(f._id, payload)
      } else {
        await api.updateMember(f._id, me.memberId, payload)
      }
      const d = await api.getFamily(f._id)
      const fresh = d.family
      setF(fresh); updateFamily(fresh)
      setEditSection(null)
      showToast(me.memberId==='new'?'Member added ✓':'Member updated ✓','success')
    } catch(e) { showToast(e.message||'Save failed','error') }
    finally { setSaving(false) }
  }

  const deleteMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from your family?`)) return
    try {
      await api.deleteMember(f._id, memberId)
      const d = await api.getFamily(f._id)
      setF(d.family); updateFamily(d.family)
      showToast(`${memberName} removed`,'success')
      if (editSection === memberId) setEditSection(null)
    } catch(e) { showToast(e.message||'Remove failed','error') }
  }

  const handleLogout = () => {
    if (window.confirm('Log out of Krisha Pure?')) { logout(); nav('/login',{replace:true}) }
  }

  if (loading) return (
    <div style={{ minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:14,background:'var(--cream)' }}>
      <div className="spinner" /><p style={{ color:'var(--text-light)',fontSize:13 }}>Loading profile…</p>
    </div>
  )

  const fData   = f || family
  const members = fData?.members || []

  return (
    <div className="page-shell fade-in">
      {/* ── Green header ── */}
      <div style={{ background:'linear-gradient(135deg,#1A3D20 0%,#2D6A35 100%)',padding:'20px 20px 24px',textAlign:'center',flexShrink:0 }}>
        <img src={logo} alt="KP" style={{ width:48,height:48,borderRadius:13,objectFit:'contain',marginBottom:8 }} />
        <div style={{ color:'#fff',fontFamily:'var(--font-serif)',fontSize:19,fontWeight:700 }}>
          {(fData?.familyName && !fData.familyName.startsWith('Family-')) ? fData.familyName : 'Your Family'}
        </div>
        <div style={{ color:'rgba(255,255,255,0.7)',fontSize:12,marginTop:3 }}>+91 {fData?.phone}</div>
        {fData?.city && <div style={{ color:'rgba(255,255,255,0.55)',fontSize:11,marginTop:2 }}>📍 {fData.city}</div>}
      </div>

      <div className="page-shell-scroll with-nav" style={{ padding:'14px 16px' }}>

        {/* ══════ FAMILY / ADDRESS SECTION ══════ */}
        {editSection==='family' ? (
          <div style={{ background:'var(--green-light)',borderRadius:14,border:'1.5px solid var(--green)',padding:'16px',marginBottom:12 }}>
            <div style={{ fontSize:14,fontWeight:700,color:'var(--green)',marginBottom:14 }}>✏️ Edit Profile & Address</div>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>

              {/* Family Name */}
              <div>
                <SectionLabel>Family Name *</SectionLabel>
                <input className="inp no-ico" defaultValue={fe.familyName||''} key="fe-familyName"
                  onBlur={e=>setFe(p=>({...p,familyName:e.target.value}))} />
              </div>

              {/* Email */}
              <div>
                <SectionLabel>Email</SectionLabel>
                <input className="inp no-ico" type="email" placeholder="e.g. priya@gmail.com"
                  defaultValue={fe.email||''} key="fe-email"
                  onBlur={e=>setFe(p=>({...p,email:e.target.value}))} />
              </div>

              {/* City */}
              <div>
                <SectionLabel>City</SectionLabel>
                <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                  {cities.map(c=>(
                    <button key={c} onClick={()=>{setFe(p=>({...p,city:c,apartmentId:'',apartmentName:''})); loadApartments(c)}} type="button"
                      style={{ flex:1,minWidth:100,padding:'12px',borderRadius:12,border:`2px solid ${fe.city===c?'var(--green)':'var(--border)'}`,background:fe.city===c?'var(--green)':'var(--white)',color:fe.city===c?'#fff':'var(--text-mid)',fontWeight:700,fontSize:14,cursor:'pointer',transition:'all 0.15s' }}>
                      {fe.city===c&&'✓ '}{c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Type */}
              <div>
                <SectionLabel>Delivery Location Type</SectionLabel>
                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {[
                    {id:'individual',emoji:'🏠',title:'Individual Home',     sub:'Deliver to your home or apartment'},
                    {id:'gated',     emoji:'🏢',title:'Gated Community / Wellness Partner',sub:'Deliver to your community or partner'},
                  ].map(o=>(
                    <div key={o.id}
                      onClick={()=>{setFe(p=>({...p,deliveryType:o.id})); if(o.id==='gated'&&fe.city) loadApartments(fe.city)}}
                      style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,border:`2px solid ${fe.deliveryType===o.id?'var(--green)':'var(--border)'}`,background:fe.deliveryType===o.id?'var(--green-pale)':'var(--white)',cursor:'pointer',transition:'all 0.15s' }}>
                      <span style={{ fontSize:22 }}>{o.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13,fontWeight:700,color:fe.deliveryType===o.id?'var(--green)':'var(--text)' }}>{o.title}</div>
                        <div style={{ fontSize:11,color:'var(--text-light)' }}>{o.sub}</div>
                      </div>
                      <div style={{ width:18,height:18,borderRadius:'50%',border:`2px solid ${fe.deliveryType===o.id?'var(--green)':'var(--border)'}`,background:fe.deliveryType===o.id?'var(--green)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                        {fe.deliveryType===o.id && <span style={{ color:'#fff',fontSize:10,fontWeight:700 }}>✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Apartment picker */}
              {fe.deliveryType==='gated' ? (
                <div>
                  <SectionLabel>Select Apartment / Community</SectionLabel>
                  {aptLoading ? (
                    <div style={{ padding:'12px',textAlign:'center',color:'var(--text-light)',fontSize:13 }}>Loading apartments…</div>
                  ) : apartments.length > 0 ? (
                    <div style={{ display:'flex',flexDirection:'column',gap:8,maxHeight:220,overflowY:'auto' }}>
                      {apartments.map(apt => {
                        const aid   = apt._id?.toString() || apt.apartmentId
                        const aname = apt.apartmentName || apt.name
                        const sel   = (fe.apartmentId && (fe.apartmentId === aid || fe.apartmentId === String(apt.apartmentId)))
                                   || (fe.apartmentName && fe.apartmentName === aname)
                        return (
                          <div key={aid}
                            onClick={()=>setFe(p=>({
                              ...p,
                              apartmentId:   aid,
                              apartmentName: aname,
                              ...(apt.landmark && !p.landmark ? { landmark: apt.landmark } : {}),
                              ...(apt.pincode  && !p.pincode  ? { pincode:  apt.pincode  } : {}),
                            }))}
                            style={{ padding:'12px 14px',borderRadius:12,border:`2px solid ${sel?'var(--green)':'var(--border)'}`,background:sel?'var(--green-pale)':'var(--white)',cursor:'pointer',transition:'all 0.15s',display:'flex',alignItems:'center',gap:10 }}>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:13,fontWeight:700,color:sel?'var(--green)':'var(--text)' }}>{aname}</div>
                              {apt.address && <div style={{ fontSize:11,color:'var(--text-light)',marginTop:1 }}>{apt.address}</div>}
                              {(apt.city||apt.pincode) && (
                                <div style={{ fontSize:11,color:'var(--text-light)',marginTop:1 }}>
                                  {[apt.city, apt.pincode].filter(Boolean).join(' · ')}
                                </div>
                              )}
                            </div>
                            {sel && <span style={{ color:'var(--green)',fontSize:18,fontWeight:700 }}>✓</span>}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize:12,color:'var(--text-light)',marginBottom:8 }}>
                        No registered apartments for {fe.city||'this city'}. Enter manually:
                      </div>
                      <input className="inp no-ico" placeholder="e.g. Green Meadows Apartments"
                        defaultValue={fe.apartmentName||''} key="fe-aptName-manual"
                        onBlur={e=>setFe(p=>({...p,apartmentName:e.target.value,apartmentId:''}))} />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <SectionLabel>Apartment / Building</SectionLabel>
                  <input className="inp no-ico" placeholder="e.g. Green Meadows Apartments"
                    defaultValue={fe.apartmentName||''} key="fe-aptName"
                    onBlur={e=>setFe(p=>({...p,apartmentName:e.target.value}))} />
                </div>
              )}

              {/* Tower + Flat */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
                <div>
                  <SectionLabel>Tower / Block</SectionLabel>
                  <input className="inp no-ico" placeholder="Block A"
                    defaultValue={fe.towerNo||''} key="fe-tower"
                    onBlur={e=>setFe(p=>({...p,towerNo:e.target.value}))} />
                </div>
                <div>
                  <SectionLabel>Flat / House No.</SectionLabel>
                  <input className="inp no-ico" placeholder="B-101"
                    defaultValue={fe.flatNo||''} key="fe-flat"
                    onBlur={e=>setFe(p=>({...p,flatNo:e.target.value}))} />
                </div>
              </div>

              {/* Landmark */}
              <div>
                <SectionLabel>Landmark</SectionLabel>
                <input className="inp no-ico" placeholder="Near Lotus Cafe"
                  defaultValue={fe.landmark||''} key="fe-landmark"
                  onBlur={e=>setFe(p=>({...p,landmark:e.target.value}))} />
              </div>

              {/* Pincode */}
              <div>
                <SectionLabel>Pincode</SectionLabel>
                <input className="inp no-ico" placeholder="641001" maxLength={6}
                  defaultValue={fe.pincode||''} key="fe-pincode"
                  onBlur={e=>setFe(p=>({...p,pincode:e.target.value.replace(/\D/g,'')}))} />
              </div>

              {/* Diet Preference */}
              <div>
                <SectionLabel>Diet Preference</SectionLabel>
                <div style={{ display:'flex',gap:8 }}>
                  {[{v:'Vegetarian',e:'🌿'},{v:'Eggetarian',e:'🥚'},{v:'Non-Vegetarian',e:'🐟'}].map(d=>(
                    <button key={d.v} onClick={()=>setFe(p=>({...p,dietPreference:d.v}))} type="button"
                      style={{ flex:1,padding:'10px 4px',borderRadius:10,border:`2px solid ${fe.dietPreference===d.v?'var(--green)':'var(--border)'}`,background:fe.dietPreference===d.v?'var(--green-pale)':'var(--white)',color:fe.dietPreference===d.v?'var(--green)':'var(--text-mid)',fontWeight:700,fontSize:11,cursor:'pointer',transition:'all 0.15s',display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
                      <span style={{ fontSize:18 }}>{d.e}</span>
                      <span>{d.v==='Non-Vegetarian'?'Non-Veg':d.v}</span>
                      {fe.dietPreference===d.v && <span style={{ fontSize:12 }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Delivery Time */}
              <div>
                <SectionLabel>Preferred Delivery Time</SectionLabel>
                <div style={{ display:'flex',gap:8 }}>
                  {[{v:'Morning',e:'🌅',t:'7–11 AM'},{v:'Afternoon',e:'☀️',t:'12–5 PM'},{v:'Evening',e:'🌙',t:'5–9 PM'}].map(s=>(
                    <button key={s.v} onClick={()=>setFe(p=>({...p,deliveryPreference:s.v}))} type="button"
                      style={{ flex:1,padding:'10px 4px',borderRadius:10,border:`2px solid ${fe.deliveryPreference===s.v?'var(--green)':'var(--border)'}`,background:fe.deliveryPreference===s.v?'var(--green-pale)':'var(--white)',color:fe.deliveryPreference===s.v?'var(--green)':'var(--text-mid)',fontWeight:700,fontSize:11,cursor:'pointer',transition:'all 0.15s',display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
                      <span style={{ fontSize:18 }}>{s.e}</span>
                      <span>{s.v}</span>
                      <span style={{ fontSize:9,fontWeight:400,color:fe.deliveryPreference===s.v?'var(--green)':'var(--text-light)' }}>{s.t}</span>
                      {fe.deliveryPreference===s.v && <span style={{ fontSize:11 }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Instructions */}
              <div>
                <SectionLabel>Delivery Instructions <span style={{ fontWeight:400,fontSize:10 }}>(Optional)</span></SectionLabel>
                <textarea className="ta" rows={3} maxLength={120} placeholder="e.g. Leave at doorstep, call before delivery…"
                  defaultValue={fe.deliveryInstructions||''} key="fe-instructions"
                  onBlur={e=>setFe(p=>({...p,deliveryInstructions:e.target.value}))} />
              </div>
            </div>

            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:14 }}>
              <button className="btn btn-outline" onClick={()=>setEditSection(null)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={saveFamily} disabled={saving}>
                {saving?<span className="spin"/>:'Save Changes ✓'}
              </button>
            </div>
          </div>
        ) : (
          <SCard>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
              <div style={{ fontSize:14,fontWeight:700 }}>Profile & Address</div>
              <button onClick={startEditFamily} style={{ background:'none',border:'none',color:'var(--green)',fontSize:13,fontWeight:600,cursor:'pointer' }}>Edit ✏</button>
            </div>
            <InfoRow label="Family Name"        value={fData?.familyName} />
            <InfoRow label="Email"              value={fData?.email} />
            <InfoRow label="Diet"               value={fData?.dietPreference} />
            <InfoRow label="Delivery Type"      value={fData?.deliveryType === 'gated' ? '🏢 Gated Community' : fData?.deliveryType ? '🏠 Individual Home' : null} />
            <InfoRow label="Delivery Time"      value={fData?.deliveryPreference} />
            <InfoRow label="Delivery Instructions" value={fData?.deliveryInstructions} />
            {(fData?.apartmentName||fData?.flatNo) && (
              <InfoRow label="Apartment" value={[fData.apartmentName, fData.towerNo&&`Tower ${fData.towerNo}`, fData.flatNo&&`Flat ${fData.flatNo}`].filter(Boolean).join(', ')} />
            )}
            <InfoRow label="Landmark"   value={fData?.landmark} />
            <InfoRow label="Pincode"    value={fData?.pincode} />
            <InfoRow label="City"       value={fData?.city} />
          </SCard>
        )}

        {/* ══════ FAMILY MEMBERS ══════ */}
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
          <div style={{ fontSize:15,fontWeight:700 }}>Family Members ({members.length})</div>
          <button onClick={startAddMember} style={{ background:'var(--green)',color:'#fff',border:'none',padding:'7px 14px',borderRadius:20,fontSize:12,fontWeight:700,cursor:'pointer' }}>
            + Add Member
          </button>
        </div>

        {/* New member editor */}
        {editSection==='new' && (
          <MemberEditor
            key="new-member"
            isNew={true}
            me={me} setMe={setMe}
            saving={saving}
            onSave={saveMember}
            onCancel={()=>setEditSection(null)}
            goalsList={goalsList}
            hcList={hcList}
            allergyList={allergyList}
            productList={productList}
            activityLevels={activityLevels}
            metRanges={metRanges}
            lifestyleCodes={lifestyleCodes}
          />
        )}

        {members.length===0 && editSection!=='new' ? (
          <SCard style={{ textAlign:'center',padding:'28px' }}>
            <div style={{ fontSize:36,marginBottom:8 }}>👤</div>
            <p style={{ fontSize:13,color:'var(--text-light)',marginBottom:12 }}>No members added yet</p>
            <button className="btn btn-primary" onClick={startAddMember} style={{ width:'auto',padding:'10px 22px',fontSize:13 }}>Add First Member</button>
          </SCard>
        ) : (
          members.map((m,i) => {
            const isEditing = editSection === m.memberId
            return (
              <div key={m.memberId}>
                {isEditing ? (
                  <MemberEditor
                    key={`edit-${m.memberId}`}
                    isNew={false}
                    me={me} setMe={setMe}
                    saving={saving}
                    onSave={saveMember}
                    onCancel={()=>setEditSection(null)}
                    goalsList={goalsList}
                    hcList={hcList}
                    allergyList={allergyList}
                    productList={productList}
                    activityLevels={activityLevels}
                    metRanges={metRanges}
                    lifestyleCodes={lifestyleCodes}
                  />
                ) : (
                  <SCard>
                    <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:10 }}>
                      <div className="avatar" style={{ width:42,height:42,borderRadius:'50%',background:acolor(i),fontSize:14 }}>
                        {initials(m.name)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700,fontSize:14 }}>{m.name}</div>
                        <div style={{ fontSize:12,color:'var(--text-light)',marginTop:1 }}>
                          {[m.relationship, (ageFromDob(m.dob)||m.age)&&`${ageFromDob(m.dob)||m.age} yrs`, m.gender].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <button onClick={()=>startEditMember(m)} style={{ padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--green)',color:'var(--green)',background:'var(--green-pale)',fontSize:11,fontWeight:700,cursor:'pointer' }}>Edit</button>
                      <button onClick={()=>deleteMember(m.memberId,m.name)} style={{ padding:'5px 10px',borderRadius:20,border:'1.5px solid #FFCDD2',color:'var(--red)',background:'#FFF0F0',fontSize:11,fontWeight:700,cursor:'pointer' }}>Remove</button>
                    </div>

                    {(m.height||m.weight||m.activityLevel) && (
                      <div style={{ display:'flex',gap:12,marginBottom:10,padding:'8px 10px',background:'#FAFAFA',borderRadius:8 }}>
                        {m.height && <div style={{ textAlign:'center' }}><div style={{ fontSize:10,color:'var(--text-light)' }}>Height</div><div style={{ fontSize:12,fontWeight:700 }}>{m.height} cm</div></div>}
                        {m.weight && <div style={{ textAlign:'center' }}><div style={{ fontSize:10,color:'var(--text-light)' }}>Weight</div><div style={{ fontSize:12,fontWeight:700 }}>{m.weight} kg</div></div>}
                        {m.activityLevel && <div style={{ textAlign:'center' }}><div style={{ fontSize:10,color:'var(--text-light)' }}>Activity</div><div style={{ fontSize:12,fontWeight:700 }}>{m.activityLevel}</div></div>}
                        {m.dietType && <div style={{ textAlign:'center' }}><div style={{ fontSize:10,color:'var(--text-light)' }}>Diet</div><div style={{ fontSize:12,fontWeight:700 }}>{m.dietType}</div></div>}
                        {m.metRange && <div style={{ textAlign:'center' }}><div style={{ fontSize:10,color:'var(--text-light)' }}>MET</div><div style={{ fontSize:12,fontWeight:700 }}>{m.metRange}</div></div>}
                        {m.lifestyleCode && <div style={{ textAlign:'center' }}><div style={{ fontSize:10,color:'var(--text-light)' }}>Lifestyle</div><div style={{ fontSize:12,fontWeight:700 }}>{m.lifestyleCode}</div></div>}
                      </div>
                    )}

                    {m.wellnessGoals?.length>0 && (
                      <div style={{ marginBottom:8 }}>
                        <div style={{ fontSize:10,fontWeight:700,color:'var(--text-light)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:5 }}>Wellness Goals</div>
                        <div style={{ display:'flex',flexWrap:'wrap' }}>
                          {m.wellnessGoals.map(g=><Tag key={g} label={g} icon={GOAL_EMOJI[g]||'🌿'} />)}
                        </div>
                      </div>
                    )}

                    {(m.healthConditions||m.healthChallenges||[]).length>0 && (
                      <div style={{ marginBottom:8 }}>
                        <div style={{ fontSize:10,fontWeight:700,color:'var(--text-light)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:5 }}>Health Conditions</div>
                        <div style={{ display:'flex',flexWrap:'wrap' }}>
                          {(m.healthConditions||m.healthChallenges||[]).map(h=><Tag key={h} label={h} icon="💊" />)}
                        </div>
                      </div>
                    )}
                    {(m.foodRestrictions||[]).length>0 && (
                      <div style={{ marginBottom:8 }}>
                        <div style={{ fontSize:10,fontWeight:700,color:'var(--text-light)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:5 }}>Food Restrictions</div>
                        <div style={{ display:'flex',flexWrap:'wrap' }}>
                          {(m.foodRestrictions||[]).map(r=><Tag key={r} label={r} icon="🚫" />)}
                        </div>
                      </div>
                    )}
                    {(m.allergies||[]).length>0 && (
                      <div style={{ marginBottom:8 }}>
                        <div style={{ fontSize:10,fontWeight:700,color:'var(--text-light)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:5 }}>Allergies</div>
                        <div style={{ display:'flex',flexWrap:'wrap' }}>
                          {(m.allergies||[]).map(a=><Tag key={a} label={a} icon="⚠️" />)}
                        </div>
                      </div>
                    )}
                  </SCard>
                )}
              </div>
            )
          })
        )}

        {/* ══════ QUICK LINKS ══════ */}
        <div style={{ display:'flex',flexDirection:'column',gap:8,marginTop:4 }}>
          {[['🎯','Manage Wellness Goals',()=>nav('/goals')],['📦','My Orders',()=>nav('/orders')],['🧺','Browse Baskets',()=>nav('/recommend')]].map(([ic,lb,fn])=>(
            <div key={lb} onClick={fn} style={{ background:'var(--white)',borderRadius:12,padding:'13px 16px',display:'flex',alignItems:'center',gap:12,cursor:'pointer',border:'1px solid var(--border)' }}>
              <span style={{ fontSize:20 }}>{ic}</span>
              <span style={{ fontWeight:600,fontSize:13,flex:1 }}>{lb}</span>
              <span style={{ color:'var(--text-light)',fontSize:18 }}>›</span>
            </div>
          ))}
        </div>

        <button onClick={handleLogout} style={{ width:'100%',marginTop:14,padding:'13px',borderRadius:12,border:'1.5px solid #FFCDD2',background:'#FFF5F5',color:'var(--red)',fontSize:14,fontWeight:700,cursor:'pointer' }}>
          Log Out
        </button>
        <div style={{ height:8 }} />
      </div>

      <BottomNav />
    </div>
  )
}
