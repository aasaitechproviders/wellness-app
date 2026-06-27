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
  { name:'Other Goal',         emoji:'🌿', desc:'Something else in mind?' },
]

const HC_FALLBACK = ['Blood Sugar','Blood Pressure','Thyroid','PCOS','Cholesterol','Anaemia','Arthritis','Kidney Issues','Digestive Issues','Liver Issues']

const ACOLORS = ['#2D6A35','#1565C0','#AD1457','#E65100','#6A1B9A','#00695C']
const acolor  = i => ACOLORS[i % ACOLORS.length]
const initials= (n='') => n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()

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
    if(family?._id) {
      api.getFamily(family._id).then(d=>{
        const m = d.family?.members || []
        setMembers(m)
        const initGoals = {}, initHC = {}
        m.forEach(x => {
          initGoals[x.memberId] = (x.wellnessGoals    || []).slice(0,3)
          initHC[x.memberId]    = (x.healthChallenges || [])
        })
        setLocal(initGoals)
        setHcLocal(initHC)
      }).catch(()=>{})
    }
  },[family?._id])

  const toggle = (mid,gn) => setLocal(p=>{
    const c=p[mid]||[]
    if(!c.includes(gn)&&c.length>=3){showToast('Maximum 3 goals per member','error');return p}
    return {...p,[mid]:c.includes(gn)?c.filter(x=>x!==gn):[...c,gn]}
  })

  const toggleHC = (mid,ch) => setHcLocal(p=>{
    const c=p[mid]||[]
    return {...p,[mid]:c.includes(ch)?c.filter(x=>x!==ch):[...c,ch]}
  })

  const go = async () => {
    setSaving(true)
    try {
      for (const m of members) {
        await api.updateMember(family._id, m.memberId, {
          wellnessGoals:    local[m.memberId]  || [],
          healthChallenges: hcLocal[m.memberId]|| [],
        })
      }
      const upd = members.map(m => ({
        ...m,
        wellnessGoals:    local[m.memberId]  || [],
        healthChallenges: hcLocal[m.memberId]|| [],
      }))
      const withGoals = upd.filter(m => m.wellnessGoals.length)
      if (withGoals.length === 0) { showToast('Please select at least one goal','error'); return }
      const res = await api.recommend({ members: withGoals })
      try { const fresh = await api.getFamily(family._id); updateFamily(fresh.family) } catch {}
      nav('/recommend', { state: { result: res.recommendation } })
    } catch(e) {
      showToast(e.message || 'Failed','error')
    } finally { setSaving(false) }
  }

  const cur   = members[active]
  const curG  = cur ? (local[cur.memberId]  || []) : []
  const curHC = cur ? (hcLocal[cur.memberId]|| []) : []

  const goalsList = apiGoals.length
    ? apiGoals.map(g => {
        const name = g.goalName || g.name
        const meta = GOALS_META.find(x => x.name === name)
        return { name, emoji: meta?.emoji || '🌿', desc: g.description || meta?.desc || '' }
      })
    : GOALS_META

  const hcList = apiHC.length ? apiHC : HC_FALLBACK

  return (
    <div className="page fade-in">

      {/* ── Header ── */}
      <div style={{ background:'var(--cream)',padding:'14px 18px 12px',flexShrink:0 }}>
        <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
          <button onClick={()=>nav('/home')}
            style={{ width:34,height:34,borderRadius:'50%',background:'var(--white)',border:'1.5px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0 }}>←</button>
          <img src={logo} alt="KP" style={{ width:28,height:28,objectFit:'contain',borderRadius:8 }} />
          <span style={{ fontFamily:'var(--font-serif)',fontSize:14,fontWeight:700,color:'var(--green-dark)' }}>KRISHA PURE</span>
          <div style={{ marginLeft:'auto',background:'var(--green)',color:'#fff',borderRadius:20,padding:'5px 13px',fontSize:12,fontWeight:700,flexShrink:0 }}>
            ✓ {curG.length} selected
          </div>
        </div>

        <div style={{ fontSize:10,fontWeight:700,letterSpacing:0.8,textTransform:'uppercase',color:'var(--green)',marginBottom:2 }}>WELLNESS GOALS</div>
        <div style={{ fontFamily:'var(--font-serif)',fontSize:22,fontWeight:700,marginBottom:2 }}>Wellness Goals</div>
        {cur && (
          <div style={{ fontSize:13,color:'var(--text-light)' }}>
            Choose <strong>up to 3</strong> goals for <strong>{cur.name.split(' ')[0]}</strong>
          </div>
        )}
      </div>

      {/* ── Member selector — horizontal buttons at top of body ── */}
      {members.length > 1 && (
        <div style={{ background:'var(--white)',borderBottom:'1px solid var(--border)',padding:'10px 16px',flexShrink:0,overflowX:'auto' }}>
          <div style={{ display:'flex',gap:8,width:'max-content' }}>
            {members.map((m,i) => {
              const goalsCount = (local[m.memberId]||[]).length
              const isActive   = active === i
              return (
                <button key={i} onClick={()=>{ setActive(i); setHcQ('') }}
                  style={{
                    display:'flex',alignItems:'center',gap:8,
                    padding:'8px 14px',borderRadius:24,flexShrink:0,
                    border:`2px solid ${isActive?'var(--green)':'var(--border)'}`,
                    background:isActive?'var(--green)':'var(--white)',
                    color:isActive?'#fff':'var(--text-mid)',
                    cursor:'pointer',transition:'all 0.15s',
                  }}>
                  {/* Avatar circle */}
                  <div style={{
                    width:26,height:26,borderRadius:'50%',
                    background:isActive?'rgba(255,255,255,0.25)':acolor(i),
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:10,fontWeight:700,color:'#fff',flexShrink:0,
                  }}>
                    {initials(m.name)}
                  </div>
                  <div style={{ textAlign:'left' }}>
                    <div style={{ fontSize:12,fontWeight:700,lineHeight:1.2 }}>
                      {m.name.split(' ')[0]}{i===0?' (You)':''}
                    </div>
                    <div style={{ fontSize:10,opacity:0.8,lineHeight:1.2 }}>
                      {goalsCount > 0 ? `✅ ${goalsCount} goal${goalsCount>1?'s':''}` : 'No goals yet'}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Scrollable ── */}
      <div className="scroll" style={{ padding:'14px 16px 140px' }}>

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
              <div style={{ fontSize:12,color:'var(--text-light)',marginTop:3 }}>
                Select any applicable to {cur?.name?.split(' ')[0]||'this member'}.
              </div>
            </div>
          </div>
          <div className="input-row" style={{ marginBottom:10 }}>
            <span className="input-ico">🔍</span>
            <input className="inp" placeholder="Search health challenges" value={hcQ} onChange={e=>setHcQ(e.target.value)} />
          </div>
          <div style={{ display:'flex',flexWrap:'wrap',gap:7 }}>
            {curHC.map(ch=>(
              <button key={ch} onClick={()=>cur&&toggleHC(cur.memberId,ch)}
                style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--green)',background:'var(--green-pale)',color:'var(--green)',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                {ch} <span style={{fontWeight:700}}>×</span>
              </button>
            ))}
            {hcQ.trim() && hcList
              .filter(c => { const n=typeof c==='string'?c:c.name||''; return n.toLowerCase().includes(hcQ.toLowerCase())&&!curHC.includes(n) })
              .map(c => { const n=typeof c==='string'?c:c.name||''; return (
                <button key={n} onClick={()=>cur&&toggleHC(cur.memberId,n)}
                  style={{ display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:20,border:'1.5px solid var(--border)',background:'var(--white)',color:'var(--text-mid)',fontSize:12,fontWeight:500,cursor:'pointer' }}>
                  + {n}
                </button>
              )})
            }
            {!hcQ.trim() && curHC.length===0 && (
              <div style={{fontSize:12,color:'var(--text-light)',padding:'2px 0'}}>Type above to search and add health challenges</div>
            )}
          </div>
        </div>

        {/* Security note */}
        <div style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 12px',background:'var(--green-light)',borderRadius:10,marginBottom:14,border:'1px solid #C8E6C9' }}>
          <span style={{ fontSize:14 }}>🛡️</span>
          <span style={{ fontSize:12,color:'var(--text-mid)' }}>Your information is secure and used only to personalize your wellness plan.</span>
        </div>
      </div>

      {/* Fixed CTA */}
      <div style={{ position:'fixed',bottom:72,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:430,background:'var(--white)',borderTop:'1px solid var(--border)',padding:'12px 18px',zIndex:99 }}>
        <button className="btn btn-primary" onClick={go} disabled={saving}>
          {saving?<span className="spin"/>:'Save & Get Recommendations  →'}
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
