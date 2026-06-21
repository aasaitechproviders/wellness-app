import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const DISLIKED_VEG = ['Bitter Gourd','Brinjal','Radish','Turnip','Raw Papaya','Pumpkin']
const DISLIKED_FRU = ['Banana','Mango','Grapes','Pineapple']
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
  return 'Senior Citizen'
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
    dislikedVeg: [], dislikedFruit: [],
    tastePref: [], cookPref: [],
    microgreenExperience: 'New User',
    microgreenInterest: [],
    allergies: [],
  }
}

export default function Setup() {
  const { updateFamily } = useAuth()
  const nav = useNavigate()
  const [step, setStep]   = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 0: profile
  const [profile, setProfile] = useState({
    familyName: '', email: '',
    apartmentName: '', towerNo: '', flatNo: '', landmark: '', pincode: '',
    city: 'Coimbatore',
    deliveryPreference: 'Morning',
  })

  // Steps 1-3: members
  const [members, setMembers] = useState([emptyMember()])
  const [activeMember, setActiveMember] = useState(0)  // which member to edit in steps 1-3

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
      if (!profile.familyName) return 'Full Name is required'
      if (!profile.apartmentName) return 'Apartment Name is required'
      if (!profile.flatNo) return 'Flat Number is required'
      if (!profile.pincode || profile.pincode.length < 6) return 'Valid Pincode is required'
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
    return null
  }

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
      const reg = await api.registerFamily({
        familyName:    profile.familyName,
        email:         profile.email || undefined,
        apartmentName: profile.apartmentName,
        towerNo:       profile.towerNo || undefined,
        flatNo:        profile.flatNo,
        address:       [profile.landmark, profile.pincode].filter(Boolean).join(', ') || profile.apartmentName,
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
          dietaryRestrictions: [
            ...m.dislikedVeg.map(v => `No ${v}`),
            ...m.dislikedFruit.map(v => `No ${v}`),
            ...m.allergies.filter(a => a !== 'None'),
          ],
        })
      }

      showToast('Profile saved! 🎉', 'success')
      nav('/home', { replace: true })
    } catch(e) {
      showToast(e.message || 'Setup failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-no-nav" style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', background:'var(--cream)' }}>
      {/* Header */}
      <div style={{ background:'var(--green)', padding:'20px 20px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'none', color:'#fff', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
          )}
          <div>
            <div style={{ color:'rgba(255,255,255,0.65)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>Step {step+1} of {STEPS.length}</div>
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
        <button className="btn btn-primary" onClick={next} disabled={saving}>
          {saving && <span className="spinner" style={{width:18,height:18,borderWidth:2}}/>}
          {saving ? 'Saving...' : (step < STEPS.length - 1 ? 'Save & Continue →' : 'Get Started 🎉')}
        </button>
      </div>
    </div>
  )
}

// ─── STEP 0: Personal & Delivery ─────────────────────────────────────────────
function Step0({ p, sf }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <SectionTitle>Primary Customer</SectionTitle>
      <Field label="Full Name *">
        <input className="input-field" placeholder="e.g. Priya Sharma" value={p.familyName} onChange={e => sf('familyName', e.target.value)} />
      </Field>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="Mobile Number">
          <input className="input-field" value={localStorage.getItem('kp_phone') || ''} readOnly style={{ background:'#f5f5f5' }} />
        </Field>
        <Field label="Email Address">
          <input className="input-field" type="email" placeholder="priya@email.com" value={p.email} onChange={e => sf('email', e.target.value)} />
        </Field>
      </div>

      <SectionTitle style={{ marginTop:8 }}>Address</SectionTitle>
      <Field label="City *">
        <select className="input-field" value={p.city} onChange={e => sf('city', e.target.value)}>
          <option>Coimbatore</option>
          <option>Chennai</option>
        </select>
      </Field>
      <Field label="Apartment Name *">
        <input className="input-field" placeholder="e.g. Green Meadows" value={p.apartmentName} onChange={e => sf('apartmentName', e.target.value)} />
      </Field>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="Tower / Block">
          <input className="input-field" placeholder="Block A" value={p.towerNo} onChange={e => sf('towerNo', e.target.value)} />
        </Field>
        <Field label="Flat Number *">
          <input className="input-field" placeholder="B-101" value={p.flatNo} onChange={e => sf('flatNo', e.target.value)} />
        </Field>
      </div>
      <Field label="Landmark">
        <input className="input-field" placeholder="Near metro / temple" value={p.landmark} onChange={e => sf('landmark', e.target.value)} />
      </Field>
      <Field label="Pincode *">
        <input className="input-field" type="tel" inputMode="numeric" maxLength={6} placeholder="641001" value={p.pincode} onChange={e => sf('pincode', e.target.value.replace(/\D/g,''))} />
      </Field>

      <SectionTitle style={{ marginTop:8 }}>Delivery Preference</SectionTitle>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
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
            <div className="member-avatar">{m.gender==='Male'?'👨':m.gender==='Child'?'👶':'👩'}</div>
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
                <option>Female</option><option>Male</option><option>Child</option>
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
            const bmi = calcBMI(m.height, m.weight)
            return bmi ? (
              <div style={{ background:'var(--green-pale)', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:11, color:'var(--text-light)', fontWeight:600, textTransform:'uppercase' }}>BMI</div>
                  <div style={{ fontWeight:700, fontSize:20, color:'var(--green)', fontFamily:'Playfair Display,serif' }}>{bmi}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:12, color:'var(--text-mid)' }}>{bmiCategory(bmi)}</div>
                  {m.age && <div style={{ fontSize:11, color:'var(--text-light)', marginTop:2 }}>Life Stage: {lifeStageFromAge(m.age)}</div>}
                </div>
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

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {WELLNESS_GOALS.map(g => {
          const sel = m?.wellnessGoals?.includes(g.id) || false
          const disabled = !sel && goalsCount >= 3
          return (
            <div key={g.id}
              onClick={() => !disabled && smfToggle('wellnessGoals', g.id)}
              style={{
                position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                padding:'18px 10px 14px', gap:8,
                background: sel ? 'var(--green-pale)' : '#fff',
                border:`1.5px solid ${sel ? 'var(--green)' : 'var(--border)'}`,
                borderRadius:14, minHeight:100,
                opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
                transition:'all 0.15s',
              }}>
              <div style={{ position:'absolute', top:7, right:7, width:19, height:19, borderRadius:'50%', background: sel ? 'var(--green)' : 'transparent', border:`1.5px solid ${sel ? 'var(--green)' : 'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                {sel && <span style={{ color:'#fff', fontSize:10, fontWeight:900, lineHeight:1 }}>✓</span>}
              </div>
              <div style={{ width:44, height:44, borderRadius:12, background: sel ? 'rgba(45,106,53,0.1)' : g.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{g.icon}</div>
              <div style={{ fontSize:12, fontWeight:600, color: sel ? 'var(--green)' : 'var(--text)', textAlign:'center', lineHeight:1.3 }}>{g.label}</div>
            </div>
          )
        })}
      </div>

      {/* Health challenges */}
      <div style={{ marginTop:20 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>Current Health Challenges</div>
        <div style={{ fontSize:12, color:'var(--text-light)', marginBottom:10 }}>Optional — helps us personalise better</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {HEALTH_CHALLENGES.map(hc => {
            const sel = m?.healthChallenges?.includes(hc) || false
            return (
              <button key={hc} onClick={() => smfToggle('healthChallenges', hc)} style={{ padding:'6px 12px', borderRadius:50, fontSize:12, fontWeight:600, border:`1.5px solid ${sel?'var(--green)':'var(--border)'}`, background:sel?'var(--green)':'#fff', color:sel?'#fff':'var(--text)', cursor:'pointer' }}>{hc}</button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── STEP 3: Food Preferences ─────────────────────────────────────────────────
function Step3({ members, active, setActive, smf, smfToggle }) {
  const m = members[active]

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
          {['Vegetarian','Eggetarian','Non-Vegetarian','Vegan'].map(dt => (
            <div key={dt} onClick={() => smf('dietType', dt)} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:12, border:`1.5px solid ${m?.dietType===dt?'var(--green)':'var(--border)'}`, background:m?.dietType===dt?'var(--green-pale)':'#fff', cursor:'pointer' }}>
              <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${m?.dietType===dt?'var(--green)':'var(--border)'}`, background:m?.dietType===dt?'var(--green)':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {m?.dietType===dt && <div style={{ width:7, height:7, borderRadius:'50%', background:'#fff' }}/>}
              </div>
              <span style={{ fontSize:14, fontWeight:m?.dietType===dt?600:400 }}>{dt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disliked vegetables */}
      <div>
        <SectionTitle>Disliked Vegetables</SectionTitle>
        <div style={{ fontSize:12, color:'var(--text-light)', marginBottom:10 }}>These will be avoided in your basket</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {DISLIKED_VEG.map(v => {
            const sel = m?.dislikedVeg?.includes(v) || false
            return <ToggleChip key={v} label={v} selected={sel} onToggle={() => smfToggle('dislikedVeg', v)} />
          })}
        </div>
      </div>

      {/* Disliked fruits */}
      <div>
        <SectionTitle>Fruit Restrictions</SectionTitle>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {DISLIKED_FRU.map(f => {
            const sel = m?.dislikedFruit?.includes(f) || false
            return <ToggleChip key={f} label={`Avoid ${f}`} selected={sel} onToggle={() => smfToggle('dislikedFruit', f)} />
          })}
        </div>
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
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[['One-Time Trial','Try before subscribing'],['Daily','Fresh produce every day'],['Alternate Days','Every other day'],['Weekly Wellness Basket','Our most popular plan'],['Twice Weekly','Twice a week delivery'],['Monthly Wellness Subscription','Best value plan']].map(([id, sub]) => {
            const sel = m?.preferredPlan === id
            return (
              <div key={id} onClick={() => smf('preferredPlan', id)} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:12, border:`1.5px solid ${sel?'var(--green)':'var(--border)'}`, background:sel?'var(--green-pale)':'#fff', cursor:'pointer' }}>
                <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${sel?'var(--green)':'var(--border)'}`, background:sel?'var(--green)':'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {sel && <div style={{ width:7, height:7, borderRadius:'50%', background:'#fff' }}/>}
                </div>
                <div>
                  <div style={{ fontWeight:600, fontSize:13, color:sel?'var(--green)':'var(--text)' }}>{id}</div>
                  <div style={{ fontSize:11, color:'var(--text-light)', marginTop:1 }}>{sub}</div>
                </div>
              </div>
            )
          })}
        </div>
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
