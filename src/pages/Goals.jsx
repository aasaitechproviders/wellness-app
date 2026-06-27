import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { showToast } from '../components/Toast'
import BottomNav from '../components/BottomNav'
import logo from '../assets/logo.png'

const GOALS_META = [
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

// HC_LIST is loaded from DB via api.getHealthChallenges()
const initials = (n='') => n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()

export default function Goals() {
  const { family, updateFamily } = useAuth()
  const nav = useNavigate()
  const [apiGoals, setApiGoals] = useState([])
  const [apiHC,    setApiHC]    = useState([])
  const [members,  setMembers]  = useState([])
  const [local,    setLocal]    = useState({})
  const [hcLocal,  setHcLocal]  = useState({})
  const [hcQ,      setHcQ]      = useState('')
  const [active,   setActive]   = useState(0)
  const [saving,   setSaving]   = useState(false)

  useEffect(()=>{
    api.getGoals().then(d=>setApiGoals(d.goals||[])).catch(()=>{})
    api.getHealthChallenges().then(d=>setApiHC(d.challenges||[])).catch(()=>{})
    if(family?._id) api.getFamily(family._id).then(d=>{
      const m=d.family?.members||[]; setMembers(m)
      const init={}; m.forEach(x=>{init[x.memberId]=(x.wellnessGoals||[]).slice(0,3)})
      setLocal(init)
    })
  },[family])

  const toggle = (mid,gn) => setLocal(p=>{
    const c=p[mid]||[]
    if(!c.includes(gn)&&c.length>=3){showToast('Maximum 3 goals per member','error');return p}
    return {...p,[mid]:c.includes(gn)?c.filter(x=>x!==gn):[...c,gn]}
  })
  const toggleHC = (mid,ch) => setHcLocal(p=>{const c=p[mid]||[];return{...p,[mid]:c.includes(ch)?c.filter(x=>x!==ch):[...c,ch]}})

  const go = async () => {
    setSaving(true)
    try {
      // Save goals for each member
      for (const m of members) {
        await api.updateMember(family._id, m.memberId, { wellnessGoals: local[m.memberId] || [] })
      }
      // Build updated members list for recommendation
      const upd = members.map(m => ({ ...m, wellnessGoals: local[m.memberId] || [] }))
      const withGoals = upd.filter(m => m.wellnessGoals.length)
      if (withGoals.length === 0) {
        showToast('Please select at least one goal', 'error')
        return
      }
      // Get recommendations
      const res = await api.recommend({ members: withGoals })
      // Update AuthContext so Home and other pages see fresh goals
      try {
        const fresh = await api.getFamily(family._id)
        updateFamily(fresh.family)
      } catch {}
      nav('/recommend', { state: { result: res.recommendation } })
    } catch(e) {
      showToast(e.message || 'Failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const cur   = members[active]
  const curG  = cur?(local[cur.memberId]||[]):[]
  const curHC = cur?(hcLocal[cur.memberId]||[]):[]
  const goalsList = apiGoals.length ? apiGoals.map(g=>{const m=GOALS_META.find(x=>x.name===(g.goalName||g.name));return{name:g.goalName||g.name,emoji:m?.emoji||'🌿',desc:g.description||m?.desc||''}}) : GOALS_META

  return (
    <div className="page fade-in">
      {/* ── Header row ── */}
      <div style={{ background:'var(--cream)',padding:'14px 18px 0',flexShrink:0 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <button onClick={()=>nav('/home')} style={{ width:34,height:34,borderRadius:'50%',background:'var(--white)',border:'1.5px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15 }}>←</button>
            <img src={logo} alt="KP" style={{ width:28,height:28,objectFit:'contain',borderRadius:8 }} />
            <span style={{ fontFamily:'var(--font-serif)',fontSize:14,fontWeight:700,color:'var(--green-dark)' }}>KRISHA PURE</span>
          </div>
          {/* Member switcher */}
          {cur&&(
            <div style={{ display:'flex',alignItems:'center',gap:7,background:'var(--white)',border:'1.5px solid var(--border)',borderRadius:10,padding:'5px 10px',cursor:'pointer' }}
              onClick={()=>setActive(p=>(p+1)%members.length)}>
              <span style={{ fontSize:14 }}>👥</span>
              <div>
                <div style={{ fontSize:11,fontWeight:700 }}>Member: {cur.name.split(' ')[0]}{active===0?' (You)':''}</div>
                <div style={{ fontSize:10,color:'var(--text-light)' }}>{cur.gender||'–'} · {cur.age||'–'} yrs</div>
              </div>
              <span style={{ fontSize:10,color:'var(--text-light)' }}>▾</span>
            </div>
          )}
        </div>

        {/* Title row */}
        <div style={{ padding:'8px 0 4px',display:'flex',alignItems:'flex-start',justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:10,fontWeight:700,letterSpacing:0.8,textTransform:'uppercase',color:'var(--green)',marginBottom:2 }}>STEP 3 OF 4</div>
            <div style={{ fontFamily:'var(--font-serif)',fontSize:22,fontWeight:700 }}>Wellness Goals</div>
            {cur&&<div style={{ fontSize:13,color:'var(--text-light)',marginTop:2 }}>Choose <strong>up to 3</strong> wellness goals for <strong>{cur.name.split(' ')[0]}</strong></div>}
          </div>
          <div style={{ background:'var(--green)',color:'#fff',borderRadius:20,padding:'5px 13px',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:4,marginTop:18,flexShrink:0 }}>
            ✓ {curG.length} selected
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="stepper">
        {[['Personal &\nDelivery',true],['Family\nMembers',true],['Wellness\nGoals',false,true],['Review',false]].map(([lbl,done,act],i)=>(
          <div key={i} className={`s-item${done?' done':''}${act?' active':''}`}>
            <div className="s-dot">{done?'✓':i+1}</div>
            <div className="s-lbl" style={{ whiteSpace:'pre-line' }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* ── Scrollable ── */}
      <div className="scroll" style={{ padding:'14px 16px 100px' }}>

        {/* Goal 3-column grid */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:14 }}>
          {goalsList.map(g=>{
            const on=curG.includes(g.name)
            return (
              <div key={g.name} className={`goal-card${on?' on':''}`} onClick={()=>cur&&toggle(cur.memberId,g.name)}>
                <div className="gc-radio">{on&&<span className="gc-check">✓</span>}</div>
                <div style={{ fontSize:28,marginBottom:6,marginTop:2 }}>{g.emoji}</div>
                <div style={{ fontSize:12,fontWeight:700,lineHeight:1.3,marginBottom:3 }}>{g.name}</div>
                <div style={{ fontSize:10,color:'var(--text-light)',lineHeight:1.4 }}>{g.desc}</div>
              </div>
            )
          })}
        </div>

        {/* Health Challenges */}
        <div className="card" style={{ marginBottom:12 }}>
          <div style={{ display:'flex',alignItems:'flex-start',gap:10,marginBottom:8 }}>
            <span style={{ fontSize:18 }}>💗</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14,fontWeight:700,display:'inline' }}>Current Health Challenges</div>
              <span style={{ fontSize:11,color:'var(--text-light)',marginLeft:6 }}>(Optional)</span>
              <div style={{ fontSize:12,color:'var(--text-light)',marginTop:3 }}>Select any health challenges applicable to {cur?.name?.split(' ')[0]||'this member'}.</div>
            </div>
          </div>
          {/* Search */}
          <div className="input-row" style={{ marginBottom:10 }}>
            <span className="input-ico">🔍</span>
            <input className="inp" placeholder="Search health challenges" value={hcQ} onChange={e=>setHcQ(e.target.value)} />
          </div>
          {/* Selected chips */}
          <div style={{ display:'flex',flexWrap:'wrap',gap:7 }}>
            {curHC.map(ch=>(
              <button key={ch} onClick={()=>cur&&toggleHC(cur.memberId,ch)}
                style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--green)',background:'var(--green-pale)',color:'var(--green)',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                {ch} <span>×</span>
              </button>
            ))}
            {HC_LIST.filter(c=>c.toLowerCase().includes(hcQ.toLowerCase())&&!curHC.includes(c)).map(ch=>(
              <button key={ch} onClick={()=>cur&&toggleHC(cur.memberId,ch)}
                style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--border)',background:'var(--white)',color:'var(--text-mid)',fontSize:12,fontWeight:500,cursor:'pointer' }}>
                + {ch}
              </button>
            ))}
            {!hcQ&&<button style={{ padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--border)',background:'var(--white)',color:'var(--text-mid)',fontSize:12,cursor:'pointer' }}>+ Add more</button>}
          </div>
        </div>

        {/* Security */}
        <div style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 12px',background:'var(--green-light)',borderRadius:10,marginBottom:14,border:'1px solid #C8E6C9' }}>
          <span style={{ fontSize:14 }}>🛡️</span>
          <span style={{ fontSize:12,color:'var(--text-mid)' }}>Your information is secure and used only to personalize your wellness plan.</span>
        </div>

        {/* Member tabs */}
        {members.length>1&&(
          <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginBottom:10 }}>
            {members.map((m,i)=>(
              <button key={i} onClick={()=>setActive(i)}
                style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:20,border:`1.5px solid ${active===i?'var(--green)':'var(--border)'}`,background:active===i?'var(--green)':'var(--white)',color:active===i?'#fff':'var(--text-mid)',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                {(local[m.memberId]||[]).length>0?'✅ ':''}{m.name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fixed CTA */}
      <div style={{ position:'fixed',bottom:72,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:430,background:'var(--white)',borderTop:'1px solid var(--border)',padding:'12px 18px',zIndex:99 }}>
        <button className="btn btn-primary" onClick={go} disabled={saving}>
          {saving?<span className="spin"/>:'Save & Continue  →'}
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
