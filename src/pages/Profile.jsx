import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import { showToast } from '../components/Toast'
import BottomNav from '../components/BottomNav'

const GOAL_ICONS = {
  'Immunity Support':'🛡️','Iron Support':'💪','Protein Support':'⚡',
  'Weight Management':'⚖️','Diabetes Control':'💧','Heart Wellness':'❤️',
  'Digestive Wellness':'🌀','Detox':'✨','Kids Nutrition':'😊','Senior Wellness':'👴',
}

export default function Profile() {
  const { family, updateFamily, logout } = useAuth()
  const nav = useNavigate()
  const [fullFamily, setFullFamily] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!family?._id) return
    api.getFamily(family._id).then(d => setFullFamily(d.family)).finally(() => setLoading(false))
  }, [family])

  const handleLogout = () => {
    if (window.confirm('Log out?')) { logout(); nav('/login', { replace:true }) }
  }

  const f = fullFamily || family

  return (
    <div className="page fade-in">
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#1E4D26 0%,#2D6A35 100%)', padding:'24px 20px 28px', textAlign:'center' }}>
        <div style={{ width:68, height:68, background:'rgba(255,255,255,0.15)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, margin:'0 auto 10px' }}>👨‍👩‍👧</div>
        <div style={{ color:'#fff', fontFamily:'Playfair Display,serif', fontSize:19, fontWeight:600 }}>{f?.familyName || 'Your Family'}</div>
        <div style={{ color:'rgba(255,255,255,0.7)', fontSize:13, marginTop:3 }}>+91 {f?.phone}</div>
        {f?.city && <div style={{ color:'rgba(255,255,255,0.6)', fontSize:12, marginTop:2 }}>📍 {f.city}</div>}
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <div style={{ padding:'16px 20px' }}>

          {/* Address */}
          <div className="card" style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontWeight:600, fontSize:14 }}>Your Profile</div>
              <button onClick={() => nav('/setup')} style={{ background:'none', border:'none', color:'var(--green)', fontSize:13, fontWeight:600, cursor:'pointer' }}>Edit</button>
            </div>
            {f?.apartmentName && <InfoRow icon="🏠" label="Apartment" value={`${f.apartmentName}, Flat ${f.flatNo}${f.towerNo ? `, ${f.towerNo}` : ''}`} />}
            {f?.address       && <InfoRow icon="📍" label="Address"   value={`${f.address}, ${f.city}`} />}
            {f?.dietPreference && <InfoRow icon="🥗" label="Diet"     value={f.dietPreference} />}
          </div>

          {/* Family members */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:600 }}>Family Members</div>
            <div style={{ fontSize:13, color:'var(--text-light)' }}>{f?.members?.length || 0} members</div>
          </div>

          {(f?.members || []).length === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:'24px', marginBottom:14 }}>
              <div style={{ fontSize:36, marginBottom:8 }}>👤</div>
              <p style={{ marginBottom:12 }}>No members added yet</p>
              <button className="btn btn-secondary btn-sm" onClick={() => nav('/setup')} style={{ width:'auto', padding:'10px 20px' }}>Add Members</button>
            </div>
          ) : (
            (f?.members || []).map(m => (
              <div key={m.memberId} className="member-card" style={{ marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom: m.wellnessGoals?.length ? 10 : 0 }}>
                  <div className="member-avatar">{m.gender==='Male'?'👨':m.gender==='Child'?'👶':'👩'}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:15 }}>{m.name}</div>
                    <div style={{ fontSize:12, color:'var(--text-light)', marginTop:2 }}>
                      {[m.age ? `${m.age} yrs` : null, m.gender].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
                {m.wellnessGoals?.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {m.wellnessGoals.map(g => (
                      <span key={g} style={{ background:'var(--green-pale)', color:'var(--green)', padding:'3px 10px', borderRadius:50, fontSize:11, fontWeight:500 }}>
                        {GOAL_ICONS[g] || '🌿'} {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Quick actions */}
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:4 }}>
            {[
              { icon:'🎯', label:'Manage Wellness Goals', action:() => nav('/goals') },
              { icon:'📦', label:'My Orders',             action:() => nav('/orders') },
              { icon:'🧺', label:'Browse Baskets',        action:() => nav('/goals') },
            ].map(item => (
              <div key={item.label} onClick={item.action} style={{ background:'var(--white)', borderRadius:'var(--radius-sm)', padding:'13px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer', border:'1px solid var(--border)' }}>
                <span style={{ fontSize:20 }}>{item.icon}</span>
                <span style={{ fontWeight:500, fontSize:14, flex:1 }}>{item.label}</span>
                <span style={{ color:'var(--text-light)', fontSize:20 }}>›</span>
              </div>
            ))}
          </div>

          <button className="btn btn-ghost" onClick={handleLogout} style={{ marginTop:16, borderColor:'#DC2626', color:'#DC2626' }}>
            Log Out
          </button>
        </div>
      )}
      <BottomNav />
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display:'flex', gap:10, marginBottom:10 }}>
      <span style={{ fontSize:16 }}>{icon}</span>
      <div>
        <div style={{ fontSize:11, color:'var(--text-light)', fontWeight:600 }}>{label.toUpperCase()}</div>
        <div style={{ fontSize:13, color:'var(--text)', marginTop:1 }}>{value}</div>
      </div>
    </div>
  )
}
