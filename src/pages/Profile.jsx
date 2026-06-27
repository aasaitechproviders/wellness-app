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

// Emoji map for known goal names (enrichment only — goals come from DB)
const GOAL_EMOJI = {
  'Immunity Support':'🛡️','Protein Support':'💪','Iron Support':'💧',
  'Weight Management':'⚖️','Diabetes Friendly':'🩺','Diabetes Control':'🩺',
  'Heart Wellness':'❤️','Digestive Wellness':'🌀','Bone Health':'🦴',
  "Women's Wellness":'🌸','Kids Nutrition':'😊','Senior Wellness':'👴',
  'Detox':'✨','General Wellness':'🌿','Other Goal':'🌿',
}

const RELS     = ['Self','Spouse','Child','Parent','Grandparent','Other']
const ACTIVITY = [
  {id:'sedentary',label:'Sedentary',     emoji:'🪑'},
  {id:'light',    label:'Lightly Active',emoji:'🚶'},
  {id:'moderate', label:'Moderately Active',emoji:'🏃'},
  {id:'high',     label:'Highly Active', emoji:'🏋️'},
]

const HC_FALLBACK = ['Blood Sugar','Blood Pressure','Thyroid','PCOS','Cholesterol','Anaemia','Arthritis','Kidney Issues','Digestive Issues','Liver Issues']

const VEGETABLES_LIST = [
  'Tomato','Onion','Potato','Carrot','Cabbage','Cauliflower','Broccoli','Spinach',
  'Bitter Gourd','Bottle Gourd','Ridge Gourd','Snake Gourd','Drumstick','Lady Finger',
  'Brinjal','Beetroot','Radish','Turnip','Sweet Potato','Yam','Pumpkin','Ash Gourd',
  'Ivy Gourd','Cluster Beans','French Beans','Green Peas','Corn','Mushroom','Capsicum',
  'Cucumber','Raw Banana','Methi','Coriander','Mint','Drumstick Leaves','Colocasia',
]

const FRUITS_LIST = [
  'Mango','Banana','Apple','Orange','Grapes','Papaya','Guava','Pineapple','Watermelon',
  'Muskmelon','Pomegranate','Sapota','Jackfruit','Coconut','Litchi','Plum','Pear',
  'Strawberry','Kiwi','Avocado','Lemon','Sweet Lime','Gooseberry','Fig','Date',
  'Custard Apple','Dragon Fruit','Raw Mango',
]

const InfoRow = ({ label, value }) => value ? (
  <div style={{ marginBottom:8 }}>
    <div style={{ fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:'uppercase',color:'var(--text-light)' }}>{label}</div>
    <div style={{ fontSize:13,color:'var(--text)',marginTop:1 }}>{value}</div>
  </div>
) : null

const Tag = ({ label, icon }) => (
  <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:50,background:'var(--green-pale)',color:'var(--green)',fontSize:11,fontWeight:600,marginRight:5,marginBottom:5 }}>
    {icon} {label}
  </span>
)

const SCard = ({ children, style }) => (
  <div style={{ background:'var(--white)',borderRadius:14,border:'1px solid var(--border)',padding:'14px 16px',marginBottom:12,...style }}>
    {children}
  </div>
)

export default function Profile() {
  const { family, updateFamily, logout } = useAuth()
  const nav = useNavigate()

  const [f,          setF]          = useState(null)
  const [apiGoals,   setApiGoals]   = useState([])   // from DB
  const [apiHC,      setApiHC]      = useState([])   // from DB
  const [apiPrefs,   setApiPrefs]   = useState({taste:[],cooking:[],allergy:[]}) // from DB
  const [cities,     setCities]     = useState([])   // from DB
  const [apartments, setApartments] = useState([])   // from DB
  const [aptLoading, setAptLoading] = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)

  const [editSection, setEditSection] = useState(null) // 'family' | memberId | 'new'
  const [fe, setFe] = useState({})   // family edit state
  const [me, setMe] = useState({})   // member edit state

  const [goalSearch, setGoalSearch] = useState('')
  const [hcSearch,   setHcSearch]   = useState('')

  const load = async () => {
    if (!family?._id) return
    setLoading(true)
    // Load all DB data in parallel
    api.getGoals().then(d => setApiGoals(d.goals||[])).catch(()=>{})
    api.getHealthChallenges().then(d => setApiHC(d.challenges||[])).catch(()=>{})
    api.getPreferences().then(d => setApiPrefs(d)).catch(()=>{})
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

  // Load apartments for a given city
  const loadApartments = (city) => {
    if (!city) return
    setAptLoading(true)
    api.getApartments(city)
      .then(d => setApartments(d.apartments || []))
      .catch(() => setApartments([]))
      .finally(() => setAptLoading(false))
  }

  // ── Build goals list: DB first, fallback to known list ──
  const goalsList = apiGoals.length
    ? apiGoals.map(g => ({ name: g.goalName||g.name, emoji: GOAL_EMOJI[g.goalName||g.name]||'🌿', desc: g.description||'' }))
    : Object.keys(GOAL_EMOJI).map(name => ({ name, emoji: GOAL_EMOJI[name], desc: '' }))

  // ── Health challenges: DB first, fallback ──
  const hcList = apiHC.length ? apiHC : HC_FALLBACK

  // ── Start editing family ──
  const startEditFamily = () => {
    const savedCity = f?.city || (cities[0] || '')
    setFe({
      familyName:           f?.familyName || '',
      email:                f?.email || '',
      city:                 savedCity,
      deliveryType:         f?.deliveryType || 'individual',
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
    // Pre-load apartments for current city
    if (savedCity) loadApartments(savedCity)
    setEditSection('family')
  }

  // ── Save family ──
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

  // ── Start editing a member ──
  const startEditMember = (m) => {
    setMe({
      memberId:            m.memberId,
      name:                m.name || '',
      relationship:        m.relationship || 'Self',
      ageRaw:              m.age ? String(m.age) : '',
      gender:              m.gender || 'Female',
      height:              m.height ? String(m.height) : '',
      weight:              m.weight ? String(m.weight) : '',
      activityLevel:       m.activityLevel || 'moderate',
      dietType:            m.dietType || 'Vegetarian',
      wellnessGoals:       [...(m.wellnessGoals || [])],
      healthChallenges:    [...(m.healthChallenges || [])],
      tastePref:           [...(m.tastePref || [])],
      cookPref:            [...(m.cookPref || [])],
      dietaryRestrictions: [...(m.dietaryRestrictions || [])],
      dislikedVeg:         [...(m.dislikedVeg || [])],
      dislikedFruit:       [...(m.dislikedFruit || [])],
      vegFruitRestriction: m.vegFruitRestriction ?? false,
      preferredPlan:       m.preferredPlan || '',
      _vegQ:               '',
      _fruitQ:             '',
      _vegRestr:           (m.dislikedVeg||[]).length > 0,
      _fruitRestr:         (m.dislikedFruit||[]).length > 0,
    })
    setEditSection(m.memberId)
    setGoalSearch(''); setHcSearch('')
  }

  // ── Start adding a new member ──
  const startAddMember = () => {
    setMe({
      memberId:            'new',
      name:                '',
      relationship:        'Self',
      ageRaw:              '',
      gender:              'Female',
      height:              '',
      weight:              '',
      activityLevel:       'moderate',
      dietType:            'Vegetarian',
      wellnessGoals:       [],
      healthChallenges:    [],
      tastePref:           [],
      cookPref:            [],
      dietaryRestrictions: [],
      dislikedVeg:         [],
      dislikedFruit:       [],
      vegFruitRestriction: false,
      preferredPlan:       '',
      _vegQ:               '',
      _fruitQ:             '',
      _vegRestr:           false,
      _fruitRestr:         false,
    })
    setEditSection('new')
    setGoalSearch(''); setHcSearch('')
  }

  // ── Save member ──
  const saveMember = async () => {
    if (!me.name?.trim()) return showToast('Name is required','error')
    setSaving(true)
    try {
      const payload = {
        name:                me.name,
        relationship:        me.relationship,
        age:                 me.ageRaw ? parseInt(me.ageRaw) : null,
        gender:              me.gender,
        height:              me.height ? parseFloat(me.height) : null,
        weight:              me.weight ? parseFloat(me.weight) : null,
        activityLevel:       me.activityLevel,
        dietType:            me.dietType,
        wellnessGoals:       me.wellnessGoals,
        healthChallenges:    me.healthChallenges,
        tastePref:           me.tastePref,
        cookPref:            me.cookPref,
        dietaryRestrictions: me.dietaryRestrictions,
        dislikedVeg:         me.dislikedVeg,
        dislikedFruit:       me.dislikedFruit,
        vegFruitRestriction: me.vegFruitRestriction,
        preferredPlan:       me.preferredPlan || null,
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

  const toggleGoal  = g => setMe(p => { const c=p.wellnessGoals||[]; if(!c.includes(g)&&c.length>=3){showToast('Max 3 goals per member','error');return p}; return {...p,wellnessGoals:c.includes(g)?c.filter(x=>x!==g):[...c,g]} })
  const toggleHC    = h => setMe(p => { const c=p.healthChallenges||[];   return {...p,healthChallenges:c.includes(h)?c.filter(x=>x!==h):[...c,h]} })
  const toggleTaste = t => setMe(p => { const c=p.tastePref||[];           return {...p,tastePref:c.includes(t)?c.filter(x=>x!==t):[...c,t]} })
  const toggleCook  = c => setMe(p => { const x=p.cookPref||[];            return {...p,cookPref:x.includes(c)?x.filter(y=>y!==c):[...x,c]} })
  const toggleAllergy = a => setMe(p => { const c=p.dietaryRestrictions||[]; return {...p,dietaryRestrictions:c.includes(a)?c.filter(x=>x!==a):[...c,a]} })

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

  // ── Member editor panel ──
  const MemberEditor = ({ isNew }) => (
    <div style={{ background:'var(--green-light)',borderRadius:14,border:'1.5px solid var(--green)',padding:'16px',marginBottom:12 }}>
      <div style={{ fontSize:14,fontWeight:700,color:'var(--green)',marginBottom:14 }}>
        {isNew ? '➕ Add Family Member' : `✏️ Edit ${me.name||'Member'}`}
      </div>

      {/* Relationship */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:7,textTransform:'uppercase',letterSpacing:0.5 }}>Relationship</div>
        <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
          {RELS.map(r=>(
            <button key={r} onClick={()=>setMe(p=>({...p,relationship:r}))}
              style={{ padding:'6px 12px',borderRadius:20,border:`1.5px solid ${me.relationship===r?'var(--green)':'var(--border)'}`,background:me.relationship===r?'var(--green)':'var(--white)',color:me.relationship===r?'#fff':'var(--text-mid)',fontSize:12,fontWeight:600,cursor:'pointer' }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Name + Age */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12 }}>
        <div>
          <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Full Name *</div>
          <input className="inp no-ico" placeholder="e.g. Priya" value={me.name||''} onChange={e=>setMe(p=>({...p,name:e.target.value}))} />
        </div>
        <div>
          <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Age</div>
          <input className="inp no-ico" type="number" inputMode="numeric" min="1" max="110" placeholder="34" value={me.ageRaw||''} onChange={e=>setMe(p=>({...p,ageRaw:e.target.value}))} />
        </div>
      </div>

      {/* Gender */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:7,textTransform:'uppercase',letterSpacing:0.5 }}>Gender</div>
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
          <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Height (cm)</div>
          <input className="inp no-ico" type="number" placeholder="165" value={me.height||''} onChange={e=>setMe(p=>({...p,height:e.target.value}))} />
        </div>
        <div>
          <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Weight (kg)</div>
          <input className="inp no-ico" type="number" placeholder="65" value={me.weight||''} onChange={e=>setMe(p=>({...p,weight:e.target.value}))} />
        </div>
      </div>

      {/* Activity Level */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:7,textTransform:'uppercase',letterSpacing:0.5 }}>Activity Level</div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6 }}>
          {ACTIVITY.map(a=>(
            <button key={a.id} onClick={()=>setMe(p=>({...p,activityLevel:a.id}))}
              style={{ padding:'8px 4px',borderRadius:8,border:`1.5px solid ${me.activityLevel===a.id?'var(--green)':'var(--border)'}`,background:me.activityLevel===a.id?'var(--green-pale)':'var(--white)',color:me.activityLevel===a.id?'var(--green)':'var(--text-mid)',fontSize:10,fontWeight:700,cursor:'pointer',textAlign:'center' }}>
              <div style={{ fontSize:18,marginBottom:2 }}>{a.emoji}</div>
              {a.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Diet Type */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:7,textTransform:'uppercase',letterSpacing:0.5 }}>Diet Type</div>
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

      {/* Wellness Goals — DB driven */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:4,textTransform:'uppercase',letterSpacing:0.5 }}>
          Wellness Goals <span style={{ color:'var(--text-light)',fontWeight:400,fontSize:10 }}>(up to 3)</span>
        </div>
        <input className="inp no-ico" placeholder="Search goals…" value={goalSearch} onChange={e=>setGoalSearch(e.target.value)} style={{ marginBottom:8,fontSize:12 }} />
        <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
          {goalsList.filter(g=>g.name.toLowerCase().includes(goalSearch.toLowerCase())).map(g=>{
            const on=(me.wellnessGoals||[]).includes(g.name)
            return (
              <button key={g.name} onClick={()=>toggleGoal(g.name)}
                style={{ padding:'5px 12px',borderRadius:20,border:`1.5px solid ${on?'var(--green)':'var(--border)'}`,background:on?'var(--green)':'var(--white)',color:on?'#fff':'var(--text-mid)',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
                {g.emoji} {g.name} {on&&'✓'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Health Challenges — search-only reveal */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:4,textTransform:'uppercase',letterSpacing:0.5 }}>
          Health Challenges <span style={{ fontWeight:400,color:'var(--text-light)',fontSize:10 }}>(optional)</span>
        </div>
        <input className="inp no-ico" placeholder="Search challenges…" value={hcSearch} onChange={e=>setHcSearch(e.target.value)} style={{ marginBottom:8,fontSize:12 }} />
        <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
          {(me.healthChallenges||[]).map(h=>(
            <button key={h} onClick={()=>toggleHC(h)}
              style={{ padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--green)',background:'var(--green-pale)',color:'var(--green)',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
              {h} <span style={{fontWeight:700}}>×</span>
            </button>
          ))}
          {hcSearch.trim() && hcList
            .filter(h => { const n=typeof h==='string'?h:h.name||''; return n.toLowerCase().includes(hcSearch.toLowerCase())&&!(me.healthChallenges||[]).includes(n) })
            .map(h => { const n=typeof h==='string'?h:h.name||''; return (
              <button key={n} onClick={()=>toggleHC(n)}
                style={{ padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--border)',background:'var(--white)',color:'var(--text-mid)',fontSize:12,cursor:'pointer' }}>
                + {n}
              </button>
            )})
          }
          {!hcSearch.trim() && !(me.healthChallenges||[]).length && (
            <div style={{fontSize:12,color:'var(--text-light)'}}>Type above to search and add</div>
          )}
        </div>
      </div>

      {/* Disliked Vegetables */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:7,textTransform:'uppercase',letterSpacing:0.5 }}>
          Disliked Vegetables <span style={{ fontWeight:400,color:'var(--text-light)',fontSize:10 }}>(optional)</span>
        </div>
        <div style={{ display:'flex',gap:8,marginBottom:10 }}>
          {[{v:false,l:'No restrictions'},{v:true,l:'Yes, I have restrictions'}].map(o=>(
            <button key={String(o.v)} onClick={()=>setMe(p=>({...p,_vegRestr:o.v,...(!o.v?{dislikedVeg:[],_vegQ:''}:{})}))}
              style={{ flex:1,padding:'8px 6px',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',border:`1.5px solid ${me._vegRestr===o.v?'var(--green)':'var(--border)'}`,background:me._vegRestr===o.v?'var(--green-pale)':'var(--white)',color:me._vegRestr===o.v?'var(--green)':'var(--text-mid)' }}>
              {me._vegRestr===o.v?'✅ ':''}{o.l}
            </button>
          ))}
        </div>
        {me._vegRestr && (
          <>
            <input className="inp no-ico" placeholder="Search vegetables to exclude…" value={me._vegQ||''} onChange={e=>setMe(p=>({...p,_vegQ:e.target.value}))} style={{ marginBottom:8,fontSize:12 }} />
            <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
              {(me.dislikedVeg||[]).map(v=>(
                <button key={v} onClick={()=>setMe(p=>({...p,dislikedVeg:(p.dislikedVeg||[]).filter(x=>x!==v)}))}
                  style={{ padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--green)',background:'var(--green-pale)',color:'var(--green)',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
                  {v} <span style={{fontWeight:700}}>×</span>
                </button>
              ))}
              {(me._vegQ||'').trim() && VEGETABLES_LIST
                .filter(v=>v.toLowerCase().includes((me._vegQ||'').toLowerCase())&&!(me.dislikedVeg||[]).includes(v))
                .map(v=>(
                  <button key={v} onClick={()=>setMe(p=>({...p,dislikedVeg:[...(p.dislikedVeg||[]),v],_vegQ:''}))}
                    style={{ padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--border)',background:'var(--white)',color:'var(--text-mid)',fontSize:12,cursor:'pointer' }}>
                    + {v}
                  </button>
                ))
              }
              {!(me._vegQ||'').trim() && !(me.dislikedVeg||[]).length && (
                <div style={{fontSize:12,color:'var(--text-light)'}}>Type above to search and add</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Disliked Fruits */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:7,textTransform:'uppercase',letterSpacing:0.5 }}>
          Disliked Fruits <span style={{ fontWeight:400,color:'var(--text-light)',fontSize:10 }}>(optional)</span>
        </div>
        <div style={{ display:'flex',gap:8,marginBottom:10 }}>
          {[{v:false,l:'No restrictions'},{v:true,l:'Yes, I have restrictions'}].map(o=>(
            <button key={String(o.v)} onClick={()=>setMe(p=>({...p,_fruitRestr:o.v,...(!o.v?{dislikedFruit:[],_fruitQ:''}:{})}))}
              style={{ flex:1,padding:'8px 6px',borderRadius:8,fontSize:11,fontWeight:600,cursor:'pointer',border:`1.5px solid ${me._fruitRestr===o.v?'var(--green)':'var(--border)'}`,background:me._fruitRestr===o.v?'var(--green-pale)':'var(--white)',color:me._fruitRestr===o.v?'var(--green)':'var(--text-mid)' }}>
              {me._fruitRestr===o.v?'✅ ':''}{o.l}
            </button>
          ))}
        </div>
        {me._fruitRestr && (
          <>
            <input className="inp no-ico" placeholder="Search fruits to exclude…" value={me._fruitQ||''} onChange={e=>setMe(p=>({...p,_fruitQ:e.target.value}))} style={{ marginBottom:8,fontSize:12 }} />
            <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
              {(me.dislikedFruit||[]).map(f=>(
                <button key={f} onClick={()=>setMe(p=>({...p,dislikedFruit:(p.dislikedFruit||[]).filter(x=>x!==f)}))}
                  style={{ padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--green)',background:'var(--green-pale)',color:'var(--green)',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
                  {f} <span style={{fontWeight:700}}>×</span>
                </button>
              ))}
              {(me._fruitQ||'').trim() && FRUITS_LIST
                .filter(f=>f.toLowerCase().includes((me._fruitQ||'').toLowerCase())&&!(me.dislikedFruit||[]).includes(f))
                .map(f=>(
                  <button key={f} onClick={()=>setMe(p=>({...p,dislikedFruit:[...(p.dislikedFruit||[]),f],_fruitQ:''}))}
                    style={{ padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--border)',background:'var(--white)',color:'var(--text-mid)',fontSize:12,cursor:'pointer' }}>
                    + {f}
                  </button>
                ))
              }
              {!(me._fruitQ||'').trim() && !(me.dislikedFruit||[]).length && (
                <div style={{fontSize:12,color:'var(--text-light)'}}>Type above to search and add</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Preferred Taste — DB driven */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:7,textTransform:'uppercase',letterSpacing:0.5 }}>Preferred Taste</div>
        <div style={{ display:'flex',flexWrap:'wrap',gap:7 }}>
          {(apiPrefs.taste.length ? apiPrefs.taste : ['Sweet','Mild','Tangy','Spicy','Bitter']).map(t=>{
            const on=(me.tastePref||[]).includes(t)
            return <button key={t} onClick={()=>toggleTaste(t)} className={`pill${on?' on':''}`}>{on&&'✓ '}{t}</button>
          })}
          {(me.tastePref||[]).filter(t=>!(apiPrefs.taste.length?apiPrefs.taste:['Sweet','Mild','Tangy','Spicy','Bitter']).includes(t)).map(t=>(
            <button key={t} onClick={()=>toggleTaste(t)} className="pill on">✓ {t} ×</button>
          ))}
          {me._showOtherTaste ? (
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <input style={{padding:'5px 10px',borderRadius:20,border:'1.5px solid var(--green)',fontSize:12,width:130,outline:'none'}}
                placeholder="Type & press Enter" value={me._otherTaste||''} autoFocus
                onChange={e=>setMe(p=>({...p,_otherTaste:e.target.value}))}
                onKeyDown={e=>{if(e.key==='Enter'&&(me._otherTaste||'').trim()){setMe(p=>({...p,tastePref:[...(p.tastePref||[]),p._otherTaste.trim()],_otherTaste:'',_showOtherTaste:false}))}if(e.key==='Escape')setMe(p=>({...p,_showOtherTaste:false}))}}/>
              <button onClick={()=>{if((me._otherTaste||'').trim())setMe(p=>({...p,tastePref:[...(p.tastePref||[]),p._otherTaste.trim()],_otherTaste:'',_showOtherTaste:false}))}} className="pill on" style={{padding:'5px 10px'}}>Add</button>
            </div>
          ) : (
            <button onClick={()=>setMe(p=>({...p,_showOtherTaste:true}))} className="pill" style={{borderStyle:'dashed'}}>+ Others</button>
          )}
        </div>
      </div>

      {/* Cooking Preference — DB driven */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:7,textTransform:'uppercase',letterSpacing:0.5 }}>Cooking Preference</div>
        <div style={{ display:'flex',flexWrap:'wrap',gap:7 }}>
          {(apiPrefs.cooking.length ? apiPrefs.cooking : ['Quick Cooking','Traditional Cooking','Salads','Juices','Smoothies','Soups']).map(c=>{
            const on=(me.cookPref||[]).includes(c)
            return <button key={c} onClick={()=>toggleCook(c)} className={`pill${on?' on':''}`}>{on&&'✓ '}{c}</button>
          })}
          {(me.cookPref||[]).filter(c=>!(apiPrefs.cooking.length?apiPrefs.cooking:['Quick Cooking','Traditional Cooking','Salads','Juices','Smoothies','Soups']).includes(c)).map(c=>(
            <button key={c} onClick={()=>toggleCook(c)} className="pill on">✓ {c} ×</button>
          ))}
          {me._showOtherCook ? (
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <input style={{padding:'5px 10px',borderRadius:20,border:'1.5px solid var(--green)',fontSize:12,width:150,outline:'none'}}
                placeholder="Type & press Enter" value={me._otherCook||''} autoFocus
                onChange={e=>setMe(p=>({...p,_otherCook:e.target.value}))}
                onKeyDown={e=>{if(e.key==='Enter'&&(me._otherCook||'').trim()){setMe(p=>({...p,cookPref:[...(p.cookPref||[]),p._otherCook.trim()],_otherCook:'',_showOtherCook:false}))}if(e.key==='Escape')setMe(p=>({...p,_showOtherCook:false}))}}/>
              <button onClick={()=>{if((me._otherCook||'').trim())setMe(p=>({...p,cookPref:[...(p.cookPref||[]),p._otherCook.trim()],_otherCook:'',_showOtherCook:false}))}} className="pill on" style={{padding:'5px 10px'}}>Add</button>
            </div>
          ) : (
            <button onClick={()=>setMe(p=>({...p,_showOtherCook:true}))} className="pill" style={{borderStyle:'dashed'}}>+ Others</button>
          )}
        </div>
      </div>

      {/* Allergies & Restrictions — DB driven */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:7,textTransform:'uppercase',letterSpacing:0.5 }}>Allergies & Restrictions</div>
        <div style={{ display:'flex',flexWrap:'wrap',gap:7 }}>
          {(apiPrefs.allergy.length ? apiPrefs.allergy : ['Nut Allergy','Gluten Sensitivity','Lactose Intolerance']).map(a=>{
            const on=(me.dietaryRestrictions||[]).includes(a)
            return <button key={a} onClick={()=>toggleAllergy(a)} className={`pill${on?' on':''}`}>{on&&'✓ '}{a}</button>
          })}
          {(me.dietaryRestrictions||[]).filter(a=>!(apiPrefs.allergy.length?apiPrefs.allergy:['Nut Allergy','Gluten Sensitivity','Lactose Intolerance']).includes(a)).map(a=>(
            <button key={a} onClick={()=>toggleAllergy(a)} className="pill on">✓ {a} ×</button>
          ))}
          {me._showOtherAllergy ? (
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <input style={{padding:'5px 10px',borderRadius:20,border:'1.5px solid var(--green)',fontSize:12,width:150,outline:'none'}}
                placeholder="Type & press Enter" value={me._otherAllergy||''} autoFocus
                onChange={e=>setMe(p=>({...p,_otherAllergy:e.target.value}))}
                onKeyDown={e=>{if(e.key==='Enter'&&(me._otherAllergy||'').trim()){setMe(p=>({...p,dietaryRestrictions:[...(p.dietaryRestrictions||[]),p._otherAllergy.trim()],_otherAllergy:'',_showOtherAllergy:false}))}if(e.key==='Escape')setMe(p=>({...p,_showOtherAllergy:false}))}}/>
              <button onClick={()=>{if((me._otherAllergy||'').trim())setMe(p=>({...p,dietaryRestrictions:[...(p.dietaryRestrictions||[]),p._otherAllergy.trim()],_otherAllergy:'',_showOtherAllergy:false}))}} className="pill on" style={{padding:'5px 10px'}}>Add</button>
            </div>
          ) : (
            <button onClick={()=>setMe(p=>({...p,_showOtherAllergy:true}))} className="pill" style={{borderStyle:'dashed'}}>+ Others</button>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
        <button className="btn btn-outline" onClick={()=>setEditSection(null)} disabled={saving}>Cancel</button>
        <button className="btn btn-primary" onClick={saveMember} disabled={saving}>
          {saving?<span className="spin"/>:isNew?'Add Member ✓':'Save Changes ✓'}
        </button>
      </div>
    </div>
  )

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
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Family Name *</div>
                <input className="inp no-ico" value={fe.familyName||''} onChange={e=>setFe(p=>({...p,familyName:e.target.value}))} />
              </div>

              {/* Email */}
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Email</div>
                <input className="inp no-ico" type="email" placeholder="e.g. priya@gmail.com" value={fe.email||''} onChange={e=>setFe(p=>({...p,email:e.target.value}))} />
              </div>

              {/* City — from DB */}
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:8,textTransform:'uppercase',letterSpacing:0.5 }}>City</div>
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
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:8,textTransform:'uppercase',letterSpacing:0.5 }}>Delivery Location Type</div>
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

              {/* Apartment — DB picker for gated, text input for individual */}
              {fe.deliveryType==='gated' ? (
                <div>
                  <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:8,textTransform:'uppercase',letterSpacing:0.5 }}>Select Apartment / Community</div>
                  {aptLoading ? (
                    <div style={{ padding:'12px',textAlign:'center',color:'var(--text-light)',fontSize:13 }}>Loading apartments…</div>
                  ) : apartments.length > 0 ? (
                    <div style={{ display:'flex',flexDirection:'column',gap:8,maxHeight:220,overflowY:'auto' }}>
                      {apartments.map(apt => {
                        const aid   = apt._id?.toString() || apt.apartmentId
                        const aname = apt.apartmentName || apt.name
                        const sel   = fe.apartmentId===aid || fe.apartmentName===aname
                        return (
                          <div key={aid}
                            onClick={()=>setFe(p=>({
                              ...p,
                              apartmentId:   aid,
                              apartmentName: aname,
                              // Auto-fill address details from apartment record
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
                      <input className="inp no-ico" placeholder="e.g. Green Meadows Apartments" value={fe.apartmentName||''} onChange={e=>setFe(p=>({...p,apartmentName:e.target.value,apartmentId:''}))} />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Apartment / Building</div>
                  <input className="inp no-ico" placeholder="e.g. Green Meadows Apartments" value={fe.apartmentName||''} onChange={e=>setFe(p=>({...p,apartmentName:e.target.value}))} />
                </div>
              )}

              {/* Tower + Flat */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
                <div>
                  <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Tower / Block</div>
                  <input className="inp no-ico" placeholder="Block A" value={fe.towerNo||''} onChange={e=>setFe(p=>({...p,towerNo:e.target.value}))} />
                </div>
                <div>
                  <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Flat / House No.</div>
                  <input className="inp no-ico" placeholder="B-101" value={fe.flatNo||''} onChange={e=>setFe(p=>({...p,flatNo:e.target.value}))} />
                </div>
              </div>

              {/* Landmark */}
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Landmark</div>
                <input className="inp no-ico" placeholder="Near Lotus Cafe" value={fe.landmark||''} onChange={e=>setFe(p=>({...p,landmark:e.target.value}))} />
              </div>

              {/* Pincode */}
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Pincode</div>
                <input className="inp no-ico" placeholder="641001" maxLength={6} value={fe.pincode||''} onChange={e=>setFe(p=>({...p,pincode:e.target.value.replace(/\D/g,'')}))} />
              </div>

              {/* Diet Preference */}
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:8,textTransform:'uppercase',letterSpacing:0.5 }}>Diet Preference</div>
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
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:8,textTransform:'uppercase',letterSpacing:0.5 }}>Preferred Delivery Time</div>
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
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Delivery Instructions <span style={{ fontWeight:400,fontSize:10 }}>(Optional)</span></div>
                <textarea className="ta" rows={3} maxLength={120} placeholder="e.g. Leave at doorstep, call before delivery…" value={fe.deliveryInstructions||''} onChange={e=>setFe(p=>({...p,deliveryInstructions:e.target.value}))} />
                <div style={{ fontSize:11,color:'var(--text-light)',textAlign:'right',marginTop:2 }}>{(fe.deliveryInstructions||'').length}/120</div>
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
        {editSection==='new' && <MemberEditor isNew={true} />}

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
                  <MemberEditor isNew={false} />
                ) : (
                  <SCard>
                    <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:10 }}>
                      <div className="avatar" style={{ width:42,height:42,borderRadius:'50%',background:acolor(i),fontSize:14 }}>
                        {initials(m.name)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700,fontSize:14 }}>{m.name}</div>
                        <div style={{ fontSize:12,color:'var(--text-light)',marginTop:1 }}>
                          {[m.relationship, m.age&&`${m.age} yrs`, m.gender].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <button onClick={()=>startEditMember(m)} style={{ padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--green)',color:'var(--green)',background:'var(--green-pale)',fontSize:11,fontWeight:700,cursor:'pointer' }}>Edit</button>
                      <button onClick={()=>deleteMember(m.memberId,m.name)} style={{ padding:'5px 10px',borderRadius:20,border:'1.5px solid #FFCDD2',color:'var(--red)',background:'#FFF0F0',fontSize:11,fontWeight:700,cursor:'pointer' }}>Remove</button>
                    </div>

                    {/* Physical stats */}
                    {(m.height||m.weight||m.activityLevel) && (
                      <div style={{ display:'flex',gap:12,marginBottom:10,padding:'8px 10px',background:'#FAFAFA',borderRadius:8 }}>
                        {m.height && <div style={{ textAlign:'center' }}><div style={{ fontSize:10,color:'var(--text-light)' }}>Height</div><div style={{ fontSize:12,fontWeight:700 }}>{m.height} cm</div></div>}
                        {m.weight && <div style={{ textAlign:'center' }}><div style={{ fontSize:10,color:'var(--text-light)' }}>Weight</div><div style={{ fontSize:12,fontWeight:700 }}>{m.weight} kg</div></div>}
                        {m.activityLevel && <div style={{ textAlign:'center' }}><div style={{ fontSize:10,color:'var(--text-light)' }}>Activity</div><div style={{ fontSize:12,fontWeight:700 }}>{ACTIVITY.find(a=>a.id===m.activityLevel)?.label||m.activityLevel}</div></div>}
                        {m.dietType && <div style={{ textAlign:'center' }}><div style={{ fontSize:10,color:'var(--text-light)' }}>Diet</div><div style={{ fontSize:12,fontWeight:700 }}>{m.dietType}</div></div>}
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

                    {m.healthChallenges?.length>0 && (
                      <div style={{ marginBottom:8 }}>
                        <div style={{ fontSize:10,fontWeight:700,color:'var(--text-light)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:5 }}>Health Challenges</div>
                        <div style={{ display:'flex',flexWrap:'wrap' }}>
                          {m.healthChallenges.map(h=><Tag key={h} label={h} icon="💊" />)}
                        </div>
                      </div>
                    )}

                    {m.tastePref?.length>0 && (
                      <div style={{ marginBottom:6 }}>
                        <div style={{ fontSize:10,fontWeight:700,color:'var(--text-light)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:5 }}>Taste Preferences</div>
                        <div style={{ display:'flex',flexWrap:'wrap' }}>
                          {m.tastePref.map(t=><Tag key={t} label={t} icon="😋" />)}
                        </div>
                      </div>
                    )}

                    {m.cookPref?.length>0 && (
                      <div>
                        <div style={{ fontSize:10,fontWeight:700,color:'var(--text-light)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:5 }}>Cooking Preference</div>
                        <div style={{ display:'flex',flexWrap:'wrap' }}>
                          {m.cookPref.map(c=><Tag key={c} label={c} icon="👨‍🍳" />)}
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
