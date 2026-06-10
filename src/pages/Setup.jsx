import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { showToast } from '../components/Toast'

const WELLNESS_GOALS = [
  { id:'Immunity Support',   icon:'🛡️', label:'Immunity' },
  { id:'Iron Support',       icon:'💪', label:'Iron Support' },
  { id:'Protein Support',    icon:'⚡', label:'Protein Support' },
  { id:'Weight Management',  icon:'⚖️', label:'Weight Management' },
  { id:'Diabetes Control',   icon:'💧', label:'Diabetes Control' },
  { id:'Heart Wellness',     icon:'❤️', label:'Heart Wellness' },
  { id:'Digestive Wellness', icon:'🌀', label:'Gut Health' },
  { id:'Detox',              icon:'✨', label:'Detox' },
  { id:'Kids Nutrition',     icon:'😊', label:'Kids Nutrition' },
  { id:'Senior Wellness',    icon:'👴', label:'Senior Wellness' },
]
const STEPS = ['Your Profile', 'Family Members', 'Wellness Goals']

export default function Setup() {
  const { updateFamily } = useAuth()
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({ familyName:'', age:'', dietPreference:'Vegetarian', apartmentName:'', flatNo:'', towerNo:'', address:'', city:'Coimbatore' })
  const [members, setMembers] = useState([{ tempId:1, name:'', age:'', gender:'Female', wellnessGoals:[] }])

  const sf = (f,v) => setProfile(p=>({...p,[f]:v}))
  const addMember = () => setMembers(m=>[...m,{ tempId:Date.now(), name:'', age:'', gender:'Female', wellnessGoals:[] }])
  const remMember = id => setMembers(m=>m.filter(x=>x.tempId!==id))
  const smf = (id,f,v) => setMembers(m=>m.map(x=>x.tempId===id?{...x,[f]:v}:x))
  const toggleGoal = (id,g) => setMembers(m=>m.map(x=>{
    if(x.tempId!==id) return x
    const has=x.wellnessGoals.includes(g)
    return {...x, wellnessGoals: has?x.wellnessGoals.filter(gg=>gg!==g):[...x.wellnessGoals,g]}
  }))

  const next = async () => {
    if(step===0){
      if(!profile.familyName||!profile.apartmentName||!profile.flatNo||!profile.address)
        return showToast('Please fill all required fields','error')
      setStep(1)
    } else if(step===1){
      if(members.some(m=>!m.name)) return showToast('Enter name for all members','error')
      setStep(2)
    } else {
      setSaving(true)
      try {
        const reg = await api.registerFamily({...profile})
        updateFamily(reg.family)
        for(const m of members){
          await api.addMember(reg.family._id,{ name:m.name, age:parseInt(m.age)||null, gender:m.gender, wellnessGoals:m.wellnessGoals })
        }
        showToast('Profile saved! 🎉','success')
        nav('/home',{replace:true})
      } catch(e){ showToast(e.message||'Setup failed','error')
      } finally { setSaving(false) }
    }
  }

  return (
    <div className="page-no-nav" style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', background:'var(--cream)' }}>
      {/* Header */}
      <div style={{ background:'var(--green)', padding:'20px 20px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{ width:34,height:34,borderRadius:'50%',background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>←</button>}
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
        {step===0 && <ProfileStep p={profile} sf={sf}/>}
        {step===1 && <MembersStep members={members} addMember={addMember} remMember={remMember} smf={smf}/>}
        {step===2 && <GoalsStep members={members} toggleGoal={toggleGoal}/>}
      </div>

      {/* CTA */}
      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, padding:'14px 20px 28px', background:'var(--white)', borderTop:'1px solid var(--border)' }}>
        <button className="btn btn-primary" onClick={next} disabled={saving}>
          {saving&&<span className="spinner" style={{width:18,height:18,borderWidth:2}}/>}
          {saving?'Saving...':(step<2?'Save & Continue →':'Get Started 🎉')}
        </button>
      </div>
    </div>
  )
}

function ProfileStep({p,sf}){
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <p style={{ marginBottom:4 }}>Add your details to help us understand you better</p>
      <div className="input-group"><label className="input-label">Name *</label><input className="input-field" placeholder="e.g. Priya" value={p.familyName} onChange={e=>sf('familyName',e.target.value)}/></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="input-group"><label className="input-label">Mobile Number</label><input className="input-field" value={localStorage.getItem('kp_phone')||''} readOnly style={{ background:'#f5f5f5' }}/></div>
        <div className="input-group"><label className="input-label">Age</label><input className="input-field" type="number" placeholder="34" min={1} max={100} value={p.age} onChange={e=>sf('age',e.target.value)}/></div>
      </div>
      <div className="input-group"><label className="input-label">Location / City *</label>
        <select className="input-field" value={p.city} onChange={e=>sf('city',e.target.value)}>
          <option>Coimbatore</option><option>Chennai</option>
        </select>
      </div>
      <div className="input-group"><label className="input-label">Apartment Name *</label><input className="input-field" placeholder="e.g. Green Meadows" value={p.apartmentName} onChange={e=>sf('apartmentName',e.target.value)}/></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="input-group"><label className="input-label">Flat No. *</label><input className="input-field" placeholder="B-101" value={p.flatNo} onChange={e=>sf('flatNo',e.target.value)}/></div>
        <div className="input-group"><label className="input-label">Tower / Block</label><input className="input-field" placeholder="Block A" value={p.towerNo} onChange={e=>sf('towerNo',e.target.value)}/></div>
      </div>
      <div className="input-group"><label className="input-label">Full Address *</label><input className="input-field" placeholder="Street, Locality" value={p.address} onChange={e=>sf('address',e.target.value)}/></div>
      <div className="input-group"><label className="input-label">Diet Preference</label>
        <select className="input-field" value={p.dietPreference} onChange={e=>sf('dietPreference',e.target.value)}>
          <option>Vegetarian</option><option>Vegan</option><option>Non-Vegetarian</option>
        </select>
      </div>
      <div className="input-group"><label className="input-label">Family Members</label>
        <input className="input-field" type="number" placeholder="e.g. 4" min={1}/>
      </div>
    </div>
  )
}

function MembersStep({members,addMember,remMember,smf}){
  return (
    <div>
      <p style={{ marginBottom:18 }}>Add family members — we'll personalise wellness for each person.</p>
      {members.map((m,i)=>(
        <div key={m.tempId} className="member-card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div className="member-avatar">{m.gender==='Male'?'👨':m.gender==='Child'?'👶':'👩'}</div>
              <span style={{ fontWeight:600, fontSize:14 }}>Member {i+1}</span>
            </div>
            {members.length>1&&<button onClick={()=>remMember(m.tempId)} style={{ background:'#FEE2E2',border:'none',color:'#DC2626',width:28,height:28,borderRadius:'50%',cursor:'pointer',fontSize:13 }}>✕</button>}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div className="input-group"><label className="input-label">Name *</label><input className="input-field" placeholder="e.g. Priya" value={m.name} onChange={e=>smf(m.tempId,'name',e.target.value)}/></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="input-group"><label className="input-label">Age</label><input className="input-field" type="number" placeholder="34" value={m.age} onChange={e=>smf(m.tempId,'age',e.target.value)}/></div>
              <div className="input-group"><label className="input-label">Gender</label>
                <select className="input-field" value={m.gender} onChange={e=>smf(m.tempId,'gender',e.target.value)}>
                  <option>Female</option><option>Male</option><option>Child</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button className="btn btn-secondary" onClick={addMember} style={{ marginTop:4 }}>+ Add Another Member</button>
    </div>
  )
}

function GoalsStep({members,toggleGoal}){
  return (
    <div>
      <p style={{ marginBottom:18 }}>Choose the health goals that matter to you and your family</p>
      {members.map(m=>(
        <div key={m.tempId} style={{ marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div className="member-avatar" style={{ width:34,height:34,fontSize:16 }}>{m.gender==='Male'?'👨':m.gender==='Child'?'👶':'👩'}</div>
            <span style={{ fontWeight:600, fontSize:15 }}>{m.name||'Member'}</span>
            {m.wellnessGoals.length>0&&<span className="badge">{m.wellnessGoals.length}</span>}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {WELLNESS_GOALS.map(g=>{
              const sel = m.wellnessGoals.includes(g.id)
              return (
                <div key={g.id} className={`goal-card${sel?' selected':''}`} onClick={()=>toggleGoal(m.tempId,g.id)}>
                  <div className="check">{sel?'✓':''}</div>
                  <div className="goal-card-icon">{g.icon}</div>
                  <div className="goal-card-label">{g.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
