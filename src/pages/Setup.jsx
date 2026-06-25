import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { showToast } from '../components/Toast'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const WELLNESS_GOALS = [
  { id:'Immunity Support',   icon:'🛡️', label:'Immunity Support',   color:'#FFE5E5' },
  { id:'Weight Management',  icon:'⚖️', label:'Weight Management',  color:'#F3E5F5' },
  { id:'Protein Support',    icon:'⚡', label:'Protein Support',    color:'#FFF9C4' },
  { id:'Iron Support',       icon:'💪', label:'Iron Support',       color:'#FFF3E0' },
  { id:'Heart Wellness',     icon:'❤️', label:'Heart Wellness',     color:'#FCE4EC' },
  { id:'Diabetes Control',   icon:'💧', label:'Diabetes Support',   color:'#E1F5FE' },
  { id:'Senior Wellness',    icon:'👴', label:'Senior Wellness',    color:'#EFEBE9' },
  { id:'Kids Nutrition',     icon:'😊', label:'Kids Growth',        color:'#FFF8E1' },
  { id:'Digestive Wellness', icon:'🌀', label:'Digestive Wellness', color:'#E8F5E9' },
  { id:'Detox',              icon:'✨', label:'Detox',              color:'#FFFDE7' },
  { id:'Bone Health',        icon:'🦴', label:'Bone Health',        color:'#F3E5F5' },
  { id:'General Wellness',   icon:'🌿', label:'General Wellness',   color:'#E8F5E9' },
]

const HEALTH_CHALLENGES = [
  'High Blood Sugar','High Blood Pressure','Low Hemoglobin','Fatigue','Low Energy',
  'Frequent Illness','Obesity','Underweight','Constipation','Poor Appetite','Cholesterol','None',
]

const DISLIKED_VEG = ['Bitter Gourd','Brinjal','Radish','Turnip','Raw Papaya','Pumpkin','Drumstick','Cluster Beans','French Beans','Raw Banana','Raw Mango','Colocasia (Arbi)','Snake Gourd','Ridge Gourd','Ash Gourd']
const DISLIKED_FRU = ['Banana','Mango','Grapes','Pineapple','Papaya','Jackfruit','Custard Apple','Dates','Chikoo (Sapota)']
const TASTE_PREFS  = ['Sweet','Mild','Tangy','Spicy','Bitter']
const COOK_PREFS   = ['Quick Cooking','Traditional Cooking','Salads','Juices','Smoothies','Soups']
const MICROGREEN_TYPES = ['Sunflower','Broccoli','Pea Shoots','Radish','Mustard','Mixed Microgreens']
const ALLERGIES    = ['Nut Allergy','Gluten Sensitivity','Lactose Intolerance','None']

const STEPS = [
  'Personal & Delivery',   // 0
  'Family Members',         // 1
  'Wellness Goals',         // 2
  'Food Preferences',       // 3
]

function calcBMI(h, w) {
  if (!h || !w) return null
  const hm = parseFloat(h) / 100
  if (hm <= 0) return null
  return (parseFloat(w) / (hm * hm)).toFixed(1)
}

function bmiCategory(bmi) {
  if (!bmi) return ''
  const b = parseFloat(bmi)
  if (b < 18.5) return 'Underweight'
  if (b < 25)   return 'Normal'
  if (b < 30)   return 'Overweight'
  return 'Obese'
}

function lifeStageFromAge(age) {
  if (!age) return ''
  const a = parseInt(age)
  if (a <= 12)  return 'Child'
  if (a <= 19)  return 'Teen'
  if (a <= 59)  return 'Adult'
  return 'Adult'
}

// Returns recommended weight range string based on height (cm)
function recommendedWeightRange(height) {
  if (!height) return null
  const hm = parseFloat(height) / 100
  if (hm <= 0) return null
  const low  = Math.round(18.5 * hm * hm)
  const high = Math.round(24.9 * hm * hm)
  return `${low} – ${high} kg`
}

function bmiColor(bmi) {
  if (!bmi) return 'var(--green)'
  const b = parseFloat(bmi)
  if (b < 18.5) return '#E67E22'
  if (b < 25)   return '#27AE60'
  if (b < 30)   return '#E67E22'
  return '#E74C3C'
}

const RELATIONSHIPS = ['Self','Spouse','Child','Parent','Grandparent']

function emptyMember() {
  return {
    tempId: Date.now(),
    relationship: 'Self',
    name: '', gender: 'Female', dob: '', age: '',
    height: '', weight: '',
    activityLevel: 'Moderately Active',
    wellnessGoals: [],
    healthChallenges: [],
    dietType: 'Vegetarian',
    hasVegFruitRestriction: null,   // null = unanswered, true = yes, false = no
    dislikedVeg: [], dislikedFruit: [],
    tastePref: [], cookPref: [],
    microgreenExperience: 'New User',
    microgreenInterest: [],
    allergies: [],
  }
}

export default function Setup() {
  const { family, updateFamily } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const isEditMode = !!family?.profileComplete   // true when coming from Profile → Edit

  const [step, setStep]     = useState(0)
  const [saving, setSaving] = useState(false)
  const [prefillLoading, setPrefillLoading] = useState(isEditMode)

  // Step 0: profile
  const [profile, setProfile] = useState({
    email: '',
    deliveryType: 'individual',
    apartmentId: '',
    apartmentName: '', towerNo: '', flatNo: '', landmark: '', pincode: '',
    city: '',
    deliveryPreference: 'Morning',
  })

  // Steps 1-3: members
  const [members, setMembers] = useState([emptyMember()])
  const [activeMember, setActiveMember] = useState(0)

  // ── Pre-fill from DB when in edit mode ──────────────────────────────────
  useEffect(() => {
    if (!isEditMode || !family?._id) { setPrefillLoading(false); return }

    api.getFamily(family._id).then(d => {
      const f = d.family
      if (!f) return

      // Detect delivery type: if apartmentId is set it was gated, else individual
      const deliveryType = f.apartmentId ? 'gated' : 'individual'

      // Parse landmark and pincode back out of address string (stored as "landmark, pincode")
      const addrParts = (f.address || '').split(',').map(s => s.trim())
      const pincode   = addrParts.find(p => /^\d{6}$/.test(p)) || ''
      const landmark  = addrParts.filter(p => p !== pincode).join(', ')

      setProfile({
        email:              f.email || '',
        deliveryType,
        apartmentId:        f.apartmentId || '',
        apartmentName:      f.apartmentName || '',
        towerNo:            f.towerNo || '',
        flatNo:             f.flatNo || '',
        landmark:           deliveryType === 'individual' ? landmark : '',
        pincode:            deliveryType === 'individual' ? pincode  : '',
        city:               f.city || 'Coimbatore',
        deliveryPreference: f.deliveryPreference || 'Morning',
      })

      // Pre-fill members from DB — map DB member shape to local emptyMember shape
      if (f.members?.length) {
        const prefilled = f.members.map(m => {
          // Parse dietaryRestrictions back to dislikedVeg / dislikedFruit / allergies
          const restrictions = m.dietaryRestrictions || []
          const dislikedVeg  = restrictions.filter(r => r.startsWith('No ') && DISLIKED_VEG.includes(r.slice(3))).map(r => r.slice(3))
          const dislikedFruit= restrictions.filter(r => r.startsWith('No ') && DISLIKED_FRU.includes(r.slice(3))).map(r => r.slice(3))
          const allergies    = restrictions.filter(r => !r.startsWith('No ') || (!DISLIKED_VEG.includes(r.slice(3)) && !DISLIKED_FRU.includes(r.slice(3))))

          return {
            ...emptyMember(),
            _existingId:    m.memberId,
            name:           m.name || '',
            age:            m.age?.toString() || '',
            gender:         m.gender || 'Female',
            wellnessGoals:  m.wellnessGoals || [],
            healthChallenges: m.healthChallenges || [],
            dietaryRestrictions: restrictions,
            dislikedVeg,
            dislikedFruit,
            hasVegFruitRestriction: (dislikedVeg.length + dislikedFruit.length) > 0 ? true : null,
            allergies:      allergies.length ? allergies : [],
            dietType:       f.dietPreference || 'Vegetarian',
          }
        })
        setMembers(prefilled)
      }
    }).catch(() => {}).finally(() => setPrefillLoading(false))
  }, [isEditMode, family?._id])


  const sf = (f, v) => setProfile(p => ({ ...p, [f]: v }))
  const smf = (f, v) => setMembers(m => m.map((x, i) => i === activeMember ? { ...x, [f]: v } : x))
  const smfToggle = (f, val) => setMembers(m => m.map((x, i) => {
    if (i !== activeMember) return x
    const has = x[f].includes(val)
    return { ...x, [f]: has ? x[f].filter(g => g !== val) : [...x[f], val] }
  }))

  const addMember = () => {
    setMembers(m => [...m, emptyMember()])
    setActiveMember(members.length)
  }
  const remMember = (idx) => {
    if (members.length <= 1) return
    setMembers(m => m.filter((_, i) => i !== idx))
    setActiveMember(0)
  }

  // Compute BMI for active member
  const cur = members[activeMember] || members[0]
  const bmi = calcBMI(cur?.height, cur?.weight)

  const validateStep = () => {
    if (step === 0) {
      if (!profile.city) return 'Please select a city'
      if (!profile.deliveryType) return 'Please select a delivery location type'
      if (profile.deliveryType === 'individual') {
        if (!profile.apartmentName) return 'Apartment / Building Name is required'
        if (!profile.flatNo) return 'Flat Number is required'
        if (!profile.landmark) return 'Landmark / Street is required'
        if (!profile.pincode || profile.pincode.length < 6) return 'Valid Pincode is required'
      }
      if (profile.deliveryType === 'gated') {
        if (!profile.apartmentName) return 'Please select an apartment or wellness partner'
        if (!profile.flatNo) return 'Flat Number is required'
      }
    }
    if (step === 1) {
      for (const m of members) {
        if (!m.name) return 'Name is required for all members'
        const age = parseInt(m.age || m.dob)
        if (m.age && (parseInt(m.age) < 1 || parseInt(m.age) > 110)) return 'Enter a valid age (1–110)'
      }
    }
    if (step === 2) {
      for (const m of members) {
        if (m.wellnessGoals.length > 3) return `${m.name}: Maximum 3 wellness goals allowed`
      }
    }
    if (step === 3) {
      const missing = members.filter(m => !m.preferredPlan)
      if (missing.length === members.length) return 'Please select a preferred subscription plan'
      if (missing.length > 0) return `Please select a preferred plan for: ${missing.map(m => m.name || 'a member').join(', ')}`
    }
    return null
  }

  // Get Started is disabled on step 3 until every member has a preferredPlan
  const allPlansSelected = members.every(m => !!m.preferredPlan)
  const ctaDisabled = saving || (step === STEPS.length - 1 && !allPlansSelected)

  const next = async () => {
    const err = validateStep()
    if (err) return showToast(err, 'error')

    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
      setActiveMember(0)
      return
    }

    // Final submit
    setSaving(true)
    try {
      if (isEditMode && family?._id) {
        // ── EDIT MODE: update existing family ──────────────────────────────
        const updated = await api.updateFamily(family._id, {
          apartmentId:    profile.apartmentId || undefined,
          apartmentName:  profile.apartmentName,
          towerNo:        profile.towerNo || undefined,
          flatNo:         profile.flatNo,
          address:        profile.deliveryType === 'individual'
            ? [profile.landmark, profile.pincode].filter(Boolean).join(', ')
            : profile.apartmentName,
          city:           profile.city,
          dietPreference: members[0]?.dietType || 'Vegetarian',
        })
        updateFamily(updated.family)

        // Update each existing member; add any new ones
        for (const m of members) {
          if (m._existingId) {
            await api.updateMember(family._id, m._existingId, {
              name:          m.name,
              age:           parseInt(m.age) || null,
              gender:        m.gender,
              wellnessGoals: m.wellnessGoals,
              healthChallenges: m.healthChallenges || [],
              dietaryRestrictions: [
                ...m.dislikedVeg.map(v => `No ${v}`),
                ...m.dislikedFruit.map(v => `No ${v}`),
                ...m.allergies.filter(a => a !== 'None'),
              ],
            })
          } else {
            await api.addMember(family._id, {
              name:          m.name,
              age:           parseInt(m.age) || null,
              gender:        m.gender,
              wellnessGoals: m.wellnessGoals,
              healthChallenges: m.healthChallenges || [],
              dietaryRestrictions: [
                ...m.dislikedVeg.map(v => `No ${v}`),
                ...m.dislikedFruit.map(v => `No ${v}`),
                ...m.allergies.filter(a => a !== 'None'),
              ],
            })
          }
        }

        showToast('Profile updated! ✓', 'success')
        nav('/profile', { replace: true })

      } else {
        // ── NEW REGISTRATION ───────────────────────────────────────────────
        const reg = await api.registerFamily({
          familyName:    `Family-${localStorage.getItem('kp_phone') || 'User'}`,
          email:         profile.email || undefined,
          apartmentId:   profile.apartmentId || undefined,
          apartmentName: profile.apartmentName,
          towerNo:       profile.towerNo || undefined,
          flatNo:        profile.flatNo,
          address:       profile.deliveryType === 'individual'
            ? [profile.landmark, profile.pincode].filter(Boolean).join(', ')
            : profile.apartmentName,
          city:          profile.city,
          dietPreference: members[0]?.dietType || 'Vegetarian',
        })
        updateFamily(reg.family)

        for (const m of members) {
          await api.addMember(reg.family._id, {
            name:          m.name,
            age:           parseInt(m.age) || null,
            gender:        m.gender,
            wellnessGoals: m.wellnessGoals,
            healthChallenges: m.healthChallenges || [],
            dietaryRestrictions: [
              ...m.dislikedVeg.map(v => `No ${v}`),
              ...m.dislikedFruit.map(v => `No ${v}`),
              ...m.allergies.filter(a => a !== 'None'),
            ],
          })
        }

        showToast('Profile saved! 🎉', 'success')
        nav('/home', { replace: true })
      }
    } catch(e) {
      showToast(e.message || 'Setup failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-no-nav" style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', background:'var(--cream)' }}>

      {/* Prefill loading overlay */}
      {prefillLoading && (
        <div style={{ position:'fixed', inset:0, background:'rgba(255,255,255,0.92)', zIndex:100, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
          <div className="spinner" style={{ width:36, height:36 }} />
          <div style={{ fontSize:14, color:'var(--text-light)' }}>Loading your profile…</div>
        </div>
      )}

      {/* Header */}
      <div style={{ background:'var(--green)', padding:'20px 20px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          {(step > 0 || isEditMode) && (
            <button onClick={() => step > 0 ? setStep(s => s - 1) : nav('/profile')} style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'none', color:'#fff', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
          )}
          <div>
            <div style={{ color:'rgba(255,255,255,0.65)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>
              {isEditMode ? 'Edit Profile' : `Step ${step+1} of ${STEPS.length}`}
            </div>
            <div style={{ color:'#fff', fontFamily:'Playfair Display,serif', fontSize:19, fontWeight:600 }}>{STEPS[step]}</div>
          </div>
        </div>
        <div style={{ height:4, background:'rgba(255,255,255,0.2)', borderRadius:2 }}>
          <div style={{ height:'100%', background:'#fff', borderRadius:2, width:`${((step+1)/STEPS.length)*100}%`, transition:'width 0.35s ease' }}/>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'auto', padding:'24px 20px 110px' }} className="slide-up">
        {step === 0 && <Step0 p={profile} sf={sf} />}
        {step === 1 && <Step1 members={members} active={activeMember} setActive={setActiveMember} addMember={addMember} remMember={remMember} smf={smf} />}
        {step === 2 && <Step2 members={members} active={activeMember} setActive={setActiveMember} smfToggle={smfToggle} />}
        {step === 3 && <Step3 members={members} active={activeMember} setActive={setActiveMember} smf={smf} smfToggle={smfToggle} bmi={bmi} cur={cur} />}
      </div>

      {/* CTA */}
      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, padding:'14px 20px 28px', background:'var(--white)', borderTop:'1px solid var(--border)' }}>
        {step === STEPS.length - 1 && !allPlansSelected && !isEditMode && (
          <div style={{ fontSize:12, color:'var(--text-light)', textAlign:'center', marginBottom:8 }}>
            {members.length > 1
              ? `Select a preferred plan for all ${members.length} members to continue`
              : 'Select a preferred subscription plan to continue'}
          </div>
        )}
        <button className="btn btn-primary" onClick={next} disabled={isEditMode ? saving : ctaDisabled}>
          {saving && <span className="spinner" style={{width:18,height:18,borderWidth:2}}/>}
          {saving
            ? 'Saving...'
            : step < STEPS.length - 1
              ? 'Save & Continue →'
              : isEditMode ? 'Save Changes ✓' : 'Get Started 🎉'
          }
        </button>
      </div>
    </div>
  )
}

// ─── STEP 0: Personal & Delivery ─────────────────────────────────────────────
function Step0({ p, sf }) {
  const [cities, setCities]       = useState([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [apts, setApts]           = useState([])
  const [aptSearch, setAptSearch] = useState('')
  const [aptOpen, setAptOpen]     = useState(false)
  const [aptLoading, setAptLoading] = useState(false)

  // Fetch cities from backend on mount
  useEffect(() => {
    api.getCities()
      .then(d => {
        const list = d.cities || []
        setCities(list)
        // Set default city to first in list if not already set
        if (list.length > 0 && !list.includes(p.city)) sf('city', list[0])
      })
      .catch(() => {})
      .finally(() => setCitiesLoading(false))
  }, [])

  // Load apartments when Gated Community is selected
  useEffect(() => {
    if (p.deliveryType !== 'gated') return
    if (apts.length) return
    setAptLoading(true)
    api.getApartments(p.city)
      .then(d => setApts(d.apartments || []))
      .catch(() => {})
      .finally(() => setAptLoading(false))
  }, [p.deliveryType, p.city])

  // Reload apartments when city changes (gated mode)
  useEffect(() => {
    if (p.deliveryType !== 'gated') return
    setApts([])
    setAptLoading(true)
    api.getApartments(p.city)
      .then(d => setApts(d.apartments || []))
      .catch(() => {})
      .finally(() => setAptLoading(false))
  }, [p.city])

  const filteredApts = apts.filter(a =>
    a.apartmentName?.toLowerCase().includes(aptSearch.toLowerCase())
  )

  const selectApt = (apt) => {
    sf('apartmentName', apt.apartmentName)
    sf('apartmentId',   apt.apartmentId || apt._id?.toString() || '')
    sf('city',          apt.city || p.city)
    setAptOpen(false)
    setAptSearch('')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* City */}
      <div>
        <SectionTitle>City</SectionTitle>
        {citiesLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <div className="spinner" style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 13, color: 'var(--text-light)' }}>Loading cities…</span>
          </div>
        ) : (
          <select
            className="input-field"
            style={{ marginTop: 10 }}
            value={p.city}
            onChange={e => sf('city', e.target.value)}
          >
            <option value="">Select city…</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Delivery type toggle */}
      <div>
        <SectionTitle>Delivery Location Type</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:10 }}>
          {[
            { id:'individual', icon:'🏠', label:'Individual Home', sub:'Enter your home address manually' },
            { id:'gated',      icon:'🏘️', label:'Gated Community / Wellness Partner', sub:'Select from our registered apartments' },
          ].map(({ id, icon, label, sub }) => (
            <div key={id} onClick={() => { sf('deliveryType', id); sf('apartmentName',''); sf('apartmentId','') }} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', borderRadius:12, border:`1.5px solid ${p.deliveryType===id?'var(--green)':'var(--border)'}`, background:p.deliveryType===id?'var(--green-pale)':'#fff', cursor:'pointer', transition:'all 0.15s' }}>
              <span style={{ fontSize:24 }}>{icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14, color:p.deliveryType===id?'var(--green)':'var(--text)' }}>{label}</div>
                <div style={{ fontSize:12, color:'var(--text-light)', marginTop:1 }}>{sub}</div>
              </div>
              <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${p.deliveryType===id?'var(--green)':'var(--border)'}`, background:p.deliveryType===id?'var(--green)':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {p.deliveryType===id && <div style={{ width:8, height:8, borderRadius:'50%', background:'#fff' }}/>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── INDIVIDUAL HOME fields ── */}
      {p.deliveryType === 'individual' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <SectionTitle>Address</SectionTitle>
          <Field label="Apartment / Building Name *">
            <input className="input-field" placeholder="e.g. Green Meadows Apartments" value={p.apartmentName} onChange={e => sf('apartmentName', e.target.value)} />
          </Field>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Tower / Block">
              <input className="input-field" placeholder="Block A" value={p.towerNo} onChange={e => sf('towerNo', e.target.value)} />
            </Field>
            <Field label="Flat Number *">
              <input className="input-field" placeholder="B-101" value={p.flatNo} onChange={e => sf('flatNo', e.target.value)} />
            </Field>
          </div>
          <Field label="Landmark / Street *">
            <input className="input-field" placeholder="Near metro / temple, Anna Nagar" value={p.landmark} onChange={e => sf('landmark', e.target.value)} />
          </Field>
          <Field label="Pincode *">
            <input className="input-field" type="tel" inputMode="numeric" maxLength={6} placeholder="641001" value={p.pincode} onChange={e => sf('pincode', e.target.value.replace(/\D/g,''))} />
          </Field>
        </div>
      )}

      {/* ── GATED COMMUNITY fields ── */}
      {p.deliveryType === 'gated' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <SectionTitle>Select Apartment / Wellness Partner</SectionTitle>

          {/* Searchable dropdown trigger */}
          <div style={{ position:'relative' }}>
            <div
              onClick={() => setAptOpen(o => !o)}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', border:`1.5px solid ${p.apartmentName?'var(--green)':'var(--border)'}`, borderRadius:12, background:p.apartmentName?'var(--green-pale)':'#fff', cursor:'pointer', minHeight:48 }}
            >
              <div style={{ flex:1, minWidth:0 }}>
                {p.apartmentName
                  ? <span style={{ fontWeight:600, fontSize:14, color:'var(--green)' }}>{p.apartmentName}</span>
                  : <span style={{ fontSize:14, color:'var(--text-light)' }}>Search apartment or wellness partner…</span>
                }
              </div>
              <span style={{ fontSize:16, color:'var(--text-light)', flexShrink:0, marginLeft:8 }}>{aptOpen ? '▲' : '▼'}</span>
            </div>

            {aptOpen && (
              <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'#fff', border:'1.5px solid var(--green-muted)', borderRadius:14, zIndex:50, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', overflow:'hidden' }}>
                {/* Search box */}
                <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--border)' }}>
                  <input
                    autoFocus
                    className="input-field"
                    style={{ marginBottom:0 }}
                    placeholder="🔍  Type to search…"
                    value={aptSearch}
                    onChange={e => setAptSearch(e.target.value)}
                  />
                </div>

                {/* List */}
                <div style={{ maxHeight:220, overflowY:'auto' }}>
                  {aptLoading ? (
                    <div style={{ padding:'20px', textAlign:'center' }}>
                      <div className="spinner" style={{ width:24, height:24, margin:'0 auto' }} />
                    </div>
                  ) : filteredApts.length === 0 ? (
                    <div style={{ padding:'16px', textAlign:'center', fontSize:13, color:'var(--text-light)' }}>
                      {apts.length === 0 ? 'No registered apartments found for this city' : 'No results match your search'}
                    </div>
                  ) : filteredApts.map((apt, i) => (
                    <div
                      key={apt._id || i}
                      onClick={() => selectApt(apt)}
                      style={{ padding:'12px 14px', borderBottom: i < filteredApts.length - 1 ? '1px solid var(--border)' : 'none', cursor:'pointer', background: p.apartmentName === apt.apartmentName ? 'var(--green-pale)' : '#fff', transition:'background 0.1s' }}
                    >
                      <div style={{ fontWeight:600, fontSize:14, color: p.apartmentName === apt.apartmentName ? 'var(--green)' : 'var(--text)' }}>{apt.apartmentName}</div>
                      {apt.city && <div style={{ fontSize:12, color:'var(--text-light)', marginTop:2 }}>{apt.city}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Flat details after apartment is selected */}
          {p.apartmentName && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Field label="Tower / Block">
                  <input className="input-field" placeholder="Block A" value={p.towerNo} onChange={e => sf('towerNo', e.target.value)} />
                </Field>
                <Field label="Flat Number *">
                  <input className="input-field" placeholder="B-101" value={p.flatNo} onChange={e => sf('flatNo', e.target.value)} />
                </Field>
              </div>
            </>
          )}
        </div>
      )}

      {/* Delivery Preference */}
      <div>
        <SectionTitle>Delivery Preference</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
          {[['Morning','7 AM – 10 AM','🌅'],['Afternoon','10 AM – 1 PM','☀️'],['Evening','4 PM – 7 PM','🌆']].map(([id, time, icon]) => (
            <div key={id} onClick={() => sf('deliveryPreference', id)} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', borderRadius:12, border:`1.5px solid ${p.deliveryPreference===id?'var(--green)':'var(--border)'}`, background:p.deliveryPreference===id?'var(--green-pale)':'#fff', cursor:'pointer', transition:'all 0.15s' }}>
              <span style={{ fontSize:22 }}>{icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14, color:p.deliveryPreference===id?'var(--green)':'var(--text)' }}>{id}</div>
                <div style={{ fontSize:12, color:'var(--text-light)', marginTop:1 }}>{time}</div>
              </div>
              <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${p.deliveryPreference===id?'var(--green)':'var(--border)'}`, background:p.deliveryPreference===id?'var(--green)':'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {p.deliveryPreference===id && <div style={{ width:8, height:8, borderRadius:'50%', background:'#fff' }}/>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── STEP 1: Family Members ───────────────────────────────────────────────────
function Step1({ members, active, setActive, addMember, remMember, smf }) {
  const m = members[active]

  return (
    <div>
      <p style={{ marginBottom:16, fontSize:13, color:'var(--text-light)' }}>Add family members — we'll personalise wellness for each person.</p>

      {/* Member tabs */}
      {members.length > 1 && (
        <div style={{ display:'flex', gap:8, overflowX:'auto', marginBottom:16, paddingBottom:2 }}>
          {members.map((mem, i) => (
            <button key={i} onClick={() => setActive(i)} style={{ flexShrink:0, padding:'6px 14px', borderRadius:50, border:`1.5px solid ${active===i?'var(--green)':'var(--border)'}`, background:active===i?'var(--green)':'#fff', color:active===i?'#fff':'var(--text)', fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
              {mem.name || `Member ${i+1}`}
            </button>
          ))}
        </div>
      )}

      <div className="member-card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div className="member-avatar">{m.gender==='Male'?'👨':'👩'}</div>
            <span style={{ fontWeight:600, fontSize:14 }}>Member {active+1}</span>
          </div>
          {members.length > 1 && (
            <button onClick={() => remMember(active)} style={{ background:'#FEE2E2', border:'none', color:'#DC2626', width:28, height:28, borderRadius:'50%', cursor:'pointer', fontSize:13 }}>✕</button>
          )}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Field label="Relationship">
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {RELATIONSHIPS.map(r => (
                <button key={r} onClick={() => smf('relationship', r)} style={{ padding:'5px 12px', borderRadius:50, fontSize:12, fontWeight:600, border:`1.5px solid ${m.relationship===r?'var(--green)':'var(--border)'}`, background:m.relationship===r?'var(--green)':'#fff', color:m.relationship===r?'#fff':'var(--text)', cursor:'pointer' }}>{r}</button>
              ))}
            </div>
          </Field>

          <Field label="Name *">
            <input className="input-field" placeholder="e.g. Priya" value={m.name} onChange={e => smf('name', e.target.value)} />
          </Field>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Gender">
              <select className="input-field" value={m.gender} onChange={e => smf('gender', e.target.value)}>
                <option>Female</option><option>Male</option>
              </select>
            </Field>
            <Field label="Age (1–110)">
              <input className="input-field" type="number" inputMode="numeric" placeholder="34" min={1} max={110} value={m.age} onChange={e => smf('age', e.target.value)} />
            </Field>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Height (cm)">
              <input className="input-field" type="number" inputMode="decimal" placeholder="165" value={m.height} onChange={e => smf('height', e.target.value)} />
            </Field>
            <Field label="Weight (kg)">
              <input className="input-field" type="number" inputMode="decimal" placeholder="65" value={m.weight} onChange={e => smf('weight', e.target.value)} />
            </Field>
          </div>

          {/* BMI display */}
          {(() => {
            const bmi      = calcBMI(m.height, m.weight)
            const recRange = recommendedWeightRange(m.height)
            const color    = bmiColor(bmi)
            return bmi ? (
              <div style={{ background:'var(--green-pale)', borderRadius:12, padding:'12px 14px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: recRange ? 10 : 0 }}>
                  <div>
                    <div style={{ fontSize:11, color:'var(--text-light)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.4 }}>BMI</div>
                    <div style={{ fontWeight:700, fontSize:22, color, marginTop:2 }}>{bmi}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <span style={{ background: color, color:'#fff', padding:'4px 12px', borderRadius:50, fontSize:12, fontWeight:700 }}>{bmiCategory(bmi)}</span>
                  </div>
                </div>
                {recRange && (
                  <div style={{ borderTop:'1px solid rgba(45,106,53,0.15)', paddingTop:8, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ fontSize:11, color:'var(--text-light)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.4 }}>Recommended Weight</div>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--green)' }}>{recRange}</div>
                  </div>
                )}
              </div>
            ) : null
          })()}

          <Field label="Activity Level">
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {['Sedentary','Lightly Active','Moderately Active','Highly Active'].map(al => (
                <div key={al} onClick={() => smf('activityLevel', al)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, border:`1.5px solid ${m.activityLevel===al?'var(--green)':'var(--border)'}`, background:m.activityLevel===al?'var(--green-pale)':'#fff', cursor:'pointer' }}>
                  <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${m.activityLevel===al?'var(--green)':'var(--border)'}`, background:m.activityLevel===al?'var(--green)':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {m.activityLevel===al && <div style={{ width:7, height:7, borderRadius:'50%', background:'#fff' }}/>}
                  </div>
                  <span style={{ fontSize:13, fontWeight:m.activityLevel===al?600:400, color:m.activityLevel===al?'var(--green)':'var(--text)' }}>{al}</span>
                </div>
              ))}
            </div>
          </Field>
        </div>
      </div>

      <button className="btn btn-secondary" onClick={addMember} style={{ marginTop:12 }}>+ Add Another Member</button>
    </div>
  )
}

// ─── STEP 2: Wellness Goals ───────────────────────────────────────────────────
function Step2({ members, active, setActive, smfToggle }) {
  const m = members[active]
  const goalsCount = m?.wellnessGoals?.length || 0

  return (
    <div>
      <p style={{ marginBottom:4, fontSize:13, color:'var(--text-light)' }}>Choose up to 3 wellness goals per member</p>

      {/* Member tabs */}
      {members.length > 1 && (
        <div style={{ display:'flex', gap:8, overflowX:'auto', margin:'12px 0', paddingBottom:2 }}>
          {members.map((mem, i) => {
            const cnt = mem.wellnessGoals?.length || 0
            return (
              <button key={i} onClick={() => setActive(i)} style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:50, border:`1.5px solid ${active===i?'var(--green)':'var(--border)'}`, background:active===i?'var(--green)':'#fff', color:active===i?'#fff':'var(--text)', fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                {mem.name || `Member ${i+1}`}
                {cnt > 0 && <span style={{ background:active===i?'rgba(255,255,255,0.3)':'var(--green)', color:'#fff', borderRadius:50, padding:'0 5px', fontSize:10 }}>{cnt}</span>}
              </button>
            )
          })}
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <span style={{ fontWeight:600, fontSize:14 }}>{m?.name || 'Member'}</span>
        <span style={{ fontSize:12, color: goalsCount >= 3 ? '#DC2626' : 'var(--text-light)' }}>{goalsCount}/3 selected</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {WELLNESS_GOALS.map(g => {
          const sel = m?.wellnessGoals?.includes(g.id) || false
          const disabled = !sel && goalsCount >= 3
          return (
            <div key={g.id}
              onClick={() => !disabled && smfToggle('wellnessGoals', g.id)}
              style={{
                position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                padding:'12px 8px 10px', gap:6,
                background: sel ? 'var(--green-pale)' : '#fff',
                border:`1.5px solid ${sel ? 'var(--green)' : 'var(--border)'}`,
                borderRadius:12, minHeight:80,
                opacity: disabled ? 0.35 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
                transition:'all 0.15s',
              }}>
              {sel && (
                <div style={{ position:'absolute', top:6, right:6, width:16, height:16, borderRadius:'50%', background:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ color:'#fff', fontSize:9, fontWeight:900, lineHeight:1 }}>✓</span>
                </div>
              )}
              <div style={{ width:34, height:34, borderRadius:10, background: sel ? 'rgba(45,106,53,0.12)' : g.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>{g.icon}</div>
              <div style={{ fontSize:11, fontWeight:600, color: sel ? 'var(--green)' : 'var(--text)', textAlign:'center', lineHeight:1.3 }}>{g.label}</div>
            </div>
          )
        })}
      </div>

      {/* Health challenges */}
      <div style={{ marginTop:20 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>Current Health Challenges</div>
        <div style={{ fontSize:12, color:'var(--text-light)', marginBottom:10 }}>Optional — helps us personalise better</div>
        <SearchChipSelect
          items={HEALTH_CHALLENGES}
          selected={m?.healthChallenges || []}
          onToggle={(hc) => smfToggle('healthChallenges', hc)}
          placeholder="Search challenges…"
        />
      </div>
    </div>
  )
}

// ─── STEP 3: Food Preferences ─────────────────────────────────────────────────
function Step3({ members, active, setActive, smf, smfToggle }) {
  const m = members[active]
  const [plans, setPlans]           = useState([])
  const [plansLoading, setPlansLoading] = useState(true)

  useEffect(() => {
    api.getPlans()
      .then(d => setPlans(d.plans || []))
      .catch(() => {})
      .finally(() => setPlansLoading(false))
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Member tabs */}
      {members.length > 1 && (
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:2 }}>
          {members.map((mem, i) => (
            <button key={i} onClick={() => setActive(i)} style={{ flexShrink:0, padding:'6px 14px', borderRadius:50, border:`1.5px solid ${active===i?'var(--green)':'var(--border)'}`, background:active===i?'var(--green)':'#fff', color:active===i?'#fff':'var(--text)', fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
              {mem.name || `Member ${i+1}`}
            </button>
          ))}
        </div>
      )}

      {/* Diet Type */}
      <div>
        <SectionTitle>Diet Type</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
          {['Vegetarian','Eggetarian','Non-Vegetarian'].map(dt => (
            <div key={dt} onClick={() => smf('dietType', dt)} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:12, border:`1.5px solid ${m?.dietType===dt?'var(--green)':'var(--border)'}`, background:m?.dietType===dt?'var(--green-pale)':'#fff', cursor:'pointer' }}>
              <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${m?.dietType===dt?'var(--green)':'var(--border)'}`, background:m?.dietType===dt?'var(--green)':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {m?.dietType===dt && <div style={{ width:7, height:7, borderRadius:'50%', background:'#fff' }}/>}
              </div>
              <span style={{ fontSize:14, fontWeight:m?.dietType===dt?600:400 }}>{dt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vegetable / Fruit Restriction gate */}
      <div>
        <SectionTitle>Vegetable / Fruit Restrictions</SectionTitle>
        <div style={{ fontSize:12, color:'var(--text-light)', marginBottom:12, marginTop:4 }}>
          Do you have any vegetable or fruit restrictions?
        </div>
        <div style={{ display:'flex', gap:10, marginBottom:16 }}>
          {[['yes', 'Yes, I have restrictions', true], ['no', 'No restrictions', false]].map(([val, label, boolVal]) => {
            const sel = m?.hasVegFruitRestriction === boolVal
            return (
              <div key={val} onClick={() => {
                smf('hasVegFruitRestriction', boolVal)
                if (!boolVal) {
                  smf('dislikedVeg', [])
                  smf('dislikedFruit', [])
                }
              }} style={{ flex:1, display:'flex', alignItems:'center', gap:10, padding:'11px 13px', borderRadius:12, border:`1.5px solid ${sel?'var(--green)':'var(--border)'}`, background:sel?'var(--green-pale)':'#fff', cursor:'pointer', transition:'all 0.15s' }}>
                <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${sel?'var(--green)':'var(--border)'}`, background:sel?'var(--green)':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {sel && <div style={{ width:7, height:7, borderRadius:'50%', background:'#fff' }}/>}
                </div>
                <span style={{ fontSize:13, fontWeight:sel?600:400, color:sel?'var(--green)':'var(--text)', lineHeight:1.3 }}>{label}</span>
              </div>
            )
          })}
        </div>

        {/* Only show lists when user says Yes */}
        {m?.hasVegFruitRestriction === true && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Disliked Vegetables */}
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:'var(--text)', marginBottom:4 }}>Disliked Vegetables</div>
              <div style={{ fontSize:11, color:'var(--text-light)', marginBottom:10 }}>Select items to avoid — these will be excluded from your basket</div>
              <SearchChipSelect
                items={DISLIKED_VEG}
                selected={m?.dislikedVeg || []}
                onToggle={(v) => smfToggle('dislikedVeg', v)}
                placeholder="Search vegetables…"
              />
            </div>

            {/* Fruit Restrictions */}
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:'var(--text)', marginBottom:4 }}>Fruit Restrictions</div>
              <div style={{ fontSize:11, color:'var(--text-light)', marginBottom:10 }}>Select fruits to avoid</div>
              <SearchChipSelect
                items={DISLIKED_FRU}
                selected={m?.dislikedFruit || []}
                onToggle={(f) => smfToggle('dislikedFruit', f)}
                placeholder="Search fruits…"
              />
            </div>

          </div>
        )}
      </div>

      {/* Taste profile */}
      <div>
        <SectionTitle>Preferred Taste</SectionTitle>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10 }}>
          {TASTE_PREFS.map(t => {
            const sel = m?.tastePref?.includes(t) || false
            return <ToggleChip key={t} label={t} selected={sel} onToggle={() => smfToggle('tastePref', t)} />
          })}
        </div>
      </div>

      {/* Cooking preference */}
      <div>
        <SectionTitle>Cooking Preference</SectionTitle>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10 }}>
          {COOK_PREFS.map(c => {
            const sel = m?.cookPref?.includes(c) || false
            return <ToggleChip key={c} label={c} selected={sel} onToggle={() => smfToggle('cookPref', c)} />
          })}
        </div>
      </div>

      {/* Microgreens */}
      <div>
        <SectionTitle>Microgreens Preference</SectionTitle>
        <div style={{ fontSize:12, color:'var(--text-light)', marginBottom:10 }}>Experience level</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
          {['New User','Occasionally Uses','Regular User'].map(ex => (
            <button key={ex} onClick={() => smf('microgreenExperience', ex)} style={{ padding:'6px 14px', borderRadius:50, fontSize:12, fontWeight:600, border:`1.5px solid ${m?.microgreenExperience===ex?'var(--green)':'var(--border)'}`, background:m?.microgreenExperience===ex?'var(--green)':'#fff', color:m?.microgreenExperience===ex?'#fff':'var(--text)', cursor:'pointer' }}>{ex}</button>
          ))}
        </div>
        <div style={{ fontSize:12, color:'var(--text-light)', marginBottom:8 }}>Interested in</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {MICROGREEN_TYPES.map(mg => {
            const sel = m?.microgreenInterest?.includes(mg) || false
            return <ToggleChip key={mg} label={mg} selected={sel} onToggle={() => smfToggle('microgreenInterest', mg)} />
          })}
        </div>
      </div>

      {/* Allergies */}
      <div>
        <SectionTitle>Allergies & Restrictions</SectionTitle>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:10 }}>
          {ALLERGIES.map(a => {
            const sel = m?.allergies?.includes(a) || false
            return <ToggleChip key={a} label={a} selected={sel} onToggle={() => smfToggle('allergies', a)} />
          })}
        </div>
      </div>

      {/* Subscription preference */}
      <div>
        <SectionTitle>Preferred Plan</SectionTitle>
        <div style={{ fontSize:12, color:'var(--text-light)', marginBottom:10 }}>We'll suggest the right subscription for you</div>
        {plansLoading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 0' }}>
            <div className="spinner" style={{ width:24, height:24 }} />
          </div>
        ) : plans.length === 0 ? (
          <div style={{ fontSize:13, color:'var(--text-light)', padding:'12px 0' }}>No plans available at the moment</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {plans.map(plan => {
              const sel = m?.preferredPlan === plan.planId
              const durationLabel = plan.duration === 1 ? 'Daily'
                : plan.duration === 7  ? '7 Days'
                : plan.duration === 15 ? '15 Days'
                : plan.duration === 30 ? '30 Days'
                : `${plan.duration} Days`
              return (
                <div key={plan.planId} onClick={() => smf('preferredPlan', plan.planId)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, border:`1.5px solid ${sel?'var(--green)':'var(--border)'}`, background:sel?'var(--green-pale)':'#fff', cursor:'pointer', transition:'all 0.15s' }}>
                  <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${sel?'var(--green)':'var(--border)'}`, background:sel?'var(--green)':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {sel && <div style={{ width:7, height:7, borderRadius:'50%', background:'#fff' }}/>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:sel?'var(--green)':'var(--text)' }}>{plan.planName}</div>
                    <div style={{ fontSize:11, color:'var(--text-light)', marginTop:1 }}>{plan.description || durationLabel}</div>
                  </div>
                  {plan.price && (
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:sel?'var(--green)':'var(--text)' }}>₹{plan.price}</div>
                      {plan.duration && <div style={{ fontSize:10, color:'var(--text-light)', marginTop:1 }}>{durationLabel}</div>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Budget */}
      <div>
        <SectionTitle>Monthly Wellness Budget</SectionTitle>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
          {['Under ₹1,000','₹1,000 – ₹2,000','₹2,000 – ₹4,000','Above ₹4,000'].map(b => {
            const sel = m?.budget === b
            return (
              <div key={b} onClick={() => smf('budget', b)} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:12, border:`1.5px solid ${sel?'var(--green)':'var(--border)'}`, background:sel?'var(--green-pale)':'#fff', cursor:'pointer' }}>
                <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${sel?'var(--green)':'var(--border)'}`, background:sel?'var(--green)':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {sel && <div style={{ width:7, height:7, borderRadius:'50%', background:'#fff' }}/>}
                </div>
                <span style={{ fontSize:13, fontWeight:sel?600:400 }}>{b}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── SHARED HELPERS ───────────────────────────────────────────────────────────
function SectionTitle({ children, style }) {
  return <div style={{ fontWeight:700, fontSize:13, color:'var(--green)', textTransform:'uppercase', letterSpacing:0.5, ...style }}>{children}</div>
}

function Field({ label, children }) {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      {children}
    </div>
  )
}

function ToggleChip({ label, selected, onToggle }) {
  return (
    <button onClick={onToggle} style={{ padding:'6px 12px', borderRadius:50, fontSize:12, fontWeight:600, border:`1.5px solid ${selected?'var(--green)':'var(--border)'}`, background:selected?'var(--green)':'#fff', color:selected?'#fff':'var(--text)', cursor:'pointer', transition:'all 0.15s' }}>
      {selected ? '✓ ' : ''}{label}
    </button>
  )
}

function SearchChipSelect({ items, selected, onToggle, placeholder = 'Search…' }) {
  const [q, setQ] = useState('')
  const filtered = items.filter(i => i.toLowerCase().includes(q.toLowerCase()))
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {/* Search box */}
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, pointerEvents:'none' }}>🔍</span>
        <input
          className="input-field"
          style={{ paddingLeft:36 }}
          placeholder={placeholder}
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {selected.map(s => (
            <span
              key={s}
              onClick={() => onToggle(s)}
              style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:50, fontSize:12, fontWeight:600, background:'var(--green)', color:'#fff', cursor:'pointer' }}
            >
              {s}
              <span style={{ fontSize:10, opacity:0.8 }}>✕</span>
            </span>
          ))}
        </div>
      )}
      {/* Unselected filtered items */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {filtered.filter(i => !selected.includes(i)).map(item => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            style={{ padding:'6px 14px', borderRadius:50, fontSize:12, fontWeight:500, border:'1.5px solid var(--border)', background:'#fff', color:'var(--text)', cursor:'pointer', transition:'all 0.15s', fontFamily:'var(--font-body)' }}
          >
            {item}
          </button>
        ))}
        {filtered.filter(i => !selected.includes(i)).length === 0 && q && (
          <div style={{ fontSize:12, color:'var(--text-light)', padding:'4px 0' }}>No results for "{q}"</div>
        )}
      </div>
    </div>
  )
}
