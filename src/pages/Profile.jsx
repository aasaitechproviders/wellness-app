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

const GOAL_META = {
  'Immunity Support':  '🛡️','Protein Support':   '💪','Iron Support':       '💧',
  'Weight Management': '⚖️','Diabetes Friendly': '🩺','Heart Wellness':     '❤️',
  'Digestive Wellness':'🌀','Bone Health':        '🦴',"Women's Wellness":   '🌸',
  'Kids Nutrition':    '😊','Senior Wellness':    '👴','Other Goal':         '🌿',
  'General Wellness':  '🌿','Diabetes Control':   '🩺','Detox':              '✨',
}

const RELS      = ['Self','Spouse','Child','Parent','Grandparent','Other']
const ACTIVITY  = [
  {id:'sedentary',label:'Sedentary',   emoji:'🪑'},
  {id:'light',    label:'Lightly Active',emoji:'🚶'},
  {id:'moderate', label:'Moderately Active',emoji:'🏃'},
  {id:'high',     label:'Highly Active',emoji:'🏋️'},
]
const TASTE_OPT  = ['Sweet','Mild','Tangy','Spicy','Bitter']
const COOK_OPT   = ['Quick Cooking','Traditional Cooking','Salads','Juices','Smoothies','Soups']
const HC_LIST    = ['Blood Sugar','Blood Pressure','Thyroid','PCOS','Cholesterol','Anaemia','Arthritis','Kidney Issues','Digestive Issues']
const GOALS_LIST = Object.keys(GOAL_META)

const age = dob => dob ? Math.floor((Date.now()-new Date(dob))/31557600000) : null

// ── Reusable labeled row ──
const InfoRow = ({ label, value }) => value ? (
  <div style={{ marginBottom:8 }}>
    <div style={{ fontSize:10,fontWeight:700,letterSpacing:0.5,textTransform:'uppercase',color:'var(--text-light)' }}>{label}</div>
    <div style={{ fontSize:13,color:'var(--text)',marginTop:1 }}>{value}</div>
  </div>
) : null

// ── Pill tag ──
const Tag = ({ label, icon }) => (
  <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:50,background:'var(--green-pale)',color:'var(--green)',fontSize:11,fontWeight:600,marginRight:5,marginBottom:5 }}>
    {icon} {label}
  </span>
)

// ── Section card ──
const SCard = ({ children, style }) => (
  <div style={{ background:'var(--white)',borderRadius:14,border:'1px solid var(--border)',padding:'14px 16px',marginBottom:12,...style }}>
    {children}
  </div>
)

export default function Profile() {
  const { family, updateFamily, logout } = useAuth()
  const nav = useNavigate()

  const [f,        setF]        = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  // Which section is in edit mode
  const [editSection, setEditSection] = useState(null) // 'family' | memberId
  const [editMemberOpen, setEditMemberOpen] = useState(false) // add new member

  // Family edit state
  const [fe, setFe] = useState({})

  // Member edit state (keyed by memberId or 'new')
  const [me, setMe] = useState({})

  // Member goals/HC search
  const [goalSearch, setGoalSearch] = useState('')
  const [hcSearch,   setHcSearch]   = useState('')

  const load = async () => {
    if (!family?._id) return
    setLoading(true)
    try {
      const d = await api.getFamily(family._id)
      const fresh = d.family
      setF(fresh)
      updateFamily(fresh)
    } catch(e) {
      setF(family)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [family?._id])

  // ── Start editing family ──
  const startEditFamily = () => {
    setFe({
      familyName: f?.familyName || '',
      email:      f?.email || '',
      city:       f?.city || 'Coimbatore',
      apartmentName: f?.apartmentName || '',
      towerNo:    f?.towerNo || '',
      flatNo:     f?.flatNo || '',
      landmark:   f?.landmark || '',
      pincode:    f?.pincode || '',
      address:    f?.address || '',
      dietPreference: f?.dietPreference || 'Vegetarian',
      deliveryPreference: f?.deliveryPreference || 'Morning',
    })
    setEditSection('family')
  }

  // ── Save family ──
  const saveFamily = async () => {
    if (!fe.familyName?.trim()) return showToast('Family name is required','error')
    setSaving(true)
    try {
      const r = await api.updateFamily(f._id, {
        familyName:          fe.familyName,
        email:               fe.email,
        city:                fe.city,
        address:             [fe.apartmentName, fe.flatNo&&`Flat ${fe.flatNo}`, fe.towerNo&&`Tower ${fe.towerNo}`].filter(Boolean).join(', ') || fe.apartmentName || '',
        apartmentName:       fe.apartmentName,
        flatNo:              fe.flatNo,
        towerNo:             fe.towerNo,
        landmark:            fe.landmark,
        pincode:             fe.pincode,
        dietPreference:      fe.dietPreference,
        deliveryPreference:  fe.deliveryPreference,
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
      memberId:        m.memberId,
      name:            m.name || '',
      relationship:    m.relationship || 'Self',
      dob:             '', // not stored in DB as dob, derived from age
      ageRaw:          m.age ? String(m.age) : '',
      gender:          m.gender || 'Female',
      height:          m.height ? String(m.height) : '',
      weight:          m.weight ? String(m.weight) : '',
      activityLevel:   m.activityLevel || 'moderate',
      dietType:        m.dietType || 'Vegetarian',
      wellnessGoals:   [...(m.wellnessGoals || [])],
      healthChallenges:[...(m.healthChallenges || [])],
      tastePref:       [...(m.tastePref || [])],
      cookPref:        [...(m.cookPref || [])],
      dietaryRestrictions: [...(m.dietaryRestrictions || [])],
      dislikedVeg:     [...(m.dislikedVeg || [])],
      dislikedFruit:   [...(m.dislikedFruit || [])],
    })
    setEditSection(m.memberId)
    setGoalSearch(''); setHcSearch('')
  }

  // ── Start adding a new member ──
  const startAddMember = () => {
    setMe({
      memberId:        'new',
      name:            '',
      relationship:    'Self',
      ageRaw:          '',
      gender:          'Female',
      height:          '',
      weight:          '',
      activityLevel:   'moderate',
      dietType:        'Vegetarian',
      wellnessGoals:   [],
      healthChallenges:[],
      tastePref:       [],
      cookPref:        [],
      dietaryRestrictions: [],
      dislikedVeg:     [],
      dislikedFruit:   [],
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
        name:             me.name,
        relationship:     me.relationship,
        age:              me.ageRaw ? parseInt(me.ageRaw) : null,
        gender:           me.gender,
        height:           me.height ? parseFloat(me.height) : null,
        weight:           me.weight ? parseFloat(me.weight) : null,
        activityLevel:    me.activityLevel,
        dietType:         me.dietType,
        wellnessGoals:    me.wellnessGoals,
        healthChallenges: me.healthChallenges,
        tastePref:        me.tastePref,
        cookPref:         me.cookPref,
        dietaryRestrictions: me.dietaryRestrictions,
        dislikedVeg:      me.dislikedVeg,
        dislikedFruit:    me.dislikedFruit,
      }
      let fresh
      if (me.memberId === 'new') {
        await api.addMember(f._id, payload)
      } else {
        await api.updateMember(f._id, me.memberId, payload)
      }
      // Re-fetch fresh data
      const d = await api.getFamily(f._id)
      fresh = d.family
      setF(fresh); updateFamily(fresh)
      setEditSection(null)
      showToast(me.memberId==='new'?'Member added ✓':'Member updated ✓','success')
    } catch(e) { showToast(e.message||'Save failed','error') }
    finally { setSaving(false) }
  }

  // ── Delete member ──
  const deleteMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from your family?`)) return
    try {
      await api.deleteMember(f._id, memberId)
      const d = await api.getFamily(f._id)
      const fresh = d.family
      setF(fresh); updateFamily(fresh)
      showToast(`${memberName} removed`,'success')
      if (editSection === memberId) setEditSection(null)
    } catch(e) { showToast(e.message||'Remove failed','error') }
  }

  const toggleGoal = g => setMe(p => {
    const c = p.wellnessGoals || []
    if (!c.includes(g) && c.length >= 3) { showToast('Max 3 goals per member','error'); return p }
    return {...p, wellnessGoals: c.includes(g) ? c.filter(x=>x!==g) : [...c,g]}
  })
  const toggleHC   = h => setMe(p => { const c=p.healthChallenges||[]; return {...p,healthChallenges:c.includes(h)?c.filter(x=>x!==h):[...c,h]} })
  const toggleTaste= t => setMe(p => { const c=p.tastePref||[];       return {...p,tastePref:c.includes(t)?c.filter(x=>x!==t):[...c,t]} })
  const toggleCook = c => setMe(p => { const x=p.cookPref||[];        return {...p,cookPref:x.includes(c)?x.filter(y=>y!==c):[...x,c]} })

  const handleLogout = () => {
    if (window.confirm('Log out of Krisha Pure?')) { logout(); nav('/login',{replace:true}) }
  }

  if (loading) return (
    <div style={{ minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:14,background:'var(--cream)' }}>
      <div className="spinner" /><p style={{ color:'var(--text-light)',fontSize:13 }}>Loading profile…</p>
    </div>
  )

  const fData = f || family
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

      {/* Name */}
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

      {/* Wellness Goals */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:4,textTransform:'uppercase',letterSpacing:0.5 }}>
          Wellness Goals <span style={{ color:'var(--text-light)',fontWeight:400,fontSize:10 }}>(up to 3)</span>
        </div>
        <input className="inp no-ico" placeholder="Search goals…" value={goalSearch} onChange={e=>setGoalSearch(e.target.value)} style={{ marginBottom:8,fontSize:12 }} />
        <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
          {GOALS_LIST.filter(g=>g.toLowerCase().includes(goalSearch.toLowerCase())).map(g=>{
            const on=(me.wellnessGoals||[]).includes(g)
            return (
              <button key={g} onClick={()=>toggleGoal(g)}
                style={{ padding:'5px 12px',borderRadius:20,border:`1.5px solid ${on?'var(--green)':'var(--border)'}`,background:on?'var(--green)':'var(--white)',color:on?'#fff':'var(--text-mid)',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
                {GOAL_META[g]} {g} {on&&'✓'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Health Challenges */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:4,textTransform:'uppercase',letterSpacing:0.5 }}>Health Challenges <span style={{ fontWeight:400,color:'var(--text-light)',fontSize:10 }}>(optional)</span></div>
        <input className="inp no-ico" placeholder="Search challenges…" value={hcSearch} onChange={e=>setHcSearch(e.target.value)} style={{ marginBottom:8,fontSize:12 }} />
        <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
          {/* selected first */}
          {(me.healthChallenges||[]).map(h=>(
            <button key={h} onClick={()=>toggleHC(h)}
              style={{ padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--green)',background:'var(--green-pale)',color:'var(--green)',fontSize:12,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
              {h} ×
            </button>
          ))}
          {HC_LIST.filter(h=>h.toLowerCase().includes(hcSearch.toLowerCase())&&!(me.healthChallenges||[]).includes(h)).map(h=>(
            <button key={h} onClick={()=>toggleHC(h)}
              style={{ padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--border)',background:'var(--white)',color:'var(--text-mid)',fontSize:12,cursor:'pointer' }}>
              + {h}
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Taste */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:7,textTransform:'uppercase',letterSpacing:0.5 }}>Preferred Taste</div>
        <div style={{ display:'flex',flexWrap:'wrap',gap:7 }}>
          {TASTE_OPT.map(t=>{
            const on=(me.tastePref||[]).includes(t)
            return <button key={t} onClick={()=>toggleTaste(t)} className={`pill${on?' on':''}`}>{on&&'✓ '}{t}</button>
          })}
        </div>
      </div>

      {/* Cooking Pref */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:7,textTransform:'uppercase',letterSpacing:0.5 }}>Cooking Preference</div>
        <div style={{ display:'flex',flexWrap:'wrap',gap:7 }}>
          {COOK_OPT.map(c=>{
            const on=(me.cookPref||[]).includes(c)
            return <button key={c} onClick={()=>toggleCook(c)} className={`pill${on?' on':''}`}>{on&&'✓ '}{c}</button>
          })}
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
          {fData?.familyName||'Your Family'}
        </div>
        <div style={{ color:'rgba(255,255,255,0.7)',fontSize:12,marginTop:3 }}>+91 {fData?.phone}</div>
        {fData?.city&&<div style={{ color:'rgba(255,255,255,0.55)',fontSize:11,marginTop:2 }}>📍 {fData.city}</div>}
      </div>

      <div className="page-shell-scroll with-nav" style={{ padding:'14px 16px' }}>

        {/* ══════ FAMILY / ADDRESS SECTION ══════ */}
        {editSection==='family' ? (
          <div style={{ background:'var(--green-light)',borderRadius:14,border:'1.5px solid var(--green)',padding:'16px',marginBottom:12 }}>
            <div style={{ fontSize:14,fontWeight:700,color:'var(--green)',marginBottom:14 }}>✏️ Edit Profile & Address</div>
            <div style={{ display:'flex',flexDirection:'column',gap:11 }}>
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Family Name *</div>
                <input className="inp no-ico" value={fe.familyName||''} onChange={e=>setFe(p=>({...p,familyName:e.target.value}))} />
              </div>
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Email</div>
                <input className="inp no-ico" type="email" value={fe.email||''} onChange={e=>setFe(p=>({...p,email:e.target.value}))} />
              </div>
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>City</div>
                <select className="sel" value={fe.city||'Coimbatore'} onChange={e=>setFe(p=>({...p,city:e.target.value}))}>
                  <option>Coimbatore</option><option>Chennai</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Apartment / Building</div>
                <input className="inp no-ico" placeholder="e.g. Green Meadows Apartments" value={fe.apartmentName||''} onChange={e=>setFe(p=>({...p,apartmentName:e.target.value}))} />
              </div>
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
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Landmark</div>
                <input className="inp no-ico" placeholder="Near Lotus Cafe" value={fe.landmark||''} onChange={e=>setFe(p=>({...p,landmark:e.target.value}))} />
              </div>
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Pincode</div>
                <input className="inp no-ico" placeholder="641001" maxLength={6} value={fe.pincode||''} onChange={e=>setFe(p=>({...p,pincode:e.target.value.replace(/\D/g,'')}))} />
              </div>
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Diet Preference</div>
                <select className="sel" value={fe.dietPreference||'Vegetarian'} onChange={e=>setFe(p=>({...p,dietPreference:e.target.value}))}>
                  <option>Vegetarian</option><option>Eggetarian</option><option>Non-Vegetarian</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:'var(--text-mid)',marginBottom:5,textTransform:'uppercase',letterSpacing:0.5 }}>Preferred Delivery Time</div>
                <select className="sel" value={fe.deliveryPreference||'Morning'} onChange={e=>setFe(p=>({...p,deliveryPreference:e.target.value}))}>
                  <option>Morning</option><option>Afternoon</option><option>Evening</option>
                </select>
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
            <InfoRow label="Family Name" value={fData?.familyName} />
            <InfoRow label="Email"       value={fData?.email} />
            <InfoRow label="Diet"        value={fData?.dietPreference} />
            <InfoRow label="Delivery Time" value={fData?.deliveryPreference} />
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

        {/* Existing member cards */}
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
                    {/* Member header */}
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
                        {m.activityLevel && <div style={{ textAlign:'center' }}><div style={{ fontSize:10,color:'var(--text-light)' }}>Activity</div><div style={{ fontSize:12,fontWeight:700,textTransform:'capitalize' }}>{ACTIVITY.find(a=>a.id===m.activityLevel)?.label||m.activityLevel}</div></div>}
                        {m.dietType && <div style={{ textAlign:'center' }}><div style={{ fontSize:10,color:'var(--text-light)' }}>Diet</div><div style={{ fontSize:12,fontWeight:700 }}>{m.dietType}</div></div>}
                      </div>
                    )}

                    {/* Wellness Goals */}
                    {m.wellnessGoals?.length>0 && (
                      <div style={{ marginBottom:8 }}>
                        <div style={{ fontSize:10,fontWeight:700,color:'var(--text-light)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:5 }}>Wellness Goals</div>
                        <div style={{ display:'flex',flexWrap:'wrap' }}>
                          {m.wellnessGoals.map(g=><Tag key={g} label={g} icon={GOAL_META[g]||'🌿'} />)}
                        </div>
                      </div>
                    )}

                    {/* Health Challenges */}
                    {m.healthChallenges?.length>0 && (
                      <div style={{ marginBottom:8 }}>
                        <div style={{ fontSize:10,fontWeight:700,color:'var(--text-light)',textTransform:'uppercase',letterSpacing:0.5,marginBottom:5 }}>Health Challenges</div>
                        <div style={{ display:'flex',flexWrap:'wrap' }}>
                          {m.healthChallenges.map(h=><Tag key={h} label={h} icon="💊" />)}
                        </div>
                      </div>
                    )}

                    {/* Taste / Cooking prefs */}
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
