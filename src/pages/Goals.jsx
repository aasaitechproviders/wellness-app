import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { showToast } from '../components/Toast'
import BottomNav from '../components/BottomNav'

const GM = {
  'Immunity Support':  {icon:'🛡️'},
  'Iron Support':      {icon:'💪'},
  'Protein Support':   {icon:'⚡'},
  'Weight Management': {icon:'⚖️'},
  'Diabetes Control':  {icon:'💧'},
  'Heart Wellness':    {icon:'❤️'},
  'Digestive Wellness':{icon:'🌀'},
  'Detox':             {icon:'✨'},
  'Kids Nutrition':    {icon:'😊'},
  'Senior Wellness':   {icon:'👴'},
}

export default function Goals() {
  const { family } = useAuth()
  const nav = useNavigate()
  const [goals, setGoals] = useState([])
  const [members, setMembers] = useState([])
  const [local, setLocal] = useState({})
  const [active, setActive] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(()=>{
    api.getGoals().then(d=>setGoals(d.goals||[]))
    if(family?._id) api.getFamily(family._id).then(d=>{
      const m=d.family?.members||[]
      setMembers(m)
      const init={}; m.forEach(x=>{ init[x.memberId]=x.wellnessGoals||[] })
      setLocal(init)
    })
  },[family])

  const toggle = (mid, gid) => setLocal(p=>{
    const c=p[mid]||[]
    return {...p,[mid]: c.includes(gid)?c.filter(x=>x!==gid):[...c,gid]}
  })

  const go = async () => {
    setSaving(true)
    try {
      for(const m of members)
        await api.updateMember(family._id, m.memberId, { wellnessGoals: local[m.memberId]||[] })
      const updated = members.map(m=>({...m, wellnessGoals: local[m.memberId]||[]}))
      const result  = await api.recommend({ members: updated.filter(m=>m.wellnessGoals.length) })
      nav('/recommend', { state:{ result: result.recommendation } })
    } catch(e) { showToast(e.message||'Failed','error')
    } finally  { setSaving(false) }
  }

  const cur = members[active]
  const curG = cur ? (local[cur.memberId]||[]) : []
  const total = Object.values(local).flat().length

  return (
    <div className="page fade-in">
      {/* Top bar */}
      <div className="top-bar">
        <button className="back-btn" onClick={()=>nav('/home')}>←</button>
        <div className="top-bar-title">Select Wellness Goals</div>
      </div>

      <div style={{padding:'12px 18px 8px'}}>
        <p style={{fontSize:13,color:'var(--text-light)'}}>You can select multiple goals</p>
      </div>

      {/* Member tabs */}
      {members.length>0&&(
        <div style={{padding:'0 18px 12px'}}>
          <div className="hscroll">
            {members.map((m,i)=>{
              const cnt = local[m.memberId]?.length||0
              const sel = i===active
              return(
                <button key={m.memberId} onClick={()=>setActive(i)} style={{
                  flexShrink:0, display:'flex', alignItems:'center', gap:6,
                  padding:'7px 14px', borderRadius:50,
                  border:`1.5px solid ${sel?'var(--green)':'var(--border)'}`,
                  background:sel?'var(--green)':'#fff',
                  color:sel?'#fff':'var(--text)',
                  fontFamily:'DM Sans,sans-serif', fontSize:13, fontWeight:600,
                  cursor:'pointer', whiteSpace:'nowrap',
                }}>
                  {m.gender==='Male'?'👨':m.gender==='Child'?'👶':'👩'} {m.name}
                  {cnt>0&&<span style={{background:sel?'rgba(255,255,255,0.25)':'var(--green)',color:'#fff',borderRadius:50,padding:'0 5px',fontSize:10}}>{cnt}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 2-col goal grid */}
      <div style={{padding:'0 18px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, paddingBottom:110}}>
        {goals.map(g=>{
          const meta = GM[g.goalName]||{icon:'🌿'}
          const sel  = curG.includes(g.goalId)
          return(
            <div key={g.goalId} className={`goal-tile${sel?' sel':''}`}
              onClick={()=>cur&&toggle(cur.memberId, g.goalId)}>
              <div className="tick">{sel?'✓':''}</div>
              <div className="g-icon">{meta.icon}</div>
              <div className="g-label">{g.goalName}</div>
            </div>
          )
        })}
      </div>

      {/* Fixed CTA */}
      {members.length>0&&(
        <div style={{position:'fixed',bottom:64,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:430,padding:'12px 18px',background:'#fff',borderTop:'1px solid var(--border)',zIndex:40}}>
          <button className="btn btn-primary" onClick={go} disabled={saving||total===0}>
            {saving&&<span className="spinner" style={{width:18,height:18,borderWidth:2}}/>}
            {saving?'Getting your basket...':'Next →'}
          </button>
        </div>
      )}
      <BottomNav/>
    </div>
  )
}
