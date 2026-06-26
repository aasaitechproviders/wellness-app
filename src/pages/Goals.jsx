import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { showToast } from '../components/Toast'
import BottomNav from '../components/BottomNav'
import logo from '../assets/logo.png'

const GM = {
  'Immunity Support':   { icon:'🛡️', color:'#E8F5E9', desc:'Strengthen immunity naturally' },
  'Protein Support':    { icon:'💪', color:'#FFF9C4', desc:'Build & repair muscles' },
  'Iron Support':       { icon:'💧', color:'#FFEBEE', desc:'Improve hemoglobin levels' },
  'Weight Management':  { icon:'⚖️', color:'#F3E5F5', desc:'Healthy weight control' },
  'Diabetes Friendly':  { icon:'🩺', color:'#E1F5FE', desc:'Balanced sugar management' },
  'Heart Wellness':     { icon:'❤️', color:'#FCE4EC', desc:'Support heart health' },
  'Digestive Wellness': { icon:'🌀', color:'#E8F5E9', desc:'Better digestion & gut health' },
  'Bone Health':        { icon:'🦴', color:'#F3E5F5', desc:'Stronger bones & joints' },
  "Women's Wellness":   { icon:'🌸', color:'#FCE4EC', desc:'Hormonal & overall well-being' },
  'Kids Nutrition':     { icon:'😊', color:'#FFF8E1', desc:'Support growth & development' },
  'Senior Wellness':    { icon:'👴', color:'#EFEBE9', desc:'Healthy ageing & vitality' },
  'Other Goal':         { icon:'···', color:'#F5F5F5', desc:'Something else in mind?' },
}

const AVATAR_COLORS = ['#2D6A35','#1565C0','#AD1457','#E65100','#6A1B9A']
const initials = (n='') => n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
const avatarColor = (i) => AVATAR_COLORS[i%AVATAR_COLORS.length]

const STEP_LABELS = ['Personal &\nDelivery','Family\nMembers','Wellness\nGoals','Review']

export default function Goals() {
  const { family } = useAuth()
  const nav = useNavigate()
  const [goals,   setGoals]   = useState([])
  const [members, setMembers] = useState([])
  const [local,   setLocal]   = useState({})
  const [hc,      setHC]      = useState({})
  const [hcSearch,setHCS]     = useState('')
  const [active,  setActive]  = useState(0)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    api.getGoals().then(d=>setGoals(d.goals||[])).catch(()=>{})
    if (family?._id) {
      api.getFamily(family._id).then(d=>{
        const m = d.family?.members||[]
        setMembers(m)
        const init={}
        m.forEach(x=>{ init[x.memberId]=(x.wellnessGoals||[]).slice(0,3) })
        setLocal(init)
      })
    }
  },[family])

  const toggle = (mid, gName) => {
    setLocal(p=>{
      const c=p[mid]||[]
      if(!c.includes(gName)&&c.length>=3){ showToast('Maximum 3 goals per member','error'); return p }
      return {...p,[mid]:c.includes(gName)?c.filter(x=>x!==gName):[...c,gName]}
    })
  }

  const go = async () => {
    setSaving(true)
    try {
      for(const m of members)
        await api.updateMember(family._id, m.memberId, { wellnessGoals:local[m.memberId]||[] })
      const updated = members.map(m=>({...m,wellnessGoals:local[m.memberId]||[]}))
      const res = await api.recommend({ members:updated.filter(m=>m.wellnessGoals.length) })
      nav('/recommend',{state:{result:res.recommendation}})
    } catch(e){ showToast(e.message||'Failed','error') } finally { setSaving(false) }
  }

  const cur = members[active]
  const curG = cur ? (local[cur.memberId]||[]) : []
  const goalKeys = goals.length ? goals.map(g=>g.goalName||g.name) : Object.keys(GM)

  return (
    <div className="page-shell fade-in">
      {/* ── Header ── */}
      <div style={{ background:'var(--cream)',padding:'16px 18px 0',flexShrink:0 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <button className="back-btn" onClick={()=>nav('/home')}>←</button>
            <img src={logo} alt="KP" style={{ width:30,height:30,objectFit:'contain',borderRadius:8 }} />
            <div style={{ fontFamily:'var(--font-head)',fontSize:14,fontWeight:700,color:'var(--green-dark)' }}>KRISHA PURE</div>
          </div>
          {/* Active member chip */}
          {cur && (
            <div style={{ display:'flex',alignItems:'center',gap:8,background:'var(--white)',border:'1.5px solid var(--border)',borderRadius:12,padding:'6px 10px',cursor:'pointer' }}
              onClick={()=>setActive(p=>(p+1)%members.length)}>
              <span style={{ fontSize:16 }}>👥</span>
              <div>
                <div style={{ fontSize:12,fontWeight:700 }}>Member: {cur.name.split(' ')[0]} {active===0?'(You)':''}</div>
                <div style={{ fontSize:10,color:'var(--text-light)' }}>{cur.gender||'–'} · {cur.age||'–'} yrs</div>
              </div>
              <span style={{ fontSize:12,color:'var(--text-light)' }}>▾</span>
            </div>
          )}
        </div>

        {/* Step label */}
        <div style={{ fontSize:10,fontWeight:700,letterSpacing:0.8,textTransform:'uppercase',color:'var(--green)',marginBottom:2 }}>STEP 3 OF 4</div>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <div style={{ fontFamily:'var(--font-head)',fontSize:22,fontWeight:700 }}>Wellness Goals</div>
          <div style={{ background:'var(--green)',color:'#fff',borderRadius:20,padding:'4px 12px',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:4 }}>
            ✓ {curG.length} selected
          </div>
        </div>
        {cur && <div style={{ fontSize:13,color:'var(--text-light)',marginTop:2,marginBottom:10 }}>Choose <strong>up to 3</strong> wellness goals for <strong>{cur.name.split(' ')[0]}</strong></div>}
      </div>

      {/* Stepper */}
      <div className="stepper">
        {STEP_LABELS.map((s,i)=>{
          const done=i<2, active=i===2
          return (
            <div key={i} className={`step-item${done?' done':''}${active?' active':''}`}>
              <div className="step-circle">{done?'✓':i+1}</div>
              <div className="step-label" style={{ whiteSpace:'pre-line' }}>{s}</div>
            </div>
          )
        })}
      </div>

      {/* ── Scrollable ── */}
      <div className="page-shell-scroll with-nav" style={{ padding:'14px 18px' }}>
        {/* Goal 3×N grid */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:16 }}>
          {goalKeys.map((name)=>{
            const meta = GM[name]||{ icon:'🌿',color:'#E8F5E9',desc:'' }
            const sel = curG.includes(name)
            return (
              <div key={name} className={`goal-card${sel?' sel':''}`} onClick={()=>cur&&toggle(cur.memberId,name)}>
                <div className="gc-check">{sel?'✓':''}</div>
                <div style={{ fontSize:30,marginBottom:6 }}>{meta.icon}</div>
                <div style={{ fontSize:12,fontWeight:700,lineHeight:1.3,marginBottom:3 }}>{name}</div>
                <div style={{ fontSize:10,color:'var(--text-light)',lineHeight:1.4 }}>{meta.desc}</div>
              </div>
            )
          })}
        </div>

        {/* Health Challenges */}
        <div className="card" style={{ marginBottom:14 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
            <span style={{ fontSize:18 }}>💗</span>
            <span style={{ fontSize:14,fontWeight:700 }}>Current Health Challenges</span>
            <span style={{ fontSize:11,color:'var(--text-light)' }}>(Optional)</span>
          </div>
          <div style={{ fontSize:12,color:'var(--text-light)',marginBottom:10 }}>Select any health challenges applicable to {cur?.name?.split(' ')[0]||'you'}.</div>
          <div style={{ position:'relative',marginBottom:10 }}>
            <span style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:14,color:'var(--text-light)' }}>🔍</span>
            <input className="kp-input" style={{ paddingLeft:32 }} placeholder="Search health challenges" value={hcSearch} onChange={e=>setHCS(e.target.value)} />
          </div>
          <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
            {['Blood Sugar','Blood Pressure','Thyroid','PCOS','Cholesterol','Anaemia','Arthritis'].filter(x=>x.toLowerCase().includes(hcSearch.toLowerCase())).map(ch=>{
              const mid=cur?.memberId
              const active=(hc[mid]||[]).includes(ch)
              return (
                <button key={ch} onClick={()=>mid&&setHC(p=>({...p,[mid]:active?(p[mid]||[]).filter(x=>x!==ch):[...(p[mid]||[]),ch]}))}
                  style={{ padding:'5px 12px',borderRadius:20,border:`1.5px solid ${active?'var(--green)':'var(--border)'}`,background:active?'var(--green-pale)':'var(--white)',color:active?'var(--green)':'var(--text-mid)',fontSize:12,fontWeight:600,cursor:'pointer' }}>
                  {active?`× ${ch}`:`+ ${ch}`}
                </button>
              )
            })}
          </div>
        </div>

        {/* Security */}
        <div style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 12px',background:'var(--green-light)',borderRadius:10,marginBottom:14 }}>
          <span style={{ fontSize:14 }}>🛡️</span>
          <span style={{ fontSize:12,color:'var(--text-mid)' }}>Your information is secure and used only to personalize your wellness plan.</span>
        </div>

        {/* Member tabs */}
        {members.length>1 && (
          <div className="card" style={{ padding:'12px',marginBottom:14 }}>
            <div style={{ fontSize:12,fontWeight:600,color:'var(--text-light)',marginBottom:8 }}>Set goals for all members:</div>
            <div className="chip-row">
              {members.map((m,i)=>(
                <button key={i} onClick={()=>setActive(i)}
                  style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:20,border:`1.5px solid ${active===i?'var(--green)':'var(--border)'}`,background:active===i?'var(--green)':'var(--white)',color:active===i?'#fff':'var(--text-mid)',fontSize:12,fontWeight:600,flexShrink:0,cursor:'pointer' }}>
                  {(local[m.memberId]||[]).length>0?'✅ ':''}{m.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ position:'fixed',bottom:72,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:430,background:'var(--white)',borderTop:'1px solid var(--border)',padding:'12px 18px',zIndex:99 }}>
        <button className="btn btn-primary" onClick={go} disabled={saving}>
          {saving?<span className="spinner" style={{ width:20,height:20,borderWidth:2 }} />:'Save & Continue →'}
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
